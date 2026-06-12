import { Text, View, StyleSheet } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"

export type RelatorioGhe = {
  codigo: string
  descricao: string
  numExpostos: number | null
  respondentes: number
}

export type RelatorioResultado = {
  gheCodigo: string
  dominio: string
  dimensao: string
  score: number | null
  classificacao: "verde" | "amarelo" | "vermelho" | null
  n: number
  suprimido: boolean
}

export type RelatorioPsiData = {
  empresaRazaoSocial: string
  empresaCnpj: string
  obraNome: string
  pgrRevisao: number | null
  campanhaTitulo: string
  instrumentoNome: string
  versao: string
  dataInicio: string
  dataFim: string | null
  status: string
  minRespondentes: number
  ghes: RelatorioGhe[]
  resultados: RelatorioResultado[]
}

const COR: Record<string, string> = { verde: "#2e9e5b", amarelo: "#c98a00", vermelho: "#BE3A31" }
const ROTULO: Record<string, string> = { verde: "Baixo", amarelo: "Médio", vermelho: "Alto" }

const s = StyleSheet.create({
  p: { fontSize: 9.5, lineHeight: 1.5, color: "#374151", marginBottom: 4 },
  kpis: { flexDirection: "row", gap: 10, marginBottom: 10 },
  kpi: { flex: 1, border: "0.5 solid #cbd5e1", borderRadius: 4, padding: 8 },
  kpiNum: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  kpiLbl: { fontSize: 8, color: "#64748b" },
  pill: { color: "#fff", fontSize: 8, fontWeight: "bold", padding: "2 6", borderRadius: 8 },
  note: { fontSize: 8.5, color: "#475569", lineHeight: 1.5 },
})

function fmt(d: string | null | undefined): string {
  if (!d) return "—"
  const [y, m, dd] = d.slice(0, 10).split("-")
  return `${dd}/${m}/${y}`
}

function Cell({ w, head, children, color }: { w: string; head?: boolean; children: React.ReactNode; color?: string }) {
  return (
    <View style={[head ? pdfStyles.tableCellHead : pdfStyles.tableCell, { width: w }]}>
      <Text style={color ? { color, fontWeight: "bold" } : undefined}>{children}</Text>
    </View>
  )
}

/** Monta o elemento React-PDF do relatório da campanha psicossocial. */
export async function renderPsicossocialRelatorioPdf(
  data: RelatorioPsiData,
  appUrl: string,
  campanhaId: string,
) {
  const meta: DocumentoMeta = {
    numero: `PSI-${campanhaId.slice(0, 8).toUpperCase()}`,
    titulo: "Relatório de Avaliação de Riscos Psicossociais (NR-01)",
    empresaRazaoSocial: data.empresaRazaoSocial,
    empresaCnpj: data.empresaCnpj,
    localTrabalho: `${data.obraNome}${data.pgrRevisao != null ? ` · PGR rev ${data.pgrRevisao}` : ""}`,
    dataEmissao: new Date().toLocaleDateString("pt-BR"),
  }
  const qr = appUrl ? await buildQrDataUrl(`${appUrl}/psicossocial/${campanhaId}`) : undefined

  const validos = data.resultados.filter((r) => !r.suprimido)
  const altos = validos.filter((r) => r.classificacao === "vermelho")
  const medios = validos.filter((r) => r.classificacao === "amarelo")
  const totalRespostas = data.ghes.reduce((acc, g) => acc + g.respondentes, 0)
  const prioritarios = [...altos, ...medios].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  )

  return (
    <BasePdfDocument meta={meta} qrDataUrl={qr}>
      {/* Identificação */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Identificação da avaliação</Text>
        <Text style={s.p}>
          Campanha: {data.campanhaTitulo} · Instrumento: {data.instrumentoNome} (versão {data.versao}) ·
          Período: {fmt(data.dataInicio)} a {fmt(data.dataFim)} · Situação: {data.status}.
        </Text>
        <Text style={s.note}>
          Avaliação dos Fatores de Risco Psicossociais Relacionados ao Trabalho (FRPRT), conforme
          NR-01 (Portaria MTE 1.419/2024) e NR-17. Análise por Grupo Homogêneo de Exposição (GHE),
          com agregação anônima (mínimo de {data.minRespondentes} respondentes por GHE).
        </Text>
      </View>

      {/* Resumo executivo */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Resumo executivo</Text>
        <View style={s.kpis}>
          <View style={s.kpi}><Text style={s.kpiNum}>{data.ghes.length}</Text><Text style={s.kpiLbl}>GHE avaliados</Text></View>
          <View style={s.kpi}><Text style={s.kpiNum}>{totalRespostas}</Text><Text style={s.kpiLbl}>Respostas anônimas</Text></View>
          <View style={s.kpi}><Text style={[s.kpiNum, { color: COR.vermelho }]}>{altos.length}</Text><Text style={s.kpiLbl}>Dimensões risco ALTO</Text></View>
          <View style={s.kpi}><Text style={[s.kpiNum, { color: COR.amarelo }]}>{medios.length}</Text><Text style={s.kpiLbl}>Dimensões risco MÉDIO</Text></View>
        </View>
      </View>

      {/* Adesão por GHE */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>3. Adesão por GHE</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Cell w="22%" head>GHE</Cell>
            <Cell w="42%" head>Descrição</Cell>
            <Cell w="18%" head>Expostos</Cell>
            <Cell w="18%" head>Respostas</Cell>
          </View>
          {data.ghes.map((g, i) => (
            <View key={i} style={i === data.ghes.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Cell w="22%">{g.codigo}</Cell>
              <Cell w="42%">{g.descricao}</Cell>
              <Cell w="18%">{g.numExpostos ?? "—"}</Cell>
              <Cell w="18%">{g.respondentes}</Cell>
            </View>
          ))}
        </View>
      </View>

      {/* Resultados por dimensão */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>4. Resultados por GHE e dimensão (score de risco 0–100)</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Cell w="16%" head>GHE</Cell>
            <Cell w="44%" head>Dimensão</Cell>
            <Cell w="14%" head>Score</Cell>
            <Cell w="14%" head>N</Cell>
            <Cell w="12%" head>Nível</Cell>
          </View>
          {data.resultados.map((r, i) => (
            <View key={i} wrap={false} style={i === data.resultados.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Cell w="16%">{r.gheCodigo}</Cell>
              <Cell w="44%">{r.dimensao}</Cell>
              <Cell w="14%">{r.suprimido ? "—" : r.score}</Cell>
              <Cell w="14%">{r.n}</Cell>
              <Cell w="12%" color={r.classificacao ? COR[r.classificacao] : "#64748b"}>
                {r.suprimido ? "suprimido" : r.classificacao ? ROTULO[r.classificacao] : "—"}
              </Cell>
            </View>
          ))}
        </View>
        <Text style={[s.note, { marginTop: 4 }]}>
          Classificação por tercis: 0–33 Baixo (verde) · 34–66 Médio (amarelo) · 67–100 Alto (vermelho).
          GHE com menos de {data.minRespondentes} respondentes é suprimido para preservar o anonimato.
        </Text>
      </View>

      {/* Fatores prioritários */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>5. Fatores prioritários (médio/alto) — Inventário de Riscos</Text>
        {prioritarios.length === 0 ? (
          <Text style={s.p}>Nenhuma dimensão classificada como risco médio ou alto nesta campanha.</Text>
        ) : (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Cell w="16%" head>GHE</Cell>
              <Cell w="50%" head>Fator (dimensão)</Cell>
              <Cell w="14%" head>Score</Cell>
              <Cell w="20%" head>Nível</Cell>
            </View>
            {prioritarios.map((r, i) => (
              <View key={i} wrap={false} style={i === prioritarios.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
                <Cell w="16%">{r.gheCodigo}</Cell>
                <Cell w="50%">{r.dimensao}</Cell>
                <Cell w="14%">{r.score}</Cell>
                <Cell w="20%" color={r.classificacao ? COR[r.classificacao] : undefined}>
                  {r.classificacao ? ROTULO[r.classificacao] : "—"}
                </Cell>
              </View>
            ))}
          </View>
        )}
        <Text style={[s.note, { marginTop: 4 }]}>
          Estes fatores devem ser tratados no Inventário de Riscos do PGR (categoria psicossocial),
          com plano de ação (PDCA) e reavaliação periódica.
        </Text>
      </View>

      {/* Metodologia */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>6. Nota metodológica e conformidade</Text>
        <Text style={s.note}>
          Instrumento {data.instrumentoNome}, escala Likert convertida para 0–100, com aplicação da
          direção de risco por dimensão. A avaliação
          mede condições de trabalho (estressores), não sintomas individuais. Os desfechos (estresse,
          burnout, saúde) são monitorados à parte e não compõem o inventário. Coleta anônima, sem vínculo
          com a identidade do trabalhador, e resultados apresentados apenas de forma agregada por GHE
          (LGPD). Base legal: NR-01 item 1.5 (GRO) e NR-17.
        </Text>
      </View>

      {/* Assinaturas */}
      <View style={pdfStyles.signatureRow}>
        <View style={pdfStyles.signatureBlock}><Text>Responsável SST / SESMT</Text></View>
        <View style={pdfStyles.signatureBlock}><Text>Responsável pela obra</Text></View>
      </View>
    </BasePdfDocument>
  )
}
