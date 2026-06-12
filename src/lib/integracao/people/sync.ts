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
import type { PeopleCargo, PeopleColaborador } from "./contrato"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, "public", any>

const soDigitos = (s: string) => s.replace(/\D/g, "")

/** Resolve empresa pelo CNPJ comparando apenas os dígitos (ignora máscara). */
async function resolverEmpresaId(db: Db, cnpj: string): Promise<string | null> {
  const alvo = soDigitos(cnpj)
  const { data } = await db.from("empresas").select("id, cnpj")
  return (data ?? []).find((e) => soDigitos(e.cnpj ?? "") === alvo)?.id ?? null
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

// People: CLT | PJ | AMBOS → domínio do SST (colaboradores.tipo_vinculo).
const VINCULO_MAP: Record<string, "clt" | "pj" | "ambos"> = {
  clt: "clt", pj: "pj", ambos: "ambos",
}
function mapTipoVinculo(v: string | null | undefined): "clt" | "pj" | "ambos" | null {
  if (!v) return null
  return VINCULO_MAP[v.toLowerCase()] ?? null
}

export async function upsertCargo(db: Db, c: PeopleCargo): Promise<void> {
  const empresaId = await resolverEmpresaId(db, c.empresa_cnpj)
  if (!empresaId) throw new Error(`Empresa não encontrada para CNPJ ${c.empresa_cnpj}`)
  // `cargos` no SST não tem coluna de status — o `ativo` do People só governa
  // se o cargo é enviado (backfill manda só ativos) e o soft-delete vira remoção.
  const { error } = await db.from("cargos").upsert(
    {
      external_id: c.external_id,
      origem: "people",
      empresa_id: empresaId,
      titulo: c.nome,
      cbo: c.cbo ?? null,
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

  // Campos sincronizados (sem a chave). empresa_id/cargo/obra refletem a verdade do People.
  const dados = {
    origem: "people" as const,
    empresa_id: empresaId,
    nome_completo: c.nome_completo,
    cpf: c.cpf,
    sexo: mapSexo(c.sexo),
    email: c.email ?? null,
    telefone: c.telefone ?? null,
    tipo_vinculo: mapTipoVinculo(c.tipo_vinculo),
    cargo_id: cargoId,
    obra_id: obraId,
    data_admissao: c.data_admissao,
    matricula: c.matricula ?? null,
    status: c.ativo ? "ativo" : "demitido",
  }

  // Match por CHAVE DE NEGÓCIO (cpf é UNIQUE global no SST) para nunca violar
  // colaboradores_cpf_key: 1) external_id → 2) cpf → 3) insere.
  const { data: porExterno } = await db
    .from("colaboradores").select("id").eq("external_id", c.external_id).maybeSingle()
  if (porExterno) {
    const { error } = await db.from("colaboradores").update(dados).eq("id", porExterno.id)
    if (error) throw new Error(error.message)
    return
  }

  const { data: porCpf } = await db
    .from("colaboradores").select("id").eq("cpf", c.cpf).maybeSingle()
  if (porCpf) {
    // Já existe (cadastro local ou outro vínculo): atualiza E adota o external_id do People.
    const { error } = await db
      .from("colaboradores").update({ ...dados, external_id: c.external_id }).eq("id", porCpf.id)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await db.from("colaboradores").insert({ ...dados, external_id: c.external_id })
  if (error) throw new Error(error.message)
}

/**
 * "Delete" vindo do People. Colaborador é soft-deletado (status=demitido,
 * preserva histórico de ASO/exames). Cargo não tem coluna de status no SST,
 * então o registro de origem People é removido (só os que vieram de lá).
 */
export async function desativarPorExternalId(
  db: Db,
  tabela: "cargos" | "colaboradores",
  externalId: string,
): Promise<void> {
  if (tabela === "colaboradores") {
    const { error } = await db
      .from("colaboradores")
      .update({ status: "demitido" })
      .eq("external_id", externalId)
    if (error) throw new Error(error.message)
    return
  }
  const { error } = await db
    .from("cargos")
    .delete()
    .eq("external_id", externalId)
    .eq("origem", "people")
  if (error) throw new Error(error.message)
}
