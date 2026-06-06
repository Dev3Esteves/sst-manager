import { checkRole } from "@/lib/auth/guards"
import { AnaliseForm } from "../analise-form"
import { createAnalise } from "../actions"

export default async function NovaAnalisePage() {
  const r = await checkRole(["admin", "engenheiro_seg", "tec_seguranca", "gestor_diretoria"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return <div className="container py-8 max-w-3xl"><AnaliseForm action={createAnalise} /></div>
}
