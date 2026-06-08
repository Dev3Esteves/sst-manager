import { RecuperarSenhaForm } from "./recuperar-senha-form"
import { BrandLogo } from "@/components/brand-logo"

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo variant="full" height={56} priority className="max-w-[280px]" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Recuperar senha</h1>
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail para receber o link de redefinição.
            </p>
          </div>
        </div>
        <RecuperarSenhaForm />
      </div>
    </div>
  )
}
