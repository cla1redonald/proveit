import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @proveit/core ships TypeScript source (no build step) — transpile + bundle it.
  // (No outputFileTracingRoot: it made `vercel build` treat the repo as a monorepo
  //  root and double the output path to studio/studio/.next.)
  transpilePackages: ['@proveit/core'],
}

export default nextConfig
