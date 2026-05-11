/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { fetchLogoAsDataUri } from "./fetch-logo"
import type {
  EpiRow,
  GheBlock,
  HistoricoRevisaoRow,
  MedidaRow,
  PgrFo121Data,
  RiscoRow,
} from "./pgr-fo121-builder"

const COLOR_RISCO_BG: Record<string, string> = {
  muito_alto: "#7f1d1d",
  alto: "#b45309",
  medio: "#a16207",
  baixo: "#15803d",
  muito_baixo: "#166534",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  pageLandscape: {
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  header: {
    position: "absolute",
    top: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1.5 solid #0f172a",
    paddingBottom: 6,
  },
  headerLeft: { flex: 1 },
  headerLogo: { width: 90, height: 36, objectFit: "contain" },
  headerEmpresa: { fontSize: 10, fontWeight: "bold", color: "#0f172a" },
  headerCnpj: { fontSize: 7.5, color: "#475569", marginTop: 1 },
  headerForm: { fontSize: 7.5, color: "#475569", marginTop: 1 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    borderTop: "0.5 solid #94a3b8",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#475569",
  },

  // CAPA
  capa: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  capaLogo: { width: 160, height: 60, marginBottom: 32, objectFit: "contain" },
  capaTipo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 4,
    marginBottom: 6,
  },
  capaSubtitulo: {
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
    marginBottom: 26,
    paddingHorizontal: 40,
  },
  capaCliente: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },
  capaObra: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    marginBottom: 30,
  },
  capaInfoBox: {
    border: "1 solid #94a3b8",
    padding: 12,
    width: "70%",
    marginBottom: 16,
  },
  capaInfoLinha: {
    flexDirection: "row",
    marginBottom: 4,
  },
  capaInfoLabel: { width: 130, fontWeight: "bold", fontSize: 9.5 },
  capaInfoValor: { flex: 1, fontSize: 9.5 },
  capaRodapeForm: {
    position: "absolute",
    bottom: 32,
    fontSize: 8,
    color: "#64748b",
  },

  // Geral
  h1: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#0f172a",
    padding: 6,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  h2: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    backgroundColor: "#e2e8f0",
    padding: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  paragrafo: { fontSize: 9, textAlign: "justify", marginBottom: 6 },
  small: { fontSize: 8, color: "#475569" },

  // Tabelas
  table: { borderWidth: 0.5, borderColor: "#94a3b8", marginBottom: 12 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#94a3b8" },
  trLast: { flexDirection: "row" },
  th: {
    padding: 3,
    backgroundColor: "#cbd5e1",
    fontWeight: "bold",
    fontSize: 8,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
  },
  thLast: {
    padding: 3,
    backgroundColor: "#cbd5e1",
    fontWeight: "bold",
    fontSize: 8,
  },
  td: {
    padding: 3,
    fontSize: 8,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
  },
  tdLast: { padding: 3, fontSize: 8 },
  tdMono: {
    padding: 3,
    fontSize: 7.5,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
    fontFamily: "Courier",
  },
  badgeRisco: {
    paddingVertical: 1,
    paddingHorizontal: 3,
    color: "#fff",
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    borderRadius: 2,
  },

  // GHE block (Anexo II e VII)
  gheCard: {
    border: "0.5 solid #94a3b8",
    padding: 8,
    marginBottom: 8,
  },
  gheCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: "0.5 solid #cbd5e1",
  },
  gheCodigo: { fontSize: 11, fontWeight: "bold", color: "#0f172a" },
  gheDescricao: { fontSize: 10, color: "#334155" },
  gheMeta: { fontSize: 8, color: "#475569", marginBottom: 4 },
  gheLabelCargos: { fontSize: 8, fontWeight: "bold", marginTop: 4, marginBottom: 2 },

  // Assinaturas
  signGroup: { marginTop: 30, flexDirection: "row", gap: 24 },
  signBlock: {
    flex: 1,
    alignItems: "center",
  },
  signLine: { width: "100%", borderTop: "1 solid #0f172a", marginTop: 40 },
  signNome: { fontSize: 10, fontWeight: "bold", marginTop: 4 },
  signFuncao: { fontSize: 9, color: "#475569" },
  signCrea: { fontSize: 8, color: "#64748b", fontFamily: "Courier" },
})

function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function fmtRev(n: number): string {
  return String(n).padStart(2, "0")
}

function Header({ data }: { data: PgrFo121Data }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>
        <Text style={styles.headerEmpresa}>{data.contratada_razao_social}</Text>
        <Text style={styles.headerCnpj}>CNPJ: {data.contratada_cnpj}</Text>
        <Text style={styles.headerForm}>
          {data.codigo_formulario} · PGR/GRO · Obra: {data.obra_nome} · Rev. {fmtRev(data.numero_revisao)}
        </Text>
      </View>
    </View>
  )
}

function Footer({ data }: { data: PgrFo121Data }) {
  return (
    <View style={styles.footer} fixed>
      <Text>SGI\Formulários\{data.codigo_formulario} PGR.doc</Text>
      <Text>
        Emissão {fmtData(data.data_emissao)} · Vencimento {fmtData(data.data_vencimento)}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber}/${totalPages}`} />
    </View>
  )
}

function CapaPage({ data, logo }: { data: PgrFo121Data; logo: string | null }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.capa}>
        {logo && <Image src={logo} style={styles.capaLogo} />}
        <Text style={styles.capaTipo}>PGR / GRO</Text>
        <Text style={styles.capaSubtitulo}>
          PROGRAMA DE GERENCIAMENTO DE RISCOS{"\n"}
          PROGRAMA DE RISCO OCUPACIONAL
        </Text>
        <Text style={styles.capaCliente}>
          {data.contratante_razao_social ?? data.contratada_razao_social}
        </Text>
        <Text style={styles.capaObra}>
          Obra: {data.obra_nome}
          {data.obra_codigo ? ` (${data.obra_codigo})` : ""}
          {data.obra_cidade ? ` — ${data.obra_cidade}/${data.obra_uf ?? ""}` : ""}
        </Text>
        <View style={styles.capaInfoBox}>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>Revisão:</Text>
            <Text style={styles.capaInfoValor}>
              {fmtRev(data.numero_revisao)}
              {data.descricao_revisao ? ` — ${data.descricao_revisao}` : ""}
            </Text>
          </View>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>Data de emissão:</Text>
            <Text style={styles.capaInfoValor}>{fmtData(data.data_emissao)}</Text>
          </View>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>Data de vencimento:</Text>
            <Text style={styles.capaInfoValor}>{fmtData(data.data_vencimento)}</Text>
          </View>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>Empresa contratada:</Text>
            <Text style={styles.capaInfoValor}>{data.contratada_razao_social}</Text>
          </View>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>CNPJ contratada:</Text>
            <Text style={styles.capaInfoValor}>{data.contratada_cnpj}</Text>
          </View>
          <View style={styles.capaInfoLinha}>
            <Text style={styles.capaInfoLabel}>Formulário SGI:</Text>
            <Text style={styles.capaInfoValor}>{data.codigo_formulario}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.capaRodapeForm} fixed>
        SGI\Formulários\{data.codigo_formulario} PGR.doc
      </Text>
    </Page>
  )
}

function ControleRevisoes({ revisoes }: { revisoes: HistoricoRevisaoRow[] }) {
  return (
    <View>
      <Text style={styles.h2}>Controle de revisões</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 0.5, textAlign: "center" }]}>Revisão</Text>
          <Text style={[styles.th, { flex: 3 }]}>Descrição da revisão</Text>
          <Text style={[styles.thLast, { flex: 1, textAlign: "center" }]}>Emissão</Text>
        </View>
        {revisoes.length === 0 ? (
          <View style={styles.trLast}>
            <Text style={[styles.tdLast, { flex: 1, textAlign: "center", color: "#94a3b8" }]}>
              Nenhuma revisão anterior registrada.
            </Text>
          </View>
        ) : (
          revisoes.map((r, i) => (
            <View
              key={r.numero_revisao}
              style={i === revisoes.length - 1 ? styles.trLast : styles.tr}
            >
              <Text style={[styles.tdMono, { flex: 0.5, textAlign: "center" }]}>
                {fmtRev(r.numero_revisao)}
              </Text>
              <Text style={[styles.td, { flex: 3 }]}>
                {r.descricao_revisao ?? (r.numero_revisao === 0 ? "Documento inicial" : "—")}
              </Text>
              <Text style={[styles.tdLast, { flex: 1, textAlign: "center" }]}>
                {fmtData(r.data_emissao)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

function CaracterizacaoPage({ data }: { data: PgrFo121Data }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header data={data} />
      <Text style={styles.h1}>CARACTERIZAÇÃO</Text>

      <ControleRevisoes revisoes={data.historico_revisoes} />

      <Text style={styles.h2}>Empresa contratada (executora do PGR)</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>Razão Social</Text>
          <Text style={[styles.thLast, { flex: 2 }]}>
            <Text>{data.contratada_razao_social}</Text>
          </Text>
        </View>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>CNPJ</Text>
          <Text style={[styles.tdLast, { flex: 2, fontFamily: "Courier" }]}>
            {data.contratada_cnpj}
          </Text>
        </View>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>Endereço</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {data.contratada_endereco ?? "—"}
          </Text>
        </View>
        <View style={styles.trLast}>
          <Text style={[styles.th, { flex: 1.2 }]}>Telefone</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {data.contratada_telefone ?? "—"}
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>Local de atividade (obra)</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>Obra</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {data.obra_nome}
            {data.obra_codigo ? ` (${data.obra_codigo})` : ""}
          </Text>
        </View>
        {data.contratante_razao_social && (
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 1.2 }]}>Cliente / Contratante</Text>
            <Text style={[styles.tdLast, { flex: 2 }]}>{data.contratante_razao_social}</Text>
          </View>
        )}
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>Localização</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {[data.obra_cidade, data.obra_uf].filter(Boolean).join(" / ") || "—"}
          </Text>
        </View>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>CNO</Text>
          <Text style={[styles.tdLast, { flex: 2, fontFamily: "Courier" }]}>
            {data.obra_cno ?? "—"}
          </Text>
        </View>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1.2 }]}>Nº geral de empregados até</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>{data.obra_num_empregados ?? "—"}</Text>
        </View>
        <View style={styles.trLast}>
          <Text style={[styles.th, { flex: 1.2 }]}>Início de obra</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>{fmtData(data.obra_data_inicio)}</Text>
        </View>
      </View>

      <Text style={styles.h2}>Responsáveis técnicos</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, { flex: 1 }]}>Elaboração do PGR</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {data.resp_elaboracao_nome ?? "—"}
            {data.resp_elaboracao_funcao ? ` — ${data.resp_elaboracao_funcao}` : ""}
            {data.resp_elaboracao_crea ? ` (${data.resp_elaboracao_crea})` : ""}
          </Text>
        </View>
        <View style={styles.trLast}>
          <Text style={[styles.th, { flex: 1 }]}>Coordenação da obra</Text>
          <Text style={[styles.tdLast, { flex: 2 }]}>
            {data.resp_obra_nome ?? "—"}
            {data.resp_obra_funcao ? ` — ${data.resp_obra_funcao}` : ""}
            {data.resp_obra_crea ? ` (${data.resp_obra_crea})` : ""}
          </Text>
        </View>
      </View>

      <Footer data={data} />
    </Page>
  )
}

function AnexoICronograma({ data }: { data: PgrFo121Data }) {
  if (data.acoes.length === 0) return null
  return (
    <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
      <Header data={data} />
      <Text style={styles.h1}>ANEXO I — CRONOGRAMA ANUAL DE ATIVIDADES (5W1H)</Text>
      <View style={styles.table}>
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: 24, textAlign: "center" }]}>#</Text>
          <Text style={[styles.th, { flex: 3 }]}>O que fazer?</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Quem?</Text>
          <Text style={[styles.th, { flex: 1 }]}>Onde?</Text>
          <Text style={[styles.th, { flex: 1 }]}>Quando?</Text>
          <Text style={[styles.th, { flex: 2 }]}>Por quê?</Text>
          <Text style={[styles.th, { flex: 2 }]}>Como?</Text>
          <Text style={[styles.thLast, { flex: 1.2 }]}>Status</Text>
        </View>
        {data.acoes.map((a, i) => (
          <View key={a.numero_item} style={i === data.acoes.length - 1 ? styles.trLast : styles.tr} wrap={false}>
            <Text style={[styles.tdMono, { width: 24, textAlign: "center" }]}>{a.numero_item}</Text>
            <Text style={[styles.td, { flex: 3 }]}>{a.o_que}</Text>
            <Text style={[styles.td, { flex: 1.2 }]}>{a.quem ?? "—"}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{a.onde ?? "—"}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{a.quando ?? "—"}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{a.por_que ?? "—"}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{a.como ?? "—"}</Text>
            <Text style={[styles.tdLast, { flex: 1.2 }]}>{a.status_label}</Text>
          </View>
        ))}
      </View>
      <Footer data={data} />
    </Page>
  )
}

function GheCard({ ghe }: { ghe: GheBlock }) {
  return (
    <View style={styles.gheCard} wrap={false}>
      <View style={styles.gheCardHeader}>
        <Text style={styles.gheCodigo}>{ghe.codigo}</Text>
        <Text style={styles.gheDescricao}>{ghe.descricao}</Text>
      </View>
      <Text style={styles.gheMeta}>
        {ghe.funcao_posicao ? `Função/Posição: ${ghe.funcao_posicao} · ` : ""}
        {ghe.local_trabalho ? `Local: ${ghe.local_trabalho} · ` : ""}
        {ghe.num_empregados_expostos !== null
          ? `Nº expostos: ${ghe.num_empregados_expostos}`
          : ""}
      </Text>
      {ghe.area_identificacao && (
        <Text style={styles.gheMeta}>Área: {ghe.area_identificacao}</Text>
      )}
      {ghe.caracterizacao_atividades && (
        <Text style={[styles.paragrafo, { marginTop: 2 }]}>
          {ghe.caracterizacao_atividades}
        </Text>
      )}
      <Text style={styles.gheLabelCargos}>Cargos relacionados:</Text>
      <Text style={styles.small}>
        {ghe.cargos.length > 0 ? ghe.cargos.join(" · ") : "—"}
      </Text>
    </View>
  )
}

function AnexoIIGhes({ data }: { data: PgrFo121Data }) {
  if (data.ghes.length === 0) return null
  return (
    <Page size="A4" style={styles.page}>
      <Header data={data} />
      <Text style={styles.h1}>ANEXO II — CARACTERIZAÇÃO DOS GRUPOS HOMOGÊNEOS DE EXPOSIÇÃO</Text>
      <Text style={[styles.paragrafo, { fontStyle: "italic", color: "#475569" }]}>
        Análise Preliminar de Riscos (APR) — mapeamento dos GHEs cadastrados para esta obra,
        com cargos vinculados e características operacionais.
      </Text>
      {data.ghes.map((g) => (
        <GheCard key={g.id} ghe={g} />
      ))}
      <Footer data={data} />
    </Page>
  )
}

function badgeStyle(key: RiscoRow["categoria_risco_key"]) {
  return {
    ...styles.badgeRisco,
    backgroundColor: key ? COLOR_RISCO_BG[key] ?? "#64748b" : "#94a3b8",
  }
}

function AnexoIIIRiscos({ data }: { data: PgrFo121Data }) {
  if (data.riscos.length === 0) return null
  return (
    <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
      <Header data={data} />
      <Text style={styles.h1}>
        ANEXO III — RECONHECIMENTO E CLASSIFICAÇÃO DA EXPOSIÇÃO AOS RISCOS AMBIENTAIS
      </Text>
      <View style={styles.table}>
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: 50 }]}>GHE</Text>
          <Text style={[styles.th, { width: 50 }]}>Categoria</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>Agente ambiental</Text>
          <Text style={[styles.th, { width: 56 }]}>Cód. eSocial</Text>
          <Text style={[styles.th, { flex: 1.6 }]}>Fontes geradoras</Text>
          <Text style={[styles.th, { width: 70 }]}>Trajetória</Text>
          <Text style={[styles.th, { width: 70 }]}>Via ingresso</Text>
          <Text style={[styles.th, { flex: 1.8 }]}>Possíveis danos</Text>
          <Text style={[styles.th, { width: 60 }]}>Exposição</Text>
          <Text style={[styles.thLast, { width: 60 }]}>Risco final</Text>
        </View>
        {data.riscos.map((r, i) => (
          <View key={i} style={i === data.riscos.length - 1 ? styles.trLast : styles.tr} wrap={false}>
            <Text style={[styles.tdMono, { width: 50 }]}>{r.ghe_codigo}</Text>
            <Text style={[styles.td, { width: 50 }]}>{r.categoria_label}</Text>
            <Text style={[styles.td, { flex: 1.4 }]}>{r.agente_ambiental}</Text>
            <Text style={[styles.tdMono, { width: 56 }]}>{r.codigo_esocial ?? "—"}</Text>
            <Text style={[styles.td, { flex: 1.6 }]}>{r.fontes_geradoras ?? "—"}</Text>
            <Text style={[styles.td, { width: 70 }]}>{r.trajetoria ?? "—"}</Text>
            <Text style={[styles.td, { width: 70 }]}>{r.via_ingresso ?? "—"}</Text>
            <Text style={[styles.td, { flex: 1.8 }]}>{r.possiveis_danos ?? "—"}</Text>
            <Text style={[styles.td, { width: 60 }]}>{r.tipo_exposicao_label ?? "—"}</Text>
            <View style={[styles.tdLast, { width: 60, padding: 2 }]}>
              {r.categoria_risco_label ? (
                <Text style={badgeStyle(r.categoria_risco_key)}>{r.categoria_risco_label}</Text>
              ) : (
                <Text>—</Text>
              )}
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.small, { marginTop: 6 }]}>
        Obs.: a classificação é qualitativa (tipo de exposição × categoria de risco).
        Códigos eSocial vinculados à Tabela 24 — itens marcados com placeholder genérico
        deverão ser revistos quando o catálogo oficial for habilitado.
      </Text>
      <Footer data={data} />
    </Page>
  )
}

function AnexoVIMedidas({ data }: { data: PgrFo121Data }) {
  if (data.medidas.length === 0) return null
  return (
    <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
      <Header data={data} />
      <Text style={styles.h1}>
        ANEXO VI — MEDIDAS EXISTENTES E RECOMENDADAS PARA CONTROLE DA EXPOSIÇÃO
      </Text>
      <View style={styles.table}>
        <View style={styles.tr} fixed>
          <Text style={[styles.th, { width: 50 }]}>GHE</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Agente</Text>
          <Text style={[styles.th, { width: 76 }]}>Tipo</Text>
          <Text style={[styles.th, { width: 70 }]}>NIOSH</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>Ação</Text>
          <Text style={[styles.th, { flex: 1.8 }]}>Detalhamento</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Abrangência</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Periodicidade</Text>
          <Text style={[styles.thLast, { flex: 0.8 }]}>Status</Text>
        </View>
        {data.medidas.map((m: MedidaRow, i) => (
          <View key={i} style={i === data.medidas.length - 1 ? styles.trLast : styles.tr} wrap={false}>
            <Text style={[styles.tdMono, { width: 50 }]}>{m.ghe_codigo ?? "Todos"}</Text>
            <Text style={[styles.td, { flex: 1.2 }]}>{m.agente_ambiental ?? "—"}</Text>
            <Text style={[styles.td, { width: 76 }]}>{m.tipo_medida_label}</Text>
            <Text style={[styles.td, { width: 70 }]}>
              {m.nivel_niosh ? `${m.nivel_niosh}. ${m.nivel_niosh_label}` : "—"}
            </Text>
            <Text style={[styles.td, { flex: 1.4 }]}>{m.acao}</Text>
            <Text style={[styles.td, { flex: 1.8 }]}>{m.detalhamento ?? "—"}</Text>
            <Text style={[styles.td, { flex: 1.2 }]}>{m.abrangencia ?? "—"}</Text>
            <Text style={[styles.td, { flex: 0.9 }]}>{m.periodicidade ?? "—"}</Text>
            <Text style={[styles.tdLast, { flex: 0.8 }]}>{m.status ?? "—"}</Text>
          </View>
        ))}
      </View>
      <Footer data={data} />
    </Page>
  )
}

function AnexoVIIEpis({ data }: { data: PgrFo121Data }) {
  const ghesComEpi = data.ghes.filter((g) => g.epis.length > 0)
  if (ghesComEpi.length === 0) return null
  return (
    <Page size="A4" style={styles.page}>
      <Header data={data} />
      <Text style={styles.h1}>ANEXO VII — LISTA DE EPI POR GHE / FUNÇÃO</Text>
      <Text style={[styles.paragrafo, { fontStyle: "italic", color: "#475569" }]}>
        EPIs obrigatórios e eventuais por GHE. Usos: P = Permanente · E = Eventual ·
        AE = Atividade específica.
      </Text>
      {ghesComEpi.map((g) => (
        <View key={g.id} style={styles.gheCard} wrap={false}>
          <View style={styles.gheCardHeader}>
            <Text style={styles.gheCodigo}>{g.codigo}</Text>
            <Text style={styles.gheDescricao}>{g.descricao}</Text>
          </View>
          <View style={[styles.table, { marginBottom: 0 }]}>
            <View style={styles.tr}>
              <Text style={[styles.th, { flex: 2 }]}>EPI</Text>
              <Text style={[styles.th, { width: 90 }]}>Uso</Text>
              <Text style={[styles.thLast, { flex: 2 }]}>Observação</Text>
            </View>
            {g.epis.map((e: EpiRow, i) => (
              <View key={i} style={i === g.epis.length - 1 ? styles.trLast : styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>{e.epi_nome}</Text>
                <Text style={[styles.td, { width: 90 }]}>{e.uso_label}</Text>
                <Text style={[styles.tdLast, { flex: 2 }]}>{e.observacao ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <Footer data={data} />
    </Page>
  )
}

function AssinaturasPage({ data }: { data: PgrFo121Data }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header data={data} />
      <Text style={styles.h1}>ENCERRAMENTO E ASSINATURAS</Text>
      <Text style={styles.paragrafo}>
        Os abaixo assinados declaram que o presente Programa de Gerenciamento de Riscos (PGR/GRO),
        revisão {fmtRev(data.numero_revisao)}, foi elaborado em conformidade com a NR-1
        (Disposições Gerais e Gerenciamento de Riscos Ocupacionais) e demais normas técnicas
        aplicáveis, contemplando o inventário de riscos, o plano de ação e as medidas de controle
        para o local de atividade descrito.
      </Text>
      <Text style={styles.paragrafo}>
        Data de emissão: {fmtData(data.data_emissao)}{"  "}
        | Vencimento: {fmtData(data.data_vencimento)}
      </Text>
      <View style={styles.signGroup}>
        <View style={styles.signBlock}>
          <View style={styles.signLine} />
          <Text style={styles.signNome}>{data.resp_elaboracao_nome ?? "Responsável pela Elaboração"}</Text>
          <Text style={styles.signFuncao}>
            {data.resp_elaboracao_funcao ?? "Segurança do Trabalho"}
          </Text>
          {data.resp_elaboracao_crea && (
            <Text style={styles.signCrea}>{data.resp_elaboracao_crea}</Text>
          )}
        </View>
        <View style={styles.signBlock}>
          <View style={styles.signLine} />
          <Text style={styles.signNome}>{data.resp_obra_nome ?? "Coordenação da Obra"}</Text>
          <Text style={styles.signFuncao}>
            {data.resp_obra_funcao ?? "Coordenador de Obras"}
          </Text>
          {data.resp_obra_crea && (
            <Text style={styles.signCrea}>{data.resp_obra_crea}</Text>
          )}
        </View>
      </View>
      <Footer data={data} />
    </Page>
  )
}

export async function renderPgrFo121Pdf(data: PgrFo121Data) {
  const logo = await fetchLogoAsDataUri(data.empresa_logo_url)
  return (
    <Document title={`PGR ${data.obra_nome} — Rev. ${fmtRev(data.numero_revisao)}`}>
      <CapaPage data={data} logo={logo} />
      <CaracterizacaoPage data={data} />
      <AnexoICronograma data={data} />
      <AnexoIIGhes data={data} />
      <AnexoIIIRiscos data={data} />
      <AnexoVIMedidas data={data} />
      <AnexoVIIEpis data={data} />
      <AssinaturasPage data={data} />
    </Document>
  )
}
