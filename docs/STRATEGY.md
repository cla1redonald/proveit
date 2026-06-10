# ProveIt — Strategy
Closes GitHub issue [#20](https://github.com/cla1redonald/proveit/issues/20).
Date: 2026-05-10.
Authored from a /proveit validation; full reasoning in `discovery.md`, `research-1.md`, `swarm-1-*.md`, `pre-mortem-1.md`.

---

## What this is

ProveIt is a structured, evidence-based pre-PRD product validation tool for product managers. It takes a raw idea through Desirability / Viability / Feasibility assessment using named methodologies (Bob Moesta JTBD, Annie Duke pre-mortem, Teresa Torres continuous discovery, Madhavan Ramanujam pricing, Hamilton Helmer 7 Powers, Sean Ellis PMF), then produces a multi-format handoff bundle the PM can take into their organisation.

Two surfaces: a Claude Code plugin (free, savvy users) and a web app at [proveit.tools](https://proveit.tools) (freemium, less-savvy users).

This document is the operational strategy for the 30-day launch. It is not "what ProveIt should be in three years." It is what to do next.

---

## Strategic frame

**Goal hierarchy** (decided by the validation):

1. **Primary: profile lift for Claire Donald** — inbound interest in her as a builder + thinker, expressed as DMs, consulting inquiries, speaking invites, hiring conversations, network expansion.
2. **Floor: cover infrastructure costs** — ~£40/mo MRR (Vercel + Anthropic API + Resend + GoDaddy + Supabase). 8 paying subscribers at £4.99/mo or 4 at £9.99/mo.
3. **Bonus: revenue beyond cost-cover** — open-ended. If it takes off, it takes off. Not the success metric.

This is not "product vs portfolio piece" — it is "low-income-tolerant Profile-primary launch with a falsifiable commercial floor and no commercial ceiling."

The Profile-frame's known risk (motivated reasoning that allows non-paying admirers to count as success indefinitely) is mitigated by the pre-committed kill criteria in `pre-mortem-1.md`.

---

## Audience

**Primary:** Time-pressed Senior PMs at growing post-PMF companies (Series A through later-stage growth, ~£20m–£200m revenue), who are competent and methodology-aware but don't have the time to build their own tools, and are under cultural pressure to demonstrate AI usage in their role.

**Real-person anchor:** Gemma at MOO (£100m ecommerce). Sharp, knows her stuff, savvy but not enough to build her own tools.

**What they do today:** Free ChatGPT or Claude tab + Notion AI / Miro Assist / Miro template. Not actively shopping for an alternative — using the default because it's already open in the browser.

**Switching dynamic:** Not classic Bob Moesta switching-forces. They aren't trialing alternatives. The activation barrier is awareness, not competing loyalty. **Distribution problem first, product problem second.**

**Secondary segments (de-prioritised, do not optimise for):**
- *Procurement-blocked PMs* at large/regulated orgs — real pain, harder to reach inside 30 days, addressable later via inbound.
- *Mid-size tech-enabled companies with weak product orgs* (Marta's Tier C persona) — B2B sale, reachable as side-door inbound from Profile-frame outcomes, not as primary GTM motion.

---

## Pricing model

**Shape C freemium — output split:**

- **Validation experience:** always free. No credit gating. No login. The full conversational discovery, research, scoring, and on-screen results visible without payment.
- **Bundle download:** paid. Two transaction shapes:
  - **One-off £4.99** — for "validate this idea, take artefacts, walk away" use. Procurement-friendly. Personal-card impulse threshold.
  - **Subscription £9.99/month** — for engaged ongoing use. Continuous access, multiple validations, ongoing content, tool-as-habit.

**Free vs paid line:** the validation conversation and on-screen results are *always free.* The downloadable bundle (Gamma deck, `spec.md`, `design-brief.md`, `claude-design-prompts.md`) is the paid gate. **Authentication: none on either side.** Stripe Checkout collects email at payment; bundle delivers via Resend; no account creation, no login, no portal.

**Payment subsystem (Phase 1 — implemented):** Real Stripe Checkout replaces the Wizard-of-Oz email-capture flow. The one-off £4.99 button POSTs to `/api/stripe/checkout`, which creates a Stripe Checkout Session and a `pending` order in Supabase (`public.orders`). On payment completion, the Stripe webhook (`/api/stripe/webhook`) marks the order `paid` and emails Claire for visibility, then kicks off automated fulfilment. The `subscription` (£9.99/mo) button is deferred to issue #37. The WoZ modal remains as a fallback for when Stripe keys are not yet configured (503 from the checkout route).

**Fulfilment pipeline (Phase 2/3 — implemented):** After a payment is confirmed, `fulfilOrder(orderId)` runs automatically (fire-and-forget from the webhook). The pipeline is idempotent and resumable:
1. Calls `composeDeckContent` — a single bounded Anthropic Haiku call (max 2048 tokens, JSON-only, no tools) that produces structured findings, recommendations, a "so what", and 3 text artifacts (spec.md, design-brief.md, prompts.md).
2. Emails the 3 text artifacts to the buyer (status: `artifacts_sent`).
3. Renders a branded HTML deck via `renderDeckHtml` (deterministic, html-deck system, ProveIt/Roami palette), stores it in Supabase Storage bucket `decks` at key `<orderId>.html`, and emails the buyer a shareable link at `/deck/<orderId>` (status: `deck_ready`).

On any failure: status is set to `failed` with the error message, and the error is logged loudly. The paid path never silently swallows failures.

**Deck system:** Uses Claire's html-deck template system (deck-stage.js, deck.css, colors_and_type.css copied verbatim to `web/public/deck-assets/`). Slides: cover (dark), confidence KPI grid, kill signals (ask/walk-away paired rows), findings, recommendations, close (dark). ProveIt palette: river `#2A5A52` + cream `#FAF6F1`. The shareable URL pattern is `proveit.tools/deck/<orderId>`.

**Go-live steps (human action required):**
1. Apply the Supabase migration: `web/supabase/migrations/0001_create_orders_table.sql` (via Supabase MCP or dashboard).
2. Set in Vercel env: `STRIPE_SECRET_KEY` (sk_live_…), `STRIPE_WEBHOOK_SECRET` (whsec_…), `STRIPE_PRICE_ID` (optional, £4.99 GBP price), `SUPABASE_SERVICE_ROLE_KEY`.
3. Register the Stripe webhook at https://dashboard.stripe.com/webhooks → `checkout.session.completed` → `https://proveit.tools/api/stripe/webhook`.

**Why this shape:** The WhatsApp friend's unprompted reaction ("impressed with the live AI without any credit gating/logins") is the empirical signal. Any monetisation move that re-introduces credit gating or login walls on the free experience destroys exactly what makes the product work. Paid converts at the moment of highest commercial intent — when the user has decided to act on the validation and needs the artefacts in their hands.

**Plugin pricing:** always free. Developer-ecosystem gift to savvy users. Not a monetisation surface.

---

## Differentiation

Two structural differentiators no other PM creator launching this month can credibly claim:

### 1. Active disagreement

ProveIt is the only PM tool that tells you *your idea might be bad.* Notion AI helps you write the PRD faster; ChatGPT helps you elaborate what you already think; Miro templates give you somewhere to put thinking. **None of them push back.** ProveIt asks Bob Moesta's switching-forces questions, applies Sean Ellis's PMF discipline, runs an Annie Duke pre-mortem, and produces kill signals on demand.

The shareable artefact this enables: a tool that told its user to *stop building something* is almost unheard-of in PM public discourse. Screenshot-able. Quote-able. The kill-signal output screen is the most strategically distinctive output ProveIt produces.

### 2. Air-gap bundle

ProveIt's multi-format output bundle (Gamma deck + `spec.md` + `design-brief.md` + paste-ready Claude Design prompts + validation playbook) crosses the air-gap into orgs where ChatGPT isn't approved, and creates *visible proof of AI usage* for the PM's manager. Notion AI generates Notion docs that stay inside Notion. ProveIt produces takeaway artefacts that travel.

This is the "must show I'm using AI" cultural pain at Series A-B addressed at the artefact layer.

**The actual moat (per Phase 5 swarm):** *the verifiable shipped artefact + named methodology operationalised into running software.* GitHub commit history is timestamped. proveit.tools is live. v3.5 ships. The Roami background is practitioner-current. **No other PM creator currently active can claim this combination without doing the same work.**

---

## Positioning

**One-line:** *"The PM validation tool that tells you when your idea is bad."*

**Strategic narrative spine** (Andy Raskin frame, used in long-form content):

> *AI made it cheap to build wrong products. ProveIt is the gate before the build.*

The PostHog "Product management is broken" piece (Dec 2024) and the 2025 Medium "AI makes it cheaper to produce bad work at scale" essay are external pre-validation evidence the audience already accepts the diagnosis. ProveIt names the response.

**Market category to define and own:** *"pre-PRD validation."* Not "AI for PMs" (saturated). Not "PM tooling" (commoditised). Not "build in public" (genre, not category). The pre-PRD validation category is currently undefined — ProveIt is positioned to define it before the next 50 PM creators rush at the same theme.

---

## 90-day GTM motion (operational plan)

### Days 1–7 — Private signal, no public content

- **Pre-commit kill criteria.** Read `pre-mortem-1.md`. Internalise.
- **Replace `FullBundlePointer` with WoZ email-capture CTA** (~3h work). Add PostHog or Vercel Analytics. **Raise global spend cap from $1/day to $5/day** before any public traffic arrives.
- **Write Post #1.** Headline: *"What ChatGPT won't tell you about your product idea."* Open with the recognisable failure scene (PM presenting a PRD that engineering quietly stops believing). Name the gap. Introduce ProveIt via a real kill-signal output. End with an invitation to try it. This post earns the reader before announcing the Substack.
- **DM 5–10 friends individually** (not group blast). Personal message. Specific ask: try proveit.tools with a real idea, tell me which payment option (£4.99 one-off or £9.99/mo subscription) you feel drawn to and why.
- **Set up Substack** (name, about page, welcome email). Begin Substack Notes — daily standalone PM-validation observations.

### Days 8–14 — Plant the stake publicly

- **Day 8: Assess WoZ.** ≥2 friends expressing genuine payment intent → start Stripe one-off build (~3 days). 0 conversions → investigate before building.
- **Day 10: Publish Post #1.** Email it to the 5–10 WoZ friends first ("would love your honest reaction"). Then LinkedIn native post (full argument, Substack as "go deeper"). Personal DM to 15–20 warm contacts (former colleagues, MOO network, Roami contacts).
- **Notes daily.** Reply to engagement within 4 hours.

### Days 15–21 — Demonstrate the instrument, not just the argument

- **Write Post #2:** *"How I built active disagreement into a PM validation tool — and why most AI tools won't do this."* Sycophancy in AI; how ProveIt counteracts it; one concrete kill-signal example.
- **Hacker News Show HN.** Lead with technical architecture (Claude Code plugin, multi-agent swarm, cross-model review). Tuesday–Thursday 10am–12pm US Eastern. Respond to every comment within 2 hours.
- **Post #2 published.** LinkedIn native post. One PM community contribution (Lenny's community) — substantive thread reply, not promo.

### Days 22–30 — Convert attention; assess

- **Write Post #3:** *"I gave ProveIt to 7 PM friends. Here's what it found."* Real WoZ data. Real screenshots of kill signals. Real pricing reactions. The most-likely-to-travel post because it's evidence, not argument.
- **One amplifier reach.** PM newsletter writer with 5k–20k subs whose content overlaps. Offer (not pitch): "ProveIt might be genuinely interesting to your readers — here's a free validation to try."
- **Day 28: WoZ debrief.** Publish findings as short Substack post or Note.
- **Day 30: Honest day-30 review against `pre-mortem-1.md`.**

### After day 30 (only if kill criteria hit)

- **Stripe subscription billing** (not just one-off). Bundle delivery automation.
- **Miro/Notion output artefacts** as moat-maintenance against Notion AI / Miro Assist trajectory (the swarm Defensibility agent flagged this as month-2 work, not day-1).
- **Second amplifier push.** Repeat the Post #3-equivalent monthly with new validation data.

---

## What Substack post #1 says (the load-bearing artefact)

This is the single most strategically important deliverable in the 30-day plan. It must:

- **Lead with a recognisable failure scene** the target persona has lived. PM-engineering moment of truth.
- **Name the change in the world** (Andy Raskin step 1) — *AI made it cheap to produce bad PRDs at scale.* Cite PostHog. Cite the 2025 Medium piece.
- **Identify the protagonist's choice** — keep producing bad work cheaper, or install a discipline that pushes back.
- **Show, don't tell, the kill signal.** Real example of ProveIt producing a "this idea is probably bad" output. Screenshot-shareable.
- **Invitation** — try proveit.tools. No login.
- **Stake the category.** Not "AI for product validation." *Pre-PRD validation.*

Length target: 1,500–2,500 words. Time-to-first-publish: 5–7 days from drafting start. **This is not a blog post; it is the launch.**

---

## Kill criteria (summary — full version in `pre-mortem-1.md`)

By **day 30 (June 10, 2026)**, ALL THREE must be true:

1. **≥200 Substack subscribers**
2. **≥1 WoZ conversion** (one friend paid AND can articulate a specific use of the bundle — not just social-obligation purchase)
3. **≥1 unsolicited inbound inquiry** from a stranger outside the friend cohort

If all three hit → continue, build month-2. If subs <100 AND zero conversions AND zero inbound → do not quit, but do not add features; rewrite Post #1 with a new angle and run another 30 days. Conditional outcomes documented in `pre-mortem-1.md`.

The "I will be fine with low income as long as it raises my profile" stance is honest *and* doing motivational work. The kill criteria are what make it falsifiable rather than infinitely extensible.

---

## What this strategy explicitly does NOT do

- **Does not build for Tier C (org sales) in the first 30 days.** Org-sale motion is reachable later via inbound from Profile-frame outcomes, not built toward.
- **Does not optimise for revenue.** Cost-cover floor is the only revenue success metric. Above that is bonus.
- **Does not chase virality.** Substack Notes + warm-network + HN + one amplifier = adequate distribution surface for the goal. No paid acquisition. No content sprint.
- **Does not ship Miro/Notion output integrations in month 1.** Those are month-2 moat-maintenance work; out of scope for the 30-day launch.
- **Does not enable Substack paid tier in month 1.** Free Substack only. Paid tier is a future decision after subscriber base exists.
- **Does not pursue speaking, podcasts, or courses in month 1.** Inbound only. Outbound monetisation is a year-2+ outcome.
- **Does not commit to writing past Post #3 unless the kill criteria hit.** This is not a rolling commitment; it is a 30-day experiment with explicit re-evaluation.

---

## Confidence (entering the launch)

Per `discovery.md` Phase 4 + 5 final synthesis:

- **Desirability: 8/10.** External validation (PostHog, Medium quote) + cold-start friend journey + named-positioning land make demand credible.
- **Viability: 6/10.** WoZ test gates this. Worst weakest score; correctly so.
- **Feasibility: 8/10.** Product exists; build is achievable; single-dev sustainability is the ongoing risk.

The launch is the test. The kill criteria are honest.

---

## Closing

ProveIt is a real product that has been deferred from a strategic question for two weeks. The deferral has now resolved. The strategy is:

> Profile-primary, cost-covered, low-income-tolerant, methodology-led, output-monetised, sequenced over 30 days, and falsifiable at day 30.

Issue #20 is closed. Execution starts day 1.

---

*Authored: 2026-05-10. Basis: 7-agent swarm synthesis, Phase 0–5 validation in `discovery.md`, research in `research-1.md`, pre-mortem in `pre-mortem-1.md`. To revise: edit, sign, and date the change.*
