"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { concluirModulo } from "../actions"

export function ConcluirButton({
  slug, jaConcluido, nextSlug,
}: {
  slug: string
  jaConcluido: boolean
  nextSlug: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function concluir() {
    startTransition(async () => {
      const r = await concluirModulo(slug)
      if ("error" in r) { toast.error(r.error); return }
      toast.success("Módulo concluído!")
      router.push(nextSlug ? `/treinamento/${nextSlug}` : "/treinamento")
      router.refresh()
    })
  }

  if (jaConcluido) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-status-regular font-medium">
          <CheckCircle2 className="h-4 w-4" /> Concluído
        </span>
        {nextSlug && (
          <Button variant="outline" onClick={() => router.push(`/treinamento/${nextSlug}`)}>
            Próximo módulo <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Button onClick={concluir} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Marcar como concluído{nextSlug ? " e avançar" : ""}
    </Button>
  )
}
