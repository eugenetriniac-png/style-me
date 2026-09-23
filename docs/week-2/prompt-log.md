# Coding Agent Prompt Log — Week 2

**Agent used:** Claude Code (Opus 5)
**Date:** 23 September 2026

My prompts were typed in French; they are translated here as literally as
possible. Entries marked **task prompt** are the steps of the implementation
prompt in the Build Discipline Packet, each executed and committed separately
after I handed the build over.

---

## Prompt 1 — The week's instructions

> Here are the week 2 instructions. I want you to do it like week 1, it was
> great, I got a really good grade. Do as much as you can yourself, I'm giving
> you access to everything.

**Files attached:** the four Week 2 course files.
**Files modified:** none — planning only.
**What the agent did:** read the four files and named the two things it could
not do for me: the **real human validation conversation** the week requires,
and signing in to Supabase, whose session had expired in the browser.
**What it checked before planning:** that the live site still answered (200),
and that the Supabase project had paused again — it had, for the second time,
after a week idle.

---

## Prompt 2 — Task prompt: real research, real sources

> Before any page: gather the actual evidence. Real competitors, real figures,
> each with a source I can click and the date it was checked. Nothing invented.
> Mexico specifically, not just "global".

**Files modified:** none yet — research only.
**What the agent did:** ran web searches and read primary sources: Stitch Fix's
FY2025 investor release, Zalando's corporate page, tech.eu on Whering's funding,
AMVO's fashion-ecommerce analysis, Mexico Business News on second-hand fashion,
Statista brand figures via Merca2.0, and the March 2025 Mexican data protection
law.
**What was rejected:** two claims that only appeared in vendor blogs or SEO
comparison pages — an "Acloset 7M users" figure with no primary source, and
Zalando's often-quoted "50% of recommendations judged good outfits / 40% larger
baskets", which is not on Zalando's own page. The first was dropped, the second
kept only with its real attribution (S&P Global, 2018) rather than as a Zalando
statement.
**What I learned:** the first page of search results for "best wardrobe apps"
is written by the apps themselves. Indyx's comparison of its competitors is
sourced *from Indyx*, and the page says so.

---

## Prompt 3 — Task prompt: the packet, before any code

> Write the Week 2 Build Discipline Packet and the wireframe, and commit them
> before the first line of code, like last week.

**Files modified:** `docs/week-2/build-discipline-packet.md`,
`docs/week-2/ux-mockup.html`, `docs/week-2/ux-mockup.png`,
`docs/week-2/prompt-log.md`
**Decisions taken in the packet:** a static, dated dataset rather than live
scraping; a CSS-grid risk map rather than a chart library; no invented
0–100 score for competitors; `notes` unreadable through the public key, as
`input_text` was in Week 1.

---

## Prompt 4 — Task prompt: the dataset

> `js/research-data.js`: 12 competitors and substitutes, 5 global benchmarks,
> the Mexico findings, 8 risks. Every record carries a source URL, the source's
> name and the date it was checked. Do not invent a figure: if it cannot be
> sourced, leave it out.

**Files modified:** `js/research-data.js` (new), `index.html`, `build.ps1`
**Error encountered:** the source link check found `investors.stitchfix.com`
returns **403** to anything that is not a browser, so a link-integrity test
could never verify it.
**Fix applied:** cited Stitch Fix's **10-Q filed with the SEC** instead — a
primary document, and one that answers a script. The figures changed with it,
to what the filing actually says: 2,307,000 active clients on 1 November 2025
against 2,434,000 a year earlier, −5.2%, revenue per client $559.
**What I learned:** the better source was also the more robust link. Citing the
press release rather than the filing was laziness disguised as convenience.
**Commit:** `5698964`

---

## Prompt 5 — Task prompt: the logic

> `js/research.js`: pure functions — filter, counts, risk placement, record
> building. No DOM.

**Files modified:** `js/research.js` (new)
**Decision:** the market filter does **not** quietly widen. Shein and Temu are
listed under Mexico because that is what their evidence is about, and clicking
"Global" does not sweep them in to make the global column look fuller.
**Commit:** `38ac949`

---

## Prompt 6 — Task prompt: the `/research` page

> The page: intake, competitor table with chips and search, five benchmark
> cards, the Mexico section, the risk map as a 3 × 3 grid, saved records.
> Route and rewrites, reachable before onboarding.

**Files modified:** `js/views.js`, `js/app.js`, `css/app.css`, `vercel.json`,
`serve.ps1`
**What the agent checked before committing:** 12 rows, 5 cards, 8 risks, 24
sources, no row without a source, no horizontal overflow; every chip count read
back from the dataset (substitute 3, Mexico 4, "resale" 2, cleared 12).
**Commit:** `c4f2626`

---

## Prompt 7 — Task prompt: the table and the widget

> `supabase/research_records.sql` with row level security and column grants
> keeping `notes` unreadable; save through the existing `SM.db`; a widget on the
> You screen.

**Files modified:** `supabase/research_records.sql` (new), `js/views.js`
**What did not need changing:** `js/db.js`. Week 1's database client took the
new table without a line of change, which is the only real test of whether last
week's boundary was in the right place.
**Commit:** `c0c14f3`

---

## Prompt 8 — Task prompt: the tests

> `docs/week-2/run-tests.ps1`: filter and search, saving a record, every source
> URL resolving, the security check, mobile — against the live site, with
> screenshots.

**Files modified:** `docs/week-2/run-tests.ps1` (new),
`docs/week-2/validation-conversation.md` (new)
**Decision:** test T1 compares the page against `SM.research.counts()` — what
the dataset says — rather than against numbers typed into the test. A test that
hard-codes "3 substitutes" passes happily after someone deletes a row.
**Commit:** `990add8`

---

## Prompt 9 — Supabase, and the conversation deferred

> Supabase is done, and for the question with a real human I'll ask you for help
> tomorrow or Friday because I'm done in for today.

**Human decision:** the validation conversation happens later in the week, with
a real person, rather than being faked or skipped.
**What the agent did:** resumed the paused project — the second pause in two
weeks — and carried on with everything that did not need the interview.
**Error found in its own work:** the substitute row "Asking a friend" cited the
validation conversation as its source *before the conversation had happened*.
On a page whose one rule is "no claim without a source", that was the worst
possible row to get wrong.
**Fix applied:** the row now reads "awaiting interview" in the source column and
carries no figure until someone has actually said something.
