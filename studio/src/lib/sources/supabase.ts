import 'server-only'
import { createClient } from '@supabase/supabase-js'
import {
  combined,
  type Artifact,
  type ArtifactKind,
  type DataSource,
  type FastCheckIdea,
  type Idea,
  type IdeaSummary,
  type KillSignal,
  type Scores,
} from '@proveit/core'

// The hosted read path. Reads the studio_* mirror (populated by `proveit sync`)
// with the service role, server-side only. RLS denies everything else.

export function createSupabaseSource(url: string, serviceKey: string): DataSource {
  const db = createClient(url, serviceKey, { auth: { persistSession: false } })

  const toSummary = (row: Record<string, any>, discoveryFile = ''): IdeaSummary => ({
    slug: row.slug,
    name: row.name,
    oneLiner: row.one_liner ?? undefined,
    scores: (row.scores ?? { extra: {} }) as Scores,
    status: row.status ?? undefined,
    generated: row.generated ?? undefined,
    lastUpdated: row.last_updated ?? undefined,
    killSignals: (row.kill_signals ?? []) as KillSignal[],
    hasDeck: !!row.has_deck,
    deck: row.deck ?? undefined,
    dir: '',
    discoveryPath: discoveryFile,
    source: 'supabase',
    artifactCount: row.artifact_count ?? 0,
  })

  return {
    async listIdeas() {
      const { data, error } = await db.from('studio_ideas').select('*')
      if (error) throw error
      return (data ?? []).map((r) => toSummary(r)).sort((a, b) => combined(b.scores) - combined(a.scores))
    },

    async getIdea(slug) {
      const { data: row } = await db.from('studio_ideas').select('*').eq('slug', slug).maybeSingle()
      if (!row) return null
      const { data: arts } = await db.from('studio_artifacts').select('*').eq('idea_slug', slug)
      const all = arts ?? []
      const discovery = all.find((a) => a.kind === 'discovery')
      const artifacts: Artifact[] = all
        .filter((a) => a.kind !== 'discovery')
        .map((a) => ({
          kind: a.kind as ArtifactKind,
          label: a.label ?? a.file_name,
          round: a.round ?? undefined,
          angle: a.angle ?? undefined,
          fileName: a.file_name,
          path: a.file_name,
        }))
        .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.label.localeCompare(b.label))
      const idea: Idea = { ...toSummary(row, discovery?.file_name ?? ''), artifacts, artifactCount: artifacts.length }
      return idea
    },

    async readArtifact(slug, fileName) {
      const { data } = await db
        .from('studio_artifacts')
        .select('content')
        .eq('idea_slug', slug)
        .eq('file_name', fileName)
        .maybeSingle()
      if (!data) throw new Error(`No artifact ${fileName} for ${slug}`)
      return data.content ?? ''
    },

    async getSynthesis(slug) {
      const { data } = await db.from('studio_synthesis').select('*').eq('idea_slug', slug).maybeSingle()
      if (!data) return null
      return {
        slug,
        generatedAt: data.generated_at ?? undefined,
        summary: data.summary ?? '',
        bull: data.bull ?? '',
        bear: data.bear ?? '',
        devil: data.devil ?? '',
        body: data.body ?? undefined,
      }
    },

    async getPortfolioSynthesis() {
      const { data } = await db.from('studio_portfolio_synthesis').select('*').eq('id', 1).maybeSingle()
      if (!data) return null
      return { generatedAt: data.generated_at ?? undefined, body: data.body ?? '' }
    },

    async listFastChecks(): Promise<FastCheckIdea[]> {
      const { data } = await db.from('studio_fast_checks').select('*')
      return (data ?? []).map((r) => ({
        slug: r.slug,
        name: r.name,
        verdict: r.verdict ?? '',
        assessments: r.assessments ?? [],
        insight: r.insight ?? undefined,
        source: r.source ?? '',
        date: r.date ?? undefined,
      }))
    },
  }
}
