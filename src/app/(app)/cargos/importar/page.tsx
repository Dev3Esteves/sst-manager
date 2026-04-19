import { ImportWizard } from "@/components/import-wizard"
import { cargoImport } from "@/lib/import/schemas"
import { importarCargos } from "./actions"

// Schema Zod contém objetos com prototipos — não serializáveis para static export.
export const dynamic = "force-dynamic"

export default function ImportarCargosPage() {
  return (
    <ImportWizard
      schema={cargoImport}
      titulo="Importar cargos"
      descricao="Cadastre cargos em lote. Empresa é resolvida pelo CNPJ. NRs aplicáveis podem ser separadas por vírgula (ex: 'NR-10, NR-35'). Duplicatas (mesmo título + empresa) são atualizadas."
      voltarHref="/cargos"
      action={importarCargos}
    />
  )
}
