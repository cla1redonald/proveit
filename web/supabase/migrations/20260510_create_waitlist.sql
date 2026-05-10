-- Migration: create_waitlist_table + waitlist_anon_insert_policy
-- Applied to project bbpdicijaqoujnpidiho (proveit-web) on 2026-05-10
-- via the Supabase MCP. Checked in here so the schema is reproducible
-- if the project needs to be recreated or cloned.
--
-- Apply via: supabase db push (with CLI) OR via the Supabase MCP / dashboard
-- SQL editor. The two statements below are independent — apply in order.

-- ─── 1. Table + indexes + RLS-on ─────────────────────────────────────────────

create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  idea_excerpt text,
  reason text not null check (reason in ('global_cap', 'per_ip_cap')),
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_desc_idx
  on public.waitlist (created_at desc);

create index if not exists waitlist_email_idx
  on public.waitlist (email);

alter table public.waitlist enable row level security;

comment on table public.waitlist is
  'Users who hit the proveit-web spend ceiling and asked to be notified when more capacity is available. Service-role only access; no public reads or writes.';

-- ─── 2. RLS policy: allow anon INSERT only ──────────────────────────────────

-- Defence in depth alongside the server-only import guard in lib/waitlist.ts.
-- Even if the publishable key leaked, attackers could only spam INSERTs
-- (rate-limited by /api/waitlist + by Supabase itself), never read the email
-- list.
--
-- Reads happen via the Supabase dashboard with the maintainer's session.

create policy "anon_can_insert"
  on public.waitlist
  for insert
  to anon
  with check (true);
