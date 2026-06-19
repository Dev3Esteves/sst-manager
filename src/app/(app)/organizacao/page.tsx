import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/guards"
import { getOrganizacao } from "@/lib/branding/marca"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Landmark, FileSignature, AlertTriangle } from "lucide-react"
import { MarcaForm } from "./marca-form"
import { TemplateCertificadoForm } from "../configuracoes/template-certificado-form"
import { salvarTemplateCertificadoOrganizacao } from "./actions"

type TabKey = "marca" | "certificado"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "marca", label: "Marca", icon: Landmark },
  { key: "certificado", label: "Certificado padrão", icon: FileSignature },
]

export default async function OrganizacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const ctx = await getAuth()
  if (!ctx) redirect("/login")
  if (ctx.perfil !== "admin") {
    return (
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-status-alerta" />
            Acesso restrito a administradores.
          </CardContent>
        </Card>
      </div>
    )
  }

  const sp = await searchParams
  const tab: TabKey = TABS.find((t) => t.key === sp.tab)?.key ?? "marca"

  const org = await getOrganizacao()

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Organização</h1>
        <p className="text-muted-foreground">Marca e modelo padrão de certificado do sistema.</p>
      </div>

      <div
        role="tablist"
        aria-label="Seções da organização"
        className="flex gap-2 border-b overflow-x-auto no-scrollbar"
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.key === tab
          return (
            <Link
              key={t.key}
              href={`/organizacao?tab=${t.key}`}
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

      {tab === "marca" && (
        <MarcaForm
          nome={org?.nome ?? ""}
          nomeFantasia={org?.nomeFantasia ?? null}
          logoUrl={org?.logoUrl ?? null}
        />
      )}

      {tab === "certificado" && (
        <TemplateCertificadoForm
          templateAtual={org?.templateCertificado ?? null}
          onSalvar={salvarTemplateCertificadoOrganizacao}
        />
      )}
    </div>
  )
}
