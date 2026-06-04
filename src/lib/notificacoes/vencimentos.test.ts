import { describe, it, expect } from "vitest"
import {
  selecionarNotificaveis,
  filtrarParaEmpresa,
  montarAssunto,
  montarEmailHtml,
  type VencimentoRow,
} from "./vencimentos"

function row(over: Partial<VencimentoRow>): VencimentoRow {
  return {
    categoria: "exame_medico",
    item: "Periódico",
    colaborador: "João",
    empresa_id: "emp-1",
    data_vencimento: "2026-07-01",
    dias_restantes: 30,
    urgencia: "critico",
    ...over,
  }
}

describe("selecionarNotificaveis", () => {
  it("inclui apenas itens nos marcos 30/15/7 por padrão", () => {
    const rows = [30, 29, 15, 14, 7, 6, 1, 0, -5].map((d) => row({ dias_restantes: d }))
    const sel = selecionarNotificaveis(rows)
    expect(sel.map((r) => r.dias_restantes).sort((a, b) => a - b)).toEqual([7, 15, 30])
  })

  it("respeita marcos customizados", () => {
    const rows = [10, 5, 3].map((d) => row({ dias_restantes: d }))
    expect(selecionarNotificaveis(rows, [5]).map((r) => r.dias_restantes)).toEqual([5])
  })

  it("retorna vazio quando nada bate um marco", () => {
    const rows = [29, 16, 8].map((d) => row({ dias_restantes: d }))
    expect(selecionarNotificaveis(rows)).toHaveLength(0)
  })
})

describe("filtrarParaEmpresa", () => {
  it("inclui itens da empresa e itens globais (empresa_id null)", () => {
    const rows = [
      row({ empresa_id: "emp-1", item: "A" }),
      row({ empresa_id: "emp-2", item: "B" }),
      row({ empresa_id: null, item: "CA global" }),
    ]
    const r = filtrarParaEmpresa(rows, "emp-1")
    expect(r.map((x) => x.item)).toEqual(["A", "CA global"])
  })
})

describe("montarAssunto", () => {
  it("usa singular para 1 item e cita o mais próximo", () => {
    expect(montarAssunto([row({ dias_restantes: 7 })])).toContain("1 item vence")
    expect(montarAssunto([row({ dias_restantes: 7 })])).toContain("em 7 dias")
  })

  it("usa plural e pega o menor prazo", () => {
    const s = montarAssunto([row({ dias_restantes: 30 }), row({ dias_restantes: 7 })])
    expect(s).toContain("2 itens vencem")
    expect(s).toContain("em 7 dias")
  })
})

describe("montarEmailHtml", () => {
  it("inclui cada item e ordena por urgência (menor prazo primeiro)", () => {
    const html = montarEmailHtml([
      row({ item: "Treino NR-35", dias_restantes: 30 }),
      row({ item: "ASO periódico", dias_restantes: 7 }),
    ])
    expect(html).toContain("ASO periódico")
    expect(html).toContain("Treino NR-35")
    // O de 7 dias aparece antes do de 30 dias
    expect(html.indexOf("ASO periódico")).toBeLessThan(html.indexOf("Treino NR-35"))
  })

  it("escapa HTML nos valores (anti-injection)", () => {
    const html = montarEmailHtml([row({ item: "<script>alert(1)</script>" })])
    expect(html).not.toContain("<script>alert(1)</script>")
    expect(html).toContain("&lt;script&gt;")
  })

  it("inclui link para /vencimentos quando appUrl é fornecido", () => {
    const html = montarEmailHtml([row({})], { appUrl: "https://app.exemplo.com" })
    expect(html).toContain("https://app.exemplo.com/vencimentos")
  })

  it("omite o link quando não há appUrl", () => {
    const html = montarEmailHtml([row({})])
    expect(html).not.toContain("/vencimentos")
  })
})
