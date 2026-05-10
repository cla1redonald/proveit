# Session Handoff — 2026-05-10 (late afternoon)

**Recommended next focus:** Issue #20 monetisation test — ship the paid "ProveIt Bundle" surface designed in this session's gh comment. The integration design and test architecture are already drafted; only the build is left.

---

## Session Summary — Claude Design integration shipped (v3.5.0)

A focused afternoon session. One feature shipped, one strategic experiment scoped for next session.

### What landed

**v3.5.0 — Claude Design integration.** Spawned from the morning handoff's primary thread (Option A — "Claude Design integration with ProveIt"). Approached as observation-first: 5 probes against `claude.ai/design` driven via Playwright MCP, then 6 integration questions answered against what was observed, then design drafted, then `/shipit`. Three substantive changes to the agent prompt, one to the web app:

1. **Phase 9 gains two new outputs** — `design-brief.md` (synthesis any designer can read on its own) and `claude-design-prompts.md` (four paste-ready prompts pre-populated with the PM's evidence: deck, wireframes, logos, social cards).
2. **Phase 10 closing message rewritten.** Drops the apologetic "open claude.ai/design and paste discovery.md" wording. Surfaces three observed realities — the **Design systems** top-level tab as a one-time brand-token home, the **Handoff to Claude Code** button as a real round-trip, and the paste-ready prompts as the operational input. Bundle table updated to list 7 artefacts.
3. **Phase 7 + Phase 10 boundary tables nuanced.** BrandIt vs Claude Design now has a logo-overlap paragraph: BrandIt = one finished logo in a complete brand system; Claude Design = three exploratory directions with rationale in 3 minutes. They compose.
4. **Web app pointer.** Full Validation results view now points completed users to `/proveit` in Claude Code for the full bundle. Stays free for now; Issue #20 will replace this with a paid Stripe surface next session.

### How the design got grounded

A 5-probe study of `claude.ai/design`, driven autonomously via the Playwright MCP after one manual login. Probes 1–5: un-branded deck, branded deck, wireframes with all states, three logo concepts, and six social cards. The observations doc and design doc are at `.session-state/` (gitignored — session-only, not for source control). Key findings that landed in the integration:

- The canvas produces *much* better artefacts when the prompt carries specifics. Probe 1 (vague) made up plausible numbers; Probe 2 (brand + voice) produced a build-vs-buy table, a competitive matrix, and a mock daily digest UI. The prompts file encodes that.
- The **Design systems** tab is a top-level org-scoped artefact — brand tokens land there once, not pasted per project. The closing message tells PMs to do this once.
- The **Handoff to Claude Code** button means the canvas → Code direction is a real round-trip, not a wish. This changed how Q3 (Phase 7.5 vs Phase 10) was answered.
- The Wireframe sub-mode wants to interview you first by default. Prompt 2 in `claude-design-prompts.md` explicitly says "Skip the interview".
- Claude Design produces three exploratory logo directions in 3 minutes with vector/HTML output and per-direction rationale. This *meaningfully* threatens BrandIt's DALL-E logo step but only that — the rest of BrandIt (palette, type pairing, design tokens) is unaffected. The boundary table now reflects this.

### Issue #20 — concrete monetisation test scoped (not yet built)

Mid-session, the question of "how does the web app's design-bundle handoff work" forced the deferred strategic decision. Captured the design as a comment on issue #20: [issue #20 comment](https://github.com/cla1redonald/proveit/issues/20#issuecomment-4415247134). The test is **deliberately separated from this PR** so results can be attributed cleanly to either ship.

The test design (next session focus):

- **Product:** "ProveIt Bundle" — the 5 files (`discovery.md`, `brand.md`, `spec.md`, `design-brief.md`, `claude-design-prompts.md`) emailed to the buyer
- **Price:** single tier (not yet decided — gut £19–£29; needs 30 min market scan)
- **Trigger:** end of a Full Validation web session, **replacing** the current waitlist email-capture
- **Delivery:** Stripe payment link → success webhook → Resend email with files → Supabase order row. No custom checkout, no auth, no download portal.
- **Metric:** conversion rate of completed Full Validations → paid bundle. Free fallback = the CLI pointer that v3.5.0 just shipped.

---

## Current State

- **Branch:** `feat/claude-design-integration` (this branch). PR pending after `/shipit` review and merge cycle completes.
- **Last commits on branch:** four logical chunks — Phase 9 outputs / Phase 10 + boundary nuance / web pointer + test / docs.
- **Production deploy:** [proveit-web-zeta.vercel.app](https://proveit-web-zeta.vercel.app) — Ready, last verified end-to-end this morning before this session.
- **Tests:** **230/230** passing in `web/` (227 + 3 new for `FullBundlePointer`). Plugin agent prompts have no automated tests (markdown specs only).
- **Lint / typecheck / build:** all clean.
- **Open PRs:** 1 (this work, pending merge).
- **Open GitHub issues:** 3 — #20 (GTM/monetisation strategy — scoped this session, build deferred), #21 (web product roadmap, blocked on #20), #22 (Tier 2 + Tier 3 abuse prevention, deferred).
- **Vercel env vars in production:** unchanged from morning — `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DAILY_SPEND_CEILING_USD=1`, `PER_IP_DAILY_CEILING_USD=1`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL=cla1re@me.com`. Issue #20 build will need `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- **Supabase project:** `proveit-web` (`bbpdicijaqoujnpidiho`). Issue #20 build will add an `orders` table.
- **Resend account:** unchanged (sandbox sender; domain verification still pending — see Housekeeping).
- **Lenny MCP:** installed at user scope. Active in any new Claude Code session.
- **Playwright MCP:** installed during this session; useful for any future hands-on UI verification work.

---

## Defence-in-depth currently protecting the live URL

| Layer | What it stops |
|---|---|
| `x-real-ip` IP detection | Spoofed `x-forwarded-for` headers |
| Per-IP rate limit (chat 5/min, fast 10/min) | Single-machine bursts |
| Per-IP daily spend ceiling ($1) | Sustained single-user abuse |
| Global daily spend ceiling ($1) | Viral distribution / aggregate abuse |
| 90s app-level Anthropic timeout | Hung streams burning credits |
| `text/event-stream` + `no-transform` headers | CDN buffering breaking streaming |
| `server-only` import guards | Anthropic key reaching client bundle |
| Supabase RLS + anon-INSERT-only policy | Unauthorised reads of the waitlist |
| Email capture form on 503 | Lost portfolio-interest signal at the friction moment |
| Real-time Resend notification | You finding out about signups days later |
| **CLI bundle pointer on Full Validation completion** | Lost intent at the moment of high-value signal — funnels engaged users to the CLI today; will fund the paid bundle test tomorrow |

---

## Pending threads (pick one for the next session)

### A — Issue #20 monetisation test (recommended, scoped this session)

The first concrete monetisation surface for ProveIt. Design captured at [issue #20 comment](https://github.com/cla1redonald/proveit/issues/20#issuecomment-4415247134). Build scope is small: Stripe payment link + Resend email delivery + Supabase order row + a UI swap on the validation results view (the current `FullBundlePointer` becomes a paid CTA, with the CLI pointer as the fallback below it). Decisions still open: price tier, refund copy, exact trigger placement.

To run: open this directory, read the issue #20 comment, run `/proveit` against "what should the price tier be?" if you want a structured price-test. Otherwise jump straight to a `feat/proveit-bundle-paywall` branch.

### B — Strategic validation: paid product vs portfolio piece (still relevant if #20 needs more thought)

Tracked as Todoist task `6gc9RjXVxFMFFwJG` (p3) and #20. The #20 monetisation test *is* the operationalised version of this question — but if you want strategic clarity *before* building the test (positioning, pricing rationale, brand voice), the existing `~/code/proveit-strategy/` directory is set up to run `/proveit` against this exact question.

### C — Run ProveIt v3.5 against a real idea (Wedding Speech Roaster)

The matured plugin (now with `design-brief.md` + `claude-design-prompts.md`) hasn't been exercised against a real idea since v3.2. The Wedding Speech Roaster validation queued in Todoist `6gc9RjXVxFMFFwJG` was the natural first run. Will surface whether:
- The two new design outputs feel like a bundle, or are redundant with each other
- The design-brief's "hero scenario" section gets enough specificity from a normal `discovery.md`, or needs one extra question
- The Claude Design prompt-population works (i.e. brackets all resolve cleanly)

### D — Tier 2 abuse prevention (only if signals warrant)

Issue #22 captures the full design. Useful only if Tier 1 ceilings start tripping in real usage. No signal yet.

### E — Verify a domain in Resend (small housekeeping; will be needed for #20 anyway)

Currently sending notifications from `onboarding@resend.dev` (sandbox). For the paid-bundle test (#20), order receipts and bundle-delivery emails will both come from Resend — domain verification stops them landing in spam. ~10 min if you have DNS access.

### F — Plugin file split

`agents/proveit.md` is now ~2150 lines (added 250 in v3.5). Still readable, but at this size worth considering a multi-file split.

---

## Resume Prompt

Pick a focus from above (or your own), then in a fresh Claude Code session:

```bash
cd ~/code/proveit
claude
```

Paste this — edit the focus line for whichever thread you want:

```
/preflight

Then: read HANDOFF.md in this directory. The focus this session is [PICK ONE]:

  Option A — Issue #20 monetisation test: build the paid "ProveIt Bundle"
             surface designed in the issue #20 comment. Stripe payment link,
             Resend email delivery, Supabase orders table, swap the
             FullBundlePointer for a paid CTA + CLI fallback. The strategic
             frame, the test design, and the success metric are all already
             in the issue. Decisions still open: price tier, refund copy.

  Option B — Strategic validation in ~/code/proveit-strategy/: paid product
             vs portfolio piece. Open that directory's HANDOFF.md.
             Re-frames as "what should #20's price tier be?" given v3.5.0
             just shipped the technical foundation.

  Option C — Run /proveit on the Wedding Speech Roaster idea against the
             matured v3.5 plugin (now with design-brief.md and
             claude-design-prompts.md). Surfaces whether the two new design
             outputs feel coherent and whether prompt slots resolve cleanly
             from real discovery.

  Option D — Verify roami.group (or another domain) in Resend so notification
             and order-receipt emails come from a real domain. Required for
             Option A's paid bundle delivery to land in inboxes, not spam.

  Option E — Plugin file split: agents/proveit.md is 2150 lines after v3.5.
             Confirm whether Claude Code's plugin model supports a multi-file
             split with agents/proveit.md as an index, then refactor.

Plugin-side improvements ship freely. Web app product work stays gated on
#20 (the strategic decision in option A/B).
```

End-of-session expectation: a release for whatever ships, plus an updated HANDOFF.md.

```
Pick a single option and delete the others before you paste — keeps the session focused.
```
