import "server-only";

/**
 * GET /deck/[orderId]
 *
 * Serves a stored ProveIt validation deck as HTML.
 * The deck is stored in Supabase Storage by the fulfilment pipeline.
 *
 * Public read — no auth required. The orderId acts as an unguessable
 * share token (nanoid 12 chars = 72 bits of entropy).
 *
 * Returns:
 *   200 text/html  — the stored deck HTML
 *   404            — order not found or deck not yet generated
 */

import { type NextRequest } from "next/server";
import { getDeck } from "@/lib/deck/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  const { orderId } = await context.params;

  if (!orderId || typeof orderId !== "string" || orderId.length < 6) {
    return new Response("Not found", { status: 404 });
  }

  let html: string | null;
  try {
    html = await getDeck(orderId);
  } catch (err) {
    console.error(`[deck-route] getDeck error for ${orderId}:`, err);
    return new Response("Error retrieving deck", { status: 500 });
  }

  if (!html) {
    return new Response("Deck not found", { status: 404 });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cache for 5 minutes — deck content doesn't change after generation
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
