import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { CampanhaForm } from "./campanha-form"

export default async function NovaCampanhaPage() {
  const supabase = await createClient()
  const { data: pgrs } = await supabase
    .from("pgr")
    .select("id, numero_revisao, status, obras(nome)")
    .in("status", ["rascunho", "vigente"])
    .order("created_at", { ascending: false })

  const opcoes = (pgrs ?? []).map((p) => {
    const obra = Array.isArray(p.obras) ? p.obras[0] : p.obras
    return {
      id: p.id,
      label: `${obra?.nome ?? "Obra"} — rev ${p.numero_revisao} (${p.status})`,
    }
  })

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova campanha psicossocial</h1>
        <p className="text-muted-foreground">
          A campanha avalia os GHEs de um PGR. Será gerado um link/QR anônimo por GHE.
        </p>
      </div>

      {opcoes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              Nenhum PGR disponível. Crie um PGR (com seus GHEs) em{" "}
              <Link href="/pgr/new" className="text-primary underline">/pgr</Link> antes de iniciar uma campanha.
            </div>
          </CardContent>
        </Card>
      ) : (
        <CampanhaForm pgrs={opcoes} />
      )}
    </div>
  )
}
