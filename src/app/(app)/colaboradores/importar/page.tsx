import { ImportWizard } from "@/components/import-wizard"
import { colaboradorImport } from "@/lib/import/schemas"
import { importarColaboradores } from "./actions"

export const dynamic = "force-dynamic"

export default function ImportarColaboradoresPage() {
  return (
    <ImportWizard
      schema={colaboradorImport}
      titulo="Importar colaboradores"
      descricao="Cadastre em lote. Empresa é resolvida pelo CNPJ, cargo pelo título. Duplicatas (mesmo CPF) são atualizadas."
      voltarHref="/colaboradores"
      action={importarColaboradores}
    />
  )
}
