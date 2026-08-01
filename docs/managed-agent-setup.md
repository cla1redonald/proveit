# Frontier-Scan Managed Agent Setup

## Overview

ProveIt's **frontier-scan Managed Agent** is a lightweight announcement monitor that runs on Anthropic's infrastructure every 2 weeks (1st and 15th at 05:00 UTC). It watches for new model announcements from the big 6 labs and alerts you to [AGENT-IMPACT] changes.

Unlike session-level routines (which require an active Claude session), Managed Agents:
- Run independently on Anthropic's servers
- Execute on a cron schedule (no session required)
- Have persistent state and can commit/PR changes
- Auto-scale and handle their own lifecycle

**Note:** This is a *lightweight announcement monitor*, not the full frontier-scan workflow. For a complete frontier refresh with adversarial verification, run the full `frontier-scan` workflow manually on your Max subscription (free, no API cost).

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

### Current Status

✅ **Deployed and active**
- **Agent ID:** `agent_01FoF2hJGMYJ5cP6P9v1EbVe`
- **Model:** Claude Sonnet 5
- **Schedule:** Every 2 weeks (1st & 15th at 05:00 UTC)
- **Deployed:** 2026-08-01 13:13 UTC
- **Next run:** 2026-09-01 05:00 UTC

### Prerequisites (for re-deployment)

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

### Deploy or Re-deploy

**Dry run** (see what would be deployed):
```bash
export ANTHROPIC_API_KEY=your-key
npm run frontier-scan:dry
```

**Live deployment** (deploys/updates the agent to Anthropic):
```bash
export ANTHROPIC_API_KEY=your-key
npm run frontier-scan
```

The script will:
1. Read agent instructions from `agents/frontier-scan-agent.md`
2. Build the deployment config
3. Call the Managed Agents API to register and schedule the agent
4. Output the agent ID and next scheduled run time

## How It Works

### Bi-Weekly Execution (1st & 15th, 05:00 UTC)

1. **Check for Announcements**
   - Web search the last 14 days for new model releases from:
     - Anthropic (Claude new versions, pricing changes)
     - OpenAI (GPT new versions, feature releases)
     - Google (Gemini updates, capabilities)
     - xAI (Grok updates, new versions)
     - Meta (Llama releases)
     - DeepSeek (new models, pricing)

2. **Assess [AGENT-IMPACT]**
   - Flag if: new flagship model, >20% pricing change, capability default, SWE-bench change, distribution feature
   - Don't flag: minor tweaks, bug fixes, research papers, rumors

3. **Commit & PR (if [AGENT-IMPACT] found)**
   - Stage: `docs/frontier-snapshot.md` with new changelog entry
   - Create **draft PR** with changes and suggested scoring impacts
   - Labels: `automated`, `frontier-scan`, `ai-currency`
   - Return the PR URL

4. **Silent success (if no [AGENT-IMPACT])**
   - No commit, no PR (routine check with nothing to report)

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
