import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Trace from the repo root so the @proveit/core workspace package is bundled
// correctly on Vercel (and to silence the multiple-lockfile inference warning).
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const nextConfig: NextConfig = {
  transpilePackages: ['@proveit/core'],
  outputFileTracingRoot: repoRoot,
}

export default nextConfig
