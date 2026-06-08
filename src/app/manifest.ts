import type { MetadataRoute } from "next"
import { brand, appTitle } from "@/config/brand"

/**
 * Web App Manifest (PWA) gerado dinamicamente a partir do branding.
 * Substitui o antigo `public/manifest.json` estático — agora nome, tema e
 * ícone seguem o cliente configurado em `@/config/brand`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appTitle,
    short_name: brand.appName,
    description: "Sistema de Gestão de Segurança e Saúde do Trabalho",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: brand.themeColor,
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  }
}
