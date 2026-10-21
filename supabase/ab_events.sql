-- ============================================================
-- Style Me — Week 4 — table ab_events
--
-- Run once in the Supabase SQL editor. Safe to re-run: it drops
-- and recreates the policies and grants, never the data.
--
-- One row per impression and per conversion. The visitor column
-- is a twelve-character random string generated in the browser
-- and kept in localStorage: not a name, not an address, not an
-- IP, and not derived from anything about the person. It exists
-- only so that one visitor cannot be counted as twenty.
--
-- Unlike the other tables in this project, `select` here is open
-- on every column, because there is nothing in a row that a
-- person would mind being read. That is the test of whether the
-- column is really anonymous, and it passes.
-- ============================================================

create table if not exists public.ab_events (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  experiment text not null check (experiment in ('headline', 'cta')),
  variant    text not null check (char_length(variant) <= 8),
  event      text not null check (event in ('impression', 'conversion')),
  visitor    text not null check (char_length(visitor) between 6 and 64),
  surface    text check (surface is null or char_length(surface) <= 60)
);

comment on table public.ab_events is
  'A/B impressions and conversions. visitor is a random local id, never personal data.';

create index if not exists ab_events_experiment_idx
  on public.ab_events (experiment, variant, event);

alter table public.ab_events enable row level security;

drop policy if exists "public can record an event" on public.ab_events;
create policy "public can record an event"
  on public.ab_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read events" on public.ab_events;
create policy "public can read events"
  on public.ab_events for select
  to anon, authenticated
  using (true);

revoke all on public.ab_events from anon, authenticated;

grant insert (experiment, variant, event, visitor, surface)
  on public.ab_events to anon, authenticated;

grant select (id, created_at, experiment, variant, event, visitor, surface)
  on public.ab_events to anon, authenticated;
