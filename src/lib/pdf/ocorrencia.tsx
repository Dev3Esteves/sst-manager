import { Text, View } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"
import type { OcorrenciaPdfData } from "./ocorrencia-builder"
import { formatCNPJ } from "@/lib/validations/shared"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

function gravidadeColor(g: string | null): string {
  if (g === "fatal" || g === "grave") return "#dc2626"
  if (g === "moderado") return "#f97316"
  if (g === "leve") return "#f59e0b"
  return "#64748b"
}

const ACAO_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
}

export async function renderOcorrenciaPdf(data: OcorrenciaPdfData, appUrl: string, ocorrenciaId: string) {
  const validacaoUrl = `${appUrl}/ocorrencias/${ocorrenciaId}`
  const qr = await buildQrDataUrl(validacaoUrl)

  const numero = String(data.numero_sequencial).padStart(4, "0")

  const meta: DocumentoMeta = {
    numero: `OC-${numero}`,
    titulo: `Relatório de Ocorrência — ${data.tipo_label}`,
    empresaRazaoSocial: data.empresa_razao_social,
    empresaCnpj: formatCNPJ(data.empresa_cnpj),
    localTrabalho: data.local,
    dataEmissao: formatDate(data.data_ocorrencia),
  }

  const inv = data.investigacao
  let sectionNum = 1

  return (
    <BasePdfDocument meta={meta} qrDataUrl={qr}>
      {/* Dados da ocorrência */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>{sectionNum++}. Dados da Ocorrência</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Tipo</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{data.tipo_label}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Data</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{formatDate(data.data_ocorrencia)}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Local</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0 }]}>{data.local}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Envolvido</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{data.colaborador_nome ?? "Não informado"}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Status</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0, textTransform: "capitalize" }]}>{data.status}</Text>
          </View>
          {data.gravidade && (
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Gravidade</Text>
              <Text style={[pdfStyles.tableCell, { flex: 3, borderRightWidth: 0, color: gravidadeColor(data.gravidade), fontWeight: "bold" }]}>
                {data.gravidade_label}
              </Text>
            </View>
          )}
          {(data.parte_corpo_atingida || data.natureza_lesao) && (
            <View style={pdfStyles.tableRow}>
              {data.parte_corpo_atingida && (
                <>
                  <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Parte atingida</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{data.parte_corpo_atingida}</Text>
                </>
              )}
              {data.natureza_lesao && (
                <>
                  <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Natureza da lesão</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{data.natureza_lesao}</Text>
                </>
              )}
            </View>
          )}
          {(data.agente_causador || data.dias_afastamento != null) && (
            <View style={pdfStyles.tableRowLast}>
              {data.agente_causador && (
                <>
                  <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Agente causador</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{data.agente_causador}</Text>
                </>
              )}
              {data.dias_afastamento != null && (
                <>
                  <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Dias afastamento</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{data.dias_afastamento}</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Descrição */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>{sectionNum++}. Descrição</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{data.descricao}</Text>
      </View>

      {/* Investigação — 5 Porquês */}
      {inv && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{sectionNum++}. Investigação — 5 Porquês</Text>

          <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 4 }}>Problema:</Text>
          <Text style={{ fontSize: 9, marginBottom: 8 }}>{inv.problema}</Text>

          <View style={pdfStyles.table}>
            {inv.porques.map((p, i) => {
              const isLast = i === inv.porques.length - 1
              return (
                <View style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} key={i} wrap={false}>
                  <Text style={[pdfStyles.tableCellHead, { flex: 0.8, textAlign: "center" }]}>
                    Por quê {i + 1}?
                  </Text>
                  <Text style={[pdfStyles.tableCell, { flex: 4, borderRightWidth: 0 }]}>{p}</Text>
                </View>
              )
            })}
          </View>

          <View style={{ marginTop: 8, backgroundColor: "#fef2f2", padding: 8, borderRadius: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#dc2626", marginBottom: 2 }}>Causa raiz:</Text>
            <Text style={{ fontSize: 9 }}>{inv.causa_raiz}</Text>
          </View>
        </View>
      )}

      {/* Ações corretivas */}
      {data.acoes_corretivas.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>
            {sectionNum++}. Ações Corretivas ({data.acoes_corretivas.length})
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCellHead, { flex: 0.3, textAlign: "center" }]}>#</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 3 }]}>Descrição</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 1.2 }]}>Responsável</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 0.8, textAlign: "center" }]}>Prazo</Text>
              <Text style={[pdfStyles.tableCellHead, { flex: 1, borderRightWidth: 0, textAlign: "center" }]}>Status</Text>
            </View>
            {data.acoes_corretivas.map((a, i) => {
              const isLast = i === data.acoes_corretivas.length - 1
              return (
                <View style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} key={i} wrap={false}>
                  <Text style={[pdfStyles.tableCell, { flex: 0.3, textAlign: "center" }]}>{i + 1}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{a.descricao}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{a.responsavel}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 0.8, textAlign: "center" }]}>{formatDate(a.prazo)}</Text>
                  <Text style={[pdfStyles.tableCell, { flex: 1, borderRightWidth: 0, textAlign: "center", fontSize: 8 }]}>
                    {ACAO_STATUS_LABEL[a.status] ?? a.status}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Sem investigação */}
      {!inv && data.acoes_corretivas.length === 0 && (
        <View style={pdfStyles.section}>
          <Text style={[pdfStyles.sectionTitle, { backgroundColor: "#fef9c3", color: "#92400e" }]}>
            {sectionNum++}. Investigação Pendente
          </Text>
          <Text style={{ fontSize: 9, color: "#92400e", fontStyle: "italic" }}>
            A investigação desta ocorrência ainda não foi realizada.
          </Text>
        </View>
      )}
    </BasePdfDocument>
  )
}
