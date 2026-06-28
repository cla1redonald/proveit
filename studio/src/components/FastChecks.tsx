import type { FastCheckIdea, FastCheckVerdict } from '@proveit/core'

// Verdict-based ideas from /proveit-fast — no 1-10 scores, so no spine. Shown
// as their own quieter section with per-dimension verdict chips.

const VERDICT_COLOR: Record<FastCheckVerdict, string> = {
  SUPPORTED: '#5a7247', // pine
  WEAK: '#d4a857', // amber
  CONTRADICTED: '#a04040', // red
  MIXED: '#6a8a8a', // sage
}

function shortDim(d: string): string {
  return d.replace(/\s*\(.*?\)\s*/g, ' ').trim()
}

export function FastChecks({ ideas }: { ideas: FastCheckIdea[] }) {
  if (ideas.length === 0) return null

  return (
    <section style={{ margin: '44px 0 90px' }}>
      <div style={{ borderTop: '1px solid rgba(224,217,207,0.12)', paddingTop: 30 }}>
        <div className="font-mono" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6a8a8a', marginBottom: 6 }}>
          Fast checks · {ideas.length}
        </div>
        <p style={{ fontSize: 14, color: '#6a8a8a', margin: '0 0 22px', maxWidth: 620, lineHeight: 1.55 }}>
          Quick <span className="font-mono" style={{ color: '#94a3a3' }}>/proveit-fast</span> assumption checks — verdict-based,
          not fully scored. The lighter tier of the portfolio.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {ideas.map((idea) => (
            <div
              key={idea.slug}
              style={{ padding: '18px 20px', background: '#111a24', border: '1px solid rgba(224,217,207,0.1)', borderRadius: 6 }}
            >
              <div className="font-display" style={{ fontSize: 18, fontWeight: 600, color: '#f0eee8', lineHeight: 1.2 }}>
                {idea.name}
              </div>
              <div className="font-mono" style={{ fontSize: 11.5, color: '#c4956a', marginTop: 6, fontStyle: 'italic' }}>
                {idea.verdict}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {idea.assessments.map((a, i) => (
                  <span
                    key={i}
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'rgba(224,217,207,0.05)',
                      border: `1px solid ${VERDICT_COLOR[a.verdict]}33`,
                      color: '#94a3a3',
                      whiteSpace: 'nowrap',
                    }}
                    title={a.detail}
                  >
                    {shortDim(a.dimension)} <span style={{ color: VERDICT_COLOR[a.verdict] }}>{a.verdict}</span>
                  </span>
                ))}
              </div>

              {idea.insight && (
                <div style={{ fontSize: 13, lineHeight: 1.55, color: '#7e8c8c', marginTop: 13 }}>{idea.insight}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
