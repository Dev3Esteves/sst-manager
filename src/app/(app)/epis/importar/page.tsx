import { ImportWizard } from "@/components/import-wizard"
import { epiImport } from "@/lib/import/schemas"
import { importarEpis } from "./actions"

export const dynamic = "force-dynamic"

export default function ImportarEpisPage() {
  return (
    <ImportWizard
      schema={epiImport}
      titulo="Importar EPIs"
      descricao="Cadastre o catálogo de EPIs em lote. Duplicatas (mesmo CA) são atualizadas."
      voltarHref="/epis"
      action={importarEpis}
    />
  )
}
