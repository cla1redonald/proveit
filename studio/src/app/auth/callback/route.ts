import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Exchanges the magic-link code for a session cookie, then sends you home.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const next = req.nextUrl.searchParams.get('next') ?? '/'
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
  }
  return res
}
