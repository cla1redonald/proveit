export * from './types.ts'
export {
  scanRoots,
  loadIdea,
  parseDiscovery,
  classifyArtifact,
  discoveryLikelihood,
  slugify,
  combined,
  activeKillCount,
} from './scan.ts'
export { createFsSource } from './fs-source.ts'
export { perIdeaSynthesisPrompt, portfolioSynthesisPrompt, extractJson } from './synthesis.ts'
export type { PortfolioIdeaInput } from './synthesis.ts'
export { scanFastChecks, parseFastCheckNote } from './fast-check.ts'
