// Prompt builders for the P2 synthesiser. The runner (scripts/synthesise.ts)
// feeds these to `claude -p` on the Max plan; the model does the judgment, the
// code does the plumbing. Kept here so the Studio and the runner agree on shape.

import type { Idea } from './types.ts'

const CAP = 3500 // chars per artifact in the prompt — keep the call bounded

function truncate(s: string, n = CAP): string {
  return s.length > n ? `${s.slice(0, n)}\n…[truncated]` : s
}

export function perIdeaSynthesisPrompt(idea: Idea, artifacts: { label: string; content: string }[]): string {
  const scoreLine = `Desirability ${idea.scores.desirability ?? '-'}/10, Viability ${idea.scores.viability ?? '-'}/10, Feasibility ${idea.scores.feasibility ?? '-'}/10`
  const kills = idea.killSignals.length
    ? idea.killSignals.map((k) => `- [${k.status}] ${k.label}${k.detail ? `: ${k.detail}` : ''}`).join('\n')
    : '(none recorded)'
  const body = artifacts.map((a) => `\n## ${a.label}\n${truncate(a.content)}`).join('\n')

  return [
    `You are ProveIt's synthesiser — a truth-finder, not a cheerleader. Read this product-validation case and produce an honest verdict.`,
    ``,
    `IDEA: ${idea.name}`,
    `SCORES: ${scoreLine}`,
    `STATUS: ${idea.status ?? 'unknown'}`,
    `KILL SIGNALS:\n${kills}`,
    ``,
    `CASE FILE (discovery + research + swarm + review):`,
    body,
    ``,
    `Return ONLY a JSON object — no prose, no code fences — with exactly these string fields:`,
    `{`,
    `  "summary": "one honest paragraph (<=60 words) on where the case stands; earned conviction, not hype",`,
    `  "bull": "the single strongest case FOR (<=40 words)",`,
    `  "bear": "the single strongest case AGAINST (<=40 words)",`,
    `  "devil": "the kill question the founder is avoiding (<=40 words)",`,
    `  "body": "3-5 sentence narrative tying the rounds together"`,
    `}`,
    `Be specific to THIS case and cite real evidence from the case file. No generic startup advice.`,
  ].join('\n')
}

export type PortfolioIdeaInput = {
  name: string
  scores: { d?: number; v?: number; f?: number }
  status?: string
  killSignals: { label: string; status: string }[]
}

export function portfolioSynthesisPrompt(ideas: PortfolioIdeaInput[]): string {
  const rows = ideas
    .map((i) => {
      const live = i.killSignals.filter((s) => s.status !== 'resolved').map((s) => s.label).join('; ') || 'none'
      return `- ${i.name} — D${i.scores.d ?? '-'}/V${i.scores.v ?? '-'}/F${i.scores.f ?? '-'}; status: ${i.status ?? '?'}; live kill signals: ${live}`
    })
    .join('\n')

  return [
    `You are ProveIt's portfolio synthesiser. Here is a PM's whole validated-idea portfolio:`,
    rows,
    ``,
    `Write a short, honest markdown briefing (<=250 words) on ONLY what the portfolio as a whole reveals — things no single idea shows:`,
    `- recurring kill-signal patterns across ideas`,
    `- score patterns (where this PM's ideas are consistently strong or weak)`,
    `- the strongest unbuilt idea, and why`,
    `- any blind spot the pattern suggests`,
    `Return markdown only — no preamble. Be specific and use the idea names.`,
  ].join('\n')
}

/** Extract the first JSON object from model output (tolerant of code fences / prose). */
export function extractJson<T = Record<string, unknown>>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object found in model output')
  return JSON.parse(candidate.slice(start, end + 1)) as T
}
