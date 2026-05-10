"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import { addCargoToGhe, removeCargoFromGhe } from "../actions"

type Cargo = {
  id: string
  cargo_titulo: string
  cargo_id: string | null
}

export function CargosEditor({
  gheId,
  pgrId,
  cargos,
}: {
  gheId: string
  pgrId: string
  cargos: Cargo[]
}) {
  const [novo, setNovo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addCargoToGhe(gheId, formData)
      if (result?.error?.cargo_titulo) setError(result.error.cargo_titulo[0])
      else if (result?.error?._form) setError(result.error._form[0])
      else setNovo("")
    })
  }

  function handleRemove(cargoRowId: string) {
    startTransition(async () => {
      await removeCargoFromGhe(cargoRowId, gheId, pgrId)
    })
  }

  return (
    <div className="space-y-3">
      <form action={handleAdd} className="flex gap-2">
        <Input
          name="cargo_titulo"
          placeholder="Ex.: Eletricista, Pedreiro, Auxiliar de Obras..."
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          disabled={pending}
        />
        <Button type="submit" disabled={pending || novo.trim().length < 2}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {cargos.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">
          Nenhum cargo vinculado a este GHE.
        </p>
      ) : (
        <ul className="space-y-1">
          {cargos.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border bg-card px-3 py-1.5"
            >
              <span className="text-sm">{c.cargo_titulo}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(c.id)}
                disabled={pending}
                title="Remover cargo do GHE"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
