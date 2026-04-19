// Template padrão do certificado + interpolador de variáveis.
// Usado quando treinamentos.texto_certificado está vazio OU
// aplicado sobre o texto customizado para substituir placeholders.

export const TEXTO_CERTIFICADO_PADRAO = `Certificamos que {{aluno_nome}}, CPF {{aluno_cpf}}, participou e concluiu, com aproveitamento, o treinamento de {{curso_titulo}}{{nr_referencia_parenteses}}, com carga horária de {{carga_horaria}} horas, realizado em {{data_realizacao}}{{entidade_trecho}}.{{validade_trecho}}`

export type CertificadoVars = {
  aluno_nome: string
  aluno_cpf: string
  curso_titulo: string
  nr_referencia: string | null
  carga_horaria: number
  data_realizacao: string // ISO 8601
  data_vencimento: string | null
  cidade: string
  entidade: string | null
  instrutor: string | null
  empresa: string
}

function formatPtBr(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

/** Interpola as variáveis do template `{{nome_variavel}}` com os valores reais. */
export function interpolarTextoCertificado(template: string, vars: CertificadoVars): string {
  const subs: Record<string, string> = {
    aluno_nome: vars.aluno_nome,
    aluno_cpf: vars.aluno_cpf,
    curso_titulo: vars.curso_titulo,
    nr_referencia: vars.nr_referencia ?? "",
    nr_referencia_parenteses: vars.nr_referencia ? ` (${vars.nr_referencia})` : "",
    carga_horaria: String(vars.carga_horaria),
    data_realizacao: formatPtBr(vars.data_realizacao),
    data_vencimento: formatPtBr(vars.data_vencimento),
    cidade: vars.cidade,
    entidade: vars.entidade ?? "",
    entidade_trecho: vars.entidade ? `, ministrado por ${vars.entidade}` : "",
    instrutor: vars.instrutor ?? "",
    empresa: vars.empresa,
    validade_trecho: vars.data_vencimento
      ? ` O certificado é válido até ${formatPtBr(vars.data_vencimento)}.`
      : "",
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return subs[key] !== undefined ? subs[key] : match
  })
}

/** Lista de variáveis disponíveis para exibir na UI de edição do template. */
export const VARIAVEIS_DISPONIVEIS: { tag: string; descricao: string }[] = [
  { tag: "{{aluno_nome}}", descricao: "Nome completo do colaborador" },
  { tag: "{{aluno_cpf}}", descricao: "CPF formatado" },
  { tag: "{{curso_titulo}}", descricao: "Título do treinamento" },
  { tag: "{{nr_referencia}}", descricao: "Ex: NR-10" },
  { tag: "{{nr_referencia_parenteses}}", descricao: "Ex: ' (NR-10)' se houver NR, senão vazio" },
  { tag: "{{carga_horaria}}", descricao: "Horas do curso" },
  { tag: "{{data_realizacao}}", descricao: "dd/mm/aaaa" },
  { tag: "{{data_vencimento}}", descricao: "dd/mm/aaaa" },
  { tag: "{{cidade}}", descricao: "Cidade de emissão do certificado" },
  { tag: "{{entidade}}", descricao: "Empresa/entidade que ministrou" },
  { tag: "{{entidade_trecho}}", descricao: "', ministrado por X' se houver entidade" },
  { tag: "{{instrutor}}", descricao: "Nome do instrutor" },
  { tag: "{{empresa}}", descricao: "Razão social da empresa emissora" },
  { tag: "{{validade_trecho}}", descricao: "Frase sobre validade, se houver vencimento" },
]
