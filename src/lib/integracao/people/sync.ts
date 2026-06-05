/**
 * Sincronização People → SST (anti-corruption layer).
 *
 * Traduz o modelo do People para o do SST e faz upsert idempotente por
 * `external_id`, marcando os registros com `origem='people'`. Resolve as
 * chaves de correlação (CNPJ → empresa, CPF → colaborador, código → obra,
 * cargo_external_id → cargo). Usa o client service-role (passado por quem
 * chama) — fora do alcance do RLS.
 *
 * Os nomes de coluna seguem o schema atual do SST (cargos.titulo,
 * colaboradores.data_admissao/sexo M|F|O, etc.).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { PeopleCargo, PeopleColaborador, PeopleExame } from "./contrato"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, "public", any>

const soDigitos = (s: string) => s.replace(/\D/g, "")

/** Resolve empresa pelo CNPJ comparando apenas os dígitos (ignora máscara). */
async function resolverEmpresaId(db: Db, cnpj: string): Promise<string | null> {
  const alvo = soDigitos(cnpj)
  const { data } = await db.from("empresas").select("id, cnpj")
  return (data ?? []).find((e) => soDigitos(e.cnpj ?? "") === alvo)?.id ?? null
}

async function resolverColaboradorId(db: Db, cpf: string): Promise<string | null> {
  const alvo = soDigitos(cpf)
  const { data } = await db.from("colaboradores").select("id, cpf")
  return (data ?? []).find((c) => soDigitos(c.cpf ?? "") === alvo)?.id ?? null
}

async function resolverCargoId(db: Db, externalId: string): Promise<string | null> {
  const { data } = await db.from("cargos").select("id").eq("external_id", externalId).maybeSingle()
  return data?.id ?? null
}

async function resolverObraId(db: Db, codigo: string, empresaId: string): Promise<string | null> {
  const { data } = await db.from("obras").select("id").eq("codigo", codigo).eq("empresa_id", empresaId).maybeSingle()
  return data?.id ?? null
}

const SEXO_MAP: Record<string, "M" | "F" | "O"> = {
  m: "M", masculino: "M", male: "M",
  f: "F", feminino: "F", female: "F",
}
function mapSexo(s: string | null | undefined): "M" | "F" | "O" | null {
  if (!s) return null
  return SEXO_MAP[s.toLowerCase()] ?? "O"
}

export async function upsertCargo(db: Db, c: PeopleCargo): Promise<void> {
  const empresaId = await resolverEmpresaId(db, c.empresa_cnpj)
  if (!empresaId) throw new Error(`Empresa não encontrada para CNPJ ${c.empresa_cnpj}`)
  const { error } = await db.from("cargos").upsert(
    {
      external_id: c.external_id,
      origem: "people",
      empresa_id: empresaId,
      titulo: c.nome,
      cbo: c.cbo ?? null,
      ativo: c.ativo,
    },
    { onConflict: "external_id" },
  )
  if (error) throw new Error(error.message)
}

export async function upsertColaborador(db: Db, c: PeopleColaborador): Promise<void> {
  const empresaId = await resolverEmpresaId(db, c.empresa_cnpj)
  if (!empresaId) throw new Error(`Empresa não encontrada para CNPJ ${c.empresa_cnpj}`)
  const cargoId = c.cargo_external_id ? await resolverCargoId(db, c.cargo_external_id) : null
  const obraId = c.obra_codigo ? await resolverObraId(db, c.obra_codigo, empresaId) : null

  const { error } = await db.from("colaboradores").upsert(
    {
      external_id: c.external_id,
      origem: "people",
      empresa_id: empresaId,
      nome_completo: c.nome_completo,
      cpf: c.cpf,
      sexo: mapSexo(c.sexo),
      email: c.email ?? null,
      telefone: c.telefone ?? null,
      cargo_id: cargoId,
      obra_id: obraId,
      data_admissao: c.data_admissao,
      matricula: c.matricula ?? null,
      status: c.ativo ? "ativo" : "demitido",
    },
    { onConflict: "external_id" },
  )
  if (error) throw new Error(error.message)
}

export async function upsertExame(db: Db, e: PeopleExame): Promise<void> {
  const colaboradorId = await resolverColaboradorId(db, e.colaborador_cpf)
  if (!colaboradorId) throw new Error(`Colaborador não encontrado para CPF ${e.colaborador_cpf}`)
  const { error } = await db.from("exames_medicos").upsert(
    {
      external_id: e.external_id,
      origem: "people",
      colaborador_id: colaboradorId,
      tipo: e.tipo,
      data_realizacao: e.data_realizacao,
      data_vencimento: e.data_vencimento,
      resultado: e.resultado ?? null,
      medico_nome: e.medico_nome ?? null,
      crm: e.crm ?? null,
    },
    { onConflict: "external_id" },
  )
  if (error) throw new Error(error.message)
}

/** Soft-delete: registros vindos do People são desativados, não apagados. */
export async function desativarPorExternalId(
  db: Db,
  tabela: "cargos" | "colaboradores" | "exames_medicos",
  externalId: string,
): Promise<void> {
  const patch = tabela === "colaboradores" ? { status: "demitido" } : { ativo: false }
  const { error } = await db.from(tabela).update(patch).eq("external_id", externalId)
  if (error) throw new Error(error.message)
}
