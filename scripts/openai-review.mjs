#!/usr/bin/env node

import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Let the key live in a .env file, like the rest of the project. Precedence:
//   1. A value already exported in the shell always wins.
//   2. .env in the current directory (the PM's project — where ProveIt runs).
//   3. .env in the ProveIt install dir (~/proveit/.env) as a central fallback.
// .env is gitignored, so the key never lands in the repo.
//
// SECURITY: parse only the three keys we honor — NOT the whole file. Loading a project
// .env wholesale (e.g. via process.loadEnvFile) would let a stray/hostile OPENAI_BASE_URL
// in cwd redirect the OpenAI client to another endpoint and leak the key + review content.
// Hand-parsing also avoids depending on process.loadEnvFile (Node 20.12+), so it degrades
// gracefully on older Node instead of throwing.
const HONORED_KEYS = ["OPENAI_API_KEY", "PROVEIT_REVIEW_MODEL", "PROVEIT_REVIEW_EFFORT"];
function loadDotenv() {
  const installDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const envPath of [join(process.cwd(), ".env"), join(installDir, ".env")]) {
    if (process.env.OPENAI_API_KEY) return; // shell / earlier file already provided it
    if (!existsSync(envPath)) continue;
    let lines = [];
    try {
      lines = readFileSync(envPath, "utf-8").split("\n");
    } catch {
      continue; // unreadable .env — skip
    }
    for (const line of lines) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || !HONORED_KEYS.includes(m[1]) || process.env[m[1]]) continue;
      // strip surrounding single/double quotes if present
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}
loadDotenv();

const content = readFileSync("/dev/stdin", "utf-8");

if (!content.trim()) {
  console.error("Error: No content provided on stdin.");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set — add it to a .env file (in this directory or ~/proveit/.env) or export it in your shell.");
  process.exit(1);
}

// The reviewer is deliberately a DIFFERENT lab than ProveIt itself (which runs on
// Claude). That cross-lab independence — different training data, different failure
// modes — is the whole point. Defaults track the current OpenAI frontier, but are
// env-configurable so this never goes stale again as models ship:
//   PROVEIT_REVIEW_MODEL   — e.g. gpt-5.5, gpt-5.5-pro  (default: gpt-5.5)
//   PROVEIT_REVIEW_EFFORT  — none|low|medium|high|xhigh (default: high)
// ProveIt's frontier-scan workflow (docs/frontier-snapshot.md) tracks what the
// current frontier model is — bump the default here when it moves.
const MODEL = process.env.PROVEIT_REVIEW_MODEL || "gpt-5.5";
const EFFORT = process.env.PROVEIT_REVIEW_EFFORT || "high";

const client = new OpenAI();

const systemPrompt = `You are an independent reviewer of a product validation analysis performed by a different AI model. Your job is to find what it missed or got wrong.

Review the following analysis for:

1. GAPS — What questions weren't asked? What evidence is missing? What market segments, user types, or risk factors were overlooked?
2. BIAS — Confirmation bias, optimism bias, anchoring to the PM's original framing, or systematic blind spots in the research methodology.
3. LOGICAL LEAPS — Conclusions that don't follow from the evidence cited. Claims presented as findings that are actually assumptions.
4. CONTRADICTIONS — Things that conflict within the research. Evidence that points in opposite directions without acknowledgement.

For each finding:
- Cite the specific section and quote the relevant text
- Rate severity: CRITICAL / NOTABLE / MINOR
- CRITICAL = would change the recommendation if addressed
- NOTABLE = worth investigating but not deal-breaking
- MINOR = style or completeness nit

If the analysis is solid and you find no significant issues, say so clearly. Do not manufacture problems to appear thorough.

Format your response as markdown with these sections:
## Gaps
## Bias
## Logical Leaps
## Contradictions
## Overall Assessment`;

const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content },
];

async function runReview() {
  try {
    return await client.chat.completions.create({
      model: MODEL,
      reasoning_effort: EFFORT,
      messages,
    });
  } catch (err) {
    // A non-reasoning model (or one that names the effort param differently) will
    // reject reasoning_effort with a 400. Don't fail the whole review for that —
    // retry once without it so any configured model still works.
    const msg = String(err?.message || err);
    const isEffortParamError =
      err?.status === 400 && /reasoning_effort|effort|unsupported|unknown.*param/i.test(msg);
    if (isEffortParamError) {
      console.error(`[openai-review] '${MODEL}' rejected reasoning_effort — retrying without it.`);
      return await client.chat.completions.create({ model: MODEL, messages });
    }
    throw err;
  }
}

// Note (stderr only — keeps stdout pure markdown for the review-N.md file) which
// reviewer actually ran, so the result is traceable.
console.error(`[openai-review] reviewer=${MODEL} effort=${EFFORT}`);

try {
  const response = await runReview();
  console.log(response.choices[0].message.content);
} catch (err) {
  // Clean, actionable message instead of a Node stack trace — the agent surfaces
  // this to the PM and skips the review gracefully rather than failing the session.
  const status = err?.status ? ` (HTTP ${err.status})` : "";
  console.error(`Error: cross-model review with '${MODEL}' failed${status}: ${err?.message || err}`);
  if (err?.status === 404) {
    console.error(`Hint: '${MODEL}' may not exist or your key lacks access. Set PROVEIT_REVIEW_MODEL to a model you can call.`);
  }
  process.exit(1);
}
