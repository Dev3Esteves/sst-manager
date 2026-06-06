"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Undo2, Loader2 } from "lucide-react"
import { devolverEpi } from "../actions"

export function DevolverButton({
  id, devolvido, dataDevolucao,
}: {
  id: string
  devolvido: boolean
  dataDevolucao: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [abrindo, setAbrindo] = useState(false)
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))

  if (devolvido) {
    return <Badge variant="secondary">Devolvido{dataDevolucao ? ` em ${dataDevolucao}` : ""}</Badge>
  }

  if (!abrindo) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setAbrindo(true)}>
        <Undo2 className="h-4 w-4" /> Registrar devolução
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-9 w-40" />
      <Button
        type="button" size="sm" disabled={pending}
        onClick={() => startTransition(async () => {
          const r = await devolverEpi(id, data)
          if (r && "error" in r) toast.error(r.error?._form?.[0] ?? "Erro")
          else { toast.success("Devolução registrada."); setAbrindo(false) }
        })}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Confirmar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setAbrindo(false)}>Cancelar</Button>
    </div>
  )
}
