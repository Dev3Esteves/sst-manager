/* eslint-disable jsx-a11y/alt-text */
import { Text, View, Image } from "@react-pdf/renderer"
import { BasePdfDocument, pdfStyles, buildQrDataUrl, type DocumentoMeta } from "./base"

export type DdsParticipantePdf = {
  nome: string
  cpf?: string | null
  cargo?: string | null
  assinatura_url?: string | null
}

export type DdsConteudo = {
  tema: string
  data_dds: string
  hora_inicio?: string | null
  duracao_minutos: number
  local: string
  mediador_nome: string
  mediador_cargo?: string | null
  topicos: string[]
  observacoes?: string | null
  participantes: DdsParticipantePdf[]
  assinatura_mediador_url?: string | null
}

async function fetchImageAsDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function renderDdsPdf(meta: DocumentoMeta, conteudo: DdsConteudo) {
  const qr = meta.validacaoUrl ? await buildQrDataUrl(meta.validacaoUrl) : undefined

  // Baixa todas as assinaturas em paralelo para embedar no PDF como data URI
  const assinaturasResolvidas = await Promise.all([
    fetchImageAsDataUri(conteudo.assinatura_mediador_url),
    ...conteudo.participantes.map((p) => fetchImageAsDataUri(p.assinatura_url)),
  ])
  const assinaturaMediadorData = assinaturasResolvidas[0]
  const participantesComData = conteudo.participantes.map((p, i) => ({
    ...p,
    assinatura_data: assinaturasResolvidas[i + 1],
  }))

  const tituloDoc = `DDS — ${conteudo.tema}`
  const metaFinal: DocumentoMeta = { ...meta, titulo: tituloDoc }

  return (
    <BasePdfDocument meta={metaFinal} qrDataUrl={qr}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>1. Identificação do DDS</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Tema</Text>
            <Text style={[pdfStyles.tableCell, { flex: 5, borderRightWidth: 0 }]}>{conteudo.tema}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Data</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{formatDate(conteudo.data_dds)}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Horário</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0 }]}>
              {conteudo.hora_inicio ?? "—"}
            </Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Local</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{conteudo.local}</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Duração</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0 }]}>
              {conteudo.duracao_minutos} min
            </Text>
          </View>
          <View style={pdfStyles.tableRowLast}>
            <Text style={[pdfStyles.tableCellHead, { flex: 1 }]}>Mediador</Text>
            <Text style={[pdfStyles.tableCell, { flex: 5, borderRightWidth: 0 }]}>
              {conteudo.mediador_nome}
              {conteudo.mediador_cargo ? ` — ${conteudo.mediador_cargo}` : ""}
            </Text>
          </View>
        </View>
      </View>

      {conteudo.topicos.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>2. Tópicos abordados</Text>
          {conteudo.topicos.map((t, i) => (
            <Text key={i} style={{ fontSize: 9, marginBottom: 2, paddingLeft: 10 }}>
              • {t}
            </Text>
          ))}
        </View>
      )}

      {conteudo.observacoes && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>
            {conteudo.topicos.length > 0 ? "3. " : "2. "}Observações
          </Text>
          <Text style={{ fontSize: 9 }}>{conteudo.observacoes}</Text>
        </View>
      )}

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>
          {(conteudo.topicos.length > 0 ? 1 : 0) + (conteudo.observacoes ? 1 : 0) + 2}. Lista de presença ({participantesComData.length})
        </Text>
        <Text style={{ fontSize: 9, marginBottom: 4, color: "#64748b" }}>
          Os participantes abaixo declaram ter recebido as orientações de segurança relativas ao tema acima.
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCellHead, { flex: 0.3, textAlign: "center" }]}>#</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 2.5 }]}>Nome</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.2 }]}>CPF</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 1.5 }]}>Cargo</Text>
            <Text style={[pdfStyles.tableCellHead, { flex: 2, borderRightWidth: 0, textAlign: "center" }]}>Assinatura</Text>
          </View>
          {participantesComData.map((p, i) => {
            const isLast = i === participantesComData.length - 1
            return (
              <View style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} key={i} wrap={false}>
                <Text style={[pdfStyles.tableCell, { flex: 0.3, textAlign: "center" }]}>{i + 1}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>{p.nome}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{p.cpf ?? "—"}</Text>
                <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>{p.cargo ?? "—"}</Text>
                <View style={[pdfStyles.tableCell, { flex: 2, borderRightWidth: 0, padding: 0, justifyContent: "center", alignItems: "center", minHeight: 32 }]}>
                  {p.assinatura_data ? (
                    <Image src={p.assinatura_data} style={{ height: 28, width: "90%", objectFit: "contain" }} />
                  ) : (
                    <Text style={{ fontSize: 8, color: "#94a3b8", fontStyle: "italic" }}>(sem assinatura)</Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Mediador responsável</Text>
        <View style={{ ...pdfStyles.signatureBlock, maxWidth: 260, alignSelf: "flex-start", marginTop: 10 }}>
          {assinaturaMediadorData && <Image src={assinaturaMediadorData} style={pdfStyles.signatureImg} />}
          <Text style={{ fontSize: 9, fontWeight: "bold" }}>{conteudo.mediador_nome}</Text>
          <Text style={{ fontSize: 8, color: "#64748b" }}>{conteudo.mediador_cargo ?? "Mediador"}</Text>
        </View>
      </View>
    </BasePdfDocument>
  )
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}
