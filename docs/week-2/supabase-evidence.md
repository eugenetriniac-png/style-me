# Supabase Evidence — table `research_records`

**Project:** `ssyqkfqwhpvahtefmxdy` (Supabase Free, AWS us-east-2)
**Table:** `public.research_records`, created from `supabase/research_records.sql`
**Date:** 23 September 2026

---

## The project had paused again

Week 1 ended with a warning in its own submission: the free project pauses
after a week idle. It did, for the second time — the REST endpoint answered
nothing at all when this week started. It was resumed from the dashboard
(free, no plan change), took about four minutes to restore, and Week 1's
`core_outputs` came back with all its rows intact.

Two consequences, both already written into the product: the Save buttons say
so instead of breaking, and "free-tier infrastructure" is one of the eight
risks on `/research` — high likelihood, low impact, mitigation documented.

After the second pause, the mitigation stopped being a paragraph and became
code: `api/keepalive.js`, run once a day by Vercel's scheduler (the `crons`
entry in `vercel.json`), does one `select id limit 1` against each table. It uses
the same publishable key the browser already carries, and writes nothing.
Called by hand right after deploying, it answered
`{"ok":true,"core_outputs":200,"research_records":200}`; the scheduled run
fires for the first time the next morning, so the schedule itself is declared
and not yet observed. If Vercel ever stops running it, opening the site once a
week does the same job.

## The table was created from the repository

`supabase/research_records.sql` was run in the SQL editor. As in Week 1, the
editor flagged the script as containing destructive operations — the
`drop policy if exists` and `revoke` lines that make it safe to re-run. They
touch nothing but the policies and grants of this one table.

## What the public key may actually do

Read-only query, run in the Supabase SQL editor after the table was created,
copied verbatim:

```sql
select p.grantee, p.privilege_type as privilege,
       string_agg(p.column_name, ', ' order by p.column_name) as columns
from information_schema.column_privileges p
where p.table_schema = 'public' and p.table_name = 'research_records'
  and p.grantee in ('anon', 'authenticated')
group by p.grantee, p.privilege_type
order by p.grantee, p.privilege_type;
```

| grantee | privilege | columns |
|---|---|---|
| anon | INSERT | assumption, competitor_ids, falsifier, market, **notes**, question, risk_ids, source_count, verdict |
| anon | SELECT | assumption, competitor_ids, created_at, falsifier, id, market, question, risk_ids, source_count, verdict |
| authenticated | INSERT | assumption, competitor_ids, falsifier, market, **notes**, question, risk_ids, source_count, verdict |
| authenticated | SELECT | assumption, competitor_ids, created_at, falsifier, id, market, question, risk_ids, source_count, verdict |

`notes` is in the INSERT list and absent from the SELECT list, for both roles.
That is the whole design in one table: what someone types about a conversation
can be written and never read back through the key that ships in the browser.
No UPDATE and no DELETE row exists for either role, because neither was
granted.

Confirmed from outside the dashboard as well, against the live API with the
publishable key:

| Request | Result |
|---|---|
| `GET /research_records?select=id,question,verdict` | 200 |
| `GET /research_records?select=notes` | **401** |
| `GET /research_records?select=*` | **401** |
| `DELETE /research_records?id=eq.00000000-…` | **401** |

`select=*` is refused because PostgREST expands the star to every column,
including the one the key may not read — which is why the page asks for its
columns by name.

## What the table holds

Read back through the live API with the publishable key, at the end of the
final test run (times converted to Mexico City, UTC−6):

| saved_at | question | market | verdict | sources on the page that day |
|---|---|---|---|---|
| 23 Sep 17:38 | Do people need help naming their taste, or just help shopping? | mexico | real | 24 |
| 23 Sep 17:41 | (same) | mexico | real | 24 |
| 23 Sep 17:42 | (same) | mexico | real | 24 |
| 23 Sep 17:45 | (same) | mexico | real | 24 |
| 23 Sep 17:46 | (same) | mexico | real | 24 |
| 24 Sep 16:55 | (same) | mexico | real | 24 |
| 24 Sep 16:56 | (same) | mexico | real | 24 |
| 24 Sep 17:11 | (same) | mexico | real | 24 |

Eight rows, one per run of the test script: five on 23 September, three more on
24 September, as the console check and then the responsive sweep were added. The runs that fixed the test
itself are in there too, because deleting them would be tidying the evidence. Every
row was written by the live page's Save button; none was inserted by hand.

Each row also carries what was on screen when it was saved: the twelve
`competitor_ids` in view and the five `risk_ids` the map called top priority.
The question is the same in all eight because the script asks the same one — a
human asking a different question is what the intake is for.

`source_count: 24` is the page's own count of cited claims at the moment of
saving, which is what makes a record re-checkable: if the page later carries 30
claims, these rows still say what the conclusion was based on.
