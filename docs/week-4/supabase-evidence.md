# Supabase Evidence — tables `marketing_assets` and `ab_events`

**Project:** `ssyqkfqwhpvahtefmxdy` (Supabase Free, AWS us-east-2)
**Tables:** `public.marketing_assets`, `public.ab_events`, created from
`supabase/marketing_assets.sql` and `supabase/ab_events.sql`
**Date:** 20 October 2026

---

## The keepalive has now survived two cycles

Week 2 added `api/keepalive.js` and a daily Vercel cron after the free project
paused twice. It has not paused since. On 20 October, fourteen idle days after
the last visit, the endpoint answered immediately:

```
GET https://style-me-five.vercel.app/api/keepalive
{"ok":true,"checked":{...},"at":"2026-10-21T02:36:43.378Z"}
```

**A gap this check revealed in itself.** The endpoint named only
`core_outputs` and `research_records`. Week 3's `pricing_scenarios` was never
added, so a route whose whole job is to report on the database was reporting on
two fifths of it. It does not change the pause behaviour — a single query wakes
the entire project — but it was a monitor quietly lying about its coverage.
All five tables are now in the list.

The dashboard **login** is a separate thing and expires roughly fortnightly. It
had expired again, which is now a known rhythm rather than a surprise, and it
blocks nothing except running DDL.

## The tables were created from the repository

Both SQL files were run in the SQL editor, flagged as containing destructive
operations — the `drop policy if exists` and `revoke` lines that make them safe
to re-run. Fourth and fifth tables; `js/db.js` has still never been edited to
take a new one.

## What the public key may do

| Request | Result |
|---|---|
| `GET /marketing_assets?select=id,kind,channel` | 200 |
| `GET /marketing_assets?select=note` | **401** |
| `GET /marketing_assets?select=*` | **401** |
| `DELETE /marketing_assets?id=eq.00000000-…` | **401** |
| `GET /ab_events?select=experiment,variant,event` | 200 |
| `DELETE /ab_events?id=eq.00000000-…` | **401** |

`ab_events` is the one table in this project where **every column is readable**,
and that is deliberate. The only field that could identify anyone is `visitor`,
which is twelve random characters generated in the browser — not a name, not an
IP, not a fingerprint, not derived from anything about the person. Opening the
column to anyone is the test of whether it is really anonymous. If reading it
were uncomfortable, it would not be anonymous, and it would not belong in the
table.

## What the tables hold

*[filled in after the final test run]*
