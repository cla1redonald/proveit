# Cross-Model Review (OpenAI Red Team)

**Date:** 2026-03-01
**Status:** Approved

## Summary

Add an OpenAI `o3` review step that independently checks ProveIt's analysis for gaps, bias, logical leaps, and contradictions. Runs twice: after swarm synthesis and before final outputs. Results are shown transparently to the PM.

## Motivation

A single model (Claude) performing both research and synthesis risks systematic blind spots. Running the synthesis through a competing model (OpenAI o3) catches issues that self-review cannot — different training data, different reasoning patterns, different failure modes.

## Flow Integration

```
Swarm Synthesis → ★ Cross-Model Review #1 → Score Update → [Loop or proceed]
                                                                    ↓
                                                    ★ Cross-Model Review #2 → Outputs
```

- **Review #1 (post-swarm):** Reviews `swarm-N-synthesis.md` + `discovery.md`. Fires after Phase 4.5, before ProveIt updates scores.
- **Review #2 (pre-output):** Reviews full `discovery.md` + all research files. Fires after all looping is done, before Phase 5 (Gamma deck + playbook).
- If the PM skips the swarm entirely, only Review #2 fires.
- If no `OPENAI_API_KEY` is set, reviews are skipped with a message.

## The Review Script

**File:** `scripts/openai-review.mjs`

- Reads markdown content from stdin
- Sends to OpenAI `o3` with high reasoning effort
- Returns structured review markdown to stdout
- Uses `openai` npm package (project dependency via `package.json`)
- Requires `OPENAI_API_KEY` environment variable

**Review prompt asks o3 to check for:**

1. **Gaps** — questions not asked, evidence missing
2. **Bias** — confirmation bias, optimism bias, anchoring to PM's framing
3. **Logical leaps** — conclusions that don't follow from cited evidence
4. **Contradictions** — conflicts within the research

Each finding is rated: CRITICAL / NOTABLE / MINOR.

## Output Format

Each review writes to `review-N.md` in the project directory:

```markdown
# Cross-Model Review [N]: [Post-Swarm | Pre-Output]
Date: [date]
Model: o3
Reviewing: [list of files reviewed]

## Gaps
### [Finding title]
- **Section:** [which file/section]
- **Issue:** [what's missing]
- **Severity:** CRITICAL / NOTABLE / MINOR

## Bias
### [Finding title]
- **Section:** [which file/section]
- **Quote:** "[the biased text]"
- **Issue:** [what bias is present]
- **Severity:** CRITICAL / NOTABLE / MINOR

## Logical Leaps
### [Finding title]
- **Claim:** "[the conclusion]"
- **Evidence provided:** [what was cited]
- **Issue:** [why it doesn't follow]
- **Severity:** CRITICAL / NOTABLE / MINOR

## Contradictions
### [Finding title]
- **Source A:** "[quote]" (from [file])
- **Source B:** "[quote]" (from [file])
- **Issue:** [how they conflict]
- **Severity:** CRITICAL / NOTABLE / MINOR

## Overall Assessment
[2-3 sentences summary]
```

## PM-Facing Presentation

ProveIt presents reviews transparently:
- Summarises CRITICAL and NOTABLE findings
- Points PM to full `review-N.md` file
- Asks if PM wants any findings addressed before continuing
- CRITICAL findings are incorporated into score updates automatically
- NOTABLE findings are left to PM's judgement

## File Changes

**New files:**
- `scripts/openai-review.mjs` — the review script
- `package.json` — declares `openai` dependency

**Modified files:**
- `agents/proveit.md` — new Phase 4.6 (post-swarm review) and Phase 4.9 (pre-output review)
- `docs/design.md` — document the feature

## Prerequisites

- `OPENAI_API_KEY` environment variable
- `npm install` in proveit directory (one-time)
- Graceful degradation: skips review with message if no API key
