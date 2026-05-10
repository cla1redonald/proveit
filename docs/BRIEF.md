# ProveIt — Brief

For PR, marketing, content, and design agents working on or alongside ProveIt. Read this first; it's the audience / positioning / voice summary. Engineering and execution detail lives in `docs/STRATEGY.md`, `HANDOFF.md`, and the [Project board](https://github.com/users/cla1redonald/projects/4) — you usually don't need them.

Last updated: 2026-05-10. Current launch window: 30-day public launch begins after pre-launch epic #24 completes.

---

## What ProveIt is, in one line

**The PM validation tool that tells you when your idea is bad.**

It is an evidence-based pre-PRD validation tool for product managers. PMs feed it a raw idea; it runs them through structured discovery, automated market research, and a 10-agent adversarial swarm anchored in named methodologies (Bob Moesta, Annie Duke, Teresa Torres, Madhavan Ramanujam, Hamilton Helmer, Sean Ellis); it produces a multi-format handoff bundle they can take into their organisation. Two surfaces:

- **`/proveit` Claude Code plugin** — free, full-fidelity, for technical PMs. Open source on GitHub.
- **[proveit.tools](https://proveit.tools) web app** — freemium, conversational, no-login, no-credit-gating front door.

---

## Strategic frame (what we are doing, and what we are explicitly not doing)

ProveIt is in a **30-day public launch window** beginning after pre-launch infrastructure ships. The strategic frame, decided 2026-05-10:

- **Profile-primary.** Success is inbound interest in Claire as a builder + thinker (DMs, consulting inquiries, speaking invites, hiring conversations). Not paying users.
- **Cost-covered.** Floor metric: ~£40/month MRR (~8 paying users) covers infrastructure costs.
- **Low-income tolerant, no ceiling.** Comfortable staying small. Open to it not staying small.

We are explicitly **not**: chasing virality, optimising for revenue, building for enterprise / B2B sales, enabling Substack paid tier in month 1, pursuing speaking / podcasts / courses outbound, or adding user accounts.

Day-30 review: **June 10, 2026.** Three pre-committed numbers must all hit (200 subs + 1 unsolicited inbound + 1 WoZ conversion with articulated use). If they don't, the launch is reassessed honestly — Annie Duke pre-mortem discipline is load-bearing.

---

## Audience

**Primary:** Time-pressed Senior PMs at growing companies (Series A through later-stage growth, ~£20m–£200m revenue) who are competent and methodology-aware but don't have time to build their own tools, and are under cultural pressure to demonstrate AI usage in their role.

**Real-person anchor:** Gemma at MOO (£100m ecommerce). Sharp PM, knows her stuff, savvy but not enough to build her own tools.

**What they do today:** Free ChatGPT or Claude tab + Notion AI / Miro Assist / a Miro template. Not actively shopping for an alternative — using the default because it's already open in the browser. **Activation barrier is awareness, not competing loyalty.** This is a content-first launch, not a feature-first launch.

**Secondary segments (deprioritised for the 30-day launch):**
- Procurement-blocked PMs at large/regulated orgs — real pain, addressable later via inbound
- Mid-size tech-enabled companies with weak product orgs — B2B sale, side-door inbound only

**Dual reader on Substack — read this before drafting Substack posts.** ProveIt content on `cla1redonald.substack.com` will be read by **two distinct audiences** in the same inbox:

1. **PMs evaluating ProveIt as a tool** — the primary product audience above. They want to know if it'll help them validate ideas, what the kill-signal output looks like, whether it's worth a £4.99 download.
2. **Roami buyers** (fractional CPTO clients, advisory leads, NED prospects, AI-leadership hiring contacts) reading ProveIt posts as **evidence of Claire's capability**. They're not buying the tool; they're evaluating Claire-as-builder. The methodological discipline behind ProveIt (10-agent swarm, named methodologies, kill criteria, build-in-public) IS the Roami pitch in active form.

Posts should target the PM audience as the primary read, but **don't suppress the second-order Roami signal** — it's a feature, not a leak. A post that walks a PM through ProveIt's adversarial discipline simultaneously demonstrates Claire's operating model to a fractional buyer. Treat the dual readership as designed, not accidental.

---

## Narrative spine

Use this Andy Raskin frame for any long-form content:

> **AI made it cheap to build the wrong thing. ProveIt is the gate before the build.**

External evidence the audience already accepts the diagnosis (cite where natural):

- **PostHog (Dec 2024) — "Product management is broken. Engineers can fix it."** Engineers receive "a sanitised version of the truth that prevents good decisions." Widely shared.
- **2025 Medium piece** quote: *"A beautifully structured AI-generated PRD with named personas and competitor analyses had none of it validated, with the PM spending 10 minutes generating it and zero minutes questioning it."* This is the ProveIt thesis stated in the wild without ProveIt being involved.

The pain isn't *"PMs need better tools"* — it's *"PMs are afraid of looking underprepared to engineering, and AI made it easier to look prepared without being prepared."* Lead with social-cost pain, not productivity pain.

---

## Two differentiators (the only two)

### 1. Active disagreement

ProveIt is the only PM tool that tells you your idea **might be bad**. Notion AI helps you write the PRD faster; ChatGPT helps you elaborate what you already think; Miro templates give you somewhere to put thinking. None of them push back. ProveIt asks switching-forces questions, applies PMF discipline, runs a pre-mortem, and produces **kill signals** on demand.

The shareable artefact this enables: a tool that told its user to *stop building something* is almost unheard-of in PM public discourse. Screenshot-able. Quote-able. The kill-signal output screen is being designed specifically for screenshot-sharing.

### 2. Air-gap bundle

ProveIt produces a multi-format output bundle (Gamma deck, `spec.md` for engineering, `design-brief.md` for designers, paste-ready Claude Design prompts, validation playbook) that:

- Crosses the air-gap into orgs where ChatGPT isn't approved (corporate AI policy)
- Creates **visible proof of AI usage** for the PM's manager — answering the "must show I'm using AI" cultural pressure
- Travels naturally — every shared Gamma deck carries a "Made with ProveIt" footer (acquisition mechanic)

---

## Voice

| Do | Don't |
|---|---|
| Confident and direct | Marketing-speak, hedging, AI-product-launch tone |
| Opinionated and specific | Vague, balanced, "both sides" framings |
| Methodology-anchored when relevant — name Bob Moesta, Annie Duke, Teresa Torres specifically | Generic appeals to "expertise" or "best practices" |
| British English — "proveit.tools," "validation," not "validator" | American spellings, marketing-blog clichés |
| Active disagreement as a feature, not a footnote | Soft-pedalling the "tells you when your idea is bad" framing |
| Practitioner credibility — Claire built this, runs it, uses it | Corporate "we" voice |
| Real numbers, real entities ("23 minutes a day, 47 engineers, June 5 deadline") | Made-up plausibles ("studies show," "many PMs report") |
| Build-in-public — show the GitHub commit history, the live URL, the v3.5 release | Tease product features in a way that implies a roadmap that doesn't exist |
| Lead with social-cost pain (don't get caught with a half-baked PRD) | Lead with productivity savings (PMs are skeptical of efficiency claims) |

**On the engineering-whinge framing:** the underlying phenomenon is real and validated, but the word *"whinge"* is internal Claire-language and would alienate engineers in public copy. Use *"engineers quietly stop believing the briefs"* or *"the brief that engineering writes off as another vague spec"* instead.

---

## Pricing (when relevant in copy)

**Shape C freemium:**
- Validation experience always free. No credit gating, no logins.
- Bundle download is paid. Two transaction shapes:
  - **£4.99 one-off** — for "validate this idea, take artefacts, walk away"
  - **£9.99/month subscription** — for engaged ongoing use

Currently a Wizard-of-Oz email-capture (no real Stripe checkout yet — pricing is being tested with a friend cohort first). Real Stripe integration ships only if WoZ converts.

Plugin: always free. Open source on GitHub. Developer-ecosystem gift.

---

## Distribution / channels

In priority order (per the Phase 5 swarm GTM agent):

1. **Substack — [`cla1redonald.substack.com`](https://cla1redonald.substack.com) ("In the work")** — the primary channel. **Shared publication with Claire's other published work** (Roami / personal brand). Three posts in 30 days are *specifically about ProveIt*; the publication itself is broader. Substack Notes daily. The reader subscribes to Claire-as-thinker; individual posts should target ProveIt's audience cleanly without leaning on Roami brand context.
2. **LinkedIn** — Claire's warm network. Native posts (not link drops). DMs > posts.
3. **Personal outreach** — friend-cohort DMs for the WoZ test, then warm contacts in week 2.
4. **Hacker News** — Show HN in week 3, lead with technical architecture (multi-agent swarm, cross-model review). Low-downside technical-audience bet.
5. **PM communities** (Lenny's, Mind the Product) — substantive thread contributions only, not promo.
6. **One amplifier reach** — a PM newsletter writer (5k–20k subs) in week 4 with an offer (free validation), not a pitch.

Out of priority: paid acquisition, podcasts, conferences, partnerships, influencer outreach.

---

## Substack post topics (in order of publication)

| # | Headline (working) | Tone |
|---|---|---|
| 1 (week 2) | *What ChatGPT won't tell you about your product idea* | Diagnostic provocation. Names the AI-cheap-bad-PRDs problem. Introduces ProveIt via a real kill-signal output. |
| 2 (week 3) | *How I built active disagreement into a PM validation tool — and why most AI tools won't* | Methodology + technical credibility. Make Claire visible as a thinker. |
| 3 (week 4) | *I gave ProveIt to 7 PM friends. Here's what it found.* | Real WoZ test data. Real screenshots. The shareable evidence post. |

Post #1 is **the load-bearing artefact of the entire 30-day launch.** Treat its drafting as more important than any product feature.

---

## Key dates

- **Day 1** — Launch sequence begins (post pre-launch epic completion)
- **Days 1-7** — Private signal: WoZ friend-cohort test runs, Post #1 drafted
- **Day 10** — Post #1 published (Substack + LinkedIn + warm-network DMs)
- **Day 18** — Post #2 published. Hacker News Show HN
- **Day 26** — Post #3 published (with WoZ data)
- **Day 30 (June 10, 2026)** — Honest day-30 review against pre-committed kill criteria

---

## Things that would be useful but are out of scope right now

For PR/marketing agents who might be tempted to propose these:

- **Press outreach** — out of scope for the 30-day launch. Profile-frame growth is content-led, not earned-media-led.
- **Podcasts / interviews** — outbound monetisation is year-2 work. Inbound only.
- **Influencer / creator collaboration** — except the one amplifier reach in week 4 with a single PM newsletter writer.
- **Paid social / search ads** — explicitly not doing. The launch tests whether organic + warm-network reach can produce the Profile-frame outcomes.
- **Co-branded content with adjacent tools** (Notion, Miro, etc.) — out of scope.
- **Brand identity development** — ProveIt deliberately does not have a formal brand system. The strategy is to keep it independent of Roami's brand. Don't propose brand work for the 30-day window.

If a strong opportunity in any of the above lands inbound (e.g. a PM podcast asks Claire to come on), it can be evaluated case-by-case. Don't pursue.

---

## How this brief relates to Roami

**ProveIt is a Roami portfolio piece — an example of the work Claire does as Roami, not a firewalled venture.** ProveIt keeps its own user-facing brand (distinct domain, transactional sender, PM-facing voice) so the PM buying or trialling the tool gets a clean product experience. But in build-in-public storytelling and on the shared Substack, ProveIt is *"what Roami builds"* — evidence of Claire's capability, not a separate company.

What this means in practice:

- **PM-facing surfaces** (`proveit.tools`, in-product copy, transactional emails from `hello@proveit.tools`) stay branded as ProveIt only. The PM doesn't need to know about Roami.
- **Founder-narrative surfaces** (Substack posts, LinkedIn, GitHub README, conference talks, profile pages) **can and should frame ProveIt as "what I built at Roami"** or "an example of the Roami AgentOps approach" when the framing serves the piece. That's the Roami credibility signal — don't artificially scrub it.
- **Substack** (`cla1redonald.substack.com` "In the work") carries both Roami advisory thinking AND ProveIt build/launch posts. The implicit through-line is "Claire builds and advises on AI-native operating models" — ProveIt is one such build.
- **Domain split stays**: `proveit.tools` for the product, `roami.group` for advisory; `hello@proveit.tools` is product-side transactional, `claire@roami.group` is founder-side.
- **Editorial coordination on the shared Substack**: ProveIt's launch (days 10/18/26) lands during Roami's Phase Q quiet period — no collision now. When Roami exits Phase Q (~mid-June), slot coordination matters so the two streams don't compete same-week.

For PR/marketing agents: a piece on Claire-as-builder bridges both naturally; that's not the exception, that's the through-line. **Don't separate them artificially in the founder narrative — the connection is the value proposition.**

---

## Where to go for more depth

- **`docs/STRATEGY.md`** — the operational strategy. Audience persona detail, pricing model rationale, full 30-day launch sequence, kill criteria.
- **`docs/strategy-pre-mortem.md`** — the Annie Duke pre-commit. The three falsification criteria for the launch.
- **`HANDOFF.md`** — engineering / next-Claude-session execution context. Probably not relevant to PR/marketing work.
- **[Project board](https://github.com/users/cla1redonald/projects/4)** — implementation backlog (4 epics, 15 stories).
- **[GitHub issue #20](https://github.com/cla1redonald/proveit/issues/20) — the strategic decision archive** (closed). Has the closing comment summarising the decision in one paragraph.

Questions about voice, audience, or positioning: read this brief first; if it doesn't answer, defer to `docs/STRATEGY.md`. If still unanswered, ask Claire directly — don't invent.
