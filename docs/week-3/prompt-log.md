# Coding Agent Prompt Log — Week 3

**Agent used:** Claude Code (Opus 5)
**Date:** 6 October 2026

My prompts were typed in French; they are translated here as literally as
possible. Entries marked **task prompt** are the steps of the implementation
prompt in the Build Discipline Packet, each executed and committed separately.

---

## Prompt 1 — The week's instructions

> Here is week 3. I'll let you do it as usual, you do it really well. I don't
> need to tell you to do your best, take your time, like before — and I
> authorise you to access whatever you want.

**Files attached:** the four Week 3 course files.
**Files modified:** none — planning only.
**What the agent checked first:** the live pages, and whether Week 2's
`api/keepalive.js` had done its job. It had: the Supabase project was still
awake on 6 October, twelve days after the last manual visit, where it used to
pause after seven. That is the first of this project's mitigations to be
confirmed by time rather than by argument.

---

## Prompt 2 — Task prompt: price from the evidence, not from a feeling

> Before the packet: the pricing has to follow from what we already know, not
> from a number I like. Use last week's interview and research, and find
> whatever is missing with real sources.

**Files modified:** none — research only.
**What the agent did:** took Week 2's verified figures (AMVO's 28% of Mexican
online returns are fashion; Indyx's $50 lookbook; Cladwell at $7.99/month;
Stitch Fix at $549 per client per year; the interviewee's €150 walk-away) and
added three sourced anchors this week needs: the **NRF 2025 Retail Returns
Landscape** (15.8% of sales returned, $849.9bn, **19.3% of online orders**),
the **Mexican minimum wage for 2026** (MX$315.04 a day, MX$9,582 a month), and
a per-return cost range from the industry press.
**What was rejected:** the widely quoted "a returned apparel item costs 66% of
its price" and "$30 per return". Both appear only in content-marketing blogs
with no primary source behind them. The per-return cost is in the model as a
**guess** the user can move, not as a fact.
**The decision this forced:** the consumer is not the customer. Week 2's
interview said *"acheter moins cher et plus vite, 100 %"*; pricing a
subscription at that person would contradict the only direct evidence the
project owns. The paying segment is the brand that already counts returns in
pesos.

---

## Prompt 3 — Task prompt: the packet, before any code

> Write the Week 3 Build Discipline Packet and the wireframe, and commit them
> before the first line of code, like the last two weeks.

**Files modified:** `docs/week-3/build-discipline-packet.md`,
`docs/week-3/ux-mockup.html`, `docs/week-3/ux-mockup.png`,
`docs/week-3/prompt-log.md`
**Decisions taken in the packet:** three tiers where the free one stays free
forever and the paid consumer tier is per-lookbook rather than a subscription;
two segments where the second one is the only one expected to pay; assumptions
labelled `sourced` / `estimate` / `guess` on screen; the scenario toggle moves
only guesses, which is written as an acceptance criterion and as a test; no
charts; no payments.

---

## Prompt 4 — Task prompt: the dataset

> `js/pricing-data.js`: three tiers, two segments, the feature map, the
> assumptions and the scenario multipliers. Every assumption carries its kind,
> and every sourced one a URL and a date.

**Files modified:** `js/pricing-data.js` (new), `index.html`, `build.ps1`
**Decision:** the feature map has a `status` column with two values and no
third. Twelve features, seven built and five planned, and the built ones link
to the page they run on. A "coming soon" column with five shades of almost
would have been easier to write and worth nothing.
**Commit:** `6bcb362`

---

## Prompt 5 — Task prompt: the engine

> `js/pricing.js`: pure functions — compute, priceCheck, assumptionsFor,
> validate, toRecord. No DOM, clamp inputs rather than trusting them.

**Files modified:** `js/pricing.js` (new)
**What the agent did:** worked the base case by hand first — 144 lookbooks,
MX$35,856 of lookbook revenue, MX$29,400 of subscriptions, MX$65,256 a month,
MX$747,792 a year once the 10% annual prepay discount hits the brand line,
66.9% margin — then wrote the engine and checked it against those numbers
rather than the other way round.
**Commit:** `428be28`

---

## Prompt 6 — Task prompt: the two pages

> `/product` with the feature map and the tier cards; `/pricing` with the
> calculator, the scenario toggle, the assumptions table and the saved
> scenarios. Both from the same data file.

**Files modified:** `js/views.js`, `js/app.js`, `css/app.css`, `vercel.json`,
`serve.ps1`, `supabase/pricing_scenarios.sql` (new)
**Errors found before pushing:** two links in the feature map were lying. The
renderer pointed at `/outfit`, which without an id falls through to the feed,
and `/saved` sends a first-time visitor back to the welcome screen. The first
now points at `/feed`, where the renderer actually runs; the second says
"after the style test" under the link.
**Commit:** `082951a`

---

## Prompt 7 — Task prompt: the tests

> `docs/week-3/run-tests.ps1`: the two logic tests and the three software
> tests, plus the security check, against the live site.

**Files modified:** `docs/week-3/run-tests.ps1` (new),
`docs/week-3/make-submission.ps1` (new), `js/views.js`, `css/app.css`
**Errors encountered:** three, every one of them found by reading a screenshot
rather than by an assertion — the big figures breaking mid-number
(`MX$65,2 / 56`), the revenue table inheriting the research page's 860-pixel
floor so that the Monthly and Annual columns sat outside the card, and amounts
printed as plain `$` on a page that also quotes USD and EUR.
**Fixes applied:** compact figure with the exact amount beneath it, a narrower
minimum for this table, and `MX$` written out everywhere.
**Commit:** `8813f9a`
