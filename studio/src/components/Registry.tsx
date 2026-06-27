'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfidenceSpine, type Scores3, type SpineThreat, type SpineGhost } from './ConfidenceSpine'

export type CaseRowData = {
  slug: string
  title: string
  descriptor: string
  status: string
  statusColor: string
  scores: Scores3
  sigma: number
  live: SpineThreat[]
  resolved: SpineGhost[]
  liveCount: number
  resolvedCount: number
  docs: number
}

type SortKey = 'title' | 'sigma' | 'docs'

export function Registry({ cases }: { cases: CaseRowData[] }) {
  const router = useRouter()
  const [vw, setVw] = useState(1240)
  const [sortKey, setSortKey] = useState<SortKey>('sigma')
  const [sortDir, setSortDir] = useState<-1 | 1>(-1)

  useEffect(() => {
    const f = () => setVw(window.innerWidth)
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const pNarrow = vw < 720
  const pTight = vw < 480
  const rowGrid = pTight ? '1fr' : pNarrow ? 'minmax(0,1fr) 132px' : 'minmax(0,1fr) 210px 108px 120px 52px'
  const hide: React.CSSProperties = pNarrow ? { display: 'none' } : {}

  const sorted = [...cases].sort((a, b) => {
    if (sortKey === 'title') return a.title < b.title ? -sortDir : a.title > b.title ? sortDir : 0
    const av = sortKey === 'docs' ? a.docs : a.sigma
    const bv = sortKey === 'docs' ? b.docs : b.sigma
    return (av - bv) * sortDir
  })

  const setSort = (k: SortKey, def: -1 | 1) => () => {
    if (sortKey === k) setSortDir((d) => (-d as -1 | 1))
    else {
      setSortKey(k)
      setSortDir(def)
    }
  }
  const mark = (k: SortKey) => (sortKey === k ? (sortDir === -1 ? '↓' : '↑') : '')
  const open = (slug: string) => router.push(`/idea/${slug}`)

  return (
    <div>
      <div
        className="font-mono"
        style={{
          display: 'grid',
          gridTemplateColumns: rowGrid,
          gap: 18,
          alignItems: 'center',
          padding: '18px 16px 12px',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#5f7575',
        }}
      >
        <div onClick={setSort('title', 1)} style={{ cursor: 'pointer' }}>
          Case <span style={{ color: '#c4956a' }}>{mark('title')}</span>
        </div>
        <div style={hide}>Confidence spine</div>
        <div onClick={setSort('sigma', -1)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
          D V F <span style={{ color: '#9fb0b0' }}>Σ</span> <span style={{ color: '#c4956a' }}>{mark('sigma')}</span>
        </div>
        <div style={hide}>Threats</div>
        <div onClick={setSort('docs', -1)} style={{ cursor: 'pointer', textAlign: 'right', ...hide }}>
          Docs <span style={{ color: '#c4956a' }}>{mark('docs')}</span>
        </div>
      </div>

      {sorted.map((c) => {
        const liveColor = c.liveCount > 0 ? '#c4956a' : '#5a7247'
        return (
          <div
            key={c.slug}
            onClick={() => open(c.slug)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open(c.slug)
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#111a24'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: rowGrid,
              gap: 18,
              alignItems: 'center',
              padding: '26px 16px',
              borderTop: '1px solid rgba(224,217,207,0.09)',
              cursor: 'pointer',
              transition: 'background 140ms ease',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 23, fontWeight: 600, color: '#f0eee8', lineHeight: 1.16 }}>
                {c.title}
              </div>
              <div style={{ fontSize: 13.5, color: '#6a8a8a', marginTop: 7 }}>{c.descriptor}</div>
              <div
                className="font-mono"
                style={{ fontSize: 11, color: c.statusColor, display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 11 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.statusColor, flex: '0 0 auto' }} />
                {c.status}
              </div>
            </div>

            <div style={hide}>
              <ConfidenceSpine scores={c.scores} live={c.live} resolved={c.resolved} size="sm" />
            </div>

            <div className="font-mono">
              <div style={{ fontSize: 12, color: '#9fb0b0' }}>
                D{c.scores.D} <span style={{ color: '#3f5252' }}>·</span> V{c.scores.V} <span style={{ color: '#3f5252' }}>·</span> F
                {c.scores.F}
              </div>
              <div style={{ fontSize: 21, color: '#c4956a', fontWeight: 600, marginTop: 3 }}>Σ {c.sigma}</div>
            </div>

            <div className="font-mono" style={{ fontSize: 12, lineHeight: 1.7, ...hide }}>
              <div style={{ color: liveColor, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: `7px solid ${liveColor}`,
                    opacity: c.liveCount > 0 ? 1 : 0,
                  }}
                />
                {c.liveCount > 0 ? `${c.liveCount} live` : 'no live threats'}
              </div>
              <div style={{ color: '#6a8a8a' }}>{c.resolvedCount} resolved</div>
            </div>

            <div className="font-mono" style={{ fontSize: 13, color: '#9fb0b0', textAlign: 'right', ...hide }}>
              {c.docs}
              <span style={{ color: '#3f5252', fontSize: 11 }}> docs</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
