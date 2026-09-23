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
