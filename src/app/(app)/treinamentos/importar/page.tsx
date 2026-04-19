import { ImportWizard } from "@/components/import-wizard"
import { treinamentoImport } from "@/lib/import/schemas"
import { importarTreinamentos } from "./actions"

export const dynamic = "force-dynamic"

export default function ImportarTreinamentosPage() {
  return (
    <ImportWizard
      schema={treinamentoImport}
      titulo="Importar treinamentos (catálogo)"
      descricao="Cadastre o catálogo de treinamentos em lote. Duplicatas (mesmo título + NR) são atualizadas."
      voltarHref="/treinamentos"
      action={importarTreinamentos}
    />
  )
}
