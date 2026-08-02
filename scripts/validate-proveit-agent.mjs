#!/usr/bin/env node
/**
 * Smoke-test the split ProveIt agent: orchestrator phase table → files on disk.
 * Also checks proveit-fast.md points at fast-mode.md.
 *
 * Run from repo root: node scripts/validate-proveit-agent.mjs
 * CI: .github/workflows/ci.yml (plugin job)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const orchestratorPath = path.join(ROOT, "agents/proveit.md");
const orchestrator = fs.readFileSync(orchestratorPath, "utf8");

const fileRefs = [
  ...new Set(
    [...orchestrator.matchAll(/`agents\/[^`]+`/g)].map((m) => m[0].slice(1, -1))
  ),
];

let failed = false;

const missing = fileRefs.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
if (missing.length) {
  failed = true;
  console.error("Missing phase files referenced by agents/proveit.md:");
  for (const f of missing) console.error("  -", f);
}

const fastCmdPath = path.join(ROOT, "commands/proveit-fast.md");
const fastCmd = fs.readFileSync(fastCmdPath, "utf8");
if (!fastCmd.includes("agents/phases/fast-mode.md")) {
  failed = true;
  console.error(
    "commands/proveit-fast.md must reference agents/phases/fast-mode.md"
  );
}

if (failed) process.exit(1);

console.log(`OK: ${fileRefs.length} phase/template paths exist`);
for (const f of fileRefs) {
  const lines = fs.readFileSync(path.join(ROOT, f), "utf8").split("\n").length;
  console.log(`  ${f} (${lines} lines)`);
}
console.log("OK: proveit-fast.md → agents/phases/fast-mode.md");
