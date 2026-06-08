import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PwaRegister } from "@/components/pwa-register"
import { ThemeProvider } from "@/components/theme-provider"
import { CommandPalette } from "@/components/command-palette"
import { ErrorCapture } from "@/components/error-capture"
import { brand, appTitle } from "@/config/brand"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: appTitle,
  description: "Sistema de Gestão de Segurança e Saúde do Trabalho",
  // manifest é gerado dinamicamente por src/app/manifest.ts (white-label)
  appleWebApp: {
    capable: true,
    title: brand.appName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
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
