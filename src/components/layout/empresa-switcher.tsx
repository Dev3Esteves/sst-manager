"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { EmpresaOpcao } from "@/lib/auth/empresa-context"
import { definirEmpresaAtiva } from "./empresa-switcher-actions"

/**
 * Seletor de empresa ativa. Só aparece para usuários que podem operar mais de
 * uma empresa (ex.: operadores do grupo Sistenge/Paseli). Trocar a empresa
 * refaz a navegação — todos os submenus passam a refletir a empresa escolhida.
 */
export function EmpresaSwitcher({
  empresas, ativaId,
}: {
  empresas: EmpresaOpcao[]
  ativaId: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Sem seletor para quem opera uma única empresa (comportamento de hoje).
  if (empresas.length <= 1) return null

  function trocar(empresaId: string) {
    if (empresaId === ativaId) return
    startTransition(async () => {
      const r = await definirEmpresaAtiva(empresaId)
      if (!r.ok) {
        toast.error("Não foi possível trocar de empresa", { description: r.error })
        return
      }
      const nome = empresas.find((e) => e.id === empresaId)?.razao_social
      toast.success(nome ? `Empresa ativa: ${nome}` : "Empresa alterada")
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Building2 className="h-4 w-4 text-muted-foreground" />
      )}
      <Select value={ativaId ?? undefined} onValueChange={trocar} disabled={pending}>
        <SelectTrigger
          className="h-8 w-[180px] border-none bg-transparent text-sm font-medium shadow-none focus:ring-0"
          aria-label="Empresa ativa"
        >
          <SelectValue placeholder="Selecionar empresa" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
