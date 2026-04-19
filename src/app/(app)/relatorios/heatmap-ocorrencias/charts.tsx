"use client"

import { Treemap, Tooltip, ResponsiveContainer } from "recharts"

export type TreemapCell = {
  name: string
  count: number
  peso: number
  gravidadeMaxima: "leve" | "moderado" | "grave" | "fatal" | null
  color: string
}

export function OcorrenciasTreemap({ data }: { data: TreemapCell[] }) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sem dados no período selecionado.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <Treemap
        data={data}
        dataKey="peso"
        nameKey="name"
        stroke="#fff"
        fill="#8884d8"
        content={<TreemapContent />}
      >
        <Tooltip content={<TreemapTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  )
}

type TreemapContentProps = {
  depth?: number
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  count?: number
  color?: string
}

function TreemapContent(props: TreemapContentProps) {
  const { x = 0, y = 0, width = 0, height = 0, name, count, color } = props
  const tooSmall = width < 60 || height < 40

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color ?? "#8884d8",
          stroke: "#fff",
          strokeWidth: 2,
          opacity: 0.92,
        }}
      />
      {!tooSmall && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontSize={11}
            fontWeight="bold"
          >
            {truncate(name ?? "", Math.floor(width / 7))}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            opacity={0.9}
          >
            {count} ocorr.
          </text>
        </>
      )}
    </g>
  )
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)) + "…"
}

type TooltipPayload = { payload?: TreemapCell }

function TreemapTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
      <div className="font-semibold">{d.name}</div>
      <div className="text-muted-foreground">
        {d.count} ocorrência(s)
        {d.gravidadeMaxima && ` · máx: ${d.gravidadeMaxima}`}
      </div>
    </div>
  )
}
