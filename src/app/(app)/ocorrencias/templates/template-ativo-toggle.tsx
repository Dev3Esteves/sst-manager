"use client"

import { useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { toggleTemplateOcorrenciaAtivo } from "./actions"

export function TemplateAtivoToggle({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => { toggleTemplateOcorrenciaAtivo(id, !ativo) })}
      className="disabled:opacity-50"
      title={ativo ? "Clique para inativar" : "Clique para ativar"}
    >
      <Badge variant={ativo ? "regular" : "secondary"}>{ativo ? "Ativo" : "Inativo"}</Badge>
    </button>
  )
}
