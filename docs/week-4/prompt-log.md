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

---

## Prompt 3 — Task prompt: the content, the brand and the A/B engine

> Build the week's content layer and the experiment machinery before any page
> uses them: the persona from the Week 2 interview, ten posts, three scripts,
> a fourteen-day calendar, the two experiments, and a brand module that cannot
> drift from the stylesheet.

**Files modified:** `js/marketing-data.js`, `js/brand.js`, `js/ab.js`
**Commit:** `f491de1`
**The decision that shaped it:** `js/brand.js` contains **no hex codes**. It
reads every colour through `getComputedStyle` on the live document, so a brand
page can only ever show what the product actually renders. The alternative —
a table of colours maintained by hand — is wrong the first time anyone touches
`css/app.css`, and wrong silently.
**Also deliberate:** post lengths are counted at render time rather than
stored. A stored character count is a second source of truth for a fact the
string already knows.

---

## Prompt 4 — Task prompt: the landing page and `/marketing`

> Turn the homepage into a real landing page driven by the experiments, and
> build `/marketing` as the surface that shows the brand, the persona, the
> content and the honest A/B read.

**Files modified:** `js/views.js`, `js/app.js`, `css/app.css`, `vercel.json`
**Commit:** `f9c644f`
**Two defects this produced, both found in screenshots rather than by a test:**
the hero's gradient scrim grew with the new copy until it covered the drawn
figure entirely — removing the one thing on the page no competitor has — and
the fix for that sent the footer to the top, because CSS defaults `order` to 0
and the new grid had given an order to everything except the footer.
**What the agent refused to add:** a chart of the current A/B results. At this
sample size a bar chart is a picture of noise; the panel prints the distance
to significance instead.

---

## Prompt 5 — Task prompt: the two tables and the test suite

> Write the SQL for `marketing_assets` and `ab_events` with the same security
> model as the first three tables, then the suite: two A/B tests and three
> software tests against the live site.

**Files modified:** `supabase/marketing_assets.sql`, `supabase/ab_events.sql`,
`docs/week-4/run-tests.ps1`, `api/keepalive.js`
**Commits:** `ee3ebae`, `360d57c`, `ffac951`
**What the first run found before a single real visitor:** the two experiments
were one. `hash % 2` over an FNV hash reads the parity of the characters,
which both experiment names shared, so every visitor saw the same letter
twice. A1 measured 100% agreement between the draws; after an avalanche step
it reads 50.1%.
**What the first run also found about itself:** one exception inside A2 killed
the whole suite, and four checks that would have passed never reported. Each
test is now wrapped, and `summarise` treats a non-array response as zero rows.

---

## Prompt 6 — Task prompt: finish the evidence, and read the table

> Fill the evidence documents with the real numbers from the final run.

**Files modified:** `js/ab.js`, `docs/week-4/run-tests.ps1`,
`docs/week-4/test-evidence.md`, `docs/week-4/supabase-evidence.md`,
`docs/week-4/human-decision-note.md`
**Commits:** `413a084`, `3ca6393`
**What reading the table found that six green tests had not:** one visitor
held sixteen rows. Impressions were de-duplicated in a module-level variable,
which a reload wipes, so the responsive sweep counted one person six times.
An inflated denominator drags every conversion rate down, and the two arms
only stay comparable if both inflate by the same factor — an accident, not a
property. The flag moved to localStorage, and A2 now brings the same visitor
back twice and clicks again to assert the count does not move.
**What was not done:** the sixteen rows were not deleted. They are the
clearest record of what the defect did, and the panel refuses to name a winner
at this sample size regardless.
