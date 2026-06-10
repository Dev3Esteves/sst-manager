import { unstable_noStore as noStore } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { flattenItens, type InstrumentoDef } from "@/lib/psicossocial/scoring"
import { ESCALA_PADRAO, type DefinicaoArmazenada } from "@/lib/psicossocial/instrumentos"
import { logger } from "@/lib/logger"
import { QuestionarioForm } from "./questionario-form"
import { BrandLogo } from "@/components/brand-logo"
import { getMarca } from "@/lib/branding/marca"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const metadata = { title: "Pesquisa de condições de trabalho" }

export default async function ColetaPage({ params }: { params: Promise<{ token: string }> }) {
  noStore() // coleta nunca pode ser servida de cache (status da campanha muda)
  const { token } = await params
  const admin = createAdminClient()

  const { data: convite, error } = await admin
    .from("psi_convite")
    .select("token, psi_campanha(titulo, versao_aplicada, status, psi_instrumento(definicao))")
    .eq("token", token)
    .maybeSingle()

  const campanha = convite
    ? Array.isArray(convite.psi_campanha)
      ? convite.psi_campanha[0]
      : convite.psi_campanha
    : null

  const valido = !!convite && campanha?.status === "aberta"
  if (!valido) {
    logger.warn("coleta-psi indisponivel", {
      tokenPrefix: token.slice(0, 8),
      erro: error?.message ?? null,
      achouConvite: !!convite,
      status: campanha?.status ?? null,
    })
  }

  // Definição do instrumento da campanha (data-driven): itens, escala e instrução.
  const instr = campanha
    ? Array.isArray(campanha.psi_instrumento)
      ? campanha.psi_instrumento[0]
      : campanha.psi_instrumento
    : null
  const definicao = (instr?.definicao ?? null) as DefinicaoArmazenada | null
  const versao = (campanha?.versao_aplicada as string) ?? "curto"
  const itens = valido && definicao ? flattenItens(definicao as InstrumentoDef, versao) : []
  const escala = definicao?.escala ?? ESCALA_PADRAO
  const instrucao = definicao?.instrucao ?? "Pense nas suas condições de trabalho e marque a frequência."
  const marca = await getMarca()

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-foreground text-background px-4 py-4 flex items-center gap-3">
        <BrandLogo logoUrl={marca.logoUrl} nome={marca.nome} variant="icon" height={28} />
        <div>
          <div className="text-sm font-semibold leading-tight">Pesquisa de condições de trabalho</div>
          <div className="text-xs opacity-70 leading-tight">{marca.nome} · NR-01</div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        {valido ? (
          <QuestionarioForm token={token} titulo={campanha?.titulo ?? "Pesquisa"} itens={itens} escala={escala} instrucao={instrucao} />
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
