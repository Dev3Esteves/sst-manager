/**
 * Mapa: rota do app → módulo de treinamento exigido (slug da TRILHA).
 *
 * A trava de treinamento só libera o uso de um módulo depois que o usuário
 * conclui o treinamento correspondente. Rotas do "shell" (dashboard, a própria
 * trilha de treinamento, ajuda e ferramentas administrativas) NÃO são travadas
 * para evitar deadlock — o admin precisa conseguir configurar a trava e o
 * usuário precisa conseguir abrir o treinamento.
 *
 * O resolvedor casa pelo prefixo mais longo, então rotas filhas herdam o
 * módulo do pai automaticamente (ex.: /pgr/123 usa o mesmo de /pgr).
 */
import { getModulo } from "./trilha"

/** prefixo de rota → slug do módulo da trilha. Ordem não importa (casa o mais longo). */
const ROTA_MODULO: Record<string, string> = {
  "/vencimentos": "boas-vindas",
  "/empresas": "multiempresa",
  "/obras": "cadastros-base",
  "/cargos": "cadastros-base",
  "/colaboradores": "cadastros-base",
  "/epis/estoque": "estoque-epis",
  "/epis": "epis-nr06",
  "/treinamentos": "treinamentos",
  "/matriz-treinamentos": "treinamentos",
  "/instrutores": "treinamentos",
  "/entidades-treinamento": "treinamentos",
  "/exames": "exames-aso",
  "/medicos": "medicos-clinicas",
  "/clinicas": "medicos-clinicas",
  "/gro": "pgr-gro",
  "/pgr": "pgr-gro",
  "/relatorios": "pgr-gro",
  "/contexto": "governanca-sgsst",
  "/politica": "governanca-sgsst",
  "/gestao-mudanca": "governanca-sgsst",
  "/analise-critica": "governanca-sgsst",
  "/objetivos": "governanca-sgsst",
  "/requisitos-legais": "governanca-sgsst",
  "/comunicacao": "governanca-sgsst",
  "/plano-emergencia": "governanca-sgsst",
  "/auditorias": "governanca-sgsst",
  "/psicossocial": "psicossocial-sst",
  "/documentos": "documentos-iso",
  "/referencias": "documentos-iso",
  "/iso-45001": "documentos-iso",
  "/dds": "inspecoes-dds",
  "/inspecoes": "inspecoes-dds",
  "/ocorrencias": "ocorrencias-nc",
  "/nao-conformidades": "ocorrencias-nc",
}

export type ModuloExigido = { slug: string; titulo: string }

/**
 * Retorna o módulo de treinamento exigido para uma rota, ou null se a rota não
 * é travada (shell/admin) ou o slug não existe mais na trilha.
 */
export function moduloExigidoParaRota(pathname: string): ModuloExigido | null {
  // Casa o prefixo mais específico (mais longo) que seja o caminho ou um pai.
  let melhor: string | null = null
  for (const prefixo of Object.keys(ROTA_MODULO)) {
    if (pathname === prefixo || pathname.startsWith(prefixo + "/")) {
      if (!melhor || prefixo.length > melhor.length) melhor = prefixo
    }
  }
  if (!melhor) return null
  const slug = ROTA_MODULO[melhor]
  const mod = getModulo(slug)
  if (!mod) return null
  return { slug, titulo: mod.titulo }
}
