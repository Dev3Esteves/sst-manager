import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight } from "lucide-react"
import { MANUAIS, CATEGORIAS } from "@/lib/ajuda/manuais"

export const metadata = { title: "Ajuda / Manuais — SST Manager" }

export default function AjudaPage() {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-7 w-7" /> Ajuda / Manuais
        </h1>
        <p className="text-muted-foreground">
          Guia de uso de cada módulo, com passo a passo, exemplos, padrões de escrita e cenários.
        </p>
      </div>

      {CATEGORIAS.map((cat) => {
        const manuais = MANUAIS.filter((m) => m.categoria === cat)
        if (manuais.length === 0) return null
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {manuais.map((m) => (
                <Link key={m.slug} href={`/ajuda/${m.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader>
                      <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">{m.modulo}</div>
                      <CardTitle className="text-base">{m.titulo}</CardTitle>
                      <CardDescription className="line-clamp-3">{m.resumo}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between pt-0">
                      <div className="flex flex-wrap gap-1">
                        {m.perfis.slice(0, 2).map((p) => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <p className="text-xs text-muted-foreground">{MANUAIS.length} manuais disponíveis.</p>
    </div>
  )
}
