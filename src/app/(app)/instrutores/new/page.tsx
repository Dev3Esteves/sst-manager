import { checkRole } from "@/lib/auth/guards"
import { InstrutorForm } from "../instrutor-form"
import { createInstrutor } from "../actions"

export default async function NewInstrutorPage() {
  const r = await checkRole(["admin", "tec_seguranca", "engenheiro_seg"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return <div className="container py-8 max-w-3xl"><InstrutorForm action={createInstrutor} /></div>
}
