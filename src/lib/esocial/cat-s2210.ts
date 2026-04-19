// Gerador do XML do evento S-2210 (Comunicação de Acidente de Trabalho — CAT)
// Referência: Leiaute do eSocial — versão S-1.2
// ATENÇÃO: o XML precisa ser assinado digitalmente (A1/A3) antes do envio real ao eSocial;
// este módulo gera apenas o conteúdo estrutural.

type OcorrenciaParaCat = {
  numero_sequencial: number | string
  data_ocorrencia: string
  local: string
  descricao: string
  natureza_lesao?: string | null
  parte_corpo_atingida?: string | null
  agente_causador?: string | null
  dias_afastamento?: number | null
  tipo: string
  gravidade?: string | null
}

type ColaboradorParaCat = {
  cpf: string
  nome_completo: string
  data_admissao?: string | null
  matricula?: string | null
}

type EmpresaParaCat = {
  cnpj: string
  razao_social: string
}

function escapeXml(s: string | null | undefined): string {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "")
}

/** Mapeia o tipo interno para o código tpAcid do eSocial (1=típico, 2=trajeto, 3=doença) */
function mapTpAcid(tipo: string): "1" | "2" | "3" {
  if (tipo === "acidente_trajeto") return "2"
  if (tipo === "doenca_ocupacional") return "3"
  return "1"
}

/** Mapeia gravidade para tpCat do eSocial (1=inicial, 2=reabertura, 3=óbito) */
function mapTpCat(gravidade: string | null | undefined): "1" | "3" {
  return gravidade === "fatal" ? "3" : "1"
}

export function gerarCatS2210Xml(
  ocorrencia: OcorrenciaParaCat,
  colaborador: ColaboradorParaCat,
  empresa: EmpresaParaCat,
): string {
  const dt = new Date(ocorrencia.data_ocorrencia)
  const dtAcid = dt.toISOString().slice(0, 10)
  const hrAcid = dt.toTimeString().slice(0, 5).replace(":", "")

  const ideEvento = `ID-${Date.now()}-${String(ocorrencia.numero_sequencial).padStart(4, "0")}`.slice(0, 36)
  const cnpjDigits = onlyDigits(empresa.cnpj)
  const cpfDigits = onlyDigits(colaborador.cpf)
  const matricula = colaborador.matricula ?? cpfDigits

  const tpAcid = mapTpAcid(ocorrencia.tipo)
  const tpCat = mapTpCat(ocorrencia.gravidade)
  const houveAfast = (ocorrencia.dias_afastamento ?? 0) > 0 ? "S" : "N"

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtCAT/v_S_01_02_00">
  <evtCAT Id="${ideEvento}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>sst-manager-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${escapeXml(cnpjDigits.slice(0, 8))}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${escapeXml(cpfDigits)}</cpfTrab>
      <matricula>${escapeXml(matricula)}</matricula>
    </ideVinculo>
    <cat>
      <dtAcid>${dtAcid}</dtAcid>
      <tpAcid>${tpAcid}</tpAcid>
      <hrAcid>${hrAcid}</hrAcid>
      <hrsTrabAntesAcid>0000</hrsTrabAntesAcid>
      <tpCat>${tpCat}</tpCat>
      <indCatObito>${ocorrencia.gravidade === "fatal" ? "S" : "N"}</indCatObito>
      <indComunPolicia>N</indComunPolicia>
      <codSitGeradora>VERIFICAR_TABELA_15</codSitGeradora>
      <iniciatCAT>1</iniciatCAT>
      <obsCAT>${escapeXml(ocorrencia.descricao).slice(0, 255)}</obsCAT>
      <localAcidente>
        <tpLocal>1</tpLocal>
        <dscLocal>${escapeXml(ocorrencia.local)}</dscLocal>
        <dscLograd>NAO_INFORMADO</dscLograd>
        <nrLograd>S/N</nrLograd>
        <bairro>NAO_INFORMADO</bairro>
        <cep>00000000</cep>
        <codMunic>0000000</codMunic>
        <uf>SP</uf>
      </localAcidente>
      <parteAtingida>
        <codParteAting>VERIFICAR_TABELA_13</codParteAting>
        <lateralidade>0</lateralidade>
      </parteAtingida>
      <agenteCausador>
        <codAgntCausador>VERIFICAR_TABELA_14</codAgntCausador>
      </agenteCausador>
      ${ocorrencia.natureza_lesao ? `<atestado>
        <dtAtendimento>${dtAcid}</dtAtendimento>
        <hrAtendimento>${hrAcid}</hrAtendimento>
        <indInternacao>N</indInternacao>
        <durTrat>${ocorrencia.dias_afastamento ?? 0}</durTrat>
        <indAfast>${houveAfast}</indAfast>
        <dscLesao>VERIFICAR_TABELA_16</dscLesao>
        <dscCompLesao>${escapeXml(ocorrencia.natureza_lesao).slice(0, 200)}</dscCompLesao>
        <diagProvavel>${escapeXml(ocorrencia.natureza_lesao).slice(0, 100)}</diagProvavel>
        <codCID>NAO_INFORMADO</codCID>
        <emitente>
          <nmEmit>A_INFORMAR</nmEmit>
          <ideOC>1</ideOC>
          <nrOC>000000</nrOC>
          <ufOC>SP</ufOC>
        </emitente>
      </atestado>` : ""}
    </cat>
  </evtCAT>
</eSocial>`
}

/**
 * Gera um TXT amigável com todos os campos da CAT para preenchimento manual
 * do portal eSocial, útil enquanto a integração direta não está implementada.
 */
export function gerarCatResumoTxt(
  ocorrencia: OcorrenciaParaCat,
  colaborador: ColaboradorParaCat,
  empresa: EmpresaParaCat,
): string {
  const dt = new Date(ocorrencia.data_ocorrencia)
  const tpLabel = { "1": "Típico", "2": "Trajeto", "3": "Doença ocupacional" }[mapTpAcid(ocorrencia.tipo)]

  return `============================================================
CAT — COMUNICAÇÃO DE ACIDENTE DE TRABALHO
Base: Evento eSocial S-2210
============================================================

EMPREGADOR
  Razão social:  ${empresa.razao_social}
  CNPJ:          ${empresa.cnpj}

ACIDENTADO
  Nome:          ${colaborador.nome_completo}
  CPF:           ${colaborador.cpf}
  Matrícula:     ${colaborador.matricula ?? "—"}
  Data admissão: ${colaborador.data_admissao ?? "—"}

ACIDENTE
  Nº interno:    ${ocorrencia.numero_sequencial}
  Tipo (tpAcid): ${tpLabel}
  Data/hora:     ${dt.toLocaleString("pt-BR")}
  Local:         ${ocorrencia.local}
  Gravidade:     ${ocorrencia.gravidade ?? "—"}
  Dias afast.:   ${ocorrencia.dias_afastamento ?? 0}

LESÃO
  Natureza:      ${ocorrencia.natureza_lesao ?? "—"}
  Parte atingida:${ocorrencia.parte_corpo_atingida ?? "—"}
  Agente causal: ${ocorrencia.agente_causador ?? "—"}

DESCRIÇÃO
  ${ocorrencia.descricao}

------------------------------------------------------------
ATENÇÃO: Os códigos codSitGeradora, codParteAting, codAgntCausador
e dscLesao precisam ser preenchidos pelas tabelas 13, 14, 15 e 16
do eSocial antes do envio. Este arquivo serve como apoio ao
preenchimento manual no portal eSocial.
============================================================
`
}
