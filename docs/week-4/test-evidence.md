# Test Evidence — Week 4

**Live surfaces under test:** https://style-me-five.vercel.app/ (landing) ·
https://style-me-five.vercel.app/marketing
**Date:** 20 October 2026

The week asks for **2 A/B tests and 3 software tests**. All five are scripted
in `docs/week-4/run-tests.ps1`, plus the standing security check on the two new
tables.

---

## How the A/B tests are run

A fresh browser profile every run, so every run is a visitor who has never been
here. That is what lets **A2** record a genuine first impression and a genuine
conversion against the live database rather than a simulated one.

**A1 tests the assignment itself** — 20,000 synthetic visitors drawn in the
browser — because an A/B test with a broken split produces confident, wrong
answers forever. **A2 tests the loop end to end**, and then asks the harder
question: what does the data we actually have support?

---

## Results

Final run **20 October 2026, 21:55:52 (America/Mexico_City)**, against the
deployed site. Six checks, six passes. Raw output in
`docs/week-4/evidence/results.json`.

| # | Check | Result |
|---|---|---|
| **A1** | Assignment: split, independence, stickiness, threshold | **PASS** |
| **A2** | The experiment end to end against the live database | **PASS** |
| **S1** | Both surfaces load clean; every brand swatch equals its CSS variable | **PASS** |
| **S2** | Content complete and copyable | **PASS** |
| **S3** | Saving an asset; responsive at six widths on both pages | **PASS** |
| **S4** | The public key cannot read, change or delete what it should not | **PASS** |

### A1 — 20,000 visitors

| Measure | Value | Why it matters |
|---|---|---|
| Headline, share seeing A | **50.6 %** | A split this close is what makes the two arms comparable at all |
| CTA, share seeing A | **49.9 %** | |
| The two draws agreeing | **50.1 %** | A coin. Two experiments, not one wearing two names — see defect 1 |
| Same visitor, redrawn | **sticky** | Otherwise the test measures reload behaviour |
| Winner below 100 per arm | **refused** | Asserted as a property, not left to the page author's restraint |

### A2 — one real visitor, end to end

Visitor `g9sl9fvv8uex` was shown headline **B** ("Your style already has a
name. Here it is.") and CTA **A** ("Describe your style — one sentence").

| Measure | Value |
|---|---|
| Impressions recorded | 2 — one per experiment |
| Conversions after clicking the CTA | 2 |
| Stored variant == variant rendered | yes, both experiments |
| **Rows after two reloads and a second click** | **still 4** — see defect 7 |
| Winner named | none, in either experiment |

And the number that matters most, because it is the one a marketing page is
tempted to skip: with a 20 % baseline and a 5-point move worth detecting, each
arm needs roughly **1,024 impressions**. The smaller arm currently holds
**2**. The page says that in those words instead of drawing a bar chart of
eleven visits.

### S1 / S2 / S3 / S4

| Measure | Value |
|---|---|
| Console errors, landing and `/marketing` | 0 and 0 |
| Brand swatches checked against `getComputedStyle` | 9, **0 mismatches** |
| Posts · scripts · calendar days · copy buttons | 10 · 3 · 14 · 13 |
| Persona lines: quoted from the interview / inferred | 5 / 2 |
| Clipboard vs published text | identical (336 bytes read, 334 published — see defect 6) |
| Save: rows before → after one click | 1 → 2, stored field for field |
| Widths × pages checked for overflow | 12 combinations, **worst 0 px** |
| `GET note` · `select=*` · `DELETE` on `marketing_assets` | **401 · 401 · 401** |
| `GET` · `DELETE` on `ab_events` | 200 · **401** |

### Screenshots

`evidence/landing-desktop-full.png` · `evidence/landing-mobile-375-full.png` ·
`evidence/marketing-desktop-full.png` · `evidence/brand-swatches.png` ·
`evidence/content-cards.png` · `evidence/calendar.png` ·
`evidence/asset-saved.png` · `evidence/assets-after-reload.png`

---

## Defects found this week

### 1 — Two experiments that were secretly one

Found by **A1, before a single real visitor**. The headline draw and the CTA
draw agreed **100% of the time**: every visitor who saw headline A also saw CTA
A.

The cause is a trap worth writing down. Assignment used
`hash(visitor + ':' + experiment) % 2` over an FNV-1a hash. FNV multiplies by
an odd constant, and multiplying by an odd number **never changes the lowest
bit** — so `% 2` was reading nothing but the parity of the character codes.
Both experiment names happened to share that parity, which made the two draws
identical for every visitor.

It would have looked perfectly healthy in production: a clean 50/50 split in
each experiment, and two results that always moved together. The fix is an
avalanche step that mixes the high bits down before the modulo. After it:
headline 50.6/49.4, CTA 49.9/50.1, agreement 50.1% — a coin.

### 2 — The drawn figure vanished from the homepage

The old welcome screen put the SVG model behind a short block of copy, with a
gradient fading it out. With a headline, three proof points, two buttons and
three tier cards, the body filled the viewport and the scrim covered the
drawing completely — removing the one thing on the page no competitor has. The
art is now a block of its own: above the copy on a phone, beside it on a
desktop.

### 3 — The footer jumped to the top

Introduced by the fix for the one above. The new grid gave `order` to the copy
and the art and left the footer without one; CSS defaults `order` to 0, so the
footer sorted ahead of both. Found in the next screenshot.

### 4 — A monitor reporting on two fifths of the database

`api/keepalive.js` still listed only `core_outputs` and `research_records`.
Week 3's `pricing_scenarios` was never added to it. The pause behaviour was
never at risk — one query wakes the whole project — but a route whose only job
is to report on the database was quietly reporting on part of it. All five
tables are in the list now.

### 5 — One failing test killed the other five

The first run of this suite died on a JavaScript exception inside A2, and
**four checks that would have passed never reported at all**. A test that
cannot run must fail alone. Each test is now wrapped, and `SM.ab.summarise`
treats a non-array response as zero rows instead of throwing — which is also
what the marketing page needs the moment the database is unreachable.

### 6 — The clipboard check compared platforms, not text

S2 read 336 characters back from a 334-character post and failed. Windows
returns every newline as CRLF, so one blank line costs two characters that were
never copied. The copy was faithful; the comparison was naive. It now
normalises line endings before comparing.

### 7 — One visitor, sixteen rows

Not found by a test. Found by reading the table after a green run.

The packet's acceptance criterion says one impression per visitor per
experiment. The code de-duplicated in a module-level variable, which survives a
click but not a reload — so the responsive sweep, which loads the homepage six
times, recorded six impressions for one person. The count is still in the
table: visitor `20q3i58295xe` holds **16 rows on their own**, against 4 for the
visitor recorded after the fix.

It is worth being precise about the damage, because "the numbers run a little
high" is not the problem. An inflated denominator pushes every conversion rate
down, and the two arms stay comparable **only if both inflate by the same
factor** — which is an accident, not a property. A visitor who reloads five
times before clicking dilutes their own arm and nobody else's.

The flag now lives in localStorage beside the visitor id, so the denominator is
people who saw it and the rate is the share of them who acted. A2 was extended
to bring the same visitor back twice and click again, then assert the row count
has not moved: 4 before, 4 after. The sixteen rows stay in the table — deleting
the evidence of a counting bug from the table it corrupted would be its own
kind of dishonesty, and the read on `/marketing` refuses to name a winner at
this sample size anyway.

---

## Iteration log

| # | What changed | Why | Commit |
|---|---|---|---|
| 1 | Avalanche step added to the A/B hash | `% 2` on an FNV hash is a parity bit; the two experiments were one | `f9c644f` |
| 2 | Landing hero relaid out, art as its own block | The scrim hid the drawn figure entirely | `f9c644f` |
| 3 | `order: 3` on the landing footer | It sorted to the top of the page | `f9c644f` |
| 4 | All five tables added to the keepalive | It was reporting on two of them | `f9c644f` |
| 5 | Per-test isolation; `summarise` tolerates a non-array | One exception took the whole suite down | `360d57c` |
| 6 | Clipboard comparison normalises line endings | CRLF is not a difference in the text | `ffac951` |
| 7 | Impression de-duplication moved to localStorage | One visitor was counting as sixteen | `413a084` |
| 8 | A2 reloads twice and clicks again, asserting the count holds | Defect 7 was found by reading the table, not by a test | `3ca6393` |

---

## What this round taught me

The A/B machinery is the first thing in this project that could have been wrong
for weeks without anyone noticing. A broken split does not throw, does not look
odd, and produces a tidy table of numbers that happen to be meaningless. It was
caught because A1 was written to test the *assignment* rather than the feature
— twenty thousand draws before a single real visitor.

The second lesson is Week 3's, from the other direction: four of the seven
defects were in what a person sees — three on the page, one in the table — and
none of them were caught by arithmetic. Defect 7 is the sharpest. Every check
was green and the data underneath was already wrong, because the suite had
tested that rows appear. Nobody had tested how many.
