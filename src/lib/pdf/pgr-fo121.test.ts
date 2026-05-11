import { describe, expect, it } from "vitest"
import { renderToBuffer } from "@react-pdf/renderer"
import { renderPgrFo121Pdf } from "./pgr-fo121"
import type { PgrFo121Data } from "./pgr-fo121-builder"

/**
 * Smoke tests do gerador PDF FO-121-00 (PGR/GRO SISTENGE).
 * Verificamos que: (i) o renderer não quebra em entradas vazias, mínimas e
 * completas; (ii) o output é um PDF válido (`%PDF-` magic header).
 */

const dataMinima: PgrFo121Data = {
  codigo_formulario: "FO-121-00",
  numero_revisao: 0,
  descricao_revisao: null,
  data_emissao: "2026-05-10",
  data_vencimento: "2027-05-10",
  status: "rascunho",
  empresa_logo_url: null,

  contratada_razao_social: "SISTENGE Construções e Comércio Ltda",
  contratada_cnpj: "49.329.618/0001-99",
  contratada_endereco: "Rua Ouvidor Peleja, 111, São Paulo, SP",
  contratada_telefone: "(11) 3556-8700",

  obra_nome: "Obra Teste",
  obra_codigo: null,
  obra_cidade: "São Paulo",
  obra_uf: "SP",
  obra_cno: null,
  obra_num_empregados: null,
  obra_data_inicio: null,
  contratante_razao_social: null,

  resp_elaboracao_nome: null,
  resp_elaboracao_funcao: null,
  resp_elaboracao_crea: null,
  resp_obra_nome: null,
  resp_obra_funcao: null,
  resp_obra_crea: null,

  historico_revisoes: [],
  ghes: [],
  riscos: [],
  acoes: [],
  medidas: [],
}

const dataCompleta: PgrFo121Data = {
  ...dataMinima,
  numero_revisao: 2,
  descricao_revisao: "Inclusão de GHE 03 (operacional)",
  status: "vigente",

  obra_codigo: "OBRA-001",
  obra_cno: "90.010.92255/71",
  obra_num_empregados: 700,
  obra_data_inicio: "2026-04-01",
  contratante_razao_social: "Cliente Exemplo Ltda",

  resp_elaboracao_nome: "Fernanda Cavalcante",
  resp_elaboracao_funcao: "Supervisor de Segurança do Trabalho",
  resp_elaboracao_crea: "CREA-SP 5069853674",
  resp_obra_nome: "Adriano Soares",
  resp_obra_funcao: "Coordenador de Obras",
  resp_obra_crea: "CREA 5063036176",

  historico_revisoes: [
    { numero_revisao: 0, descricao_revisao: "Documento inicial", data_emissao: "2026-03-25" },
    { numero_revisao: 1, descricao_revisao: "Inclusão GHE 02", data_emissao: "2026-04-14" },
    { numero_revisao: 2, descricao_revisao: "Inclusão GHE 03", data_emissao: "2026-05-10" },
  ],
  ghes: [
    {
      id: "ghe-1",
      codigo: "GHE 01",
      descricao: "ADMINISTRAÇÃO",
      funcao_posicao: "Administração",
      area_identificacao: "CANTEIRO ADMINISTRATIVO",
      caracterizacao_atividades: "Atividades administrativas no escritório.",
      local_trabalho: "Escritório",
      num_empregados_expostos: 12,
      cargos: ["Auxiliar Administrativo", "Coordenador de Obras"],
      epis: [
        { epi_nome: "Capacete", uso_label: "Permanente", observacao: null },
        { epi_nome: "Óculos de proteção", uso_label: "Eventual", observacao: "Visitas a campo" },
      ],
    },
    {
      id: "ghe-2",
      codigo: "GHE 02",
      descricao: "OPERACIONAL CIVIL",
      funcao_posicao: "Operacional",
      area_identificacao: null,
      caracterizacao_atividades: null,
      local_trabalho: "Campo",
      num_empregados_expostos: 60,
      cargos: ["Pedreiro", "Ajudante de Obras"],
      epis: [
        { epi_nome: "Capacete", uso_label: "Permanente", observacao: null },
        { epi_nome: "Cinto trava-quedas", uso_label: "Atividade específica", observacao: "NR-35" },
      ],
    },
  ],
  riscos: [
    {
      ghe_codigo: "GHE 01",
      ghe_descricao: "ADMINISTRAÇÃO",
      categoria_label: "Físico",
      agente_ambiental: "RUÍDO",
      codigo_esocial: "02.01.001",
      fontes_geradoras: "Veículos e máquinas na área externa",
      trajetoria: "Externa",
      via_ingresso: "Ar",
      possiveis_danos: "Trauma acústico, perda auditiva, estresse",
      tipo_exposicao_label: "Eventual",
      categoria_risco_label: "Baixo",
      categoria_risco_key: "baixo",
    },
    {
      ghe_codigo: "GHE 02",
      ghe_descricao: "OPERACIONAL CIVIL",
      categoria_label: "Acidente",
      agente_ambiental: "QUEDA DE ALTURA",
      codigo_esocial: null,
      fontes_geradoras: "Trabalho em superfícies elevadas",
      trajetoria: "Ambiente",
      via_ingresso: "Ambiente",
      possiveis_danos: "Lesões por queda, fraturas, óbito",
      tipo_exposicao_label: "Moderado",
      categoria_risco_label: "Muito Alto",
      categoria_risco_key: "muito_alto",
    },
  ],
  acoes: [
    {
      numero_item: 1,
      o_que: "Emissão do Anexo II — APR + Caracterização dos GHEs",
      quem: "SMS",
      onde: "MATRIZ",
      quando: "05/2026",
      por_que: "Atender NR-1",
      como: "Levantamento de campo",
      status_label: "Concluído",
      observacoes: null,
    },
    {
      numero_item: 2,
      o_que: "Realizar dosimetria de ruído",
      quem: "SMS",
      onde: "Obra",
      quando: "07/2026",
      por_que: "Avaliação quantitativa",
      como: "Empresa especializada",
      status_label: "Planejado",
      observacoes: null,
    },
  ],
  medidas: [
    {
      ghe_codigo: "GHE 02",
      agente_ambiental: "QUEDA DE ALTURA",
      tipo_medida_label: "Coletiva",
      nivel_niosh: 3,
      nivel_niosh_label: "Engenharia",
      acao: "Instalação de guarda-corpo",
      detalhamento: "Guarda-corpo metálico em todo perímetro",
      abrangencia: "Pavimentos > 2m",
      periodicidade: "Permanente",
      status: "implantado",
    },
    {
      ghe_codigo: null,
      agente_ambiental: "RUÍDO",
      tipo_medida_label: "Individual (EPI)",
      nivel_niosh: 5,
      nivel_niosh_label: "EPI",
      acao: "Uso de protetor auricular",
      detalhamento: "Protetor tipo plug",
      abrangencia: "Ao ultrapassar 80dB",
      periodicidade: "Quando necessário",
      status: "eventual",
    },
  ],
}

describe("renderPgrFo121Pdf", () => {
  it("renderiza um PGR vazio (rascunho sem dados) sem quebrar", async () => {
    const element = await renderPgrFo121Pdf(dataMinima)
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(2000)
  })

  it("renderiza um PGR completo com GHEs, riscos, ações, medidas e EPIs", async () => {
    const element = await renderPgrFo121Pdf(dataCompleta)
    const buffer = await renderToBuffer(element)
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    // Documento completo deve ser substancialmente maior que o esqueleto vazio
    expect(buffer.length).toBeGreaterThan(8000)
  })
})
