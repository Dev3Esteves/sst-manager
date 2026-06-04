#!/usr/bin/env node
// Seed de dados demo — popula a base com cadastros realistas para teste.
//
// Uso: node scripts/seed-demo.mjs
//
// ⚠️ NÃO-IDEMPOTENTE: adiciona dados em cima do que existe. Se rodar duas vezes,
// cria duplicatas (exceto onde há unique constraint — CPF, CNPJ, CA). Para
// limpar, rode scripts/cleanup-demo.mjs (gerado junto) OU use SQL direto.

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

// ============================================================================
// UTILITIES
// ============================================================================
const rnd = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rnd(arr.length)]
const pickWeighted = (pairs) => {
  // pairs: [[item, weight], ...]
  const total = pairs.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [item, w] of pairs) {
    r -= w
    if (r <= 0) return item
  }
  return pairs[pairs.length - 1][0]
}
const pad = (n, len = 2) => String(n).padStart(len, "0")

/** Gera CPF válido (com DV correto). */
function gerarCpf() {
  const digits = Array.from({ length: 9 }, () => rnd(10))
  // primeiro DV
  let sum = digits.reduce((acc, d, i) => acc + d * (10 - i), 0)
  let d1 = 11 - (sum % 11)
  if (d1 > 9) d1 = 0
  digits.push(d1)
  // segundo DV
  sum = digits.reduce((acc, d, i) => acc + d * (11 - i), 0)
  let d2 = 11 - (sum % 11)
  if (d2 > 9) d2 = 0
  digits.push(d2)
  // reject CPF com todos iguais
  if (digits.every((d) => d === digits[0])) return gerarCpf()
  const s = digits.join("")
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`
}

/** Gera CNPJ válido. */
function gerarCnpj() {
  const digits = [
    ...Array.from({ length: 8 }, () => rnd(10)),
    0, 0, 0, 1, // matriz 0001
  ]
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = digits.reduce((acc, d, i) => acc + d * weights1[i], 0)
  let d1 = sum % 11
  d1 = d1 < 2 ? 0 : 11 - d1
  digits.push(d1)
  sum = digits.reduce((acc, d, i) => acc + d * weights2[i], 0)
  let d2 = sum % 11
  d2 = d2 < 2 ? 0 : 11 - d2
  digits.push(d2)
  const s = digits.join("")
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`
}

/** Retorna data ISO (YYYY-MM-DD) entre `minDays` e `maxDays` atrás. Negativo = futuro. */
function randomDate(minDaysAgo, maxDaysAgo) {
  const days = minDaysAgo + rnd(maxDaysAgo - minDaysAgo + 1)
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Adiciona meses a uma data ISO. */
function addMonths(iso, months) {
  const d = new Date(iso + "T00:00:00")
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

// ============================================================================
// DATA POOLS — dados base para geração
// ============================================================================
const NOMES_M = [
  "João", "Pedro", "Carlos", "Ricardo", "Roberto", "Paulo", "André", "Lucas",
  "Rafael", "Thiago", "Marcos", "Felipe", "Rodrigo", "Fernando", "Eduardo",
  "Gustavo", "Matheus", "Diego", "Vinícius", "Daniel", "Bruno", "Antonio",
  "Francisco", "Alexandre", "José", "Sérgio", "Marcelo", "Leonardo", "Júlio",
  "Luiz", "Cláudio",
]
const NOMES_F = [
  "Maria", "Ana", "Fernanda", "Juliana", "Mariana", "Beatriz", "Camila",
  "Patrícia", "Amanda", "Larissa", "Débora", "Aline", "Tatiana", "Bianca",
  "Vanessa", "Priscila", "Renata", "Natália", "Carolina", "Bruna", "Luciana",
  "Cristiane", "Mônica", "Sandra", "Gabriela", "Letícia", "Isabela", "Eliane",
  "Denise", "Sílvia", "Michele",
]
const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha",
  "Dias", "Nunes", "Mendes", "Marques", "Moreira", "Cavalcanti", "Monteiro",
  "Pinto", "Moraes", "Araújo", "Machado", "Cardoso", "Teixeira",
]

const CARGOS_POOL = [
  { titulo: "Eletricista de Manutenção NR-10", cbo: "7156-10", gr: 3, nrs: ["NR-10", "NR-35", "NR-06"] },
  { titulo: "Técnico de Instalações Elétricas", cbo: "3131-10", gr: 3, nrs: ["NR-10", "NR-35", "NR-06"] },
  { titulo: "Supervisor de Equipe Elétrica", cbo: "3131-05", gr: 3, nrs: ["NR-10", "NR-35", "NR-33", "NR-06"] },
  { titulo: "Montador Eletromecânico", cbo: "7257-05", gr: 3, nrs: ["NR-10", "NR-12", "NR-35", "NR-06"] },
  { titulo: "Técnico Projetista Elétrico", cbo: "3131-15", gr: 2, nrs: ["NR-10"] },
  { titulo: "Técnico de Segurança do Trabalho", cbo: "3516-05", gr: 2, nrs: ["NR-10", "NR-35", "NR-33"] },
  { titulo: "Engenheiro Eletrotécnico", cbo: "2143-05", gr: 2, nrs: ["NR-10", "NR-35"] },
  { titulo: "Auxiliar Técnico de Obra", cbo: "7155-05", gr: 3, nrs: ["NR-06", "NR-35"] },
  { titulo: "Coordenador de Obra", cbo: "1423-05", gr: 2, nrs: ["NR-10", "NR-35", "NR-33"] },
  { titulo: "Operador de Equipamentos", cbo: "7155-10", gr: 3, nrs: ["NR-12", "NR-06"] },
  { titulo: "Auxiliar Administrativo", cbo: "4110-05", gr: 1, nrs: [] },
  { titulo: "Encarregado de Campo", cbo: "7102-10", gr: 3, nrs: ["NR-10", "NR-35", "NR-06"] },
]

const EPIS_POOL = [
  { descricao: "Capacete classe B aba frontal", ca: "31469", fabricante: "3M", tipo: "capacete" },
  { descricao: "Capacete classe A branco", ca: "29848", fabricante: "MSA", tipo: "capacete" },
  { descricao: "Óculos de proteção ampla visão", ca: "10345", fabricante: "3M", tipo: "oculos" },
  { descricao: "Óculos com lente escura soldagem", ca: "11875", fabricante: "Plastcor", tipo: "oculos" },
  { descricao: "Protetor auricular tipo plug", ca: "5745", fabricante: "3M", tipo: "protetor_auditivo" },
  { descricao: "Protetor auricular tipo concha", ca: "14891", fabricante: "3M", tipo: "protetor_auditivo" },
  { descricao: "Luva vaqueta petroleira", ca: "8527", fabricante: "Volk", tipo: "luva" },
  { descricao: "Luva isolante classe 2 (17kV)", ca: "31128", fabricante: "Orion", tipo: "luva" },
  { descricao: "Luva isolante classe 3 (26,5kV)", ca: "31129", fabricante: "Orion", tipo: "luva" },
  { descricao: "Luva cobertura vaqueta p/ isolante", ca: "15442", fabricante: "Volk", tipo: "luva" },
  { descricao: "Botina de segurança com biqueira", ca: "19215", fabricante: "Bracol", tipo: "bota" },
  { descricao: "Botina dielétrica classe B", ca: "24357", fabricante: "Bracol", tipo: "bota" },
  { descricao: "Cinto paraquedista 5 pontos", ca: "35524", fabricante: "MG Protection", tipo: "cinto" },
  { descricao: "Talabarte duplo absorvedor", ca: "35525", fabricante: "MG Protection", tipo: "cinto" },
  { descricao: "Respirador descartável PFF2", ca: "38954", fabricante: "3M", tipo: "respirador" },
]

const TREINAMENTOS_POOL = [
  { titulo: "NR-10 Básico — Segurança em Eletricidade", nr: "NR-10", ch: 40, validade: 24, tipo: "obrigatorio", conteudo: [
    "Introdução à segurança em eletricidade",
    "Riscos em instalações e serviços com eletricidade",
    "Técnicas de análise de risco",
    "Medidas de controle do risco elétrico",
    "Normas técnicas NBR-5410 e NBR-14039",
    "Equipamentos de proteção coletiva",
    "Equipamentos de proteção individual",
    "Rotinas de trabalho e primeiros socorros",
  ]},
  { titulo: "NR-10 SEP — Sistema Elétrico de Potência", nr: "NR-10", ch: 40, validade: 24, tipo: "complementar" },
  { titulo: "NR-10 Reciclagem Bienal", nr: "NR-10", ch: 16, validade: 24, tipo: "reciclagem" },
  { titulo: "NR-35 Trabalho em Altura", nr: "NR-35", ch: 8, validade: 24, tipo: "obrigatorio", conteudo: [
    "Normas e regulamentos aplicáveis",
    "Análise de risco e condições impeditivas",
    "Riscos potenciais e medidas de prevenção",
    "Sistemas de proteção contra quedas",
    "Equipamentos, inspeção e técnicas de resgate",
    "Acidentes típicos em trabalhos em altura",
  ]},
  { titulo: "NR-35 Reciclagem", nr: "NR-35", ch: 8, validade: 24, tipo: "reciclagem" },
  { titulo: "NR-33 Espaço Confinado — Trabalhador", nr: "NR-33", ch: 16, validade: 12, tipo: "obrigatorio" },
  { titulo: "NR-33 Supervisor de Entrada", nr: "NR-33", ch: 40, validade: 12, tipo: "obrigatorio" },
  { titulo: "NR-06 Uso de EPIs", nr: "NR-06", ch: 4, validade: 12, tipo: "obrigatorio" },
  { titulo: "NR-12 Máquinas e Equipamentos", nr: "NR-12", ch: 8, validade: 24, tipo: "complementar" },
  { titulo: "Primeiros Socorros", nr: null, ch: 20, validade: 12, tipo: "complementar" },
  { titulo: "Brigada de Incêndio", nr: "NR-23", ch: 16, validade: 12, tipo: "complementar" },
  { titulo: "Integração SST (Admissional)", nr: null, ch: 4, validade: null, tipo: "integracao" },
]

const LOCAIS_OBRA = [
  "Subestação MT 13,8kV — Data Center Tier III",
  "Canteiro Data Center ABC — Sala 04",
  "Oficina Elétrica — Seção 2",
  "Data Center XYZ — Subestação Externa",
  "Sala de Quadros — Prédio A",
  "Painel de Distribuição — SE Recalque",
  "Canteiro Subestação 138kV — Guarulhos",
  "Sala de Baterias — Data Center Beta",
  "Área de Geração Diesel — Backup",
  "Torre de Refrigeração — Nível 3",
  "Escritório Administrativo — Sede",
  "Depósito de Materiais — Galpão 2",
  "Oficina Mecânica — Manutenção",
  "Via de Acesso — Portaria Principal",
]

const NATUREZAS_LESAO = ["Corte", "Contusão", "Queimadura", "Entorse", "Escoriação", "Fratura", "Luxação", "Perfuração"]
const PARTES_CORPO_TXT = ["mão direita", "mão esquerda", "antebraço direito", "pé direito", "joelho esquerdo", "cabeça", "costas", "olho direito"]
const AGENTES_CAUSADORES = ["ferramenta manual", "queda de mesmo nível", "choque elétrico BT", "material cortante", "queda de altura", "máquina em movimento", "projeção de partículas", "esforço excessivo"]

// ============================================================================
// EXECUÇÃO
// ============================================================================
async function main() {
  console.log("\n🌱 SEED DE DADOS DEMO — INICIANDO\n")

  // ==================
  // EMPRESAS
  // ==================
  console.log("→ Empresas...")
  const { data: empresasExistentes } = await supabase.from("empresas").select("id, cnpj, razao_social")
  const empresas = []

  // Mantém SISTENGE se existir
  const sistenge = empresasExistentes?.find((e) => e.razao_social.includes("SISTENGE"))
  if (sistenge) {
    empresas.push(sistenge)
    console.log(`  ✓ SISTENGE existente (${sistenge.id.slice(0, 8)})`)
  } else {
    const { data } = await supabase.from("empresas").insert({
      razao_social: "SISTENGE Engenharia Ltda",
      nome_fantasia: "SISTENGE",
      cnpj: "12.345.678/0001-90",
      tipo: "propria",
      ativo: true,
    }).select().single()
    empresas.push(data)
  }

  // Adiciona 2 contratantes novas
  const contratantes = [
    { razao: "DataCore Brasil S.A.", fantasia: "DataCore", tipo: "contratante" },
    { razao: "MetroEnergia Distribuidora Ltda", fantasia: "MetroEnergia", tipo: "terceira" },
  ]
  for (const c of contratantes) {
    const cnpj = gerarCnpj()
    const { data, error } = await supabase.from("empresas").insert({
      razao_social: c.razao, nome_fantasia: c.fantasia, cnpj, tipo: c.tipo, ativo: true,
    }).select().single()
    if (error) {
      console.log(`  ✗ ${c.razao}: ${error.message}`)
    } else {
      empresas.push(data)
      console.log(`  ✓ ${c.razao} (${cnpj})`)
    }
  }

  // ==================
  // CARGOS (distribuídos entre empresas)
  // ==================
  console.log("\n→ Cargos...")
  const cargos = []
  for (const empresa of empresas) {
    for (const c of CARGOS_POOL) {
      const { data, error } = await supabase.from("cargos").insert({
        empresa_id: empresa.id,
        titulo: c.titulo,
        cbo: c.cbo,
        grupo_risco: c.gr,
        nrs_aplicaveis: c.nrs,
      }).select().single()
      if (error) {
        console.log(`  ✗ ${c.titulo}: ${error.message}`)
      } else {
        cargos.push({ ...data, nrs: c.nrs })
      }
    }
  }
  console.log(`  ✓ ${cargos.length} cargos criados (${CARGOS_POOL.length} por empresa × ${empresas.length} empresas)`)

  // ==================
  // EPIs
  // ==================
  console.log("\n→ EPIs...")
  const epis = []
  for (const e of EPIS_POOL) {
    const validade = randomDate(-730, -60) // validade no FUTURO (entre hoje+60 e hoje+730)
    const { data, error } = await supabase.from("epis").upsert({
      descricao: e.descricao,
      ca: e.ca,
      ca_validade: validade,
      fabricante: e.fabricante,
      tipo: e.tipo,
    }, { onConflict: "ca" }).select().single()
    if (!error) epis.push(data)
  }
  console.log(`  ✓ ${epis.length} EPIs`)

  // ==================
  // TREINAMENTOS (catálogo)
  // ==================
  console.log("\n→ Treinamentos (catálogo)...")
  const treinamentos = []
  for (const t of TREINAMENTOS_POOL) {
    const { data, error } = await supabase.from("treinamentos").insert({
      titulo: t.titulo,
      nr_referencia: t.nr,
      carga_horaria_horas: t.ch,
      validade_meses: t.validade,
      tipo: t.tipo,
      modalidade: "presencial",
      conteudo_programatico: t.conteudo ?? null,
      cidade_emissao: "São Paulo",
    }).select().single()
    if (!error) treinamentos.push(data)
  }
  console.log(`  ✓ ${treinamentos.length} treinamentos`)

  // ==================
  // COLABORADORES (80 distribuídos)
  // ==================
  console.log("\n→ Colaboradores (80)...")
  const colaboradores = []
  const cpfsUsados = new Set()
  const totalColab = 80

  for (let i = 0; i < totalColab; i++) {
    const isM = Math.random() < 0.75 // 75% masculino (SST industrial tende masculino)
    const nome = `${pick(isM ? NOMES_M : NOMES_F)} ${pick(SOBRENOMES)} ${pick(SOBRENOMES)}`

    let cpf = gerarCpf()
    while (cpfsUsados.has(cpf)) cpf = gerarCpf()
    cpfsUsados.add(cpf)

    const empresa = pick(empresas)
    const cargosEmpresa = cargos.filter((c) => c.empresa_id === empresa.id)
    const cargo = pick(cargosEmpresa)

    const status = pickWeighted([
      ["ativo", 85], ["ferias", 6], ["afastado", 5], ["demitido", 4],
    ])

    const { data, error } = await supabase.from("colaboradores").upsert({
      empresa_id: empresa.id,
      cargo_id: cargo.id,
      nome_completo: nome,
      cpf,
      sexo: isM ? "M" : "F",
      data_nascimento: randomDate(365 * 25, 365 * 55),
      data_admissao: randomDate(60, 365 * 8),
      tipo_vinculo: pickWeighted([["clt", 80], ["pj", 8], ["terceiro", 8], ["estagiario", 4]]),
      matricula: pad(1000 + i, 5),
      email: `${nome.toLowerCase().split(" ").slice(0, 2).join(".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@sistenge.com`,
      telefone: `(11) 9${pad(rnd(10000), 4)}-${pad(rnd(10000), 4)}`,
      status,
    }, { onConflict: "cpf" }).select().single()

    if (error) {
      console.log(`  ✗ ${nome}: ${error.message}`)
    } else {
      colaboradores.push({ ...data, cargo_nrs: cargo.nrs })
    }
  }
  console.log(`  ✓ ${colaboradores.length} colaboradores`)

  // Só usa ativos para realizações
  const colabsAtivos = colaboradores.filter((c) => c.status === "ativo")

  // ==================
  // EXAMES MÉDICOS (distribuição realista de vencimentos)
  // ==================
  console.log("\n→ Exames médicos (c/ distribuição realista de vencimentos)...")
  let examesCount = 0

  for (const c of colabsAtivos) {
    // cada colaborador: exame admissional + 0-2 periódicos
    const admDate = c.data_admissao
    const nPeriodicos = rnd(3) // 0, 1 ou 2

    // Admissional (1 ano antes da data atual)
    const { error: e1 } = await supabase.from("exames_medicos").insert({
      colaborador_id: c.id,
      tipo: "admissional",
      data_realizacao: admDate,
      data_vencimento: addMonths(admDate, 12),
      resultado: "apto",
      medico_nome: "Dr. " + pick(["Carlos", "Paulo", "Ana"]) + " " + pick(SOBRENOMES),
      crm: `${rnd(90000) + 10000}/SP`,
      clinica: pick(["Clínica OcupaSaúde", "MedicPass Ocupacional", "HospSegur Trabalho"]),
      numero_aso: `ASO-${pad(examesCount + 1, 5)}`,
      status: "substituido", // admissional antigo
    })
    if (!e1) examesCount++

    // Periódicos — distribuição intencional:
    //   ~60% vigente regular (> 60d)
    //   ~15% alerta (≤60d)
    //   ~10% crítico (≤30d)
    //   ~15% vencido
    for (let k = 0; k < nPeriodicos; k++) {
      const bucket = pickWeighted([
        ["regular", 60], ["alerta", 15], ["critico", 10], ["vencido", 15],
      ])
      let vencIso
      if (bucket === "regular") vencIso = randomDate(-365, -90) // 90-365d no futuro
      else if (bucket === "alerta") vencIso = randomDate(-60, -31)
      else if (bucket === "critico") vencIso = randomDate(-30, -1)
      else vencIso = randomDate(1, 90) // passado 1-90d

      const realIso = addMonths(vencIso, -12)
      const { error } = await supabase.from("exames_medicos").insert({
        colaborador_id: c.id,
        tipo: "periodico",
        data_realizacao: realIso,
        data_vencimento: vencIso,
        resultado: pickWeighted([["apto", 92], ["apto_restricao", 6], ["inapto", 2]]),
        medico_nome: "Dr. " + pick(["Carlos", "Paulo", "Ana", "Maria"]) + " " + pick(SOBRENOMES),
        crm: `${rnd(90000) + 10000}/SP`,
        clinica: pick(["Clínica OcupaSaúde", "MedicPass Ocupacional", "HospSegur Trabalho", "SegurMed"]),
        numero_aso: `ASO-${pad(examesCount + 1, 5)}`,
        status: "vigente",
      })
      if (!error) examesCount++
    }
  }
  console.log(`  ✓ ${examesCount} exames inseridos`)

  // ==================
  // REALIZAÇÕES DE TREINAMENTO
  // ==================
  console.log("\n→ Realizações de treinamento...")
  let trCount = 0

  for (const c of colabsAtivos) {
    // cada colaborador recebe treinamentos compatíveis com as NRs do cargo
    const nrsCargo = c.cargo_nrs ?? []
    const treinamentosParaEle = treinamentos.filter((t) => {
      if (!t.nr_referencia) return Math.random() < 0.4 // 40% dos sem-NR (integração, 1º socorros)
      return nrsCargo.includes(t.nr_referencia)
    })

    for (const t of treinamentosParaEle) {
      const bucket = pickWeighted([
        ["regular", 55], ["alerta", 20], ["critico", 10], ["vencido", 15],
      ])
      let vencIso = null
      if (t.validade_meses) {
        if (bucket === "regular") vencIso = randomDate(-800, -90)
        else if (bucket === "alerta") vencIso = randomDate(-60, -31)
        else if (bucket === "critico") vencIso = randomDate(-30, -1)
        else vencIso = randomDate(1, 90)
      }
      const realIso = t.validade_meses ? addMonths(vencIso, -t.validade_meses) : randomDate(90, 730)

      const { error } = await supabase.from("treinamentos_realizados").insert({
        colaborador_id: c.id,
        treinamento_id: t.id,
        data_realizacao: realIso,
        // data_vencimento é calculada pelo trigger, não precisa passar
        instrutor: "Eng. " + pick(["Ricardo", "Fernanda", "Paulo"]) + " " + pick(SOBRENOMES),
        entidade: pick(["SENAI", "Centro de Treinamento ABC", "InstEletro", "SST Training"]),
        local: "São Paulo - SP",
        nota_avaliacao: 7 + Math.random() * 3, // 7.0 a 10.0
        status: "vigente",
      })
      if (!error) trCount++
    }
  }
  console.log(`  ✓ ${trCount} realizações`)

  // ==================
  // ENTREGAS DE EPI
  // ==================
  console.log("\n→ Entregas de EPI...")
  let entregasCount = 0
  for (const c of colabsAtivos) {
    const n = 2 + rnd(4) // 2-5 entregas por colaborador
    for (let k = 0; k < n; k++) {
      const { error } = await supabase.from("epi_entregas").insert({
        colaborador_id: c.id,
        epi_id: pick(epis).id,
        data_entrega: randomDate(30, 730),
        quantidade: 1 + rnd(2),
        motivo: pickWeighted([
          ["primeiro_fornecimento", 30], ["substituicao", 40], ["desgaste", 20], ["extravio", 8], ["devolucao", 2],
        ]),
      })
      if (!error) entregasCount++
    }
  }
  console.log(`  ✓ ${entregasCount} entregas`)

  // ==================
  // OCORRÊNCIAS (25, variadas)
  // ==================
  console.log("\n→ Ocorrências...")
  let ocorrCount = 0
  for (let i = 0; i < 25; i++) {
    const colab = pick(colabsAtivos)
    const tipo = pickWeighted([
      ["quase_acidente", 40], ["incidente", 15], ["condicao_insegura", 15],
      ["ato_inseguro", 10], ["desvio", 8], ["acidente_tipico", 8],
      ["acidente_trajeto", 3], ["doenca_ocupacional", 1],
    ])
    const gravidade = ["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(tipo)
      ? pickWeighted([["leve", 55], ["moderado", 30], ["grave", 12], ["fatal", 3]])
      : null
    const ehAcidente = ["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(tipo)

    const { error } = await supabase.from("ocorrencias").insert({
      empresa_id: colab.empresa_id,
      tipo,
      data_ocorrencia: new Date(Date.now() - rnd(365) * 86400000).toISOString(),
      local: pick(LOCAIS_OBRA),
      descricao: pick([
        "Durante execução de manutenção preventiva em painel elétrico, operador percebeu aquecimento anormal antes de tocar no componente.",
        "Queda de objeto no piso sem atingir ninguém, mas muito próximo à equipe de manutenção que trabalhava na área.",
        "Colaborador escorregou em piso molhado durante deslocamento entre oficinas. Sem lesão aparente.",
        "Identificado ausência de sinalização em área de risco durante inspeção de rotina pela segurança.",
        "Corte superficial no antebraço ao manusear ferramenta de corte sem luva adequada.",
        "Colaborador apresentou tontura após trabalho prolongado em ambiente confinado. Retirado da área.",
        "Falha no bloqueio (LOTO) de disjuntor identificada antes da execução do serviço.",
        "Ferramenta caiu do segundo andar, atingindo capacete de colaborador que trabalhava abaixo.",
        "Equipe observou uso incorreto de EPI por colaborador terceiro durante inspeção.",
      ]),
      colaborador_id: Math.random() < 0.8 ? colab.id : null,
      gravidade,
      parte_corpo_atingida: ehAcidente ? pick(PARTES_CORPO_TXT) : null,
      natureza_lesao: ehAcidente ? pick(NATUREZAS_LESAO) : null,
      agente_causador: ehAcidente ? pick(AGENTES_CAUSADORES) : null,
      dias_afastamento: ehAcidente ? pickWeighted([[0, 40], [1, 20], [3, 15], [7, 12], [15, 8], [30, 5]]) : null,
      status: pickWeighted([["aberta", 30], ["investigando", 30], ["concluida", 30], ["encerrada", 10]]),
    })
    if (!error) ocorrCount++
  }
  console.log(`  ✓ ${ocorrCount} ocorrências`)

  // ==================
  // INSPEÇÕES
  // ==================
  console.log("\n→ Inspeções...")
  const { data: templates } = await supabase.from("templates_inspecao").select("*").eq("ativo", true)
  let inspCount = 0

  for (let i = 0; i < 15 && templates && templates.length > 0; i++) {
    const tpl = pick(templates)
    const colab = pick(colabsAtivos)
    const itens = tpl.itens ?? []
    const respostas = itens.map((it, idx) => ({
      item_index: idx,
      pergunta: it.pergunta,
      grupo: it.grupo ?? null,
      conforme: pickWeighted([["sim", 70], ["nao", 20], ["na", 10]]),
      observacao: null,
      foto_url: null,
    }))
    // Se tiver NC, adiciona observação em 80% delas
    respostas.forEach((r) => {
      if (r.conforme === "nao" && Math.random() < 0.8) {
        r.observacao = pick([
          "Item apresenta desgaste — substituição programada",
          "Ação imediata tomada para correção",
          "Encaminhar para manutenção preventiva",
          "Colaborador orientado — refazer treinamento",
        ])
      }
    })
    const conformes = respostas.filter((r) => r.conforme === "sim").length
    const considerados = respostas.filter((r) => r.conforme !== "na").length
    const pct = considerados > 0 ? Math.round((conformes / considerados) * 10000) / 100 : 100

    const { error } = await supabase.from("inspecoes").insert({
      template_id: tpl.id,
      inspetor_id: colab.id,
      empresa_id: colab.empresa_id,
      local: pick(LOCAIS_OBRA),
      data_inspecao: new Date(Date.now() - rnd(120) * 86400000).toISOString(),
      respostas,
      percentual_conformidade: pct,
      observacoes_gerais: pick([
        "Inspeção de rotina sem anomalias significativas.",
        "Necessita ajustes pontuais — encaminhado à manutenção.",
        "Equipe bem orientada, procedimentos em dia.",
        null,
      ]),
    })
    if (!error) inspCount++
  }
  console.log(`  ✓ ${inspCount} inspeções`)

  // ==================
  // DDS (Diálogo Diário de Segurança)
  // ==================
  console.log("\n→ DDS...")
  let ddsCount = 0
  const TEMAS_DDS = [
    "NR-10 — Riscos em trabalhos com eletricidade",
    "Uso correto do cinto tipo paraquedista",
    "Análise de APR antes da tarefa",
    "Prevenção de choque elétrico em BT",
    "Ordem e limpeza no canteiro de obras",
    "Relato de quase-acidentes como cultura",
    "Identificação de zona de risco NR-10",
    "LOTO — bloqueio e etiquetagem",
    "Primeiros socorros básicos",
    "Sinalização e isolamento de área",
  ]

  for (let i = 0; i < 10; i++) {
    const empresa = pick(empresas)
    const participantesPool = colabsAtivos.filter((c) => c.empresa_id === empresa.id)
    const nParticipantes = 5 + rnd(8) // 5-12 participantes
    const participantes = Array.from({ length: Math.min(nParticipantes, participantesPool.length) }, () => {
      const p = pick(participantesPool)
      return {
        colaborador_id: p.id,
        nome: p.nome_completo,
        cpf: p.cpf,
        cargo: null,
        assinatura_url: null,
      }
    })

    const mediador = pick(colabsAtivos.filter((c) => c.empresa_id === empresa.id))
    const dataDds = randomDate(5, 180)
    const { error } = await supabase.from("documentos_sst").insert({
      tipo: "dialogo_seguranca",
      titulo: `DDS — ${TEMAS_DDS[i % TEMAS_DDS.length]}`,
      empresa_id: empresa.id,
      local_trabalho: pick(LOCAIS_OBRA),
      data_emissao: dataDds,
      status: "emitido",
      elaborado_por: mediador.id,
      conteudo: {
        tema: TEMAS_DDS[i % TEMAS_DDS.length],
        data_dds: dataDds,
        hora_inicio: "07:30",
        duracao_minutos: 15,
        local: pick(LOCAIS_OBRA),
        mediador_nome: mediador.nome_completo,
        mediador_cargo: "Técnico de Segurança do Trabalho",
        topicos: [
          "Revisão dos pontos críticos da tarefa do dia",
          "Lembrete sobre uso obrigatório de EPIs",
          "Comunicação de riscos identificados na última inspeção",
        ],
        observacoes: null,
        participantes,
        assinatura_mediador_url: null,
      },
    })
    if (!error) ddsCount++
  }
  console.log(`  ✓ ${ddsCount} DDS`)

  // ==================
  // ALGUMAS APRs
  // ==================
  console.log("\n→ APRs...")
  let aprCount = 0
  for (let i = 0; i < 8; i++) {
    const empresa = pick(empresas)
    const elaborado = pick(colabsAtivos.filter((c) => c.empresa_id === empresa.id))
    const { error } = await supabase.from("documentos_sst").insert({
      tipo: "apr",
      titulo: `APR — ${pick(LOCAIS_OBRA)}`,
      empresa_id: empresa.id,
      local_trabalho: pick(LOCAIS_OBRA),
      data_emissao: randomDate(5, 90),
      data_validade: randomDate(-30, -90),
      status: pickWeighted([["emitido", 40], ["aprovado", 40], ["executado", 20]]),
      elaborado_por: elaborado.id,
      conteudo: {
        equipe: Array.from({ length: 3 + rnd(4) }, () => pick(colabsAtivos).nome_completo),
        riscos: [
          {
            atividade: "Abertura de painel MT",
            perigo: "Choque elétrico / arco voltaico",
            consequencia: "Queimadura grave, parada cardiorrespiratória",
            probabilidade: 2,
            severidade: 5,
            medida_controle: "Desenergização + LOTO + teste de ausência de tensão + EPIs classe 3",
            responsavel: pick(colabsAtivos).nome_completo,
          },
          {
            atividade: "Troca de componente em altura",
            perigo: "Queda de altura > 2m",
            consequencia: "Fratura múltipla, óbito",
            probabilidade: 2,
            severidade: 4,
            medida_controle: "Cinto paraquedista + talabarte duplo + ancoragem certificada",
            responsavel: pick(colabsAtivos).nome_completo,
          },
        ],
        epis: ["Capacete classe B", "Luva isolante classe 3", "Botina dielétrica", "Cinto paraquedista"],
        observacoes: null,
        assinaturas: [],
      },
    })
    if (!error) aprCount++
  }
  console.log(`  ✓ ${aprCount} APRs`)

  // ==================
  // ATUALIZA STATUS DE VENCIMENTOS (roda o cron manualmente)
  // ==================
  console.log("\n→ Atualizando vw_vencimentos...")
  await supabase.rpc("atualizar_status_vencimentos")

  // ==================
  // RESUMO
  // ==================
  console.log("\n" + "=".repeat(60))
  console.log("✅ SEED COMPLETO")
  console.log("=".repeat(60))
  console.log(`  Empresas:            ${empresas.length}`)
  console.log(`  Cargos:              ${cargos.length}`)
  console.log(`  Colaboradores:       ${colaboradores.length} (${colabsAtivos.length} ativos)`)
  console.log(`  EPIs (catálogo):     ${epis.length}`)
  console.log(`  Treinamentos:        ${treinamentos.length}`)
  console.log(`  Exames médicos:      ${examesCount}`)
  console.log(`  Treinam. realizados: ${trCount}`)
  console.log(`  Entregas de EPI:     ${entregasCount}`)
  console.log(`  Ocorrências:         ${ocorrCount}`)
  console.log(`  Inspeções:           ${inspCount}`)
  console.log(`  DDS:                 ${ddsCount}`)
  console.log(`  APRs:                ${aprCount}`)
  console.log("=".repeat(60))
  console.log("\n💡 Teste sugerido: /documentos/lote → gerar 50 certificados NR-10 ou NR-35")
  console.log("💡 Dashboard: http://localhost:3000/dashboard")
  console.log("💡 Vencimentos: http://localhost:3000/vencimentos\n")
}

main().catch((err) => {
  console.error("❌ Erro no seed:", err)
  process.exit(1)
})
