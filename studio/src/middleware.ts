import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Gate the HOSTED Studio (STUDIO_SOURCE=supabase) behind a single-user magic-link
// login. Local mode (fs, on your machine) stays open. Only the allow-listed email
// can get past — even a valid Supabase session for any other account is rejected.
const ALLOWED = (process.env.STUDIO_ALLOWED_EMAIL ?? '').toLowerCase()

export async function middleware(req: NextRequest) {
  // Local/dev (filesystem) mode is not gated.
  if (process.env.STUDIO_SOURCE !== 'supabase') return NextResponse.next()

  const { pathname } = req.nextUrl
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return NextResponse.next()

  const res = NextResponse.next()
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !ALLOWED || user.email?.toLowerCase() !== ALLOWED) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
