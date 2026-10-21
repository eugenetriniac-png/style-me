-- ============================================================
-- Style Me — Week 4 — table marketing_assets
--
-- Run once in the Supabase SQL editor. Safe to re-run: it drops
-- and recreates the policies and grants, never the data.
--
-- Fifth table, same security model as the first four:
--   * row level security on from the start
--   * the public role may INSERT only the listed columns
--   * the public role may SELECT every column except `note`
--   * nobody may UPDATE or DELETE through the public key
--
-- `body` holds the text exactly as it would be published, which
-- is what the copy button puts on the clipboard. Storing a
-- summary instead would make the row useless the moment the
-- page changed.
-- ============================================================

create table if not exists public.marketing_assets (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('post', 'script', 'landing', 'calendar')),
  channel    text not null check (char_length(channel) <= 40),
  title      text not null check (char_length(title) <= 120),
  body       text not null check (char_length(body) between 1 and 2000),
  variant    text not null default 'none' check (char_length(variant) <= 8),
  note       text check (note is null or char_length(note) <= 1200)
);

comment on table public.marketing_assets is
  'Saved copy from /marketing. note is insert-only for the public role.';

create index if not exists marketing_assets_created_at_idx
  on public.marketing_assets (created_at desc);

alter table public.marketing_assets enable row level security;

drop policy if exists "public can save an asset" on public.marketing_assets;
create policy "public can save an asset"
  on public.marketing_assets for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read assets" on public.marketing_assets;
create policy "public can read assets"
  on public.marketing_assets for select
  to anon, authenticated
  using (true);

revoke all on public.marketing_assets from anon, authenticated;

grant insert (kind, channel, title, body, variant, note)
  on public.marketing_assets to anon, authenticated;

grant select (id, created_at, kind, channel, title, body, variant)
  on public.marketing_assets to anon, authenticated;
