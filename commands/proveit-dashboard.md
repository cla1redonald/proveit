---
description: Show a comparison table of all ProveIt-validated ideas across your projects.
---

# /proveit:dashboard

You are running the **ProveIt Portfolio Dashboard**. Your job is to find all validated ideas and present a comparison table.

## Steps

### Step 1: Scan for discovery.md files

Use Glob to search for `**/discovery.md` under the user's home directory (`~/`).

**Skip these directories** (pass as glob ignore patterns):
- `node_modules/`
- `.git/`
- `.claude/`
- `.brandit-temp/`
- `Library/`
- `.Trash/`
- `Applications/`
- `.npm/`
- `.nvm/`

### Step 2: Filter and read each discovery.md

**First, validate each file is a ProveIt output** — not every `discovery.md` is ours. Check that the file contains a `## Confidence Score` section with at least one `X/10` score pattern. If it doesn't, skip it silently (it's likely an unrelated doc like an architecture discovery file).

For each valid file, extract:

- **Idea name** — from the first `# ` header. Accept any prefix format: `# ProveIt: [Name]`, `# [ProjectName]: [Name]`, or just `# [Name]`. Strip the prefix before the colon if present.
- **Scores** — from the `## Confidence Score` section, match ALL `[Label]: X/10` patterns on the score line. Always look for Desirability, Viability, and Feasibility. If additional scores exist (e.g. `Strategy Alignment: 9/10`), include them as extra columns.
- **Status** — from `Status: [value]` in the Confidence Score section
- **Last updated** — from `Last updated: [date]` in the header
- **Gamma deck** — from the `## Gamma Deck` section. Distinguish between: a URL (deck exists), "Not yet generated" (no deck), or missing section (show `-`).

If any field is missing, show `-` in that column.

### Step 3: Check Obsidian Ideas Board (optional)

Try to read the Obsidian Ideas Board using `mcp__obsidian__read_note` with path `01_Projects/Micro_Business_Portfolio/Ideas Board.md`.

If successful, parse the kanban sections:
- `## Backlog`
- `## Researching`
- `## Building`
- `## Portfolio (free tools)`
- `## Live`
- `## Killed / Merged`

For each idea found in Step 2, check which kanban section it appears in (fuzzy name matching — the board may use slightly different names). Add a "Board" column to the table.

If the Obsidian MCP is not available or the read fails, skip the Board column silently.

### Step 4: Present the table

Sort ideas by highest combined score (D+V+F) descending. Present as a markdown table:

```
ProveIt Portfolio — [N] ideas found

| Idea | D | V | F | Status | Board | Deck | Updated |
|------|---|---|---|--------|-------|------|---------|
| [name] | [score] | [score] | [score] | [status] | [board] | [yes/no/-] | [date] |
```

If any ideas have extra score columns (e.g. Strategy Alignment), add those columns for the ideas that have them and show `-` for ideas that don't.

After the table, show a brief summary:
- How many ideas total
- How many are "Ready for handoff" or scored 6+ across all three
- How many have Gamma decks generated
- Any kill signals detected
- How many files were skipped as non-ProveIt (if any)

### Constraints

- **Read-only** — never modify any discovery.md or the Ideas Board
- **No arguments needed** — always scans from ~/
- **Fast** — read files in parallel where possible
- **Graceful** — if a discovery.md is malformed, skip it with a note rather than failing
