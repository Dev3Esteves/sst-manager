import { describe, it, expect } from "vitest"
import { scaleDimensions } from "./compress"

describe("scaleDimensions", () => {
  it("não faz upscale quando a imagem já é menor que maxEdge", () => {
    expect(scaleDimensions(800, 600, 1280)).toEqual({ width: 800, height: 600 })
  })

  it("escala pela largura quando paisagem excede maxEdge", () => {
    expect(scaleDimensions(2560, 1440, 1280)).toEqual({ width: 1280, height: 720 })
  })

  it("escala pela altura quando retrato excede maxEdge", () => {
    expect(scaleDimensions(1440, 2560, 1280)).toEqual({ width: 720, height: 1280 })
  })

  it("preserva o aspect ratio (quadrado)", () => {
    expect(scaleDimensions(4000, 4000, 1280)).toEqual({ width: 1280, height: 1280 })
  })

  it("trata exatamente no limite sem alterar", () => {
    expect(scaleDimensions(1280, 960, 1280)).toEqual({ width: 1280, height: 960 })
  })

  it("arredonda dimensões fracionárias", () => {
    // 3000x2000 → fator 1280/3000 → 1280 x 853.33 → 853
    expect(scaleDimensions(3000, 2000, 1280)).toEqual({ width: 1280, height: 853 })
  })

  it("retorna zeros para dimensões inválidas", () => {
    expect(scaleDimensions(0, 100, 1280)).toEqual({ width: 0, height: 0 })
    expect(scaleDimensions(-5, 10, 1280)).toEqual({ width: 0, height: 0 })
  })
})
