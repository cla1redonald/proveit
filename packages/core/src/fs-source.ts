// Local DataSource: reads ideas straight from the Obsidian vault / project dirs.
// Used by the Studio (local mode), `proveit sync`, and the MCP dashboard tool.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  DataSource,
  Idea,
  IdeaSummary,
  PortfolioSynthesis,
  Synthesis,
} from './types.ts'
import { loadIdea, scanRoots } from './scan.ts'

export function createFsSource(roots: string[]): DataSource {
  // Cache the scan within a single source instance; cheap and avoids re-walking
  // the vault on every artifact read.
  let cache: Promise<IdeaSummary[]> | null = null
  const scan = () => (cache ??= scanRoots(roots))

  async function find(slug: string): Promise<IdeaSummary | undefined> {
    return (await scan()).find((i) => i.slug === slug)
  }

  return {
    async listIdeas() {
      return scan()
    },

    async getIdea(slug: string): Promise<Idea | null> {
      const summary = await find(slug)
      if (!summary) return null
      return loadIdea(summary.discoveryPath)
    },

    async readArtifact(slug: string, fileName: string): Promise<string> {
      const summary = await find(slug)
      if (!summary) throw new Error(`Unknown idea: ${slug}`)
      return readFile(join(summary.dir, fileName), 'utf8')
    },

    async getSynthesis(slug: string): Promise<Synthesis | null> {
      const summary = await find(slug)
      if (!summary) return null
      try {
        const raw = await readFile(join(summary.dir, 'synthesis.json'), 'utf8')
        return JSON.parse(raw) as Synthesis
      } catch {
        return null
      }
    },

    async getPortfolioSynthesis(): Promise<PortfolioSynthesis | null> {
      for (const root of roots) {
        try {
          const raw = await readFile(join(root, '_portfolio-synthesis.json'), 'utf8')
          return JSON.parse(raw) as PortfolioSynthesis
        } catch {
          /* try next root */
        }
      }
      return null
    },
  }
}
