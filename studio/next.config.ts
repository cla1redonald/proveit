import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @proveit/core ships TypeScript source (no build step) — let Next transpile it.
  transpilePackages: ['@proveit/core'],
}

export default nextConfig
