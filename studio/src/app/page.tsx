import { combined } from '@proveit/core'
import { source } from '@/lib/source'
import { Masthead } from '@/components/Masthead'
import { Registry, type CaseRowData } from '@/components/Registry'
import { Markdown } from '@/components/Markdown'
import { spineInputs, scores3, descriptor, statusColor } from '@/lib/spine'

// Always read fresh from disk — the vault is the source of truth.
export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  const ideas = await source.listIdeas()
  const portfolioSynthesis = await source.getPortfolioSynthesis()
  const cases: CaseRowData[] = ideas.map((idea) => {
    const { live, resolved } = spineInputs(idea)
    return {
      slug: idea.slug,
      title: idea.name,
      descriptor: descriptor(idea),
      status: idea.status ?? 'No status recorded',
      statusColor: statusColor(idea.status),
      scores: scores3(idea.scores),
      sigma: combined(idea.scores),
      live,
      resolved,
      liveCount: live.length,
      resolvedCount: resolved.length,
      docs: idea.artifactCount,
    }
  })

  return (
    <>
      <Masthead />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '54px 0 30px', borderBottom: '1px solid rgba(224,217,207,0.12)' }}>
          <div
            className="font-mono"
            style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6a8a8a', marginBottom: 14 }}
          >
            Case registry
          </div>
          <h1
            className="font-display"
            style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, lineHeight: 1.04, maxWidth: 680 }}
          >
            Cases under construction
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#9fb0b0', margin: '16px 0 0', maxWidth: 560 }}>
            Each idea is a case being built — evidence gathered over rounds, scored on desirability, viability and feasibility,
            with the kill signals that could overturn it kept in plain sight.
          </p>
        </div>

        {cases.length === 0 ? (
          <div style={{ padding: '90px 16px' }}>
            <p className="font-display" style={{ fontSize: 22, color: '#9fb0b0', margin: 0 }}>
              No cases yet.
            </p>
            <p style={{ fontSize: 14, color: '#6a8a8a', marginTop: 8 }}>
              Run <span className="font-mono" style={{ color: '#c4956a' }}>/proveit</span> on an idea and it&rsquo;ll show up here.
            </p>
          </div>
        ) : (
          <Registry cases={cases} />
        )}

        {portfolioSynthesis && (
          <section
            style={{
              margin: '28px 0 80px',
              padding: '30px 34px 34px',
              background: '#111a24',
              border: '1px solid rgba(224,217,207,0.12)',
              borderRadius: 8,
            }}
          >
            <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c4956a', marginBottom: 6 }}>
              Across the portfolio
            </div>
            <p style={{ fontSize: 14, color: '#6a8a8a', margin: '0 0 20px', maxWidth: 620, lineHeight: 1.55 }}>
              What your whole pipeline reveals — patterns no single case shows.
              {portfolioSynthesis.generatedAt ? ` Synthesised ${portfolioSynthesis.generatedAt.slice(0, 10)}.` : ''}
            </p>
            <Markdown>{portfolioSynthesis.body}</Markdown>
          </section>
        )}
      </div>
    </>
  )
}
