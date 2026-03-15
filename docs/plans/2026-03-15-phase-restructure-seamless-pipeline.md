# Phase Restructure & Seamless Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename ProveIt's decimal-numbered phases (4.5, 4.6, 4.85, 4.9) to named phases 1-10, add in-session BrandIt invocation as Phase 7, and add Next Steps as Phase 10.

**Architecture:** Modifications to two existing markdown files in the ProveIt plugin. No code changes — all edits are to the agent definition (`agents/proveit.md`) and design doc (`docs/design.md`). The agent definition is ~770 lines of markdown.

**Tech Stack:** Markdown (Claude Code plugin agent definition format)

**Spec:** `~/proveit/docs/specs/2026-03-15-phase-restructure-seamless-pipeline.md`

---

## File Structure

```
~/proveit/
├── agents/proveit.md    # MODIFY — all phase renames, add Phase 7 + Phase 10, update frontmatter
└── docs/design.md       # MODIFY — update flow diagram, phase names, model strategy table
```

---

## Chunk 1: Agent Definition — Frontmatter + Phase Renames

### Task 1: Update frontmatter — add Bash to tools

**Files:**
- Modify: `~/proveit/agents/proveit.md:4`

- [ ] **Step 1: Add Bash to tools line**

Change line 4 from:
```
tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Task
```
to:
```
tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Task, Bash
```

- [ ] **Step 2: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "chore: add Bash to ProveIt agent tools for logo script invocation"
```

---

### Task 2: Rename Phases 1-4 and update Core Loop

**Files:**
- Modify: `~/proveit/agents/proveit.md:48-54,70,160,205,292`

- [ ] **Step 1: Update Core Loop diagram (line 53)**

Change:
```
Brain Dump → Structured Discovery → Research → Findings Review → [Swarm?] → [Loop or Exit]
```
to:
```
1. Brain Dump → 2. Discovery → 3. Research → 4. Findings Review → [5. Deep Dive?] → [Loop or Exit]
```

- [ ] **Step 2: Rename Phase 1 header (line 70)**

Change: `## Phase 1: Brain Dump (runs once)`
To: `## 1. Brain Dump (runs once)`

- [ ] **Step 3: Update Session Start reference (line 66)**

Change: `Start fresh with Phase 1 (Brain Dump).`
To: `Start fresh with Brain Dump (Phase 1).`

- [ ] **Step 4: Rename Phase 2 header (line 160)**

Change: `## Phase 2: Structured Discovery (loops)`
To: `## 2. Discovery (loops)`

- [ ] **Step 5: Rename Phase 3 header (line 205)**

Change: `## Phase 3: Standard Research (loops)`
To: `## 3. Research (loops)`

- [ ] **Step 6: Rename Phase 4 header (line 292)**

Change: `## Phase 4: Findings Review (loops)`
To: `## 4. Findings Review (loops)`

- [ ] **Step 7: Update Phase 4 cross-reference (line 327)**

Change: `Offer Research Swarm (see Phase 4.5), then outputs`
To: `Offer Deep Dive (Phase 5), then outputs`

- [ ] **Step 8: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "refactor: rename Phases 1-4 to named format"
```

---

### Task 3: Rename Phases 4.5 and 4.6 → 5 and 6

**Files:**
- Modify: `~/proveit/agents/proveit.md:337,486`

- [ ] **Step 1: Rename Phase 4.5 header (line 337)**

Change: `## Phase 4.5: Research Swarm (optional, offered after every Phase 4)`
To: `## 5. Deep Dive (optional — offered after every Findings Review)`

- [ ] **Step 2: Update the offer text (line 341)**

Change: `Want me to run a deeper research swarm on that?`
To: `Want me to run a deeper dive on that?`

Keep the rest of the explanation the same — it still describes the 5-agent swarm process.

- [ ] **Step 3: Rename Phase 4.6 header (line 486)**

Change: `## Phase 4.6: Cross-Model Review — Post-Swarm (automatic after swarm)`
To: `## 6. Cross-Model Review — Post-Deep-Dive (automatic after Deep Dive)`

- [ ] **Step 4: Update Phase 4.6 internal references**

In the Phase 4.6/6 section, find any references to "Phase 4.5" or "swarm" in phase-reference context and update:
- "after the swarm" → "after the Deep Dive" (where it refers to the phase, not the technique)
- Keep "swarm" where it refers to the actual 5-agent technique

- [ ] **Step 5: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "refactor: rename Phase 4.5 → Deep Dive, Phase 4.6 → Cross-Model Review"
```

---

## Chunk 2: Replace Phase 4.85 with In-Session BrandIt (Phase 7)

### Task 4: Replace Phase 4.85 with Phase 7 — Brand Identity

**Files:**
- Modify: `~/proveit/agents/proveit.md:549-562`

This is the biggest change. The current Phase 4.85 is a 13-line section that tells the PM to run `/brandit`. Replace it with the full in-session BrandIt flow.

- [ ] **Step 1: Replace the entire Phase 4.85 section**

Delete lines 549-562 (from `## Phase 4.85:` through to the `---` before Phase 4.9) and replace with:

```markdown
## 7. Brand Identity (optional — offered before Final Review)

Before the Final Review and Gamma deck, offer brand identity creation:

> "Before I generate the deck — want to create a brand identity? It'll take about 20 minutes. You'll get a name, logo, colours, fonts, and design tokens. The Gamma deck will use your actual brand."

This is optional. The PM can skip it.

### Prerequisites

Before offering this phase, check:

**`OPENAI_API_KEY`** — if not set, offer the brand flow without logo generation:
> "Logo generation requires an OpenAI API key. I can still create your brand identity — name, colours, fonts, and tokens — but without an AI-generated logo. Want to proceed?"

**`brand.md` already exists** — if the PM previously ran `/brandit`:
> "You already have a brand set up — [name]. Want to use it for the deck, refine it, or start fresh?"

If the PM says "use it," skip to Phase 8. If "refine" or "start fresh," continue below.

### Step 1: Brand Brief (3-4 questions)

Skip product/user questions — you already know from Discovery. Ask only brand-specific gaps:

1. "What personality should this brand have? More playful or more serious? More premium or more accessible?"
2. "Any names you've been kicking around, or should I start fresh?"
3. "Any brands you admire the look and feel of? Doesn't have to be in the same space."
4. "Anything you definitely don't want? (e.g. 'no blue — every competitor is blue')"

One question at a time. After 2-3 answers, reflect back: "So I'm hearing [X personality] for [Y audience]. Sound right?"

### Step 2: Generate Three Directions

Tell the PM: "Give me a couple of minutes — I'm putting together three brand directions."

Spawn 3 parallel Sonnet subagents via the Task tool in a **single message**. All use `model: "sonnet"` and `subagent_type: "general-purpose"`.

Each agent receives the brief context, contents of `discovery.md`, and their specific mandate.

**Direction A** (writes to `.brandit-temp/direction-a.json`):
> "You are generating the **BOLD, CONFIDENT** brand direction. Context: [BRIEF + DISCOVERY]. Your mandate: Create a brand that feels strong, assertive, and direct. Choose a punchy name, bold colours (strong primary, high contrast), a confident tagline, and a direct tone of voice. Use Google Fonts only. Write your output as JSON to `.brandit-temp/direction-a.json` using this structure:
> ```json
> {
>   "name": "BrandName",
>   "tagline": "One line tagline",
>   "personality": { "adjectives": ["bold", "confident", "direct"], "description": "One paragraph" },
>   "colors": {
>     "primary": "#hex", "secondary": "#hex", "accent": "#hex",
>     "neutral": { "50": "#hex", "100": "#hex", "200": "#hex", "300": "#hex", "400": "#hex", "500": "#hex", "600": "#hex", "700": "#hex", "800": "#hex", "900": "#hex" },
>     "success": "#hex", "warning": "#hex", "error": "#hex", "info": "#hex"
>   },
>   "typography": {
>     "heading": { "family": "Font Name", "weights": [600, 700] },
>     "body": { "family": "Font Name", "weights": [400, 500] },
>     "mono": { "family": "Font Name", "weights": [400] }
>   },
>   "toneOfVoice": {
>     "guidelines": "How we write",
>     "weSay": "Example phrase",
>     "weDontSay": "Example phrase",
>     "errorExample": "Example error message",
>     "welcomeExample": "Example welcome message"
>   },
>   "logoPrompt": "A DALL-E prompt for the symbol/icon. Describe the visual style, shape, mood. No text."
> }
> ```"

**Direction B** (writes to `.brandit-temp/direction-b.json`):
> Same structure, mandate: "**FRIENDLY, APPROACHABLE** brand direction. Warm colours, inviting name, conversational tone."

**Direction C** (writes to `.brandit-temp/direction-c.json`):
> Same structure, mandate: "**MINIMAL, PREMIUM** brand direction. Restrained palette, elegant name, refined tone."

Adapt mandates based on the PM's brief. If they said "nothing corporate," Direction C becomes "minimal, creative."

### Step 3: Domain Check

Use WebSearch to check availability of `.com`, `.co`, `.io`, and `.app` for each name. Results are indicative ("likely available" / "likely taken"), not guaranteed.

### Step 4: Generate Logos

After all 3 direction JSONs are written, invoke the logo script for each:

```bash
node ~/brandit/scripts/generate-logo.mjs \
  --prompt "[logoPrompt from JSON]" \
  --name "[name from JSON]" \
  --font "[heading font from JSON]" \
  --font-weight 700 \
  --primary-color "[primary color from JSON]" \
  --bg-color "#FFFFFF" \
  --output-dir ./.brandit-temp/direction-a-logos/
```

Repeat for B and C.

**If the script fails** (exit code 1 or 2): note the failure and continue without a logo for that direction. Tell the PM which direction couldn't generate a logo and why.

**DALL-E budget:** 3 calls for initial directions + up to 3 for refinement = 6 maximum.

### Step 5: Present

Show all three directions in the terminal as a structured comparison — name, tagline, colour swatches (hex codes), font names, logo status, tone of voice examples. If the superpowers visual companion is already active in the session, use it instead.

Tell the PM: "Here are three brand directions. Pick your favourite, mix and match across them, or tell me what to adjust."

### Step 6: Refine

**Pick one:** "I like B." → Confirm, ask if anything needs tweaking.

**Mix and match:** "Name from A, colours from C, logo from B." → Merge, check coherence. Flag clashes: "That name feels more casual than those colours suggest — want me to adjust?"

**None quite right:** "B but less corporate." → Revise. Only spend a DALL-E call if the logo concept changes. Reuse existing symbol if only colours/fonts/name changed.

**Limits:**
- Maximum 3 refinement rounds. After the third: "Remember — this is your MVP brand, not your forever brand. Let's ship this and evolve it later."
- Maximum 3 additional DALL-E calls (6 total). If exhausted: "That's the last logo round — pick the closest one."

### Step 7: Write Brand Outputs

When the PM confirms, write to the current directory:
- `brand.md` — brand guidelines (use the template from `~/brandit/agents/brandit.md`)
- `brand-tokens.css` — CSS custom properties (use the template from `~/brandit/agents/brandit.md`)
- `brand-tokens.json` — JSON design tokens (use the template from `~/brandit/agents/brandit.md`)
- Copy final logo PNGs from `.brandit-temp/` to current directory as `brand-logo.png`, `brand-logo-dark.png`, `brand-logo-favicon.png`

Clean up `.brandit-temp/` directory.

### Step 8: Resume

Continue to Phase 8 (Final Review). Brand assets are now available for the Gamma deck.
```

- [ ] **Step 2: Verify the section boundaries**

The new Phase 7 should sit between the end of Phase 6 (Cross-Model Review — Post-Deep-Dive) and the start of Phase 8 (renamed from Phase 4.9). Check that the `---` separators are correct.

- [ ] **Step 3: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "feat: replace Phase 4.85 with in-session BrandIt flow (Phase 7)"
```

---

## Chunk 3: Rename Remaining Phases + Add Phase 10

### Task 5: Rename Phase 4.9 → Phase 8 and Phase 5 → Phase 9

**Files:**
- Modify: `~/proveit/agents/proveit.md:565,617,626`

- [ ] **Step 1: Rename Phase 4.9 header**

Change: `## Phase 4.9: Cross-Model Review — Pre-Output (automatic before outputs)`
To: `## 8. Final Review (automatic before outputs)`

- [ ] **Step 2: Update Phase 4.9 internal reference (line 617)**

Change: `Then proceed to Phase 5 (outputs).`
To: `Then proceed to Phase 9 (Outputs).`

- [ ] **Step 3: Rename Phase 5 header (line 626)**

Change: `## Phase 5: Outputs (runs once, when ready)`
To: `## 9. Outputs (runs once, when ready)`

- [ ] **Step 4: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "refactor: rename Phase 4.9 → Final Review, Phase 5 → Outputs"
```

---

### Task 6: Replace "What's Next" with Phase 10

**Files:**
- Modify: `~/proveit/agents/proveit.md:662-670`

- [ ] **Step 1: Replace the "What's Next" subsection**

The current "### What's Next — Offer to Build" section (lines 662-670) is a subsection of Phase 5/9. Replace it with a standalone phase:

Delete lines 662-670 and the `---` after, then add after the Validation Playbook section:

```markdown
---

## 10. Next Steps

After presenting the Gamma deck and validation playbook, present a clean closing:

> "Your idea is validated and ready for handoff. Here's what you can do next:
>
> - **Build it** — run `/orchestrate` to kick off a full ShipIt build. It'll read your `discovery.md` and `brand.md` for context.
> - **Share the deck** — the Gamma presentation is ready for your team.
> - **Keep validating** — if you want to dig deeper on any score, we can loop back.
>
> Everything's saved. Come back anytime."

This is a handoff, not an invocation. ProveIt's job is done at this point — the PM decides what happens next.
```

- [ ] **Step 2: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "feat: add Phase 10 (Next Steps) — offer /orchestrate as handoff"
```

---

### Task 7: Sweep all remaining cross-references

**Files:**
- Modify: `~/proveit/agents/proveit.md` (multiple locations)

- [ ] **Step 1: Search for stale phase references**

Run: `grep -n "Phase [0-9]" ~/proveit/agents/proveit.md`

Find any remaining references to old phase numbers (Phase 1, Phase 2, Phase 3, Phase 4, Phase 4.5, Phase 4.6, Phase 4.85, Phase 4.9, Phase 5) and update them to the new naming:

| Old | New |
|-----|-----|
| Phase 1 | Phase 1 (Brain Dump) — or just "Brain Dump" |
| Phase 2 | Phase 2 (Discovery) |
| Phase 3 | Phase 3 (Research) |
| Phase 4 | Phase 4 (Findings Review) |
| Phase 4.5 | Phase 5 (Deep Dive) |
| Phase 4.6 | Phase 6 (Cross-Model Review) |
| Phase 4.85 | Phase 7 (Brand Identity) |
| Phase 4.9 | Phase 8 (Final Review) |
| Phase 5 | Phase 9 (Outputs) |

Focus on references in running text and comments — the headers themselves are already renamed by Tasks 2-6.

- [ ] **Step 2: Commit**

```bash
cd ~/proveit && git add agents/proveit.md
git commit -m "refactor: update all phase cross-references to new naming"
```

---

## Chunk 4: Update design.md

### Task 8: Update design.md to match new phase names

**Files:**
- Modify: `~/proveit/docs/design.md`

- [ ] **Step 1: Read design.md**

Read the full file to find all phase references.

- [ ] **Step 2: Update the Core Loop diagram (around line 25-36)**

Update the ASCII flow diagram to show the new phase names and numbers (1-10).

- [ ] **Step 3: Rename all phase headers**

| Old | New |
|-----|-----|
| `### Phase 1: Brain Dump` | `### 1. Brain Dump` |
| `### Phase 2: Structured Discovery` | `### 2. Discovery` |
| `### Phase 3: Standard Research` | `### 3. Research` |
| `### Phase 4: Findings Review` | `### 4. Findings Review` |
| `### Phase 4.5: Research Swarm` | `### 5. Deep Dive` |
| `### Phase 4.6 & 4.9: Cross-Model Review` | `### 6 & 8. Cross-Model Review` |
| `### Phase 5: Outputs` | `### 9. Outputs` |

- [ ] **Step 4: Add Phase 7 and 10 to the design doc**

Add brief descriptions of Phase 7 (Brand Identity — in-session BrandIt) and Phase 10 (Next Steps — offer /orchestrate) in the appropriate places.

- [ ] **Step 5: Update the Model Strategy table**

Add a row for Phase 7:
```
| Brand Identity | Opus (brief) + Sonnet (3 parallel subagents) + DALL-E (logos) | Creative brief needs judgement, direction generation is parallel |
```

Add a row for Phase 10:
```
| Next Steps | Opus | Simple — just presenting options |
```

- [ ] **Step 6: Update any references to "Phase 4.5", "Phase 4.6", etc. in running text**

Same mapping as Task 7.

- [ ] **Step 7: Commit**

```bash
cd ~/proveit && git add docs/design.md
git commit -m "docs: update design.md with new phase names and Phase 7/10"
```

---

### Task 9: Final verification and push

**Files:**
- Verify: `~/proveit/agents/proveit.md`
- Verify: `~/proveit/docs/design.md`

- [ ] **Step 1: Verify no stale phase references remain**

Run: `grep -n "Phase 4\." ~/proveit/agents/proveit.md ~/proveit/docs/design.md`

Expected: zero matches (all decimal phases renamed).

- [ ] **Step 2: Verify all 10 phases exist in agent definition**

Run: `grep -n "^## [0-9]" ~/proveit/agents/proveit.md`

Expected output (10 phases):
```
## 1. Brain Dump
## 2. Discovery
## 3. Research
## 4. Findings Review
## 5. Deep Dive
## 6. Cross-Model Review
## 7. Brand Identity
## 8. Final Review
## 9. Outputs
## 10. Next Steps
```

- [ ] **Step 3: Show git log**

Run: `cd ~/proveit && git log --oneline -10`

- [ ] **Step 4: Push**

Run: `cd ~/proveit && git push`
