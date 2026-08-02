import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  activeKillCount,
  classifyArtifact,
  combined,
  discoveryLikelihood,
  loadIdea,
  parseDiscovery,
  scanRoots,
  slugify,
} from "../src/scan.ts";

const FIXTURES = join(import.meta.dirname, "fixtures");

async function readFixture(...parts: string[]): Promise<string> {
  return readFile(join(FIXTURES, ...parts), "utf8");
}

describe("slugify", () => {
  it("normalises em dashes and punctuation", () => {
    expect(slugify("ProveIt: My — Great Idea")).toBe("proveit-my-great-idea");
  });

  it("truncates to 60 characters", () => {
    expect(slugify("a".repeat(80))).toHaveLength(60);
  });
});

describe("discoveryLikelihood", () => {
  it("scores canonical discovery higher than index recap", async () => {
    const discovery = await readFixture("dedup", "discovery.md");
    const index = await readFixture("dedup", "00_Index.md");
    expect(discoveryLikelihood(discovery, "discovery.md")).toBeGreaterThan(
      discoveryLikelihood(index, "00_Index.md"),
    );
  });

  it("prefers discovery.md filename over index", async () => {
    const text = await readFixture("standard", "discovery.md");
    expect(discoveryLikelihood(text, "discovery.md")).toBeGreaterThan(
      discoveryLikelihood(text, "00_Index.md"),
    );
  });
});

describe("parseDiscovery", () => {
  it("parses standard discovery scores and metadata", async () => {
    const text = await readFixture("standard", "discovery.md");
    const parsed = parseDiscovery(text);

    expect(parsed.name).toBe("Holiday Portfolio Planner");
    expect(parsed.scores.desirability).toBe(8);
    expect(parsed.scores.viability).toBe(6);
    expect(parsed.scores.feasibility).toBe(5);
    expect(parsed.status).toBe("Go with caution");
    expect(parsed.oneLiner).toMatch(/school-holiday/i);
    expect(parsed.recommendation).toMatch(/MVP/i);
  });

  it("parses kill signal statuses", async () => {
    const text = await readFixture("standard", "discovery.md");
    const parsed = parseDiscovery(text);

    expect(parsed.killSignals).toHaveLength(2);
    expect(parsed.killSignals.find((k) => k.label.includes("saturation"))?.status).toBe(
      "active",
    );
    expect(parsed.killSignals.find((k) => k.label.includes("pricing"))?.status).toBe(
      "resolved",
    );
    expect(activeKillCount(parsed.killSignals)).toBe(1);
  });

  it("parses numbered convention files", async () => {
    const text = await readFixture("numbered", "01_Discovery.md");
    const parsed = parseDiscovery(text);

    expect(parsed.name).toBe("Numbered Convention Idea");
    expect(combined(parsed.scores)).toBe(20);
  });
});

describe("classifyArtifact", () => {
  it("classifies standard swarm and research names", () => {
    expect(classifyArtifact("swarm-1-market-bull.md")).toMatchObject({
      kind: "swarm-angle",
      round: 1,
    });
    expect(classifyArtifact("research-2.md")).toMatchObject({
      kind: "research",
      round: 2,
    });
    expect(classifyArtifact("discovery.md")).toMatchObject({ kind: "discovery" });
    expect(classifyArtifact("spec.md")).toMatchObject({ kind: "spec" });
  });

  it("classifies numbered convention names", () => {
    expect(classifyArtifact("21_Swarm_1_Market_Bull.md")).toMatchObject({
      kind: "swarm-angle",
      round: 1,
    });
    expect(classifyArtifact("01_Discovery.md")).toMatchObject({ kind: "discovery" });
    expect(classifyArtifact("00_Index.md")).toMatchObject({ kind: "index" });
  });

  it("returns null for unrelated markdown in a shared folder", () => {
    expect(classifyArtifact("meeting-notes.md")).toBeNull();
    expect(classifyArtifact("README.md")).toBeNull();
  });

  it("includes numbered notes in dedicated ProveIt folders", () => {
    expect(
      classifyArtifact("03_Product_Evolution.md", { dedicatedDir: true }),
    ).toMatchObject({ kind: "other" });
  });
});

describe("scanRoots", () => {
  it("finds standard and numbered discoveries", async () => {
    const summaries = await scanRoots([
      join(FIXTURES, "standard"),
      join(FIXTURES, "numbered"),
    ]);

    expect(summaries.map((s) => s.slug).sort()).toEqual(
      ["holiday-portfolio-planner", "numbered-convention-idea"].sort(),
    );
    expect(summaries.every((s) => s.source === "fs")).toBe(true);
  });

  it("dedupes index recap vs real discovery in the same folder", async () => {
    const summaries = await scanRoots([join(FIXTURES, "dedup")]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].name).toBe("Dedup Winner");
    expect(summaries[0].scores.desirability).toBe(9);
  });

  it("ignores files without score lines", async () => {
    const summaries = await scanRoots([join(FIXTURES, "edge")]);
    expect(summaries).toHaveLength(0);
  });

  it("respects MAX_DEPTH and ignores dot directories", async () => {
    const root = await mkdtemp(join(tmpdir(), "proveit-scan-"));
    const deep = join(root, "a", "b", "c", "d", "e", "f", "g", "h");
    await mkdir(deep, { recursive: true });
    await writeFile(
      join(deep, "discovery.md"),
      `# ProveIt: Too Deep

## Confidence Score
Desirability: 1/10 | Viability: 1/10 | Feasibility: 1/10
`,
    );
    await mkdir(join(root, ".hidden"), { recursive: true });
    await writeFile(
      join(root, ".hidden", "discovery.md"),
      `# ProveIt: Hidden

## Confidence Score
Desirability: 10/10 | Viability: 10/10 | Feasibility: 10/10
`,
    );

    const summaries = await scanRoots([root]);
    expect(summaries).toHaveLength(0);
  });
});

describe("loadIdea", () => {
  it("loads discovery detail and sibling artifacts", async () => {
    const root = await mkdtemp(join(tmpdir(), "proveit-load-"));
    await writeFile(join(root, "discovery.md"), await readFixture("standard", "discovery.md"));
    await writeFile(join(root, "swarm-1-market-bull.md"), "# Swarm angle\n");
    await writeFile(join(root, "research-1.md"), "# Research\n");
    await writeFile(join(root, "random.md"), "# Ignored\n");

    const idea = await loadIdea(join(root, "discovery.md"));

    expect(idea.slug).toBe("holiday-portfolio-planner");
    expect(idea.artifacts.map((a) => a.kind).sort()).toEqual(
      ["research", "swarm-angle"].sort(),
    );
    expect(idea.artifactCount).toBe(2);
    expect(idea.brainDump).toMatch(/spreadsheet chaos/i);
  });
});
