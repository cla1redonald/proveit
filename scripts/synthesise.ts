// ProveIt Studio synthesiser — runs on your Max plan via `claude -p` (no API wallet).
//   node scripts/synthesise.ts <slug>       # one idea
//   node scripts/synthesise.ts --all        # every idea
//   node scripts/synthesise.ts --portfolio  # cross-idea portfolio synthesis
//
// Writes synthesis.json beside each idea (carried to Supabase by `proveit sync`),
// and _portfolio-synthesis.json at the first scan root. Caches — re-run to refresh.

import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  scanRoots,
  loadIdea,
  perIdeaSynthesisPrompt,
  portfolioSynthesisPrompt,
  extractJson,
  resolveRoots,
  type IdeaSummary,
} from '../packages/core/src/index.ts'

const ROOTS = resolveRoots()
const MODEL = process.env.PROVEIT_SYNTH_MODEL ?? 'sonnet'

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--model', MODEL], { stdio: ['pipe', 'pipe', 'inherit'] })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}`))))
    child.stdin.write(prompt)
    child.stdin.end()
  })
}

const KEEP_KINDS = new Set(['research', 'swarm-synthesis', 'review', 'swarm-angle', 'spec', 'pre-mortem'])

async function synthIdea(summary: IdeaSummary): Promise<void> {
  const idea = await loadIdea(summary.discoveryPath)
  const artifacts: { label: string; content: string }[] = [
    { label: 'Discovery', content: await readFile(idea.discoveryPath, 'utf8') },
  ]
  const keep = idea.artifacts.filter((a) => KEEP_KINDS.has(a.kind)).slice(0, 10)
  for (const a of keep) {
    try {
      artifacts.push({ label: a.label, content: await readFile(a.path, 'utf8') })
    } catch {
      /* skip unreadable */
    }
  }

  process.stderr.write(`\n→ ${idea.name} — ${artifacts.length} docs, model ${MODEL}…\n`)
  const out = await runClaude(perIdeaSynthesisPrompt(idea, artifacts))
  const parsed = extractJson<{ summary: string; bull: string; bear: string; devil: string; body?: string }>(out)
  const synthesis = {
    slug: idea.slug,
    generatedAt: new Date().toISOString(),
    summary: parsed.summary,
    bull: parsed.bull,
    bear: parsed.bear,
    devil: parsed.devil,
    body: parsed.body,
  }
  const out_path = join(idea.dir, 'synthesis.json')
  await writeFile(out_path, JSON.stringify(synthesis, null, 2))
  process.stderr.write(`  ✓ ${out_path}\n`)
}

async function synthPortfolio(summaries: IdeaSummary[]): Promise<void> {
  const ideas = summaries.map((s) => ({
    name: s.name,
    scores: { d: s.scores.desirability, v: s.scores.viability, f: s.scores.feasibility },
    status: s.status,
    killSignals: s.killSignals.map((k) => ({ label: k.label, status: k.status })),
  }))
  process.stderr.write(`\n→ portfolio — ${ideas.length} ideas, model ${MODEL}…\n`)
  const out = await runClaude(portfolioSynthesisPrompt(ideas))
  const synthesis = { generatedAt: new Date().toISOString(), body: out.trim() }
  const out_path = join(ROOTS[0], '_portfolio-synthesis.json')
  await writeFile(out_path, JSON.stringify(synthesis, null, 2))
  process.stderr.write(`  ✓ ${out_path}\n`)
}

const arg = process.argv[2]
if (!arg) {
  console.error('usage: node scripts/synthesise.ts <slug> | --all | --portfolio')
  process.exit(1)
}

const summaries = await scanRoots(ROOTS)
if (arg === '--portfolio') {
  await synthPortfolio(summaries)
} else if (arg === '--all') {
  for (const s of summaries) await synthIdea(s)
} else {
  const s = summaries.find((x) => x.slug === arg)
  if (!s) {
    console.error(`no idea "${arg}". known: ${summaries.map((x) => x.slug).join(', ')}`)
    process.exit(1)
  }
  await synthIdea(s)
}
process.stderr.write('\ndone.\n')
