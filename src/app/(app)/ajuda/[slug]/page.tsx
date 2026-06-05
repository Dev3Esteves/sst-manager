import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getManual, MANUAIS } from "@/lib/ajuda/manuais"
import { ManualView } from "@/components/ajuda/manual-view"

export function generateStaticParams() {
  return MANUAIS.map((m) => ({ slug: m.slug }))
}

export default async function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const manual = getManual(slug)
  if (!manual) notFound()

  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ajuda"><ArrowLeft className="h-4 w-4" /> Todos os manuais</Link>
        </Button>
        {manual.rota && (
          <Button variant="outline" size="sm" asChild>
            <Link href={manual.rota}><ExternalLink className="h-4 w-4" /> Abrir módulo</Link>
          </Button>
        )}
      </div>
      <ManualView manual={manual} />
    </div>
  )
}
