import { notFound } from 'next/navigation'
import { combined } from '@proveit/core'
import { source } from '@/lib/source'
import { Masthead } from '@/components/Masthead'
import { Reader, type ReaderMeta } from '@/components/Reader'
import { buildRounds } from '@/lib/rounds'
import { spineInputs, scores3, descriptor, statusColor } from '@/lib/spine'

export const dynamic = 'force-dynamic'

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const idea = await source.getIdea(slug)
  if (!idea) notFound()

  const { rounds, firstStageId, stageFiles } = buildRounds(idea)

  // Load every stage's markdown up front (it's a local read; the vault is small).
  const entries = await Promise.all(
    stageFiles.map(async (f) => {
      try {
        return [f, await source.readArtifact(slug, f)] as const
      } catch {
        return [f, '_Could not read this file._'] as const
      }
    }),
  )
  const contents = Object.fromEntries(entries)

  const { live, resolved } = spineInputs(idea)
  const meta: ReaderMeta = {
    slug: idea.slug,
    name: idea.name,
    status: idea.status ?? 'No status recorded',
    descriptor: descriptor(idea),
    statusColor: statusColor(idea.status),
    scores: scores3(idea.scores),
    sigma: combined(idea.scores),
    live,
    resolved,
  }

  return (
    <>
      <Masthead crumb={{ caseTitle: idea.name, caseSlug: idea.slug, view: 'reader' }} />
      <Reader meta={meta} rounds={rounds} firstStageId={firstStageId} contents={contents} />
    </>
  )
}
