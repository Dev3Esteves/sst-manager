#!/usr/bin/env node
// Continua o seed de onde o seed-demo.mjs parou: EPIs, entregas, ocorrências,
// inspeções, DDS, APRs. Lê dados já existentes na base.

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
const pickWeighted = (pairs) => {
  const total = pairs.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [item, w] of pairs) {
    r -= w
    if (r <= 0) return item
  }
  return pairs[pairs.length - 1][0]
}
function randomDate(minDaysAgo, maxDaysAgo) {
  const days = minDaysAgo + rnd(maxDaysAgo - minDaysAgo + 1)
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

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

const NATUREZAS_LESAO = ["Corte", "Contusão", "Queimadura", "Entorse", "Escoriação", "Fratura", "Luxação", "Perfuração"]
const PARTES_CORPO_TXT = ["mão direita", "mão esquerda", "antebraço direito", "pé direito", "joelho esquerdo", "cabeça", "costas", "olho direito"]
const AGENTES_CAUSADORES = ["ferramenta manual", "queda de mesmo nível", "choque elétrico BT", "material cortante", "queda de altura", "máquina em movimento", "projeção de partículas", "esforço excessivo"]

async function main() {
  console.log("\n🌱 COMPLETANDO SEED (parte 2)\n")

  // Carrega dados já inseridos
  const [{ data: empresas }, { data: colaboradores }] = await Promise.all([
    supabase.from("empresas").select("*"),
    supabase.from("colaboradores").select("*").eq("status", "ativo"),
  ])
  console.log(`  Empresas: ${empresas.length} · Colaboradores ativos: ${colaboradores.length}`)

  // ==================
  // EPIs — INSERT um por um com logging
  // ==================
  console.log("\n→ EPIs...")
  const { data: episExistentes } = await supabase.from("epis").select("*")
  const casExistentes = new Set((episExistentes ?? []).map((e) => e.ca))
  const episInseridos = [...(episExistentes ?? [])]

  for (const e of EPIS_POOL) {
    if (casExistentes.has(e.ca)) continue
    const validadeDias = 60 + rnd(670) // 60 a 730 dias no futuro
    const d = new Date()
    d.setDate(d.getDate() + validadeDias)
    const validade = d.toISOString().slice(0, 10)

    const { data, error } = await supabase.from("epis").insert({
      descricao: e.descricao,
      ca: e.ca,
      ca_validade: validade,
      fabricante: e.fabricante,
      tipo: e.tipo,
    }).select().single()

    if (error) {
      console.log(`  ✗ CA ${e.ca}: ${error.message}`)
    } else {
      episInseridos.push(data)
    }
  }
  console.log(`  ✓ ${episInseridos.length} EPIs (${episInseridos.length - (episExistentes?.length ?? 0)} novos)`)

  if (episInseridos.length === 0) {
    console.error("❌ Nenhum EPI disponível — abortando entregas.")
    process.exit(1)
  }

  // ==================
  // ENTREGAS DE EPI
  // ==================
  console.log("\n→ Entregas de EPI...")
  let entregasCount = 0
  for (const c of colaboradores) {
    const n = 2 + rnd(4)
    for (let k = 0; k < n; k++) {
      const { error } = await supabase.from("epi_entregas").insert({
        colaborador_id: c.id,
        epi_id: pick(episInseridos).id,
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
  // OCORRÊNCIAS
  // ==================
  console.log("\n→ Ocorrências (25)...")
  let ocorrCount = 0
  for (let i = 0; i < 25; i++) {
    const colab = pick(colaboradores)
    const tipo = pickWeighted([
      ["quase_acidente", 40], ["incidente", 15], ["condicao_insegura", 15],
      ["ato_inseguro", 10], ["desvio", 8], ["acidente_tipico", 8],
      ["acidente_trajeto", 3], ["doenca_ocupacional", 1],
    ])
    const ehAcidente = ["acidente_tipico", "acidente_trajeto", "doenca_ocupacional"].includes(tipo)
    const gravidade = ehAcidente
      ? pickWeighted([["leve", 55], ["moderado", 30], ["grave", 12], ["fatal", 3]])
      : null

    const descricoes = [
      "Durante execução de manutenção preventiva em painel elétrico, operador percebeu aquecimento anormal antes de tocar no componente.",
      "Queda de objeto no piso sem atingir ninguém, mas muito próximo à equipe de manutenção que trabalhava na área.",
      "Colaborador escorregou em piso molhado durante deslocamento entre oficinas. Sem lesão aparente.",
      "Identificado ausência de sinalização em área de risco durante inspeção de rotina pela segurança.",
      "Corte superficial no antebraço ao manusear ferramenta de corte sem luva adequada.",
      "Colaborador apresentou tontura após trabalho prolongado em ambiente confinado. Retirado da área.",
      "Falha no bloqueio (LOTO) de disjuntor identificada antes da execução do serviço.",
      "Ferramenta caiu do segundo andar, atingindo capacete de colaborador que trabalhava abaixo.",
      "Equipe observou uso incorreto de EPI por colaborador terceiro durante inspeção.",
    ]

    const { error } = await supabase.from("ocorrencias").insert({
      empresa_id: colab.empresa_id,
      tipo,
      data_ocorrencia: new Date(Date.now() - rnd(365) * 86400000).toISOString(),
      local: pick(LOCAIS_OBRA),
      descricao: pick(descricoes),
      colaborador_id: Math.random() < 0.8 ? colab.id : null,
      gravidade,
      parte_corpo_atingida: ehAcidente ? pick(PARTES_CORPO_TXT) : null,
      natureza_lesao: ehAcidente ? pick(NATUREZAS_LESAO) : null,
      agente_causador: ehAcidente ? pick(AGENTES_CAUSADORES) : null,
      dias_afastamento: ehAcidente ? pickWeighted([[0, 40], [1, 20], [3, 15], [7, 12], [15, 8], [30, 5]]) : null,
      status: pickWeighted([["aberta", 30], ["investigando", 30], ["concluida", 30], ["encerrada", 10]]),
    })
    if (error) console.log(`  ✗ ${error.message}`)
    else ocorrCount++
  }
  console.log(`  ✓ ${ocorrCount} ocorrências`)

  // ==================
  // INSPEÇÕES
  // ==================
  console.log("\n→ Inspeções (15)...")
  const { data: templates } = await supabase.from("templates_inspecao").select("*").eq("ativo", true)
  let inspCount = 0

  for (let i = 0; i < 15 && templates?.length > 0; i++) {
    const tpl = pick(templates)
    const colab = pick(colaboradores)
    const itens = tpl.itens ?? []
    const respostas = itens.map((it, idx) => ({
      item_index: idx,
      pergunta: it.pergunta,
      grupo: it.grupo ?? null,
      conforme: pickWeighted([["sim", 70], ["nao", 20], ["na", 10]]),
      observacao: null,
      foto_url: null,
    }))
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
    if (error) console.log(`  ✗ ${error.message}`)
    else inspCount++
  }
  console.log(`  ✓ ${inspCount} inspeções`)

  // ==================
  // DDS
  // ==================
  console.log("\n→ DDS (10)...")
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
    const pool = colaboradores.filter((c) => c.empresa_id === empresa.id)
    if (pool.length < 3) continue

    const nPart = 5 + rnd(8)
    const chosen = new Set()
    while (chosen.size < Math.min(nPart, pool.length)) chosen.add(pick(pool).id)
    const participantes = Array.from(chosen).map((id) => {
      const p = pool.find((x) => x.id === id)
      return { colaborador_id: p.id, nome: p.nome_completo, cpf: p.cpf, cargo: null, assinatura_url: null }
    })
    const mediador = pick(pool)
    const dataDds = randomDate(5, 180)

    const { error } = await supabase.from("documentos_sst").insert({
      tipo: "dialogo_seguranca",
      titulo: `DDS — ${TEMAS_DDS[i]}`,
      empresa_id: empresa.id,
      local_trabalho: pick(LOCAIS_OBRA),
      data_emissao: dataDds,
      status: "emitido",
      elaborado_por: mediador.id,
      conteudo: {
        tema: TEMAS_DDS[i],
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
    if (error) console.log(`  ✗ ${error.message}`)
    else ddsCount++
  }
  console.log(`  ✓ ${ddsCount} DDS`)

  // ==================
  // APRs
  // ==================
  console.log("\n→ APRs (8)...")
  let aprCount = 0
  for (let i = 0; i < 8; i++) {
    const empresa = pick(empresas)
    const pool = colaboradores.filter((c) => c.empresa_id === empresa.id)
    if (pool.length < 3) continue
    const elaborado = pick(pool)

    const { error } = await supabase.from("documentos_sst").insert({
      tipo: "apr",
      titulo: `APR — ${pick(LOCAIS_OBRA)}`,
      empresa_id: empresa.id,
      local_trabalho: pick(LOCAIS_OBRA),
      data_emissao: randomDate(5, 90),
      status: pickWeighted([["emitido", 40], ["aprovado", 40], ["executado", 20]]),
      elaborado_por: elaborado.id,
      conteudo: {
        equipe: Array.from({ length: 3 + rnd(4) }, () => pick(pool).nome_completo),
        riscos: [
          {
            atividade: "Abertura de painel MT",
            perigo: "Choque elétrico / arco voltaico",
            consequencia: "Queimadura grave, parada cardiorrespiratória",
            probabilidade: 2,
            severidade: 5,
            medida_controle: "Desenergização + LOTO + teste de ausência de tensão + EPIs classe 3",
            responsavel: pick(pool).nome_completo,
          },
          {
            atividade: "Troca de componente em altura",
            perigo: "Queda de altura > 2m",
            consequencia: "Fratura múltipla, óbito",
            probabilidade: 2,
            severidade: 4,
            medida_controle: "Cinto paraquedista + talabarte duplo + ancoragem certificada",
            responsavel: pick(pool).nome_completo,
          },
        ],
        epis: ["Capacete classe B", "Luva isolante classe 3", "Botina dielétrica", "Cinto paraquedista"],
        observacoes: null,
        assinaturas: [],
      },
    })
    if (error) console.log(`  ✗ ${error.message}`)
    else aprCount++
  }
  console.log(`  ✓ ${aprCount} APRs`)

  // Atualiza vw_vencimentos
  console.log("\n→ Atualizando vw_vencimentos...")
  await supabase.rpc("atualizar_status_vencimentos")

  // ==================
  // RESUMO FINAL via contagem direta
  // ==================
  const counts = await Promise.all([
    supabase.from("empresas").select("*", { count: "exact", head: true }),
    supabase.from("cargos").select("*", { count: "exact", head: true }),
    supabase.from("colaboradores").select("*", { count: "exact", head: true }),
    supabase.from("epis").select("*", { count: "exact", head: true }),
    supabase.from("treinamentos").select("*", { count: "exact", head: true }),
    supabase.from("exames_medicos").select("*", { count: "exact", head: true }),
    supabase.from("treinamentos_realizados").select("*", { count: "exact", head: true }),
    supabase.from("epi_entregas").select("*", { count: "exact", head: true }),
    supabase.from("ocorrencias").select("*", { count: "exact", head: true }),
    supabase.from("inspecoes").select("*", { count: "exact", head: true }),
    supabase.from("documentos_sst").select("*", { count: "exact", head: true }),
    supabase.from("vw_vencimentos").select("*", { count: "exact", head: true }).in("urgencia", ["critico", "vencido"]),
  ])

  console.log("\n" + "=".repeat(60))
  console.log("✅ BASE POVOADA — CONTAGENS FINAIS")
  console.log("=".repeat(60))
  const [emp, car, col, epi, tre, ex, tr, ent, oc, ins, doc, venc] = counts.map((c) => c.count ?? 0)
  console.log(`  Empresas:                ${emp}`)
  console.log(`  Cargos:                  ${car}`)
  console.log(`  Colaboradores:           ${col}`)
  console.log(`  EPIs:                    ${epi}`)
  console.log(`  Treinamentos catálogo:   ${tre}`)
  console.log(`  Exames médicos:          ${ex}`)
  console.log(`  Treinam. realizados:     ${tr}`)
  console.log(`  Entregas de EPI:         ${ent}`)
  console.log(`  Ocorrências:             ${oc}`)
  console.log(`  Inspeções:               ${ins}`)
  console.log(`  Documentos (APR/DDS):    ${doc}`)
  console.log(`  ⚠ Vencim. críticos:      ${venc}`)
  console.log("=".repeat(60))
  console.log("\n🎯 Cenários prontos para testar:")
  console.log("  • /documentos/lote → gerar ~60 certificados NR-10 ou NR-35 em ZIP")
  console.log("  • /dashboard → KPIs com dados reais")
  console.log("  • /vencimentos → painel semáforo com dezenas de itens")
  console.log("  • /relatorios/heatmap-ocorrencias → visualização por local")
  console.log("  • /matriz-treinamentos → gap analysis real")
  console.log("  • Ctrl+K → buscar 'silva' ou um CNPJ\n")
}

main().catch((err) => {
  console.error("❌ Erro:", err)
  process.exit(1)
})
