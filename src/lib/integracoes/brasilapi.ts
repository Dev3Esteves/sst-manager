// Cliente BrasilAPI — consulta de CNPJ e CEP para auto-preencher cadastros.
// Wrapper server-side com timeout e graceful degradation (não lança).

const TIMEOUT_MS = 10_000

export type ConsultaCnpjResultado =
  | {
      ok: true
      data: {
        razao_social: string
        nome_fantasia: string | null
        logradouro: string | null
        numero: string | null
        complemento: string | null
        bairro: string | null
        cep: string | null
        municipio: string | null
        uf: string | null
        situacao_cadastral: string | null
      }
    }
  | { ok: false; erro: string }

export type ConsultaCepResultado =
  | {
      ok: true
      data: {
        cep: string
        state: string
        city: string
        neighborhood: string | null
        street: string | null
      }
    }
  | { ok: false; erro: string }

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "")
}

// Cloudflare/WAF do BrasilAPI bloqueia requests sem User-Agent com 403.
const USER_AGENT = "SST-Manager/0.7 (+cadastro-empresa)"

async function fetchComTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store",
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function consultarCnpj(cnpjRaw: string): Promise<ConsultaCnpjResultado> {
  const cnpj = digitsOnly(cnpjRaw)
  if (cnpj.length !== 14) return { ok: false, erro: "CNPJ deve ter 14 dígitos" }

  try {
    const r = await fetchComTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, TIMEOUT_MS)
    if (r.status === 404) return { ok: false, erro: "CNPJ não encontrado na Receita Federal" }
    if (r.status === 403 || r.status === 429) {
      return { ok: false, erro: "Receita Federal indisponível no momento. Tente em alguns minutos ou preencha manualmente." }
    }
    if (!r.ok) return { ok: false, erro: `BrasilAPI retornou ${r.status}` }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const j = (await r.json()) as any
    return {
      ok: true,
      data: {
        razao_social: String(j.razao_social ?? "").trim(),
        nome_fantasia: j.nome_fantasia ? String(j.nome_fantasia).trim() : null,
        logradouro: j.logradouro ? String(j.logradouro).trim() : null,
        numero: j.numero ? String(j.numero).trim() : null,
        complemento: j.complemento ? String(j.complemento).trim() : null,
        bairro: j.bairro ? String(j.bairro).trim() : null,
        cep: j.cep ? String(j.cep).trim() : null,
        municipio: j.municipio ? String(j.municipio).trim() : null,
        uf: j.uf ? String(j.uf).trim() : null,
        situacao_cadastral: j.descricao_situacao_cadastral
          ? String(j.descricao_situacao_cadastral).trim()
          : null,
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro inesperado"
    if (msg.includes("abort")) return { ok: false, erro: "Tempo esgotado consultando BrasilAPI" }
    console.error("[brasilapi.consultarCnpj]", msg)
    return { ok: false, erro: "Falha ao consultar BrasilAPI" }
  }
}

export async function consultarCep(cepRaw: string): Promise<ConsultaCepResultado> {
  const cep = digitsOnly(cepRaw)
  if (cep.length !== 8) return { ok: false, erro: "CEP deve ter 8 dígitos" }

  try {
    const r = await fetchComTimeout(`https://brasilapi.com.br/api/cep/v2/${cep}`, TIMEOUT_MS)
    if (r.status === 404) return { ok: false, erro: "CEP não encontrado" }
    if (r.status === 403 || r.status === 429) {
      return { ok: false, erro: "BrasilAPI indisponível no momento. Tente em alguns minutos." }
    }
    if (!r.ok) return { ok: false, erro: `BrasilAPI retornou ${r.status}` }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const j = (await r.json()) as any
    return {
      ok: true,
      data: {
        cep: String(j.cep ?? cep),
        state: String(j.state ?? "").trim(),
        city: String(j.city ?? "").trim(),
        neighborhood: j.neighborhood ? String(j.neighborhood).trim() : null,
        street: j.street ? String(j.street).trim() : null,
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro inesperado"
    if (msg.includes("abort")) return { ok: false, erro: "Tempo esgotado consultando BrasilAPI" }
    console.error("[brasilapi.consultarCep]", msg)
    return { ok: false, erro: "Falha ao consultar BrasilAPI" }
  }
}
