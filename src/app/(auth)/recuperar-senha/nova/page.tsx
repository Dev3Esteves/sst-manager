import { NovaSenhaForm } from "./nova-senha-form"
import { BrandLogo } from "@/components/brand-logo"

export default function NovaSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo variant="full" height={56} priority className="max-w-[280px]" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Definir nova senha</h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma nova senha para sua conta.
            </p>
          </div>
        </div>
        <NovaSenhaForm />
      </div>
    </div>
  )
}
