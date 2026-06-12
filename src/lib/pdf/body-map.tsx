import { Svg, Rect, Ellipse, View, Text } from "@react-pdf/renderer"
import { FRENTE, VERSO, BODY_W, BODY_H, type BodyShape } from "@/lib/body-regions"

/**
 * Desenha o mapa do corpo (frente/verso) no PDF de ocorrência, destacando em
 * vermelho as regiões atingidas. Espelha o seletor visual do formulário
 * (body-region-selector.tsx), reaproveitando os shapes de @/lib/body-regions.
 */

function Panel({ titulo, shapes, sel }: { titulo: string; shapes: BodyShape[]; sel: Set<string> }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 8, fontWeight: "bold", marginBottom: 2, color: "#475569" }}>{titulo}</Text>
      <Svg width={120} height={250} viewBox={`0 0 ${BODY_W} ${BODY_H}`}>
        {shapes.map((s, i) => {
          const on = sel.has(s.id)
          const fill = on ? "#dc2626" : "#e2e8f0"
          const fillOpacity = on ? 0.55 : 0.5
          const stroke = on ? "#991b1b" : "#94a3b8"
          const sw = on ? 2 : 1
          if (s.svg.t === "ellipse") {
            return (
              <Ellipse key={i} cx={s.svg.cx} cy={s.svg.cy} rx={s.svg.rx} ry={s.svg.ry}
                fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={sw} />
            )
          }
          return (
            <Rect key={i} x={s.svg.x} y={s.svg.y} width={s.svg.w} height={s.svg.h} rx={s.svg.r ?? 0}
              fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={sw} />
          )
        })}
      </Svg>
    </View>
  )
}

export function BodyMapPdf({ regioes }: { regioes: string[] }) {
  const sel = new Set(regioes)
  return (
    <View style={{ flexDirection: "row", gap: 24, justifyContent: "center", marginTop: 6 }} wrap={false}>
      <Panel titulo="Frente" shapes={FRENTE} sel={sel} />
      <Panel titulo="Verso" shapes={VERSO} sel={sel} />
    </View>
  )
}
