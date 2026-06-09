/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { fetchLogoAsDataUri } from "./fetch-logo"

/**
 * Ficha de Controle e Fornecimento de EPI.
 *
 * Template inspirado no formulário SGI\Formulários\FO-008-00 de referência
 * (PDF "11.1 EPI ATUALIZADO") — é uma ficha **CUMULATIVA**, um único documento
 * por colaborador contendo TODAS as entregas ao longo do tempo, com colunas
 * de data, quantidade, descrição, CA, assinatura do recebimento, data e
 * assinatura de devolução, e responsável.
 */

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2 solid #1e293b",
    paddingBottom: 8,
    marginBottom: 10,
  },
  headerLeft: { flex: 1 },
  logo: { width: 120, height: 50, objectFit: "contain" },
  empresaNome: { fontSize: 12, fontWeight: "bold", color: "#1e293b" },
  empresaCnpj: { fontSize: 8, color: "#475569", marginTop: 2 },
  titleBar: {
    backgroundColor: "#1e293b",
    padding: 6,
    marginBottom: 10,
  },
  title: { color: "#fff", fontSize: 12, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  identificacao: {
    border: "0.5 solid #94a3b8",
    padding: 8,
    marginBottom: 10,
  },
  linhaIdent: { flexDirection: "row", marginBottom: 3 },
  identCampo: { flexDirection: "row", gap: 3, marginRight: 16, flex: 1 },
  identLabel: { fontWeight: "bold", fontSize: 9 },
  identValor: { fontSize: 9 },
  termo: {
    backgroundColor: "#f8fafc",
    border: "0.5 solid #94a3b8",
    padding: 8,
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: "justify",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    backgroundColor: "#e2e8f0",
    padding: 4,
    marginBottom: 0,
  },
  table: { borderWidth: 0.5, borderColor: "#94a3b8" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#94a3b8",
    minHeight: 20,
  },
  tableRowHead: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderBottomWidth: 0.5,
    borderColor: "#94a3b8",
  },
  cellHead: {
    padding: 3,
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
    textAlign: "center",
  },
  cell: {
    padding: 3,
    fontSize: 8,
    borderRightWidth: 0.5,
    borderColor: "#94a3b8",
  },
  assinaturaRodape: {
    flexDirection: "row",
    marginTop: 18,
    gap: 18,
  },
  blocoAssinatura: {
    flex: 1,
    borderTop: "1 solid #111",
    paddingTop: 3,
    alignItems: "center",
  },
  assinaturaNome: { fontSize: 9, fontWeight: "bold" },
  assinaturaCargo: { fontSize: 8, color: "#64748b" },
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

export type EntregaEpiItem = {
  data_entrega: string       // ISO
  quantidade: number
  epi_descricao: string
  ca: string | null
  data_devolucao?: string | null
  responsavel?: string | null
  motivo?: string | null
}

export type FichaEpiData = {
  empresa_razao_social: string
  empresa_cnpj: string
  empresa_logo_url?: string | null
  colaborador_nome: string
  colaborador_cpf: string
  colaborador_matricula?: string | null
  cargo_titulo?: string | null
  data_admissao?: string | null
  obra_nome?: string | null
  entregas: EntregaEpiItem[]
  emitido_em: string // ISO
}

const TERMO_RESPONSABILIDADE = (
  "Declaro, para todos os fins, que recebi os Equipamentos de Proteção Individual (EPI) relacionados nesta " +
  "ficha, em perfeitas condições de uso, e que fui devidamente orientado quanto à sua finalidade, uso correto, " +
  "conservação e limpeza. Comprometo-me a: usá-los exclusivamente para a finalidade a que se destinam; " +
  "responsabilizar-me por sua guarda e conservação; comunicar ao empregador qualquer alteração que os torne " +
  "impróprios para uso; e devolvê-los ao término da sua utilização ou desligamento, conforme disposto na " +
  "Portaria 3.214/78 — NR-06. Estou ciente de que o descumprimento poderá caracterizar ato faltoso."
)

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

export async function renderFichaEpiPdf(d: FichaEpiData) {
  const logo = await fetchLogoAsDataUri(d.empresa_logo_url)

  // Ordena por data crescente para parecer um histórico cronológico
  const entregas = [...d.entregas].sort((a, b) =>
    a.data_entrega.localeCompare(b.data_entrega),
  )

  return (
    <Document title={`Ficha de EPI — ${d.colaborador_nome}`}>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.empresaNome}>{d.empresa_razao_social}</Text>
            <Text style={styles.empresaCnpj}>CNPJ: {d.empresa_cnpj}</Text>
          </View>
          {logo && <Image src={logo} style={styles.logo} />}
        </View>

        <View style={styles.titleBar}>
          <Text style={styles.title}>
            FICHA DE CONTROLE E FORNECIMENTO DE EPI
          </Text>
        </View>

        {/* Identificação do colaborador */}
        <View style={styles.identificacao}>
          <View style={styles.linhaIdent}>
            <View style={[styles.identCampo, { flex: 2 }]}>
              <Text style={styles.identLabel}>Colaborador:</Text>
              <Text style={styles.identValor}>{d.colaborador_nome}</Text>
            </View>
            <View style={styles.identCampo}>
              <Text style={styles.identLabel}>CPF:</Text>
              <Text style={styles.identValor}>{formatCpf(d.colaborador_cpf)}</Text>
            </View>
          </View>
          <View style={styles.linhaIdent}>
            <View style={[styles.identCampo, { flex: 1.2 }]}>
              <Text style={styles.identLabel}>Função:</Text>
              <Text style={styles.identValor}>{d.cargo_titulo ?? "—"}</Text>
            </View>
            <View style={styles.identCampo}>
              <Text style={styles.identLabel}>Matrícula:</Text>
              <Text style={styles.identValor}>{d.colaborador_matricula ?? "—"}</Text>
            </View>
            <View style={styles.identCampo}>
              <Text style={styles.identLabel}>Admissão:</Text>
              <Text style={styles.identValor}>{formatPtBr(d.data_admissao)}</Text>
            </View>
          </View>
          <View style={styles.linhaIdent}>
            <View style={[styles.identCampo, { flex: 3 }]}>
              <Text style={styles.identLabel}>Obra:</Text>
              <Text style={styles.identValor}>{d.obra_nome ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Termo de Responsabilidade */}
        <Text style={styles.sectionTitle}>TERMO DE RESPONSABILIDADE</Text>
        <View style={styles.termo}>
          <Text>{TERMO_RESPONSABILIDADE}</Text>
        </View>

        {/* Tabela cumulativa de entregas */}
        <Text style={styles.sectionTitle}>HISTÓRICO DE ENTREGAS E DEVOLUÇÕES</Text>
        <View style={styles.table}>
          <View style={styles.tableRowHead} fixed>
            <Text style={[styles.cellHead, { flex: 1.2 }]}>Data</Text>
            <Text style={[styles.cellHead, { flex: 0.7 }]}>Qtd</Text>
            <Text style={[styles.cellHead, { flex: 3 }]}>EPI Fornecido</Text>
            <Text style={[styles.cellHead, { flex: 1.2 }]}>CA</Text>
            <Text style={[styles.cellHead, { flex: 2 }]}>Assinatura Recebimento</Text>
            <Text style={[styles.cellHead, { flex: 1.2 }]}>Devolução</Text>
            <Text style={[styles.cellHead, { flex: 2 }]}>Assinatura Devolução</Text>
            <Text style={[styles.cellHead, { flex: 1.5, borderRightWidth: 0 }]}>Responsável</Text>
          </View>

          {entregas.length > 0 ? (
            entregas.map((e, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={[styles.cell, { flex: 1.2 }]}>{formatPtBr(e.data_entrega)}</Text>
                <Text style={[styles.cell, { flex: 0.7, textAlign: "center" }]}>{e.quantidade}</Text>
                <Text style={[styles.cell, { flex: 3 }]}>{e.epi_descricao}</Text>
                <Text style={[styles.cell, { flex: 1.2 }]}>{e.ca ?? "—"}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{" "}</Text>
                <Text style={[styles.cell, { flex: 1.2 }]}>{e.data_devolucao ? formatPtBr(e.data_devolucao) : " "}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{" "}</Text>
                <Text style={[styles.cell, { flex: 1.5, borderRightWidth: 0 }]}>{e.responsavel ?? " "}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 1, textAlign: "center", fontStyle: "italic", color: "#64748b" }]}>
                Nenhuma entrega registrada até o momento.
              </Text>
            </View>
          )}

          {/* Linhas em branco para preenchimento manual (mín. 3) */}
          {Array.from({ length: Math.max(3, 12 - entregas.length) }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 1.2 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 0.7 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 3 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 1.2 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 1.2 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>{" "}</Text>
              <Text style={[styles.cell, { flex: 1.5, borderRightWidth: 0 }]}>{" "}</Text>
            </View>
          ))}
        </View>

        {/* Assinatura final do colaborador */}
        <View style={styles.assinaturaRodape}>
          <View style={styles.blocoAssinatura}>
            <Text style={styles.assinaturaNome}>{d.colaborador_nome}</Text>
            <Text style={styles.assinaturaCargo}>Assinatura do colaborador</Text>
          </View>
          <View style={styles.blocoAssinatura}>
            <Text style={styles.assinaturaNome}>Responsável</Text>
            <Text style={styles.assinaturaCargo}>Segurança do Trabalho</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>SGI\Formulários\FO-008-00 · {d.empresa_razao_social}</Text>
          <Text>Emitido em {formatPtBr(d.emitido_em)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
