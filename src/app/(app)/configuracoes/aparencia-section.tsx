"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const OPCOES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

export function AparenciaSection() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aparência</CardTitle>
        <CardDescription>Escolha o tema da interface. A opção é salva neste navegador.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          {OPCOES.map((o) => {
            const Icon = o.icon
            const ativo = mounted && theme === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setTheme(o.value)}
                aria-pressed={ativo}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border p-4 text-sm transition-colors",
                  ativo ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/50 text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {o.label}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
