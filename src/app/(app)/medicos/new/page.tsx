import { checkRole } from "@/lib/auth/guards"
import { MedicoForm } from "../medico-form"
import { createMedico } from "../actions"

export default async function NewMedicoPage() {
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return (
    <div className="container py-8 max-w-3xl">
      <MedicoForm action={createMedico} />
    </div>
  )
}
