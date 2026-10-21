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

Row level security alone would not produce that `401` on `select=note`: a
policy decides which *rows* you may read, never which *columns*. The column
grant does, and this is the fifth table where the two are used together.

| Column grants, read back from `information_schema.column_privileges` | `anon` / `authenticated` |
|---|---|
| `marketing_assets` — INSERT | `kind`, `channel`, `title`, `body`, `variant`, **`note`** |
| `marketing_assets` — SELECT | `id`, `created_at`, `kind`, `channel`, `title`, `body`, `variant` — **`note` absent** |
| `ab_events` — INSERT | `experiment`, `variant`, `event`, `visitor`, `surface` |
| `ab_events` — SELECT | every column, **deliberately** |

`note` is the free-text field on a saved asset: write it, never read it back.
Same rule as `input_text` in Week 1 and `notes` in Weeks 2 and 3 — anything a
person types in their own words is insert-only through the public key.

`ab_events` is the one table in this project where **every column is readable**,
and that is deliberate. The only field that could identify anyone is `visitor`,
which is twelve random characters generated in the browser — not a name, not an
IP, not a fingerprint, not derived from anything about the person. Opening the
column to anyone is the test of whether it is really anonymous. If reading it
were uncomfortable, it would not be anonymous, and it would not belong in the
table.

## What the tables hold

Read back through the publishable key on 20 October, after the final test run.

**`ab_events` — 24 rows, 4 visitors.**

| Experiment | Impressions | Conversions |
|---|---|---|
| headline, variant A | 8 | 1 |
| headline, variant B | 2 | 1 |
| CTA, variant A | 1 | 1 |
| CTA, variant B | 9 | 1 |

Those eight and nine are not eight and nine people. **Sixteen of the
twenty-four rows belong to one visitor**, `20q3i58295xe`, recorded before
defect 7 was fixed: impressions were de-duplicated per page load rather than
per visitor, and the responsive sweep loads the homepage six times. The visitor
recorded after the fix, `g9sl9fvv8uex`, holds exactly four — two impressions
and two conversions — and stayed at four through two reloads and a second
click.

The rows are kept. They are the clearest statement of what the defect did, and
the page they feed refuses to name a winner at this sample size regardless:
**1,024 impressions per arm** would be needed to detect a 5-point move off a
20 % baseline, and the smaller arm holds 2.

**`marketing_assets` — 2 rows**, both written by test S3 clicking *Save to
Supabase* on the TikTok script *The ten-minute shirt*:

| id | kind | channel | title | variant |
|---|---|---|---|---|
| `d0abd47f…` | script | tiktok | The ten-minute shirt | none |
| `6437eb95…` | script | tiktok | The ten-minute shirt | none |

Each run saves one row, and S3 asserts the count moves by exactly one — a
double insert on one click is the failure this table is most likely to have.
The stored `body` was compared field for field against the text on the page,
newlines and timing cues included, and matched: the row holds what would be
published, not a summary of it.
