// Shared types for ProveIt Studio + sync + MCP tool.
// One vocabulary for "a validated idea and its artifacts", regardless of where
// it's read from (local Obsidian vault on disk, or the Supabase mirror).

export type SourceKind = 'fs' | 'supabase'

/**
 * Confidence scores. The canonical three are always present when scored;
 * extra dimensions (e.g. "strategy alignment") are kept under their slug too.
 */
export interface Scores {
  desirability?: number
  viability?: number
  feasibility?: number
  /** Any additional `Label: N/10` dimensions found, keyed by slug. */
  extra: Record<string, { label: string; score: number }>
}

/** Severity/lifecycle of a kill signal, inferred from how the PM annotated it. */
export type KillStatus = 'serious' | 'active' | 'monitored' | 'flag' | 'resolved'

export interface KillSignal {
  label: string
  detail?: string
  status: KillStatus
}

export type ArtifactKind =
  | 'discovery'
  | 'research'
  | 'swarm-angle'
  | 'swarm-synthesis'
  | 'review'
  | 'pre-mortem'
  | 'scenarios'
  | 'spec'
  | 'design-brief'
  | 'brand'
  | 'prompts'
  | 'index'
  | 'synthesis-cache'
  | 'other'

export interface Artifact {
  kind: ArtifactKind
  /** Human label, e.g. "Swarm 1 · Market Bull" or "Research Round 2". */
  label: string
  round?: number
  /** For swarm angles: "market-bull", "devils-advocate", … */
  angle?: string
  fileName: string
  /** Absolute path on disk (fs source) or a storage key (supabase source). */
  path: string
}

export interface IdeaSummary {
  slug: string
  name: string
  /** Short tagline from the brain dump's first line — the registry descriptor. */
  oneLiner?: string
  scores: Scores
  status?: string
  generated?: string
  lastUpdated?: string
  killSignals: KillSignal[]
  hasDeck: boolean
  /** URL when a deck exists, else a note like "Not yet generated". */
  deck?: string
  /** Absolute directory the idea's artifacts live in. */
  dir: string
  /** Absolute path to the discovery index file. */
  discoveryPath: string
  source: SourceKind
  artifactCount: number
}

export interface Idea extends IdeaSummary {
  brainDump?: string
  recommendation?: string
  artifacts: Artifact[]
}

/** Cached per-idea synthesis (computed locally on Max via `claude -p`, P2). */
export interface Synthesis {
  slug: string
  generatedAt?: string
  /** The written verdict — one honest paragraph on where the case stands. */
  summary: string
  /** Strongest case for. */
  bull: string
  /** Strongest case against. */
  bear: string
  /** The kill question the founder is avoiding. */
  devil: string
  /** Optional longer narrative distilled from every artifact. */
  body?: string
}

/** Cached cross-idea synthesis — patterns across the whole portfolio (P2). */
export interface PortfolioSynthesis {
  generatedAt?: string
  /** Markdown narrative: recurring kill signals, score patterns, strongest unbuilt idea. */
  body: string
}

/**
 * The one interface every Studio view talks to. `FsVaultSource` (local) and
 * `SupabaseSource` (hosted) implement it; the UI never knows which it has.
 */
export interface DataSource {
  listIdeas(): Promise<IdeaSummary[]>
  getIdea(slug: string): Promise<Idea | null>
  readArtifact(slug: string, fileName: string): Promise<string>
  getSynthesis(slug: string): Promise<Synthesis | null>
  getPortfolioSynthesis(): Promise<PortfolioSynthesis | null>
}
