// Filesystem scan + parse for ProveIt outputs.
//
// Reality check (from Claire's actual vault) that drives the design:
//   - Two naming conventions in the wild: standard (`discovery.md`,
//     `swarm-1-market-bull.md`) and numbered (`01_Discovery.md`,
//     `21_Swarm_1_Market_Bull.md`). Detection is therefore CONTENT-based,
//     not filename-based.
//   - A discovery index = a markdown file with a `# ProveIt:` title and/or a
//     `Desirability: N/10` score line under `## Confidence Score`.
//   - Some folders contain a separate `00_Index.md` that *recaps* scores —
//     so we DEDUPE per directory, keeping the strongest discovery signal.
//   - Idea artifacts are convention-named siblings in the discovery's folder;
//     unrelated notes in a shared folder simply don't classify and are ignored.

import { readdir, readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import type {
  Artifact,
  ArtifactKind,
  Idea,
  IdeaSummary,
  KillSignal,
  Scores,
} from './types.ts'

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.obsidian',
  '.trash',
  '.claude',
  '.smart-env',
  'Library',
  'Applications',
  '.npm',
  '.nvm',
  'attachments',
  'assets',
])

const MAX_DEPTH = 7

// ── Discovery detection ──────────────────────────────────────────────────────

const PROVEIT_TITLE_RE = /^#\s+ProveIt:\s*(.+?)\s*$/im
const FIRST_TITLE_RE = /^#\s+(.+?)\s*$/m
const SCORE_LINE_RE =
  /Desirability:\s*\d{1,2}\s*\/\s*10\s*\|\s*Viability:\s*\d{1,2}\s*\/\s*10/i
const CONF_HEADER_RE = /^##\s+Confidence Score\s*$/im

/** Heuristic strength that a markdown file is THE discovery index. */
export function discoveryLikelihood(text: string, fileName: string): number {
  let s = 0
  if (PROVEIT_TITLE_RE.test(text)) s += 3
  if (SCORE_LINE_RE.test(text)) s += 3
  if (CONF_HEADER_RE.test(text)) s += 1
  const fn = fileName.toLowerCase()
  if (/(^|[^a-z])discovery/.test(fn)) s += 2
  if (/index/.test(fn)) s -= 1 // a recap index should lose to the real discovery
  return s
}

/** A file is a candidate only if it has the canonical score line or a ProveIt title + header. */
function isDiscoveryCandidate(text: string): boolean {
  if (SCORE_LINE_RE.test(text)) return true
  return PROVEIT_TITLE_RE.test(text) && CONF_HEADER_RE.test(text)
}

// ── Markdown walk ────────────────────────────────────────────────────────────

export async function* walkMarkdown(root: string, depth = 0): AsyncGenerator<string> {
  if (depth > MAX_DEPTH) return
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue
      yield* walkMarkdown(join(root, e.name), depth + 1)
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      yield join(root, e.name)
    }
  }
}

// ── Parsing ──────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

function sectionBody(text: string, headerRe: RegExp, maxLines = 12): string {
  const m = headerRe.exec(text)
  if (!m) return ''
  const after = text.slice(m.index + m[0].length)
  const lines: string[] = []
  for (const line of after.split('\n').slice(1)) {
    if (/^##\s+/.test(line)) break // next section
    lines.push(line)
    if (lines.length >= maxLines) break
  }
  return lines.join('\n').trim()
}

const SCORE_PAIR_RE = /([A-Za-z][A-Za-z \/&'’.-]*?):\s*(\d{1,2})\s*\/\s*10/g

function parseScores(confSection: string): Scores {
  const scores: Scores = { extra: {} }
  for (const m of confSection.matchAll(SCORE_PAIR_RE)) {
    const label = m[1].trim()
    const value = Number(m[2])
    const key = slugify(label)
    if (key === 'desirability') scores.desirability = value
    else if (key === 'viability') scores.viability = value
    else if (key === 'feasibility') scores.feasibility = value
    else scores.extra[key] = { label, score: value }
  }
  return scores
}

function killStatus(label: string, detail = ''): KillSignal['status'] {
  const t = `${label} ${detail}`
  if (/\bresolved\b/i.test(t)) return 'resolved'
  if (/\bserious\b/i.test(t)) return 'serious'
  if (/\bmonitored?\b/i.test(t)) return 'monitored'
  if (/\bflag,?\s*not\s*(?:a\s*)?kill\b/i.test(t) || /^\s*flag\b/i.test(label)) return 'flag'
  return 'active'
}

function parseKillSignals(text: string): KillSignal[] {
  const body = sectionBody(text, /^##\s+Kill Signals\b/im, 20)
  if (!body || /^\s*none\b/i.test(body)) return []
  const out: KillSignal[] = []
  for (const line of body.split('\n')) {
    const m = /^\s*[-*]\s+(.+)$/.exec(line)
    if (!m) continue
    const raw = m[1].trim()
    if (/^none\b/i.test(raw)) continue
    let label: string
    let detail: string | undefined
    let mm: RegExpExecArray | null
    if ((mm = /^\*\*(.+?)\*\*[\s:—–-]*(.*)$/.exec(raw))) {
      // **Label:** detail   |   **Label** — detail
      label = mm[1].trim().replace(/:$/, '')
      detail = mm[2].trim() || undefined
    } else if ((mm = /^(.+?)\s*[—–:-]\s+(.+)$/.exec(raw))) {
      // Label — detail   |   Label: detail
      label = mm[1].trim()
      detail = mm[2].trim()
    } else {
      label = raw
    }
    out.push({ label, detail, status: killStatus(label, detail) })
  }
  return out
}

/** Live concerns = everything not explicitly resolved. */
export function activeKillCount(signals: KillSignal[]): number {
  return signals.filter((s) => s.status !== 'resolved').length
}

export interface ParsedDiscovery {
  name: string
  oneLiner?: string
  scores: Scores
  status?: string
  generated?: string
  lastUpdated?: string
  killSignals: KillSignal[]
  hasDeck: boolean
  deck?: string
  brainDump?: string
  recommendation?: string
}

export function parseDiscovery(text: string): ParsedDiscovery {
  const titleM = PROVEIT_TITLE_RE.exec(text) || FIRST_TITLE_RE.exec(text)
  let name = titleM ? titleM[1].trim() : 'Untitled'
  // Strip a leading "Something:" prefix that isn't part of the name (dashboard rule),
  // but keep the ProveIt-captured name as-is.
  if (!PROVEIT_TITLE_RE.test(text) && name.includes(':')) {
    name = name.slice(name.indexOf(':') + 1).trim()
  }

  const confM = CONF_HEADER_RE.exec(text)
  const confSection = confM
    ? text.slice(confM.index, confM.index + 400)
    : text.slice(0, 400)
  const scores = parseScores(confSection)

  const status = /^Status:\s*(.+)$/im.exec(confSection)?.[1]?.trim()
  const generated = /^Generated:\s*(.+)$/im.exec(text)?.[1]?.trim()
  const lastUpdated = /^Last updated:\s*(.+)$/im.exec(text)?.[1]?.trim()

  const deckBody = sectionBody(text, /^##\s+Gamma Deck\b/im, 4)
  const deckFirst = deckBody.split('\n').find((l) => l.trim())?.trim()
  const hasDeck = !!deckFirst && /^https?:\/\//i.test(deckFirst)

  const brainDump =
    sectionBody(text, /^##\s+Idea \(Brain Dump\b/im, 8) ||
    sectionBody(text, /^##\s+Brain Dump\b/im, 8) ||
    undefined
  const recommendation = sectionBody(text, /^##\s+Recommendation\b/im, 6) || undefined

  let oneLiner: string | undefined
  if (brainDump) {
    const firstLine = brainDump.split('\n').map((l) => l.trim()).find(Boolean)
    if (firstLine) {
      const cleaned = firstLine
        .replace(/^[*_]*\s*one[- ]?liner\s*[:*]*\s*/i, '')
        .replace(/\*\*/g, '')
        .replace(/^["'“]|["'”]$/g, '')
        .trim()
      const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0]
      oneLiner = (firstSentence.length > 8 ? firstSentence : cleaned) || undefined
    }
  }

  return {
    name,
    oneLiner,
    scores,
    status,
    generated,
    lastUpdated,
    killSignals: parseKillSignals(text),
    hasDeck,
    deck: deckFirst,
    brainDump,
    recommendation,
  }
}

// ── Artifact classification (both naming styles) ─────────────────────────────

function prettyAngle(raw: string): string {
  return raw
    .replace(/\.md$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** Classify a sibling file. Returns null if it isn't a ProveIt artifact. */
export function classifyArtifact(
  fileName: string,
  opts: { dedicatedDir: boolean } = { dedicatedDir: false },
): Omit<Artifact, 'path'> | null {
  const f = fileName
  let m: RegExpExecArray | null

  // synthesis cache (our own, P2)
  if (/^_?portfolio-synthesis\.json$/i.test(f))
    return { kind: 'synthesis-cache', label: 'Portfolio synthesis (cached)', fileName }
  if (/^synthesis\.json$/i.test(f))
    return { kind: 'synthesis-cache', label: 'Synthesis (cached)', fileName }

  if (!/\.md$/i.test(f)) return null

  // discovery index itself
  if (/^discovery\.md$/i.test(f) || /^\d+[_-]?discovery/i.test(f))
    return { kind: 'discovery', label: 'Discovery', fileName }
  if (/^\d+[_-]?index/i.test(f) || /^00[_-]/i.test(f))
    return { kind: 'index', label: 'Index', fileName }

  // research rounds
  if ((m = /^research-(\d+)\.md$/i.exec(f)))
    return { kind: 'research', label: `Research Round ${m[1]}`, round: +m[1], fileName }
  if ((m = /^\d+[_-]research[_-]round[_-]?(\d+)?[_-]?(.*)\.md$/i.exec(f))) {
    const round = m[1] ? +m[1] : undefined
    const suffix = m[2] ? ` — ${prettyAngle(m[2])}` : ''
    return { kind: 'research', label: `Research${round ? ` Round ${round}` : ''}${suffix}`, round, fileName }
  }

  // swarm synthesis
  if ((m = /^swarm-(\d+)-synthesis\.md$/i.exec(f)))
    return { kind: 'swarm-synthesis', label: `Swarm ${m[1]} · Synthesis`, round: +m[1], fileName }
  if ((m = /^\d+[_-]swarm[_-](\d+)[_-]synthesis/i.exec(f)))
    return { kind: 'swarm-synthesis', label: `Swarm ${m[1]} · Synthesis`, round: +m[1], fileName }

  // swarm angles
  if ((m = /^swarm-(\d+)-(.+)\.md$/i.exec(f)))
    return { kind: 'swarm-angle', label: `Swarm ${m[1]} · ${prettyAngle(m[2])}`, round: +m[1], angle: slugify(m[2]), fileName }
  if ((m = /^\d+[_-]swarm[_-](\d+)[_-](.+?)(?:\.md)?$/i.exec(f)))
    return { kind: 'swarm-angle', label: `Swarm ${m[1]} · ${prettyAngle(m[2])}`, round: +m[1], angle: slugify(m[2]), fileName }

  if ((m = /^review-(\d+)\.md$/i.exec(f)))
    return { kind: 'review', label: `Cross-Model Review ${m[1]}`, round: +m[1], fileName }
  if ((m = /^pre-mortem-(\d+)\.md$/i.exec(f)))
    return { kind: 'pre-mortem', label: `Pre-Mortem ${m[1]}`, round: +m[1], fileName }
  if ((m = /^scenarios-(\d+)\.md$/i.exec(f)))
    return { kind: 'scenarios', label: `Scenarios ${m[1]}`, round: +m[1], fileName }

  if (/^spec\.md$/i.test(f)) return { kind: 'spec', label: 'Spec', fileName }
  if (/^design-brief\.md$/i.test(f)) return { kind: 'design-brief', label: 'Design Brief', fileName }
  if (/^brand\.md$/i.test(f)) return { kind: 'brand', label: 'Brand', fileName }
  if (/^claude-design-prompts\.md$/i.test(f)) return { kind: 'prompts', label: 'Design Prompts', fileName }

  // In a folder dedicated to one idea (e.g. "Holiday_Portfolio_ProveIt"),
  // include other numbered notes (Product Evolution, Pitch Deck, …) too.
  if (opts.dedicatedDir && (m = /^(\d+)[_-](.+?)(?:\.md)?$/i.exec(f)))
    return { kind: 'other', label: prettyAngle(m[2]), fileName }

  return null
}

function dirIsDedicated(dir: string): boolean {
  return /proveit/i.test(basename(dir))
}

async function listArtifacts(dir: string, discoveryFile: string): Promise<Artifact[]> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }
  const dedicatedDir = dirIsDedicated(dir)
  const out: Artifact[] = []
  for (const name of entries) {
    if (name === discoveryFile) continue
    const c = classifyArtifact(name, { dedicatedDir })
    // Exclude the discovery index itself and the cached synthesis.json
    // (the latter is read via getSynthesis, and sync + the supabase adapter
    // both drop it — so keep `artifacts`/artifactCount consistent with them).
    if (c && c.kind !== 'discovery' && c.kind !== 'synthesis-cache')
      out.push({ ...c, path: join(dir, name) })
  }
  out.sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.label.localeCompare(b.label))
  return out
}

// ── Public API ───────────────────────────────────────────────────────────────

interface Candidate {
  path: string
  dir: string
  fileName: string
  text: string
  likelihood: number
}

/**
 * Scan one or more roots for ProveIt ideas. Returns one summary per idea,
 * deduped so each directory yields at most one discovery index.
 */
export async function scanRoots(roots: string[]): Promise<IdeaSummary[]> {
  // Collect candidates, keeping the strongest per directory.
  const bestByDir = new Map<string, Candidate>()
  for (const root of roots) {
    for await (const path of walkMarkdown(root)) {
      let text: string
      try {
        text = await readFile(path, 'utf8')
      } catch {
        continue
      }
      if (!isDiscoveryCandidate(text)) continue
      const fileName = basename(path)
      const dir = path.slice(0, path.length - fileName.length - 1)
      const cand: Candidate = {
        path,
        dir,
        fileName,
        text,
        likelihood: discoveryLikelihood(text, fileName),
      }
      const prev = bestByDir.get(dir)
      if (!prev || cand.likelihood > prev.likelihood) bestByDir.set(dir, cand)
    }
  }

  const summaries: IdeaSummary[] = []
  for (const cand of bestByDir.values()) {
    const parsed = parseDiscovery(cand.text)
    if (!hasAnyScore(parsed.scores)) continue // require a real score to count
    const artifacts = await listArtifacts(cand.dir, cand.fileName)
    summaries.push({
      slug: slugify(parsed.name),
      name: parsed.name,
      oneLiner: parsed.oneLiner,
      scores: parsed.scores,
      status: parsed.status,
      generated: parsed.generated,
      lastUpdated: parsed.lastUpdated,
      killSignals: parsed.killSignals,
      hasDeck: parsed.hasDeck,
      deck: parsed.deck,
      dir: cand.dir,
      discoveryPath: cand.path,
      source: 'fs',
      artifactCount: artifacts.length,
    })
  }
  summaries.sort((a, b) => combined(b.scores) - combined(a.scores))
  return summaries
}

/** Load full detail for one idea given its discovery file path. */
export async function loadIdea(discoveryPath: string): Promise<Idea> {
  const text = await readFile(discoveryPath, 'utf8')
  const parsed = parseDiscovery(text)
  const fileName = basename(discoveryPath)
  const dir = discoveryPath.slice(0, discoveryPath.length - fileName.length - 1)
  const artifacts = await listArtifacts(dir, fileName)
  return {
    slug: slugify(parsed.name),
    name: parsed.name,
    oneLiner: parsed.oneLiner,
    scores: parsed.scores,
    status: parsed.status,
    generated: parsed.generated,
    lastUpdated: parsed.lastUpdated,
    killSignals: parsed.killSignals,
    hasDeck: parsed.hasDeck,
    deck: parsed.deck,
    dir,
    discoveryPath,
    source: 'fs',
    artifactCount: artifacts.length,
    brainDump: parsed.brainDump,
    recommendation: parsed.recommendation,
    artifacts,
  }
}

function hasAnyScore(s: Scores): boolean {
  return (
    s.desirability != null ||
    s.viability != null ||
    s.feasibility != null ||
    Object.keys(s.extra).length > 0
  )
}

export function combined(s: Scores): number {
  return (s.desirability ?? 0) + (s.viability ?? 0) + (s.feasibility ?? 0)
}
