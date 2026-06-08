export const meta = {
  name: 'frontier-scan',
  description: "Keep ProveIt's AI-frontier knowledge current: fan out per lab/domain, adversarially verify every claim has a dated source, synthesize into docs/frontier-snapshot.md, diff the prior snapshot, and flag changes big enough to edit the ProveIt agent.",
  whenToUse: 'Run on a schedule (or manually) to refresh docs/frontier-snapshot.md so the AI-Commoditization analysis reasons from current reality, not a training cutoff.',
  phases: [
    { title: 'Scan', detail: 'one researcher per lab/domain — last ~90 days + signposted-next' },
    { title: 'Verify', detail: 'skeptic agents kill any claim without a dated source' },
    { title: 'Synthesize', detail: 'merge survivors into the snapshot structure' },
    { title: 'Diff', detail: 'compare to the prior snapshot; flag [AGENT-IMPACT] changes' },
  ],
}

// ---------------------------------------------------------------------------
// frontier-scan — ProveIt's AI-currency engine, as a dynamic workflow.
//
// The pattern (per Pawel Huryn / Anthropic "dynamic workflows"): the MODEL does
// the judgment inside each agent; the CODE does the coordination (which domains,
// what carries forward, dedup, the stale-source filter, the diff). The glue
// below spends zero model tokens — only the agent() calls cost.
//
// Output contract: this workflow RETURNS a structured object. The caller
// (a human in a Claude session, or the GitHub Action via Claude Code headless)
// is responsible for writing docs/frontier-snapshot.md and opening a PR. The
// workflow itself does not touch the filesystem — that keeps it pure and
// re-runnable, and keeps the "edit the agent's own brain" decision human-gated.
// ---------------------------------------------------------------------------

// The frontier is scanned by domain, not by lab alone — token economics and the
// downstream tooling landscape move independently of any single model release.
const DOMAINS = [
  { key: 'anthropic',   prompt: 'Anthropic / Claude — flagship models, model IDs, agentic + coding capability, pricing, effort controls, Claude Code primitives (subagents / agent teams / dynamic workflows).' },
  { key: 'openai',      prompt: 'OpenAI — flagship GPT models, ChatGPT product cadence (the features that cannibalize wrappers), Codex, pricing.' },
  { key: 'google',      prompt: 'Google / DeepMind — Gemini flagship + Flash/Lite tiers, price-performance, GPQA/SWE-bench, Gemini CLI.' },
  { key: 'meta-xai-open', prompt: 'Meta (Llama), xAI (Grok), and the open-weights frontier (Mistral, DeepSeek, Qwen) — what open models now match closed-frontier capability, and where.' },
  { key: 'commoditization', prompt: 'Commoditization — which startup categories the foundation labs shipped as defaults in the last ~90 days; named wrappers absorbed by the model layer; the "survival window" framing; which verticals stay defensible (proprietary data, regulated workflows).' },
  { key: 'token-economics', prompt: 'Token economics — current $/Mtok input & output across frontier and budget tiers, the rate of price decline, output-to-input multiplier, and the direction of travel for reasoning tiers.' },
  { key: 'agent-tooling', prompt: 'AI build & design tooling — Claude Code (workflows/agent teams/subagents), Codex, Gemini CLI, Gamma, Claude Design and other handoff targets ProveIt feeds into.' },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['domain', 'findings'],
  properties: {
    domain: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'date', 'source', 'category'],
        properties: {
          claim: { type: 'string', description: 'A specific, falsifiable assertion about the frontier.' },
          date: { type: 'string', description: 'ISO date the thing happened/shipped, or the source publish date. "" if none — such a finding will be killed in Verify.' },
          source: { type: 'string', description: 'URL backing the claim.' },
          category: { type: 'string', enum: ['flagship', 'capability-default', 'commoditization', 'token-economics', 'tooling'], description: 'Where this lands in the snapshot.' },
          proveit_relevance: { type: 'string', description: 'Why a PM validating an idea should care — one sentence.' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['keep', 'kill'], description: 'kill if the claim lacks a real dated source, is speculation dressed as fact, or the source does not support it.' },
    reason: { type: 'string' },
    corrected_date: { type: 'string', description: 'If the date was wrong but recoverable from the source, the corrected ISO date. Else "".' },
  },
}

const DIFF_SCHEMA = {
  type: 'object',
  required: ['summary', 'changes', 'agent_impact'],
  properties: {
    summary: { type: 'string', description: 'One paragraph: what moved on the frontier since the prior snapshot.' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['change', 'kind'],
        properties: {
          change: { type: 'string' },
          kind: { type: 'string', enum: ['new', 'updated', 'removed'] },
        },
      },
    },
    agent_impact: {
      type: 'array',
      description: 'Changes structural enough to warrant editing agents/proveit.md. Empty if none.',
      items: {
        type: 'object',
        required: ['change', 'edit_needed'],
        properties: {
          change: { type: 'string', description: 'The frontier shift, e.g. "a fifth lab entered the frontier" or "capability X crossed from differentiator to default".' },
          edit_needed: { type: 'string', description: 'The concrete edit to agents/proveit.md the PR should make.' },
        },
      },
    },
  },
}

// args.priorSnapshot: the full text of the current docs/frontier-snapshot.md (for the diff).
//   The caller reads it off disk and passes it in — the workflow stays filesystem-free.
// args.today: ISO date string (Date.now() is unavailable inside workflows).
// The Workflow runtime delivers `args` as a JSON STRING (not a parsed object), so parse
// it. Handle both shapes defensively so a missing/odd binding degrades to sane defaults.
const workflowArgs = (() => {
  if (args && typeof args === 'object') return args
  if (typeof args === 'string') { try { return JSON.parse(args) } catch { return {} } }
  return {}
})()
const priorSnapshot = workflowArgs.priorSnapshot || '(no prior snapshot — this is the first scan)'
const today = workflowArgs.today || 'unknown-date'

// Cost control. 'lite' (the CI default) keeps the adversarial check but collapses the
// expensive per-finding verify fan-out into ONE skeptic per domain, caps findings, and
// runs synthesis/diff on Sonnet — roughly 6x cheaper / far fewer agents. 'full' (run it
// yourself on Max) keeps the skeptic-per-finding pass and Opus synthesis for the deepest
// refresh. Caller passes args.mode = 'lite' from CI.
const MODE = workflowArgs.mode === 'lite' ? 'lite' : 'full'
const heavyModel = MODE === 'lite' ? 'sonnet' : 'opus'
const LITE_FINDINGS_CAP = 6
log(`Running ${MODE} scan across ${DOMAINS.length} domains.`)

// Schema for the batched (lite) skeptic — it returns only the findings that survive.
const KEPT_SCHEMA = {
  type: 'object',
  required: ['kept'],
  properties: {
    kept: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'date', 'source', 'category'],
        properties: {
          claim: { type: 'string' },
          date: { type: 'string', description: 'Verified ISO date (corrected if the source supports a different one).' },
          source: { type: 'string' },
          category: { type: 'string', enum: ['flagship', 'capability-default', 'commoditization', 'token-economics', 'tooling'] },
          proveit_relevance: { type: 'string' },
        },
      },
    },
  },
}

// --- Phase 1+2: scan each domain, then verify each finding. Pipelined: a domain's
//     findings start getting verified the moment that domain returns — no barrier. ---
const scanned = await pipeline(
  DOMAINS,
  (d) => agent(
    `You research the AI frontier for ProveIt, a product-validation tool. Domain: ${d.prompt}\n\n` +
    `Find what is TRUE AS OF ${today}, focusing on the last ~90 days and anything credibly signposted next. ` +
    `Use WebSearch/WebFetch (and Firecrawl if available). Every finding MUST carry an ISO date and a source URL — ` +
    `a finding with no date is worthless here and will be discarded. Prefer primary sources (lab blogs, release notes) ` +
    `over roundups. Be specific: model IDs, benchmark numbers, prices, named products, named startups absorbed.` +
    (MODE === 'lite' ? ` Return only the ${LITE_FINDINGS_CAP} highest-impact findings.` : ''),
    { label: `scan:${d.key}`, phase: 'Scan', schema: FINDINGS_SCHEMA, model: 'sonnet' }
  ),
  // Verify stage: a skeptic with separate context from the scanner = no self-preferential bias.
  (scan, domain) => {
    const findings = scan?.findings || []
    if (findings.length === 0) return []
    if (MODE === 'lite') {
      // ONE skeptic per domain verifies all its findings in a single call — still
      // adversarial and separate-context, just not a whole agent per claim.
      return agent(
        `You are a skeptic verifying claims for ProveIt's frontier snapshot. Drop anything uncertain.\n\n` +
        `For EACH claim below, open its source. Keep ONLY claims the source actually supports, with a real recent ISO ` +
        `date; drop speculation-as-fact, undated claims, and anything unsupported. Correct dates where the source warrants. ` +
        `Return the surviving claims.\n\nCLAIMS:\n${JSON.stringify(findings, null, 2)}`,
        { label: `verify:${domain.key}`, phase: 'Verify', schema: KEPT_SCHEMA, model: 'sonnet' }
      ).then((r) => (r?.kept || []).map((f) => ({ ...f, domain: domain.key })))
    }
    // full: skeptic per finding — maximum independence, one agent per claim.
    return parallel(
      findings.map((f) => () =>
        agent(
          `You are a skeptic verifying ONE claim for ProveIt's frontier snapshot. Default to "kill" if uncertain.\n\n` +
          `Claim: "${f.claim}"\nClaimed date: ${f.date || '(none)'}\nSource: ${f.source}\n\n` +
          `Open the source. Does it actually support the claim? Is the date real and recent? ` +
          `Kill speculation-as-fact, undated claims, and anything the source does not back. Keep only verifiable, dated facts.`,
          { label: `verify:${domain.key}`, phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet' }
        ).then((v) => ({ ...f, domain: domain.key, verdict: v }))
      )
    )
  }
)

// Code does the coordination: flatten, keep survivors, apply date corrections. Zero tokens.
// Lite returns already-kept findings; full returns per-finding verdicts to filter.
const verified = (MODE === 'lite'
  ? scanned.filter(Boolean).flat().filter(Boolean)
  : scanned.filter(Boolean).flat().filter(Boolean).filter((f) => f.verdict?.verdict === 'keep')
).map((f) => ({
  claim: f.claim,
  date: (f.verdict?.corrected_date) || f.date,
  source: f.source,
  category: f.category,
  proveit_relevance: f.proveit_relevance,
  domain: f.domain,
}))

log(`Verified ${verified.length} dated facts across ${DOMAINS.length} domains (${MODE} mode).`)

// Quality gate: never overwrite a good snapshot with a degraded scan. If web search
// failed, a provider was down, or the skeptic killed nearly everything, refuse rather
// than synthesize a hollow replacement from almost nothing. (The caller catches the
// throw, writes nothing, and opens no PR.)
const MIN_VERIFIED_FACTS = 12
if (verified.length < MIN_VERIFIED_FACTS) {
  throw new Error(
    `Frontier scan produced only ${verified.length} verified facts (need >= ${MIN_VERIFIED_FACTS}). ` +
    `Refusing to overwrite the snapshot with a degraded result — likely a search/provider failure this run.`
  )
}

// --- Phase 3: synthesize the verified facts into the snapshot body. ---
const snapshotBody = await agent(
  `You are assembling docs/frontier-snapshot.md for ProveIt from VERIFIED, DATED facts (JSON below). ` +
  `Match the PRIOR SNAPSHOT's section structure exactly: ` +
  `1. Frontier flagships (table), 2. Capability frontier (what's now a default), 3. Commoditization watchlist (table + the survival-window framing), ` +
  `4. Token economics, 5. AI build & design tooling, 6. Change log. ` +
  `Every claim keeps its date and source link. Open with the YAML front-block: snapshot_version (bump it by 1 from the prior snapshot's value), generated: ${today}, ` +
  `generated_by: frontier-scan, next_scan_due (+14 days), freshness_horizon_days: 21. ` +
  `Preserve the prior change log and PREPEND a new dated entry summarising what changed this run. ` +
  `Do not invent facts beyond the JSON. Return the complete markdown file as text.\n\n` +
  `PRIOR SNAPSHOT (for structure, version number, and change-log continuity):\n${priorSnapshot}\n\n` +
  `VERIFIED FACTS:\n${JSON.stringify(verified, null, 2)}`,
  { label: 'synthesize', phase: 'Synthesize', model: heavyModel }
)

// --- Phase 4: diff against the prior snapshot; flag agent-impacting shifts. ---
const diff = await agent(
  `Compare the NEW snapshot to the PRIOR one and report what moved. Flag as agent_impact ONLY changes structural enough ` +
  `to warrant editing agents/proveit.md — e.g. a new lab on the frontier, a model rename the agent hardcodes, ` +
  `a capability crossing from "differentiator" to "default", or a new commoditization category. ` +
  `Routine number updates are NOT agent-impact.\n\n` +
  `PRIOR SNAPSHOT:\n${priorSnapshot}\n\n` +
  `NEW SNAPSHOT:\n${snapshotBody}`,
  { label: 'diff', phase: 'Diff', schema: DIFF_SCHEMA, model: heavyModel }
)

log(diff.agent_impact?.length
  ? `⚠ ${diff.agent_impact.length} change(s) warrant editing the ProveIt agent — caller should open a PR.`
  : `No agent-impacting changes — snapshot refresh only.`)

// Returned to the caller. The caller writes the file, appends the change-log entry,
// commits the snapshot, and (if agent_impact is non-empty) opens a PR editing the agent.
return {
  generated: today,
  verified_fact_count: verified.length,
  snapshot_markdown: snapshotBody,
  diff,
  needs_agent_pr: (diff.agent_impact?.length || 0) > 0,
}
