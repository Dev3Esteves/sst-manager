import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Keyboard } from "lucide-react"
import { PageHeader } from "@/components/page-header"

type Atalho = { teclas: string[]; descricao: string }

const SECOES: { titulo: string; descricao: string; atalhos: Atalho[] }[] = [
  {
    titulo: "Navegação",
    descricao: "Movimente-se rápido pelo sistema sem tirar as mãos do teclado.",
    atalhos: [
      { teclas: ["Ctrl", "K"], descricao: "Abrir paleta de comandos (pesquisar páginas, ações e dados)" },
      { teclas: ["Esc"], descricao: "Fechar paleta ou modal aberto" },
      { teclas: ["↑", "↓"], descricao: "Navegar entre itens da paleta" },
      { teclas: ["Enter"], descricao: "Selecionar item destacado" },
    ],
  },
  {
    titulo: "Busca global",
    descricao: "A paleta busca também em dados cadastrados.",
    atalhos: [
      { teclas: ["Ctrl", "K"], descricao: "Abrir e comece a digitar — nome de colaborador, CNPJ, título de documento..." },
      { teclas: ["2+ caracteres"], descricao: "A busca em dados dispara após 2 caracteres (debounced 250ms)" },
    ],
  },
  {
    titulo: "Tema",
    descricao: "Claro, escuro ou automático conforme o sistema operacional.",
    atalhos: [
      { teclas: ["Ícone ☀/🌙/🖥"], descricao: "Alterne entre claro / escuro / sistema no topo direito" },
    ],
  },
  {
    titulo: "Mobile / tablet",
    descricao: "Para uso em campo.",
    atalhos: [
      { teclas: ["☰"], descricao: "Menu lateral com todas as seções (canto superior esquerdo)" },
      { teclas: ["⊕ central"], descricao: "Ações rápidas: novo DDS, ocorrência, inspeção, exame..." },
      { teclas: ["Tap em vencimento"], descricao: "Abre o painel de vencimentos filtrado" },
    ],
  },
  {
    titulo: "Impressão",
    descricao: "Relatórios otimizados para impressão ou export PDF.",
    atalhos: [
      { teclas: ["Ctrl", "P"], descricao: "Imprimir a página atual. Sidebar e botões escondem automaticamente." },
    ],
  },
]

export default function AtalhosPage() {
  return (
    <div className="container py-8 max-w-3xl space-y-6">
      <PageHeader
        icon={<Keyboard />}
        title="Atalhos de teclado"
        description="Referência rápida para usar o sistema com mais agilidade."
      />

      {SECOES.map((s) => (
        <Card key={s.titulo}>
          <CardHeader>
            <CardTitle className="text-base">{s.titulo}</CardTitle>
            <CardDescription>{s.descricao}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {s.atalhos.map((a, i) => (
                <li key={i} className="flex items-center gap-4 py-2.5">
                  <div className="flex items-center gap-1">
                    {a.teclas.map((t, j) => (
                      <span key={j}>
                        {j > 0 && <span className="mx-0.5 text-muted-foreground">+</span>}
                        <kbd className="inline-flex items-center rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                          {t}
                        </kbd>
                      </span>
                    ))}
                  </div>
                  <span className="text-sm flex-1">{a.descricao}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
