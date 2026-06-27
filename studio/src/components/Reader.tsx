'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ConfidenceSpine, type Scores3, type SpineThreat, type SpineGhost } from './ConfidenceSpine'
import { Markdown } from './Markdown'
import type { Round } from '@/lib/rounds'

export type ReaderMeta = {
  slug: string
  name: string
  status: string
  descriptor: string
  statusColor: string
  scores: Scores3
  sigma: number
  live: SpineThreat[]
  resolved: SpineGhost[]
}

export function Reader({
  meta,
  rounds,
  firstStageId,
  contents,
}: {
  meta: ReaderMeta
  rounds: Round[]
  firstStageId: string
  contents: Record<string, string>
}) {
  const [vw, setVw] = useState(1240)
  const [stageId, setStageId] = useState(firstStageId)
  const [openRounds, setOpenRounds] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(rounds.map((r) => [r.n, true])),
  )

  useEffect(() => {
    const f = () => setVw(window.innerWidth)
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const rNarrow = vw < 860
  const flat = useMemo(() => {
    const out: { id: string; label: string; roundN: number }[] = []
    rounds.forEach((r) => r.stages.forEach((s) => out.push({ id: s.id, label: s.label, roundN: r.n })))
    return out
  }, [rounds])

  const idx = Math.max(0, flat.findIndex((s) => s.id === stageId))
  const cur = flat[idx] ?? flat[0]
  const prev = flat[idx - 1]
  const next = flat[idx + 1]
  const md = contents[stageId] ?? (cur ? contents[cur.id] : undefined) ?? '_No content._'

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
      {/* pinned verdict header */}
      <div style={{ padding: '40px 0 26px', borderBottom: '1px solid rgba(224,217,207,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 280 }}>
            <div
              className="font-mono"
              style={{
                fontSize: 11.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: meta.statusColor,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.statusColor }} />
              {meta.status}
            </div>
            <h1 className="font-display" style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, lineHeight: 1.05 }}>
              {meta.name}
            </h1>
            <div style={{ fontSize: 15, color: '#9fb0b0', marginTop: 10 }}>{meta.descriptor}</div>
          </div>
          <div style={{ flex: 1, minWidth: 320, maxWidth: 520 }}>
            <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6a8a8a' }}>Confidence</span>
              <span style={{ fontSize: 13, color: '#9fb0b0' }}>
                Σ <span style={{ color: '#c4956a', fontSize: 18, fontWeight: 600 }}>{meta.sigma}</span>
              </span>
            </div>
            <ConfidenceSpine scores={meta.scores} live={meta.live} resolved={meta.resolved} size="md" />
            <Link
              href={`/idea/${meta.slug}/verdict`}
              className="font-mono"
              style={{ marginTop: 10, fontSize: 12.5, color: '#c4956a', display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
            >
              Read the verdict <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* rail + content */}
      <div style={{ display: 'grid', gridTemplateColumns: rNarrow ? '1fr' : '236px minmax(0,1fr)', gap: 48, alignItems: 'start' }}>
        <div style={{ position: rNarrow ? 'static' : 'sticky', top: 80, padding: '34px 0 60px' }}>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5f7575', marginBottom: 18 }}>
            How the case was built
          </div>
          {rounds.map((r) => {
            const open = openRounds[r.n] !== false
            return (
              <div key={r.n} style={{ marginBottom: 6 }}>
                <div
                  onClick={() => setOpenRounds((s) => ({ ...s, [r.n]: !(s[r.n] !== false) }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '7px 0' }}
                >
                  <span className="font-mono" style={{ fontSize: 11, color: '#c4956a', width: 18 }}>
                    R{r.n}
                  </span>
                  <span style={{ fontSize: 13.5, color: '#cfe0e0', fontWeight: 500, flex: 1 }}>{r.label}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: '#3f5252' }}>{open ? '−' : '+'}</span>
                </div>
                {open && (
                  <div style={{ margin: '2px 0 10px', paddingLeft: 9, borderLeft: '1px solid rgba(224,217,207,0.1)' }}>
                    {r.stages.map((s) => {
                      const active = s.id === stageId
                      const num = String(flat.findIndex((f) => f.id === s.id) + 1).padStart(2, '0')
                      return (
                        <div
                          key={s.id}
                          onClick={() => setStageId(s.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 11,
                            padding: '8px 12px',
                            margin: '1px 0',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: active ? 'rgba(196,149,106,0.10)' : 'transparent',
                            borderLeft: `2px solid ${active ? '#c4956a' : 'transparent'}`,
                          }}
                        >
                          <span className="font-mono" style={{ fontSize: 10.5, color: active ? '#c4956a' : '#5f7575' }}>
                            {num}
                          </span>
                          <span style={{ fontSize: 13.5, color: active ? '#f0eee8' : '#9fb0b0', flex: 1 }}>{s.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '38px 0 90px', maxWidth: 680, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span className="font-mono" style={{ fontSize: 11.5, color: '#c4956a', letterSpacing: '0.08em' }}>
              Round {cur?.roundN} · {cur?.label}
            </span>
            <span style={{ height: 1, flex: 1, background: 'rgba(224,217,207,0.12)' }} />
          </div>
          <Markdown>{md}</Markdown>
          <div
            style={{
              marginTop: 46,
              paddingTop: 22,
              borderTop: '1px solid rgba(224,217,207,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              onClick={() => prev && setStageId(prev.id)}
              className="font-mono"
              style={{ fontSize: 12.5, color: prev ? '#6a8a8a' : '#3f5252', cursor: prev ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>←</span> {prev ? prev.label : 'Start of file'}
            </div>
            <div
              onClick={() => next && setStageId(next.id)}
              className="font-mono"
              style={{ fontSize: 12.5, color: next ? '#6a8a8a' : '#3f5252', cursor: next ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {next ? next.label : 'End of file'} <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
