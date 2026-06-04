/**
 * Compressão de imagem client-side para anexos de inspeção.
 *
 * A foto é redimensionada e recomprimida em JPEG ANTES de entrar no payload.
 * Como a inspeção é salva como JSONB (e pode ir pela fila offline em
 * IndexedDB), a foto viaja embutida como data URL — então precisa ser pequena.
 * Com maxEdge=1280 / quality=0.6 uma foto de celular cai para ~80–150 KB.
 *
 * `scaleDimensions` é pura (sem DOM) e testável; `compressImage` usa canvas
 * e só roda no browser.
 */

export type CompressOptions = {
  /** Maior lado da imagem resultante, em pixels. */
  maxEdge?: number
  /** Qualidade JPEG entre 0 e 1. */
  quality?: number
}

const DEFAULTS = { maxEdge: 1280, quality: 0.6 }

/**
 * Calcula as dimensões alvo preservando o aspect ratio, limitando o maior
 * lado a `maxEdge`. Nunca faz upscale (imagens menores ficam como estão).
 */
export function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width: Math.round(width), height: Math.round(height) }
  const factor = maxEdge / longest
  return { width: Math.round(width * factor), height: Math.round(height * factor) }
}

/**
 * Lê um File de imagem, redimensiona e devolve um data URL JPEG comprimido.
 * Rejeita se o arquivo não for imagem ou o canvas não estiver disponível.
 */
export function compressImage(file: File, opts: CompressOptions = {}): Promise<string> {
  const { maxEdge, quality } = { ...DEFAULTS, ...opts }

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo selecionado não é uma imagem."))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Falha ao decodificar a imagem."))
      img.onload = () => {
        const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxEdge)
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas indisponível neste navegador."))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
