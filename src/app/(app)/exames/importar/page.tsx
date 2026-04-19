import { ImportWizard } from "@/components/import-wizard"
import { exameImport } from "@/lib/import/schemas"
import { importarExames } from "./actions"

export const dynamic = "force-dynamic"

export default function ImportarExamesPage() {
  return (
    <ImportWizard
      schema={exameImport}
      titulo="Importar exames médicos (ASOs)"
      descricao="Cadastre exames em lote. Colaborador é resolvido pelo CPF. Duplicatas (mesmo colaborador + tipo + data de realização) são atualizadas."
      voltarHref="/exames"
      action={importarExames}
    />
  )
}
