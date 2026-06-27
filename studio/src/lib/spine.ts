import type { IdeaSummary, KillSignal } from '@proveit/core'
import type { Dim, Sev, Scores3, SpineThreat, SpineGhost } from '@/components/ConfidenceSpine'

export function scores3(s: IdeaSummary['scores']): Scores3 {
  return { D: s.desirability ?? 0, V: s.viability ?? 0, F: s.feasibility ?? 0 }
}

const sevFromStatus = (st: KillSignal['status']): Sev =>
  st === 'serious' ? 'high' : st === 'monitored' || st === 'flag' ? 'low' : 'mid'

// Heuristic: which confidence dimension does this threat pull against? Inferred
// from the signal's words until the LLM synthesiser (P2) can assign it precisely.
function dimFor(k: KillSignal): Dim {
  const t = `${k.label} ${k.detail ?? ''}`.toLowerCase()
  if (/(compet|market|pricing|price|incumbent|willing|revenue|monet|tam|moat|defensib|leak|booking)/.test(t)) return 'V'
  if (/(technical|build|cost|latency|nlp|model|infra|integration|feasib|scal|capex|venue)/.test(t)) return 'F'
  return 'D'
}

function shortNote(detail?: string): string | undefined {
  if (!detail) return undefined
  const firstWords = detail.replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' ')
  return firstWords.length > 2 ? firstWords.replace(/[.,;:]$/, '') : undefined
}

/** Map an idea's kill signals onto the spine's live/resolved inputs. */
export function spineInputs(idea: IdeaSummary): { live: SpineThreat[]; resolved: SpineGhost[] } {
  const dims: Dim[] = ['D', 'V', 'F']
  const live: SpineThreat[] = []
  const resolved: SpineGhost[] = []
  const liveByDim: Record<Dim, KillSignal[]> = { D: [], V: [], F: [] }
  const resByDim: Record<Dim, KillSignal[]> = { D: [], V: [], F: [] }

  for (const k of idea.killSignals) {
    const dim = dimFor(k)
    ;(k.status === 'resolved' ? resByDim : liveByDim)[dim].push(k)
  }

  for (const dim of dims) {
    liveByDim[dim].forEach((k, i, arr) =>
      live.push({
        id: `${dim}-l-${i}`,
        dim,
        frac: (i + 1) / (arr.length + 1),
        sev: sevFromStatus(k.status),
        label: k.label,
        note: shortNote(k.detail),
      }),
    )
    resByDim[dim].forEach((k, i, arr) =>
      resolved.push({ id: `${dim}-r-${i}`, dim, frac: (i + 1) / (arr.length + 1), label: k.label }),
    )
  }
  return { live, resolved }
}

const DIM_NAME: Record<Dim, string> = { D: 'Desirability', V: 'Viability', F: 'Feasibility' }
const sevAccent = (sev: Sev) => (sev === 'high' ? '#a04040' : sev === 'mid' ? '#c4956a' : '#6a8a8a')
const sevBorder = (sev: Sev) =>
  sev === 'high' ? 'rgba(160,64,64,0.4)' : sev === 'mid' ? 'rgba(196,149,106,0.32)' : 'rgba(224,217,207,0.12)'
const sevTag = (sev: Sev) => (sev === 'high' ? 'serious' : sev === 'low' ? 'monitored' : 'watch')

export type ThreatCard = { label: string; detail: string; accent: string; border: string; tag: string }
export type ResolvedCard = { label: string; detail: string; dimName: string }

/** Threat cards for the verdict view, from the idea's kill signals. */
export function threatDetails(idea: IdeaSummary): { live: ThreatCard[]; resolved: ResolvedCard[] } {
  const live: ThreatCard[] = []
  const resolved: ResolvedCard[] = []
  for (const k of idea.killSignals) {
    const dim = dimFor(k)
    if (k.status === 'resolved') {
      resolved.push({ label: k.label, detail: k.detail ?? '', dimName: DIM_NAME[dim] })
    } else {
      const sev = sevFromStatus(k.status)
      live.push({
        label: k.label,
        detail: k.detail ?? '',
        accent: sevAccent(sev),
        border: sevBorder(sev),
        tag: `${DIM_NAME[dim]} · ${sevTag(sev)}`,
      })
    }
  }
  return { live, resolved }
}

/** Short descriptor for the registry row. */
export function descriptor(idea: IdeaSummary): string {
  const s = idea.oneLiner ?? idea.status ?? ''
  return s.length > 72 ? `${s.slice(0, 71).trimEnd()}…` : s
}

/** Status dot colour, matching the design's active/plan/neutral kinds. */
export function statusColor(status?: string): string {
  if (!status) return '#6a8a8a'
  if (/\bplan\b/i.test(status)) return '#5a7247' // pine
  if (/\b(complete|round|research|validated|confirmed)\b/i.test(status)) return '#d4a857' // amber
  return '#6a8a8a'
}
