#!/usr/bin/env node
/**
 * Converte o CSV oficial TABELA22_v*_Conteudo.csv (eSocial S-2240 — Códigos
 * dos Agentes Nocivos) para o JSON usado pelo seed.
 *
 * O CSV oficial usa pipe (|) como separador, layout:
 *   CODIGO|DESCRICAO|DTINICIO|DTFIM|TIPO
 *
 * Uso:
 *   node scripts/convert-esocial-tabela22-csv.mjs \
 *     "C:/Users/estev/caminho/para/TABELA22_v4_Conteudo.csv" \
 *     data/esocial-tabela22.json
 *
 * Idempotente — pode rodar várias vezes.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const [, , csvIn, jsonOut] = process.argv
if (!csvIn || !jsonOut) {
  console.error("Uso: node convert-esocial-tabela22-csv.mjs <csv> <json>")
  process.exit(1)
}

const TIPO_TO_GRUPO = {
  "QUÍMICOS": "quimico",
  "FÍSICOS": "fisico",
  "BIOLÓGICOS": "biologico",
  "ASSOCIAÇÃO DE AGENTES NOCIVOS FÍSICOS, QUÍMICOS E BIOLÓGICOS": "associacao",
  "OUTROS AGENTES NOCIVOS": "outros",
  "AUSÊNCIA DE AGENTES NOCIVOS OU ATIVIDADES ESPECIAIS": "ausencia",
}

function parseDate(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return null
  const d = ddmmyyyy.slice(0, 2)
  const m = ddmmyyyy.slice(2, 4)
  const y = ddmmyyyy.slice(4, 8)
  return `${y}-${m}-${d}`
}

const txt = readFileSync(resolve(csvIn), "utf8")
const linhas = txt.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("CODIGO|"))

const out = []
const erros = []

for (const linha of linhas) {
  const cols = linha.split("|")
  if (cols.length < 5) {
    erros.push(`linha curta (${cols.length} cols): ${linha}`)
    continue
  }
  const [codigo, descricao, dtinicio, dtfim, tipo] = cols
  const grupo = TIPO_TO_GRUPO[tipo.trim()]
  if (!grupo) {
    erros.push(`TIPO desconhecido "${tipo}" em ${codigo}`)
    continue
  }
  if (!/^\d{2}\.\d{2}\.\d{3}$/.test(codigo)) {
    erros.push(`código fora do padrão XX.XX.XXX: ${codigo}`)
    continue
  }
  // Códigos químicos/físicos/biológicos/associação sempre ensejam aposentadoria
  // especial (Anexo IV Decreto 3.048/1999). "Outros" pode ou não — depende do caso
  // (decisão judicial); marcamos true por padrão para preservar a flag de alerta.
  // "Ausência" nunca enseja.
  const exige_aposentadoria_especial = grupo !== "ausencia"
  const ativo = !dtfim || !parseDate(dtfim) // sem dtfim = ainda ativo
  out.push({
    codigo,
    descricao: descricao.trim(),
    grupo,
    exige_aposentadoria_especial,
    limite_tolerancia: null,
    observacao: null,
    fonte_url: "https://www.gov.br/esocial/pt-br/documentacao-tecnica/tabelas",
    versao_leiaute: "S-1.3",
    ativo,
  })
}

if (erros.length > 0) {
  console.error("Erros encontrados:")
  for (const e of erros) console.error("  -", e)
  process.exit(1)
}

writeFileSync(resolve(jsonOut), JSON.stringify(out, null, 2) + "\n")
console.log(`✓ ${out.length} agentes gravados em ${jsonOut}`)
const porGrupo = out.reduce((acc, r) => ((acc[r.grupo] = (acc[r.grupo] ?? 0) + 1), acc), {})
console.log(`  Por grupo:`, porGrupo)
const inativos = out.filter((r) => !r.ativo).length
console.log(`  Inativos (com data fim):`, inativos)
