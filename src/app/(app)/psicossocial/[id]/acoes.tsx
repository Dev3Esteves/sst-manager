"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Square, Calculator, FileUp, QrCode, SlidersHorizontal } from "lucide-react"
import { mudarStatusCampanha, calcularResultados, lancarNoInventarioPgr, sincronizarConvites, calibrarFaixas } from "../actions"

export function AcoesCampanha({ id, status, temResultados, calibravel = false }: { id: string; status: string; temResultados: boolean; calibravel?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function run(fn: () => Promise<{ ok: true; id?: string } | { error: string }>, sucesso: string) {
    start(async () => {
      const r = await fn()
      if ("error" in r) toast.error(r.error)
      else {
        toast.success(r.id ? `${sucesso} (${r.id})` : sucesso)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "analisada" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => sincronizarConvites(id), "Links/QR gerados por GHE")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Gerar/atualizar links por GHE
        </Button>
      )}
      {status === "rascunho" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => mudarStatusCampanha(id, "aberta"), "Campanha aberta para respostas")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Abrir para respostas
        </Button>
      )}
      {status === "aberta" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => mudarStatusCampanha(id, "encerrada"), "Campanha encerrada")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />} Encerrar
        </Button>
      )}
      {(status === "encerrada" || status === "aberta" || status === "analisada") && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => calcularResultados(id), "Resultados calculados")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} Calcular resultados
        </Button>
      )}
      {temResultados && calibravel && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => calibrarFaixas(id), "Faixas calibradas pelos percentis da empresa")} title="Recalcula os cortes verde/amarelo/vermelho de cada dimensão pelos percentis (P50/P80) das respostas desta empresa">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />} Calibrar faixas (percentis da empresa)
        </Button>
      )}
      {temResultados && (
        <Button size="sm" disabled={pending} onClick={() => run(() => lancarNoInventarioPgr(id), "Riscos lançados no Inventário do PGR")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Lançar no Inventário do PGR
        </Button>
      )}
    </div>
  )
}

export function CopiarLink({ link }: { link: string }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado") }}
      className="text-xs text-primary hover:underline break-all text-left"
      title="Clique para copiar"
    >
      {link}
    </button>
  )
}
