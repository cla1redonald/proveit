-- Migration: create orders table
-- Phase 1 paid-bundle feature.
-- Apply via Supabase MCP or `supabase db push`.
--
-- Human go-live steps (after applying this migration):
--   1. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID in Vercel env.
--   2. Set SUPABASE_SERVICE_ROLE_KEY in Vercel env (server-only, for paid-status writes).
--   3. Register the Stripe webhook at https://dashboard.stripe.com/webhooks
--      pointing to https://proveit.tools/api/stripe/webhook
--      listening for the `checkout.session.completed` event.

create table public.orders (
  id text primary key,                       -- nanoid (capability URL id)
  checkout_session_id text unique not null,  -- Stripe session id; idempotency key
  proveit_session_id text,
  idea_summary text,
  transcript jsonb,                          -- stored at checkout for later (Phase 2/3) compose
  email text,                                -- from Stripe at completion (null until paid)
  status text not null default 'pending' check (status in ('pending','paid','artifacts_sent','deck_ready','failed')),
  amount_pence integer not null default 499,
  currency text not null default 'gbp',
  deck_url text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

-- Anon can insert a pending order (created at checkout initiation, before payment).
-- Paid-status writes use the service-role key only.
create policy anon_can_insert_pending_orders on public.orders
  for insert to anon with check (status = 'pending');
-- NO anon select/update: paid-status writes use the service-role key only.

-- Table-level grants (RLS is the gate, but the role still needs the privilege).
-- anon: insert only (the pending row at checkout). service_role: full (webhook/fulfilment).
grant insert on public.orders to anon;
grant all on public.orders to service_role;
