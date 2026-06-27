# ProveIt Studio — Architecture

**Status:** design locked, build in progress
**Date:** 2026-06-26
**Owner:** Claire

## What it is

A personal surface for **reading and synthesising** ProveIt outputs — so you see your
validated ideas at a glance without opening Obsidian and reading raw markdown. It is *not*
the customer product (`web/`) and it does *not* generate the HTML deck. It is a reader +
synthesiser.

Two surfaces, **one codebase**:

- **Local** — runs on your machine (`next dev`), reads your Obsidian vault directly. No auth,
  no network, instant. Solves the "stop living in Obsidian" pain today.
- **Hosted** — `studio.proveit.tools`, read-only, reads a Supabase mirror. Open it from
  anywhere (phone, other machine). Private to you (password-gated).

Personal tool. If it ever grows beyond Claire, it moves to the metered API like `web/`.

## The three decisions that make "both" work

### 1. Ports & adapters — same Studio, two data sources

A single `DataSource` interface drives every view. Two implementations:

| Adapter | Surface | Reads |
|---------|---------|-------|
| `FsVaultSource` | local | the Obsidian vault on disk (markdown) |
| `SupabaseSource` | hosted | the Supabase mirror |

The React components, the reader, and the synthesis views are **identical** across both —
only the adapter swaps, chosen by an env flag (`STUDIO_SOURCE=fs|supabase`). This is what
keeps local and hosted as one app rather than two.

```
interface DataSource {
  listIdeas(): Promise<IdeaSummary[]>
  getIdea(slug: string): Promise<Idea>
  getArtifacts(slug: string): Promise<Artifact[]>
  getSynthesis(slug: string): Promise<Synthesis | null>     // cached
  getPortfolioSynthesis(): Promise<PortfolioSynthesis | null> // cached
}
```

### 2. Vault = local canonical store; Supabase = hosted mirror

```
/proveit (CLI)  ──writes──▶  project dir (discovery.md, research-*, swarm-*, …)
                                   │
                            mirror step (proveit sync, reuses packages/core scan)
                                   ▼
                      Obsidian vault  …/ProveIt/[idea-slug]/   ◀── local canonical store
                                   │
                            proveit sync (one-way, local → cloud)
                                   ▼
                              Supabase  ◀── hosted mirror, read-only
```

- The vault holds the markdown **and** the cached synthesis files — so your knowledge base
  is complete and the sync has one place to read from.
- Sync is **one-directional** (local → cloud). The hosted reader never writes.

### 3. Synthesis is computed locally on Max, cached to a file, then synced

The LLM synthesiser runs via `claude -p` (or the Agent SDK) on **your machine**, on **your
Max plan**. It writes its output as a file next to the idea in the vault:

- per-idea: `…/ProveIt/[idea-slug]/synthesis.json`
- portfolio: `…/ProveIt/_portfolio-synthesis.json`

`proveit sync` carries those files to Supabase like any other artifact. Therefore:

- **The cloud reader makes zero model calls** — it displays cached synthesis.
- **Zero API-wallet exposure** for the hosted surface (rule #1 honoured by construction).
- Re-synthesis is explicit (on demand / on sync), never per page view.

## Repo structure (light npm workspace)

```
proveit/
├── packages/core/          # shared, framework-agnostic TypeScript
│   ├── scan.ts             #   glob + parse discovery.md/artifacts → Idea/Artifact objects
│   ├── types.ts            #   Idea, Artifact, Synthesis, scores, kill signals
│   ├── synthesis.ts        #   deterministic rollups + LLM synthesis orchestration
│   └── mirror.ts           #   project dir → vault copy
├── studio/                 # the Next app (local + hosted, via DataSource adapter)
│   └── src/
│       ├── lib/sources/    #   FsVaultSource, SupabaseSource
│       └── app/            #   portfolio grid, idea reader, synthesis views
├── web/                    # customer product — UNCHANGED
├── scripts/                # workflows + sync command (consumes packages/core)
└── supabase/               # + studio_* tables (Phase 3)
```

`packages/core` is consumed by: the Studio, the `proveit sync` command, and the
`proveit_dashboard` MCP tool — **one scan/parse implementation, never duplicated.**

Design system is reused from `web/src/app/roami-tokens.css` (river/cream palette); markdown
rendering reuses the stack already in `web/` (`react-markdown` + `remark-gfm` +
`@tailwindcss/typography`).

## Supabase schema (Phase 3)

| Table | Holds |
|-------|-------|
| `studio_ideas` | slug, name, scores (D/V/F), status, kill signals, last_updated |
| `studio_artifacts` | idea slug, kind (discovery/research/swarm/review/spec/…), markdown |
| `studio_synthesis` | idea slug, cached per-idea synthesis JSON, generated_at |
| `studio_portfolio_synthesis` | single row, cached cross-idea synthesis, generated_at |

Read-only from the hosted app; written only by `proveit sync`.

## Auth (hosted)

Vercel **deployment password protection** on `studio.proveit.tools` — single-user, zero app
code. Upgrade to Supabase magic-link restricted to Claire's email only if needed.

## Cost (rule #1)

- **Local reader / deterministic synthesis:** $0 — no model.
- **LLM synthesiser:** runs on Max via `claude -p` ≈ $0 (covered by subscription). Dev-test
  ≈ 8 calls/run (7 per-idea + 1 portfolio). If ever routed to the API: <$0.50 (Haiku/Sonnet).
- **Hosted reader:** $0 model — displays cached synthesis only.

Pre-flight before first synth run: verify `claude -p` resolves to the **subscription** and is
not shadowed by `ANTHROPIC_API_KEY` in the environment (which would silently bill the API
wallet).

## Build phases — done = ALL three, browser-verified

- **P1 · Local Studio** — `packages/core` scan/parse, `FsVaultSource`, Obsidian mirror,
  portfolio grid + per-idea reader, deterministic synthesis. Verified in a real browser.
- **P2 · Synthesiser** — per-idea + portfolio LLM synthesis on Max, cached to vault files.
- **P3 · Hosting** — Supabase schema + `SupabaseSource` + `proveit sync` + deploy to
  `studio.proveit.tools` + Vercel password gate. Verified live.

## Open config (needed to wire P1)

- `PROVEIT_VAULT_PATH` — absolute path to the Obsidian vault.
- Vault folder convention — proposed `01_Projects/Micro_Business_Portfolio/ProveIt/[idea]/`.
