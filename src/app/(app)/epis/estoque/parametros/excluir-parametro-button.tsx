"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
import { excluirParametro } from "./actions"

export function ExcluirParametroButton({ id, epiNome }: { id: string; epiNome: string }) {
  const [pending, startTransition] = useTransition()

  function confirmar() {
    startTransition(async () => {
      const r = await excluirParametro(id)
      if ("error" in r) toast.error(r.error?._form?.[0] ?? "Erro ao excluir")
      else toast.success("Parâmetro excluído.")
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Excluir parâmetro de ${epiNome}`} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="space-y-2">
          <AlertDialogTitle>Excluir parâmetro?</AlertDialogTitle>
          <AlertDialogDescription>
            Os parâmetros de controle de <strong>{epiNome}</strong> serão removidos. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmar}>Excluir</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
