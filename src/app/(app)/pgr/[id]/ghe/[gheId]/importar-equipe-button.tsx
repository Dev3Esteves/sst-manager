"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Users } from "lucide-react"
import { importarEquipeDaObra } from "../actions"

export function ImportarEquipeButton({
  gheId,
  pgrId,
  equipeCount,
}: {
  gheId: string
  pgrId: string
  equipeCount: number
}) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function importar() {
    setMsg(null); setErro(null)
    startTransition(async () => {
      const r = await importarEquipeDaObra(gheId, pgrId)
      if (r && "error" in r) setErro(r.error?._form?.[0] ?? "Erro ao importar")
      else if (r && "ok" in r) {
        setMsg(`Equipe importada: ${r.adicionados} cargo(s) adicionado(s); nº de expostos = ${r.totalExpostos}.`)
      }
    })
  }

  return (
    <div className="mb-3 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          A obra tem {equipeCount} função(ões) na equipe. Importe-as como cargos deste GHE
          e atualize o nº de expostos.
        </span>
        <Button type="button" size="sm" variant="outline" onClick={importar} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Importar equipe da obra
        </Button>
      </div>
      {msg && <p className="mt-2 text-xs text-status-regular">{msg}</p>}
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}
    </div>
  )
}
