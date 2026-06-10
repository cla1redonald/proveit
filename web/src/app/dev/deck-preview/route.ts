/**
 * GET /dev/deck-preview
 *
 * Dev-only route: renders a hardcoded sample deck to verify layout quality
 * without needing a real payment or model call.
 *
 * Returns 404 in production. Use this to eyeball/screenshot the deck.
 * Drive with Playwright: http://localhost:3000/dev/deck-preview
 */

import { renderDeckHtml, type DeckData } from "@/lib/deck/template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_DECK_DATA: DeckData = {
  ideaSummary:
    "A structured AI pre-mortem tool that helps product managers validate ideas before writing the PRD, combining JTBD, desirability, viability and feasibility scoring into a single 20-minute workflow.",

  scores: {
    desirability: 72,
    viability: 54,
    feasibility: 81,
  },

  killSignals: [
    {
      type: "no_willingness_to_pay",
      evidence:
        "When pushed on budget, 4 of 6 interviewees said they would use the free version indefinitely and only upgrade if their employer mandated it.",
      detectedAt: 14,
    },
    {
      type: "saturation",
      evidence:
        "Three direct competitors (Aurelius, Maze, User Interviews) already offer structured research workflows, two with AI scoring layers added in Q4 2025.",
      detectedAt: 22,
    },
    {
      type: "tarpit",
      evidence:
        "The core problem (PMs writing PRDs without evidence) is well-known and has resisted tooling solutions for a decade. Behaviour change is the constraint, not tooling quality.",
      detectedAt: 8,
    },
  ],

  findings: [
    {
      title: "Real pain, but passive acceptance",
      body: "PMs acknowledge they skip structured validation under time pressure, but treat it as a known trade-off rather than an acute problem they are actively trying to solve.",
      source: "6 user interviews, May 2026",
    },
    {
      title: "The PRD handoff is the actual trigger",
      body: "The moment that creates enough pain to act is not the idea phase but the stakeholder pushback after a PRD goes out. Targeting that moment is a stronger hook.",
      source: "Pattern across 4 of 6 interviews",
    },
    {
      title: "AI assistance is table stakes, not a differentiator",
      body: "Every PM interviewed already has an AI research workflow. The value must come from structure and methodology depth, not from having AI at all.",
      source: "Competitive audit + interviews",
    },
  ],

  recommendations: [
    {
      title: "Reframe the entry point",
      body: "Position ProveIt as a PRD pre-flight check, not an ideation tool. Target the moment before sending the PRD, when the PM already suspects pushback is coming.",
    },
    {
      title: "Price anchored to PMF, not access",
      body: "The freemium model works only if the output of the free tier is genuinely compelling. Run a 30-day test with the full bundle free, then gate on volume, not quality.",
    },
  ],

  soWhat:
    "The tool works, the pain is real, but the distribution strategy needs to pivot from ideation to PRD pre-flight to hit the moment of peak motivation.",
};

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(): Promise<Response> {
  // Guard: production environments must never serve this route
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const html = renderDeckHtml(SAMPLE_DECK_DATA);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
