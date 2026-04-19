import { ImportWizard } from "@/components/import-wizard"
import { empresaImport } from "@/lib/import/schemas"
import { importarEmpresas } from "./actions"

export const dynamic = "force-dynamic"

export default function ImportarEmpresasPage() {
  return (
    <ImportWizard
      schema={empresaImport}
      titulo="Importar empresas"
      descricao="Cadastre ou atualize empresas em lote via planilha CSV. Duplicatas (mesmo CNPJ) são atualizadas."
      voltarHref="/empresas"
      action={importarEmpresas}
    />
  )
}
