"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import {
  ISHIKAWA_CATEGORIA,
  ISHIKAWA_CATEGORIA_LABEL,
  ISHIKAWA_CATEGORIA_HINT,
  type IshikawaCategoria,
} from "@/lib/validations/nao-conformidade"

export type IshikawaItem = {
  categoria: IshikawaCategoria
  causa: string
  eh_causa_raiz: boolean
  ordem: number
}

export function IshikawaEditor({
  inicial,
  action,
}: {
  inicial: IshikawaItem[]
  action: (itens: IshikawaItem[]) => Promise<{ error?: { _form?: string[] } } | { ok: boolean } | void>
}) {
  const [itens, setItens] = useState<IshikawaItem[]>(inicial)
  const [saved, setSaved] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function addItem(categoria: IshikawaCategoria) {
    const ordem = itens.filter((i) => i.categoria === categoria).length
    setItens((p) => [...p, { categoria, causa: "", eh_causa_raiz: false, ordem }])
    setSaved(false)
  }

  function updateItem(idx: number, patch: Partial<IshikawaItem>) {
    setItens((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
    setSaved(false)
  }

  function removeItem(idx: number) {
    setItens((p) => p.filter((_, i) => i !== idx))
    setSaved(false)
  }

  function handleSave() {
    setErrMsg(null)
    startTransition(async () => {
      const result = await action(itens)
      if (result && "error" in result && result.error?._form) {
        setErrMsg(result.error._form[0])
        setSaved(false)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Diagrama de espinha de peixe (6M). Adicione causas em cada categoria
        que possa ter contribuído. Marque aquelas que efetivamente geraram a NC
        como <strong>causa raiz</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ISHIKAWA_CATEGORIA.map((cat) => {
          const itensCat = itens
            .map((it, idx) => ({ it, idx }))
            .filter(({ it }) => it.categoria === cat)
          return (
            <div key={cat} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">
                    {ISHIKAWA_CATEGORIA_LABEL[cat]}
                  </div>
                  <div className="text-[10px] text-muted-foreground italic">
                    {ISHIKAWA_CATEGORIA_HINT[cat]}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addItem(cat)}
                  className="shrink-0"
                  aria-label={`Adicionar causa em ${ISHIKAWA_CATEGORIA_LABEL[cat]}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {itensCat.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  Nenhuma causa registrada nesta categoria.
                </p>
              ) : (
                <div className="space-y-2">
                  {itensCat.map(({ it, idx }) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Input
                          value={it.causa}
                          onChange={(e) => updateItem(idx, { causa: e.target.value })}
                          placeholder="Causa…"
                          className={
                            it.eh_causa_raiz
                              ? "border-status-critico bg-status-critico/5"
                              : ""
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          aria-label="Remover causa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateItem(idx, { eh_causa_raiz: !it.eh_causa_raiz })}
                        className={
                          "text-[10px] " +
                          (it.eh_causa_raiz
                            ? "text-status-critico font-semibold"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {it.eh_causa_raiz
                          ? "✓ Causa raiz"
                          : "Marcar como causa raiz"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {errMsg && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errMsg}
        </div>
      )}

      {saved && !errMsg && (
        <div className="flex items-center gap-2 rounded-md border border-status-regular bg-status-regular/10 p-2 text-xs text-status-regular">
          <CheckCircle2 className="h-4 w-4" />
          Ishikawa salvo.
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar Ishikawa
      </Button>
    </div>
  )
}
