"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { darCienciaPolitica, publicarPolitica } from "./actions"

export function CienciaButton({ politicaId, jaCiente }: { politicaId: string; jaCiente: boolean }) {
  const [pending, startTransition] = useTransition()
  if (jaCiente) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-status-regular">
        <CheckCircle2 className="h-4 w-4" /> Você declarou ciência
      </span>
    )
  }
  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const r = await darCienciaPolitica(politicaId)
        if (r?.error) toast.error(r.error._form[0]); else toast.success("Ciência registrada.")
      })}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Declarar ciência
    </Button>
  )
}

export function PublicarButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const r = await publicarPolitica(id)
        if (r?.error) toast.error(r.error._form[0]); else toast.success("Política publicada (vigente).")
      })}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      Publicar (tornar vigente)
    </Button>
  )
}
