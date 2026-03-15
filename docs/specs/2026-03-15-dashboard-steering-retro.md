# ProveIt: Portfolio Dashboard, Research Steering, Calibration Retro

**Date:** 2026-03-15
**Issues:** #17 (portfolio dashboard), #18 (research steering), #19 (calibration retro)
**Author:** Claire Donald

## Summary

Three independent enhancements to ProveIt:

1. **Portfolio Dashboard** — `/proveit:dashboard` command that scans for discovery.md files and shows a comparison table
2. **Research Steering** — one optional question before research to let the PM direct the focus
3. **Calibration Retro** — `/proveit:retro` command that records outcomes against predictions

---

## Feature 1: Portfolio Dashboard (#17)

### Command

`/proveit:dashboard`

### How it works

1. Globs for `**/discovery.md` under `~/` (skips `node_modules/`, `.git/`, `.claude/`)
2. Reads each `discovery.md` and extracts: idea name, D/V/F scores, status, last updated date
3. Optionally reads the Obsidian Ideas Board (`01_Projects/Micro_Business_Portfolio/Ideas Board.md`) via the Obsidian MCP to pull in kanban status (Backlog/Researching/Building/Live/Killed)
4. Presents a comparison table in the terminal

### Output format

```
ProveIt Portfolio — 5 ideas found

| Idea              | D  | V  | F  | Status            | Board      | Updated    |
|-------------------|----|----|----|--------------------|------------|------------|
| Roami Find        | 8  | 7  | 6  | Ready for handoff  | Researching| 2026-03-10 |
| Adventure CC      | 7  | 6  | 7  | Ready for handoff  | Building   | 2026-03-08 |
| Baby Name Scorer  | 5  | 3  | 8  | Needs discovery    | Backlog    | 2026-03-01 |
| Roami Hobbies     | 8  | 6  | 5  | Researching        | Researching| 2026-03-05 |
| PageWatch         | -  | -  | -  | Not started        | Backlog    | —          |
```

### Parsing discovery.md

Extract from the `## Confidence Score` section:
- Pattern: `Desirability: X/10 | Viability: X/10 | Feasibility: X/10`
- Pattern: `Status: [value]`

Extract from the header:
- Pattern: `# ProveIt: [Idea Name]`
- Pattern: `Last updated: [date]`

If any field is missing, show `-` in that column.

### Obsidian integration

Read the Ideas Board via `mcp__obsidian__read_note` with path `01_Projects/Micro_Business_Portfolio/Ideas Board.md`. Parse the kanban sections (## Backlog, ## Researching, ## Building, ## Live, ## Killed / Merged) to find which section each idea appears in.

Match ideas by name (fuzzy — the Ideas Board may use slightly different names). If no match found, show `-` in the Board column.

If the Obsidian MCP is not available, skip the Board column and show the table without it.

### Constraints

- **Read-only** — never modifies any discovery.md or the Ideas Board
- **Skips directories:** `node_modules/`, `.git/`, `.claude/`, `.brandit-temp/`
- **No arguments needed** — always scans from `~/`

### File

New command: `~/proveit/commands/proveit-dashboard.md`

---

## Feature 2: Research Steering (#18)

### What changes

One optional question added to Phase 3 (Research) in `~/proveit/agents/proveit.md`.

### Where in the flow

Before the existing line "Tell the PM: 'I'm going to research this now. Give me a few minutes.'" — add:

> "Before I dive in — anything I should focus on specifically, or anything I should ignore? For example, a specific market segment, competitor to skip, or ecosystem to look at."

### How it's used

- If the PM gives direction, pass it as additional context appended to all three research subagent prompts (competitor landscape, market evidence, viability signals)
- If the PM says "no, just go" or similar, proceed as normal with no additional context
- The steering input is also written to `discovery.md` in the Research Files section as a note: `Research steering: [PM's input]`

### Constraints

- One question only — don't turn it into an interrogation
- Optional — if the PM declines, move on immediately
- Does not change the research subagent structure, just adds context to their prompts

### File

Modify: `~/proveit/agents/proveit.md` — Phase 3 (Research) section

---

## Feature 3: Calibration Retro (#19)

### Command

`/proveit:retro`

### How it works

1. Checks for `discovery.md` in the current directory — if not found, says "No ProveIt session found in this directory. Run this from a project that has a discovery.md."
2. Reads `discovery.md` and extracts the original scores and recommendation
3. Asks 3 questions (one at a time):
   - "What happened with this idea?" → shipped / pivoted / killed / still in progress
   - "How accurate were the ProveIt scores?" → spot on / mostly right / missed something big
   - "What did we get wrong or miss?" → open-ended
4. Writes a `## Retro` section to the bottom of `discovery.md`

### Retro section format

```markdown
## Retro
Date: [date]
Outcome: [shipped / pivoted / killed / still in progress]
Original scores: D[X]/V[X]/F[X]
Accuracy: [spot on / mostly right / missed something big]
Notes: [PM's response to what we got wrong or missed]
```

### If a Retro section already exists

Read the existing retro and ask: "You already have a retro from [date]. Want to update it or add a new one?" If update, replace the section. If add, append a second retro section with an incremented header (`## Retro 2`).

### Constraints

- Only modifies `discovery.md` — adds/updates the Retro section
- Does not aggregate across ideas (future enhancement)
- Conversational — one question at a time, warm tone
- Quick — should take 2 minutes max

### File

New command: `~/proveit/commands/proveit-retro.md`

---

## Files Changed

| File | Change |
|------|--------|
| `~/proveit/commands/proveit-dashboard.md` | **Create** — new `/proveit:dashboard` command |
| `~/proveit/commands/proveit-retro.md` | **Create** — new `/proveit:retro` command |
| `~/proveit/agents/proveit.md` | **Modify** — add research steering question to Phase 3 |
| `~/proveit/docs/design.md` | **Modify** — mention dashboard and retro commands in scope |

## What This Is NOT

- Dashboard is not a web UI — terminal output only
- Retro does not aggregate patterns across ideas (future enhancement)
- Research steering does not change the research subagent structure
- None of these change the core discovery/research/scoring flow
