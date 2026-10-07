# Supabase Evidence — table `pricing_scenarios`

**Project:** `ssyqkfqwhpvahtefmxdy` (Supabase Free, AWS us-east-2)
**Table:** `public.pricing_scenarios`, created from `supabase/pricing_scenarios.sql`
**Date:** 6 October 2026

---

## This week the project was already awake

Weeks 1 and 2 both opened with the same chore: the free project had paused
after seven idle days and had to be restored before anything could be saved.
Week 2 ended by turning that mitigation into code — `api/keepalive.js`, run
once a day by Vercel's scheduler.

Twelve days later, with nobody opening the site in between, the project
answered immediately:

```
GET https://style-me-five.vercel.app/api/keepalive
{"ok":true,"checked":{"core_outputs":200,"research_records":200},"at":"2026-10-07T02:37:51.933Z"}
```

That is the first mitigation in this project confirmed by time rather than by
argument, and it is the reason this week's Supabase work took two minutes
instead of fifteen.

The dashboard **login** is a different thing and did expire, which is now a
known rhythm: roughly every two weeks, the session has to be renewed by hand
before any DDL can run.

## The table was created from the repository

`supabase/pricing_scenarios.sql` was run in the SQL editor. As in Weeks 1 and
2, the editor flagged it as containing destructive operations — the
`drop policy if exists` and `revoke` lines that make the script safe to re-run.
They touch nothing but the policies and grants of this one table.

This is the project's **third** table, and `js/db.js` has still never been
edited to accommodate one. Week 1's insert-and-list client took
`research_records` unchanged, and took `pricing_scenarios` unchanged again.

## What the public key may actually do

Read-only query, run in the Supabase SQL editor after the table was created,
copied verbatim:

```sql
select p.grantee, p.privilege_type as privilege,
       string_agg(p.column_name, ', ' order by p.column_name) as columns
from information_schema.column_privileges p
where p.table_schema = 'public' and p.table_name = 'pricing_scenarios'
  and p.grantee in ('anon', 'authenticated')
group by p.grantee, p.privilege_type
order by p.grantee, p.privilege_type;
```

| grantee | privilege | columns |
|---|---|---|
| anon | INSERT | arr_mxn, assumptions_version, inputs, label, mrr_mxn, **note**, outputs, scenario |
| anon | SELECT | arr_mxn, assumptions_version, created_at, id, inputs, label, mrr_mxn, outputs, scenario |
| authenticated | INSERT | arr_mxn, assumptions_version, inputs, label, mrr_mxn, **note**, outputs, scenario |
| authenticated | SELECT | arr_mxn, assumptions_version, created_at, id, inputs, label, mrr_mxn, outputs, scenario |

`note` appears in the INSERT list and is absent from the SELECT list, for both
roles. No UPDATE or DELETE row exists for either, because neither was granted.

Confirmed from outside the dashboard as well, against the live API with the
publishable key:

| Request | Result |
|---|---|
| `GET /pricing_scenarios?select=id,scenario,mrr_mxn` | 200 |
| `GET /pricing_scenarios?select=note` | **401** |
| `GET /pricing_scenarios?select=*` | **401** |
| `DELETE /pricing_scenarios?id=eq.00000000-…` | **401** |

## What the table holds

One row, written by the live page's Save button during the final test run
(times in Mexico City, UTC−6):

| saved_at | label | scenario | MRR | ARR | version |
|---|---|---|---|---|---|
| 6 Oct 21:12 | Week 3 test run | conservative | MX$46,878 | MX$538,261 | pricing-v1 |

The row keeps **both** its inputs and its outputs, which is the point. Keeping
only the inputs would mean the row silently changes meaning the next time the
model does; keeping only the outputs would mean nobody can ever ask where the
number came from. `assumptions_version` says which dataset produced it, so a
figure from today stays readable after the assumptions move.
