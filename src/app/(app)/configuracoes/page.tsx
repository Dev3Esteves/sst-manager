import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth/guards"
import { updateEmpresa } from "../empresas/actions"
import { EmpresaForm } from "../empresas/empresa-form"
import { TrocarSenhaForm } from "./trocar-senha-form"
import { TemplateCertificadoForm } from "./template-certificado-form"
import { AparenciaSection } from "./aparencia-section"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Building2, KeyRound, Palette, FileSignature, AlertTriangle } from "lucide-react"

type TabKey = "empresa" | "conta" | "aparencia" | "certificado"

const ADMIN_TABS: TabKey[] = ["empresa", "certificado"]

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "conta", label: "Minha conta", icon: KeyRound },
  { key: "aparencia", label: "Aparência", icon: Palette },
  { key: "certificado", label: "Certificado", icon: FileSignature },
]

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const ctx = await getAuth()
  if (!ctx) redirect("/login")
  const isAdmin = ctx.perfil === "admin"

  // Abas visíveis conforme o perfil
  const visibleTabs = TABS.filter((t) => isAdmin || !ADMIN_TABS.includes(t.key))

  const sp = await searchParams
  const requested = visibleTabs.find((t) => t.key === sp.tab)?.key
  const tab: TabKey = requested ?? visibleTabs[0].key

  // Empresa-dona da organização (RLS já isola por org). Usada nas abas admin.
  let empresaDona: Record<string, unknown> | null = null
  if (isAdmin) {
    const { data } = await ctx.supabase
      .from("empresas")
      .select(
        "id, razao_social, nome_fantasia, cnpj, inscricao_estadual, tipo, dona_sistema, empresa_mae_id, ativo, logo_url, template_certificado",
      )
      .eq("dona_sistema", true)
      .order("razao_social")
      .limit(1)
      .maybeSingle()
    empresaDona = data
  }

  return (
    <div className="container py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Empresa, conta e preferências do sistema.</p>
      </div>

      <div
        role="tablist"
        aria-label="Seções de configuração"
        className="flex gap-2 border-b overflow-x-auto no-scrollbar"
      >
        {visibleTabs.map((t) => {
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

      {tab === "empresa" && (
        empresaDona ? (
          <EmpresaForm
            empresa={empresaDona as React.ComponentProps<typeof EmpresaForm>["empresa"]}
            action={updateEmpresa.bind(null, empresaDona.id as string)}
          />
        ) : (
          <SemEmpresaDona />
        )
      )}

      {tab === "conta" && <TrocarSenhaForm />}

      {tab === "aparencia" && <AparenciaSection />}

      {tab === "certificado" && (
        empresaDona ? (
          <TemplateCertificadoForm
            empresaId={empresaDona.id as string}
            templateAtual={(empresaDona.template_certificado as string | null) ?? null}
          />
        ) : (
          <SemEmpresaDona />
        )
      )}
    </div>
  )
}

function SemEmpresaDona() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <div>
          Nenhuma empresa dona do sistema cadastrada.{" "}
          <Link href="/empresas/new" className="text-primary underline">
            Cadastre uma empresa
          </Link>{" "}
          marcada como “dona do sistema” para configurar estes campos.
        </div>
      </CardContent>
    </Card>
  )
}
