import { checkRole } from "@/lib/auth/guards"
import { RequisitoForm } from "../requisito-form"
import { createRequisito } from "../actions"

export default async function NovoRequisitoPage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return <div className="container py-8 max-w-3xl"><RequisitoForm action={createRequisito} /></div>
}
