# @proveit Agent Memory

Patterns specific to the ProveIt agent's behaviour and outputs.

---

## Brand and voice tokens belong IN the prompt, not as instructions ABOUT the prompt

**Context:** ProveIt's Phase 9–10 hand a PM off to external generative tools (Claude Design, Gamma). The PM brings `brand.md`, `discovery.md`, `pre-mortem-N.md` and is expected to compose them into a useful prompt.

**Learning:** Probe evidence (Claude Design, 2026-05-10) showed that an unbranded prompt produces blander headers and made-up placeholder numbers; an explicitly-branded prompt with named statistics and voice constraints produces data-dense layouts (real tables, mock UIs, on-tone copy). The difference was structural, not cosmetic — "voice: confident and direct" actually sharpened the model's word choice; named numbers ("47 engineers, 23 min/day") prevented invention; "don't recreate Slack-branded UI" was respected.

**Action:** ProveIt MUST pre-populate paste-ready prompt blocks (Output 5: `claude-design-prompts.md`) with the PM's actual evidence already substituted — brand tokens, voice adjectives, named numbers, named competitors, anti-patterns from the pre-mortem. Do not write generic instructions like "open claude.ai/design and paste discovery.md" — that produces the bland-probe-1 outcome. Each `[bracketed slot]` in a prompt template must be resolved before the file is written; the PM never sees template syntax.

**Source:** Claude Design integration session, 2026-05-10. v3.5.0.

---

## When external tools have no API, the integration may still round-trip — check both directions

**Context:** ProveIt integrates with tools that may or may not expose programmatic surfaces (Gamma MCP yes; BrandIt local script yes; Claude Design no API).

**Learning:** A missing API does not mean a missing integration. claude.ai/design exposes a "Handoff to Claude Code" button in its Share menu, which makes ProveIt a legitimate *destination* for designs that need validation — not just a *caller* of design generation. Phase 10 copy was originally written apologetically ("manually paste discovery.md"); the fix was to surface the round-trip as the actual workflow.

**Action:** When designing handoff phases, name **both directions** explicitly: how a PM moves work *out* of ProveIt into the external tool, AND how a PM brings work *back* into ProveIt from the external tool. If the external tool exposes any "send to Claude Code" / "export as markdown" / "download bundle" affordance, that is the inbound surface — Phase 10 should reference it, not apologise around it.

**Source:** Claude Design integration session, 2026-05-10. v3.5.0.

---

## BrandIt vs Claude Design — overlap is ONLY logos; everything else composes

**Context:** Phase 7 (BrandIt) and Phase 10 (Claude Design handoff) both touch brand-adjacent visual output. Earlier copy framed them as alternatives, which confused the boundary.

**Learning:** The tools occupy different roles and only overlap on one artefact:
- BrandIt = one finished logo as part of a complete brand system (palette, type pairing, voice, design tokens JSON/CSS, tagline). Structured, tokenised, durable.
- Claude Design = three exploratory logo *directions* with rationale, in vector/HTML, in 3 minutes. Generative, comparative, no token export.
- Everything else (decks, wireframes, social cards, screens) belongs to Claude Design only. Brand systems, design tokens, and voice belong to BrandIt only.

**Action:** Boundary tables in Phase 7 and Phase 10 must include the logo-overlap paragraph: BrandIt produces one finished logo; Claude Design produces three exploratory directions; they *compose* (run BrandIt for the system, then Claude Design's logo prompt to A/B before locking). Do not present them as either/or.

**Source:** Claude Design integration session, 2026-05-10. v3.5.0.
