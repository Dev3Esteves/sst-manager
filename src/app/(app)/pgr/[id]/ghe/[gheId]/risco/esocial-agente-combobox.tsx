"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown, X } from "lucide-react"
import {
  ESOCIAL_GRUPO_LABEL,
  validarCompatibilidadeEsocial,
  type EsocialGrupo,
  type RiscoCategoria,
} from "@/lib/validations/pgr"

export type EsocialAgenteCatalog = {
  codigo: string
  descricao: string
  grupo: EsocialGrupo
  exige_aposentadoria_especial: boolean
  observacao: string | null
}

const GRUPO_ORDEM: EsocialGrupo[] = [
  "fisico",
  "quimico",
  "biologico",
  "associacao",
  "ausencia",
]

export function EsocialAgenteCombobox({
  name,
  defaultValue,
  catalogo,
  categoria,
}: {
  /** name do input hidden — vai para FormData com o codigo selecionado */
  name: string
  defaultValue: string | null | undefined
  catalogo: EsocialAgenteCatalog[]
  /** Categoria do risco no form, para validação cruzada do grupo */
  categoria: RiscoCategoria
}) {
  const [open, setOpen] = useState(false)
  const [codigoSel, setCodigoSel] = useState<string>(defaultValue ?? "")

  const catalogoById = useMemo(
    () => new Map(catalogo.map((c) => [c.codigo, c])),
    [catalogo],
  )

  const grouped = useMemo(() => {
    const map = new Map<EsocialGrupo, EsocialAgenteCatalog[]>()
    for (const c of catalogo) {
      const arr = map.get(c.grupo) ?? []
      arr.push(c)
      map.set(c.grupo, arr)
    }
    return map
  }, [catalogo])

  const selecionado = codigoSel ? catalogoById.get(codigoSel) : undefined
  const warning = selecionado
    ? validarCompatibilidadeEsocial(categoria, selecionado.grupo)
    : null

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={codigoSel} />

      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between font-normal"
      >
        {selecionado ? (
          <span className="flex items-center gap-2 truncate">
            <span className="font-mono text-xs">{selecionado.codigo}</span>
            <span className="truncate">{selecionado.descricao}</span>
          </span>
        ) : codigoSel ? (
          <span className="flex items-center gap-2 text-amber-600">
            <span className="font-mono text-xs">{codigoSel}</span>
            <span className="text-xs italic">(código fora do catálogo)</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Selecionar código da Tabela 24 eSocial…
          </span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {selecionado && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant="outline">{ESOCIAL_GRUPO_LABEL[selecionado.grupo]}</Badge>
          {selecionado.exige_aposentadoria_especial && (
            <Badge variant="alerta">Aposentadoria especial</Badge>
          )}
          <button
            type="button"
            onClick={() => setCodigoSel("")}
            className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        </div>
      )}

      {warning && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2 text-xs text-amber-700 dark:text-amber-300">
          ⚠ {warning}
        </div>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar por código ou descrição…" />
        <CommandList>
          <CommandEmpty>Nenhum agente encontrado.</CommandEmpty>
          {GRUPO_ORDEM.map((grupo) => {
            const itens = grouped.get(grupo)
            if (!itens || itens.length === 0) return null
            return (
              <CommandGroup key={grupo} heading={ESOCIAL_GRUPO_LABEL[grupo]}>
                {itens.map((item) => (
                  <CommandItem
                    key={item.codigo}
                    value={`${item.codigo} ${item.descricao} ${ESOCIAL_GRUPO_LABEL[item.grupo]}`}
                    onSelect={() => {
                      setCodigoSel(item.codigo)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={
                        "mr-1 h-4 w-4 " +
                        (codigoSel === item.codigo ? "opacity-100" : "opacity-0")
                      }
                    />
                    <span className="font-mono text-xs w-20 shrink-0">
                      {item.codigo}
                    </span>
                    <span className="flex-1 truncate">{item.descricao}</span>
                    {item.exige_aposentadoria_especial && (
                      <Badge variant="alerta" className="ml-2 text-[10px]">
                        ap. esp.
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
