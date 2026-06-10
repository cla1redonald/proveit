import "server-only";

/**
 * compose.ts — the ONE model call per order in the fulfilment pipeline.
 *
 * Takes the stored transcript/session and returns structured deck content
 * plus the 3 text artifacts (spec, design brief, prompts). Uses claude-haiku
 * (cheapest capable model), capped at 2048 tokens, JSON-only output.
 *
 * Returns null gracefully when ANTHROPIC_API_KEY is unset (callers handle).
 * Retries once on malformed JSON, then throws.
 *
 * FAIL CLOSED: any unrecoverable error throws — the paid path must not
 * silently swallow failures.
 */

import { z } from "zod";
import type { ValidationSession } from "@/types/index";

// ─── Output schema ────────────────────────────────────────────────────────────

const FindingSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  source: z.string().optional(),
});

const RecommendationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

const ArtifactsSchema = z.object({
  specMd: z.string().min(1),
  designBriefMd: z.string().min(1),
  promptsMd: z.string().min(1),
});

export const ComposedContentSchema = z.object({
  findings: z.array(FindingSchema).min(1).max(5),
  recommendations: z.array(RecommendationSchema).min(1).max(4),
  soWhat: z.string().min(1),
  artifacts: ArtifactsSchema,
});

export type ComposedContent = z.infer<typeof ComposedContentSchema>;

// ─── Model call ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a product validation analyst producing structured output for a client report.

Output rules:
- Respond with ONLY a JSON object matching the schema below — no markdown fences, no commentary
- UK English spelling throughout (e.g. "behaviour" not "behavior", "colour" not "color")
- Sentence case for all headings and titles
- No em-dashes: use commas or colons instead
- Be specific and evidence-based, not generic
- findings: 3-5 items drawn from the conversation, each with a short title and 1-2 sentence body
- recommendations: 2-4 concrete next steps the founder can act on
- soWhat: one sentence capturing the single most important thing the founder should take away
- artifacts.specMd: a 200-400 word product spec markdown document (# heading, sections for problem, user, solution, success metrics)
- artifacts.designBriefMd: a 150-300 word design brief markdown (# heading, sections for context, user goals, constraints, tone)
- artifacts.promptsMd: 3 ready-to-use prompts for continued AI research (markdown, each as a ## section with the prompt text in a code block)

JSON schema:
{
  "findings": [{"title": string, "body": string, "source"?: string}],
  "recommendations": [{"title": string, "body": string}],
  "soWhat": string,
  "artifacts": {
    "specMd": string,
    "designBriefMd": string,
    "promptsMd": string
  }
}`;

function buildUserPrompt(session: ValidationSession): string {
  const transcriptExcerpt = session.messages
    .slice(-30) // last 30 messages to stay within token budget
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const scores = session.scores;
  const killSignals = session.killSignals
    .map((s) => `- ${s.type}: ${s.evidence}`)
    .join("\n");

  return `Idea being validated: ${session.ideaSummary}

Confidence scores:
- Desirability: ${scores.desirability ?? "not scored"}
- Viability: ${scores.viability ?? "not scored"}
- Feasibility: ${scores.feasibility ?? "not scored"}

Kill signals detected:
${killSignals || "None"}

Validation conversation (last 30 messages):
${transcriptExcerpt}

Produce the structured JSON output for this validation session.`;
}

/**
 * Call the model once and return parsed, validated deck content.
 * Returns null if ANTHROPIC_API_KEY is unset.
 * Throws on model error or two consecutive parse failures.
 */
export async function composeDeckContent(
  session: ValidationSession
): Promise<ComposedContent | null> {
  // Lazy import so this module can be loaded in tests without the SDK
  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[compose] ANTHROPIC_API_KEY unset — skipping model call");
    return null;
  }

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(session);

  let rawText: string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    rawText = textBlock?.type === "text" ? textBlock.text.trim() : undefined;

    if (!rawText) {
      console.error(`[compose] Attempt ${attempt}: model returned no text block`);
      if (attempt === 2) throw new Error("[compose] Model returned empty response after 2 attempts");
      continue;
    }

    // Strip accidental markdown fences if the model adds them
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error(`[compose] Attempt ${attempt}: JSON parse failed:`, err);
      console.error("[compose] Raw output:", rawText.slice(0, 500));
      if (attempt === 2) throw new Error(`[compose] Failed to parse model JSON after 2 attempts: ${String(err)}`);
      continue;
    }

    const result = ComposedContentSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`[compose] Attempt ${attempt}: Zod validation failed:`, result.error.flatten());
      if (attempt === 2) throw new Error(`[compose] Zod validation failed after 2 attempts: ${JSON.stringify(result.error.flatten())}`);
      continue;
    }

    return result.data;
  }

  // Should never reach here
  throw new Error("[compose] composeDeckContent exhausted retry loop unexpectedly");
}
