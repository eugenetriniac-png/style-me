-- ============================================================
-- Style Me — Week 3 — table pricing_scenarios
--
-- Run once in the Supabase SQL editor. Safe to re-run: it drops
-- and recreates the policies and grants, never the data.
--
-- Third table, same security model as core_outputs (Week 1) and
-- research_records (Week 2):
--   * row level security on from the start
--   * the public role may INSERT only the listed columns
--   * the public role may SELECT every column except `note`
--   * nobody may UPDATE or DELETE through the public key
--
-- A saved scenario keeps its inputs *and* its outputs. Keeping
-- only the inputs would mean the row changes meaning the next
-- time the model does.
-- ============================================================

create table if not exists public.pricing_scenarios (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  label               text check (label is null or char_length(label) <= 60),
  scenario            text not null check (scenario in ('conservative', 'base', 'optimistic')),
  inputs              jsonb not null,
  outputs             jsonb not null,
  mrr_mxn             int not null check (mrr_mxn >= 0 and mrr_mxn < 1000000000),
  arr_mxn             int not null check (arr_mxn >= 0 and arr_mxn < 1000000000),
  assumptions_version text not null check (char_length(assumptions_version) <= 40),
  note                text check (note is null or char_length(note) <= 1200)
);

comment on table public.pricing_scenarios is
  'Saved runs of the /pricing simulator. note is insert-only for the public role.';

create index if not exists pricing_scenarios_created_at_idx
  on public.pricing_scenarios (created_at desc);

alter table public.pricing_scenarios enable row level security;

-- Policies: which rows.
drop policy if exists "public can save a scenario" on public.pricing_scenarios;
create policy "public can save a scenario"
  on public.pricing_scenarios for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read scenarios" on public.pricing_scenarios;
create policy "public can read scenarios"
  on public.pricing_scenarios for select
  to anon, authenticated
  using (true);

-- Grants: which columns.
revoke all on public.pricing_scenarios from anon, authenticated;

grant insert (label, scenario, inputs, outputs, mrr_mxn, arr_mxn, assumptions_version, note)
  on public.pricing_scenarios to anon, authenticated;

grant select (id, created_at, label, scenario, inputs, outputs, mrr_mxn, arr_mxn, assumptions_version)
  on public.pricing_scenarios to anon, authenticated;
