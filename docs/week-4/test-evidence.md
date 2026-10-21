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

*[filled in from `evidence/results.json` after the final run]*

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
headline 50.1/49.9, CTA 50.3/49.7, agreement 50.5% — a coin.

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

---

## Iteration log

| # | What changed | Why | Commit |
|---|---|---|---|
| 1 | Avalanche step added to the A/B hash | `% 2` on an FNV hash is a parity bit; the two experiments were one | `f9c644f` |
| 2 | Landing hero relaid out, art as its own block | The scrim hid the drawn figure entirely | `f9c644f` |
| 3 | `order: 3` on the landing footer | It sorted to the top of the page | `f9c644f` |
| 4 | All five tables added to the keepalive | It was reporting on two of them | `f9c644f` |
| 5 | Per-test isolation; `summarise` tolerates a non-array | One exception took the whole suite down | `360d57c` |
| 6 | Clipboard comparison normalises line endings | CRLF is not a difference in the text | *(this week)* |

---

## What this round taught me

The A/B machinery is the first thing in this project that could have been
wrong for weeks without anyone noticing. A broken split does not throw, does
not look odd, and produces a tidy table of numbers that happen to be
meaningless. It was caught because A1 was written to test the *assignment*
rather than the feature — twenty thousand draws before a single real visitor.

The second lesson is the same one as Week 3, from the other direction: three of
the six defects were in the page as a reader sees it, and all three were found
by looking at a screenshot. The tests are getting better at arithmetic and no
better at noticing that a figure disappeared.
