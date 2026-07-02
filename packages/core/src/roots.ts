import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Resolve the vault scan roots from env, with a HOME-relative default so no
 * personal absolute path is baked into this (public) repo.
 *   PROVEIT_VAULT_PATH — the Obsidian vault (default: ~/claudesidian)
 *   STUDIO_ROOTS       — comma-separated roots (default: <vault>/01_Projects)
 */
export function resolveRoots(): string[] {
  const vault = process.env.PROVEIT_VAULT_PATH ?? join(homedir(), 'claudesidian')
  return (process.env.STUDIO_ROOTS ?? `${vault}/01_Projects`)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** The vault directory itself (for tools that need the dir, not the roots). */
export function resolveVault(): string {
  return process.env.PROVEIT_VAULT_PATH ?? join(homedir(), 'claudesidian')
}
