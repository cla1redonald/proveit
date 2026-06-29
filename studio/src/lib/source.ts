import 'server-only'
import { createFsSource, type DataSource } from '@proveit/core'
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

  const vault = process.env.PROVEIT_VAULT_PATH ?? '/Users/clairedonald/claudesidian'
  const roots = (process.env.STUDIO_ROOTS ?? `${vault}/01_Projects`)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return createFsSource(roots)
}

export const source: DataSource = build()
