import "server-only";

/**
 * Wizard-of-Oz pricing-intent capture.
 *
 * When a user clicks "Get the bundle — £4.99" or "Subscribe — £9.99/mo" on
 * the Full Validation completion screen, we record the click as an *intent*
 * (no Stripe yet) so we get pricing-format signal for the friend-cohort
 * Week 1 launch. Claire then manually emails the bundle within 4 hours.
 *
 * Storage: Supabase table `public.woz_intents`. RLS on, anon key has
 * INSERT-only via `anon_can_insert_woz_intents`.
 *
 * Schema (see migration `create_woz_intents_table`):
 *   id            bigint identity primary key
 *   email         text not null
 *   chosen_option text not null check (in 'one_off' | 'subscription')
 *   intended_use  text nullable
 *   idea_summary  text nullable
 *   ip            text nullable
 *   created_at    timestamptz default now()
 *
 * Fail open on Supabase errors — better to silently lose a submission than
 * break the form for the user. Errors are logged.
 *
 * Local dev / tests: when SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY are
 * unset, falls back to an in-memory list.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (_supabase !== undefined) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  _supabase = url && key ? createClient(url, key) : null;
  return _supabase;
}

const memoryStore: WozIntent[] = [];

export type WozOption = "one_off" | "subscription";

export interface WozIntent {
  email: string;
  chosenOption: WozOption;
  intendedUse: string;
  ideaSummary: string;
  ip: string;
  ts: string;
}

export interface WozIntentInput {
  email: string;
  chosenOption: WozOption;
  intendedUse?: string;
  ideaSummary?: string;
  ip: string;
}

export async function recordWozIntent(input: WozIntentInput): Promise<void> {
  const entry: WozIntent = {
    email: input.email.trim().toLowerCase(),
    chosenOption: input.chosenOption,
    intendedUse: (input.intendedUse ?? "").slice(0, 500),
    ideaSummary: (input.ideaSummary ?? "").slice(0, 500),
    ip: input.ip,
    ts: new Date().toISOString(),
  };

  const supabase = getSupabase();
  try {
    if (supabase) {
      const { error } = await supabase.from("woz_intents").insert({
        email: entry.email,
        chosen_option: entry.chosenOption,
        intended_use: entry.intendedUse || null,
        idea_summary: entry.ideaSummary || null,
        ip: entry.ip,
      });
      if (error) {
        console.error("[woz-intent] Supabase insert error (swallowed):", error);
      }
    } else {
      memoryStore.push(entry);
    }
  } catch (err) {
    console.error("[woz-intent] recordWozIntent threw (swallowed):", err);
  }
}

export function resetWozIntentStores(): void {
  memoryStore.length = 0;
  _supabase = undefined;
}

export function _getMemoryWozIntents(): readonly WozIntent[] {
  return memoryStore;
}
