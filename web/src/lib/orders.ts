import "server-only";

/**
 * Order persistence for the paid-bundle feature.
 *
 * Phase 1 is manual fulfilment: a Stripe Checkout Session creates a `pending`
 * order row, then the webhook marks it `paid` and emails Claire to fulfil
 * manually. Artifact generation (Phase 2/3) will use the stored transcript.
 *
 * Two Supabase clients:
 *   - getAnonSupabase()    — anon key (INSERT only, RLS enforced)
 *                           used for the initial `pending` insert at checkout.
 *   - getServiceSupabase() — service-role key (bypasses RLS)
 *                           used for reads + paid/status updates in the webhook.
 *
 * FAIL CLOSED: unlike woz-intent (which swallows errors on purpose), the
 * paid path throws loudly. A lost paid order is unacceptable. Callers own
 * the error handling.
 *
 * Local dev / tests: when env vars are unset, both clients return null and
 * all operations fall through to an in-memory store, identical to woz-intent.
 *
 * Schema: see `web/supabase/migrations/0001_create_orders_table.sql`.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// ─── Supabase clients ────────────────────────────────────────────────────────

let _anonSupabase: SupabaseClient | null | undefined;
let _serviceSupabase: SupabaseClient | null | undefined;

function getAnonSupabase(): SupabaseClient | null {
  if (_anonSupabase !== undefined) return _anonSupabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  _anonSupabase = url && key ? createClient(url, key) : null;
  return _anonSupabase;
}

function getServiceSupabase(): SupabaseClient | null {
  if (_serviceSupabase !== undefined) return _serviceSupabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  _serviceSupabase = url && key ? createClient(url, key) : null;
  return _serviceSupabase;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "paid"
  | "artifacts_sent"
  | "deck_ready"
  | "failed";

export interface Order {
  id: string;
  checkoutSessionId: string;
  proveitSessionId: string | null;
  ideaSummary: string | null;
  transcript: unknown;
  email: string | null;
  status: OrderStatus;
  amountPence: number;
  currency: string;
  deckUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePendingOrderInput {
  checkoutSessionId: string;
  proveitSessionId?: string;
  ideaSummary?: string;
  transcript?: unknown;
}

// ─── In-memory fallback (tests / local dev without Supabase) ────────────────

interface MemoryOrder {
  id: string;
  checkoutSessionId: string;
  proveitSessionId: string | null;
  ideaSummary: string | null;
  transcript: unknown;
  email: string | null;
  status: OrderStatus;
  amountPence: number;
  currency: string;
  deckUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

const memoryStore: MemoryOrder[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a `pending` order row at Stripe Checkout initiation.
 *
 * Returns the new order id (nanoid). THROWS on Supabase errors — this is a
 * paid path; a silent failure means a lost order.
 */
export async function createPendingOrder(input: CreatePendingOrderInput): Promise<string> {
  const id = nanoid(12);
  const now = new Date().toISOString();

  const supabase = getAnonSupabase();
  if (supabase) {
    const { error } = await supabase.from("orders").insert({
      id,
      checkout_session_id: input.checkoutSessionId,
      proveit_session_id: input.proveitSessionId ?? null,
      idea_summary: input.ideaSummary ? input.ideaSummary.slice(0, 500) : null,
      transcript: input.transcript ?? null,
      status: "pending",
      amount_pence: 499,
      currency: "gbp",
    });
    if (error) {
      console.error("[orders] createPendingOrder Supabase insert error:", error);
      throw new Error(`[orders] Failed to insert pending order: ${error.message}`);
    }
  } else {
    // In-memory fallback
    memoryStore.push({
      id,
      checkoutSessionId: input.checkoutSessionId,
      proveitSessionId: input.proveitSessionId ?? null,
      ideaSummary: input.ideaSummary ? input.ideaSummary.slice(0, 500) : null,
      transcript: input.transcript ?? null,
      email: null,
      status: "pending",
      amountPence: 499,
      currency: "gbp",
      deckUrl: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  return id;
}

/**
 * Look up an order by Stripe checkout session id.
 *
 * Used by the webhook to check idempotency before marking paid.
 * Returns null when not found. THROWS on Supabase errors.
 */
export async function getOrderByCheckoutSession(
  checkoutSessionId: string
): Promise<MemoryOrder | null> {
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("checkout_session_id", checkoutSessionId)
      .maybeSingle();
    if (error) {
      console.error("[orders] getOrderByCheckoutSession Supabase error:", error);
      throw new Error(`[orders] Failed to read order: ${error.message}`);
    }
    if (!data) return null;
    return {
      id: data.id as string,
      checkoutSessionId: data.checkout_session_id as string,
      proveitSessionId: data.proveit_session_id as string | null,
      ideaSummary: data.idea_summary as string | null,
      transcript: data.transcript,
      email: data.email as string | null,
      status: data.status as OrderStatus,
      amountPence: data.amount_pence as number,
      currency: data.currency as string,
      deckUrl: data.deck_url as string | null,
      error: data.error as string | null,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  // In-memory fallback
  return memoryStore.find((o) => o.checkoutSessionId === checkoutSessionId) ?? null;
}

/**
 * Mark an order as paid when the Stripe webhook fires.
 *
 * Idempotent: if the order is already `paid` or beyond, this is a no-op and
 * returns false (indicating "already processed — skip downstream work").
 * Returns true when the update was applied.
 *
 * THROWS on Supabase errors. Do NOT swallow — a failed paid-status write
 * means Claire won't be notified and the order will appear stuck as `pending`.
 */
export async function markOrderPaid(
  checkoutSessionId: string,
  email: string | null
): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (supabase) {
    // Read current status first to check idempotency
    const { data: existing, error: readError } = await supabase
      .from("orders")
      .select("status")
      .eq("checkout_session_id", checkoutSessionId)
      .maybeSingle();

    if (readError) {
      console.error("[orders] markOrderPaid read error:", readError);
      throw new Error(`[orders] Failed to read order before marking paid: ${readError.message}`);
    }
    if (!existing) {
      // Order not found — could be a very late webhook for an order we never
      // stored. Log loudly but don't crash the webhook.
      console.error(`[orders] markOrderPaid: no order found for session ${checkoutSessionId}`);
      return false;
    }
    const currentStatus = existing.status as OrderStatus;
    if (currentStatus !== "pending") {
      // Already processed — idempotency guard
      return false;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("checkout_session_id", checkoutSessionId);

    if (updateError) {
      console.error("[orders] markOrderPaid Supabase update error:", updateError);
      throw new Error(`[orders] Failed to mark order paid: ${updateError.message}`);
    }
    return true;
  }

  // In-memory fallback
  const order = memoryStore.find((o) => o.checkoutSessionId === checkoutSessionId);
  if (!order) return false;
  if (order.status !== "pending") return false;
  order.status = "paid";
  order.email = email;
  order.updatedAt = new Date().toISOString();
  return true;
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Reset all in-memory state and cached clients. Test-only.
 */
export function resetOrderStores(): void {
  memoryStore.length = 0;
  _anonSupabase = undefined;
  _serviceSupabase = undefined;
}

/**
 * Return the in-memory order store. Test-only.
 */
export function _getMemoryOrders(): readonly MemoryOrder[] {
  return memoryStore;
}
