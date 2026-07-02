// proveit sync — push the local vault into Supabase so the hosted Studio
// (studio.proveit.tools) can read it. One-way (local → cloud), idempotent upserts.
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/sync.ts
//
// The hosted reader makes ZERO model calls — synthesis is computed locally on
// Max (scripts/synthesise.ts) and carried up here as plain data.

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { scanRoots, loadIdea, scanFastChecks, resolveRoots, type IdeaSummary } from '../packages/core/src/index.ts'

const ROOTS = resolveRoots()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return null
  }
}

async function syncIdea(summary: IdeaSummary): Promise<void> {
  const idea = await loadIdea(summary.discoveryPath)

  let { error } = await db.from('studio_ideas').upsert({
    slug: idea.slug,
    name: idea.name,
    one_liner: idea.oneLiner ?? null,
    scores: idea.scores,
    status: idea.status ?? null,
    generated: idea.generated ?? null,
    last_updated: idea.lastUpdated ?? null,
    kill_signals: idea.killSignals,
    has_deck: idea.hasDeck,
    deck: idea.deck ?? null,
    artifact_count: idea.artifacts.filter((a) => a.kind !== 'synthesis-cache').length,
  })
  if (error) throw error

  const discoveryFile = idea.discoveryPath.split('/').pop() ?? 'discovery.md'
  const rows: Record<string, unknown>[] = [
    { idea_slug: idea.slug, file_name: discoveryFile, kind: 'discovery', label: 'Discovery', content: await readFile(idea.discoveryPath, 'utf8') },
  ]
  for (const a of idea.artifacts) {
    if (a.kind === 'synthesis-cache') continue
    try {
      rows.push({
        idea_slug: idea.slug,
        file_name: a.fileName,
        kind: a.kind,
        label: a.label,
        round: a.round ?? null,
        angle: a.angle ?? null,
        content: await readFile(a.path, 'utf8'),
      })
    } catch {
      /* skip unreadable */
    }
  }
  ;({ error } = await db.from('studio_artifacts').upsert(rows))
  if (error) throw error

  // Delete orphans: sync is upsert-only, so renamed/deleted vault artifacts leave
  // stale rows the hosted reader renders as phantoms. Drop rows for this idea that
  // are no longer present in the set just upserted.
  const fileNames = rows.map((r) => r.file_name as string)
  ;({ error } = await db
    .from('studio_artifacts')
    .delete()
    .eq('idea_slug', idea.slug)
    .not('file_name', 'in', '(' + fileNames.map((f) => `"${f}"`).join(',') + ')'))
  if (error) throw error

  const synth = await readJson<{ generatedAt?: string; summary: string; bull: string; bear: string; devil: string; body?: string }>(
    join(idea.dir, 'synthesis.json'),
  )
  if (synth) {
    ;({ error } = await db.from('studio_synthesis').upsert({
      idea_slug: idea.slug,
      generated_at: synth.generatedAt ?? null,
      summary: synth.summary,
      bull: synth.bull,
      bear: synth.bear,
      devil: synth.devil,
      body: synth.body ?? null,
    }))
    if (error) throw error
  }
  process.stderr.write(`  ✓ ${idea.name} (${rows.length} files${synth ? ' + synthesis' : ''})\n`)
}

const summaries = await scanRoots(ROOTS)
process.stderr.write(`syncing ${summaries.length} ideas to ${url}…\n`)
for (const s of summaries) await syncIdea(s)

// portfolio synthesis
const portfolio = await readJson<{ generatedAt?: string; body: string }>(join(ROOTS[0], '_portfolio-synthesis.json'))
if (portfolio) {
  const { error } = await db
    .from('studio_portfolio_synthesis')
    .upsert({ id: 1, generated_at: portfolio.generatedAt ?? null, body: portfolio.body })
  if (error) throw error
  process.stderr.write('  ✓ portfolio synthesis\n')
}

// fast checks
const fastChecks = await scanFastChecks(ROOTS)
if (fastChecks.length) {
  const { error } = await db.from('studio_fast_checks').upsert(
    fastChecks.map((f) => ({
      slug: f.slug,
      name: f.name,
      verdict: f.verdict ?? null,
      assessments: f.assessments,
      insight: f.insight ?? null,
      source: f.source ?? null,
      date: f.date ?? null,
    })),
  )
  if (error) throw error
  process.stderr.write(`  ✓ ${fastChecks.length} fast checks\n`)
}

process.stderr.write('\ndone.\n')
