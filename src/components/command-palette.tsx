"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard, Building2, Users, UserCog, HeartPulse, GraduationCap,
  HardHat, FileText, AlertTriangle, ClipboardCheck, Clock, Grid3x3,
  History, MessageSquare, FileBarChart, MapPin, Plus, FileSpreadsheet, Package,
  ScanLine, Sparkles, Award,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type SearchResult = {
  tipo: "colaborador" | "empresa" | "documento" | "ocorrencia"
  id: string
  label: string
  sublabel: string
  href: string
}

const TIPO_ICON: Record<SearchResult["tipo"], LucideIcon> = {
  colaborador: Users,
  empresa: Building2,
  documento: FileText,
  ocorrencia: AlertTriangle,
}

const TIPO_LABEL: Record<SearchResult["tipo"], string> = {
  colaborador: "Colaboradores",
  empresa: "Empresas",
  documento: "Documentos",
  ocorrencia: "Ocorrências",
}

type Item = {
  label: string
  href: string
  icon: LucideIcon
  keywords?: string[]
  shortcut?: string
}

const NAVEGACAO: Item[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "kpi"] },
  { label: "Vencimentos", href: "/vencimentos", icon: Clock, keywords: ["prazos", "semaforo"] },
  { label: "Empresas", href: "/empresas", icon: Building2 },
  { label: "Cargos", href: "/cargos", icon: Users },
  { label: "Colaboradores", href: "/colaboradores", icon: Users, keywords: ["funcionarios", "empregados"] },
  { label: "Exames médicos", href: "/exames", icon: HeartPulse, keywords: ["aso", "pcmso"] },
  { label: "Treinamentos", href: "/treinamentos", icon: GraduationCap },
  { label: "Realizações de treinamento", href: "/treinamentos/realizacoes", icon: Award },
  { label: "EPIs", href: "/epis", icon: HardHat },
  { label: "Entregas de EPI", href: "/epis/entregas", icon: HardHat },
  { label: "Documentos SST", href: "/documentos", icon: FileText, keywords: ["apr", "pt", "autorizacao"] },
  { label: "DDS — Diálogo Diário", href: "/dds", icon: MessageSquare },
  { label: "Ocorrências", href: "/ocorrencias", icon: AlertTriangle, keywords: ["acidentes", "cat"] },
  { label: "Inspeções", href: "/inspecoes", icon: ClipboardCheck },
  { label: "Matriz de treinamentos", href: "/matriz-treinamentos", icon: Grid3x3, keywords: ["gap"] },
  { label: "Relatório mensal", href: "/relatorios/mensal", icon: FileBarChart, keywords: ["kpi", "gerencial"] },
  { label: "Heatmap de ocorrências", href: "/relatorios/heatmap-ocorrencias", icon: MapPin },
  { label: "Usuários", href: "/usuarios", icon: UserCog, keywords: ["acesso", "login"] },
  { label: "Auditoria", href: "/auditoria", icon: History, keywords: ["log", "lgpd"] },
]

const ACOES: Item[] = [
  { label: "Nova empresa", href: "/empresas/new", icon: Plus },
  { label: "Novo cargo", href: "/cargos/new", icon: Plus },
  { label: "Novo colaborador", href: "/colaboradores/new", icon: Plus },
  { label: "Registrar exame médico", href: "/exames/new", icon: Plus },
  { label: "Escanear ASO (OCR)", href: "/exames/ocr", icon: ScanLine, keywords: ["digitalizar"] },
  { label: "Novo treinamento", href: "/treinamentos/new", icon: Plus },
  { label: "Registrar realização de treinamento", href: "/treinamentos/realizacoes/new", icon: Plus },
  { label: "Novo EPI", href: "/epis/new", icon: Plus },
  { label: "Nova entrega de EPI", href: "/epis/entregas/new", icon: Plus },
  { label: "Novo documento", href: "/documentos/new", icon: Plus },
  { label: "Gerar documentos em lote", href: "/documentos/lote", icon: Package, keywords: ["zip"] },
  { label: "Novo DDS", href: "/dds/new", icon: Plus },
  { label: "Registrar ocorrência", href: "/ocorrencias/new", icon: Plus },
  { label: "Nova inspeção", href: "/inspecoes/new", icon: Plus },
  { label: "Novo usuário", href: "/usuarios/new", icon: Plus, keywords: ["convite"] },
]

const IMPORTACAO: Item[] = [
  { label: "Importar empresas", href: "/empresas/importar", icon: FileSpreadsheet },
  { label: "Importar cargos", href: "/cargos/importar", icon: FileSpreadsheet },
  { label: "Importar colaboradores", href: "/colaboradores/importar", icon: FileSpreadsheet },
  { label: "Importar exames", href: "/exames/importar", icon: FileSpreadsheet },
  { label: "Importar treinamentos", href: "/treinamentos/importar", icon: FileSpreadsheet },
  { label: "Importar EPIs", href: "/epis/importar", icon: FileSpreadsheet },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Debounce da busca em dados — só dispara com 2+ caracteres, aguarda 250ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.resultados ?? [])
        }
      } catch {
        // silencioso — resultados ficam vazios
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Agrupa resultados por tipo
  const resultsPorTipo: Record<SearchResult["tipo"], SearchResult[]> = {
    colaborador: [],
    empresa: [],
    documento: [],
    ocorrencia: [],
  }
  for (const r of results) resultsPorTipo[r.tipo].push(r)

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Pesquisar páginas, ações ou dados (colaboradores, empresas...)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? "Buscando..." : query.length >= 2 ? "Nada encontrado." : "Digite ao menos 2 caracteres para buscar em dados."}
        </CommandEmpty>

        {/* Resultados em dados (aparece só quando há busca) */}
        {results.length > 0 && (
          <>
            {(Object.keys(resultsPorTipo) as SearchResult["tipo"][]).map((tipo) => {
              const itens = resultsPorTipo[tipo]
              if (itens.length === 0) return null
              const Icon = TIPO_ICON[tipo]
              return (
                <CommandGroup key={tipo} heading={TIPO_LABEL[tipo]}>
                  {itens.map((r) => (
                    <CommandItem
                      key={`${tipo}-${r.id}`}
                      value={`${r.label} ${r.sublabel}`}
                      onSelect={() => go(r.href)}
                    >
                      <Icon className="mr-2 opacity-80" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{r.label}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{r.sublabel}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navegação">
          {NAVEGACAO.map((i) => (
            <CommandItem
              key={i.href}
              value={`${i.label} ${(i.keywords ?? []).join(" ")}`}
              onSelect={() => go(i.href)}
            >
              <i.icon className="mr-2" />
              {i.label}
              <CommandShortcut>{i.href}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Ações rápidas">
          {ACOES.map((i) => (
            <CommandItem
              key={i.href}
              value={`${i.label} ${(i.keywords ?? []).join(" ")} criar novo`}
              onSelect={() => go(i.href)}
            >
              <Sparkles className="mr-2 opacity-70" />
              {i.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Importar em lote">
          {IMPORTACAO.map((i) => (
            <CommandItem
              key={i.href}
              value={i.label}
              onSelect={() => go(i.href)}
            >
              <i.icon className="mr-2" />
              {i.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/** Botão trigger para a topbar — mostra o atalho de teclado. */
export function CommandPaletteTrigger() {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac/.test(navigator.platform))
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        // dispara Ctrl+K manualmente — o handler global da paleta captura
        const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
        document.dispatchEvent(event)
      }}
      className="inline-flex items-center gap-2 rounded-md border bg-muted/40 hover:bg-muted transition-colors px-2.5 py-1.5 text-xs text-muted-foreground"
      aria-label="Abrir paleta de comandos"
    >
      <span className="hidden sm:inline">Pesquisar...</span>
      <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium">
        {isMac ? "⌘" : "Ctrl"}
        <span className="text-[8px]">+</span>K
      </kbd>
    </button>
  )
}
