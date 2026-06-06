import { checkRole } from "@/lib/auth/guards"
import { EntidadeForm } from "../entidade-form"
import { createEntidade } from "../actions"

export default async function NewEntidadePage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return <div className="container py-8 max-w-3xl"><EntidadeForm action={createEntidade} /></div>
}
