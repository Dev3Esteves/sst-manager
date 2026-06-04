import { createAdminClient } from "@/lib/supabase/admin"
import { itensDaVersao } from "@/lib/psicossocial/copsoq"
import { QuestionarioForm } from "./questionario-form"
import { SistengeLogo } from "@/components/sistenge-logo"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pesquisa de condições de trabalho" }

export default async function ColetaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: convite } = await admin
    .from("psi_convite")
    .select("token, psi_campanha(titulo, versao_aplicada, status)")
    .eq("token", token)
    .maybeSingle()

  const campanha = convite
    ? Array.isArray(convite.psi_campanha)
      ? convite.psi_campanha[0]
      : convite.psi_campanha
    : null

  const valido = !!convite && campanha?.status === "aberta"
  const versao = (campanha?.versao_aplicada as "curto" | "medio") ?? "curto"
  const itens = valido ? itensDaVersao(versao) : []

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-foreground text-background px-4 py-4 flex items-center gap-3">
        <SistengeLogo variant="icon" height={28} />
        <div>
          <div className="text-sm font-semibold leading-tight">Pesquisa de condições de trabalho</div>
          <div className="text-xs opacity-70 leading-tight">SISTENGE · NR-01</div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        {valido ? (
          <QuestionarioForm token={token} titulo={campanha?.titulo ?? "Pesquisa"} itens={itens} />
        ) : (
          <div className="mt-10 rounded-lg border bg-background p-6 text-center">
            <h1 className="text-lg font-semibold">Pesquisa indisponível</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este link é inválido ou a pesquisa não está aberta para respostas no momento.
              Procure o responsável de SST/RH da sua obra.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
