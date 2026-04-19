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

export type RegiaoCorpo =
  // frente
  | "cabeca" | "face" | "pescoco"
  | "ombro_esq" | "ombro_dir"
  | "braco_esq" | "braco_dir"
  | "mao_esq" | "mao_dir"
  | "torax" | "abdomen"
  | "quadril_esq" | "quadril_dir"
  | "coxa_esq" | "coxa_dir"
  | "joelho_esq" | "joelho_dir"
  | "perna_esq" | "perna_dir"
  | "pe_esq" | "pe_dir"
  // verso (exclusivas)
  | "nuca" | "costas_superior" | "costas_inferior" | "gluteos"

type Shape = {
  id: RegiaoCorpo
  label: string
  /** Forma SVG básica */
  svg:
    | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
    | { t: "rect"; x: number; y: number; w: number; h: number; r?: number }
}

// Dimensões do painel SVG (cada vista)
const W = 240
const H = 500

// Regiões da FRENTE (ordem importa para Z-index — primeiro = fundo)
const FRENTE: Shape[] = [
  // membros grandes primeiro, detalhes depois
  { id: "braco_esq", label: "Braço esquerdo", svg: { t: "rect", x: 54, y: 120, w: 28, h: 95, r: 12 } },
  { id: "braco_dir", label: "Braço direito", svg: { t: "rect", x: 158, y: 120, w: 28, h: 95, r: 12 } },
  { id: "mao_esq", label: "Mão esquerda", svg: { t: "ellipse", cx: 68, cy: 228, rx: 15, ry: 18 } },
  { id: "mao_dir", label: "Mão direita", svg: { t: "ellipse", cx: 172, cy: 228, rx: 15, ry: 18 } },
  { id: "ombro_esq", label: "Ombro esquerdo", svg: { t: "ellipse", cx: 82, cy: 118, rx: 16, ry: 14 } },
  { id: "ombro_dir", label: "Ombro direito", svg: { t: "ellipse", cx: 158, cy: 118, rx: 16, ry: 14 } },
  { id: "torax", label: "Tórax", svg: { t: "rect", x: 85, y: 115, w: 70, h: 65, r: 10 } },
  { id: "abdomen", label: "Abdômen", svg: { t: "rect", x: 92, y: 180, w: 56, h: 55, r: 6 } },
  { id: "quadril_esq", label: "Quadril esquerdo", svg: { t: "rect", x: 82, y: 235, w: 42, h: 28, r: 8 } },
  { id: "quadril_dir", label: "Quadril direito", svg: { t: "rect", x: 116, y: 235, w: 42, h: 28, r: 8 } },
  { id: "coxa_esq", label: "Coxa esquerda", svg: { t: "rect", x: 88, y: 263, w: 32, h: 85, r: 10 } },
  { id: "coxa_dir", label: "Coxa direita", svg: { t: "rect", x: 120, y: 263, w: 32, h: 85, r: 10 } },
  { id: "joelho_esq", label: "Joelho esquerdo", svg: { t: "ellipse", cx: 104, cy: 358, rx: 16, ry: 12 } },
  { id: "joelho_dir", label: "Joelho direito", svg: { t: "ellipse", cx: 136, cy: 358, rx: 16, ry: 12 } },
  { id: "perna_esq", label: "Perna esquerda", svg: { t: "rect", x: 90, y: 370, w: 28, h: 80, r: 8 } },
  { id: "perna_dir", label: "Perna direita", svg: { t: "rect", x: 122, y: 370, w: 28, h: 80, r: 8 } },
  { id: "pe_esq", label: "Pé esquerdo", svg: { t: "ellipse", cx: 104, cy: 465, rx: 18, ry: 14 } },
  { id: "pe_dir", label: "Pé direito", svg: { t: "ellipse", cx: 136, cy: 465, rx: 18, ry: 14 } },
  { id: "pescoco", label: "Pescoço", svg: { t: "rect", x: 110, y: 90, w: 20, h: 20, r: 4 } },
  { id: "face", label: "Face", svg: { t: "ellipse", cx: 120, cy: 60, rx: 18, ry: 22 } },
  { id: "cabeca", label: "Cabeça", svg: { t: "ellipse", cx: 120, cy: 48, rx: 30, ry: 36 } },
]

// Regiões do VERSO (labels específicos + membros espelhados)
const VERSO: Shape[] = [
  { id: "braco_dir", label: "Braço direito (verso)", svg: { t: "rect", x: 54, y: 120, w: 28, h: 95, r: 12 } },
  { id: "braco_esq", label: "Braço esquerdo (verso)", svg: { t: "rect", x: 158, y: 120, w: 28, h: 95, r: 12 } },
  { id: "mao_dir", label: "Mão direita (verso)", svg: { t: "ellipse", cx: 68, cy: 228, rx: 15, ry: 18 } },
  { id: "mao_esq", label: "Mão esquerda (verso)", svg: { t: "ellipse", cx: 172, cy: 228, rx: 15, ry: 18 } },
  { id: "ombro_dir", label: "Ombro direito (verso)", svg: { t: "ellipse", cx: 82, cy: 118, rx: 16, ry: 14 } },
  { id: "ombro_esq", label: "Ombro esquerdo (verso)", svg: { t: "ellipse", cx: 158, cy: 118, rx: 16, ry: 14 } },
  { id: "costas_superior", label: "Costas (superior)", svg: { t: "rect", x: 85, y: 115, w: 70, h: 65, r: 10 } },
  { id: "costas_inferior", label: "Costas / Lombar", svg: { t: "rect", x: 92, y: 180, w: 56, h: 55, r: 6 } },
  { id: "gluteos", label: "Glúteos", svg: { t: "rect", x: 82, y: 235, w: 76, h: 28, r: 8 } },
  { id: "coxa_dir", label: "Coxa direita (verso)", svg: { t: "rect", x: 88, y: 263, w: 32, h: 85, r: 10 } },
  { id: "coxa_esq", label: "Coxa esquerda (verso)", svg: { t: "rect", x: 120, y: 263, w: 32, h: 85, r: 10 } },
  { id: "joelho_dir", label: "Joelho direito (verso)", svg: { t: "ellipse", cx: 104, cy: 358, rx: 16, ry: 12 } },
  { id: "joelho_esq", label: "Joelho esquerdo (verso)", svg: { t: "ellipse", cx: 136, cy: 358, rx: 16, ry: 12 } },
  { id: "perna_dir", label: "Panturrilha direita", svg: { t: "rect", x: 90, y: 370, w: 28, h: 80, r: 8 } },
  { id: "perna_esq", label: "Panturrilha esquerda", svg: { t: "rect", x: 122, y: 370, w: 28, h: 80, r: 8 } },
  { id: "pe_dir", label: "Pé direito (verso)", svg: { t: "ellipse", cx: 104, cy: 465, rx: 18, ry: 14 } },
  { id: "pe_esq", label: "Pé esquerdo (verso)", svg: { t: "ellipse", cx: 136, cy: 465, rx: 18, ry: 14 } },
  { id: "nuca", label: "Nuca", svg: { t: "rect", x: 110, y: 90, w: 20, h: 20, r: 4 } },
  { id: "cabeca", label: "Cabeça (verso)", svg: { t: "ellipse", cx: 120, cy: 48, rx: 30, ry: 36 } },
]

export const REGIOES_LABELS: Record<RegiaoCorpo, string> = {
  cabeca: "Cabeça", face: "Face", pescoco: "Pescoço", nuca: "Nuca",
  ombro_esq: "Ombro esquerdo", ombro_dir: "Ombro direito",
  braco_esq: "Braço esquerdo", braco_dir: "Braço direito",
  mao_esq: "Mão esquerda", mao_dir: "Mão direita",
  torax: "Tórax", abdomen: "Abdômen",
  costas_superior: "Costas superior", costas_inferior: "Costas / lombar",
  gluteos: "Glúteos",
  quadril_esq: "Quadril esquerdo", quadril_dir: "Quadril direito",
  coxa_esq: "Coxa esquerda", coxa_dir: "Coxa direita",
  joelho_esq: "Joelho esquerdo", joelho_dir: "Joelho direito",
  perna_esq: "Perna esquerda", perna_dir: "Perna direita",
  pe_esq: "Pé esquerdo", pe_dir: "Pé direito",
}

export function regioesToString(regioes: RegiaoCorpo[]): string {
  return regioes.map((r) => REGIOES_LABELS[r]).join(", ")
}

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
