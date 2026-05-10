import "server-only";

/**
 * Email-capture waitlist for users who hit the daily spend ceiling.
 *
 * When /api/fast or /api/chat returns 503 (global or per-IP cap), the UI
 * offers a small form: "Want more access? Drop your email and I'll get in
 * touch." Submissions land here.
 *
 * Storage: Supabase table `public.waitlist`. RLS enabled, anon key has
 * INSERT-only access via the `anon_can_insert` policy. Reads happen via
 * the Supabase dashboard with the maintainer's session — no admin endpoint
 * built (scope creep).
 *
 * Schema (see web/migrations/* if extracted, or the Supabase MCP migration
 * `create_waitlist_table` applied at provisioning time):
 *   id           bigint identity primary key
 *   email        text not null
 *   idea_excerpt text nullable
 *   reason       text not null check (in 'global_cap' | 'per_ip_cap')
 *   ip           text nullable
 *   created_at   timestamptz default now()
 *
 * Privacy: this is intentionally light-touch. The form copy tells the user
 * the email goes to the maintainer (Claire) and that's it. No marketing
 * automation, no third-party processors. If this ever grows into a real
 * mailing list, that's the moment to add a privacy notice and an opt-out.
 *
 * Fail open on Supabase errors — better to silently lose a submission than
 * to break the form for the user. Errors are logged for follow-up.
 *
 * Local dev / tests: when SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY are
 * unset, the lib falls back to an in-memory `Map` so tests don't need a
 * live Supabase project. Production must set both env vars.
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

// In-memory fallback for local dev (and tests)
const memoryStore: WaitlistEntry[] = [];

export interface WaitlistEntry {
  email: string;
  ideaExcerpt: string;
  reason: "global_cap" | "per_ip_cap";
  ip: string;
  ts: string; // ISO timestamp
}

export interface WaitlistAddInput {
  email: string;
  ideaExcerpt?: string;
  reason: "global_cap" | "per_ip_cap";
  ip: string;
}

/**
 * Add a waitlist entry. Returns success regardless of Supabase availability —
 * the user-facing flow shouldn't break on a transient backend issue. Errors
 * are logged.
 */
export async function addToWaitlist(input: WaitlistAddInput): Promise<void> {
  const entry: WaitlistEntry = {
    email: input.email.trim().toLowerCase(),
    ideaExcerpt: (input.ideaExcerpt ?? "").slice(0, 200),
    reason: input.reason,
    ip: input.ip,
    ts: new Date().toISOString(),
  };

  const supabase = getSupabase();
  try {
    if (supabase) {
      const { error } = await supabase.from("waitlist").insert({
        email: entry.email,
        idea_excerpt: entry.ideaExcerpt || null,
        reason: entry.reason,
        ip: entry.ip,
      });
      if (error) {
        console.error("[waitlist] Supabase insert error (swallowed):", error);
      }
    } else {
      memoryStore.push(entry);
    }
  } catch (err) {
    console.error("[waitlist] addToWaitlist threw (swallowed):", err);
  }
}

/**
 * Test-only — clear in-memory state and reset the cached Supabase client.
 */
export function resetWaitlistStores(): void {
  memoryStore.length = 0;
  _supabase = undefined;
}

/**
 * Test-only — read in-memory entries (Supabase has its own dashboard).
 */
export function _getMemoryWaitlist(): readonly WaitlistEntry[] {
  return memoryStore;
}
