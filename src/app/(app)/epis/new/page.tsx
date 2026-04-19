import { EpiForm } from "../epi-form"
import { createEpi } from "../actions"

export default function NewEpiPage() {
  return (
    <div className="container py-8 max-w-3xl">
      <EpiForm action={createEpi} />
    </div>
  )
}
