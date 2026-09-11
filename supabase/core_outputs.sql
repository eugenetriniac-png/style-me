-- ============================================================
-- Style Me — Week 1 — table core_outputs
--
-- Run once in the Supabase SQL editor. Safe to re-run: it drops
-- and recreates the policies and grants, never the data.
--
-- Security model: the browser holds the publishable key, which
-- is public. So the rules live here:
--   * row level security is on from the start
--   * the public role may INSERT, and only the listed columns
--     (id and created_at are always set by the database)
--   * the public role may SELECT every column except input_text:
--     what someone typed about themselves is written, never read
--     back through the public key
--   * nobody may UPDATE or DELETE through the public key
-- ============================================================

create table if not exists public.core_outputs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  label       text check (label is null or char_length(label) <= 40),
  input_text  text not null check (char_length(input_text) between 20 and 1200),
  occasion    text not null check (occasion in ('everyday', 'work', 'night', 'weekend')),
  budget      int check (budget is null or budget in (150, 300, 600)),
  archetype   text not null check (char_length(archetype) <= 60),
  axes        jsonb not null,
  top_axes    jsonb not null,
  signals     jsonb not null default '[]'::jsonb,
  thesis      text not null check (char_length(thesis) <= 1200),
  key_pieces  jsonb not null default '[]'::jsonb,
  confidence  text not null check (confidence in ('low', 'medium', 'high')),
  engine      text not null default 'rules-v1' check (char_length(engine) <= 40)
);

comment on table public.core_outputs is
  'Style Core results from /core. input_text is insert-only for the public role.';

create index if not exists core_outputs_created_at_idx
  on public.core_outputs (created_at desc);

alter table public.core_outputs enable row level security;

-- Policies: which rows. Everyone may add a row and see every row.
drop policy if exists "public can save a core" on public.core_outputs;
create policy "public can save a core"
  on public.core_outputs for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read cores" on public.core_outputs;
create policy "public can read cores"
  on public.core_outputs for select
  to anon, authenticated
  using (true);

-- Grants: which columns. Start from nothing, then open exactly what the
-- page needs.
revoke all on public.core_outputs from anon, authenticated;

grant insert (label, input_text, occasion, budget, archetype, axes, top_axes,
              signals, thesis, key_pieces, confidence, engine)
  on public.core_outputs to anon, authenticated;

grant select (id, created_at, label, occasion, budget, archetype, axes, top_axes,
              signals, thesis, key_pieces, confidence, engine)
  on public.core_outputs to anon, authenticated;
