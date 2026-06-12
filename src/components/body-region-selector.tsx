"use client"

/**
 * Seletor visual de região do corpo atingida em acidente.
 *
 * Duas vistas (frente e verso) com ~20 regiões clicáveis cada.
 * Labels seguem perspectiva do **observador** (viewer) para intuitividade,
 * ex: "Braço esquerdo" = braço no lado esquerdo da imagem.
 *
 * Uso:
 *   <BodyRegionSelector value={["cabeca","mao_dir"]} onChange={setRegioes} />
 */

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import {
  type RegiaoCorpo,
  type BodyShape as Shape,
  BODY_W as W,
  BODY_H as H,
  FRENTE,
  VERSO,
  REGIOES_LABELS,
  regioesToString,
} from "@/lib/body-regions"

// Reexporta para consumidores existentes (ex.: ocorrencia-form.tsx)
export { REGIOES_LABELS, regioesToString }
export type { RegiaoCorpo }

export function BodyRegionSelector({
  value, onChange, disabled,
}: {
  value: RegiaoCorpo[]
  onChange: (r: RegiaoCorpo[]) => void
  disabled?: boolean
}) {
  const [hover, setHover] = useState<string | null>(null)
  const selecionados = new Set(value)

  function toggle(id: RegiaoCorpo) {
    if (disabled) return
    const next = new Set(selecionados)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        <BodyPanel
          title="Frente"
          shapes={FRENTE}
          selecionados={selecionados}
          hover={hover}
          onToggle={toggle}
          onHoverIn={setHover}
          onHoverOut={() => setHover(null)}
          disabled={disabled}
        />
        <BodyPanel
          title="Verso"
          shapes={VERSO}
          selecionados={selecionados}
          hover={hover}
          onToggle={toggle}
          onHoverIn={setHover}
          onHoverOut={() => setHover(null)}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-xs text-muted-foreground">
          {value.length === 0
            ? "Clique nas regiões atingidas. Você pode marcar várias."
            : `${value.length} região(ões) selecionada(s)`}
        </div>
        {value.length > 0 && !disabled && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Limpar seleção
          </Button>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((r) => (
            <Badge key={r} variant="vencido" className="gap-1">
              {REGIOES_LABELS[r]}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className="hover:bg-black/20 rounded-full"
                  aria-label={`Remover ${REGIOES_LABELS[r]}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function BodyPanel({
  title, shapes, selecionados, hover, onToggle, onHoverIn, onHoverOut, disabled,
}: {
  title: string
  shapes: Shape[]
  selecionados: Set<RegiaoCorpo>
  hover: string | null
  onToggle: (r: RegiaoCorpo) => void
  onHoverIn: (id: string) => void
  onHoverOut: () => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground min-h-[18px]">
          {hover ?? ""}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto max-h-[400px]"
        role="img"
        aria-label={`Seleção de regiões — ${title}`}
      >
        {shapes.map((s) => {
          const selected = selecionados.has(s.id)
          const uid = `${title}-${s.id}`
          const isHover = hover === uid
          return (
            <g
              key={uid}
              onClick={() => onToggle(s.id)}
              onMouseEnter={() => onHoverIn(s.label)}
              onMouseLeave={onHoverOut}
              style={{ cursor: disabled ? "not-allowed" : "pointer" }}
            >
              {renderShape(s, selected, isHover)}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function renderShape(s: Shape, selected: boolean, hover: boolean) {
  const fill = selected
    ? "rgba(185, 28, 28, 0.55)" // vermelho-700 translúcido
    : hover
    ? "rgba(148, 163, 184, 0.35)" // slate-400 translúcido
    : "rgba(226, 232, 240, 0.5)" // slate-200
  const stroke = selected ? "#991b1b" : "#94a3b8"
  const strokeWidth = selected ? 2 : 1

  if (s.svg.t === "ellipse") {
    return <ellipse cx={s.svg.cx} cy={s.svg.cy} rx={s.svg.rx} ry={s.svg.ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  }
  return (
    <rect
      x={s.svg.x} y={s.svg.y} width={s.svg.w} height={s.svg.h}
      rx={s.svg.r ?? 0}
      fill={fill} stroke={stroke} strokeWidth={strokeWidth}
    />
  )
}
