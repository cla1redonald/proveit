# Gameplan: Epic #25 — Shareability mechanics

**Spec:** GitHub Epic [#25](https://github.com/cla1redonald/proveit/issues/25) + stories [#31](https://github.com/cla1redonald/proveit/issues/31), [#32](https://github.com/cla1redonald/proveit/issues/32), [#33](https://github.com/cla1redonald/proveit/issues/33)
**Date:** 2026-05-17 (revised same day after architect + devsecops review)
**Complexity:** Medium-low (#32 simplified from original draft — no data layer)
**Estimated files:** 7–9 new + 2–3 modified
**Revision note:** Original draft proposed a Supabase `validation_results` table with anon SELECT. Architect + DevSecOps review surfaced (a) a bulk-export vulnerability via the Supabase REST API, and (b) a deeper design objection from Claire: idea text should not persist server-side at all. Revised to a stateless JWT design — no DB, no RLS, no delete endpoint.

---

## TL;DR

Three stories, ship in order **#31 → #32 → #33** across three `/shipit` runs.

**Core principle (set by Claire 2026-05-17):** Idea text never persists server-side. The #42 PII rule ("no idea text in PostHog") extends to all server-side storage. Share data lives in the URL the user holds, not in our database.

#31 is a 30-min documentation edit to the plugin agent. #32 builds a stateless share-card primitive: a JWT-signed token in the URL carries the data; `/api/share-card` and `/s/[token]` decode and render. No database, no RLS, no delete endpoint to maintain. #33 reuses #32's token + endpoint with a `?variant=kill` flag.

---

## Sequencing & rationale

**#31 first.** Zero coupling to web app, ~30 min, unblocks Substack Posts immediately by ensuring any Gamma deck Claire shares publicly carries the watermark. Independent — can `/shipit` in parallel with #32 if desired.

**#32 second.** Builds the JWT mint + verify primitive that #33 will reuse. Smaller scope than the original draft (~3–4 hours) because there's no data layer.

**#33 last.** Reuses the same JWT verify + share-card route. The kill-trigger predicate is a small pure function. ~3 hours.

---

## Story #31 — "Made with ProveIt" watermark on Gamma decks

### Critical files

| File | Change |
|---|---|
| `agents/proveit.md` (lines 1376–1404, "Output 1: Gamma Presentation") | Append a **Footer convention** subsection to the Gamma generation instructions |

### Steps (in order)

1. **Edit `agents/proveit.md` Output 1.** After the 9-slide structure block, add:

   ```markdown
   **Footer convention — required on every slide:**

   Add to the Gamma generation prompt: `Add a small footer to every slide reading "Generated with ProveIt · proveit.tools" — make "proveit.tools" a clickable link. Use the brand's secondary text colour, ~10pt, bottom centre.`

   If Gamma ignores the footer instruction, fall back to a post-generation pass using `mcp__claude_ai_Gamma__perform-editing-operations` to inject the footer on each page.

   **Verification:** before declaring the deck complete, fetch the first slide via `mcp__claude_ai_Gamma__get-design-pages` and confirm the footer string appears. If absent, run the post-generation fallback.
   ```

2. **No web app changes.** No tests, no build, no deploy.

3. **Manual verification (one-off, not blocking the PR):** run `/proveit` end-to-end on a small idea and confirm the footer appears on a freshly-generated deck. Export to PDF + PPTX, confirm the footer survives both formats. (Costs ~$1 of API calls — worth it.)

### Test plan

- No unit tests needed (instruction-level edit to a plugin spec)
- Manual: one `/proveit` run with footer check + export survival check

### Verification step

`gh pr view <#>` shows a one-file diff. CI green. Footer present in a test deck.

### Done when

- [x] `agents/proveit.md` updated with Footer Convention subsection — shipped 2026-05-17, PR #52
- [ ] One real `/proveit` run produces a deck with the footer on every slide
- [ ] Footer survives PDF + PPTX export
- [ ] Issue #31 closed via PR

### `/shipit` invocation

```
/shipit ~/code/proveit — add Footer Convention to agents/proveit.md Phase 9 Output 1 per epic-25 gameplan; this is the #31 watermark instruction. No code change beyond the markdown spec; CI runs but no new tests needed. Push, open PR, close #31 on merge.
```

---

## Story #32 — D/V/F score share card (stateless JWT, no DB)

### Architecture

**The URL IS the data.** When the user clicks "Share your score":

1. Client POSTs `{idea_summary, d, v, f, kill_count}` to `/api/share/mint`
2. Server signs an HS256 JWT using `SHARE_LINK_SECRET` env var:
   ```json
   {
     "v": 1,
     "d": 7,
     "vi": 4,
     "f": 8,
     "k": 0,
     "s": "A bookmarking app that auto-categorises tabs",
     "iat": 1779039000,
     "jti": "01HXYZ..."
   }
   ```
   Fields: `v` schema version, `d/vi/f` scores, `k` kill-signal count, `s` idea summary (capped at 140 chars at mint time), `iat` issued-at, `jti` unique id for analytics dedup.

3. Server returns `{ url: "/s/<jwt>" }`. Token is ~280–320 chars — well under LinkedIn (2000) and X (4000) URL ceilings.

4. `/s/[token]` (landing page) and `/api/share-card?t=<token>` (OG image) **verify the JWT signature and decode**. No database read. If verify fails: 404. If schema version mismatch: 404.

5. **No persistence anywhere.** Server holds no record. If the user loses the URL, the share is gone — same model as a deleted tweet's URL.

### Critical files

**New:**
| File | Purpose |
|---|---|
| `web/src/lib/share-token.ts` | `mintShareToken(payload)` + `verifyShareToken(token)` using `jsonwebtoken` lib |
| `web/src/app/api/share/mint/route.ts` | POST endpoint, rate-limited, validates payload, returns signed JWT URL |
| `web/src/app/api/share-card/route.ts` | GET endpoint, verifies token, renders 1200×630 PNG via `next/og` ImageResponse |
| `web/src/app/s/[token]/page.tsx` | Public share landing — decodes token, renders the score + CTA to `/validate` |
| `web/src/app/s/[token]/layout.tsx` | `generateMetadata({ params })` returns OG tags pointing at `/api/share-card?t=...` |
| `web/src/components/validate/ShareScoreCard.tsx` | Share UI: mint button → opens popover with LinkedIn / X / copy-link / download |

**Modified:**
| File | Change |
|---|---|
| `web/src/components/validate/ChatInterface.tsx` | Render `<ShareScoreCard session={...} />` alongside `DownloadButton` when `canDownload === true` |
| `web/package.json` | Add `jsonwebtoken` + `@types/jsonwebtoken` |

### Steps (in order)

1. **JWT helper.** `web/src/lib/share-token.ts`:

   ```ts
   import "server-only";
   import jwt from "jsonwebtoken";
   import { nanoid } from "nanoid";

   const SECRET = process.env.SHARE_LINK_SECRET;
   const SCHEMA_VERSION = 1;
   const MAX_IDEA_LENGTH = 140;

   export interface SharePayload {
     d: number; vi: number; f: number; k: number; s: string;
   }
   export interface VerifiedShare extends SharePayload {
     v: number; iat: number; jti: string;
   }

   export function mintShareToken(input: SharePayload): string {
     if (!SECRET) throw new Error("SHARE_LINK_SECRET unset");
     const payload = {
       v: SCHEMA_VERSION,
       d: input.d, vi: input.vi, f: input.f, k: input.k,
       s: input.s.slice(0, MAX_IDEA_LENGTH),
       jti: nanoid(),
     };
     return jwt.sign(payload, SECRET, { algorithm: "HS256", noTimestamp: false });
   }

   export function verifyShareToken(token: string): VerifiedShare | null {
     if (!SECRET) return null;
     try {
       const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as VerifiedShare;
       if (decoded.v !== SCHEMA_VERSION) return null;
       return decoded;
     } catch {
       return null;
     }
   }
   ```

   Add `SHARE_LINK_SECRET` (32 random bytes, base64) to Vercel production env via `vercel env add`.

2. **Mint endpoint.** `web/src/app/api/share/mint/route.ts`:
   - POST only, zod-validated body: `{ ideaSummary, d, vi, f, k }`
   - Rate-limit via existing `checkRateLimit` (fast bucket — 10/IP/min). A determined attacker minting thousands of tokens only wastes CPU; they can't bulk-extract anyone else's data because there is no else's data.
   - Returns `{ url: "/s/${token}" }`
   - Fires PostHog `share_card_minted` event with `{ jti, has_kill_signal }` — **no idea text** per #42 discipline

3. **Share-card image route.** `web/src/app/api/share-card/route.ts`:

   ```ts
   import { ImageResponse } from "next/og";
   import { verifyShareToken } from "@/lib/share-token";
   export const runtime = "nodejs";
   export async function GET(req: Request) {
     const url = new URL(req.url);
     const token = url.searchParams.get("t");
     const variant = url.searchParams.get("variant"); // "kill" used by #33
     if (!token) return new Response("Not found", { status: 404 });
     const share = verifyShareToken(token);
     if (!share) return new Response("Not found", { status: 404 });  // same 404 for missing + malformed
     return new ImageResponse(
       <ShareCardComponent share={share} variant={variant} />,
       { width: 1200, height: 630 }
     );
   }
   ```

   JSX uses inline styles (no Tailwind — `next/og` constraint). Brand colours hardcoded from Roami tokens (copper `#c4956a`, ink `#111a24`, cream `#faf6f1`).

4. **Public landing.** `web/src/app/s/[token]/page.tsx`:
   - Decodes token via `verifyShareToken` (server-side, just renders)
   - Shows: idea summary, D/V/F numbers, "Run your own validation" CTA → `/validate`
   - Fires PostHog `share_inbound_visit` with `{ jti, referrer }` — **no idea text**
   - 404 page on invalid token

5. **OG meta tags.** `web/src/app/s/[token]/layout.tsx` exports `generateMetadata({ params })` that returns:
   - `og:title` — generic "I validated an idea with ProveIt"
   - `og:description` — generic "D[X]/V[Y]/F[Z] — see the validation"
   - `og:image` — `https://proveit.tools/api/share-card?t=<token>`
   - 404 metadata when token verify fails

6. **Share UI.** `web/src/components/validate/ShareScoreCard.tsx`:
   - Visible after validation completes (`activeSession.phase === "complete"`)
   - "Share your score" button → POSTs to `/api/share/mint` → on success, opens a popover with:
     - LinkedIn share: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
     - X share: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
     - Copy link: `navigator.clipboard.writeText(shareText + " " + shareUrl)`
     - Download image: `<a href="/api/share-card?t=...&download=1" download>` (route honours flag with `Content-Disposition: attachment`)
   - Pre-populated text: `I just ran my idea through ProveIt and got D${d}/V${vi}/F${f}. The discipline gate before the build → proveit.tools`
   - Fires PostHog `share_card_clicked` with `{ jti, platform }` per click

7. **Wire into ChatInterface.** Render `<ShareScoreCard session={activeSession} />` alongside `<DownloadButton />` inside the existing `canDownload` block.

### Test plan

| Test | Scope |
|---|---|
| `tests/unit/share-token.test.ts` | `mintShareToken` produces a verifiable token; `verifyShareToken` returns null for tampered tokens, invalid signatures, wrong algorithm, schema-version mismatch; both fail safely when `SHARE_LINK_SECRET` is unset |
| `tests/unit/share-card-component.test.tsx` | The ShareCardComponent renders D/V/F numbers and idea text correctly at both default and `variant="kill"` |
| `tests/integration/share-mint-route.test.ts` | `POST /api/share/mint` returns 200 + url; rate-limit fires at 11th request; rejects malformed bodies with 400 |
| `tests/integration/share-card-route.test.ts` | `GET /api/share-card?t=<valid>` returns 200 + image/png + PNG magic bytes; `?t=<tampered>` returns 404; `?t=missing` returns 404 (indistinguishable) |
| Manual: LinkedIn Post Inspector | Mint a real token in browser, paste resulting `/s/<token>` URL into [Post Inspector](https://www.linkedin.com/post-inspector/), confirm card preview renders |

### Verification step

After deploy: complete a validation, click Share → mint, paste the URL into LinkedIn Post Inspector, screenshot. Attach to PR.

### Done when

- [ ] `SHARE_LINK_SECRET` set in Vercel production env via `vercel env add` (32 bytes base64)
- [ ] Share button visible on every completed validation
- [ ] Card renders at 1200×630 with no broken fonts or off-brand colours
- [ ] LinkedIn link preview shows the card image
- [ ] Copy-link works in Chrome + Safari
- [ ] 4 unit/integration tests green (token + component + 2 route tests)
- [ ] No Supabase migration shipped (sanity check — confirming the no-DB design held)
- [ ] Issue #32 closed via PR

### `/shipit` invocation

```
/shipit ~/code/proveit/web — implement story #32 per epic-25 gameplan (REVISED for JWT-only design). The principle: idea text never persists server-side. Build the stateless share-card primitive: lib/share-token.ts (HS256 JWT mint + verify, requires SHARE_LINK_SECRET env), /api/share/mint POST route (rate-limited, zod-validated), /api/share-card GET route using ImageResponse from next/og (runtime: nodejs), /s/[token] public landing with generateMetadata OG tags, ShareScoreCard component wired into ChatInterface alongside DownloadButton. PostHog events: share_card_minted, share_card_clicked, share_inbound_visit — all carry jti only, NEVER idea text (per #42 PII rule). NO Supabase migration. NO database. Tests: unit on share-token (verify failure modes), unit on the share-card component, integration on both API routes (mint returns url, card returns image/png magic bytes, both 404 indistinguishably on bad tokens). Add SHARE_LINK_SECRET (32 bytes base64) to Vercel via vercel env add before merge. Push, open PR, close #32.
```

---

## Story #33 — Kill-signal screen designed for screenshot-shareability

### Critical files

**New:**
| File | Purpose |
|---|---|
| `web/src/components/validate/KillSignalScreen.tsx` | The opinionated kill UI |
| `web/src/lib/kill-signal.ts` | `shouldShowKillSignal(scores, killSignals): boolean` pure predicate |

**Modified:**
| File | Change |
|---|---|
| `web/src/components/validate/ChatInterface.tsx` | Conditional render of `KillSignalScreen` when predicate is true AND phase === complete; otherwise the normal results view |
| `web/src/app/api/share-card/route.ts` | (Already handles `?variant=kill` — see #32 step 3) |

### Steps (in order)

1. **Predicate first.** `web/src/lib/kill-signal.ts`:

   ```ts
   import type { ConfidenceScores, KillSignal } from "@/types";
   export function shouldShowKillSignal(scores: ConfidenceScores, killSignals: readonly KillSignal[]): boolean {
     if (killSignals.length > 0) return true;
     const vals = [scores.desirability, scores.viability, scores.feasibility];
     return vals.some(v => v !== null && v < 4);
   }
   ```

2. **Component.** `web/src/components/validate/KillSignalScreen.tsx`:
   - Headline: derived from the trigger — kill signal present → "Don't build this." / low score → "This is probably the wrong thing to build right now."
   - 1-sentence reasoning: pulled from the strongest kill signal's `evidence` field, or from the lowest-score reason
   - Three "elephants" panel: the top 3 findings from the validation messages (see Risk R6 — resolved by Phase 8 pre-populating `Top 3 elephants` in `discovery.md`)
   - Layout: ~1:1 aspect ratio, no top nav, ProveIt watermark bottom-left, `proveit.tools` URL bottom-right
   - "Share this kill signal" button → calls the same `/api/share/mint` endpoint but the resulting URL is `/s/<token>?variant=kill` (the variant flag is read client-side by the share UI to construct the OG image URL with `variant=kill`)

3. **Wire into ChatInterface.** When phase === "complete" and `shouldShowKillSignal(scores, killSignals)`, render `KillSignalScreen` INSTEAD of the normal results view. Otherwise render the existing view.

4. **PostHog events.** Fire `kill_signal_shown` on mount, `kill_signal_shared` on share-button click — distinct from the score-card events so success metric can disaggregate kill-share vs score-share.

### Test plan

| Test | Scope |
|---|---|
| `tests/unit/kill-signal.test.ts` | Predicate truth table: 5 cases — kill signal present, low D, low V, low F, all clean — assert each correctly |
| `tests/unit/kill-signal-screen.test.tsx` | Component renders headline + reasoning + 3 elephant slots; share button present; correct aria roles |
| `tests/unit/chat-interface-kill-render.test.tsx` | When phase=complete + low D, ChatInterface renders KillSignalScreen not the normal results |
| Manual | Screenshot at 375×667 (iPhone SE) and 1280×900 (desktop). PNG export from share button looks clean. |

### Verification step

Inject a fake session via localStorage (per the technique used in #47 verification — set scores to {3, 5, 7}, phase to "complete"), reload, screenshot. The screen should render cleanly without further interaction.

### Done when

- [ ] Predicate covers all 5 trigger cases with unit tests
- [ ] Screen renders well at typical mobile + desktop dimensions
- [ ] Share button produces a clean PNG via `/api/share-card?t=...&variant=kill`
- [ ] Substack Post #3 has a real screenshot to embed (manual verification, post-merge)
- [ ] 3 unit tests green (predicate + component + integration with ChatInterface)
- [ ] Issue #33 closed via PR

### `/shipit` invocation

```
/shipit ~/code/proveit/web — implement story #33 per epic-25 gameplan. Builds on #32's JWT mint + share-card route. New: lib/kill-signal.ts pure predicate (any score < 4 OR killSignals.length > 0), KillSignalScreen.tsx component (square-ish, no chrome, watermark + URL footer, opinionated headline). Modified: ChatInterface conditional render when predicate true. The /api/share-card route already accepts ?variant=kill from #32 — the kill screen's share button just mints normally and constructs the OG URL with the kill variant flag. PostHog events: kill_signal_shown + kill_signal_shared. Tests: predicate truth table (5 cases), component render, integration with ChatInterface. Push, open PR, close #33.
```

---

## Dependencies graph

```
#31 (plugin watermark) ─── independent, can ship in parallel with #32

#32 (JWT mint + share card) ───┬─── #33 (kill screen reuses mint + variant flag)
                                │
                                └─── SHARE_LINK_SECRET env is the only pre-req
```

---

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Gamma ignores the prompt-level footer instruction (#31 path a) | Medium | Low | Falls back to post-generation edit. Verification step (fetch slide 1, check string) catches the failure deterministically. |
| R2 | `next/og` ImageResponse breaks on nodejs runtime | Low (probed — `next/og` resolves) | High | Confirmed importable. If breaks at runtime, fall back to `@vercel/og` direct or SVG + `sharp`. |
| R3 | LinkedIn caches OG aggressively — iteration loop painful | High | Medium | Use LinkedIn Post Inspector after each fix. Tokens are inherently cache-busting (each mint produces a new token + URL) so iteration is trivial. |
| R4 | JWT secret rotation invalidates old URLs | Low (no rotation scheduled) | Medium | If rotation ever needed: add a `kid` header to mint, accept both old and new keys during a 30-day overlap. Not needed at launch. |
| R5 | Forged share URLs ("I got D10/V10/F10") | Low — economically uninteresting | Low | Provably impossible to forge without `SHARE_LINK_SECRET`. JWT signature catches tampering deterministically. |
| R6 | Kill-trigger "3 specific elephants" data source ambiguity | Medium | Medium | Two options: (a) static slot — the assistant populates `discovery.md` with a `Top 3 elephants` section at phase-complete, and we read that; (b) post-hoc LLM call. Recommend (a) — pre-populated, deterministic, no extra Anthropic spend on share path. Add to Phase 8 of `agents/proveit.md` if not already present. |
| R7 | `next/og` font loading for Playfair Display fails | Medium | Low | `next/og` needs fonts served with the request. Pre-load via `fetch('/fonts/PlayfairDisplay.ttf')` from the public dir and pass as `fonts:` array. Test in CI. |
| R8 | Token URL exceeds platform limits | Low (~300 chars vs 2000 LinkedIn / 4000 X ceiling) | Low | If idea summary capped at 140 chars, total token well under any limit. Document the 140-char cap in the JWT helper. |
| R9 | Rate-limit dodging on `/api/share/mint` | Low — minting just wastes CPU, no data theft possible | Low | Existing `checkRateLimit` (10/IP/min on fast bucket) is sufficient. Token storage cost = zero. |
| R10 | Share-URL exposed via browser history sync / referer headers | Medium | Low — the URL is the data, and clicking Share means the user consented to publishing it | The URL is intentionally public after Share — same threat model as any social-share URL. Document this in the disclosure copy ("Anyone with this URL can see your scores"). |

**Removed from original draft:**
- ~~R4 RLS misconfig~~ — no RLS to misconfigure
- ~~R7 GDPR delete need~~ — no data to delete

---

## Definition of done for the epic

The Epic #25 success metric per the issue:

> "All three share mechanics are live and **at least one has produced a measurable inbound conversion (Substack click-through from a shared deck or score card)**."

Instrumentation:

| Mechanic | Source | Inbound event | Definition |
|---|---|---|---|
| #31 watermark | Gamma deck footer link with `?utm_source=gamma` | `gamma_deck_inbound_visit` auto-derived from `$pageview` with `utm_source=gamma` | Visitor lands on proveit.tools with `utm_source=gamma` |
| #32 score card | `/s/[token]` landing page | `share_inbound_visit` fired on mount | Any visit to a share landing where the visitor's PostHog `distinct_id` ≠ the minter's `distinct_id` (correlate by `jti` event property + PostHog's first-party cookie) |
| #33 kill screen | Same as #32 with `variant=kill` in the token's URL query | `share_inbound_visit` with `variant: "kill"` query in referrer | Same as above, segmented by variant |

The aggregate measurement works without per-share row counts. We can answer "has the share mechanic produced ≥1 inbound conversion?" by querying PostHog for any `share_inbound_visit` event with `distinct_id` different from any `share_card_minted` event's `distinct_id`. **That's the only question the epic asks.**

**Epic is done when:**
- [ ] All three stories merged and live in production
- [ ] PostHog dashboard shows at least 1 inbound event with a distinct_id different from the original sharer
- [ ] One Substack post (any of Posts #1–3) has been published with at least one of: a watermarked Gamma deck embed, a share-card OG preview, or a kill-screen screenshot
- [ ] Day-30 review (2026-06-10) considers share-mechanic data as one input

Note: the inbound conversion is the gate, not the ship date. All three stories may merge before any inbound event fires — that's expected. The epic is "done" infrastructurally after #33 merges; "validated" after the first inbound event lands.

---

## Steps summary (sequential)

1. **`/shipit`** story #31 — plugin agent footer edit (~30 min)
2. Manually verify #31 with one `/proveit` run
3. **`/shipit`** story #32 — JWT mint + share-card primitive (~3–4 h, smaller than original draft)
4. Manually verify #32 via LinkedIn Post Inspector
5. **`/shipit`** story #33 — kill-screen + reuse share-card route's variant flag (~3 h)
6. Manually verify #33 with injected localStorage session at mobile + desktop viewports
7. Publish Substack Post #1 with at least one share mechanic in play
8. Watch PostHog for the first inbound event — close epic #25 when it fires

---

## Out of scope (do NOT bundle)

- A/B testing different share-card layouts (defer to month 2)
- Per-share view counts (impossible by design — no DB; aggregate count via PostHog is sufficient)
- Custom OG cards per share platform (LinkedIn vs X — same card is fine for v1)
- Embedded analytics on `/s/[token]` (just track visits, don't show them publicly)
- Rate-limiting `/api/share-card` (low-cost endpoint, JWT verify is fast; rely on Vercel's built-in DDoS for now)
- A "delete this share" UI — there is no share to delete (the token's holder controls visibility by sharing the URL or not)
- #43 Anthropic key rotation (separate security item, deferred per Claire 2026-05-17)
