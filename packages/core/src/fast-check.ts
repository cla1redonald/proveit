// Parse `/proveit-fast` notes — one markdown file holding many ideas, each a
// verdict-based check (no 1-10 scores). Detected by content, not filename.

import { readFile } from 'node:fs/promises'
import type { FastCheckAssessment, FastCheckIdea, FastCheckVerdict } from './types.ts'
import { slugify, walkMarkdown } from './scan.ts'

/**
 * A note is a fast-check note only if it's a `/proveit-fast` output AND carries
 * multiple verdict markers. The command marker is the specific signal — plenty
 * of other strategy notes use "**Verdict:" in passing.
 */
function isFastCheckNote(text: string): boolean {
  return /\/proveit-fast\b/i.test(text) && (text.match(/\*\*Verdict:/gi)?.length ?? 0) >= 2
}

export function parseFastCheckNote(text: string, path: string): FastCheckIdea[] {
  const date =
    /^created:\s*['"]?(\d{4}-\d{2}-\d{2})/im.exec(text)?.[1] ??
    /\/proveit-fast on (\d{4}-\d{2}-\d{2})/i.exec(text)?.[1]

  const ideas: FastCheckIdea[] = []
  // Split on `## ` headings; first chunk is the note preamble.
  for (const part of text.split(/^##\s+/m).slice(1)) {
    const nl = part.indexOf('\n')
    const name = (nl === -1 ? part : part.slice(0, nl)).trim()
    const body = nl === -1 ? '' : part.slice(nl + 1)

    const verdictM = /\*\*Verdict:\s*(.+?)\*\*/i.exec(body)
    if (!verdictM) continue // not an idea section

    const assessments: FastCheckAssessment[] = []
    let insight: string | undefined
    for (const line of body.split('\n')) {
      const m = /^\s*[-*]\s+(.+)$/.exec(line)
      if (!m) continue
      const raw = m[1].trim()
      const keyM = /^Key insight:\s*(.+)$/i.exec(raw)
      if (keyM) {
        insight = keyM[1].trim()
        continue
      }
      const aM = /^(.+?):\s*(SUPPORTED|WEAK|CONTRADICTED|MIXED)\b\s*[—–-]?\s*(.*)$/.exec(raw)
      if (aM) {
        assessments.push({
          dimension: aM[1].trim(),
          verdict: aM[2].toUpperCase() as FastCheckVerdict,
          detail: aM[3].trim(),
        })
      }
    }
    // A real fast-check idea has per-dimension verdicts; skip stray sections
    // that merely contain a verdict marker.
    if (assessments.length < 2) continue
    ideas.push({ slug: slugify(name), name, verdict: verdictM[1].trim(), assessments, insight, source: path, date })
  }
  return ideas
}

export async function scanFastChecks(roots: string[]): Promise<FastCheckIdea[]> {
  const out: FastCheckIdea[] = []
  for (const root of roots) {
    for await (const path of walkMarkdown(root)) {
      let text: string
      try {
        text = await readFile(path, 'utf8')
      } catch {
        continue
      }
      if (isFastCheckNote(text)) out.push(...parseFastCheckNote(text, path))
    }
  }
  return out
}
