#!/usr/bin/env node
/**
 * Script de release semi-automatizado.
 *
 * Uso:
 *   node scripts/release.mjs patch    # 0.4.0 → 0.4.1
 *   node scripts/release.mjs minor    # 0.4.0 → 0.5.0
 *   node scripts/release.mjs major    # 0.4.0 → 1.0.0
 *
 * O que faz:
 *   1. Valida estado do repo (working tree limpo, branch = master)
 *   2. Calcula nova versão a partir da atual em package.json
 *   3. Bumpa package.json
 *   4. Garante entrada "[Não lançado]" no CHANGELOG — se houver notas,
 *      renomeia para a nova versão + data de hoje (senão pede confirmação)
 *   5. Cria commit de release + tag anotada
 *
 * NÃO faz push automaticamente — o usuário confere e roda:
 *   git push && git push --tags
 *
 * Escolha consciente: release é uma ação deliberada, o push deve ser
 * explícito para evitar "ops, saiu sem querer".
 */

import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createInterface } from "node:readline/promises"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const PKG_PATH = join(ROOT, "package.json")
const CHANGELOG_PATH = join(ROOT, "CHANGELOG.md")

const BUMP_TYPE = process.argv[2]
if (!["patch", "minor", "major"].includes(BUMP_TYPE ?? "")) {
  console.error("Uso: node scripts/release.mjs <patch|minor|major>")
  process.exit(1)
}

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim()
}

function bump(version, type) {
  const [maj, min, pat] = version.split(".").map(Number)
  if (type === "major") return `${maj + 1}.0.0`
  if (type === "minor") return `${maj}.${min + 1}.0`
  return `${maj}.${min}.${pat + 1}`
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`${question} [y/N] `)
  rl.close()
  return answer.toLowerCase().startsWith("y")
}

// ----------------------------------------------------------------------------
// 1. Sanity checks
// ----------------------------------------------------------------------------
const branch = sh("git rev-parse --abbrev-ref HEAD")
if (branch !== "master" && branch !== "main") {
  console.error(`✗ Release só em master/main (você está em '${branch}')`)
  process.exit(1)
}

const status = sh("git status --porcelain")
if (status) {
  console.error("✗ Working tree sujo. Commit ou stash antes de releasar:")
  console.error(status)
  process.exit(1)
}

// ----------------------------------------------------------------------------
// 2. Calcula nova versão
// ----------------------------------------------------------------------------
const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"))
const oldVersion = pkg.version
const newVersion = bump(oldVersion, BUMP_TYPE)
const today = new Date().toISOString().slice(0, 10)

console.log(`\n→ ${oldVersion} → ${newVersion} (${BUMP_TYPE})`)
console.log(`→ Data: ${today}\n`)

// ----------------------------------------------------------------------------
// 3. Atualiza CHANGELOG
// ----------------------------------------------------------------------------
let changelog = readFileSync(CHANGELOG_PATH, "utf8")
const unreleasedHeader = "## [Não lançado]"
const idx = changelog.indexOf(unreleasedHeader)

if (idx === -1) {
  console.error("✗ Seção '## [Não lançado]' não encontrada no CHANGELOG.md")
  process.exit(1)
}

// Extrai conteúdo da seção [Não lançado] (até o próximo `## [` ou `---`)
const nextSectionRegex = /\n## \[[^\]]+\] —/
const after = changelog.slice(idx + unreleasedHeader.length)
const nextMatch = after.match(nextSectionRegex)
const endOfUnreleased = nextMatch ? idx + unreleasedHeader.length + nextMatch.index : changelog.length
const unreleasedBody = changelog
  .slice(idx + unreleasedHeader.length, endOfUnreleased)
  .replace(/^_[^_]+_\s*/, "") // remove o placeholder "_Mudanças em desenvolvimento..._"
  .replace(/^---\s*/m, "") // remove separador horizontal
  .trim()

if (!unreleasedBody) {
  const ok = await confirm("⚠  CHANGELOG [Não lançado] está vazio. Releasar mesmo assim?")
  if (!ok) {
    console.log("Abortado.")
    process.exit(0)
  }
}

// Constrói novo changelog: [Não lançado] vazio + nova seção com conteúdo
const newUnreleased = `## [Não lançado]

_Mudanças em desenvolvimento na branch \`master\` ainda não publicadas numa tag._

---

## [${newVersion}] — ${today}

${unreleasedBody || "_Sem notas explícitas — ver commits entre as tags._"}

---`

changelog = changelog.slice(0, idx) + newUnreleased + changelog.slice(endOfUnreleased)

// Atualiza links de comparação no final
const compareLinkRegex = /\[Não lançado\]: .+$/m
changelog = changelog.replace(
  compareLinkRegex,
  `[Não lançado]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v${newVersion}...HEAD`,
)

// Insere linha de link para a nova versão depois do [Não lançado]
const newCompareLink = `\n[${newVersion}]: https://github.com/EvandroEstevesFerreira/sst-manager/compare/v${oldVersion}...v${newVersion}`
changelog = changelog.replace(
  /\[Não lançado\]: .+$/m,
  (m) => m + newCompareLink,
)

writeFileSync(CHANGELOG_PATH, changelog)
console.log("✓ CHANGELOG.md atualizado")

// ----------------------------------------------------------------------------
// 4. Bumpa package.json
// ----------------------------------------------------------------------------
pkg.version = newVersion
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n")
console.log(`✓ package.json → ${newVersion}`)

// ----------------------------------------------------------------------------
// 5. Commit + tag
// ----------------------------------------------------------------------------
sh(`git add package.json CHANGELOG.md`)
sh(`git commit -m "chore(release): v${newVersion}"`)
sh(`git tag -a v${newVersion} -m "Release v${newVersion}"`)

console.log(`\n✓ Commit e tag v${newVersion} criados.`)
console.log(`\nPróximos passos:`)
console.log(`  git push && git push --tags`)
console.log(`\nOu, se quiser reverter:`)
console.log(`  git tag -d v${newVersion}`)
console.log(`  git reset --hard HEAD~1`)
