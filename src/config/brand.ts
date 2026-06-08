/**
 * Camada de branding (white-label).
 *
 * TODA a identidade visível do produto (nome, empresa, logos, domínio de
 * e-mail, cor de tema) sai daqui — nada de nome de cliente hard-coded no
 * resto do código. Para rodar com outro cliente, basta preencher as variáveis
 * `NEXT_PUBLIC_BRAND_*` no `.env.local` e trocar os SVGs em `/public/logos/`.
 *
 * Os valores são `NEXT_PUBLIC_*` porque também são usados em client components
 * (logo, rodapé). São embutidos no build — cada cliente faz o próprio deploy
 * com o seu env, então isso é o comportamento desejado.
 *
 * Sem nenhuma env definida, o produto roda 100% neutro (só "SST Manager",
 * sem nome de empresa).
 */

const env = (v: string | undefined) => v?.trim() || undefined

export const brand = {
  /** Nome do produto. Default neutro. */
  appName: env(process.env.NEXT_PUBLIC_BRAND_APP_NAME) ?? "SST Manager",

  /** Nome curto/fantasia da empresa dona da instância (ex.: "ACME"). Vazio = neutro. */
  companyName: env(process.env.NEXT_PUBLIC_BRAND_COMPANY_NAME) ?? "",

  /** Razão social completa, usada em rodapés legais. Cai pra companyName se vazio. */
  companyLegalName:
    env(process.env.NEXT_PUBLIC_BRAND_COMPANY_LEGAL) ??
    env(process.env.NEXT_PUBLIC_BRAND_COMPANY_NAME) ??
    "",

  /** Domínio usado em placeholders de e-mail (ex.: "exemplo.com.br"). */
  emailDomain: env(process.env.NEXT_PUBLIC_BRAND_EMAIL_DOMAIN) ?? "exemplo.com.br",

  /** Nome do sistema de RH integrado (read-only). Default genérico. */
  peopleName: env(process.env.NEXT_PUBLIC_BRAND_PEOPLE_NAME) ?? "People (RH)",

  /** Cor de tema (PWA / status bar). */
  themeColor: env(process.env.NEXT_PUBLIC_BRAND_THEME_COLOR) ?? "#1e293b",

  /**
   * Logos servidos de `/public/logos/`. Troque os arquivos pelo logo do
   * cliente mantendo os mesmos nomes (ou aponte para outros via env).
   */
  logo: {
    fullLight: env(process.env.NEXT_PUBLIC_BRAND_LOGO_FULL_LIGHT) ?? "/logos/brand-claro.svg",
    fullDark: env(process.env.NEXT_PUBLIC_BRAND_LOGO_FULL_DARK) ?? "/logos/brand-escuro.svg",
    iconLight: env(process.env.NEXT_PUBLIC_BRAND_LOGO_ICON_LIGHT) ?? "/logos/brand-icone-principal.svg",
    iconDark: env(process.env.NEXT_PUBLIC_BRAND_LOGO_ICON_DARK) ?? "/logos/brand-icone-branco.svg",
    /** Proporção (largura/altura) do logo horizontal, pra calcular o width. */
    fullAspect: Number(env(process.env.NEXT_PUBLIC_BRAND_LOGO_FULL_ASPECT)) || 480 / 96,
  },
} as const

/**
 * Título da aba/app: "SST Manager — ACME" quando há empresa; só "SST Manager"
 * quando neutro.
 */
export const appTitle = brand.companyName
  ? `${brand.appName} — ${brand.companyName}`
  : brand.appName

/** Texto curto de assinatura para rodapés de e-mail/PDF. */
export const brandSignature = brand.companyName
  ? `${brand.companyName} · ${brand.appName}`
  : brand.appName
