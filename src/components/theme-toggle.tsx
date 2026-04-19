"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Evita flash de tema errado no SSR — renderiza placeholder até hidratar
  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor
  const label = theme === "light" ? "Tema claro" : theme === "dark" ? "Tema escuro" : "Tema do sistema"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`${label} — clique para alternar`}
      aria-label={`Alternar tema (atual: ${label})`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
