// Cliente consultacrm — busca dados de um médico pelo número do CRM, para
// autopreencher o cadastro de médicos (nome em Title Case, UF, especialidade).
//
// Endpoint (informado pelo fornecedor):
//   https://www.consultacrm.com.br/api/index.php?tipo=crm&uf=<UF>&q=<CRM>&chave=<CHAVE>&destino=json
//
// A chave fica em CONSULTACRM_API_KEY (NÃO commitar). Sem a chave a função
// retorna ok:false com mensagem amigável — o cadastro manual continua valendo.
// O formato exato do JSON da consultacrm pode variar; o parse abaixo é
// defensivo (tenta vários formatos) e deve ser ajustado quando a chave existir.

const TIMEOUT_MS = 10_000
const BASE = "https://www.consultacrm.com.br/api/index.php"

export type MedicoConsultaCrm = {
  nome: string
  crm: string | null
  uf: string | null
  especialidade: string | null
  situacao: string | null
}

export type ConsultaCrmResultado =
  | { ok: true; data: MedicoConsultaCrm }
  | { ok: false; erro: string; naoConfigurado?: boolean }

/** Conectores que ficam em minúsculo no Title Case de nomes em PT-BR. */
const CONECTORES = new Set(["de", "da", "do", "das", "dos", "e", "di", "du"])

/** Converte "FULANO DE TAL" → "Fulano de Tal". */
export function toTitleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) =>
      i > 0 && CONECTORES.has(palavra)
        ? palavra
        : palavra.charAt(0).toUpperCase() + palavra.slice(1),
    )
    .join(" ")
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "")
}

async function fetchComTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "SST-Manager/0.7 (+cadastro-medico)" },
      cache: "no-store",
    })
  } finally {
    clearTimeout(timer)
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Extrai o primeiro registro de médico de formatos variados de resposta. */
function extrairRegistro(j: any): any | null {
  if (!j) return null
  if (Array.isArray(j)) return j[0] ?? null
  if (Array.isArray(j.itens)) return j.itens[0] ?? null
  if (Array.isArray(j.item)) return j.item[0] ?? null
  if (Array.isArray(j.dados)) return j.dados[0] ?? null
  if (Array.isArray(j.resultado)) return j.resultado[0] ?? null
  // Objeto único com os campos diretamente
  if (j.nome || j.medico || j.profissional) return j
  return null
}

function primeiraEspecialidade(reg: any): string | null {
  const e = reg.especialidade ?? reg.especialidades
  if (!e) return null
  if (Array.isArray(e)) return e[0] ? String(e[0]).trim() : null
  return String(e).trim() || null
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function consultarCrm(crmRaw: string, uf?: string | null): Promise<ConsultaCrmResultado> {
  const chave = process.env.CONSULTACRM_API_KEY
  if (!chave) {
    return {
      ok: false,
      naoConfigurado: true,
      erro: "Busca por CRM indisponível (CONSULTACRM_API_KEY não configurada). Preencha os dados manualmente.",
    }
  }
  const crm = digitsOnly(crmRaw)
  if (crm.length < 3) return { ok: false, erro: "Informe um CRM válido" }

  const params = new URLSearchParams({
    tipo: "crm",
    uf: (uf ?? "").toUpperCase(),
    q: crm,
    chave,
    destino: "json",
  })

  try {
    const r = await fetchComTimeout(`${BASE}?${params.toString()}`, TIMEOUT_MS)
    if (!r.ok) return { ok: false, erro: `consultacrm retornou ${r.status}` }
    const j = await r.json().catch(() => null)
    const reg = extrairRegistro(j)
    if (!reg) return { ok: false, erro: "CRM não encontrado" }

    const nomeRaw = String(reg.nome ?? reg.medico ?? reg.profissional ?? "").trim()
    if (!nomeRaw) return { ok: false, erro: "CRM não encontrado" }

    return {
      ok: true,
      data: {
        nome: toTitleCase(nomeRaw),
        crm: reg.crm ? String(reg.crm).trim() : crm,
        uf: reg.uf ? String(reg.uf).trim().toUpperCase() : (uf ?? null),
        especialidade: primeiraEspecialidade(reg),
        situacao: reg.situacao ? String(reg.situacao).trim() : null,
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro inesperado"
    if (msg.includes("abort")) return { ok: false, erro: "Tempo esgotado consultando o CRM" }
    console.error("[consultacrm.consultarCrm]", msg)
    return { ok: false, erro: "Falha ao consultar o CRM" }
  }
}
