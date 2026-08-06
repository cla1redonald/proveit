#!/usr/bin/env node
// Manual ONE-OFF test trigger for the deployed frontier-scan Managed Agent.
// Provisions env + vault + session, mounts the repo, and sends a kickoff that
// FORCES a draft PR so the full chain (web search → git push → PR) can be verified
// on demand — separate from the biweekly deployment (see scripts/frontier-ma-deploy.mjs).
// Run with:  export ANTHROPIC_API_KEY=sk-ant-... && node scripts/frontier-ma-test.mjs
// Requires: ANTHROPIC_API_KEY exported, and `gh` logged in. The key is never printed.

import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const AGENT_ID = 'agent_01FoF2hJGMYJ5cP6P9v1EbVe';
const REPO = 'https://github.com/cla1redonald/proveit';
const today = new Date().toISOString().slice(0, 10);
const BRANCH = `frontier-scan/${today}-managed-agent-test`;
const OUT = join(tmpdir(), 'frontier-ma-session.json');

function step(msg) { console.log(`\n▶ ${msg}`); }
function ok(msg) { console.log(`  ✓ ${msg}`); }

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY not set in this shell. Run:  export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

let ghToken;
try {
  ghToken = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  if (!ghToken) throw new Error('empty');
  ok(`GitHub token pulled from gh (${ghToken.length} chars) — not printed`);
} catch {
  console.error('✗ Could not get a GitHub token from `gh auth token`. Is gh logged in?');
  process.exit(1);
}

const c = new Anthropic();

// ---- 1. Environment (reuse by name or create) --------------------------------
step('Environment: cloud, unrestricted egress');
const ENV_NAME = 'proveit-frontier-scan';
let env;
try {
  env = await c.beta.environments.create({
    name: ENV_NAME,
    config: { type: 'cloud', networking: { type: 'unrestricted' } },
  });
  ok(`created ${env.id}`);
} catch (e) {
  if (e.status === 409) {
    const list = await c.beta.environments.list();
    env = (list.data || []).find((x) => x.name === ENV_NAME);
    if (!env) throw e;
    ok(`reusing existing ${env.id}`);
  } else throw e;
}

// ---- 2. Vault + GitHub token as an env-var credential ------------------------
step('Vault: store GitHub token, injected at egress to api.github.com');
const vault = await c.beta.vaults.create({ display_name: `proveit-gh-${Date.now() % 100000}` });
ok(`vault ${vault.id}`);
await c.beta.vaults.credentials.create(vault.id, {
  display_name: 'GitHub token for proveit frontier-scan test',
  auth: {
    type: 'environment_variable',
    secret_name: 'GITHUB_TOKEN',
    secret_value: ghToken,
    networking: { type: 'limited', allowed_hosts: ['api.github.com', 'github.com', '*.github.com'] },
    injection_location: { header: true },
  },
});
ok('credential GITHUB_TOKEN added');

// ---- 3. Session: add toolset via overrides (agent unchanged), mount repo -----
step('Session: agent_with_overrides (adds toolset) + repo mount + vault');
const KICKOFF = [
  'This is a supervised END-TO-END TEST of your frontier-scan flow. Run your normal task now.',
  '',
  'Steps:',
  '1. Read docs/frontier-snapshot.md (the mounted proveit repo is at /workspace/proveit; it is currently snapshot v4, generated 2026-08-06).',
  '2. Use web_search to check the last ~14 days across the big-6 labs for anything [AGENT-IMPACT] per your instructions.',
  '3. FOR THIS TEST: even if changes are only incremental, still open a DRAFT PR so we can verify the PR mechanism end-to-end. Summarise in the PR body what you checked and whether anything is [AGENT-IMPACT].',
  `4. To open the PR: from /workspace/proveit, create branch ${BRANCH}, make/commit any snapshot changelog edit (or a no-op test note under docs/ if nothing material), \`git push -u origin ${BRANCH}\` (auth is handled by the git proxy), then create the PR via the GitHub REST API:`,
  `   curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/cla1redonald/proveit/pulls -d '{"title":"🛰️ Frontier-scan Managed Agent test","head":"${BRANCH}","base":"main","body":"...","draft":true}'`,
  '   ($GITHUB_TOKEN is provided to your shell as a placeholder and substituted with the real token at egress.)',
  '5. In your final message report: what you checked, whether [AGENT-IMPACT], the branch, and the PR URL. If any step fails (web search, git push, PR create), report exactly which and the error — do not grind.',
].join('\n');

const session = await c.beta.sessions.create({
  agent: {
    type: 'agent_with_overrides',
    id: AGENT_ID,
    tools: [{ type: 'agent_toolset_20260401', default_config: { enabled: true } }],
  },
  environment_id: env.id,
  title: 'frontier-scan Managed Agent — supervised test run',
  vault_ids: [vault.id],
  resources: [
    {
      type: 'github_repository',
      url: REPO,
      authorization_token: ghToken,
      mount_path: '/workspace/proveit',
      checkout: { type: 'branch', name: 'main' },
    },
  ],
});
ok(`session ${session.id} (status ${session.status})`);

const consoleUrl = `https://platform.claude.com/workspaces/default/sessions/${session.id}`;
writeFileSync(OUT, JSON.stringify({ session_id: session.id, env_id: env.id, vault_id: vault.id, consoleUrl, branch: BRANCH }, null, 2));

// ---- 4. Open stream, then send kickoff --------------------------------------
step('Opening event stream, then sending kickoff');
const stream = await c.beta.sessions.events.stream(session.id);
await c.beta.sessions.events.send(session.id, {
  events: [{ type: 'user.message', content: [{ type: 'text', text: KICKOFF }] }],
});
ok('kickoff sent');
console.log(`\n  Console (watch live): ${consoleUrl}`);
console.log(`  Session id: ${session.id}\n`);

// Drain until terminal idle or a wall-clock cap, printing progress.
const startedAt = Date.now();
const CAP_MS = 15 * 60 * 1000;
try {
  for await (const ev of stream) {
    if (Date.now() - startedAt > CAP_MS) { console.log('  … 15-min cap reached; watch the rest in Console / on GitHub.'); break; }
    if (ev.type === 'agent.message') {
      for (const b of ev.content || []) if (b.type === 'text' && b.text) process.stdout.write(b.text);
    } else if (ev.type === 'agent.tool_use') {
      console.log(`\n  [tool] ${ev.name || ''}`);
    } else if (ev.type === 'agent.mcp_tool_use') {
      console.log(`\n  [mcp] ${ev.name || ''}`);
    } else if (ev.type === 'session.error') {
      console.log(`\n  [session.error] ${ev.error?.message || JSON.stringify(ev).slice(0, 300)}`);
    } else if (ev.type === 'session.status_terminated') {
      console.log('\n  --- session terminated ---'); break;
    } else if (ev.type === 'session.status_idle') {
      const sr = ev.stop_reason?.type;
      if (sr === 'requires_action') { console.log('\n  [idle: requires_action — blocked on client input]'); }
      else { console.log(`\n  --- session idle (${sr}) ---`); break; }
    }
  }
} catch (e) {
  console.log(`\n  stream ended: ${e.message?.slice(0, 200)}`);
}
console.log(`\n✔ Done. session=${session.id}  env=${env.id}  vault=${vault.id}`);
console.log(`  Details saved to ${OUT}`);
