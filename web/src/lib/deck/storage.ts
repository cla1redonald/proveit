import "server-only";

/**
 * storage.ts — Supabase Storage operations for rendered deck HTML.
 *
 * Bucket: `decks` (public-read, must be created in Supabase before use —
 * see the note in the fulfilment report).
 * Key pattern: `<orderId>.html`
 * Content-type: `text/html`
 *
 * Uses the service-role client (bypasses RLS), mirroring orders.ts.
 * Falls back to an in-memory map when env vars are unset (tests / local dev).
 *
 * FAIL CLOSED: throws loudly on Supabase errors — a lost deck is unacceptable
 * on the paid path.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Supabase client ──────────────────────────────────────────────────────────

let _serviceSupabase: SupabaseClient | null | undefined;

function getServiceSupabase(): SupabaseClient | null {
  if (_serviceSupabase !== undefined) return _serviceSupabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _serviceSupabase = url && key ? createClient(url, key) : null;
  return _serviceSupabase;
}

const BUCKET = "decks";

// ─── In-memory fallback ───────────────────────────────────────────────────────

const memoryDeckStore = new Map<string, string>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Store rendered deck HTML in Supabase Storage.
 *
 * Key: `<orderId>.html`
 * Upserts (overwrite if re-running fulfilment for idempotency).
 */
export async function putDeck(orderId: string, html: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (supabase) {
    const key = `${orderId}.html`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, html, {
        contentType: "text/html",
        upsert: true,
      });
    if (error) {
      console.error(`[storage] putDeck Supabase upload error for order ${orderId}:`, error);
      throw new Error(`[storage] Failed to store deck for order ${orderId}: ${error.message}`);
    }
    return;
  }

  // In-memory fallback
  memoryDeckStore.set(orderId, html);
}

/**
 * Retrieve stored deck HTML from Supabase Storage.
 * Returns null if not found.
 */
export async function getDeck(orderId: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  if (supabase) {
    const key = `${orderId}.html`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(key);

    if (error) {
      // Supabase storage 404 — not a hard error
      if (
        error.message?.toLowerCase().includes("not found") ||
        error.message?.toLowerCase().includes("object not found") ||
        (error as { statusCode?: string }).statusCode === "404"
      ) {
        return null;
      }
      console.error(`[storage] getDeck Supabase download error for order ${orderId}:`, error);
      throw new Error(`[storage] Failed to retrieve deck for order ${orderId}: ${error.message}`);
    }

    if (!data) return null;
    return await data.text();
  }

  // In-memory fallback
  return memoryDeckStore.get(orderId) ?? null;
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Reset in-memory store and cached client. Test-only. */
export function resetDeckStorage(): void {
  memoryDeckStore.clear();
  _serviceSupabase = undefined;
}

/** Return in-memory store contents. Test-only. */
export function _getMemoryDeckStore(): ReadonlyMap<string, string> {
  return memoryDeckStore;
}
