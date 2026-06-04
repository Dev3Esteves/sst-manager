import { AuthShell } from "../auth-shell"
import { RedefinirSenhaForm } from "./redefinir-senha-form"

export const metadata = { title: "Definir nova senha — SST Manager" }

export default function RedefinirSenhaPage() {
  return (
    <AuthShell>
      <RedefinirSenhaForm />
    </AuthShell>
  )
}
