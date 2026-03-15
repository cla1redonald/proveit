# ProveIt: Phase Restructure & Seamless Pipeline

**Date:** 2026-03-15
**Issues:** #15 (seamless pipeline), #16 (phase restructure)
**Author:** Claire Donald

## Summary

Two tightly coupled changes to ProveIt's agent definition:

1. **Phase restructure** — replace decimal numbering (4.5, 4.6, 4.85, 4.9) with named phases 1-10
2. **Seamless pipeline** — BrandIt runs in-session as Phase 7 (not a separate skill invocation), Orchestrate offered as a handoff in Phase 10

## Motivation

- Phase numbering is unwieldy and will only get worse with additions
- The PM currently has to manually switch between skills across sessions, breaking flow
- BrandIt's output (brand.md) feeds directly into the Gamma deck — keeping it in-session makes the connection seamless

## Phase Structure

| # | Name | Was | Optional? | Change |
|---|------|-----|-----------|--------|
| 1 | Brain Dump | Phase 1 | No | Rename only |
| 2 | Discovery | Phase 2 | No | Rename only |
| 3 | Research | Phase 3 | No | Rename only |
| 4 | Findings Review | Phase 4 | No | Rename only |
| 5 | Deep Dive | Phase 4.5 | Yes | Rename (was "Research Swarm") |
| 6 | Cross-Model Review | Phase 4.6 | Yes | Rename, fires only if swarm ran |
| 7 | Brand Identity | Phase 4.85 | Yes | **Changed: was separate `/brandit` handoff, now in-session invocation** |
| 8 | Final Review | Phase 4.9 | No | Rename (was "Pre-Output Cross-Model Review") |
| 9 | Outputs | Phase 5 | No | Rename only, Gamma deck now uses brand.md |
| 10 | Next Steps | New | No | **New: offer /orchestrate as handoff** |

### Loop-back logic (unchanged)

After Phase 4 (Findings Review), if scores aren't high enough → loop back to Phase 2 (Discovery) or Phase 3 (Research). Optional phases (5, 6, 7) are offered, not forced.

## Seamless BrandIt Invocation (Phase 7)

### How it works

When confidence scores are high enough and the PM is ready for outputs, ProveIt offers Phase 7:

> "Before I generate the deck — want to create a brand identity? It'll take about 20 minutes. You'll get a name, logo, colours, fonts, and design tokens. The Gamma deck will use your actual brand."

### Prerequisites

Before offering Phase 7, ProveIt checks:
- **`OPENAI_API_KEY`** — if not set, skip logo generation offer but still offer the rest of the brand flow (name, colours, fonts, tokens). Tell the PM: "Logo generation requires an OpenAI API key. I can still create your brand identity — name, colours, fonts, and tokens — but without an AI-generated logo. Want to proceed?"
- **`brand.md` already exists** — if the PM previously ran `/brandit` standalone, ProveIt reads it and asks: "You already have a brand set up — [name]. Want to use it for the deck, refine it, or start fresh?"

If the PM says yes (and no brand.md exists), ProveIt runs the BrandIt flow directly within the same session:

1. **Brief** — asks only brand-specific questions (3-4 questions). Skips product/user questions since discovery already answered them. ProveIt has full context from earlier phases.
2. **Generate** — spawns 3 parallel Sonnet subagents via Task tool (same pattern as the research swarm). Each writes a direction JSON to `.brandit-temp/`.
3. **Domain check** — WebSearch for .com/.co/.io/.app availability.
4. **Logo generation** — invokes `~/brandit/scripts/generate-logo.mjs` for each direction. If the script fails (exit code 1 or 2), note the failure and continue without a logo for that direction. Tell the PM which direction couldn't generate a logo and why.
5. **Present** — shows all three directions in the terminal as a structured comparison. If the superpowers visual companion is already active in the session, use it; otherwise, terminal is the default for Phase 7.
6. **Refine** — PM picks, mixes, or adjusts. Max 3 refinement rounds, 6 DALL-E calls total.
7. **Output** — writes `brand.md`, `brand-tokens.css`, `brand-tokens.json`, and logo PNGs to the project directory.
8. **Resume** — ProveIt continues to Phase 8 (Final Review) with brand assets available.

### What ProveIt's Phase 7 includes

Phase 7 in the agent definition contains a condensed version of BrandIt's flow. It references `~/brandit/agents/brandit.md` for the full specification but includes directly:

- The 3-4 brand-specific brief questions
- Subagent mandates for the 3 directions (bold/friendly/minimal) with the JSON output structure
- Logo script invocation pattern + error handling (exit codes 1/2, graceful fallback)
- OPENAI_API_KEY prerequisite check with graceful skip
- brand.md pre-existence check
- Refinement rules (3 rounds, 6 DALL-E calls, cost-efficiency)
- brand.md template
- brand-tokens.css template
- brand-tokens.json template
- Cleanup of `.brandit-temp/` directory

### What stays the same

- `/brandit` still works as a standalone skill — nothing changes in `~/brandit/`
- BrandIt's agent definition, command entry point, and logo script are untouched
- The file-based connector (brand.md) is the same — ProveIt reads it in Phase 9

### Key constraints

- **One agent, one session** — ProveIt (Opus) runs the brand flow itself, not via skill invocation
- **Context preserved** — the PM's brand preferences stay in the conversation
- **Skip redundant questions** — ProveIt already knows the product, user, and market from discovery
- **Same quality** — the output (brand.md, tokens, logos) is identical whether run via `/brandit` or Phase 7

## Next Steps Phase (Phase 10)

After Phase 9 (Outputs), ProveIt presents a clean closing:

> "Your idea is validated and ready for handoff. Here's what you can do next:
>
> - **Build it** — run `/orchestrate` to kick off a full ShipIt build. It'll read your `discovery.md` and `brand.md` for context.
> - **Share the deck** — the Gamma presentation is ready for your team.
> - **Keep validating** — if you want to dig deeper on any score, we can loop back.
>
> Everything's saved. Come back anytime."

This is a handoff, not an invocation. Orchestrate runs in its own session because:
- A build is a fundamentally different activity from validation
- It runs for much longer and needs its own context
- The PM may want to share the deck with their team before building

## Tooling Change

ProveIt's agent frontmatter must add `Bash` to the tools list to invoke `generate-logo.mjs`:

```yaml
tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Task, Bash
```

**Security posture unchanged:** ProveIt's `.claude/settings.json` does NOT auto-allow Bash. The PM must approve each Bash command individually (same as before). The CLAUDE.md note about no Bash auto-allows remains accurate. Adding Bash to the frontmatter means the agent *can* use it, not that it's pre-approved.

## Files Changed

| File | Change |
|------|--------|
| `~/proveit/agents/proveit.md` | Add `Bash` to tools frontmatter, restructure all phase headers, add Phase 7 (BrandIt in-session) and Phase 10 (Next Steps), update all phase cross-references |
| `~/proveit/docs/design.md` | Update flow diagram, phase table, and model strategy to reflect new naming |
| `~/proveit/CLAUDE.md` | No change needed — references "core loop" generically, security note still accurate |

## What This Is NOT

- Not a rewrite of ProveIt's logic — the discovery/research/scoring flow is unchanged
- Not a change to BrandIt's standalone skill — `/brandit` works exactly as before
- Not an Orchestrate integration — that's a separate handoff, not an invocation
- Not a change to any output format — discovery.md, research files, and brand files are identical

## Scope

**In:**
- Rename all phase headers in agents/proveit.md (decimal → named)
- Add Phase 7 with condensed BrandIt flow
- Add Phase 10 with Next Steps
- Update design.md to match
- Update all internal cross-references (e.g. "see Phase 4.5" → "see Phase 5: Deep Dive")

**Out:**
- Changes to BrandIt plugin
- Changes to Orchestrate/ShipIt
- New features beyond the two issues
- Portfolio dashboard (#17) — separate issue
