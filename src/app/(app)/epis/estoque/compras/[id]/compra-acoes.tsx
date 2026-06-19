"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { confirmarCompra, cancelarCompra } from "../actions"

type FormErrors = { _form?: string[] }
type ActionResult = { error?: FormErrors } | { ok: true; id: string } | void

export function CompraAcoes({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [acao, setAcao] = useState<"confirmar" | "cancelar" | null>(null)

  function run(tipo: "confirmar" | "cancelar", fn: (id: string) => Promise<ActionResult>, ok: string) {
    setAcao(tipo)
    startTransition(async () => {
      const result = await fn(id)
      if (result && "error" in result && result.error?._form?.[0]) {
        toast.error(result.error._form[0])
      } else {
        toast.success(ok)
        router.refresh()
      }
      setAcao(null)
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => run("cancelar", cancelarCompra, "Compra cancelada.")}
      >
        {pending && acao === "cancelar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
        Cancelar compra
      </Button>
      <Button
        type="button"
        disabled={pending}
        onClick={() => run("confirmar", confirmarCompra, "Compra confirmada. Estoque atualizado.")}
      >
        {pending && acao === "confirmar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Confirmar compra
      </Button>
    </div>
  )
}
