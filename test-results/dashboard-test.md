# ProveIt Dashboard Test Results

**Run date:** 2026-03-15
**Test:** Manual simulation of `/proveit:dashboard` concept

---

## Discovery Files Found

Searched under `/Users/clairedonald/` excluding: `node_modules`, `.git`, `.claude`, `Library`, `.Trash`, `Applications`, `.npm`, `.nvm`

**Files found: 3**

| # | Path |
|---|------|
| 1 | `/Users/clairedonald/mooveit/discovery.md` |
| 2 | `/Users/clairedonald/proveit-test/discovery.md` |
| 3 | `/Users/clairedonald/clawdbot-main/docs/gateway/discovery.md` |

---

## Parsed Results

| Idea Name | D | V | F | Status | Last Updated | Path |
|-----------|---|---|---|--------|--------------|------|
| MooveIt: Sticker Sample Pack (Paid Postage) | 7/10 | 8/10 | 8/10 | Ready for review | 2026-02-07 | `mooveit/discovery.md` |
| FreelanceRemind (Invoice Reminder Tool for Freelancers) | 8/10 | 5/10 | 7/10 | Needs more discovery | 2026-02-07 | `proveit-test/discovery.md` |
| _(not a ProveIt file — see parsing notes)_ | — | — | — | — | — | `clawdbot-main/docs/gateway/discovery.md` |

---

## Parsing Notes

### `/Users/clairedonald/mooveit/discovery.md`
- **Status:** Parsed successfully
- **Anomaly:** Title format is `# MooveIt: Sticker Sample Pack (Paid Postage)` — uses the project name prefix (`MooveIt`) rather than the standard `# ProveIt: [Name]` heading format. The dashboard parser would need to handle this case (either accept any `# Title:` format, or normalise on the prefix).
- **Additional field:** Contains a `Strategy Alignment: 9/10` score that is not part of the standard D/V/F schema. A dashboard should be aware of this optional field.
- **Gamma deck:** Present — `https://gamma.app/docs/6qknmjst420lxo6`

### `/Users/clairedonald/proveit-test/discovery.md`
- **Status:** Parsed successfully
- **Title format:** Uses the standard `# ProveIt: [Name]` heading. Clean match.
- **Gamma deck:** Listed as `Not yet generated` — a dashboard would show this as a missing asset.

### `/Users/clairedonald/clawdbot-main/docs/gateway/discovery.md`
- **Status:** NOT a ProveIt file
- **Reason:** This is a technical architecture document about Bonjour/Tailscale/SSH node discovery for the Clawdbot project. It has YAML frontmatter (`summary`, `read_when` fields) and no ProveIt heading, score block, or status field.
- **Recommendation:** The dashboard parser needs a guard: before parsing, check that the file contains a `## Confidence Score` section (or `Desirability:` pattern). Files that don't match should be silently skipped or logged as "not a ProveIt file" rather than crashing or showing blank rows.

---

## Summary

| Metric | Result |
|--------|--------|
| Files found | 3 |
| Valid ProveIt files | 2 |
| Non-ProveIt files (false positives) | 1 |
| Files with parsing anomalies | 1 (mooveit — non-standard title prefix, extra score field) |
| Files fully conformant with schema | 1 (proveit-test) |

---

## Recommendations for Dashboard Implementation

1. **Guard against false positives:** Check for `## Confidence Score` or `Desirability:` before treating a `discovery.md` as a ProveIt file.

2. **Flexible title parsing:** Accept `# [AnyName]: [IdeaName]` not just `# ProveIt: [IdeaName]` — PMs running ProveIt in their own project directories naturally use their project name as the prefix.

3. **Optional score fields:** The schema currently has D/V/F. At least one file includes a `Strategy Alignment` score. Parse all `Key: N/10` tokens from the Confidence Score line rather than hard-coding three fields.

4. **Gamma deck status:** Parse the `## Gamma Deck` section. Distinguish between "generated (URL present)", "not yet generated", and "section missing entirely".

5. **Sort order:** With only 2 ProveIt files both dated 2026-02-07, sort order is ambiguous. Dashboard should define a tiebreaker (e.g. file path alphabetically, or D score descending).
