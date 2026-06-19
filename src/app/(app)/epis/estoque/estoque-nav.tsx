import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Boxes, MapPin, ShoppingCart, ArrowLeftRight, History, ClipboardList,
  SlidersHorizontal, FileBarChart,
} from "lucide-react"

export type SecaoEstoque =
  | "saldos" | "locais" | "compras" | "transferencias"
  | "kardex" | "inventario" | "parametros" | "relatorios"

const ITENS: { chave: SecaoEstoque; label: string; href: string; Icon: typeof Boxes }[] = [
  { chave: "saldos", label: "Saldos", href: "/epis/estoque", Icon: Boxes },
  { chave: "locais", label: "Locais", href: "/epis/estoque/locais", Icon: MapPin },
  { chave: "compras", label: "Compras", href: "/epis/estoque/compras", Icon: ShoppingCart },
  { chave: "transferencias", label: "Transferências", href: "/epis/estoque/transferencias", Icon: ArrowLeftRight },
  { chave: "kardex", label: "Kardex", href: "/epis/estoque/kardex", Icon: History },
  { chave: "inventario", label: "Inventário", href: "/epis/estoque/inventario", Icon: ClipboardList },
  { chave: "parametros", label: "Parâmetros", href: "/epis/estoque/parametros", Icon: SlidersHorizontal },
  { chave: "relatorios", label: "Relatórios", href: "/epis/estoque/relatorios", Icon: FileBarChart },
]

/**
 * Barra de navegação do módulo de estoque de EPIs. Responsiva (quebra de linha)
 * e adaptativa em qualquer resolução; destaca a seção atual.
 */
export function EstoqueNav({ atual }: { atual: SecaoEstoque }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Navegação do estoque de EPIs">
      {ITENS.map(({ chave, label, href, Icon }) => (
        <Button
          key={chave}
          variant={chave === atual ? "default" : "outline"}
          size="sm"
          asChild
          aria-current={chave === atual ? "page" : undefined}
        >
          <Link href={href}><Icon className="h-4 w-4" />{label}</Link>
        </Button>
      ))}
    </nav>
  )
}
