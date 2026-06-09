import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PwaRegister } from "@/components/pwa-register"
import { ThemeProvider } from "@/components/theme-provider"
import { CommandPalette } from "@/components/command-palette"
import { ErrorCapture } from "@/components/error-capture"
import { getMarca } from "@/lib/branding/marca"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export async function generateMetadata(): Promise<Metadata> {
  const marca = await getMarca()
  const title =
    marca.nome && marca.nome !== "SST Manager" ? `SST Manager — ${marca.nome}` : "SST Manager"
  return {
    title,
    description: "Sistema de Gestão de Segurança e Saúde do Trabalho",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: "SST Manager",
      statusBarStyle: "default",
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: "/icon.svg",
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ErrorCapture />
          {children}
          <CommandPalette />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
