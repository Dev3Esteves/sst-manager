import type { Manual } from "../tipos"
import { manualPsicossocial } from "./psicossocial"
import { manualApr } from "./apr"

/**
 * Registro de manuais disponíveis. Adicione novos manuais aqui conforme forem
 * escritos (um arquivo por módulo nesta pasta).
 */
export const MANUAIS: Manual[] = [manualPsicossocial, manualApr]

export function getManual(slug: string): Manual | undefined {
  return MANUAIS.find((m) => m.slug === slug)
}
