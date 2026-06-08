import { LoginForm } from "./login-form"
import { BrandLogo } from "@/components/brand-logo"
import { brand } from "@/config/brand"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo variant="full" height={56} priority className="max-w-[280px]" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{brand.appName}</h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestão de Segurança e Saúde do Trabalho
            </p>
          </div>
        </div>
        <LoginForm />
        {brand.companyName ? (
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {brand.companyLegalName || brand.companyName}
          </p>
        ) : null}
      </div>
    </div>
  )
}
