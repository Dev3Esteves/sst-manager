/**
 * Dados compartilhados das regiões do corpo (acidentes).
 *
 * Fonte única usada tanto pelo seletor visual (client — body-region-selector.tsx)
 * quanto pela renderização no PDF de ocorrência (server — pdf/body-map.tsx).
 * Mantém os shapes em um único lugar para frente/verso não divergirem.
 *
 * Labels seguem a perspectiva do OBSERVADOR (ex.: "Braço esquerdo" = braço no lado
 * esquerdo da imagem).
 */

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

export type BodyShape = {
  id: RegiaoCorpo
  label: string
  /** Forma SVG básica */
  svg:
    | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
    | { t: "rect"; x: number; y: number; w: number; h: number; r?: number }
}

/** Dimensões do painel SVG (cada vista) */
export const BODY_W = 240
export const BODY_H = 500

// Regiões da FRENTE (ordem importa para Z-index — primeiro = fundo)
export const FRENTE: BodyShape[] = [
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
export const VERSO: BodyShape[] = [
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

/** Conjunto de códigos válidos (para validação/sanitização de entrada). */
export const REGIOES_VALIDAS = Object.keys(REGIOES_LABELS) as RegiaoCorpo[]

export function regioesToString(regioes: RegiaoCorpo[]): string {
  return regioes.map((r) => REGIOES_LABELS[r]).join(", ")
}
