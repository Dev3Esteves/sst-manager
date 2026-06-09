import type { SupabaseClient } from "@supabase/supabase-js"
import {
  ACAO_STATUS_LABEL,
  CATEGORIA_RISCO_LABEL,
  EPI_USO_LABEL,
  NIVEL_NIOSH_LABEL,
  RISCO_CATEGORIA_LABEL,
  TIPO_EXPOSICAO_LABEL,
  TIPO_MEDIDA_LABEL,
  type AcaoStatus,
  type CategoriaRisco,
  type EpiUso,
  type PgrStatus,
  type RiscoCategoria,
  type TipoExposicao,
  type TipoMedida,
} from "@/lib/validations/pgr"

export type PgrFo121Data = {
  // Cabeçalho / capa
  codigo_formulario: string
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
  data_vencimento: string
  status: PgrStatus
  empresa_logo_url: string | null

  // Empresa contratada (executora)
  contratada_razao_social: string
  contratada_cnpj: string
  contratada_endereco: string | null
  contratada_telefone: string | null

  // Local da atividade (obra)
  obra_nome: string
  obra_codigo: string | null
  obra_cidade: string | null
  obra_uf: string | null
  obra_cno: string | null
  obra_num_empregados: number | null
  obra_data_inicio: string | null

  // Contratante (cliente)
  contratante_razao_social: string | null

  // Responsáveis técnicos
  resp_elaboracao_nome: string | null
  resp_elaboracao_funcao: string | null
  resp_elaboracao_crea: string | null
  resp_obra_nome: string | null
  resp_obra_funcao: string | null
  resp_obra_crea: string | null

  // Revisões anteriores (histórico para o controle)
  historico_revisoes: HistoricoRevisaoRow[]

  // Anexos
  ghes: GheBlock[]
  riscos: RiscoRow[]
  acoes: AcaoRow[]
  medidas: MedidaRow[]
}

export type HistoricoRevisaoRow = {
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
}

export type GheBlock = {
  id: string
  codigo: string
  descricao: string
  funcao_posicao: string | null
  area_identificacao: string | null
  caracterizacao_atividades: string | null
  local_trabalho: string | null
  num_empregados_expostos: number | null
  cargos: string[]
  epis: EpiRow[]
}

export type EpiRow = {
  epi_nome: string
  uso_label: string
  observacao: string | null
}

export type RiscoRow = {
  ghe_codigo: string
  ghe_descricao: string
  categoria_label: string
  agente_ambiental: string
  codigo_esocial: string | null
  fontes_geradoras: string | null
  trajetoria: string | null
  via_ingresso: string | null
  possiveis_danos: string | null
  tipo_exposicao_label: string | null
  categoria_risco_label: string | null
  categoria_risco_key: CategoriaRisco | null
}

export type AcaoRow = {
  numero_item: number
  o_que: string
  quem: string | null
  onde: string | null
  quando: string | null
  por_que: string | null
  como: string | null
  status_label: string
  observacoes: string | null
}

export type MedidaRow = {
  ghe_codigo: string | null
  agente_ambiental: string | null
  tipo_medida_label: string
  nivel_niosh: number | null
  nivel_niosh_label: string | null
  acao: string
  detalhamento: string | null
  abrangencia: string | null
  periodicidade: string | null
  status: string | null
}

type RawPgr = {
  id: string
  empresa_id: string
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
  data_vencimento: string
  status: PgrStatus
  codigo_formulario: string
  responsavel_elaboracao_nome: string | null
  responsavel_elaboracao_funcao: string | null
  responsavel_elaboracao_crea: string | null
  responsavel_obra_nome: string | null
  responsavel_obra_funcao: string | null
  responsavel_obra_crea: string | null
  cno_obra_snapshot: string | null
  num_empregados_snapshot: number | null
  data_inicio_obra_snapshot: string | null
  obras: {
    id: string
    nome: string
    codigo: string | null
    cidade: string | null
    uf: string | null
    data_inicio: string | null
    cno: string | null
    num_empregados_max: number | null
    empresa_id: string
    contratante_id: string | null
  }
}

type RawEmpresa = {
  razao_social: string
  cnpj: string
  endereco: Record<string, unknown> | null
  telefones: Record<string, unknown> | null
  logo_url: string | null
}

type RawGhe = {
  id: string
  codigo: string
  descricao: string
  funcao_posicao: string | null
  area_identificacao: string | null
  caracterizacao_atividades: string | null
  local_trabalho: string | null
  num_empregados_expostos: number | null
  ordem: number
}

type RawCargo = { pgr_ghe_id: string; cargo_titulo: string; ordem: number }

type RawRisco = {
  pgr_ghe_id: string
  categoria: RiscoCategoria
  agente_ambiental: string
  codigo_esocial: string | null
  fontes_geradoras: string | null
  trajetoria: string | null
  via_ingresso: string | null
  possiveis_danos: string | null
  tipo_exposicao: TipoExposicao | null
  categoria_risco: CategoriaRisco | null
  ordem: number
}

type RawAcao = {
  numero_item: number
  o_que: string
  quem: string | null
  onde: string | null
  quando: string | null
  por_que: string | null
  como: string | null
  status: AcaoStatus
  observacoes: string | null
}

type RawMedida = {
  pgr_ghe_id: string | null
  agente_ambiental: string | null
  tipo_medida: TipoMedida
  nivel_niosh: number | null
  acao: string
  detalhamento: string | null
  abrangencia: string | null
  periodicidade: string | null
  status: string | null
  ordem: number
}

type RawEpiGhe = {
  pgr_ghe_id: string
  epi_nome: string
  uso: EpiUso
  observacao: string | null
  ordem: number
}

type RawRevisao = {
  numero_revisao: number
  descricao_revisao: string | null
  data_emissao: string
}

function formatEndereco(endereco: Record<string, unknown> | null): string | null {
  if (!endereco) return null
  const partes = [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.uf,
    endereco.cep,
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(", ")
  return partes || null
}

function formatTelefone(telefones: Record<string, unknown> | null): string | null {
  if (!telefones) return null
  // Aceita objeto plano { principal: "..." } ou array embrulhado em JSONB
  const valores = Array.isArray(telefones) ? telefones : Object.values(telefones)
  const primeiro = valores.find((v) => typeof v === "string" && v.trim().length > 0)
  return typeof primeiro === "string" ? primeiro : null
}

export type BuildResult =
  | { ok: true; data: PgrFo121Data }
  | { ok: false; status: number; error: string }

export async function buildPgrFo121Data(
  supabase: SupabaseClient,
  pgrId: string,
): Promise<BuildResult> {
  const { data: pgr, error: pgrErr } = await supabase
    .from("pgr")
    .select(`
      id, empresa_id, numero_revisao, descricao_revisao, data_emissao, data_vencimento, status,
      codigo_formulario,
      responsavel_elaboracao_nome, responsavel_elaboracao_funcao, responsavel_elaboracao_crea,
      responsavel_obra_nome, responsavel_obra_funcao, responsavel_obra_crea,
      cno_obra_snapshot, num_empregados_snapshot, data_inicio_obra_snapshot,
      obras!inner(
        id, nome, codigo, cidade, uf, data_inicio, cno, num_empregados_max,
        empresa_id, contratante_id
      )
    `)
    .eq("id", pgrId)
    .single<RawPgr>()

  if (pgrErr || !pgr) {
    return { ok: false, status: 404, error: "PGR não encontrado" }
  }

  const obra = pgr.obras

  const [
    { data: contratada },
    { data: contratante },
    { data: ghesRaw },
    { data: cargosRaw },
    { data: riscosRaw },
    { data: acoesRaw },
    { data: medidasRaw },
    { data: episRaw },
    { data: revisoesRaw },
  ] = await Promise.all([
    supabase
      .from("empresas")
      .select("razao_social, cnpj, endereco, telefones, logo_url")
      .eq("id", obra.empresa_id)
      .single<RawEmpresa>(),
    obra.contratante_id
      ? supabase
          .from("empresas")
          .select("razao_social, cnpj, endereco, telefones, logo_url")
          .eq("id", obra.contratante_id)
          .single<RawEmpresa>()
      : Promise.resolve({ data: null }),
    supabase
      .from("pgr_ghe")
      .select(
        "id, codigo, descricao, funcao_posicao, area_identificacao, caracterizacao_atividades, local_trabalho, num_empregados_expostos, ordem",
      )
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("codigo")
      .returns<RawGhe[]>(),
    supabase
      .from("pgr_ghe_cargo")
      .select("pgr_ghe_id, cargo_titulo, ordem")
      .eq("empresa_id", pgr.empresa_id)
      .returns<RawCargo[]>(),
    supabase
      .from("pgr_risco")
      .select(
        "pgr_ghe_id, categoria, agente_ambiental, codigo_esocial, fontes_geradoras, trajetoria, via_ingresso, possiveis_danos, tipo_exposicao, categoria_risco, ordem",
      )
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("agente_ambiental")
      .returns<RawRisco[]>(),
    supabase
      .from("pgr_acao")
      .select("numero_item, o_que, quem, onde, quando, por_que, como, status, observacoes")
      .eq("pgr_id", pgrId)
      .order("numero_item")
      .returns<RawAcao[]>(),
    supabase
      .from("pgr_medida_controle")
      .select(
        "pgr_ghe_id, agente_ambiental, tipo_medida, nivel_niosh, acao, detalhamento, abrangencia, periodicidade, status, ordem",
      )
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("nivel_niosh")
      .returns<RawMedida[]>(),
    supabase
      .from("pgr_epi_ghe")
      .select("pgr_ghe_id, epi_nome, uso, observacao, ordem")
      .eq("pgr_id", pgrId)
      .order("ordem")
      .order("epi_nome")
      .returns<RawEpiGhe[]>(),
    supabase
      .from("pgr")
      .select("numero_revisao, descricao_revisao, data_emissao")
      .eq("obra_id", obra.id)
      .lte("numero_revisao", pgr.numero_revisao)
      .order("numero_revisao")
      .returns<RawRevisao[]>(),
  ])

  if (!contratada) {
    return { ok: false, status: 500, error: "Empresa contratada não encontrada" }
  }

  const ghes = ghesRaw ?? []
  const cargos = cargosRaw ?? []
  const riscos = riscosRaw ?? []
  const acoes = acoesRaw ?? []
  const medidas = medidasRaw ?? []
  const epis = episRaw ?? []
  const revisoes = revisoesRaw ?? []

  const cargosByGhe = new Map<string, string[]>()
  for (const c of cargos) {
    const list = cargosByGhe.get(c.pgr_ghe_id) ?? []
    list.push(c.cargo_titulo)
    cargosByGhe.set(c.pgr_ghe_id, list)
  }

  const episByGhe = new Map<string, EpiRow[]>()
  for (const e of epis) {
    const list = episByGhe.get(e.pgr_ghe_id) ?? []
    list.push({
      epi_nome: e.epi_nome,
      uso_label: EPI_USO_LABEL[e.uso],
      observacao: e.observacao,
    })
    episByGhe.set(e.pgr_ghe_id, list)
  }

  const gheByIdInfo = new Map(
    ghes.map((g) => [g.id, { codigo: g.codigo, descricao: g.descricao }]),
  )

  const data: PgrFo121Data = {
    codigo_formulario: pgr.codigo_formulario,
    numero_revisao: pgr.numero_revisao,
    descricao_revisao: pgr.descricao_revisao,
    data_emissao: pgr.data_emissao,
    data_vencimento: pgr.data_vencimento,
    status: pgr.status,
    empresa_logo_url: contratada.logo_url,

    contratada_razao_social: contratada.razao_social,
    contratada_cnpj: contratada.cnpj,
    contratada_endereco: formatEndereco(contratada.endereco),
    contratada_telefone: formatTelefone(contratada.telefones),

    obra_nome: obra.nome,
    obra_codigo: obra.codigo,
    obra_cidade: obra.cidade,
    obra_uf: obra.uf,
    obra_cno: pgr.cno_obra_snapshot ?? obra.cno,
    obra_num_empregados: pgr.num_empregados_snapshot ?? obra.num_empregados_max,
    obra_data_inicio: pgr.data_inicio_obra_snapshot ?? obra.data_inicio,

    contratante_razao_social: contratante?.razao_social ?? null,

    resp_elaboracao_nome: pgr.responsavel_elaboracao_nome,
    resp_elaboracao_funcao: pgr.responsavel_elaboracao_funcao,
    resp_elaboracao_crea: pgr.responsavel_elaboracao_crea,
    resp_obra_nome: pgr.responsavel_obra_nome,
    resp_obra_funcao: pgr.responsavel_obra_funcao,
    resp_obra_crea: pgr.responsavel_obra_crea,

    historico_revisoes: revisoes.map((r) => ({
      numero_revisao: r.numero_revisao,
      descricao_revisao: r.descricao_revisao,
      data_emissao: r.data_emissao,
    })),

    ghes: ghes.map((g) => ({
      id: g.id,
      codigo: g.codigo,
      descricao: g.descricao,
      funcao_posicao: g.funcao_posicao,
      area_identificacao: g.area_identificacao,
      caracterizacao_atividades: g.caracterizacao_atividades,
      local_trabalho: g.local_trabalho,
      num_empregados_expostos: g.num_empregados_expostos,
      cargos: cargosByGhe.get(g.id) ?? [],
      epis: episByGhe.get(g.id) ?? [],
    })),

    riscos: riscos.map((r) => {
      const ghe = gheByIdInfo.get(r.pgr_ghe_id)
      return {
        ghe_codigo: ghe?.codigo ?? "—",
        ghe_descricao: ghe?.descricao ?? "—",
        categoria_label: RISCO_CATEGORIA_LABEL[r.categoria],
        agente_ambiental: r.agente_ambiental,
        codigo_esocial: r.codigo_esocial,
        fontes_geradoras: r.fontes_geradoras,
        trajetoria: r.trajetoria,
        via_ingresso: r.via_ingresso,
        possiveis_danos: r.possiveis_danos,
        tipo_exposicao_label: r.tipo_exposicao ? TIPO_EXPOSICAO_LABEL[r.tipo_exposicao] : null,
        categoria_risco_label: r.categoria_risco ? CATEGORIA_RISCO_LABEL[r.categoria_risco] : null,
        categoria_risco_key: r.categoria_risco,
      }
    }),

    acoes: acoes.map((a) => ({
      numero_item: a.numero_item,
      o_que: a.o_que,
      quem: a.quem,
      onde: a.onde,
      quando: a.quando,
      por_que: a.por_que,
      como: a.como,
      status_label: ACAO_STATUS_LABEL[a.status],
      observacoes: a.observacoes,
    })),

    medidas: medidas.map((m) => ({
      ghe_codigo: m.pgr_ghe_id ? gheByIdInfo.get(m.pgr_ghe_id)?.codigo ?? null : null,
      agente_ambiental: m.agente_ambiental,
      tipo_medida_label: TIPO_MEDIDA_LABEL[m.tipo_medida],
      nivel_niosh: m.nivel_niosh,
      nivel_niosh_label: m.nivel_niosh ? NIVEL_NIOSH_LABEL[m.nivel_niosh] : null,
      acao: m.acao,
      detalhamento: m.detalhamento,
      abrangencia: m.abrangencia,
      periodicidade: m.periodicidade,
      status: m.status,
    })),
  }

  return { ok: true, data }
}
