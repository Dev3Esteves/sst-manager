/**
 * Baixa o logo da empresa e converte para data URI.
 * @react-pdf/renderer funciona melhor com data URI (imagens embedadas)
 * do que com URLs externas (podem falhar por CORS/timeout em render server-side).
 */
export async function fetchLogoAsDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) return null
    // @react-pdf/renderer não suporta SVG — exige raster
    if (contentType.includes("svg")) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}
