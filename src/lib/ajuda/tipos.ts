/**
 * Modelo de dados dos manuais de uso (ajuda in-app).
 *
 * Cada manual é um objeto estruturado (não Markdown) — assim o layout é
 * controlado, sem dependência de renderizador externo, e o conteúdo fica
 * versionado junto ao código.
 */

export type BlocoManual =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "passos"; itens: string[] }
  | { tipo: "campos"; itens: { campo: string; descricao: string; obrigatorio?: boolean }[] }
  | { tipo: "exemplo"; titulo?: string; texto: string }
  /** Padrão de escrita: o jeito recomendado vs o que evitar. */
  | { tipo: "padrao"; recomendado: string; evitar: string }
  /** Sugestão de escrita conforme o que acontece: situação → como registrar. */
  | { tipo: "cenario"; situacao: string; orientacao: string }
  | { tipo: "checklist"; itens: string[] }
  | { tipo: "faq"; itens: { p: string; r: string }[] }
  | { tipo: "dica"; texto: string }
  | { tipo: "atencao"; texto: string }

export type SecaoManual = {
  titulo: string
  blocos: BlocoManual[]
}

export type Manual = {
  slug: string
  titulo: string
  /** Rótulo curto do módulo (para o card do índice). */
  modulo: string
  /** Categoria para agrupar no índice. */
  categoria: "Cadastros" | "Operação" | "Documentos" | "Relatórios" | "Referências" | "Administração"
  /** Link para abrir o módulo no app (opcional). */
  rota?: string
  /** Perfis que tipicamente usam o módulo. */
  perfis: string[]
  resumo: string
  secoes: SecaoManual[]
}
