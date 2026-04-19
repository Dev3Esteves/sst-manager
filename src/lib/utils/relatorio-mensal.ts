// Utilitários para o relatório gerencial mensal.

export type MesRef = {
  ano: number
  mes: number // 1-12
  /** Primeiro dia do mês em ISO (YYYY-MM-DD) */
  inicio: string
  /** Primeiro dia do mês seguinte em ISO (YYYY-MM-DD) */
  fim: string
  /** Label legível: "abril de 2026" */
  label: string
}

export function parseMesRef(input: string | null | undefined): MesRef {
  let ano: number, mes: number
  const match = input?.match(/^(\d{4})-(\d{1,2})$/)
  if (match) {
    ano = parseInt(match[1], 10)
    mes = parseInt(match[2], 10)
  } else {
    const now = new Date()
    ano = now.getFullYear()
    mes = now.getMonth() + 1
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const mesSeg = mes === 12 ? 1 : mes + 1
  const anoSeg = mes === 12 ? ano + 1 : ano

  const nomesMes = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ]

  return {
    ano, mes,
    inicio: `${ano}-${pad(mes)}-01`,
    fim: `${anoSeg}-${pad(mesSeg)}-01`,
    label: `${nomesMes[mes - 1]} de ${ano}`,
  }
}

export function mesAnterior(ref: MesRef): MesRef {
  const mes = ref.mes === 1 ? 12 : ref.mes - 1
  const ano = ref.mes === 1 ? ref.ano - 1 : ref.ano
  return parseMesRef(`${ano}-${String(mes).padStart(2, "0")}`)
}

/**
 * Lista últimos N meses (incluindo o atual) em ordem reversa (mais recente primeiro).
 * Útil para popular dropdown de seleção.
 */
export function listarMeses(n = 12): MesRef[] {
  const agora = new Date()
  const meses: MesRef[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses.push(parseMesRef(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`))
  }
  return meses
}

/** Calcula variação percentual entre atual e anterior. */
export function variacaoPct(atual: number, anterior: number): {
  valor: number
  pct: number
  direcao: "subiu" | "caiu" | "igual"
} {
  const diff = atual - anterior
  const pct = anterior === 0
    ? (atual === 0 ? 0 : 100)
    : Math.round((diff / anterior) * 1000) / 10
  const direcao = diff > 0 ? "subiu" : diff < 0 ? "caiu" : "igual"
  return { valor: diff, pct, direcao }
}
