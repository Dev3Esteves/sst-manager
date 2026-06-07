import { checkRole } from "@/lib/auth/guards"
import { MessageSquare } from "lucide-react"
import { ComunicacaoManager } from "./comunicacao-manager"

export default async function ComunicacaoPage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria", "encarregado_campo"])
  if (r.status === "unauth") return <div className="container py-10 text-center text-muted-foreground">Sessão expirada.</div>
  if (r.status === "forbidden") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>

  const { data: registros } = await r.ctx.supabase
    .from("registro_comunicacao")
    .select("id, data, tipo, assunto, publico_alvo, canal, ativo")
    .order("data", { ascending: false })

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="h-7 w-7" /> Comunicação e consulta</h1>
        <p className="text-muted-foreground">Comunicações (internas/externas) e consulta/participação dos trabalhadores (ISO 45001 — 7.4 e 5.4).</p>
      </div>
      <ComunicacaoManager registros={registros ?? []} />
    </div>
  )
}
