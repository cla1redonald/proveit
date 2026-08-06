# Frontier-Scan Managed Agent Setup

## Overview

ProveIt's **frontier-scan Managed Agent** is a **lightweight announcement monitor** that runs on Anthropic's infrastructure every two weeks (1st and 15th at 05:00 UTC). It web-searches the last ~14 days across the big-6 labs and opens a PR **only if** something is genuinely `[AGENT-IMPACT]`; otherwise it does nothing (silent success).

> **This is NOT the frontier-scan swarm workflow.** Two different things share the name:
>
> | | What it is | Where it runs | Cost |
> |---|---|---|---|
> | **Dynamic workflow** (`scripts/frontier-scan.workflow.mjs`) | The deep swarm: fan-out per lab, adversarial skeptic verifies every dated claim, synthesize, diff. ~100 agents, `full`/`lite` modes. Produces the full snapshot refresh. | Inside a **Claude Code session** on your **Max** subscription | No API cost (Max) |
> | **Managed Agent** (this doc) | A single Sonnet-5 loop: ~6 web searches, PR only on `[AGENT-IMPACT]`. A cheap always-on watcher. | Anthropic's servers, on a cron | **Bills the API wallet** |
>
> They are complementary: run the workflow by hand for a deep refresh; let the Managed Agent tick along biweekly as a cheap tripwire.

## Current status

✅ **Deployed and active** (2026-08-06)

| Resource | ID |
|----------|----|
| Agent | `agent_01FoF2hJGMYJ5cP6P9v1EbVe` (Claude Sonnet 5, carries `agent_toolset_20260401`) |
| Scheduled deployment | `depl_01Gpjjk7u7H8HJNDzgCDYtL4` |
| Environment | `env_01PFBUt2cu42bYm6xsv2x5pB` (cloud, unrestricted egress) |
| Vault | `vlt_011CdmiBF3kJi3XrKXjbdzRY` (holds the `GITHUB_TOKEN` credential) |

- **Schedule:** cron `0 5 1,15 * *` UTC (1st and 15th, 05:00 UTC)
- **First scheduled run:** 2026-08-15 05:00 UTC

> Before 2026-08-06 there was **no** schedule. `scripts/deploy-frontier-agent.ts` only ever created the *agent object*; the cron deployment was created separately by `scripts/frontier-ma-deploy.mjs`.

## The three scripts

| Script | What it does | When to run it |
|--------|--------------|----------------|
| `scripts/deploy-frontier-agent.ts` (`npm run frontier-scan`) | Creates/updates the **agent object** (name, model, system prompt from `agents/frontier-scan-agent.md`). Does **not** create a schedule. | When you change the agent's instructions/model. |
| `scripts/frontier-ma-deploy.mjs` | Creates/reconfigures the **scheduled deployment** (adds the toolset to the agent, registers the cron). This is where the real schedule lives. | To (re)create the cron, change the schedule/kickoff, or swap in a durable GitHub PAT. |
| `scripts/frontier-ma-test.mjs` | Fires a **manual one-off test session** (env + vault + session + repo mount) with a kickoff that *forces* a draft PR, so the full chain can be verified on demand. | To prove the flow manually without waiting for the cron. |

All three need `ANTHROPIC_API_KEY` exported at run time and `gh` logged in (the scripts pull a GitHub token via `gh auth token`). These calls bill the API wallet.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node scripts/frontier-ma-deploy.mjs   # create/reconfigure the biweekly deployment
node scripts/frontier-ma-test.mjs     # manual one-off test run (forces a draft PR)
```

## How it works

Each scheduled firing (1st and 15th, 05:00 UTC):

1. **Read the prior snapshot** — `docs/frontier-snapshot.md` in the mounted repo (note its `generated:` date/version).
2. **Web-search the last ~14 days** across Anthropic, OpenAI, Google, xAI, Meta, DeepSeek.
3. **Assess `[AGENT-IMPACT]`** — flag only a new flagship model, a >20% pricing shift, a differentiator becoming a default, a canonical-benchmark change, or a major distribution/workflow shift. Ignore minor tweaks, bug fixes, papers, and rumours.
4. **PR only if impact found** — append a dated changelog entry to `docs/frontier-snapshot.md` §6, push a branch, and open a **draft PR** (labels `automated`, `frontier-scan`, `ai-currency`).
5. **Silent success otherwise** — **no commit, no PR.** This is the expected common outcome.

### Outcomes

| Scenario | Behaviour |
|----------|-----------|
| Nothing `[AGENT-IMPACT]` | No commit, no PR (silent success) |
| A genuine `[AGENT-IMPACT]` change | Draft PR for human review (never merged unattended) |
| Web search / git / PR error | Reports the failing step; no partial commit |

## GitHub auth (the vault)

The scheduled session needs to push and open PRs, so the deployment carries a GitHub token two ways:

- The **repo mount** (`github_repository` resource) uses it via Anthropic's git proxy for `git push`.
- The **vault** (`vlt_011CdmiBF3kJi3XrKXjbdzRY`) stores it as a `GITHUB_TOKEN` **env-var credential**, injected at egress on requests to `api.github.com` so the agent can create the PR via the REST API. The token never enters the sandbox.

> ⚠️ **Token durability.** The stored token is a `gh auth token` pulled at deploy time. If it rotates or expires, the biweekly **PR step breaks** (the scan still runs). Durable fix: mint a fine-grained PAT scoped to `cla1redonald/proveit` (Contents + Pull requests: read/write), update the vault credential's `secret_value` and the deployment's `github_repository` `authorization_token`, then re-run `scripts/frontier-ma-deploy.mjs`.

## Cost

The Managed Agent is a **single Sonnet-5 session** with ~5–10 web searches per run — on the order of **~$2–4 per run**, twice a month. It **bills the API wallet** (separate from your Max subscription).

The `~100-agent`, multi-million-token, `full`/`lite` figures belong to the **dynamic workflow**, not this agent. Run that on Max (no API cost) when you want the deep refresh.

## Monitoring

- **Live session view:** each run opens a session at `https://platform.claude.com/workspaces/default/sessions/<session_id>` (printed by the test script; for scheduled runs, find the session id via the deployment runs below or the Console).
- **Deployment runs:** `client.beta.deployment_runs.list({ deployment_id: 'depl_01Gpjjk7u7H8HJNDzgCDYtL4' })` — each firing writes a run record (success carries the `session_id`; failure carries an `error.type`).
- **GitHub:** any auto-PR appears with labels `automated`, `frontier-scan`, `ai-currency` as a draft.

## Managing the deployment

- **Run now (manual):** `client.beta.deployments.run('depl_01Gpjjk7u7H8HJNDzgCDYtL4')`, the Console "Run now" button, or `scripts/frontier-ma-test.mjs` for a forced-PR test.
- **Pause / unpause:** `client.beta.deployments.pause(id)` / `.unpause(id)` (reversible; manual runs still work while paused).
- **Archive (terminal):** `client.beta.deployments.archive(id)` — the schedule stops permanently.
- **Change schedule or kickoff:** edit `scripts/frontier-ma-deploy.mjs` (the `schedule.expression` / `initial_events`), then re-run it.
- **Change the agent's instructions:** edit `agents/frontier-scan-agent.md`, run `npm run frontier-scan` (updates the agent object); the next scheduled run uses the new prompt.

## Troubleshooting

- **`400 unknown field "name"` on vault create** — vaults use `display_name`, not `name`.
- **`agent.selector.type: "agent_with_overrides" is not a valid value`** — deployments take a plain agent reference, so the toolset must live on the agent itself (`frontier-ma-deploy.mjs` adds `agent_toolset_20260401` before creating the deployment).
- **Scan ran but no PR** — normal if nothing was `[AGENT-IMPACT]`.
- **Git push / PR failed** — usually the GitHub token expired/rotated (see Token durability above).

---

**Last updated:** 2026-08-06
**Agent model:** Claude Sonnet 5
**Schedule:** 1st & 15th, 05:00 UTC (`0 5 1,15 * *`)
**Kind:** Lightweight announcement monitor (not the swarm workflow)
