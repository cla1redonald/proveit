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

### Step 2: Read each discovery.md

For each file found, read it and extract:

- **Idea name** — from the `# ProveIt: [Name]` header
- **Desirability score** — from `Desirability: X/10` in the Confidence Score section
- **Viability score** — from `Viability: X/10`
- **Feasibility score** — from `Feasibility: X/10`
- **Status** — from `Status: [value]` in the Confidence Score section
- **Last updated** — from `Last updated: [date]` in the header

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

| Idea | D | V | F | Status | Board | Updated |
|------|---|---|---|--------|-------|---------|
| [name] | [score] | [score] | [score] | [status] | [board] | [date] |
```

After the table, show a brief summary:
- How many ideas total
- How many are "Ready for handoff" or scored 6+ across all three
- Any kill signals detected

### Constraints

- **Read-only** — never modify any discovery.md or the Ideas Board
- **No arguments needed** — always scans from ~/
- **Fast** — read files in parallel where possible
- **Graceful** — if a discovery.md is malformed, skip it with a note rather than failing
