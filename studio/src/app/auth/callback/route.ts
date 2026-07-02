import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Exchanges the magic-link code for a session cookie, then sends you home.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  // Only allow a same-origin relative path: exactly one leading '/', never a
  // protocol-relative ('//') or backslash-tricked ('/\') off-origin target.
  const raw = req.nextUrl.searchParams.get('next') ?? '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : '/'
  const res = NextResponse.redirect(new URL(next, req.url))

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
        },
      },
    )
    await supabase.auth.exchangeCodeForSession(code)

    // Defense in depth: even a valid session must be the allow-listed address.
    const allowed = (process.env.STUDIO_ALLOWED_EMAIL ?? '').toLowerCase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!allowed || user?.email?.toLowerCase() !== allowed) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  return res
}
