-- ============================================================
-- Style Me — Week 2 — table research_records
--
-- Run once in the Supabase SQL editor. Safe to re-run: it drops
-- and recreates the policies and grants, never the data.
--
-- Same security model as core_outputs (Week 1): the browser holds
-- the publishable key, which is public, so the rules live here.
--   * row level security on from the start
--   * the public role may INSERT only the listed columns
--   * the public role may SELECT every column except `notes`:
--     free text written about a conversation is stored, never
--     read back through the public key
--   * nobody may UPDATE or DELETE through the public key
-- ============================================================

create table if not exists public.research_records (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  question       text not null check (char_length(question) between 10 and 200),
  assumption     text not null check (char_length(assumption) between 10 and 300),
  falsifier      text not null check (char_length(falsifier) between 10 and 300),
  market         text not null check (market in ('global', 'mexico', 'both')),
  verdict        text not null check (verdict in ('real', 'partly', 'not-proven')),
  notes          text check (notes is null or char_length(notes) <= 1200),
  competitor_ids jsonb not null default '[]'::jsonb,
  risk_ids       jsonb not null default '[]'::jsonb,
  source_count   int not null default 0 check (source_count between 0 and 500)
);

comment on table public.research_records is
  'Dated research records from /research. notes is insert-only for the public role.';

create index if not exists research_records_created_at_idx
  on public.research_records (created_at desc);

alter table public.research_records enable row level security;

-- Policies: which rows.
drop policy if exists "public can save a research record" on public.research_records;
create policy "public can save a research record"
  on public.research_records for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read research records" on public.research_records;
create policy "public can read research records"
  on public.research_records for select
  to anon, authenticated
  using (true);

-- Grants: which columns.
revoke all on public.research_records from anon, authenticated;

grant insert (question, assumption, falsifier, market, verdict, notes,
              competitor_ids, risk_ids, source_count)
  on public.research_records to anon, authenticated;

grant select (id, created_at, question, assumption, falsifier, market, verdict,
              competitor_ids, risk_ids, source_count)
  on public.research_records to anon, authenticated;
