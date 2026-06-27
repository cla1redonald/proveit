import { notFound } from 'next/navigation'
import { combined } from '@proveit/core'
import { source } from '@/lib/source'
import { Masthead } from '@/components/Masthead'
import { ConfidenceSpine } from '@/components/ConfidenceSpine'
import { spineInputs, scores3, threatDetails } from '@/lib/spine'

export const dynamic = 'force-dynamic'

export default async function VerdictPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const idea = await source.getIdea(slug)
  if (!idea) notFound()

  const synthesis = await source.getSynthesis(slug)
  const { live, resolved } = spineInputs(idea)
  const { live: liveCards, resolved: resolvedCards } = threatDetails(idea)
  const s = scores3(idea.scores)
  const sigma = combined(idea.scores)
  const summary =
    synthesis?.summary ??
    idea.recommendation ??
    'Synthesise the case to generate a written verdict from every round, threat and review.'

  return (
    <>
      <Masthead crumb={{ caseTitle: idea.name, caseSlug: idea.slug, view: 'verdict' }} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ padding: '52px 0 0' }}>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6a8a8a', marginBottom: 18 }}>
            The verdict
          </div>
          <h1 className="font-display" style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.04 }}>
            The case for <span style={{ fontStyle: 'italic' }}>{idea.name}</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#cfc9bf', margin: '22px 0 0', maxWidth: 720 }}>{summary}</p>
        </div>

        {/* the spine, large */}
        <div style={{ margin: '42px 0 14px', padding: '32px 36px 26px', background: '#111a24', border: '1px solid rgba(224,217,207,0.12)', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
            <span className="font-mono" style={{ fontSize: 11.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6a8a8a' }}>
              Confidence spine
            </span>
            <div className="font-mono" style={{ fontSize: 14, color: '#9fb0b0' }}>
              D{s.D} <span style={{ color: '#3f5252' }}>·</span> V{s.V} <span style={{ color: '#3f5252' }}>·</span> F{s.F}{' '}
              <span style={{ color: '#3f5252' }}>·</span> <span style={{ color: '#c4956a', fontSize: 22, fontWeight: 600 }}>Σ {sigma}</span>
            </div>
          </div>
          <ConfidenceSpine scores={s} live={live} resolved={resolved} size="lg" />
        </div>

        {/* threats: live vs resolved */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginTop: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #c4956a' }} />
              <span className="font-mono" style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e3ded4' }}>
                Live kill signals
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: '#c4956a' }}>{liveCards.length}</span>
            </div>
            {liveCards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {liveCards.map((t, i) => (
                  <div key={i} style={{ padding: '15px 17px', background: '#111a24', border: `1px solid ${t.border}`, borderLeft: `3px solid ${t.accent}`, borderRadius: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontSize: 15, color: '#f0eee8', fontWeight: 500 }}>{t.label}</span>
                      <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.accent, whiteSpace: 'nowrap' }}>
                        {t.tag}
                      </span>
                    </div>
                    {t.detail && <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#94a3a3', marginTop: 7 }}>{t.detail}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 22, background: '#111a24', border: '1px dashed rgba(90,114,71,0.4)', borderRadius: 5, fontSize: 14.5, lineHeight: 1.55, color: '#8aa07a' }}>
                No live kill signals stand against this case today. Nothing currently pulls against the score.
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ width: 11, height: 0, borderTop: '1.5px solid #6a8a8a' }} />
              <span className="font-mono" style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9fb0b0' }}>
                Resolved
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: '#5a7247' }}>{resolvedCards.length}</span>
            </div>
            {resolvedCards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resolvedCards.map((t, i) => (
                  <div key={i} style={{ padding: '15px 17px', background: 'rgba(17,26,36,0.6)', border: '1px solid rgba(224,217,207,0.08)', borderRadius: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontSize: 15, color: '#9fb0b0', fontWeight: 500, textDecoration: 'line-through', textDecorationColor: 'rgba(159,176,176,0.5)' }}>
                        {t.label}
                      </span>
                      <span className="font-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5a7247', whiteSpace: 'nowrap' }}>
                        {t.dimName}
                      </span>
                    </div>
                    {t.detail && <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#7e8c8c', marginTop: 7 }}>{t.detail}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 22, background: 'rgba(17,26,36,0.6)', border: '1px dashed rgba(224,217,207,0.1)', borderRadius: 5, fontSize: 14.5, lineHeight: 1.55, color: '#6a8a8a' }}>
                No threats have been resolved yet. The case is still early.
              </div>
            )}
          </div>
        </div>

        {/* the swarm (LLM synthesis — P2) */}
        <div style={{ marginTop: 54 }}>
          <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6a8a8a', marginBottom: 6 }}>
            The swarm
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#94a3a3', margin: '0 0 22px', maxWidth: 640 }}>
            Three adversaries pressure-tested the case. Their tension is the point — conviction that survives the bear is worth more
            than conviction that never met it.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7e9468' }}>Bull</span>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #5a7247, #2a5a5a 50%, #a04040)' }} />
            <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b06a6a' }}>Bear</span>
          </div>
          {synthesis ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { who: 'Bull', text: synthesis.bull, accent: '#5a7247', ink: '#7e9468' },
                { who: 'Bear', text: synthesis.bear, accent: '#a04040', ink: '#b06a6a' },
                { who: "Devil's advocate", text: synthesis.devil, accent: '#c4956a', ink: '#c4956a' },
              ].map((card) => (
                <div
                  key={card.who}
                  style={{ padding: '18px 20px', background: '#111a24', border: `1px solid ${card.accent}4d`, borderRadius: 6, borderTop: `2px solid ${card.accent}` }}
                >
                  <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.ink, marginBottom: 10 }}>
                    {card.who}
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, color: '#dcd7cd' }}>{card.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '18px 20px', background: '#111a24', border: '1px solid rgba(224,217,207,0.1)', borderRadius: 6, fontSize: 14, color: '#94a3a3', lineHeight: 1.6 }}>
              The bull / bear / devil&rsquo;s-advocate reading is written by the synthesiser. Run it to generate the swarm view from
              this case&rsquo;s rounds.
            </div>
          )}
        </div>

        {/* synthesise action (P2) */}
        <div
          style={{
            margin: '46px 0 90px',
            padding: '26px 28px',
            background: 'linear-gradient(180deg, #131e28, #111a24)',
            border: '1px solid rgba(224,217,207,0.12)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 260 }}>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 600, color: '#f0eee8' }}>Synthesise the case</div>
            <div style={{ fontSize: 14, color: '#94a3a3', marginTop: 5, maxWidth: 420, lineHeight: 1.5 }}>
              Pull every round, threat and review into a single written verdict you can act on.
            </div>
            <div className="font-mono" style={{ fontSize: 12, color: '#c4956a', marginTop: 12 }}>
              {synthesis
                ? `✓ Synthesised ${synthesis.generatedAt?.slice(0, 10) ?? ''} · re-run to refresh`
                : `→ Run on your Max plan:  node scripts/synthesise.ts ${slug}`}
            </div>
          </div>
          <div
            className="font-mono"
            aria-disabled
            style={{
              fontSize: 13,
              letterSpacing: '0.04em',
              color: '#c4956a',
              border: '1px solid #c4956a',
              borderRadius: 5,
              padding: '12px 22px',
              opacity: 0.55,
              whiteSpace: 'nowrap',
            }}
          >
            Synthesise with AI
          </div>
        </div>
      </div>
    </>
  )
}
