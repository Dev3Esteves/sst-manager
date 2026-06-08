#!/usr/bin/env node
/**
 * Seed incremental — obras + EPIs por cargo.
 *
 * Para rodar após a migration 0009, popula:
 *   1) 2-4 obras de demonstração por empresa dona do sistema
 *   2) Marca a primeira empresa existente como `dona_sistema = true` se ainda
 *      não houver nenhuma dona (redundante com o backfill da migration — só
 *      uma segurança)
 *   3) Aloca colaboradores aleatoriamente em obras da sua empresa
 *   4) Para cada cargo existente, popula `epis_obrigatorios` com 2 EPIs
 *      obrigatórios + 1 eventual (se houver EPIs cadastrados)
 *
 * É idempotente para empresas: usa UPSERT por (empresa_id, nome). Novos EPIs
 * por cargo são sempre regravados (substituem o valor anterior).
 *
 * Uso: node scripts/seed-obras-epis.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const rnd = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rnd(arr.length)]

// ============================================================================
// OBRAS DEMO (nomes fictícios para demonstração)
// ============================================================================
const OBRAS_DEMO = [
  { nome: "OBRA EXEMPLO", cidade: "Campinas", uf: "SP", codigo: "OBR-001" },
  { nome: "OBRA ELEA — Subestação Norte", cidade: "Hortolândia", uf: "SP", codigo: "OBR-002" },
  { nome: "Ampliação DC Tamboré", cidade: "Barueri", uf: "SP", codigo: "OBR-003" },
  { nome: "Retrofit SE Mogi", cidade: "Mogi das Cruzes", uf: "SP", codigo: "OBR-004" },
]

async function garantirDona() {
  const { data: donas } = await supabase
    .from("empresas")
    .select("id")
    .eq("dona_sistema", true)
    .limit(1)

  if (donas && donas.length > 0) return

  // Promove a primeira empresa existente a dona
  const { data: primeira } = await supabase
    .from("empresas")
    .select("id, razao_social")
    .order("created_at", { ascending: true })
    .limit(1)

  if (!primeira || primeira.length === 0) {
    console.log("⚠️  Nenhuma empresa cadastrada. Rode seed-demo-complete.mjs antes.")
    process.exit(1)
  }

  const emp = primeira[0]
  await supabase.from("empresas").update({ dona_sistema: true }).eq("id", emp.id)
  console.log(`→ ${emp.razao_social} promovida a dona do sistema.`)
}

async function seedObras() {
  const { data: donas } = await supabase
    .from("empresas")
    .select("id, razao_social")
    .eq("dona_sistema", true)

  const { data: contratantes } = await supabase
    .from("empresas")
    .select("id, razao_social")
    .eq("tipo", "contratante")

  let total = 0
  for (const dona of donas ?? []) {
    // Busca obras já existentes desta empresa para evitar duplicatas
    const { data: existentes } = await supabase
      .from("obras")
      .select("nome")
      .eq("empresa_id", dona.id)
    const nomesExistentes = new Set((existentes ?? []).map((o) => o.nome))

    for (const o of OBRAS_DEMO) {
      if (nomesExistentes.has(o.nome)) continue
      const contratante = contratantes && contratantes.length > 0 ? pick(contratantes) : null
      const { error } = await supabase.from("obras").insert({
        empresa_id: dona.id,
        contratante_id: contratante?.id ?? null,
        nome: o.nome,
        codigo: o.codigo,
        cidade: o.cidade,
        uf: o.uf,
        data_inicio: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        ativa: true,
      })
      if (error) {
        console.error(`  FAIL obra ${o.nome} em ${dona.razao_social}:`, error.message)
      } else {
        total++
      }
    }
  }
  console.log(`✓ ${total} obra(s) criada(s).`)
}

async function alocarColaboradoresEmObras() {
  const { data: colabs } = await supabase
    .from("colaboradores")
    .select("id, empresa_id, obra_id")
    .eq("status", "ativo")
    .is("obra_id", null) // só os sem obra atribuída

  const { data: obras } = await supabase
    .from("obras")
    .select("id, empresa_id")
    .eq("ativa", true)

  if (!colabs || colabs.length === 0) {
    console.log("  (nenhum colaborador sem obra para alocar)")
    return
  }
  if (!obras || obras.length === 0) {
    console.log("  (nenhuma obra ativa para alocar)")
    return
  }

  const obrasPorEmpresa = new Map()
  for (const o of obras) {
    const arr = obrasPorEmpresa.get(o.empresa_id) ?? []
    arr.push(o)
    obrasPorEmpresa.set(o.empresa_id, arr)
  }

  let alocados = 0
  for (const c of colabs) {
    const obrasDisp = obrasPorEmpresa.get(c.empresa_id)
    if (!obrasDisp || obrasDisp.length === 0) continue
    // Aloca 70% dos colaboradores — os outros ficam sem obra
    if (Math.random() > 0.7) continue
    const obra = pick(obrasDisp)
    const { error } = await supabase
      .from("colaboradores")
      .update({ obra_id: obra.id })
      .eq("id", c.id)
    if (!error) alocados++
  }
  console.log(`✓ ${alocados} colaborador(es) alocado(s) em obras.`)
}

async function seedEpisPorCargo() {
  const { data: cargos } = await supabase
    .from("cargos")
    .select("id, titulo, epis_obrigatorios")

  const { data: epis } = await supabase
    .from("epis")
    .select("id, descricao")

  if (!epis || epis.length < 3) {
    console.log("  ⚠️  Menos de 3 EPIs cadastrados — pulando seed de EPIs por cargo.")
    return
  }

  let atualizados = 0
  for (const c of cargos ?? []) {
    // Pula cargos que já têm EPIs configurados (idempotente)
    if (
      c.epis_obrigatorios &&
      typeof c.epis_obrigatorios === "object" &&
      Array.isArray(c.epis_obrigatorios.obrigatorios) &&
      c.epis_obrigatorios.obrigatorios.length > 0
    ) continue

    // Escolhe 2 obrigatórios + 1 eventual aleatórios
    const shuffle = [...epis].sort(() => Math.random() - 0.5)
    const obrigatorios = shuffle.slice(0, 2).map((e) => ({
      epi_id: e.id,
      observacao: null,
    }))
    const eventuais = shuffle.slice(2, 3).map((e) => ({
      epi_id: e.id,
      observacao: "Conforme atividade específica",
    }))

    const { error } = await supabase
      .from("cargos")
      .update({ epis_obrigatorios: { obrigatorios, eventuais } })
      .eq("id", c.id)

    if (!error) atualizados++
  }
  console.log(`✓ ${atualizados} cargo(s) com EPIs obrigatórios/eventuais configurados.`)
}

async function main() {
  console.log("Seed incremental: obras + EPIs por cargo")
  console.log("==========================================")
  await garantirDona()
  await seedObras()
  await alocarColaboradoresEmObras()
  await seedEpisPorCargo()
  console.log("\nConcluído.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
