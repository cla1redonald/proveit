# @proveit Agent Memory

Patterns specific to the ProveIt agent's behaviour and outputs.

---

## Brand and voice tokens belong IN the prompt, not as instructions ABOUT the prompt

**Context:** ProveIt's Phase 8–9 hand a PM off to external generative tools (Claude Design, Gamma). The PM brings `discovery.md`, `design-brief.md`, `pre-mortem-N.md` and is expected to compose them into a useful prompt.

**Learning:** Probe evidence (Claude Design, 2026-05-10) showed that an unbranded prompt produces blander headers and made-up placeholder numbers; an explicitly-branded prompt with named statistics and voice constraints produces data-dense layouts (real tables, mock UIs, on-tone copy). The difference was structural, not cosmetic — "voice: confident and direct" actually sharpened the model's word choice; named numbers ("47 engineers, 23 min/day") prevented invention; "don't recreate Slack-branded UI" was respected.

**Action:** ProveIt MUST pre-populate paste-ready prompt blocks (Output 5: `claude-design-prompts.md`) with the PM's actual evidence already substituted — brand tokens, voice adjectives, named numbers, named competitors, anti-patterns from the pre-mortem. Do not write generic instructions like "open claude.ai/design and paste discovery.md" — that produces the bland-probe-1 outcome. Each `[bracketed slot]` in a prompt template must be resolved before the file is written; the PM never sees template syntax.

**Source:** Claude Design integration session, 2026-05-10. v3.5.0.

---

## When external tools have no API, the integration may still round-trip — check both directions

**Context:** ProveIt integrates with tools that may or may not expose programmatic surfaces (Gamma MCP yes; Claude Design no API).

**Learning:** A missing API does not mean a missing integration. claude.ai/design exposes a "Handoff to Claude Code" button in its Share menu, which makes ProveIt a legitimate *destination* for designs that need validation — not just a *caller* of design generation. Phase 10 copy was originally written apologetically ("manually paste discovery.md"); the fix was to surface the round-trip as the actual workflow. (Phase 10 is now Phase 9 after the BrandIt phase was removed, 2026-07-09.)

**Action:** When designing handoff phases, name **both directions** explicitly: how a PM moves work *out* of ProveIt into the external tool, AND how a PM brings work *back* into ProveIt from the external tool. If the external tool exposes any "send to Claude Code" / "export as markdown" / "download bundle" affordance, that is the inbound surface — Phase 9 (Next Steps) should reference it, not apologise around it.

**Source:** Claude Design integration session, 2026-05-10. v3.5.0.

---

## Logos come from Claude Design's exploratory prompt — ProveIt doesn't generate them

**Context:** The BrandIt phase (formerly Phase 7) was removed from ProveIt on 2026-07-09; ProveIt no longer produces a brand system, `brand.md`, or a finished logo.

**Learning:** Claude Design's "Logos" prompt produces three exploratory logo *directions* with rationale, in vector/HTML, in ~3 minutes — generative and comparative, no token export. For existing-brand sessions, brand tokens come from `## Inherited assets` in `discovery.md`; for new ideas, `design-brief.md` § Brand reference proposes starter tokens the designer can override.

**Action:** Never reference `brand.md`, `brand-tokens.*`, or a BrandIt flow in outputs. Point logo needs to the "Logos" prompt in `claude-design-prompts.md` and brand-token needs to `design-brief.md` § Brand reference.

**Source:** BrandIt removal session, 2026-07-09. Supersedes the v3.5.0 BrandIt/Claude Design boundary learning.
