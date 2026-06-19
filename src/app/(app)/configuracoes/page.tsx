import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/guards"
import { TrocarSenhaForm } from "./trocar-senha-form"
import { AparenciaSection } from "./aparencia-section"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { KeyRound, Palette, Landmark } from "lucide-react"

type TabKey = "conta" | "aparencia"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "conta", label: "Minha conta", icon: KeyRound },
  { key: "aparencia", label: "Aparência", icon: Palette },
]

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const ctx = await getAuth()
  if (!ctx) redirect("/login")
  const isAdmin = ctx.perfil === "admin"

  const sp = await searchParams
  const tab: TabKey = TABS.find((t) => t.key === sp.tab)?.key ?? "conta"

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Conta e preferências do sistema.</p>
      </div>

      {isAdmin && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Marca e certificado padrão</p>
                <p className="text-xs text-muted-foreground">
                  Configurados em Minha Organização.
                </p>
              </div>
            </div>
            <Link href="/organizacao" className="text-sm text-primary underline whitespace-nowrap">
              Abrir
            </Link>
          </CardContent>
        </Card>
      )}

      <div
        role="tablist"
        aria-label="Seções de configuração"
        className="flex gap-2 border-b overflow-x-auto no-scrollbar"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.key === tab
          return (
            <Link
              key={t.key}
              href={`/configuracoes?tab=${t.key}`}
              role="tab"
              aria-selected={active}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          )
        })}
      </div>

      {tab === "conta" && <TrocarSenhaForm />}

      {tab === "aparencia" && <AparenciaSection />}
    </div>
  )
}
