"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldAlert } from "lucide-react"
import { avaliarSeveridade, type AvaliacaoSeveridadeInput } from "../actions"

export type ItemSeveridade = {
  pgr_ghe_id: string
  gheCodigo: string
  dimensao_id: string
  dimensao_nome: string
  score: number | null
  probabilidade: number | null
  severidade: number | null
  exposicao: number | null
  nivel_risco_nr1: string | null
  tipo: "exposicao" | "desfecho"
  nivel_desfecho: string | null
}

const NIVEL_DESFECHO_LABEL: Record<string, string> = {
  normal: "Normal", leve: "Leve", moderado: "Moderado",
  severo: "Severo", extremamente_severo: "Extremamente severo",
}

const NIVEL_LABEL: Record<string, string> = {
  baixo: "Baixo", medio: "Médio", alto: "Alto", critico: "Crítico",
}
const NIVEL_CLASSE: Record<string, string> = {
  baixo: "bg-status-regular text-white",
  medio: "bg-status-alerta text-white",
  alto: "bg-status-vencido text-white",
  critico: "bg-status-vencido text-white font-bold",
}

// Escalas qualitativas NR-1 (1-5)
const SEVERIDADE = [
  { v: 1, l: "1 — Insignificante" }, { v: 2, l: "2 — Leve" }, { v: 3, l: "3 — Moderada" },
  { v: 4, l: "4 — Grave" }, { v: 5, l: "5 — Gravíssima" },
]
const EXPOSICAO = [
  { v: "", l: "— (P×S)" }, { v: 1, l: "1 — Rara" }, { v: 2, l: "2 — Esporádica" },
  { v: 3, l: "3 — Ocasional" }, { v: 4, l: "4 — Frequente" }, { v: 5, l: "5 — Contínua" },
]

export function AvaliacaoSeveridade({ id, itens }: { id: string; itens: ItemSeveridade[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [estado, setEstado] = useState<Record<string, { s: string; e: string }>>(() => {
    const init: Record<string, { s: string; e: string }> = {}
    for (const it of itens) {
      init[`${it.pgr_ghe_id}::${it.dimensao_id}`] = {
        s: it.severidade != null ? String(it.severidade) : "",
        e: it.exposicao != null ? String(it.exposicao) : "",
      }
    }
    return init
  })

  function set(chave: string, campo: "s" | "e", valor: string) {
    setEstado((prev) => ({ ...prev, [chave]: { ...prev[chave], [campo]: valor } }))
  }

  function salvar() {
    const avaliacoes: AvaliacaoSeveridadeInput[] = []
    for (const it of itens) {
      if (it.tipo === "desfecho") continue // desfechos não vão ao PGR — não se avalia severidade
      const chave = `${it.pgr_ghe_id}::${it.dimensao_id}`
      const st = estado[chave]
      if (!st?.s) continue // severidade é obrigatória para avaliar
      avaliacoes.push({
        pgr_ghe_id: it.pgr_ghe_id,
        dimensao_id: it.dimensao_id,
        severidade: Number(st.s),
        exposicao: st.e ? Number(st.e) : null,
      })
    }
    if (avaliacoes.length === 0) {
      toast.error("Defina a severidade de ao menos uma dimensão.")
      return
    }
    start(async () => {
      const r = await avaliarSeveridade(id, avaliacoes)
      if ("error" in r) toast.error(r.error)
      else {
        toast.success(`Avaliação técnica salva (${r.id} dimensão/ões)`)
        router.refresh()
      }
    })
  }

  if (itens.length === 0) return null
  const temExposicao = itens.some((i) => i.tipo !== "desfecho")

  return (
    <div className="space-y-3">
      {temExposicao && (
        <p className="text-xs text-muted-foreground">
          A NR-1 exige determinar o nível pela matriz Probabilidade × Severidade (× Exposição) — o
          questionário fornece a Probabilidade; informe a Severidade técnica (e, opcionalmente, a
          Exposição) de cada dimensão. Sem essa etapa, os riscos não podem ser lançados no PGR.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left">GHE</th>
              <th className="p-2 text-left">Dimensão</th>
              <th className="p-2 text-center">Prob. (score)</th>
              <th className="p-2 text-center">Severidade</th>
              <th className="p-2 text-center">Exposição</th>
              <th className="p-2 text-center">Nível NR-1</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => {
              const chave = `${it.pgr_ghe_id}::${it.dimensao_id}`
              const st = estado[chave] ?? { s: "", e: "" }
              return (
                <tr key={chave} className="border-t">
                  <td className="p-2 font-medium">{it.gheCodigo}</td>
                  <td className="p-2">{it.dimensao_nome}</td>
                  {it.tipo === "desfecho" ? (
                    <td className="p-2 text-center text-muted-foreground" colSpan={4}>
                      Desfecho — monitoramento (não entra no PGR)
                      {it.nivel_desfecho && (
                        <> · <b>{NIVEL_DESFECHO_LABEL[it.nivel_desfecho] ?? it.nivel_desfecho}</b>{it.score != null ? ` (${it.score})` : ""}</>
                      )}
                    </td>
                  ) : (
                    <>
                      <td className="p-2 text-center">{it.probabilidade ?? "—"} <span className="text-muted-foreground">({it.score})</span></td>
                      <td className="p-2 text-center">
                        <select className="rounded border bg-background px-1 py-0.5" value={st.s}
                          aria-label={`Severidade — ${it.gheCodigo} / ${it.dimensao_nome}`}
                          onChange={(ev) => set(chave, "s", ev.target.value)}>
                          <option value="">—</option>
                          {SEVERIDADE.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <select className="rounded border bg-background px-1 py-0.5" value={st.e}
                          aria-label={`Exposição — ${it.gheCodigo} / ${it.dimensao_nome}`}
                          onChange={(ev) => set(chave, "e", ev.target.value)}>
                          {EXPOSICAO.map((o) => <option key={String(o.v)} value={o.v}>{o.l}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        {it.nivel_risco_nr1 ? (
                          <span className={`rounded px-2 py-0.5 ${NIVEL_CLASSE[it.nivel_risco_nr1] ?? ""}`}>
                            {NIVEL_LABEL[it.nivel_risco_nr1] ?? it.nivel_risco_nr1}
                          </span>
                        ) : <span className="text-muted-foreground">a avaliar</span>}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {temExposicao && (
        <Button size="sm" disabled={pending} onClick={salvar}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />} Salvar avaliação técnica
        </Button>
      )}
    </div>
  )
}
