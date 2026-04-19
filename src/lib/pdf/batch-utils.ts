// Utilitários para geração em lote de PDFs.

/**
 * Sanitiza nome para uso em filename:
 *   "João da Silva"     → "JOAO_DA_SILVA"
 *   "Maria José #42!"   → "MARIA_JOSE_42"
 *   "Ana - Eletricista" → "ANA_ELETRICISTA"
 *
 * Segue convenção do usuário: NR-10_JOAO_DA_SILVA.pdf
 */
export function sanitizeFilename(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos combinantes
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove pontuação, mantém hífen
    .trim()
    .replace(/[\s-]+/g, "_") // espaços e hífens → underscore
    .replace(/_+/g, "_") // colapsa underscores
    .replace(/^_|_$/g, "") // remove underscores de borda
    .toUpperCase()
}

/**
 * Monta nome de arquivo para documento em lote.
 *   buildDocFilename("NR-10", "João da Silva") → "NR-10_JOAO_DA_SILVA.pdf"
 *   buildDocFilename("CERT_NR-35", "Ana Maria") → "CERT_NR-35_ANA_MARIA.pdf"
 */
export function buildDocFilename(prefix: string, nomeColaborador: string): string {
  const safeNome = sanitizeFilename(nomeColaborador)
  const safePrefix = prefix.replace(/\s+/g, "_") // preserva hífens no prefixo tipo "NR-10"
  return `${safePrefix}_${safeNome}.pdf`
}

export const MAX_LOTE = 50

export type LoteResultItem = {
  colaborador_id: string
  nome: string
  status: "gerado" | "pulado"
  filename?: string
  motivo?: string
}
