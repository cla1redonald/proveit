// Quick CLI to scan roots and print the portfolio. Also the basis for the
// `proveit sync` command and the MCP dashboard tool.
//   node src/cli.ts <root> [<root> …] [--json]
//   node src/cli.ts <root> --idea <slug>     # full detail for one idea

import { scanRoots, loadIdea, combined, activeKillCount } from './scan.ts'

function fmtScore(n?: number): string {
  return n == null ? ' -' : String(n).padStart(2)
}

const args = process.argv.slice(2)
const json = args.includes('--json')
const ideaIdx = args.indexOf('--idea')
const ideaSlug = ideaIdx >= 0 ? args[ideaIdx + 1] : null
const roots = args.filter(
  (a, i) => !a.startsWith('--') && !(ideaIdx >= 0 && i === ideaIdx + 1),
)

if (roots.length === 0) {
  console.error('usage: node src/cli.ts <root> [<root> …] [--json] [--idea <slug>]')
  process.exit(1)
}

const ideas = await scanRoots(roots)

if (ideaSlug) {
  const summary = ideas.find((i) => i.slug === ideaSlug)
  if (!summary) {
    console.error(`No idea with slug "${ideaSlug}". Known: ${ideas.map((i) => i.slug).join(', ')}`)
    process.exit(1)
  }
  const idea = await loadIdea(summary.discoveryPath)
  console.log(json ? JSON.stringify(idea, null, 2) : detail(idea))
} else if (json) {
  console.log(JSON.stringify(ideas, null, 2))
} else {
  console.log(`\nProveIt portfolio — ${ideas.length} idea(s)\n`)
  console.log('  D  V  F  Σ   Kill(res)  Art  Idea')
  console.log('  ──────────────────────────────────────────────────')
  for (const i of ideas) {
    const active = activeKillCount(i.killSignals)
    const resolved = i.killSignals.length - active
    const kill = `${String(active).padStart(2)}(${resolved})`
    console.log(
      `  ${fmtScore(i.scores.desirability)} ${fmtScore(i.scores.viability)} ${fmtScore(
        i.scores.feasibility,
      )} ${String(combined(i.scores)).padStart(2)}   ${kill.padStart(6)}   ${String(
        i.artifactCount,
      ).padStart(3)}  ${i.name}`,
    )
    const extras = Object.values(i.scores.extra)
    if (extras.length) console.log(`            + ${extras.map((e) => `${e.label} ${e.score}/10`).join(', ')}`)
  }
  console.log('')
}

function detail(idea: Awaited<ReturnType<typeof loadIdea>>): string {
  const lines: string[] = []
  lines.push(`\n# ${idea.name}  (${idea.slug})`)
  lines.push(`scores: D${idea.scores.desirability ?? '-'} V${idea.scores.viability ?? '-'} F${idea.scores.feasibility ?? '-'}`)
  if (idea.status) lines.push(`status: ${idea.status}`)
  lines.push(`dir: ${idea.dir}`)
  lines.push(`deck: ${idea.hasDeck ? idea.deck : 'none'}`)
  lines.push(`kill signals: ${idea.killSignals.length ? idea.killSignals.map((k) => k.label).join('; ') : 'none'}`)
  lines.push(`\nartifacts (${idea.artifacts.length}):`)
  for (const a of idea.artifacts) lines.push(`  [${a.kind}] ${a.label}  (${a.fileName})`)
  return lines.join('\n')
}
