import { LoginForm } from "./login-form"
import { SistengeLogo } from "@/components/sistenge-logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <SistengeLogo variant="full" height={56} priority className="max-w-[280px]" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">SST Manager</h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestão de Segurança e Saúde do Trabalho
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SISTENGE Engenharia
        </p>
      </div>
    </div>
  )
}
