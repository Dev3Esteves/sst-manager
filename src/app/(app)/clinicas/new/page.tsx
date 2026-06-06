import { checkRole } from "@/lib/auth/guards"
import { ClinicaForm } from "../clinica-form"
import { createClinica } from "../actions"

export default async function NewClinicaPage() {
  const r = await checkRole(["admin", "tec_seguranca", "rh_administrativo"])
  if (r.status !== "ok") return <div className="container py-10 text-center text-muted-foreground">Acesso restrito.</div>
  return (
    <div className="container py-8 max-w-3xl">
      <ClinicaForm action={createClinica} />
    </div>
  )
}
