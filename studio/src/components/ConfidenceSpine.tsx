'use client'

import { useState } from 'react'

// Ported from Claire's Claude Design "Confidence Spine" component. Three bays
// (D/V/F) with teal-gradient fills, ruler ticks, live kill-signals as pin-flags
// rising from the bar (severity-scaled), and resolved threats as struck ghosts.

export type Dim = 'D' | 'V' | 'F'
export type Sev = 'high' | 'mid' | 'low'
export type Scores3 = { D: number; V: number; F: number }
export type SpineThreat = { id: string; dim: Dim; frac: number; sev: Sev; label: string; note?: string }
export type SpineGhost = { id: string; dim: Dim; frac: number; label: string }

const DIM_NAME: Record<Dim, string> = { D: 'Desirability', V: 'Viability', F: 'Feasibility' }

const BASE = {
  sm: { barH: 8, stem: { high: 15, mid: 11, low: 8 }, head: 5, tickMaj: 6, tickMin: 3, labelFs: 9.5, ghostW: 8 },
  md: { barH: 11, stem: { high: 24, mid: 18, low: 12 }, head: 7, tickMaj: 8, tickMin: 4, labelFs: 11, ghostW: 9 },
  lg: { barH: 18, stem: { high: 40, mid: 30, low: 20 }, head: 11, tickMaj: 14, tickMin: 7, labelFs: 13, ghostW: 11 },
} as const

const px = (n: number) => `${Math.round(n * 100) / 100}px`
const pct = (n: number) => `${Math.round(n * 1000) / 1000}%`

function cfg(size: 'sm' | 'md' | 'lg') {
  const m = BASE[size] ?? BASE.md
  const labelH = m.labelFs + 5
  const barBottom = labelH + 5 + m.tickMaj
  const barTop = barBottom + m.barH
  const H = barTop + m.stem.high + m.head + 10
  const ghostBottom = barBottom + m.barH / 2 - 0.75
  return { m, labelH, barBottom, barTop, H, ghostBottom }
}

export function ConfidenceSpine({
  scores,
  live = [],
  resolved = [],
  size = 'md',
}: {
  scores: Scores3
  live?: SpineThreat[]
  resolved?: SpineGhost[]
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hover, setHover] = useState<string | null>(null)
  const c = cfg(size)
  const m = c.m
  const gap = 4
  const segW = (100 - 2 * gap) / 3
  const dims: Dim[] = ['D', 'V', 'F']
  const starts: Record<Dim, number> = { D: 0, V: segW + gap, F: 2 * (segW + gap) }

  const segs = dims.map((d) => ({
    dim: d,
    score: scores[d],
    left: pct(starts[d]),
    width: pct(segW),
    fillFrac: pct((scores[d] / 10) * 100),
  }))

  const ticks: { key: string; left: string; bottom: string; height: number; color: string }[] = []
  dims.forEach((d) => {
    for (let k = 0; k <= 10; k++) {
      const major = k % 5 === 0
      const len = major ? m.tickMaj : m.tickMin
      ticks.push({
        key: `${d}-${k}`,
        left: pct(starts[d] + (k / 10) * segW),
        bottom: px(c.barBottom - len),
        height: len,
        color: major ? 'rgba(224,217,207,0.34)' : 'rgba(224,217,207,0.17)',
      })
    }
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: px(c.H), fontFamily: 'var(--font-mono)' }}>
      {/* bar: three bays */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: px(c.barBottom), height: px(m.barH) }}>
        {segs.map((s) => (
          <div
            key={s.dim}
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              left: s.left,
              width: s.width,
              background: 'rgba(224,217,207,0.09)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: s.fillFrac,
                background: 'linear-gradient(180deg, #3a6f6f, #2a5a5a)',
              }}
            />
          </div>
        ))}
      </div>

      {/* ruler ticks */}
      {ticks.map((t) => (
        <div
          key={t.key}
          style={{ position: 'absolute', left: t.left, bottom: t.bottom, width: 1, height: t.height, background: t.color }}
        />
      ))}

      {/* resolved ghosts */}
      {resolved.map((g) => (
        <div
          key={g.id}
          onMouseEnter={() => setHover(g.id)}
          onMouseLeave={() => setHover(null)}
          style={{
            position: 'absolute',
            bottom: px(c.ghostBottom),
            left: pct(starts[g.dim] + (g.frac ?? 0.5) * segW),
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <div style={{ width: px(m.ghostW), height: 0, borderTop: '1.5px solid #6a8a8a', opacity: 0.5 }} />
          {hover === g.id && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                background: '#1a2832',
                border: '1px solid rgba(224,217,207,0.16)',
                borderRadius: 3,
                padding: '6px 10px',
                zIndex: 30,
                boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
              }}
            >
              <div style={{ fontSize: 11.5, color: '#9fb0b0', textDecoration: 'line-through' }}>{g.label}</div>
              <div style={{ fontSize: 10, color: '#5a7247', marginTop: 2 }}>resolved · {DIM_NAME[g.dim]}</div>
            </div>
          )}
        </div>
      ))}

      {/* live kill signals: pin flags */}
      {live.map((n) => {
        const stemH = m.stem[n.sev] ?? m.stem.mid
        const head = n.sev === 'low' ? 'transparent' : '#c4956a'
        const headBorder = n.sev === 'low' ? '1.5px solid #c4956a' : '0 solid transparent'
        const glow = n.sev === 'high' ? '0 0 0 3px rgba(196,149,106,0.16)' : 'none'
        const dim2 = n.sev === 'low' ? 0.7 : 1
        return (
          <div
            key={n.id}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              position: 'absolute',
              bottom: px(c.barTop),
              left: pct(starts[n.dim] + n.frac * segW),
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: px(m.head), height: px(m.head), borderRadius: '50%', background: head, border: headBorder, boxShadow: glow }} />
            <div style={{ width: 1.5, height: px(stemH), background: '#c4956a', opacity: dim2 }} />
            {hover === n.id && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 5px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  background: '#1a2832',
                  border: '1px solid rgba(196,149,106,0.4)',
                  borderRadius: 3,
                  padding: '6px 10px',
                  zIndex: 30,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                }}
              >
                <div style={{ fontSize: 11.5, color: '#f0eee8' }}>{n.label}</div>
                <div style={{ fontSize: 10, color: '#c4956a', marginTop: 2 }}>
                  {DIM_NAME[n.dim]}
                  {n.note ? ` · ${n.note}` : ''}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* dimension labels */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: px(c.labelH) }}>
        {segs.map((s) => (
          <div
            key={s.dim}
            style={{
              position: 'absolute',
              bottom: 0,
              left: s.left,
              width: s.width,
              textAlign: 'center',
              fontSize: px(m.labelFs),
              color: '#6a8a8a',
              letterSpacing: '0.04em',
            }}
          >
            {s.dim} <span style={{ color: '#9fb0b0' }}>{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
