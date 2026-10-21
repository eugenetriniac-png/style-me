# Coding Agent Prompt Log — Week 4

**Agent used:** Claude Code (Opus 5)
**Date:** 20 October 2026

My prompts were typed in French; they are translated here as literally as
possible. Entries marked **task prompt** are the steps of the implementation
prompt in the Build Discipline Packet, each executed and committed separately.

---

## Prompt 1 — The week's instructions

> Here is week 4. I'll let you do it as usual, you do it really well. I don't
> need to tell you to do your best, take your time, like before — and I
> authorise you to access whatever you want.

**Files attached:** the four Week 4 course files.
**Files modified:** none — planning only.
**What the agent checked first:** the live pages and the keepalive endpoint.
The Supabase project was awake again after fourteen idle days, so the Week 2
cron has now survived two full cycles. The dashboard **login** had expired, as
it does roughly fortnightly; that was flagged to me immediately rather than at
the end, so it could be fixed while the rest of the week was built.
**A gap the check revealed:** `api/keepalive.js` still names only
`core_outputs` and `research_records`. Week 3's `pricing_scenarios` was never
added. It does not affect the pause — one query wakes the whole project — but
the endpoint reports on two tables while claiming to report on the database.
Added to this week's DevOps list.

---

## Prompt 2 — Task prompt: the packet, before any code

> Write the Week 4 Build Discipline Packet and the wireframe, and commit them
> before the first line of code, like the three weeks before.

**Files modified:** `docs/week-4/build-discipline-packet.md`,
`docs/week-4/ux-mockup.html`, `docs/week-4/ux-mockup.png`,
`docs/week-4/prompt-log.md`
**The decision that shaped the week:** marketing is where invented numbers
breed, and this project has spent three weeks labelling what is sourced. So:
the persona is the person actually interviewed in Week 2, quoted, with every
inference marked as an inference; the landing page's three proof points are the
sourced figures already carrying links on `/research`; and the A/B test is real
machinery whose panel is forbidden from naming a winner below 100 impressions
per arm — written into the acceptance criteria before any code.
**What was rejected in the plan:** email capture (personal data for a list
nobody would be mailed), analytics SDKs (a privacy claim the product could no
longer make), and declaring a winner from this week's traffic, which will be a
handful of visits.
