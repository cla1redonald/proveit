-- ProveIt Studio — hosted mirror schema.
-- Read-only from the app (server-side, service role); written only by `proveit sync`.
-- RLS is enabled with NO public policies: the anon key can read nothing. The
-- hosted Studio gates access with app-level single-user auth, then reads with the
-- service role. So even if the anon key leaks, the data stays private.

create table if not exists studio_ideas (
  slug          text primary key,
  name          text not null,
  one_liner     text,
  scores        jsonb not null default '{}'::jsonb,   -- { desirability, viability, feasibility, extra }
  status        text,
  generated     text,
  last_updated  text,
  kill_signals  jsonb not null default '[]'::jsonb,   -- [ { label, detail, status } ]
  has_deck      boolean not null default false,
  deck          text,
  artifact_count int not null default 0,
  synced_at     timestamptz not null default now()
);

create table if not exists studio_artifacts (
  idea_slug  text not null references studio_ideas(slug) on delete cascade,
  file_name  text not null,
  kind       text not null,
  label      text,
  round      int,
  angle      text,
  content    text,
  primary key (idea_slug, file_name)
);

create table if not exists studio_synthesis (
  idea_slug    text primary key references studio_ideas(slug) on delete cascade,
  generated_at text,
  summary      text,
  bull         text,
  bear         text,
  devil        text,
  body         text
);

create table if not exists studio_portfolio_synthesis (
  id           int primary key default 1,
  generated_at text,
  body         text,
  constraint studio_portfolio_singleton check (id = 1)
);

create table if not exists studio_fast_checks (
  slug        text primary key,
  name        text not null,
  verdict     text,
  assessments jsonb not null default '[]'::jsonb,      -- [ { dimension, verdict, detail } ]
  insight     text,
  source      text,
  date        text
);

-- Lock everything down: RLS on, no policies → anon/authenticated roles get nothing.
-- Only the service role (used server-side by the hosted app and by sync) bypasses RLS.
alter table studio_ideas                enable row level security;
alter table studio_artifacts            enable row level security;
alter table studio_synthesis            enable row level security;
alter table studio_portfolio_synthesis  enable row level security;
alter table studio_fast_checks          enable row level security;
