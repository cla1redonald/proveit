#!/usr/bin/env node
/**
 * Smoke-test the split ProveIt agent: orchestrator phase table → files on disk.
 * Run from repo root after agent split changes.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const orchestrator = fs.readFileSync(path.join(ROOT, "agents/proveit.md"), "utf8");

const fileRefs = [...orchestrator.matchAll(/`agents\/[^`]+`/g)].map((m) =>
  m[0].slice(1, -1)
);

const missing = fileRefs.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));

if (missing.length) {
  console.error("Missing phase files referenced by orchestrator:");
  for (const f of missing) console.error("  -", f);
  process.exit(1);
}

console.log(`OK: ${fileRefs.length} phase/template paths exist`);
for (const f of fileRefs) {
  const lines = fs.readFileSync(path.join(ROOT, f), "utf8").split("\n").length;
  console.log(`  ${f} (${lines} lines)`);
}
