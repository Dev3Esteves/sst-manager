import type { Manual } from "../tipos"
import { manuaisCadastros } from "./cadastros"
import { manuaisOperacao } from "./operacao"
import { manuaisDocumentos } from "./documentos"
import { manuaisRelatorios } from "./relatorios"
import { manuaisReferencias } from "./referencias"
import { manuaisAdministracao } from "./administracao"
import { manuaisMelhorias2026 } from "./melhorias-2026"

/** Todos os manuais, em ordem de categoria. */
export const MANUAIS: Manual[] = [
  ...manuaisCadastros,
  ...manuaisOperacao,
  ...manuaisDocumentos,
  ...manuaisRelatorios,
  ...manuaisReferencias,
  ...manuaisAdministracao,
  ...manuaisMelhorias2026,
]

export const CATEGORIAS = [
  "Cadastros",
  "Operação",
  "Documentos",
  "Relatórios",
  "Referências",
  "Administração",
] as const

export function getManual(slug: string): Manual | undefined {
  return MANUAIS.find((m) => m.slug === slug)
}
