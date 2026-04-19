import { LoginForm } from "./login-form"
import { ShieldCheck } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SST Manager</h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Gestão de Segurança e Saúde do Trabalho
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
