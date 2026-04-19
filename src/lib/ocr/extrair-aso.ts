// Extrator de campos estruturados a partir do texto OCR de um ASO.
//
// ASOs não têm formato unificado — cada clínica emite diferente.
// A estratégia é usar regex + heurísticas tolerantes:
//  - Busca por padrões conhecidos (CPF, CRM, datas DD/MM/YYYY)
//  - Busca por palavras-chave contextuais (apto/inapto, admissional/periódico)
//  - Ranking por posição: primeira data = realização, segunda = vencimento
//
// Retorna `null` quando não encontra — nunca chuta. A UI mostra
// os campos extraídos com badge "Confirmar" para o usuário validar.

export type AsoExtraido = {
  cpf: string | null
  numero_aso: string | null
  medico_nome: string | null
  crm: string | null
  clinica: string | null
  tipo: "admissional" | "periodico" | "retorno_trabalho" | "mudanca_funcao" | "demissional" | "complementar" | null
  resultado: "apto" | "inapto" | "apto_restricao" | null
  data_realizacao: string | null // YYYY-MM-DD
  data_vencimento: string | null // YYYY-MM-DD
}

/** Normaliza texto OCR: remove caracteres estranhos, múltiplos espaços, preserva acentos. */
function normalize(text: string): string {
  return text
    .replace(/[|]/g, "I") // pipe vira I (frequente em OCR)
    .replace(/[\r\t]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim()
}

/** Converte dd/mm/aaaa → aaaa-mm-dd. Retorna null se inválida. */
function ddmmyyyyToIso(ddmmyyyy: string): string | null {
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = parseInt(dd, 10), mo = parseInt(mm, 10), y = parseInt(yyyy, 10)
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1900 || y > 2100) return null
  return `${yyyy}-${mm}-${dd}`
}

function extrairCpf(text: string): string | null {
  // CPF formatado: 123.456.789-00 OU 12345678900
  const m = text.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/)
  if (!m) return null
  const digits = m[1].replace(/\D/g, "")
  if (digits.length !== 11) return null
  if (/^(\d)\1+$/.test(digits)) return null // 111...
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function extrairCrm(text: string): string | null {
  // Padrões comuns:
  //   "CRM/SP 123456" — estado + número
  //   "CRM-SP 123456"
  //   "CRM SP 123456"
  //   "CRM: 123456/SP"
  //   "CRM 123456"
  const patterns = [
    /CRM\s*[/\-]\s*([A-Z]{2})\s*:?\s*(\d{4,7})/i,
    /CRM\s+([A-Z]{2})\s*:?\s*(\d{4,7})/i,
    /CRM\s*:?\s*(\d{4,7})\s*[/\-]?\s*([A-Z]{2})/i,
    /CRM\s*:?\s*(\d{4,7})/i, // fallback — sem UF
  ]
  for (const pat of patterns) {
    const m = text.match(pat)
    if (m) {
      // Monta como "NNNNNN/UF" ou só "NNNNNN"
      const nums = m.slice(1).find((x) => /^\d{4,7}$/.test(x))
      const uf = m.slice(1).find((x) => /^[A-Z]{2}$/.test(x))
      if (nums) return uf ? `${nums}/${uf}` : nums
    }
  }
  return null
}

function extrairNumeroAso(text: string): string | null {
  // "ASO nº 12345" ou "Número do ASO: 12345" ou "ASO: 12345"
  const m = text.match(/\bASO\s*[nN]?[ºo\.:]?\s*(\d{3,10})/i)
  return m?.[1] ?? null
}

function extrairTipo(text: string): AsoExtraido["tipo"] {
  const lower = text.toLowerCase()
  // Ordem importa — mais específicos primeiro
  if (/retorno\s+ao\s+trabalho/.test(lower)) return "retorno_trabalho"
  if (/mudan[cç]a\s+de\s+fun[cç][aã]o/.test(lower)) return "mudanca_funcao"
  if (/\bdemiss[íi]onal\b/.test(lower)) return "demissional"
  if (/\badmiss[íi]onal\b/.test(lower)) return "admissional"
  if (/\bperi[óo]dico\b/.test(lower)) return "periodico"
  if (/\bcomplementar\b/.test(lower)) return "complementar"
  return null
}

function extrairResultado(text: string): AsoExtraido["resultado"] {
  const lower = text.toLowerCase()
  // "apto com restrição" antes de "apto" para não capturar só "apto"
  if (/\bapto\s+com\s+restri[çc][ãa]o/.test(lower)) return "apto_restricao"
  if (/\binapto\b/.test(lower)) return "inapto"
  if (/\bapto\b/.test(lower)) return "apto"
  return null
}

/** Extrai TODAS as datas no formato DD/MM/AAAA em ordem de aparição. */
function extrairDatas(text: string): string[] {
  const matches = Array.from(text.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g))
  return matches.map((m) => m[1])
}

/** Tenta inferir a clínica pela primeira linha não-vazia que pareça nome próprio longo. */
function extrairClinica(text: string): string | null {
  const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean)
  for (const linha of linhas.slice(0, 8)) {
    // Heurística: linha com 3+ palavras, sem números de CPF/data, com ao menos 1 palavra maiúscula
    if (linha.length < 10 || linha.length > 100) continue
    if (/\d{3}\.\d{3}/.test(linha) || /\d{2}\/\d{2}/.test(linha)) continue
    const palavras = linha.split(/\s+/)
    if (palavras.length < 2) continue
    const temMaiuscula = palavras.some((p) => /^[A-ZÀ-Ú]/.test(p))
    const palavrasChave = /cl[íi]nica|hospital|m[ée]dico|sa[úu]de|ocupacional|ltda|eireli|s\.?a\.?/i.test(linha)
    if (temMaiuscula && palavrasChave) return linha
  }
  return null
}

/** Tenta extrair o nome do médico — heurística: perto do CRM. */
function extrairMedicoNome(text: string, crm: string | null): string | null {
  if (!crm) return null
  // Pega as 3-4 palavras que antecedem "CRM" no texto
  const crmPos = text.search(/CRM/i)
  if (crmPos < 0) return null
  const trecho = text.slice(Math.max(0, crmPos - 80), crmPos).trim()
  // Linha ou frase antes do CRM
  const linhas = trecho.split(/[\n.]/).map((l) => l.trim()).filter(Boolean)
  const ultima = linhas[linhas.length - 1] ?? ""
  // Remove "Dr." / "Dra." prefixo
  const limpo = ultima.replace(/^(Dr|Dra|Doutora?)[\s.]+/i, "").trim()
  if (limpo.length < 5 || limpo.length > 60) return null
  if (!/^[A-ZÀ-Úa-zà-ú\s]+$/.test(limpo)) return null // só letras e espaços
  return limpo
}

/**
 * Pipeline principal: recebe texto OCR e devolve campos estruturados.
 * Cada campo é null se não encontrado (o usuário preenche manualmente).
 */
export function extrairAso(textoOcr: string): AsoExtraido {
  const text = normalize(textoOcr)

  const cpf = extrairCpf(text)
  const crm = extrairCrm(text)
  const datas = extrairDatas(text)

  // Heurística de data: primeira = realização, segunda = vencimento.
  // Se só houver 1 data, é a realização.
  const [dataRealBr, dataVencBr] = datas
  const data_realizacao = dataRealBr ? ddmmyyyyToIso(dataRealBr) : null
  const data_vencimento = dataVencBr ? ddmmyyyyToIso(dataVencBr) : null

  return {
    cpf,
    numero_aso: extrairNumeroAso(text),
    medico_nome: extrairMedicoNome(text, crm),
    crm,
    clinica: extrairClinica(text),
    tipo: extrairTipo(text),
    resultado: extrairResultado(text),
    data_realizacao,
    data_vencimento,
  }
}
