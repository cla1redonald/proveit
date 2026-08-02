export const meta = {
  name: 'swarm',
  description: "ProveIt Deep Dive swarm as a dynamic workflow: each selected angle argues (structured), an independent skeptic verifies its evidence, then synthesis runs on verified inputs. Deterministic, complete, no self-grading. Drop-in for the Phase 5 prose orchestration.",
  whenToUse: 'Phase 5 Deep Dive — after the composition preview is confirmed with the PM. Pass the question, the chosen angle keys, and discovery/research text.',
  phases: [
    { title: 'Argue', detail: 'one agent per selected angle — structured thesis + evidence' },
    { title: 'Verify', detail: 'an independent skeptic checks each angle\'s evidence (the bias fix the prose swarm lacked)' },
    { title: 'Synthesize', detail: 'contradiction matrix + confidence-weighted recommendation from VERIFIED inputs' },
  ],
}

// ---------------------------------------------------------------------------
// swarm — the Deep Dive, rebuilt in the dynamic-workflow style (see
// docs/plans/2026-06-08-swarm-as-dynamic-workflow.md). Code coordinates
// (composition, dedup, the verify gate, confidence weighting); the model judges
// inside each agent. The angle prompts are ported VERBATIM from agents/phases/05-swarm.md
// (reference copy in agents/swarm/agent-prompts.md).
// (mandate/frameworks/tools/find) — only the per-agent "Output: write file"
// instruction is dropped, because the workflow returns structured output and the
// caller writes the files. Filesystem-free runtime: discovery/research come in as
// args; the workflow RETURNS the rendered markdown for the agent to write.
// ---------------------------------------------------------------------------

// The Workflow runtime delivers `args` as a JSON STRING (not a parsed object), so parse it.
// Handle both shapes defensively.
const a = (() => {
  if (args && typeof args === 'object') return args
  if (typeof args === 'string') { try { return JSON.parse(args) } catch { return {} } }
  return {}
})()
const question = a.question || '(no swarm question provided)'
const discovery = a.discovery || '(discovery.md not provided)'
const research = a.research || '(latest research-N.md not provided)'
const mode = a.mode === 'lite' ? 'lite' : 'full'
const heavyModel = mode === 'lite' ? 'sonnet' : 'opus'

const CONTEXT = `\n\n--- DISCOVERY.MD ---\n${discovery}\n\n--- LATEST RESEARCH ---\n${research}`

// The 10 angles. `prompt` is verbatim from proveit.md (the mandate + frameworks +
// tools + find blocks). DISCOVERY/RESEARCH are appended via CONTEXT, not inline.
const ANGLES = {
  'market-bull': { label: 'Market Bull', tier: 'default', prompt:
`You are the MARKET BULL research agent. Question: '${question}'. Context from prior research is provided below.

Mandate: Make the strongest possible case for market opportunity, growth potential, and competitive advantage. Be aggressively optimistic — but cite real sources.

Frameworks to apply (search Lenny's archive for current quotes):
- Sean Ellis — Product/Market Fit Survey: the "very disappointed" test (>=40% indicates PMF). Look for evidence of unmet demand strong enough to clear that bar.
- Lenny Rachitsky — PMF signals: retention curves, organic growth, cohort behaviour. Pull current Lenny benchmarks for the relevant category.
- Reid Hoffman — Network effects & blitzscaling: if there's any network-effect component, evaluate the value-for-Nth-user curve.
- Brian Chesky — Founder mode: for ideas where founder taste / breadth-first detail-orientation is the differentiator.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'product market fit', 'growth signals', 'network effects', and the idea's specific market category).

Find: market size data, growth trends, successful comparable examples, revenue opportunities, expert priors that support the bull case.` },

  'market-bear': { label: 'Market Bear', tier: 'default', prompt:
`You are the MARKET BEAR research agent. Question: '${question}'. Your mandate: Make the strongest possible case for market risks, failure modes, and competitive threats. Be aggressively pessimistic — but cite real sources.

Frameworks to apply:
- Dalton Caldwell (YC) — Tarpit ideas: the trap where the idea seems good but the same shape has killed many predecessors. His mantra: 'just don't die.'
- Shreyas Doshi — Tarpit detection & strategic anti-patterns: apply his pre-mortem and 'levels of strategy' lenses to surface hidden failure modes.
- Lenny Rachitsky — Why startups fail: pull current data and patterns from Lenny's failure-mode coverage.
- Marc Andreessen — Market is the most important thing: weak markets kill strong teams. Evaluate market quality independent of execution.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'tarpit', 'why startups fail', 'killing ideas', 'product death', and the idea's specific category).

Find: failed comparable examples (with specific names + dates + cause of death), market saturation data, cost structures that kill margins, regulatory threats, dominant-incumbent moats.` },

  'customer-impact': { label: 'Customer Impact', tier: 'default', prompt:
`You are the CUSTOMER IMPACT research agent. Question: '${question}'. Your mandate: Evaluate from pure customer perspective — user experience, satisfaction, friction, switching triggers, AND retention dynamics (the post-acquisition reality that determines whether this is a leaky bucket). The hardest question in product is what customers will actually DO vs what they say.

Frameworks to apply:
- Bob Moesta — Jobs to Be Done & switching forces: the four forces (push of the situation, pull of the new, anxiety, habit). 'Bitchin' ain't switchin'' — separate stated frustration from actual switching behaviour.
- Teresa Torres — Continuous Discovery & Opportunity Solution Tree: map opportunities (not features); avoid 'leading the witness' interview patterns.
- Marty Cagan — Customer discovery vs delivery: discovery is about risk, not requirements.
- Sean Ellis — PMF Survey: the 40% 'very disappointed' threshold; what would make it true here?
- Ravi Mehta — ICP Scorecard: force a precise ideal customer profile, scored on fit dimensions.
- Adriel Frederick — Retention loops: retention is the leakiest part of most growth funnels. What's the mechanism that brings the user back?
- Albert Cheng — Habit formation: trigger / action / variable reward / investment loop (Nir Eyal's Hooked model applied).
- Nir Eyal — Hooked (canonical reference): trigger -> action -> variable reward -> investment.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'switching forces', 'jobs to be done', 'continuous discovery', 'customer interviews', 'PMF survey').

Find: real evidence of user behaviour change (or absence of it), Reddit/forum threads showing pain, NPS or satisfaction data on incumbents, switching cost analyses, examples where users said one thing and did another.` },

  'technical': { label: 'Technical Feasibility', tier: 'default', prompt:
`You are the TECHNICAL FEASIBILITY research agent. Question: '${question}'. Your mandate: Evaluate engineering constraints, platform capabilities, technical complexity, implementation risks, AND — for service-heavy or operations-dependent ideas — the unit economics that determine whether this is buildable as software vs as a thinly-disguised consultancy. Be realistic about what's actually buildable by a small team in a sensible timeframe.

Frameworks to apply:
- Marty Cagan — Continuous discovery vs delivery: treat technical feasibility as a discovery risk to test, not a delivery item.
- Ravi Mehta — Build vs buy vs partner: when does writing it from scratch make sense vs gluing existing pieces?
- Brian Tolkin — Operations-heavy product economics: model the operational cost per unit of value delivered. The unit economics are the test of whether this is a software business or a labour business.
- Ray Cao — Service-heavy unit economics: software targets 70-80% gross margin; service lives at 30-50%. Which is this, and which is the founder pretending it is?
- Standard architecture review: data, integrations, real-time, security/compliance, scaling profile, AI/ML model selection if relevant.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'technical co-founder', 'build vs buy', 'minimum viable product', 'AI app architecture' if relevant).

Find: architecture patterns for this category, platform limitations (rate limits, pricing tiers, ToS), reference implementations, scalability constraints, dev-cost studies, security/compliance burden estimates.` },

  'devils-advocate': { label: "Devil's Advocate", tier: 'default', prompt:
`You are the DEVIL'S ADVOCATE research agent. Question: '${question}'. Your mandate: Challenge all conventional wisdom about this idea. If everyone says yes, argue no. Be deliberately provocative — but grounded in evidence.

Frameworks to apply:
- Annie Duke — Thinking in Bets / Quit: every yes is a bet under uncertainty; what would change your mind? When is the right time to walk away?
- Shreyas Doshi — Levels of strategy & anti-patterns: apply 'galaxy brain', 'tarpit', 'execution-as-strategy' lenses.
- Brian Chesky — Push past the experts: sometimes conventional wisdom is wrong because experts are pattern-matching badly. When is THAT the case here, and when isn't it?
- Marty Cagan — Death by features: the safe wisdom of 'add this feature' is often what kills.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'thinking in bets', 'quit', 'contrarian', 'product death', 'levels of strategy', 'galaxy brain').

Find: contrarian viewpoints, hidden assumptions, unconventional alternatives, examples where the obvious choice failed and the unobvious one worked.` },

  'defensibility': { label: 'Defensibility / Moat', tier: 'default', prompt:
`You are the DEFENSIBILITY / MOAT research agent. Question: '${question}'. Your mandate: Evaluate why this product won't be copied or commoditised. The most common quiet death for non-network-effect products is 'it works -> gets copied -> margins go to zero'. Refuse the comforting answer and find the actual moat — or honestly conclude there isn't one yet.

Frameworks to apply:
- Hamilton Helmer — 7 Powers (canonical text): Scale Economies, Network Economies, Counter-Positioning, Switching Costs, Branding, Cornered Resource, Process Power. Map this idea against each. Which power(s) does it have, which can it acquire, which are simply not available in this category?
- Brian Balfour — 4-Step Defensibility Cycle: Step Zero (market conditions met) -> Step One (build a moat) -> Step Two (platform opening — capture demand) -> Step Three (platform closing — control and monetise). Which step is this idea at?
- Peter Deng — Proprietary data flywheels: what data accrues that competitors can't replicate? Structural flywheel, or just 'we'll have more usage'?
- Dan Hockenmaier — Marketplace defensibility: if two-sided, evaluate liquidity, network effects, asymmetric-information advantage.
- Reid Hoffman — Network effects: value-for-Nth-user curve, the cold-start problem, the lock-in tail.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'moat', 'defensibility', '7 powers', 'network effects', 'data flywheel', 'switching costs').

Find: which of Helmer's 7 powers apply now, which could be acquired, which structurally cannot. Concrete examples of competitors that copied a similar idea and won/lost. Specific defensibility moves for year 1 to set up moat formation in year 2.` },

  'gtm': { label: 'GTM / Distribution', tier: 'conditional', prompt:
`You are the GTM/DISTRIBUTION research agent. Question: '${question}'. Your mandate: Evaluate how this product gets discovered and adopted — the part that kills most products even when the product itself is good.

Frameworks to apply:
- April Dunford — Obviously Awesome positioning: what's the alternative the user is comparing this to, and what's the unique value vs that alternative? Bad positioning kills good products.
- Brian Balfour / Elena Verna — Growth loops: which loop powers acquisition? (content, viral, paid, sales-led, product-led). Loops compound; funnels don't.
- Bangaly Kaba — North Star metric & adjacent users: who's the right user to acquire NEXT (one rung out from your power user)?
- Kyle Poyar — PLG benchmarks: conversion / activation / retention bar in this category.
- Lenny Rachitsky — Channel coverage: which channels work for which categories. Pull current benchmarks.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'positioning', 'growth loops', 'PLG', 'content marketing', 'distribution', 'channel fit').

Find: which channels work in this category, examples of similar products winning or losing on distribution alone, what the cheapest first 100 users look like, where incumbents spend acquisition budget, the cold-start problem and how this product solves it.` },

  'pricing': { label: 'Pricing / Monetisation', tier: 'conditional', prompt:
`You are the PRICING/MONETISATION research agent. Question: '${question}'. Your mandate: Evaluate how this product makes money — pricing model, price level, free-vs-paid line, willingness-to-pay signals, and the unit economics underneath.

Frameworks to apply:
- Madhavan Ramanujam — Monetizing Innovation: start with willingness-to-pay BEFORE building. Use the 'leaky bucket' to identify minimum viable feature set per price point. (On AI: 'don't anchor low or you train customers to expect a low price'.)
- Patrick Campbell — Pricing data & cohort analysis: WTP surveys, price elasticity, churn vs price studies.
- Kyle Poyar — PLG monetisation: free-to-paid conversion benchmarks per category, the 'good free' threshold.
- Lenny Rachitsky — Pricing pages of category leaders: tiers, features per tier, pricing anchors of winners in the same space.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'willingness to pay', 'pricing strategy', 'monetizing innovation', 'pricing tiers', 'freemium').

Find: competitor pricing pages (archive.org snapshots if recent changes), category-specific WTP studies, evidence of paid traction in adjacent products, pricing changes that worked or failed, the 'price anchor' customers default to.` },

  'ai-commoditization': { label: 'AI Commoditization', tier: 'conditional', prompt:
`You are the AI COMMODITIZATION research agent. Question: '${question}'. Your mandate: Evaluate the single sharpest risk for AI-era products — that the foundation models eat your lunch in 6 months. The Tech Feasibility agent argues 'can we build this?'; you argue 'will OpenAI/Anthropic/Google ship this as a default capability before we reach product/market fit?'. Be honest about wrapper risk and the difference between a product and a feature.

Start from the Frontier Snapshot — do NOT re-derive the frontier from your training data. Read docs/frontier-snapshot.md (find it via Glob for frontier-snapshot.md) FIRST. It is a dated, source-checked record of what the model layer can do today, maintained by the frontier-scan workflow. Anchor your analysis in it: cite its section 3 (Commoditization watchlist) for what's already a default, section 2 (Capability frontier) for what just became table stakes, and section 4 (Token economics) for the cost curve. Then do only idea-specific live search to fill gaps. Freshness guard: if the snapshot's generated date is older than its freshness_horizon_days, say so explicitly and lean more on live search.

Frameworks to apply:
- Ben Horowitz — Strategic AI: AI lowers the floor (more people can build) but doesn't raise the ceiling (foundation models commoditise the easy wins). Floor or ceiling?
- Chip Huyen — production ML reality: what specifically is hard that a foundation model alone won't solve? Data, latency, evaluation, edge cases, fine-tuning, RAG, agentic orchestration?
- Claire Vo — wrapper-vs-product: a wrapper sells access to a model; a product sells an outcome the model alone can't deliver. Which is this?
- Brian Balfour — defensibility cycle for AI: what's the structural moat that survives the next foundation-model release?
- Dan Hockenmaier — AI economics: which AI products have unit economics that work, and which break when costs change?
- Mike Krieger — what AI-native vs AI-feature actually means.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'AI commoditization', 'AI wrapper', 'AI moat', 'foundation models', 'AI product strategy', 'token costs').

Find: which capabilities the labs shipped as defaults (start from snapshot sections 2/3, confirm category-specifics with live search), what roadmaps suggest for the next 12 months, wrapper businesses absorbed by the model layer (and the few that survived), unit economics at current and projected token prices.` },

  'regulatory': { label: 'Regulatory / Compliance', tier: 'conditional', prompt:
`You are the REGULATORY / COMPLIANCE research agent. Question: '${question}'. Your mandate: For ideas in regulated categories — health, finance, kids' content, data privacy, employment, lending, education accreditation — the difference between launch and lawsuit is whether the team built compliance in from day one. Identify the regulations that apply, the cost of compliance, and the credible threats from regulators or claimants.

Frameworks to apply:
- Geoffrey Moore — Crossing the Chasm / regulated-market chasms: regulated markets have their own chasms; the mainstream demands compliance certifications and audit trails the early adopters didn't.
- Hilary Gridley — Building in regulated industries: what compliance work must happen before the first customer, what can be deferred, what certification actually costs.
- David Singleton — Regulated platform thinking: for payments/identity/sensitive data, the regulatory floor vs the bar that gets you trusted by enterprise.
- Standard regulatory taxonomy: GDPR/UK GDPR, CCPA, COPPA (kids), HIPAA (US health), SOC 2, ISO 27001, PCI-DSS (payments), accessibility (WCAG/EAA), employment law, financial-services licensing (FCA, SEC, MAS). Identify which apply.

Tools: Firecrawl, WebSearch, mcp__lenny-transcripts__search_transcripts (suggested queries: 'regulated industry', 'compliance', 'HIPAA', 'GDPR', 'SOC 2', 'crossing the chasm regulated').

Find: which regulations apply in the target jurisdictions, typical cost/timeline of getting compliant (dollar figures + months), analogous startups that hit regulatory walls (or navigated them), enforcement history, and whether regulation PROTECTS (barrier to entry) or BLOCKS you.` },
}

const DEFAULTS = ['market-bull', 'market-bear', 'customer-impact', 'technical', 'devils-advocate', 'defensibility']
// composition = array of angle keys the PM confirmed in the Step 3 preview. Falls back to the 6 defaults.
const selected = (Array.isArray(a.composition) && a.composition.length ? a.composition : DEFAULTS)
  .filter((k) => ANGLES[k])

log(`Deep Dive swarm: ${selected.length} angles in ${mode} mode — ${selected.join(', ')}`)

const ARGUMENT_SCHEMA = {
  type: 'object',
  required: ['thesis', 'evidence', 'risks', 'overall_confidence'],
  properties: {
    thesis: { type: 'string', description: 'One paragraph: the core argument from this angle.' },
    evidence: {
      type: 'array',
      description: '3-5 evidence points.',
      items: {
        type: 'object',
        required: ['title', 'claim', 'source', 'confidence'],
        properties: {
          title: { type: 'string' },
          claim: { type: 'string', description: 'Specific assertion.' },
          source: { type: 'string', description: 'URL or citation.' },
          confidence: { type: 'integer', minimum: 1, maximum: 5 },
        },
      },
    },
    risks: { type: 'array', items: { type: 'string' }, description: '2-3 risks the agent acknowledges to its OWN argument.' },
    overall_confidence: { type: 'integer', minimum: 1, maximum: 5 },
    confidence_reason: { type: 'string' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['checks', 'verified_confidence'],
  properties: {
    checks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'supported'],
        properties: {
          claim: { type: 'string' },
          supported: { type: 'string', enum: ['yes', 'partial', 'no'], description: 'Does the cited source actually support the claim?' },
          note: { type: 'string' },
        },
      },
    },
    verified_confidence: { type: 'integer', minimum: 1, maximum: 5, description: 'The angle\'s overall confidence after independent verification — lower it if evidence did not hold up.' },
    flags: { type: 'array', items: { type: 'string' }, description: 'Unsupported or over-confident claims the synthesis should treat with caution.' },
  },
}

// --- Phase 1+2: each angle argues; an INDEPENDENT skeptic verifies its evidence.
//     Pipelined — an angle's evidence starts verifying the moment that angle returns. ---
const swarm = await pipeline(
  selected.map((k) => ({ key: k, ...ANGLES[k] })),
  (angle) => agent(angle.prompt + CONTEXT, { label: `argue:${angle.key}`, phase: 'Argue', schema: ARGUMENT_SCHEMA, model: 'sonnet' }),
  (argument, angle) => {
    if (!argument) return null
    return agent(
      `You are an INDEPENDENT skeptic verifying the "${angle.label}" agent's evidence for ProveIt — you did NOT write it, and you are not on its side. ` +
      `For EACH evidence claim, judge whether its cited source actually supports it (open the source if you can). ` +
      `Flag anything unsupported, mis-cited, or over-confident, and set verified_confidence to what the evidence honestly warrants (lower than the agent's self-rating if it oversold). ` +
      `This is the check that stops an angle grading its own homework.\n\n` +
      `THE ANGLE'S ARGUMENT:\n${JSON.stringify(argument, null, 2)}`,
      { label: `verify:${angle.key}`, phase: 'Verify', schema: VERIFY_SCHEMA, model: 'sonnet' }
    ).then((verify) => ({ angle: angle.key, label: angle.label, argument, verify }))
  }
)

const results = swarm.filter(Boolean)
log(`${results.length}/${selected.length} angles argued and independently verified.`)

// --- Phase 3: synthesize from VERIFIED arguments. ---
const synthesisMarkdown = await agent(
  `You are the swarm SYNTHESIS agent for ProveIt. Question: '${question}'. ` +
  `Below are ${results.length} angle arguments, each with an INDEPENDENT skeptic's verification (verified_confidence + flags). ` +
  `Weight by the VERIFIED confidence, not the agents' self-ratings. Produce the synthesis markdown with these exact sections:\n` +
  `# Swarm Synthesis: [Question]\n## Executive Summary (2-3 paragraphs, balanced, confidence-weighted)\n` +
  `## Direct Contradictions (3-5: topic, what each side claims + verified confidence, resolution — which is more credible and why)\n` +
  `## Unsupported / Flagged Claims (pull from the skeptics' flags — which claims did not hold up)\n` +
  `## Confidence-Weighted Recommendation (a clear position; a table of each angle with its VERIFIED confidence)\n` +
  `## Bias Check (absolute claims without nuance; echo-chamber risk if angles cite the same sources; missing perspectives)\n` +
  `## Key Evidence (5-10 strongest VERIFIED points, with sources)\n` +
  `## Impact on ProveIt Scores (Desirability / Viability / Feasibility: unchanged / raise to X / lower to X — and why)\n` +
  `## Next Steps (3-5 concrete actions to de-risk or validate)\n\n` +
  `Return the complete markdown. VERIFIED ANGLE RESULTS:\n${JSON.stringify(results, null, 2)}`,
  { label: 'synthesize', phase: 'Synthesize', model: heavyModel }
)

// Code renders each angle file deterministically from the structured argument + verification.
function renderAngleFile(r) {
  const { argument: arg, verify: v } = r
  const ev = (arg.evidence || []).map((e) => {
    const check = (v?.checks || []).find((c) => c.claim === e.claim)
    const mark = check ? ` _(verify: ${check.supported}${check.note ? ' — ' + check.note : ''})_` : ''
    return `### ${e.title}\n- **Claim:** ${e.claim}\n- **Source:** ${e.source}\n- **Confidence:** ${e.confidence}/5${mark}`
  }).join('\n\n')
  const flags = (v?.flags || []).length ? `\n\n## Flagged by independent verification\n` + v.flags.map((f) => `- ${f}`).join('\n') : ''
  return `# ${r.label}: ${question}\n\n## Thesis\n${arg.thesis}\n\n## Evidence\n${ev}\n\n## Risks to This Position\n` +
    (arg.risks || []).map((x) => `- ${x}`).join('\n') +
    `\n\n## Overall Confidence\n**Self-rated ${arg.overall_confidence}/5** -> **Verified ${v?.verified_confidence ?? arg.overall_confidence}/5** — ${arg.confidence_reason || ''}${flags}\n`
}

// Returned to the caller (the Phase 5 agent), which writes the files to the working dir.
return {
  question,
  mode,
  composition: selected,
  angleFiles: Object.fromEntries(results.map((r) => [`swarm-[N]-${r.angle}.md`, renderAngleFile(r)])),
  synthesisFile: { 'swarm-[N]-synthesis.md': synthesisMarkdown },
  confidenceTable: results.map((r) => ({ angle: r.label, self: r.argument.overall_confidence, verified: r.verify?.verified_confidence })),
}
