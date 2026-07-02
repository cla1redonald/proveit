import 'server-only'
import { createFsSource, resolveRoots, type DataSource } from '@proveit/core'
import { createSupabaseSource } from './sources/supabase'

// One Studio, two data adapters. STUDIO_SOURCE picks which:
//   fs       (default) — read the Obsidian vault straight off disk (local)
//   supabase           — read the synced mirror (hosted: studio.proveit.tools)
function build(): DataSource {
  if (process.env.STUDIO_SOURCE === 'supabase') {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('STUDIO_SOURCE=supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    return createSupabaseSource(url, key)
  }

  const roots = resolveRoots()
  return createFsSource(roots)
}

// Build LAZILY on first use (request time), not at import time — sensitive env
// vars (the service role key) are present at runtime but NOT during `next build`,
// so a module-load build would crash page-data collection.
let cached: DataSource | undefined
const resolve = (): DataSource => (cached ??= build())

export const source: DataSource = new Proxy({} as DataSource, {
  get(_target, prop: string) {
    const s = resolve() as unknown as Record<string, unknown>
    const value = s[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(s) : value
  },
})
