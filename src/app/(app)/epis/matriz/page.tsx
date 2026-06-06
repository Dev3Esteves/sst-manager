import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { MatrizEditor } from "./matriz-editor"

export default async function EpiMatrizPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Administrador.</div>

  const [{ data: cargos }, { data: epis }, { data: vinculos }] = await Promise.all([
    r.ctx.supabase.from("cargos").select("id, titulo").order("titulo"),
    r.ctx.supabase.from("epis").select("id, descricao, ca").order("descricao"),
    r.ctx.supabase.from("epi_cargo").select("cargo_id, epi_id"),
  ])

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link href="/epis"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matriz EPI × Cargo</h1>
          <p className="text-muted-foreground">EPIs obrigatórios por função (NR-06).</p>
        </div>
      </div>
      <MatrizEditor cargos={cargos ?? []} epis={epis ?? []} vinculos={vinculos ?? []} />
    </div>
  )
}
