#!/usr/bin/env node
// Create/reconfigure the biweekly scheduled DEPLOYMENT for the frontier-scan
// Managed Agent. After this exists, Anthropic fires it on cron with NO further
// key handling. This is where you change the schedule, edit the kickoff, or swap
// in a durable GitHub PAT (see the token-durability note in docs/managed-agent-setup.md).
// Run with:  export ANTHROPIC_API_KEY=sk-ant-... && node scripts/frontier-ma-deploy.mjs
// Reuses the environment + vault created by scripts/frontier-ma-test.mjs; pulls the gh token fresh.

import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';

const AGENT_ID = 'agent_01FoF2hJGMYJ5cP6P9v1EbVe';
const ENV_ID = 'env_01PFBUt2cu42bYm6xsv2x5pB';   // reused from the test run
const VAULT_ID = 'vlt_011CdmiBF3kJi3XrKXjbdzRY'; // holds GITHUB_TOKEN env-var credential
const REPO = 'https://github.com/cla1redonald/proveit';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY not set. Run:  export ANTHROPIC_API_KEY=sk-ant-... && node scripts/frontier-ma-deploy.mjs');
  process.exit(1);
}
const ghToken = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
if (!ghToken) { console.error('✗ no gh token'); process.exit(1); }
console.log(`  ✓ gh token pulled (${ghToken.length} chars) — not printed`);

// Production kickoff — the agent's NORMAL monitor task (PR only if [AGENT-IMPACT]; silent otherwise).
const KICKOFF = [
  'Scheduled biweekly frontier-scan. Run your standard monitor task.',
  '',
  '1. Read docs/frontier-snapshot.md in the mounted repo at /workspace/proveit (note its current `generated:` date and version).',
  '2. web_search the last ~14 days across Anthropic, OpenAI, Google, xAI, Meta, DeepSeek for anything [AGENT-IMPACT] per your instructions (new flagship, >20% pricing shift, a differentiator becoming a default, canonical-benchmark change, major distribution/workflow shift).',
  '3. If AND ONLY IF you find a genuine [AGENT-IMPACT] change not already in the snapshot: append a dated changelog entry to docs/frontier-snapshot.md §6, then open a PR — create a branch frontier-scan/auto-<today>, commit, `git push -u origin <branch>` (git proxy handles auth), and create the PR via:',
  '   curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/cla1redonald/proveit/pulls -d \'{"title":"🛰️ Frontier alert: <what shipped>","head":"<branch>","base":"main","body":"<what/why AGENT-IMPACT + suggested scoring change>","draft":true}\'',
  '   Then add labels automated, frontier-scan, ai-currency. Return the PR URL.',
  '4. If nothing is [AGENT-IMPACT]: make NO commit and open NO PR. Report one line ("routine pass, nothing to flag") and stop. Silent success is the expected common outcome.',
].join('\n');

const c = new Anthropic();

// Deployments take a plain agent reference (no overrides) — so the toolset must
// live on the agent itself. Add it once (creates a new agent version).
const cur = await c.beta.agents.retrieve(AGENT_ID);
const hasToolset = (cur.tools || []).some((t) => t.type === 'agent_toolset_20260401');
if (!hasToolset) {
  const updated = await c.beta.agents.update(AGENT_ID, {
    version: cur.version,
    name: cur.name,
    model: cur.model,
    system: cur.system,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
  });
  console.log(`  ✓ agent updated to v${updated.version} (added agent_toolset)`);
} else {
  console.log('  · agent already has the toolset');
}

const body = {
  name: 'frontier-scan biweekly monitor',
  agent: AGENT_ID,
  environment_id: ENV_ID,
  vault_ids: [VAULT_ID],
  resources: [{ type: 'github_repository', url: REPO, authorization_token: ghToken, mount_path: '/workspace/proveit', checkout: { type: 'branch', name: 'main' } }],
  initial_events: [{ type: 'user.message', content: [{ type: 'text', text: KICKOFF }] }],
  schedule: { type: 'cron', expression: '0 5 1,15 * *', timezone: 'UTC' }, // 05:00 UTC, 1st & 15th
};

let dep;
if (c.beta?.deployments?.create) {
  console.log('  · using SDK client.beta.deployments.create');
  dep = await c.beta.deployments.create(body);
} else {
  console.log('  · SDK lacks deployments; using raw HTTP POST /v1/deployments');
  const res = await fetch('https://api.anthropic.com/v1/deployments', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'managed-agents-2026-04-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  if (!res.ok) { console.error(`✗ ${res.status}: ${txt.slice(0, 500)}`); process.exit(1); }
  dep = JSON.parse(txt);
}

console.log('\n✔ Deployment created');
console.log('  id:', dep.id);
console.log('  status:', dep.status);
console.log('  schedule:', dep.schedule?.expression, dep.schedule?.timezone);
console.log('  upcoming runs:', dep.schedule?.upcoming_runs_at);
