// Mirror ProveIt outputs from a project directory into your Obsidian vault, so
// the runs you do in a project folder land in one consolidated place — each idea
// in its own folder (which also avoids the shared-folder synthesis.json clash).
//
//   node scripts/mirror.ts <project-dir> [<project-dir> ...]
//
// Copy-only: writes ONLY into <vault>/…/ProveIt Research/<slug>/. It never moves
// or overwrites anything outside that folder.

import { mkdir, copyFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { scanRoots, loadIdea } from '../packages/core/src/index.ts'

const VAULT = process.env.PROVEIT_VAULT_PATH ?? '/Users/clairedonald/claudesidian'
const MIRROR_DIR =
  process.env.PROVEIT_MIRROR_DIR ?? join(VAULT, '01_Projects/Micro_Business_Portfolio/ProveIt Research')

const projectDirs = process.argv.slice(2)
if (projectDirs.length === 0) {
  console.error('usage: node scripts/mirror.ts <project-dir> [<project-dir> ...]')
  console.error('  copies each idea found into', MIRROR_DIR + '/<slug>/')
  process.exit(1)
}

const ideas = await scanRoots(projectDirs)
if (ideas.length === 0) {
  console.error('No ProveIt ideas (a discovery.md with scores) found in:', projectDirs.join(', '))
  process.exit(1)
}

for (const summary of ideas) {
  const idea = await loadIdea(summary.discoveryPath)
  const dest = join(MIRROR_DIR, idea.slug)
  await mkdir(dest, { recursive: true })

  const files = [idea.discoveryPath, ...idea.artifacts.map((a) => a.path)]
  let copied = 0
  for (const f of files) {
    try {
      await copyFile(f, join(dest, basename(f)))
      copied++
    } catch (e) {
      process.stderr.write(`  ! skip ${basename(f)}: ${(e as Error).message}\n`)
    }
  }
  process.stderr.write(`✓ ${idea.name} → ${dest}  (${copied} files)\n`)
}
process.stderr.write('\ndone.\n')
