import 'server-only'
import { createFsSource, type DataSource } from '@proveit/core'

// Local mode: read the Obsidian vault straight off disk.
// Configurable via env so the same code works on another machine:
//   PROVEIT_VAULT_PATH  — absolute path to the vault (default: Claire's)
//   STUDIO_ROOTS        — comma-separated roots to scan (default: the vault's 01_Projects)
const vault = process.env.PROVEIT_VAULT_PATH ?? '/Users/clairedonald/claudesidian'
const roots = (process.env.STUDIO_ROOTS ?? `${vault}/01_Projects`)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const source: DataSource = createFsSource(roots)
