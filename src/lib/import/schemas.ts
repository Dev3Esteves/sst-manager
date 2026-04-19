// Schemas de importação por entidade.
// Cada um define: colunas esperadas, aliases, transformers, validação Zod.

import { z } from "zod"
import { cnpjSchema, cpfSchema } from "@/lib/validations/shared"
import type { ImportSchema } from "./types"

// =============================================================
// EMPRESAS
// =============================================================
export const empresaImportZod = z.object({
  razao_social: z.string().min(3, "Mínimo 3 caracteres"),
  nome_fantasia: z.string().optional(),
  cnpj: cnpjSchema,
  tipo: z.enum(["propria", "contratante", "terceira"]).default("terceira"),
  inscricao_estadual: z.string().optional(),
})

export const empresaImport: ImportSchema<typeof empresaImportZod> = {
  nome: "empresas",
  schema: empresaImportZod,
  templateFilename: "template_empresas.csv",
  colunas: [
    { key: "razao_social", label: "Razão Social", aliases: ["razao", "razaosocial"], exemplo: "SISTENGE Engenharia Ltda", obrigatorio: true },
    { key: "nome_fantasia", label: "Nome Fantasia", aliases: ["fantasia"], exemplo: "SISTENGE" },
    { key: "cnpj", label: "CNPJ", exemplo: "11.222.333/0001-81", obrigatorio: true },
    {
      key: "tipo", label: "Tipo",
      exemplo: "propria",
      aliases: ["tipo_empresa"],
      obrigatorio: true,
      parse: (v) => v?.toLowerCase()?.trim() || "terceira",
    },
    { key: "inscricao_estadual", label: "Inscrição Estadual", aliases: ["ie"], exemplo: "123.456.789.000" },
  ],
}

// =============================================================
// COLABORADORES
// =============================================================
export const colaboradorImportZod = z.object({
  nome_completo: z.string().min(3, "Mínimo 3 caracteres"),
  cpf: cpfSchema,
  rg: z.string().optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD").optional().or(z.literal("")),
  sexo: z.enum(["M", "F", "O"]).optional(),
  telefone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  matricula: z.string().optional(),
  data_admissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  tipo_vinculo: z.enum(["clt", "pj", "temporario", "estagiario", "terceiro"]).default("clt"),
  empresa_cnpj: z.string(), // resolvido server-side → empresa_id
  cargo_titulo: z.string().optional(), // resolvido server-side → cargo_id
})

/** Converte data dd/mm/aaaa ou dd-mm-aaaa → aaaa-mm-dd. Mantém se já no formato ISO. */
function parseData(v: string): string {
  if (!v) return ""
  const trimmed = v.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const m = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return trimmed
}

export const colaboradorImport: ImportSchema<typeof colaboradorImportZod> = {
  nome: "colaboradores",
  schema: colaboradorImportZod,
  templateFilename: "template_colaboradores.csv",
  colunas: [
    { key: "nome_completo", label: "Nome Completo", aliases: ["nome"], exemplo: "João da Silva", obrigatorio: true },
    { key: "cpf", label: "CPF", exemplo: "111.444.777-35", obrigatorio: true },
    { key: "rg", label: "RG", exemplo: "12.345.678-9" },
    { key: "data_nascimento", label: "Data de Nascimento", aliases: ["nascimento", "dt_nascimento"], exemplo: "1985-03-15", parse: parseData },
    { key: "sexo", label: "Sexo (M/F/O)", exemplo: "M", parse: (v) => v?.toUpperCase()?.trim() || undefined },
    { key: "telefone", label: "Telefone", aliases: ["fone", "celular"], exemplo: "(11) 98765-4321" },
    { key: "email", label: "E-mail", aliases: ["e_mail"], exemplo: "joao@sistenge.com.br" },
    { key: "matricula", label: "Matrícula", exemplo: "00123" },
    { key: "data_admissao", label: "Data de Admissão", aliases: ["admissao", "dt_admissao"], exemplo: "2023-01-10", obrigatorio: true, parse: parseData },
    {
      key: "tipo_vinculo", label: "Vínculo (clt/pj/terceiro/temporario/estagiario)",
      aliases: ["vinculo"], exemplo: "clt",
      obrigatorio: true,
      parse: (v) => v?.toLowerCase()?.trim() || "clt",
    },
    { key: "empresa_cnpj", label: "CNPJ da Empresa", aliases: ["cnpj_empresa"], exemplo: "11.222.333/0001-81", obrigatorio: true },
    { key: "cargo_titulo", label: "Cargo (título)", aliases: ["cargo"], exemplo: "Eletricista NR-10" },
  ],
}

// =============================================================
// EPIs
// =============================================================
export const epiImportZod = z.object({
  descricao: z.string().min(3, "Mínimo 3 caracteres"),
  ca: z.string().min(1, "CA obrigatório"),
  ca_validade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD").optional().or(z.literal("")),
  fabricante: z.string().optional(),
  tipo: z.string().optional(),
})

export const epiImport: ImportSchema<typeof epiImportZod> = {
  nome: "epis",
  schema: epiImportZod,
  templateFilename: "template_epis.csv",
  colunas: [
    { key: "descricao", label: "Descrição", exemplo: "Capacete classe B — azul", obrigatorio: true },
    { key: "ca", label: "CA", exemplo: "31469", obrigatorio: true },
    { key: "ca_validade", label: "Validade do CA", aliases: ["validade_ca", "validade"], exemplo: "2026-12-31", parse: parseData },
    { key: "fabricante", label: "Fabricante", exemplo: "3M" },
    { key: "tipo", label: "Tipo", exemplo: "capacete", parse: (v) => v?.toLowerCase()?.trim() || undefined },
  ],
}

// =============================================================
// TREINAMENTOS (catálogo)
// =============================================================
export const treinamentoImportZod = z.object({
  titulo: z.string().min(3),
  nr_referencia: z.string().optional(),
  carga_horaria_horas: z.coerce.number().positive("Carga horária deve ser > 0"),
  validade_meses: z.coerce.number().int().min(0).optional(),
  tipo: z.enum(["obrigatorio", "reciclagem", "complementar", "integracao"]).default("obrigatorio"),
  modalidade: z.enum(["presencial", "ead", "hibrido"]).default("presencial"),
})

export const treinamentoImport: ImportSchema<typeof treinamentoImportZod> = {
  nome: "treinamentos",
  schema: treinamentoImportZod,
  templateFilename: "template_treinamentos.csv",
  colunas: [
    { key: "titulo", label: "Título", exemplo: "NR-10 Básico", obrigatorio: true },
    { key: "nr_referencia", label: "NR", aliases: ["nr", "norma"], exemplo: "NR-10" },
    { key: "carga_horaria_horas", label: "Carga Horária (h)", aliases: ["carga_horaria", "ch"], exemplo: "40", obrigatorio: true },
    { key: "validade_meses", label: "Validade (meses)", aliases: ["validade"], exemplo: "24" },
    { key: "tipo", label: "Tipo", exemplo: "obrigatorio", parse: (v) => v?.toLowerCase()?.trim() || "obrigatorio" },
    { key: "modalidade", label: "Modalidade", exemplo: "presencial", parse: (v) => v?.toLowerCase()?.trim() || "presencial" },
  ],
}

// =============================================================
// CARGOS
// =============================================================
/** Converte string com separador (vírgula, ponto-e-vírgula, barra) em array de NRs normalizado. */
function parseNrs(v: string): string[] {
  if (!v) return []
  return v
    .split(/[,;|/]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .map((s) => {
      // Normaliza "NR10" → "NR-10", "nr 10" → "NR-10"
      const m = s.match(/^NR[\s-]*(\d+)$/)
      return m ? `NR-${m[1].padStart(2, "0")}` : s
    })
}

export const cargoImportZod = z.object({
  titulo: z.string().min(2, "Mínimo 2 caracteres"),
  empresa_cnpj: z.string(), // resolvido server-side → empresa_id
  cbo: z.string().optional(),
  grupo_risco: z.coerce.number().int().min(1).max(4).optional(),
  descricao_atividades: z.string().optional(),
  nrs_aplicaveis: z.array(z.string()).optional().default([]),
})

export const cargoImport: ImportSchema<typeof cargoImportZod> = {
  nome: "cargos",
  schema: cargoImportZod,
  templateFilename: "template_cargos.csv",
  colunas: [
    { key: "titulo", label: "Título", aliases: ["cargo"], exemplo: "Eletricista NR-10", obrigatorio: true },
    { key: "empresa_cnpj", label: "CNPJ da Empresa", aliases: ["cnpj_empresa", "cnpj"], exemplo: "11.222.333/0001-81", obrigatorio: true },
    { key: "cbo", label: "CBO", exemplo: "7156-10" },
    { key: "grupo_risco", label: "Grupo de Risco (1-4)", aliases: ["gr", "ghe"], exemplo: "3" },
    {
      key: "nrs_aplicaveis",
      label: "NRs Aplicáveis (separar por vírgula)",
      aliases: ["nrs", "normas"],
      exemplo: "NR-10, NR-35",
      parse: parseNrs,
    },
    { key: "descricao_atividades", label: "Descrição das Atividades", aliases: ["descricao"], exemplo: "Instalação e manutenção de sistemas elétricos" },
  ],
}

// =============================================================
// EXAMES MÉDICOS
// =============================================================
export const exameImportZod = z.object({
  colaborador_cpf: z.string(), // resolvido server-side → colaborador_id
  tipo: z.enum(["admissional", "periodico", "retorno_trabalho", "mudanca_funcao", "demissional", "complementar"]),
  subtipo: z.string().optional(),
  data_realizacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use AAAA-MM-DD"),
  resultado: z.enum(["apto", "inapto", "apto_restricao"]).optional(),
  restricoes: z.string().optional(),
  medico_nome: z.string().optional(),
  crm: z.string().optional(),
  clinica: z.string().optional(),
  numero_aso: z.string().optional(),
  observacoes: z.string().optional(),
})

/** Normaliza "apto com restrição" / "apto c/ restrição" → "apto_restricao". */
function parseResultado(v: string): string {
  if (!v) return ""
  const lower = v.toLowerCase().trim()
  if (/apto\s+c[/\\.]?\s*restri/i.test(lower) || /apto\s+com\s+restri/i.test(lower)) return "apto_restricao"
  if (lower.startsWith("inapto")) return "inapto"
  if (lower.startsWith("apto")) return "apto"
  return lower.replace(/[\s-]+/g, "_")
}

/** Normaliza tipo: "retorno ao trabalho" → "retorno_trabalho", remove acentos. */
function parseTipoExame(v: string): string {
  if (!v) return ""
  const lower = v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
  if (/retorno/.test(lower)) return "retorno_trabalho"
  if (/mudanca/.test(lower)) return "mudanca_funcao"
  return lower.replace(/\s+/g, "_")
}

export const exameImport: ImportSchema<typeof exameImportZod> = {
  nome: "exames",
  schema: exameImportZod,
  templateFilename: "template_exames.csv",
  colunas: [
    { key: "colaborador_cpf", label: "CPF do Colaborador", aliases: ["cpf"], exemplo: "111.444.777-35", obrigatorio: true },
    { key: "tipo", label: "Tipo (admissional, periodico, etc.)", exemplo: "periodico", obrigatorio: true, parse: parseTipoExame },
    { key: "subtipo", label: "Subtipo (audiometria, ECG, ...)", exemplo: "audiometria" },
    { key: "data_realizacao", label: "Data de Realização", aliases: ["dt_realizacao", "realizacao"], exemplo: "2026-04-15", obrigatorio: true, parse: parseData },
    { key: "data_vencimento", label: "Data de Vencimento", aliases: ["dt_vencimento", "vencimento"], exemplo: "2027-04-15", obrigatorio: true, parse: parseData },
    { key: "resultado", label: "Resultado (apto/inapto/apto_restricao)", exemplo: "apto", parse: parseResultado },
    { key: "restricoes", label: "Restrições", exemplo: "Evitar trabalho em altura" },
    { key: "medico_nome", label: "Médico Responsável", aliases: ["medico"], exemplo: "Dr. Carlos Pereira" },
    { key: "crm", label: "CRM", exemplo: "123456/SP" },
    { key: "clinica", label: "Clínica", exemplo: "Clínica ABC Saúde Ocupacional" },
    { key: "numero_aso", label: "Número do ASO", aliases: ["n_aso", "aso"], exemplo: "12345" },
    { key: "observacoes", label: "Observações", exemplo: "" },
  ],
}
