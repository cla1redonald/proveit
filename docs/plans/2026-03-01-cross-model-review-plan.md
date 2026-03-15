# Cross-Model Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an OpenAI o3 review step that independently checks ProveIt's analysis for gaps, bias, logical leaps, and contradictions — running twice per session (post-swarm and pre-output).

**Architecture:** A single Node.js script (`scripts/openai-review.mjs`) calls the OpenAI API with the synthesis content. ProveIt's agent definition gets two new phases (4.6 and 4.9) that shell out to the script and present results to the PM.

**Tech Stack:** Node.js, OpenAI SDK (`openai` npm package), o3 model

---

### Task 1: Create package.json with OpenAI dependency

**Files:**
- Create: `package.json`

**Step 1: Create the package.json**

```json
{
  "name": "proveit",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "openai": "^4"
  }
}
```

**Step 2: Run npm install**

Run: `npm install`
Expected: `node_modules/` created with `openai` package installed, no errors.

**Step 3: Verify .gitignore covers node_modules**

Read `.gitignore` — confirm `node_modules/` is already listed (it is, line 2).

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add package.json with openai dependency"
```

---

### Task 2: Create the review script

**Files:**
- Create: `scripts/openai-review.mjs`

**Step 1: Create the scripts directory**

Run: `mkdir -p scripts`

**Step 2: Write the review script**

```javascript
#!/usr/bin/env node

import OpenAI from "openai";
import { readFileSync } from "fs";

const content = readFileSync("/dev/stdin", "utf-8");

if (!content.trim()) {
  console.error("Error: No content provided on stdin.");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set.");
  process.exit(1);
}

const client = new OpenAI();

const systemPrompt = `You are an independent reviewer of a product validation analysis performed by a different AI model. Your job is to find what it missed or got wrong.

Review the following analysis for:

1. GAPS — What questions weren't asked? What evidence is missing? What market segments, user types, or risk factors were overlooked?
2. BIAS — Confirmation bias, optimism bias, anchoring to the PM's original framing, or systematic blind spots in the research methodology.
3. LOGICAL LEAPS — Conclusions that don't follow from the evidence cited. Claims presented as findings that are actually assumptions.
4. CONTRADICTIONS — Things that conflict within the research. Evidence that points in opposite directions without acknowledgement.

For each finding:
- Cite the specific section and quote the relevant text
- Rate severity: CRITICAL / NOTABLE / MINOR
- CRITICAL = would change the recommendation if addressed
- NOTABLE = worth investigating but not deal-breaking
- MINOR = style or completeness nit

If the analysis is solid and you find no significant issues, say so clearly. Do not manufacture problems to appear thorough.

Format your response as markdown with these sections:
## Gaps
## Bias
## Logical Leaps
## Contradictions
## Overall Assessment`;

const response = await client.chat.completions.create({
  model: "o3",
  reasoning_effort: "high",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content },
  ],
});

console.log(response.choices[0].message.content);
```

**Step 3: Make it executable**

Run: `chmod +x scripts/openai-review.mjs`

**Step 4: Verify it runs (dry run — expect API key error if not set)**

Run: `echo "test" | node scripts/openai-review.mjs 2>&1`
Expected: Either the OpenAI API key error message, or a valid response if the key is set.

**Step 5: Commit**

```bash
git add scripts/openai-review.mjs
git commit -m "feat: add cross-model review script using OpenAI o3"
```

---

### Task 3: Update .gitignore to cover review files

**Files:**
- Modify: `.gitignore:17-21`

**Step 1: Add review-*.md pattern to .gitignore**

After the `swarm-*.md` line (line 20), add:
```
review-*.md
```

This ensures review output files created in PM project directories are not committed to source control (same as research and swarm files).

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add review-*.md to gitignore"
```

---

### Task 4: Add Phase 4.6 (post-swarm review) to agent definition

**Files:**
- Modify: `agents/proveit.md:475-482`

**Step 1: Read the current agent definition around line 475**

Confirm the exact text after Phase 4.5 Step 5 (the swarm score update section) and before Phase 5.

**Step 2: Insert Phase 4.6 after line 482 (after the `---` that closes Phase 4.5)**

Insert the following new section between Phase 4.5 and Phase 5:

```markdown
## Phase 4.6: Cross-Model Review — Post-Swarm (automatic after swarm)

After the swarm synthesis scores are updated, run a cross-model review through OpenAI's o3 model. This catches gaps, bias, logical leaps, and contradictions that a single model might miss.

### Step 1: Check for API key

If `OPENAI_API_KEY` is not set in the environment, skip this phase with:
> "Cross-model review skipped — no OpenAI API key found. Set OPENAI_API_KEY to enable it."

### Step 2: Determine review round number

Glob for `review-*.md` in the current directory. Count existing files, add 1 to get N.

### Step 3: Prepare review input

Concatenate the contents of:
- `discovery.md`
- The latest `swarm-N-synthesis.md`

### Step 4: Run the review script

Shell out to the review script, piping the concatenated content:

```bash
cat discovery.md swarm-*-synthesis.md | node ~/proveit/scripts/openai-review.mjs
```

Capture the output.

### Step 5: Write review file

Write the output to `review-[N].md` with this header prepended:

```markdown
# Cross-Model Review [N]: Post-Swarm
Date: [date]
Model: o3
Reviewing: discovery.md, swarm-[N]-synthesis.md

[script output here]
```

### Step 6: Present to PM

Tell the PM:

> "I ran a cross-model review through OpenAI's o3. Here's what it flagged:"
>
> [Summarise CRITICAL and NOTABLE findings — skip MINOR unless there are no higher-severity findings]
>
> "Full review is in `review-[N].md`. Want me to address any of these before we continue?"

### Step 7: Incorporate CRITICAL findings

If any findings are rated CRITICAL, factor them into the confidence scores before proceeding. Update `discovery.md` scores and explain the adjustment to the PM.

Update `discovery.md` Research Files section:
```
- review-[N].md — Cross-model review: post-swarm ([date])
```

---
```

**Step 3: Commit**

```bash
git add agents/proveit.md
git commit -m "feat: add Phase 4.6 — post-swarm cross-model review"
```

---

### Task 5: Add Phase 4.9 (pre-output review) to agent definition

**Files:**
- Modify: `agents/proveit.md` (just before Phase 5: Outputs)

**Step 1: Read the agent definition to find the exact location of Phase 5**

Find the line `## Phase 5: Outputs (runs once, when ready)` (currently line 486).

**Step 2: Insert Phase 4.9 before Phase 5**

Insert the following new section immediately before Phase 5:

```markdown
## Phase 4.9: Cross-Model Review — Pre-Output (automatic before outputs)

Before generating the Gamma deck and validation playbook, run a final cross-model review. This reviews the complete analysis — all research, all swarm findings, all scores — as a final sanity check before the PM takes this to their team.

This phase fires even if the PM skipped the swarm. It is the minimum review gate.

### Step 1: Check for API key

If `OPENAI_API_KEY` is not set, skip with:
> "Cross-model review skipped — no OpenAI API key found. Set OPENAI_API_KEY to enable it."

### Step 2: Determine review round number

Glob for `review-*.md`. Count existing files, add 1 to get N.

### Step 3: Prepare review input

Concatenate the contents of:
- `discovery.md`
- All `research-*.md` files
- All `swarm-*-synthesis.md` files (if any)
- All prior `review-*.md` files (so o3 can see if its earlier feedback was addressed)

### Step 4: Run the review script

```bash
cat discovery.md research-*.md swarm-*-synthesis.md review-*.md 2>/dev/null | node ~/proveit/scripts/openai-review.mjs
```

### Step 5: Write review file

Write to `review-[N].md` with header:

```markdown
# Cross-Model Review [N]: Pre-Output
Date: [date]
Model: o3
Reviewing: discovery.md, all research files, all swarm files, prior reviews

[script output here]
```

### Step 6: Present to PM

> "Final cross-model review before handoff — here's what o3 flagged:"
>
> [Summarise CRITICAL and NOTABLE findings]
>
> "Full review is in `review-[N].md`. Want me to address anything before I generate the deck?"

### Step 7: Incorporate and proceed

Factor any CRITICAL findings into final scores. Update `discovery.md`. Then proceed to Phase 5 (outputs).

Update `discovery.md` Research Files section:
```
- review-[N].md — Cross-model review: pre-output ([date])
```

---
```

**Step 3: Commit**

```bash
git add agents/proveit.md
git commit -m "feat: add Phase 4.9 — pre-output cross-model review"
```

---

### Task 6: Update docs/design.md

**Files:**
- Modify: `docs/design.md`

**Step 1: Add cross-model review to the Core Loop diagram**

In the Core Loop section (around line 24-34), update the flow diagram to include the review steps:

```
Brain Dump → Structured Discovery → Research → Findings Review
                                                      ↓
                                              Swarm? (optional)
                                                      ↓
                                              ★ Cross-Model Review #1 (post-swarm)
                                                      ↓
                                              Confidence high enough?
                                               No → back to Discovery
                                              Yes → ★ Cross-Model Review #2 (pre-output)
                                                      ↓
                                              Gamma Deck + Validation Playbook
```

**Step 2: Add a new section after Phase 4.5 documentation**

After the Phase 4.5 section (around line 182), add:

```markdown
### Phase 4.6 & 4.9: Cross-Model Review (OpenAI o3)

ProveIt sends its synthesis to OpenAI's o3 model for independent review. o3 checks for gaps, bias, logical leaps, and contradictions. Runs at two checkpoints:

- **Phase 4.6 (post-swarm):** Reviews `swarm-N-synthesis.md` + `discovery.md` after the swarm, before scores are updated.
- **Phase 4.9 (pre-output):** Reviews all files before generating the Gamma deck. Fires even if the swarm was skipped.

Results are shown transparently to the PM. CRITICAL findings are incorporated into scores. NOTABLE findings are presented for PM judgement.

**Script:** `scripts/openai-review.mjs` — reads markdown from stdin, sends to o3 with high reasoning effort, returns structured review.

**Prerequisite:** `OPENAI_API_KEY` environment variable. Gracefully skipped if not set.

**Output:** `review-N.md` files in the project directory (covered by `.gitignore`).
```

**Step 3: Add `openai-review.mjs` to the Plugin Structure section**

In the Plugin Structure tree (around line 307), add the scripts directory:

```
proveit/
├── scripts/
│   └── openai-review.mjs     # Cross-model review via OpenAI o3
├── package.json               # Dependencies (openai)
```

**Step 4: Add OpenAI to MCP Tools Required table**

In the MCP Tools Required section (around line 329), add:

```
| `openai` (npm) | Cross-model review — independent bias/gap check via o3 |
```

**Step 5: Commit**

```bash
git add docs/design.md
git commit -m "docs: add cross-model review to design document"
```

---

### Task 7: Update discovery.md template in agent definition

**Files:**
- Modify: `agents/proveit.md` (discovery.md template section, around line 527-578)

**Step 1: Add review files to the Research Files example**

In the discovery.md template's Research Files section, add:

```markdown
## Research Files
- research-1.md — [one-line summary] ([date])
- research-2.md — [one-line summary] ([date])
- swarm-1-synthesis.md — Deep dive: [question] ([date])
- review-1.md — Cross-model review: post-swarm ([date])
- review-2.md — Cross-model review: pre-output ([date])
```

**Step 2: Commit**

```bash
git add agents/proveit.md
git commit -m "docs: add review files to discovery.md template"
```

---

### Task 8: Update CLAUDE.md with new file reference

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add scripts directory to the Directory Structure section**

Update the directory structure in CLAUDE.md to include:

```
proveit/
├── agents/proveit.md      # Core agent definition — discovery loop, scoring, outputs
├── commands/proveit.md    # Skill entry point for /proveit
├── scripts/
│   └── openai-review.mjs  # Cross-model review via OpenAI o3
├── docs/design.md         # Design decisions and validation framework
└── .claude/settings.json  # Permissions config (Bash disabled by default)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add scripts directory to CLAUDE.md"
```

---

### Task 9: End-to-end manual test

**Step 1: Verify API key is set**

Run: `echo $OPENAI_API_KEY | head -c 8`
Expected: First 8 chars of your API key (e.g. `sk-proj-`)

**Step 2: Test with sample synthesis content**

Create a small test input and pipe it through:

```bash
echo "## Executive Summary
This product has strong desirability (8/10) because users on Reddit express frustration.
Viability is moderate (6/10) — competitors exist but none charge over $10/month.
The market is guaranteed to grow 50% annually based on one blog post.

## Confidence-Weighted Recommendation
Recommendation: Proceed to build." | node scripts/openai-review.mjs
```

Expected: Structured markdown output with findings. The "guaranteed to grow 50%" claim should be flagged as a logical leap or bias.

**Step 3: Test graceful failure without API key**

```bash
OPENAI_API_KEY="" node scripts/openai-review.mjs < /dev/null 2>&1
```

Expected: Error message about missing API key, exit code 1.

**Step 4: Test empty input**

```bash
echo "" | node scripts/openai-review.mjs 2>&1
```

Expected: Error message about no content, exit code 1.

**Step 5: Final commit and push**

```bash
git push origin main
```
