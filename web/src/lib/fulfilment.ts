import "server-only";

/**
 * fulfilment.ts — orchestrates the paid-bundle pipeline.
 *
 * Called after a Stripe payment is confirmed (from the webhook).
 * Idempotent per status: safe to retry on failure.
 *
 * Pipeline:
 *   1. Load order; skip if already deck_ready.
 *   2. composeDeckContent — one bounded model call (Haiku).
 *   3. sendArtifactsEmail (3 text artifacts) → status = artifacts_sent.
 *   4. renderDeckHtml → putDeck → update deck_url → sendDeckReadyEmail → status = deck_ready.
 *
 * FAIL CLOSED: any unrecoverable error sets status = 'failed' + logs loudly.
 * The paid path never silently swallows failures.
 */

import { getOrderById, updateOrderStatus } from "./orders";
import { composeDeckContent } from "./deck/compose";
import { renderDeckHtml, type DeckData } from "./deck/template";
import { putDeck } from "./deck/storage";
import { sendArtifactsEmail, sendDeckReadyEmail } from "./notifications";
import type { ValidationSession } from "@/types/index";

// ─── Main orchestrator ────────────────────────────────────────────────────────

/**
 * Fulfil a paid order: generate artifacts, email them, render and store the
 * deck, email the deck link.
 *
 * Idempotent: calling this on an already-fulfilled order is a safe no-op.
 * On any failure: sets status='failed' with error message and re-throws
 * so callers can log/alert appropriately.
 */
export async function fulfilOrder(orderId: string): Promise<void> {
  console.info(`[fulfilment] Starting fulfilment for order ${orderId}`);

  // ── Step 1: load order ───────────────────────────────────────────────────
  let order = await getOrderById(orderId);
  if (!order) {
    console.error(`[fulfilment] CRITICAL: Order ${orderId} not found — cannot fulfil`);
    throw new Error(`[fulfilment] Order not found: ${orderId}`);
  }

  // Idempotency guard: already fully fulfilled
  if (order.status === "deck_ready") {
    console.info(`[fulfilment] Order ${orderId} already deck_ready — skipping`);
    return;
  }

  try {
    // ── Step 2: compose content ────────────────────────────────────────────
    // Re-hydrate the ValidationSession from the stored transcript
    const session = extractSession(order);

    let composed = await composeDeckContent(session);

    // If the model is unavailable (no API key), use a minimal fallback
    if (!composed) {
      console.warn(`[fulfilment] ANTHROPIC_API_KEY unset — using fallback content for order ${orderId}`);
      composed = buildFallbackContent(session);
    }

    // ── Step 3: send artifact emails ────────────────────────────────────────
    // Only send if not already past this stage (resumable)
    if (order.status === "paid") {
      await sendArtifactsEmail(
        {
          email: order.email ?? "",
          ideaSummary: order.ideaSummary ?? session.ideaSummary,
          orderId: order.id,
        },
        composed.artifacts
      );
      await updateOrderStatus(orderId, "artifacts_sent");

      // Reload so status is fresh for the next check
      order = await getOrderById(orderId);
      if (!order) throw new Error(`[fulfilment] Order ${orderId} disappeared mid-pipeline`);
    }

    // ── Step 4: render, store, and email deck link ──────────────────────────
    if (order.status === "artifacts_sent") {
      const deckData: DeckData = {
        ideaSummary: order.ideaSummary ?? session.ideaSummary,
        scores: session.scores,
        killSignals: session.killSignals,
        findings: composed.findings,
        recommendations: composed.recommendations,
        soWhat: composed.soWhat,
      };

      const html = renderDeckHtml(deckData);
      await putDeck(orderId, html);

      const deckUrl = `/deck/${orderId}`;
      await updateOrderStatus(orderId, "deck_ready", { deckUrl });

      await sendDeckReadyEmail(
        {
          email: order.email ?? "",
          ideaSummary: order.ideaSummary ?? session.ideaSummary,
          orderId: order.id,
        },
        deckUrl
      );
    }

    console.info(`[fulfilment] Order ${orderId} fulfilled successfully`);
  } catch (err) {
    // Set status='failed' with error message, then re-throw so callers can
    // alert / Stripe will see the 500 and retry the webhook.
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[fulfilment] CRITICAL: Fulfilment failed for order ${orderId}:`, err);

    try {
      await updateOrderStatus(orderId, "failed", { error: errorMsg });
    } catch (updateErr) {
      // updateOrderStatus itself failed — log but don't mask the original error
      console.error(`[fulfilment] CRITICAL: Could not set failed status for order ${orderId}:`, updateErr);
    }

    throw err;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract a ValidationSession from the order's stored transcript field.
 * The transcript may be a full ValidationSession object, or just the
 * messages array — handle both gracefully.
 */
function extractSession(order: Awaited<ReturnType<typeof getOrderById>> & object): ValidationSession {
  const raw = order.transcript;

  // Full ValidationSession stored
  if (isValidationSession(raw)) {
    return raw;
  }

  // Array of messages only (legacy / minimal save)
  const messages = Array.isArray(raw)
    ? raw.map((m) => ({
        id: String((m as Record<string, unknown>).id ?? Math.random()),
        role: (m as Record<string, unknown>).role as "user" | "assistant",
        content: String((m as Record<string, unknown>).content ?? ""),
        timestamp: Date.now(),
      }))
    : [];

  // Build a minimal session from available order fields
  return {
    id: order.proveitSessionId ?? "unknown",
    ideaSummary: order.ideaSummary ?? "Untitled idea",
    phase: "complete",
    messages,
    scores: { desirability: null, viability: null, feasibility: null },
    killSignals: [],
    researchComplete: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function isValidationSession(v: unknown): v is ValidationSession {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.ideaSummary === "string" &&
    Array.isArray(o.messages) &&
    typeof o.scores === "object"
  );
}

/** Minimal fallback when the model is unavailable. */
function buildFallbackContent(session: ValidationSession) {
  return {
    findings: [
      {
        title: "Validation completed",
        body: "Your idea has been through a structured validation conversation. Review the transcript for detailed findings.",
      },
    ],
    recommendations: [
      {
        title: "Review the full transcript",
        body: "The validation conversation contains the detailed analysis. Read through it before the next planning cycle.",
      },
    ],
    soWhat: "Continue with the next discovery step based on the validation conversation.",
    artifacts: {
      specMd: `# Product spec: ${session.ideaSummary}\n\n*Full spec generation requires the ProveIt AI service.*`,
      designBriefMd: `# Design brief: ${session.ideaSummary}\n\n*Full design brief generation requires the ProveIt AI service.*`,
      promptsMd: `# Follow-up prompts\n\n## Customer interview prompt\n\`\`\`\nTell me about the last time you experienced [the problem this idea solves].\n\`\`\`\n\n## Competitive landscape prompt\n\`\`\`\nWhat alternatives exist for [the problem this idea solves] and what are their key limitations?\n\`\`\`\n\n## Pricing research prompt\n\`\`\`\nWhat would you expect to pay for a solution to [the problem this idea solves], and what would make it a no-brainer?\n\`\`\``,
    },
  };
}
