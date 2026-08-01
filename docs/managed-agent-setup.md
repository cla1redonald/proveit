# Frontier-Scan Managed Agent Setup

## Overview

ProveIt's **frontier-scan Managed Agent** is a scheduled agent running on Anthropic's infrastructure that automatically refreshes ProveIt's AI-frontier knowledge every 2 weeks (1st and 15th of each month at **05:00 UTC**).

Unlike session-level routines (which require an active Claude session), Managed Agents:
- Run independently on Anthropic's servers
- Execute on a cron schedule (no session required)
- Have persistent state and can commit/PR changes
- Auto-scale and handle their own lifecycle

## Architecture

```
┌─ Every 2 weeks (1st & 15th, 05:00 UTC) ──────────┐
│                                                   │
│  Managed Agent (Sonnet 5)                        │
│  ├── Run frontier-scan workflow (lite mode)      │
│  ├── Check for [AGENT-IMPACT] flags              │
│  ├── Commit changes if found                     │
│  └── Create draft PR if agent edits detected     │
│                                                   │
└─ Git commit + optional PR ───────────────────────┘
```

## Deployment

### Prerequisites

- `ANTHROPIC_API_KEY` set in environment
- Node.js 18+ with TypeScript support
- Git repository with commit access
- GitHub token if creating PRs (optional, for automation)

### Install

```bash
npm install
```

This adds:
- `@anthropic-ai/sdk` — for Managed Agents API calls
- `typescript` & `ts-node` — for the deployment script

### Deploy

**Dry run** (see what would be deployed):
```bash
npm run frontier-scan:dry
```

**Live deployment** (deploys the agent to Anthropic):
```bash
npm run frontier-scan
```

The script will:
1. Read agent instructions from `agents/frontier-scan-agent.md`
2. Build the deployment config
3. Call the Managed Agents API to register and schedule the agent
4. Output the agent ID and next scheduled run time

## How It Works

### Daily Execution (05:00 UTC)

1. **Scan Phase**
   - Runs `scripts/frontier-scan.workflow.mjs` in **lite mode**
   - Scans 6 domains (Anthropic, OpenAI, Google, open-weight, commoditization, agent-tooling)
   - Each domain spawns a researcher agent
   - Adversarial verifiers kill claims without dated sources

2. **Synthesize Phase**
   - Merges verified findings into frontier snapshot structure
   - Diffs against `docs/frontier-snapshot.md` (prior snapshot)
   - Flags any `[AGENT-IMPACT]` changes (things that affect ProveIt scoring)

3. **Commit Phase (if changes exist)**
   - Stages `docs/frontier-snapshot.md` (snapshot refresh)
   - If `[AGENT-IMPACT]` flags detected:
     - Also stages `agents/proveit.md` updates (if auto-applicable)
     - Creates a **draft PR** for human review
   - If no `[AGENT-IMPACT]` flags:
     - Auto-merges the snapshot (silent routine maintenance)

### Outcomes

| Scenario | Behavior |
|----------|----------|
| Regular snapshot refresh (no [AGENT-IMPACT]) | Auto-commit + merge → silent success |
| Snapshot + agent scoring changes ([AGENT-IMPACT]) | Commit + draft PR for review → user notified |
| Workflow error or data quality issue | Log error + notify user → manual investigation |

## Monitoring

### Check Agent Status

```bash
# View recent runs (via Anthropic Dashboard or API)
# Agent ID will be provided on first deployment
```

### Expected Log Output

Each run logs to Anthropic's session transcript. You'll see:
- Workflow phase progress (Scan → Verify → Synthesize → Diff)
- [AGENT-IMPACT] flag summary
- Git commit message
- PR URL (if created)

### GitHub PR Activity

Auto-generated PRs will appear in the repository with:
- **Title:** `🛰️ Frontier snapshot refresh + agent updates (automated)`
- **Labels:** `automated`, `frontier-scan`, `ai-currency`
- **Draft status:** If agent edits included
- **Body:** Summary of changes + [AGENT-IMPACT] flags

## Cost Estimation

**Lite mode** (default, bi-weekly):
- ~100 agents (6 domains × researchers + verifiers)
- ~1M tokens per run (capped findings, Sonnet synthesis)
- ~$3–4 per run (Sonnet 5 pricing)
- **~$85–112/month** (24 runs/year, roughly every 15 days)

**Full mode** (for manual runs):
- ~300 agents (deeper research + Opus synthesis)
- ~3.7M tokens
- ~$20–25 per run

## Troubleshooting

### "Agent deployment failed: 403 Unauthorized"
- Check `ANTHROPIC_API_KEY` is set and valid
- Verify your API key has Managed Agents access (beta feature)

### "Snapshot refresh succeeded but no PR created"
- This is normal if no `[AGENT-IMPACT]` flags were detected
- Check `git log` to see the auto-merged snapshot commit

### "Git push failed: Permission denied"
- The agent runs with your repository's permissions
- Ensure your API key / GitHub token has write access to the repo

### "Workflow timeout (30+ min)"
- Lite mode should complete in ~8–12 min
- If timing out: check network, or manually run with smaller domain set

## Configuration

### Change Schedule

Edit `scripts/deploy-frontier-agent.ts`, update the `schedule.cron` field:

```typescript
schedule: {
  timezone: "UTC",
  cron: "0 5 * * *",  // Change this line
}
```

Then re-deploy: `npm run frontier-scan`

**Common cron patterns:**
- `0 2 * * *` — 2:00 AM UTC
- `0 */6 * * *` — Every 6 hours
- `0 9 * * 1` — Mondays at 9:00 AM UTC

### Adjust Mode (Lite ↔ Full)

Edit `agents/frontier-scan-agent.md`, update the workflow invocation:

```bash
# Lite (fast, lower cost)
npm run frontier-scan -- --mode lite

# Full (thorough, higher cost)
npm run frontier-scan -- --mode full
```

## Maintenance

### Update Agent Instructions

1. Edit `agents/frontier-scan-agent.md` with new instructions
2. Re-deploy: `npm run frontier-scan`
3. The next scheduled run will use the updated prompt

### Disable Agent

To pause the agent temporarily:
- Via Anthropic Dashboard: disable schedule
- Via API: update agent with `active: false`
- Manually: stop deployments (requires dashboard access)

To permanently delete:
- Via Anthropic Dashboard: delete agent
- Via API: call agents.delete()

## Next Steps

1. **Deploy:** `npm run frontier-scan`
2. **Monitor:** Check for PRs in the repository tomorrow morning
3. **Iterate:** Adjust schedule/mode based on first run results
4. **Document:** Update this file if you make configuration changes

---

**Last updated:** 2026-08-01  
**Agent model:** Claude Sonnet 5  
**Schedule:** Daily 05:00 UTC  
**Mode:** Lite (default)
