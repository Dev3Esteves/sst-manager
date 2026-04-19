/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { fetchLogoAsDataUri } from "./fetch-logo"

/**
 * Ordem de Serviço NR-01 — por função.
 *
 * Template espelhado do PDF "NR-01 ALEX" da SISTENGE: 9 seções numeradas com
 * cabeçalho contendo logo + número da OS + data + revisão + **Obra**. A OS é
 * emitida por função (cargo), mas assinada por cada colaborador daquela
 * função alocado na obra.
 */

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#111827",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2 solid #1e293b",
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerLeft: { flex: 1 },
  logo: { width: 120, height: 45, objectFit: "contain" },
  empresaNome: { fontSize: 12, fontWeight: "bold", color: "#1e293b" },
  empresaCnpj: { fontSize: 8, color: "#475569", marginTop: 2 },
  titleBar: {
    backgroundColor: "#1e293b",
    padding: 6,
    marginBottom: 6,
  },
  title: { color: "#fff", fontSize: 12, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  metaTable: {
    flexDirection: "row",
    border: "0.5 solid #94a3b8",
    marginBottom: 10,
  },
  metaCell: {
    flex: 1,
    padding: 4,
    borderRight: "0.5 solid #94a3b8",
    fontSize: 8.5,
  },
  metaLast: { flex: 1, padding: 4, fontSize: 8.5 },
  metaLabel: { fontSize: 7, color: "#475569", fontWeight: "bold", marginBottom: 1, textTransform: "uppercase" as const },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#1e293b",
    padding: 4,
    marginBottom: 4,
  },
  body: { fontSize: 9.5, textAlign: "justify" },
  listItem: { flexDirection: "row", marginBottom: 2, paddingLeft: 4 },
  bullet: { width: 10 },
  itemText: { flex: 1, fontSize: 9.5 },
  assinaturaGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  blocoAssinatura: {
    flex: 1,
    borderTop: "1 solid #111",
    paddingTop: 3,
    alignItems: "center",
  },
  assinaturaNome: { fontSize: 9, fontWeight: "bold" },
  assinaturaCargo: { fontSize: 8, color: "#64748b" },
  colaboradorBox: {
    border: "0.5 solid #94a3b8",
    padding: 6,
    marginBottom: 6,
  },
  colabLinha: { flexDirection: "row", marginBottom: 2 },
  colabCampo: { flexDirection: "row", gap: 3, marginRight: 16 },
  colabLabel: { fontWeight: "bold", fontSize: 9 },
  colabValor: { fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 30,
    right: 30,
    borderTop: "0.5 solid #94a3b8",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#64748b",
  },
})

export type EpiOsItem = { descricao: string; ca: string | null; observacao?: string | null }

export type ColaboradorOs = {
  nome_completo: string
  cpf: string
  matricula?: string | null
  data_admissao?: string | null
}

export type OsNr01Data = {
  empresa_razao_social: string
  empresa_cnpj: string
  empresa_logo_url?: string | null
  numero_os: string
  data_emissao: string
  revisao?: string
  obra_nome: string
  cargo_titulo: string
  descricao_atividades?: string | null
  riscos: string[]
  medidas_preventivas: string[]
  epis_obrigatorios: EpiOsItem[]
  epis_eventuais: EpiOsItem[]
  recomendacoes?: string[]
  observacoes?: string | null
  colaboradores: ColaboradorOs[]
  responsavel_area_nome?: string
  responsavel_area_cargo?: string
  tec_seguranca_nome?: string
  tec_seguranca_crea?: string
}

function formatPtBr(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [y, m, dd] = iso.slice(0, 10).split("-")
  return `${dd}/${m}/${y}`
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "")
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

const RECOMENDACOES_PADRAO = [
  "Utilizar obrigatoriamente os EPIs fornecidos pela empresa durante a execução das atividades.",
  "Comunicar imediatamente ao superior qualquer condição insegura, desvio ou acidente.",
  "Participar dos treinamentos de segurança obrigatórios e reciclagens conforme cronograma.",
  "Respeitar os procedimentos operacionais padrão, sinalizações e isolamentos de área.",
  "Manter organização e limpeza no posto de trabalho (5S).",
  "Não executar atividade para a qual não esteja devidamente treinado e autorizado.",
]

export async function renderOsNr01Pdf(d: OsNr01Data) {
  const logo = await fetchLogoAsDataUri(d.empresa_logo_url)
  const recomendacoes = d.recomendacoes && d.recomendacoes.length > 0 ? d.recomendacoes : RECOMENDACOES_PADRAO

  return (
    <Document title={`Ordem de Serviço NR-01 — ${d.cargo_titulo}`}>
      {d.colaboradores.map((colab, idx) => (
        <Page key={idx} size="A4" style={styles.page}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.empresaNome}>{d.empresa_razao_social}</Text>
              <Text style={styles.empresaCnpj}>CNPJ: {d.empresa_cnpj}</Text>
            </View>
            {logo && <Image src={logo} style={styles.logo} />}
          </View>

          <View style={styles.titleBar}>
            <Text style={styles.title}>ORDEM DE SERVIÇO — NR-01</Text>
          </View>

          {/* Meta: OS Nº / Data / Revisão / Obra */}
          <View style={styles.metaTable}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>O.S. Nº</Text>
              <Text>{d.numero_os}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Data</Text>
              <Text>{formatPtBr(d.data_emissao)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Revisão</Text>
              <Text>{d.revisao ?? "00"}</Text>
            </View>
            <View style={styles.metaLast}>
              <Text style={styles.metaLabel}>Obra</Text>
              <Text>{d.obra_nome}</Text>
            </View>
          </View>

          {/* 1. Descrição da Função */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. DESCRIÇÃO DA FUNÇÃO</Text>
            <Text style={styles.body}>
              <Text style={{ fontWeight: "bold" }}>Função: </Text>
              {d.cargo_titulo}
            </Text>
            {d.descricao_atividades && (
              <Text style={[styles.body, { marginTop: 3 }]}>{d.descricao_atividades}</Text>
            )}
          </View>

          {/* 2. Riscos Identificados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. RISCOS IDENTIFICADOS</Text>
            {d.riscos.length > 0 ? (
              d.riscos.map((r, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{r}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.body}>—</Text>
            )}
          </View>

          {/* 3. Medidas Preventivas e EPIs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. MEDIDAS PREVENTIVAS E EPIs</Text>
            {d.medidas_preventivas.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 2 }}>Medidas:</Text>
                {d.medidas_preventivas.map((m, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>{m}</Text>
                  </View>
                ))}
              </>
            )}
            <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 4 }}>EPIs obrigatórios:</Text>
            {d.epis_obrigatorios.length > 0 ? (
              d.epis_obrigatorios.map((e, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>
                    {e.descricao}{e.ca ? ` (CA ${e.ca})` : ""}
                    {e.observacao ? ` — ${e.observacao}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.body, { paddingLeft: 4 }]}>—</Text>
            )}
            {d.epis_eventuais.length > 0 && (
              <>
                <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 4 }}>EPIs eventuais:</Text>
                {d.epis_eventuais.map((e, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemText}>
                      {e.descricao}{e.ca ? ` (CA ${e.ca})` : ""}
                      {e.observacao ? ` — ${e.observacao}` : ""}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* 4. Recomendações Gerais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. RECOMENDAÇÕES GERAIS</Text>
            {recomendacoes.map((r, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{r}</Text>
              </View>
            ))}
          </View>

          {/* 5. Identificação do Servidor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. IDENTIFICAÇÃO DO SERVIDOR</Text>
            <View style={styles.colaboradorBox}>
              <View style={styles.colabLinha}>
                <View style={[styles.colabCampo, { flex: 2 }]}>
                  <Text style={styles.colabLabel}>Nome:</Text>
                  <Text style={styles.colabValor}>{colab.nome_completo}</Text>
                </View>
                <View style={styles.colabCampo}>
                  <Text style={styles.colabLabel}>CPF:</Text>
                  <Text style={styles.colabValor}>{formatCpf(colab.cpf)}</Text>
                </View>
              </View>
              <View style={styles.colabLinha}>
                <View style={styles.colabCampo}>
                  <Text style={styles.colabLabel}>Matrícula:</Text>
                  <Text style={styles.colabValor}>{colab.matricula ?? "—"}</Text>
                </View>
                <View style={styles.colabCampo}>
                  <Text style={styles.colabLabel}>Admissão:</Text>
                  <Text style={styles.colabValor}>{formatPtBr(colab.data_admissao)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 6. Responsabilidade (assinatura do colaborador) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. RESPONSABILIDADE</Text>
            <Text style={styles.body}>
              Declaro ter recebido as orientações referentes às atividades, riscos e medidas preventivas descritas
              nesta Ordem de Serviço, comprometendo-me a cumpri-las integralmente. Tenho ciência de que a não
              observância desta OS constitui ato faltoso passível das sanções legais cabíveis.
            </Text>
            <View style={{ marginTop: 14 }}>
              <View style={{ borderTop: "1 solid #111", width: 260, marginTop: 20, alignSelf: "center" }} />
              <Text style={{ textAlign: "center", fontSize: 9 }}>Assinatura do colaborador</Text>
            </View>
          </View>

          {/* 7. Observações */}
          {d.observacoes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. OBSERVAÇÕES</Text>
              <Text style={styles.body}>{d.observacoes}</Text>
            </View>
          )}

          {/* 8 e 9. Responsável da Área + Segurança do Trabalho */}
          <View style={styles.assinaturaGrid}>
            <View style={styles.blocoAssinatura}>
              <Text style={styles.assinaturaNome}>{d.responsavel_area_nome ?? "Responsável da Área"}</Text>
              <Text style={styles.assinaturaCargo}>{d.responsavel_area_cargo ?? "Encarregado de Obras"}</Text>
            </View>
            <View style={styles.blocoAssinatura}>
              <Text style={styles.assinaturaNome}>{d.tec_seguranca_nome ?? "Segurança do Trabalho"}</Text>
              <Text style={styles.assinaturaCargo}>
                {d.tec_seguranca_crea ? `CREA/MTE: ${d.tec_seguranca_crea}` : "Téc. Seg. Trabalho"}
              </Text>
            </View>
          </View>

          <View style={styles.footer} fixed>
            <Text>OS NR-01 · {d.empresa_razao_social}</Text>
            <Text>Obra: {d.obra_nome}</Text>
            <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  )
}
