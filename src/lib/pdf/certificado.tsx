/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import QRCode from "qrcode"
import { interpolarTextoCertificado, TEXTO_CERTIFICADO_PADRAO, type CertificadoVars } from "./certificado-texto"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  borderOuter: {
    border: "3 solid #1e293b",
    flex: 1,
    padding: 30,
  },
  borderInner: {
    border: "1 solid #1e293b",
    flex: 1,
    padding: 24,
    paddingTop: 30,
    alignItems: "center",
    position: "relative",
  },
  logo: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 160,
    height: 100,
    objectFit: "contain",
  },
  empresaHeader: { fontSize: 10, color: "#475569", marginBottom: 4, textAlign: "center" },
  empresaNome: { fontSize: 14, fontWeight: "bold", color: "#1e293b", textAlign: "center", marginBottom: 2 },
  certificadoTitulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 2,
  },
  certificadoSubtitulo: { fontSize: 12, color: "#475569", marginBottom: 22 },
  textoCorpo: {
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 18,
  },
  nomeAluno: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
    borderBottom: "1 solid #94a3b8",
    paddingBottom: 4,
    minWidth: 400,
  },
  cpfAluno: { fontSize: 10, color: "#64748b", marginBottom: 16, textAlign: "center" },
  dataLocal: { fontSize: 10, marginTop: 10, textAlign: "center" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
    width: "100%",
  },
  assinaturaBloco: { alignItems: "center", width: 200 },
  assinaturaLinha: { width: 180, borderTop: "1 solid #111", marginBottom: 4 },
  assinaturaNome: { fontSize: 10, fontWeight: "bold" },
  assinaturaCargo: { fontSize: 9, color: "#64748b" },
  qrBox: { width: 70, height: 70 },
  numeroCertif: { fontSize: 9, color: "#64748b", marginTop: 4 },

  versoTitulo: { fontSize: 14, fontWeight: "bold", marginBottom: 12, textAlign: "center", color: "#1e293b" },
  versoSecTitulo: { fontSize: 11, fontWeight: "bold", marginBottom: 4, color: "#1e293b" },
  versoItem: { fontSize: 10, marginBottom: 3, paddingLeft: 12 },
  versoParagrafo: { fontSize: 10, marginBottom: 8, lineHeight: 1.4 },
  versoFooter: { fontSize: 8, color: "#64748b", textAlign: "center", marginTop: "auto" },
})

export type CertificadoData = {
  numero: string
  aluno_nome: string
  aluno_cpf: string
  curso_titulo: string
  nr_referencia?: string | null
  carga_horaria: number
  conteudo_programatico?: string[] | null
  data_realizacao: string
  data_vencimento?: string | null
  cidade?: string
  instrutor_nome?: string | null
  instrutor_cargo?: string
  entidade?: string | null
  empresa_razao_social: string
  empresa_cnpj: string
  empresa_logo_url?: string | null
  texto_certificado_template?: string | null
  validacao_url?: string
}

function formatPtBr(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, dd] = iso.slice(0, 10).split("-")
  return `${dd}/${m}/${y}`
}

/**
 * Baixa o logo da empresa e converte para data URI.
 * @react-pdf/renderer funciona melhor com data URI (imagens embedadas)
 * do que com URLs externas (podem falhar por CORS/timeout em render server-side).
 */
async function fetchLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null
    // @react-pdf/renderer não suporta SVG diretamente — exige raster
    if (contentType.includes("svg")) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function renderCertificadoPdf(d: CertificadoData) {
  const qr = d.validacao_url ? await QRCode.toDataURL(d.validacao_url, { margin: 1, width: 140 }) : undefined
  const logo = d.empresa_logo_url ? await fetchLogoAsDataUri(d.empresa_logo_url) : null

  const vars: CertificadoVars = {
    aluno_nome: d.aluno_nome,
    aluno_cpf: d.aluno_cpf,
    curso_titulo: d.curso_titulo,
    nr_referencia: d.nr_referencia ?? null,
    carga_horaria: d.carga_horaria,
    data_realizacao: d.data_realizacao,
    data_vencimento: d.data_vencimento ?? null,
    cidade: d.cidade ?? "São Paulo",
    entidade: d.entidade ?? null,
    instrutor: d.instrutor_nome ?? null,
    empresa: d.empresa_razao_social,
  }

  const template = d.texto_certificado_template && d.texto_certificado_template.trim().length > 0
    ? d.texto_certificado_template
    : TEXTO_CERTIFICADO_PADRAO

  const textoCorpo = interpolarTextoCertificado(template, vars)

  return (
    <Document title={`Certificado — ${d.curso_titulo}`}>
      {/* FRENTE */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderOuter}>
          <View style={styles.borderInner}>
            {logo && <Image src={logo} style={styles.logo} />}
            <Text style={styles.empresaHeader}>CERTIFICADO EMITIDO POR</Text>
            <Text style={styles.empresaNome}>{d.empresa_razao_social}</Text>
            <Text style={{ fontSize: 9, color: "#64748b" }}>CNPJ {d.empresa_cnpj}</Text>

            <Text style={styles.certificadoTitulo}>CERTIFICADO</Text>
            <Text style={styles.certificadoSubtitulo}>DE PARTICIPAÇÃO EM TREINAMENTO</Text>

            <Text style={styles.nomeAluno}>{d.aluno_nome}</Text>
            <Text style={styles.cpfAluno}>CPF {d.aluno_cpf}</Text>

            <Text style={styles.textoCorpo}>{textoCorpo}</Text>

            <Text style={styles.dataLocal}>
              {vars.cidade}, {formatPtBr(d.data_realizacao)}
            </Text>

            <View style={styles.footer}>
              <View style={styles.assinaturaBloco}>
                <View style={styles.assinaturaLinha} />
                <Text style={styles.assinaturaNome}>{d.instrutor_nome ?? "Instrutor"}</Text>
                <Text style={styles.assinaturaCargo}>{d.instrutor_cargo ?? "Instrutor responsável"}</Text>
              </View>

              {qr && (
                <View style={{ alignItems: "center" }}>
                  <Image src={qr} style={styles.qrBox} />
                  <Text style={styles.numeroCertif}>Cert. Nº {d.numero}</Text>
                </View>
              )}

              <View style={styles.assinaturaBloco}>
                <View style={styles.assinaturaLinha} />
                <Text style={styles.assinaturaNome}>Coordenação</Text>
                <Text style={styles.assinaturaCargo}>SST — {d.empresa_razao_social}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* VERSO */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderOuter}>
          <View style={{ ...styles.borderInner, alignItems: "stretch" }}>
            <Text style={styles.versoTitulo}>CONTEÚDO PROGRAMÁTICO E BASE LEGAL</Text>

            <Text style={styles.versoSecTitulo}>Treinamento</Text>
            <Text style={styles.versoParagrafo}>
              {d.curso_titulo}{d.nr_referencia ? ` — ${d.nr_referencia}` : ""} · Carga horária: {d.carga_horaria}h
            </Text>

            <Text style={styles.versoSecTitulo}>Conteúdo programático</Text>
            {(d.conteudo_programatico ?? []).length > 0 ? (
              (d.conteudo_programatico ?? []).map((item, i) => (
                <Text key={i} style={styles.versoItem}>• {item}</Text>
              ))
            ) : (
              <Text style={styles.versoItem}>• Conforme ementa da NR aplicável e requisitos do empregador.</Text>
            )}

            <Text style={{ ...styles.versoSecTitulo, marginTop: 12 }}>Base legal</Text>
            <Text style={styles.versoParagrafo}>
              Treinamento ministrado em conformidade com a Norma Regulamentadora aplicável
              {d.nr_referencia ? ` (${d.nr_referencia})` : ""}, Portaria 3.214/78 — MTE, e demais dispositivos legais vigentes.
            </Text>

            <Text style={styles.versoSecTitulo}>Empresa emissora</Text>
            <Text style={styles.versoParagrafo}>
              {d.empresa_razao_social} · CNPJ {d.empresa_cnpj}
            </Text>

            {d.data_vencimento && (
              <>
                <Text style={styles.versoSecTitulo}>Reciclagem</Text>
                <Text style={styles.versoParagrafo}>
                  Este certificado é válido até {formatPtBr(d.data_vencimento)}. Após este prazo, é necessário realizar
                  treinamento de reciclagem conforme exigência da NR aplicável.
                </Text>
              </>
            )}

            <Text style={styles.versoFooter}>
              Certificado Nº {d.numero} · Validação em: {d.validacao_url ?? "—"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
