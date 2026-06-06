import Link from "next/link"
import { checkRole } from "@/lib/auth/guards"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CatalogoManager } from "./catalogo-manager"

export default async function DdsCatalogoPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg", "encarregado_campo"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const [{ data: temas }, { data: mediadores }] = await Promise.all([
    r.ctx.supabase.from("dds_temas").select("id, titulo, descricao, ativo").order("titulo"),
    r.ctx.supabase.from("dds_mediadores").select("id, nome, cargo, tipo, ativo").order("nome"),
  ])

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link href="/dds"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de DDS</h1>
          <p className="text-muted-foreground">Temas e mediadores reutilizáveis nos diálogos de segurança.</p>
        </div>
      </div>
      <CatalogoManager temas={temas ?? []} mediadores={mediadores ?? []} />
    </div>
  )
}
