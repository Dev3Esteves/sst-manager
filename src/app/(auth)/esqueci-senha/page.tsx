import { AuthShell } from "../auth-shell"
import { EsqueciSenhaForm } from "./esqueci-senha-form"

export const metadata = { title: "Recuperar senha — SST Manager" }

export default function EsqueciSenhaPage() {
  return (
    <AuthShell>
      <EsqueciSenhaForm />
    </AuthShell>
  )
}
