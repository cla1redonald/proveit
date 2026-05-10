# Spec: Swarm Expansion, Adaptive Fast Check, Wave 3

**Date:** 2026-05-10
**Status:** Implemented
**Related plan:** [`docs/plans/2026-05-10-swarm-expansion-fastcheck-wave3.md`](../plans/2026-05-10-swarm-expansion-fastcheck-wave3.md)

This spec is the implementation contract — required structures for the new outputs, agent prompt anchors, and the selection logic for the new tiers. The plan doc covers *why*; this doc covers *what exactly*.

## 1. Three new swarm agents

### 1a. Defensibility / Moat — `swarm-N-defensibility.md`

**Tier:** Default. Always runs unless explicitly removed by PM.

**Anchored by:**
- **Hamilton Helmer — *7 Powers* (canonical book).** The seven powers: Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power.
- **Brian Balfour — 4-Step Defensibility Cycle.** Step Zero (market conditions met) → Step One (build a moat) → Step Two (platform opening) → Step Three (platform closing — control and monetise).
- **Peter Deng — Proprietary data flywheels.**
- **Dan Hockenmaier — Marketplace defensibility (network effects, liquidity, asymmetric information).**
- **Reid Hoffman — Network effects, value-for-Nth-user.**

**Required to find:**
- Which of Helmer's 7 powers apply now
- Which can be acquired
- Which structurally cannot
- Concrete examples of competitors that copied a similar idea
- Specific year-1 defensibility moves

**Output structure:** standard swarm-agent format (Thesis / Evidence / Risks to This Position / Overall Confidence) with mandatory subsection "## 7 Powers Mapping" using a table.

### 1b. AI Commoditization — `swarm-N-ai-commoditization.md`

**Tier:** Default-on-conditional. Skip only if idea has zero AI surface.

**Anchored by:**
- **Ben Horowitz — Strategic AI / "AI lowers the floor, doesn't raise the ceiling".**
- **Chip Huyen — *Designing Machine Learning Systems* (canonical book) / production ML reality.**
- **Claire Vo — AI products in practice / wrapper-vs-product distinction.**
- **Brian Balfour — Defensibility cycle for AI products specifically.**
- **Dan Hockenmaier — AI economics, token-cost compression.**
- **Mike Krieger (Anthropic CPO, ex-Instagram) — AI-native vs AI-feature.**

**Required to find:**
- Capabilities OpenAI/Anthropic/Google shipped as defaults in past 12 months that previously required a startup
- Foundation-model roadmap signals for next 12 months in this category
- Examples of wrapper businesses absorbed by the model layer
- Unit economics at current and projected token prices

**Output structure:** standard format + mandatory "## Wrapper-vs-Product Test" subsection answering: "Does this sell access to a model, or sell an outcome the model alone can't deliver?"

### 1c. Regulatory / Compliance — `swarm-N-regulatory.md`

**Tier:** Default-on-conditional. Skip if idea is clearly in an unregulated category.

**Triggers (ANY of):** health, finance, kids' content, data privacy, employment, lending, education accreditation.

**Anchored by:**
- **Geoffrey Moore — *Crossing the Chasm* (canonical book) / regulated-market chasms.**
- **Hilary Gridley — Building in regulated industries.**
- **David Singleton — Regulated platform thinking.**

**Standard regulatory taxonomy to evaluate:** GDPR/UK GDPR, CCPA, COPPA (kids), HIPAA (US health), SOC 2, ISO 27001, PCI-DSS (payments), accessibility (WCAG / EAA), employment law per jurisdiction, financial-services licensing (FCA, SEC, MAS, etc.).

**Required to find:**
- Which regulations apply in target jurisdictions
- Typical cost and timeline of getting compliant (specific dollar figures and months)
- Examples of analogous startups hitting walls or navigating successfully
- Enforcement action history in the category
- The compliance-moat question — does regulation protect or block this idea?

**Output structure:** standard format + mandatory "## Regulatory Map" subsection (a table per applicable regulation: which one, scope, cost-to-comply, time-to-comply, can-launch-without).

## 2. Customer Impact + Tech Feasibility fold-ins

### Customer Impact additions

The Customer Impact agent now has explicit retention/habit framing alongside the existing JTBD/discovery anchors. New named anchors in the agent prompt:

- **Adriel Frederick — Retention loops.**
- **Albert Cheng — Habit formation.**
- **Nir Eyal — *Hooked* (canonical book): trigger → action → variable reward → investment.**

### Technical Feasibility additions

The Tech Feasibility agent now has explicit operations/unit-economics framing for service-heavy ideas. New anchors:

- **Brian Tolkin — Operations-heavy product economics.**
- **Ray Cao — Service-heavy unit economics; software vs labour gross margins (70–80% vs 30–50%).**

## 3. Swarm composition: opt-out model

| # | Agent | Tier | Skip when |
|---|-------|------|-----------|
| 1 | Market Bull | Default | — |
| 2 | Market Bear | Default | — |
| 3 | Customer Impact (incl. retention/habit) | Default | — |
| 4 | Technical Feasibility (incl. operations) | Default | — |
| 5 | Devil's Advocate | Default | — |
| 6 | Defensibility / Moat | Default | — |
| 7 | GTM / Distribution | Default-on-conditional | Captive audience already obvious |
| 8 | Pricing / Monetisation | Default-on-conditional | Pricing well-understood (e.g. standard SaaS per-seat) |
| 9 | AI Commoditization | Default-on-conditional | Zero AI surface |
| 10 | Regulatory | Default-on-conditional | Clearly unregulated category |

**Step 3 protocol:** ProveIt explicitly states the proposed full set + reasoning per agent before spawning. The PM gets one chance to drop or add. After confirmation, swarm runs to completion.

## 4. Adaptive Fast Check — 7-category catalog

Replace the hardcoded D/V/C in Step 2 of Fast Mode with a catalog. ProveIt picks the **3 most-likely-to-kill** for the specific idea profile.

| Category | Default for | Skip when |
|----------|-------------|-----------|
| Desirability | New categories, unfamiliar problems | Pain is well-documented |
| Viability | Paid products, especially B2B | Free / portfolio piece |
| Competition | Crowded landscapes | Genuinely novel space |
| Distribution | Consumer-facing, content-led | Captive audience |
| Defensibility | Anything that scales | Service-only, no software leverage |
| AI Commoditization | AI-powered ideas | Zero AI surface |
| Regulatory | Health, finance, kids, data, employment, lending, education | Clearly unregulated |

**Output protocol:** state the 3 chosen categories AND the reasoning for each, before researching. Each gets a `## Assumption N: [Category] — [Statement]` block in the research output, with verdict (Supported/Weak/Contradicted) and 2-4 cited evidence points.

## 5. Wave 3: Scenario & Experiment — `scenarios-N.md`

**Phase number:** 6.7. Optional. Offered after Phase 6.5 Pre-Mortem.

**Anchored by:**
- **Annie Duke — *Thinking in Bets* (canonical book) / probabilistic decision-making.**
- **Camille Fournier — Scenario planning in engineering orgs.**
- **Mike Krieger — AI product scenario thinking.**
- **Lane Shackleton — Experiment design.**
- **Teresa Torres — Assumption-test design (continuous discovery).**
- **Sean Ellis — PMF survey instrument (the actual survey copy is the artefact).**

### Required structure for `scenarios-N.md`

```markdown
# Scenarios [N]: [Idea Name]
Date: [date]
Methodology: Annie Duke probabilistic framing + Camille Fournier scenario planning + Mike Krieger AI-trajectory thinking (where applicable)

## Three plausible futures (12-month horizon)

### Scenario A — Best case
[2-3 sentences, specific market/competitor/user moves]
**Probability:** [X%]
**Confidence at end of year:** D[X]/V[X]/F[X]
**The one bet that has to come right:** [from pre-mortem-N.md's 3 critical bets]

### Scenario B — Expected case
[As above]

### Scenario C — Kill case
[As above, with detection signals]

**Probabilities sum to 100. Force the discipline.**

## Decision quality assessment
- Expected value of proceeding: [if quantifiable]
- Worst-case downside: [Scenario C's actual cost]
- Asymmetric upside check: [is upside ≥ 10x downside?]

## Experiment artefacts
For each of the 3 critical bets in pre-mortem-N.md, generate the actual artefact (not a description).

### Bet 1
**Falsification test:** [from pre-mortem]
**Artefact:**
[Real landing page copy / interview script with 8-12 ordered questions / pricing test page / technical spike spec — production-ready, not template]

### Bet 2 / Bet 3
[Same structure]

## Sequencing
| Order | Experiment | Cost | Information value | Decision it informs |

Order by information-value-per-cost. Cheap-and-high-info first.

## What this updates
After experiments run, update discovery.md and pre-mortem-N.md Live Bets. Execute kill criteria when bets fall — don't quietly extend deadlines.
```

### Critical property: artefacts are real

Wave 3's differentiator vs the Validation Playbook is that artefacts are *production-ready strings*, not descriptions. The PM should be able to copy a landing-page block out of `scenarios-N.md`, paste it into Webflow, and ship. Same for interview scripts (paste into Calendly/Notion), pricing tests, technical spike specs.

If Wave 3 produces "draft a landing page based on this brief" — the prompt failed. Reject and re-run.

## 6. New file structure

```
[project-dir]/
├── discovery.md                       # Index
├── research-N.md                      # Research rounds
├── swarm-N-market-bull.md             # Default swarm agents (6)
├── swarm-N-market-bear.md
├── swarm-N-customer-impact.md
├── swarm-N-technical.md
├── swarm-N-devils-advocate.md
├── swarm-N-defensibility.md           # NEW (default)
├── swarm-N-gtm.md                     # Default-on-conditional (4)
├── swarm-N-pricing.md
├── swarm-N-ai-commoditization.md      # NEW (default-on-conditional)
├── swarm-N-regulatory.md              # NEW (default-on-conditional)
├── swarm-N-synthesis.md
├── pre-mortem-N.md                    # Phase 6.5
├── scenarios-N.md                     # NEW Phase 6.7 — Wave 3
├── review-N.md
├── brand.md
└── spec.md
```

## 7. Verification

No automated tests for prompt structure. Verification is real-world:

- **Wedding Speech Roaster Fast Check** — should now pick Desirability + AI Commoditization + Distribution (not the old DVC default). First signal.
- **A full validation run** — should default to running all 10 swarm agents (with explicit reasoning per conditional) and grapple with defensibility, AI commoditization, regulatory where applicable.
- **Wave 3 artefacts** — should be paste-ready strings, not "draft a landing page" prompts. If templates, the prompt needs another pass.
- **Pre-mortem → spec.md success-metrics → scenarios-N.md → kill criteria** linkage should remain intact: the kill criteria from the pre-mortem are the success metrics in the spec, and the scenarios reference them by name.

## 8. New named experts added to the methodology

Surfaced from this expansion (cross-checked against Lenny's archive):

- **Hamilton Helmer** — *7 Powers* (Defensibility)
- **Peter Deng** — data flywheels (Defensibility)
- **Dan Hockenmaier** — marketplace defensibility, AI economics (Defensibility, AI Commoditization)
- **Ben Horowitz** — strategic AI (AI Commoditization)
- **Chip Huyen** — *Designing Machine Learning Systems* (AI Commoditization)
- **Claire Vo** — AI products in practice (AI Commoditization)
- **Mike Krieger** — AI-native vs AI-feature, scenario planning (AI Commoditization, Wave 3)
- **Geoffrey Moore** — *Crossing the Chasm* (Regulatory)
- **Hilary Gridley** — regulated industries (Regulatory)
- **David Singleton** — regulated platform thinking (Regulatory)
- **Adriel Frederick** — retention loops (Customer Impact fold-in)
- **Albert Cheng** — habit formation (Customer Impact fold-in)
- **Nir Eyal** — *Hooked* (Customer Impact fold-in)
- **Brian Tolkin** — operations-heavy product economics (Tech Feasibility fold-in)
- **Ray Cao** — service-heavy unit economics (Tech Feasibility fold-in)
- **Camille Fournier** — scenario planning (Wave 3)
- **Lane Shackleton** — experiment design (Wave 3)

That's 17 new named anchors on top of v3.0's 17, for a total of ~34 named expert anchors across the methodology.
