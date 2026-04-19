import { TreinamentoForm } from "../treinamento-form"
import { createTreinamento } from "../actions"

export default function NewTreinamentoPage() {
  return (
    <div className="container py-8 max-w-3xl">
      <TreinamentoForm action={createTreinamento} />
    </div>
  )
}
