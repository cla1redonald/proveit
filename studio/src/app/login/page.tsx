'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 28 }}>
          <span className="font-display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', color: '#f0eee8' }}>
            ProveIt
          </span>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c4956a', transform: 'translateY(-4px)' }} />
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6a8a8a' }}>
            Studio
          </span>
        </div>

        {sent ? (
          <div>
            <h1 className="font-display" style={{ fontSize: 22, color: '#f0eee8', margin: '0 0 10px' }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: '#9fb0b0', lineHeight: 1.6 }}>
              A magic link is on its way to <span className="font-mono" style={{ color: '#c4956a' }}>{email}</span>. Open it on this
              device to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={send}>
            <h1 className="font-display" style={{ fontSize: 22, color: '#f0eee8', margin: '0 0 6px' }}>
              Sign in
            </h1>
            <p style={{ fontSize: 13.5, color: '#6a8a8a', margin: '0 0 18px', lineHeight: 1.55 }}>
              Private — a magic link, no password. Only the registered address can get in.
            </p>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="font-mono"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 14,
                color: '#f0eee8',
                background: '#111a24',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                outline: 'none',
              }}
            />
            {err && <p style={{ fontSize: 12.5, color: '#a04040', marginTop: 10 }}>{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="font-mono"
              style={{
                marginTop: 14,
                width: '100%',
                padding: '12px 14px',
                fontSize: 13,
                letterSpacing: '0.04em',
                color: '#0d141c',
                background: '#c4956a',
                border: 'none',
                borderRadius: 6,
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
