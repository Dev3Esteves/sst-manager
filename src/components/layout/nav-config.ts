/**
 * Fonte ÚNICA da navegação principal (sidebar desktop + drawer mobile).
 * Mantenha os itens aqui — os dois componentes consomem este arquivo, então o
 * menu nunca mais fica diferente entre desktop e celular.
 */
import {
  LayoutDashboard, Building2, Users, UserCog, HeartPulse, GraduationCap,
  HardHat, FileText, AlertTriangle, ClipboardCheck, Clock, Grid3x3,
  History, MessageSquare, FileBarChart, MapPin, Settings,
  HardDrive, ListTodo, BookMarked, ShieldCheck, Brain, BookOpen,
  Stethoscope, Hospital, School, UserCheck, Gauge, BadgeCheck, ScrollText,
  Replace, Network, Landmark, Scale, Target, Siren, SearchCheck, Megaphone,
  Webhook,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon; disabled?: boolean }
export type NavSection = { label?: string; items: NavItem[] }

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vencimentos", label: "Vencimentos", icon: Clock },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/empresas", label: "Empresas", icon: Building2 },
      { href: "/obras", label: "Obras", icon: HardDrive },
      { href: "/cargos", label: "Cargos", icon: Users },
      { href: "/colaboradores", label: "Colaboradores", icon: Users },
      { href: "/epis", label: "EPIs", icon: HardHat },
      { href: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
      { href: "/instrutores", label: "Instrutores", icon: UserCheck },
      { href: "/entidades-treinamento", label: "Entidades", icon: School },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/exames", label: "Exames médicos", icon: HeartPulse },
      { href: "/medicos", label: "Médicos", icon: Stethoscope },
      { href: "/clinicas", label: "Clínicas", icon: Hospital },
      { href: "/gro", label: "Painel GRO", icon: Gauge },
      { href: "/contexto", label: "Contexto & Partes", icon: Network },
      { href: "/politica", label: "Política de SST", icon: ScrollText },
      { href: "/gestao-mudanca", label: "Gestão de Mudança", icon: Replace },
      { href: "/analise-critica", label: "Análise Crítica", icon: Landmark },
      { href: "/objetivos", label: "Objetivos de SST", icon: Target },
      { href: "/pgr", label: "PGR", icon: ShieldCheck },
      { href: "/psicossocial", label: "Psicossocial (NR-01)", icon: Brain },
      { href: "/documentos", label: "Documentos SST", icon: FileText },
      { href: "/dds", label: "DDS", icon: MessageSquare },
      { href: "/comunicacao", label: "Comunicação e Consulta", icon: Megaphone },
      { href: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
      { href: "/plano-emergencia", label: "Plano de Emergência", icon: Siren },
      { href: "/inspecoes", label: "Inspeções", icon: ClipboardCheck },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/matriz-treinamentos", label: "Matriz treinamentos", icon: Grid3x3 },
      { href: "/nao-conformidades", label: "Não-Conformidades", icon: ShieldCheck },
      { href: "/auditorias", label: "Auditorias internas", icon: SearchCheck },
      { href: "/iso-45001", label: "Aderência ISO 45001", icon: BadgeCheck },
      { href: "/relatorios/mensal", label: "Relatório mensal", icon: FileBarChart },
      { href: "/relatorios/heatmap-ocorrencias", label: "Heatmap ocorrências", icon: MapPin },
    ],
  },
  {
    label: "Referências",
    items: [
      { href: "/referencias/nrs", label: "Normas Regulamentadoras", icon: BookMarked },
      { href: "/referencias/esocial", label: "Tabela 22 eSocial", icon: BookMarked },
      { href: "/requisitos-legais", label: "Requisitos legais", icon: Scale },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/usuarios", label: "Usuários", icon: UserCog },
      { href: "/admin/treinamento", label: "Controle de treino", icon: GraduationCap },
      { href: "/admin/integracoes", label: "Integração People", icon: Webhook },
      { href: "/jobs", label: "Fila de jobs", icon: ListTodo },
      { href: "/auditoria", label: "Auditoria", icon: History },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
  {
    items: [
      { href: "/treinamento", label: "Treinamento", icon: GraduationCap },
      { href: "/ajuda", label: "Ajuda / Manuais", icon: BookOpen },
    ],
  },
]
