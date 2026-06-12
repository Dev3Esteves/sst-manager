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
  nomeBloco: {
    width: "70%",
    alignSelf: "center",
    borderBottom: "1 solid #94a3b8",
    paddingBottom: 4,
    marginBottom: 4,
  },
  nomeAluno: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
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

  versoTitulo: { fontSize: 14, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: "#1e293b" },
  versoSecTitulo: { fontSize: 11, fontWeight: "bold", marginBottom: 4, color: "#1e293b" },
  versoItem: { fontSize: 10, marginBottom: 2, paddingLeft: 12, lineHeight: 1.25 },
  versoLista: { flexDirection: "row", flexWrap: "wrap" },
  versoItemCol: { width: "50%", fontSize: 10, marginBottom: 2, paddingRight: 10, lineHeight: 1.25 },
  versoParagrafo: { fontSize: 10, marginBottom: 6, lineHeight: 1.3 },
  versoFooter: { fontSize: 8, color: "#64748b", textAlign: "center", marginTop: "auto" },

  // ---- Modelo RETRATO (vertical, 1 página) ----
  vHead: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 4 },
  vLogo: { width: 110, height: 48, objectFit: "contain" },
  vTitulo: { fontSize: 26, fontWeight: "bold", letterSpacing: 2, color: "#1e293b", textAlign: "center" },
  vBadge: {
    fontSize: 10, fontWeight: "bold", color: "#b45309",
    border: "1.5 solid #f59e0b", borderRadius: 4, padding: "3 6",
  },
  vEmpresa: { fontSize: 11, fontWeight: "bold", color: "#1e293b", textAlign: "center", marginTop: 2 },
  vCertificaQue: { fontSize: 11, color: "#475569", textAlign: "center", marginBottom: 6 },
  vCorpo: { fontSize: 11, lineHeight: 1.5, textAlign: "center", marginHorizontal: 8, marginTop: 8, marginBottom: 12 },
  vSecTitulo: { fontSize: 11, fontWeight: "bold", color: "#1e293b", textDecoration: "underline", marginBottom: 6 },
  vItem: { fontSize: 9.5, marginBottom: 2, paddingLeft: 8, lineHeight: 1.3 },
  vDataLocal: { fontSize: 10, textAlign: "center", marginTop: 6, marginBottom: 14 },
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
 * Limpa um item de conteúdo programático para exibição.
 * Origem dos dados (colar do Word) costuma trazer marcadores Wingdings literais
 * — "ü"/"" (checkmark), bullets e TABs — que se sobrepõem ao texto no PDF.
 * Remove esses prefixos e normaliza espaços; o bullet "•" é adicionado na renderização.
 */
export function limparItemConteudo(item: string): string {
  return item
    .replace(/[\t ]+/g, " ") // TAB e NBSP viram espaço
    .replace(/^[\s•·ü✓✔•·\-–—*]+/, "") // marcadores à esquerda
    .replace(/\s{2,}/g, " ")
    .trim()
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

export type OrientacaoCertificado = "retrato" | "paisagem"

export async function renderCertificadoPdf(d: CertificadoData, orientacao: OrientacaoCertificado = "paisagem") {
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

  const itens = (d.conteudo_programatico ?? []).map(limparItemConteudo).filter(Boolean)

  // ---- RETRATO: certificado em página única (modelo vertical) ----
  if (orientacao === "retrato") {
    return (
      <Document title={`Certificado — ${d.curso_titulo}`}>
        <Page size="A4" style={styles.page}>
          <View style={styles.borderOuter}>
            <View style={{ ...styles.borderInner, alignItems: "stretch", paddingTop: 20 }}>
              <View style={styles.vHead}>
                <View style={{ width: 120 }}>{logo && <Image src={logo} style={styles.vLogo} />}</View>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.vTitulo}>CERTIFICADO</Text>
                </View>
                <View style={{ width: 120, alignItems: "flex-end" }}>
                  {d.nr_referencia ? <Text style={styles.vBadge}>{d.nr_referencia}</Text> : null}
                </View>
              </View>

              <Text style={styles.vEmpresa}>A {d.empresa_razao_social}</Text>
              <Text style={styles.vCertificaQue}>Certifica que</Text>

              <View style={styles.nomeBloco}>
                <Text style={styles.nomeAluno}>{d.aluno_nome}</Text>
              </View>
              <Text style={styles.cpfAluno}>CPF {d.aluno_cpf}</Text>

              <Text style={styles.vCorpo}>{textoCorpo}</Text>

              <Text style={styles.vSecTitulo}>CONTEÚDO PROGRAMÁTICO:</Text>
              {itens.length > 0 ? (
                itens.map((item, i) => <Text key={i} style={styles.vItem}>✓  {item}</Text>)
              ) : (
                <Text style={styles.vItem}>✓  Conforme ementa da NR aplicável e requisitos do empregador.</Text>
              )}

              <Text style={styles.vDataLocal}>{vars.cidade}, {formatPtBr(d.data_realizacao)}</Text>

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
      </Document>
    )
  }

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

            <View style={styles.nomeBloco}>
              <Text style={styles.nomeAluno}>{d.aluno_nome}</Text>
            </View>
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
          <View style={{ ...styles.borderInner, alignItems: "stretch", padding: 20, paddingTop: 20 }}>
            <Text style={styles.versoTitulo}>CONTEÚDO PROGRAMÁTICO E BASE LEGAL</Text>

            <Text style={styles.versoSecTitulo}>Treinamento</Text>
            <Text style={styles.versoParagrafo}>
              {d.curso_titulo}{d.nr_referencia ? ` — ${d.nr_referencia}` : ""} · Carga horária: {d.carga_horaria}h
            </Text>

            <Text style={styles.versoSecTitulo}>Conteúdo programático</Text>
            {(d.conteudo_programatico ?? []).length > 0 ? (
              <View style={styles.versoLista}>
                {(d.conteudo_programatico ?? []).map((item, i) => (
                  <Text key={i} style={styles.versoItemCol}>• {limparItemConteudo(item)}</Text>
                ))}
              </View>
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
