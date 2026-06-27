import type { Idea } from '@proveit/core'

// "How the case was built" — group an idea's artifacts into validation rounds
// for the reader's left-rail timeline.

export type Stage = { id: string; label: string; kind: string }
export type Round = { n: number; label: string; stages: Stage[] }

const KIND_ORDER: Record<string, number> = {
  discovery: 0,
  research: 1,
  'swarm-angle': 2,
  'swarm-synthesis': 3,
  review: 4,
  'pre-mortem': 5,
  scenarios: 6,
  spec: 7,
  'design-brief': 8,
  brand: 9,
  prompts: 10,
  other: 11,
}

export function buildRounds(idea: Idea): { rounds: Round[]; firstStageId: string; stageFiles: string[] } {
  const discoveryFile = idea.discoveryPath.split('/').pop() ?? 'discovery.md'
  const tagged: (Stage & { round: number })[] = [
    { id: discoveryFile, label: 'Discovery', kind: 'discovery', round: 1 },
  ]
  for (const a of idea.artifacts) {
    if (a.kind === 'index' || a.kind === 'synthesis-cache') continue
    tagged.push({ id: a.fileName, label: a.label, kind: a.kind, round: a.round ?? 1 })
  }

  const byRound = new Map<number, Stage[]>()
  for (const s of tagged) {
    if (!byRound.has(s.round)) byRound.set(s.round, [])
    byRound.get(s.round)!.push({ id: s.id, label: s.label, kind: s.kind })
  }

  const rounds: Round[] = [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, stages]) => ({
      n,
      label: `Round ${n}`,
      stages: stages.sort((a, b) => (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99)),
    }))

  const stageFiles = rounds.flatMap((r) => r.stages.map((s) => s.id))
  return { rounds, firstStageId: discoveryFile, stageFiles }
}
