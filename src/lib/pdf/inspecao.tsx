import { Text, View } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"
import type { InspecaoPdfData } from "./inspecao-builder"
import { formatCNPJ } from "@/lib/validations/shared"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

function conformeLabel(c: "sim" | "nao" | "na"): string {
  if (c === "sim") return "CONFORME"
  if (c === "nao") return "NÃO CONFORME"
  return "N/A"
}

function conformeColor(c: "sim" | "nao" | "na"): string {
  if (c === "sim") return "#16a34a"
  if (c === "nao") return "#dc2626"
  return "#64748b"
}

function conformidadeBgColor(p: number | null): string {
  if (p === null) return "#94a3b8"
  if (p >= 90) return "#16a34a"
  if (p >= 70) return "#f59e0b"
  if (p >= 50) return "#f97316"
  return "#dc2626"
}

export async function renderInspecaoPdf(data: InspecaoPdfData, appUrl: string, inspecaoId: string) {
  const validacaoUrl = `${appUrl}/inspecoes/${inspecaoId}`
  const qr = await buildQrDataUrl(validacaoUrl)

  const meta: DocumentoMeta = {
    numero: `INSP-${formatDate(data.data_inspecao).replace(/\//g, "")}`,
    titulo: `Relatório de Inspeção — ${data.template_titulo}`,
    empresaRazaoSocial: data.empresa_razao_social,
    empresaCnpj: formatCNPJ(data.empresa_cnpj),
    localTrabalho: data.local,
    dataEmissao: formatDate(data.data_inspecao),
  }

  const respostas = data.respostas
  const grupos = new Map<string, typeof respostas>()
  for (const r of respostas) {
    const g = r.grupo ?? "Geral"
    const list = grupos.get(g) ?? []
    list.push(r)
    grupos.set(g, list)
  }

  const totalConsiderados = respostas.filter(r => r.conforme !== "na").length
  const totalConformes = respostas.filter(r => r.conforme === "sim").length
  const totalNaoConformes = respostas.filter(r => r.conforme === "nao").length
  const totalNa = respostas.filter(r => r.conforme === "na").length

  return (
    <BasePdfDocument meta={meta} qrDataUrl={qr}>
      {/* Resumo */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Resumo da Inspeção</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Template</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0 }]}>
              {data.template_titulo}
              {data.template_categoria ? ` (${data.template_categoria})` : ""}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Inspetor</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{data.inspetor_nome ?? "—"}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Status</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{data.status}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Total de itens</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{respostas.length}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Itens avaliados</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{totalConsiderados}</Text>
          </View>
          <View style={pdfStyles.tableRowLast}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Conformes</Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.5, color: "#16a34a" }]}>{totalConformes}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Não conformes</Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.5, color: "#dc2626" }]}>{totalNaoConformes}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 0.5 }]}>N/A</Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.5, borderRightWidth: 0 }]}>{totalNa}</Text>
          </View>
        </View>
      </View>

      {/* Percentual de conformidade */}
      <View style={[pdfStyles.section, { alignItems: "center" }]}>
        <View style={{
          backgroundColor: conformidadeBgColor(data.percentual_conformidade),
          paddingVertical: 6,
          paddingHorizontal: 20,
          borderRadius: 4,
        }}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold", textAlign: "center" }}>
            Conformidade: {data.percentual_conformidade ?? 0}%
          </Text>
        </View>
      </View>

      {/* Checklist por grupo */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>2. Checklist Detalhado</Text>
        {Array.from(grupos.entries()).map(([grupo, itens], gi) => (
          <View key={gi} style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#334155", marginBottom: 2, marginTop: 4 }}>
              {grupo}
            </Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCellHead, { flex: 0.3, textAlign: "center" }]}>#</Text>
                <Text style={[pdfStyles.tableCellHead, { flex: 3 }]}>Item</Text>
                <Text style={[pdfStyles.tableCellHead, { flex: 1, textAlign: "center" }]}>Resultado</Text>
                <Text style={[pdfStyles.tableCellHead, { flex: 2, borderRightWidth: 0 }]}>Observação</Text>
              </View>
              {itens.map((r, i) => {
                const isLast = i === itens.length - 1
                return (
                  <View style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} key={i} wrap={false}>
                    <Text style={[pdfStyles.tableCell, { flex: 0.3, textAlign: "center" }]}>{r.item_index + 1}</Text>
                    <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{r.pergunta}</Text>
                    <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center", color: conformeColor(r.conforme), fontWeight: "bold", fontSize: 8 }]}>
                      {conformeLabel(r.conforme)}
                    </Text>
                    <Text style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0, fontSize: 8 }]}>
                      {r.observacao ?? "—"}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Não conformidades (destaque) */}
      {totalNaoConformes > 0 && (
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, { backgroundColor: "#fef2f2", color: "#dc2626" }]}>
            3. Não Conformidades ({totalNaoConformes})
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCellHead, { flex: 0.3, textAlign: "center" }]}>#</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Grupo</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 2 }]}>Item</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 2, borderRightWidth: 0 }]}>Observação</Text>
            </View>
            {respostas.filter(r => r.conforme === "nao").map((r, i, arr) => {
              const isLast = i === arr.length - 1
              return (
                <View style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} key={i} wrap={false}>
                  <Text style={[pdfStyles.tableCell, { flex: 0.3, textAlign: "center" }]}>{i + 1}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{r.grupo ?? "Geral"}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{r.pergunta}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0, fontSize: 8 }]}>
                    {r.observacao ?? "—"}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Observações gerais */}
      {data.observacoes_gerais && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>
            {totalNaoConformes > 0 ? "4" : "3"}. Observações Gerais
          </Text>
          <Text style={{ fontSize: 9 }}>{data.observacoes_gerais}</Text>
        </View>
      )}
    </BasePdfDocument>
  )
}
