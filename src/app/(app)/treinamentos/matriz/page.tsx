import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { MatrizTreinamentoEditor } from "./matriz-editor"

export default async function TreinamentoMatrizPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito a Segurança/Administrador.</div>

  const [{ data: cargos }, { data: treinamentos }, { data: vinculos }] = await Promise.all([
    r.ctx.supabase.from("cargos").select("id, titulo").order("titulo"),
    r.ctx.supabase.from("treinamentos").select("id, titulo, nr_referencia").order("titulo"),
    r.ctx.supabase.from("treinamento_cargo").select("cargo_id, treinamento_id"),
  ])

  return (
    <div className="container py-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar" asChild><Link href="/treinamentos"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matriz Treinamento × Cargo</h1>
          <p className="text-muted-foreground">Defina os treinamentos obrigatórios de cada função.</p>
        </div>
      </div>
      <MatrizTreinamentoEditor cargos={cargos ?? []} treinamentos={treinamentos ?? []} vinculos={vinculos ?? []} />
    </div>
  )
}
