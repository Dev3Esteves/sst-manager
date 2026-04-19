import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, ShieldCheck, Zap, Mountain, Cuboid, FileCheck2 } from "lucide-react"

const TIPOS = [
  {
    tipo: "os_nr01",
    titulo: "Ordem de Serviço NR-01 (por função)",
    descricao: "Emitida por cargo para todos os colaboradores da função em uma obra. Pré-preenche riscos e EPIs.",
    icon: FileCheck2,
    href: "/documentos/os-nr01/new",
    enabled: true,
  },
  {
    tipo: "apr",
    titulo: "APR — Análise Preliminar de Risco",
    descricao: "Matriz 5×5 de risco, equipe, medidas de controle e EPIs.",
    icon: ClipboardList,
    href: "/documentos/apr/new",
    enabled: true,
  },
  {
    tipo: "autorizacao_nr10",
    titulo: "Autorização NR-10",
    descricao: "Eletricidade. Valida ASO e treinamento NR-10 antes de emitir.",
    icon: Zap,
    href: "/documentos/autorizacao-nr/new?nr=NR-10",
    enabled: true,
  },
  {
    tipo: "autorizacao_nr35",
    titulo: "Autorização NR-35",
    descricao: "Trabalho em altura. Valida aptidão + treinamento NR-35.",
    icon: Mountain,
    href: "/documentos/autorizacao-nr/new?nr=NR-35",
    enabled: true,
  },
  {
    tipo: "autorizacao_nr33",
    titulo: "Autorização NR-33",
    descricao: "Espaço confinado. Valida aptidão + treinamento NR-33.",
    icon: Cuboid,
    href: "/documentos/autorizacao-nr/new?nr=NR-33",
    enabled: true,
  },
  {
    tipo: "pt_altura",
    titulo: "PT — Trabalho em altura",
    descricao: "Checklist NR-35: cinto, ancoragem, distância de queda.",
    icon: Mountain,
    href: "/documentos/pt/new?tipo=altura",
    enabled: true,
  },
  {
    tipo: "pt_confinado",
    titulo: "PT — Espaço confinado",
    descricao: "Checklist NR-33: atmosfera, ventilação, vigia externo.",
    icon: Cuboid,
    href: "/documentos/pt/new?tipo=confinado",
    enabled: true,
  },
  {
    tipo: "pt_quente",
    titulo: "PT — Trabalho a quente",
    descricao: "Soldagem, corte, esmerilhamento — vigia do fogo.",
    icon: ShieldCheck,
    href: "/documentos/pt/new?tipo=quente",
    enabled: true,
  },
  {
    tipo: "pt_eletrico",
    titulo: "PT — Serviço elétrico",
    descricao: "Desenergização, LOTO, aterramento temporário.",
    icon: Zap,
    href: "/documentos/pt/new?tipo=eletrico",
    enabled: true,
  },
] as const

export default function NewDocumentoPage() {
  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo documento</h1>
        <p className="text-muted-foreground">Escolha o tipo de documento a emitir.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TIPOS.map((t) => {
          const Icon = t.icon
          const content = (
            <Card className={t.enabled ? "h-full transition-colors hover:border-primary" : "h-full opacity-60"}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{t.titulo}</CardTitle>
                    <CardDescription className="mt-1">{t.descricao}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {t.enabled ? (
                  <span className="text-sm text-primary">Criar →</span>
                ) : (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Em breve</span>
                )}
              </CardContent>
            </Card>
          )
          return t.enabled ? <Link key={t.tipo} href={t.href}>{content}</Link> : <div key={t.tipo}>{content}</div>
        })}
      </div>
    </div>
  )
}
