# ProveIt Studio

A **personal, local** reader + synthesiser for your own ProveIt outputs — so you see your validated ideas at a glance without living in Obsidian. It is *not* the customer product (`web/`) and it does *not* generate the HTML deck. It reads the markdown ProveIt writes (in your Obsidian vault) and renders it as **case files**.

Full design rationale: [`../docs/studio-architecture.md`](../docs/studio-architecture.md).

## What it is

Three surfaces, one app, built to the "Case File" concept:

- **Registry** — every validated idea as a row: the Confidence Spine (D/V/F with live kill-signals as pin-flags), Σ, threat tally, doc count. Sortable. Plus an **Across the portfolio** panel — the cross-idea synthesis (patterns no single case shows).
- **Reader** — pinned verdict header + a **round-timeline rail** ("how the case was built") + the artifact markdown, styled.
- **Verdict** — the large spine, live-vs-resolved threat cards, and the **Bull / Bear / Devil's-advocate** swarm reading.

## Run it locally

```bash
# from the repo root (npm workspace)
npm install
npm run dev -w proveit-studio      # → http://localhost:4317
```

Config (optional — defaults to Claire's vault):

- `PROVEIT_VAULT_PATH` — absolute path to your Obsidian vault
- `STUDIO_ROOTS` — comma-separated roots to scan (default: `<vault>/01_Projects`)

The reader reads the vault **live** off disk — no build step, no sync, nothing generated.

## Development

```bash
npm run lint -w proveit-studio     # ESLint (next/core-web-vitals)
npx tsc --noEmit                   # from studio/
npm run build -w proveit-studio
npm test -w @proveit/core          # shared scan/parse tests (packages/core)
```

CI runs lint, typecheck, and build for Studio plus tests for `@proveit/core` on PRs to `main` and `feat/proveit-studio` (see `.github/workflows/ci.yml`).

## The synthesiser (runs on your Max plan)

The Bull/Bear/Devil verdict and the portfolio synthesis are LLM-generated. They run **locally on your Claude Max subscription** via `claude -p` (not the API wallet), and cache to JSON beside each idea so the reader just displays them:

```bash
node scripts/synthesise.ts <slug>        # one idea  → synthesis.json
node scripts/synthesise.ts --all         # every idea
node scripts/synthesise.ts --portfolio   # cross-idea → _portfolio-synthesis.json
```

Re-run to refresh. Model via `PROVEIT_SYNTH_MODEL` (default `sonnet`).

## Two surfaces, one app

The shared scan/parse lives in [`../packages/core`](../packages/core) and feeds a pluggable `DataSource`, chosen by `STUDIO_SOURCE`:

- **Local** (`fs`, default) — `FsVaultSource` reads the Obsidian vault straight off disk. No auth.
- **Hosted** (`supabase`) — `SupabaseSource` reads the synced mirror. **Live at [studio.proveit.tools](https://studio.proveit.tools)**, private behind single-user **magic-link auth** (Supabase Auth, allow-listed to one email via `STUDIO_ALLOWED_EMAIL`; gate in `src/middleware.ts`). Populate/refresh it with `scripts/sync.ts`.

Same UI, same components — only the adapter swaps.

### Deploy notes

- Monorepo: the Vercel project's **Root Directory is `studio`**; deploy from the repo root so the `@proveit/core` workspace resolves.
- `src/lib/source.ts` builds the data source **lazily** (first request), because the sensitive service-role key isn't present during `next build`.

## Feedback loop

The [Agentation](https://github.com/neondatabase/agentation) toolbar is mounted **in development only** (`NODE_ENV === 'development'`), so it never ships to the hosted build. Click an element, leave a note, and Claude picks it up.
