import { z } from "zod"

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "")
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let d1 = 11 - (sum % 11)
  if (d1 > 9) d1 = 0
  if (d1 !== parseInt(clean[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  let d2 = 11 - (sum % 11)
  if (d2 > 9) d2 = 0
  return d2 === parseInt(clean[10])
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "")
  if (clean.length !== 14 || /^(\d)\1+$/.test(clean)) return false
  const calc = (len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(clean[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(clean[12]) && calc(13) === parseInt(clean[13])
}

export const cpfSchema = z.string()
  .transform(v => v.replace(/\D/g, ""))
  .refine(v => v.length === 11, "CPF deve ter 11 dígitos")
  .refine(validateCPF, "CPF inválido")

export const cnpjSchema = z.string()
  .refine(v => validateCNPJ(v), "CNPJ inválido")

export function formatCPF(cpf: string) {
  const c = cpf.replace(/\D/g, "")
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatCNPJ(cnpj: string) {
  const c = cnpj.replace(/\D/g, "")
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}
