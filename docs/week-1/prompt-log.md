# Coding Agent Prompt Log — Week 1

**Agent used:** Claude Code (Opus 5)
**Date:** 10 September 2026

My prompts were typed in French; they are translated here, as literally as
possible. Entries marked **task prompt** are the steps of the implementation
prompt in the Build Discipline Packet, each executed and committed separately
after I told the agent to go.

---

## Prompt 1 — Reading the assignment

> I think I have to do this for tonight, so I don't have much time left. You
> know, it's about the Style Me project, I've already worked on it with you. I
> think this is what I have to do — we agree it's not the same as what I handed
> in last time. Explain clearly what I have to do, then I'll ask you to help me.

**Files attached:** the four Week 1 course files (overview, assignment, rubric,
macro-prompts).
**Files modified:** none — planning only.
**What the agent did:** confirmed that Week 1 is a different assignment from
Week 0 — a working feature on `/core` backed by a real Supabase table, not
infrastructure — and mapped the generic "generative core" brief onto Style Me:
the ten-axis style method becomes a standalone module, free text in, structured
Style Core out.
**What I learned:** the Supabase project I created in Week 0 and deliberately
left empty is exactly what this week needs wired up.

---

## Prompt 2 — Delegation

> If I authorise you, can you sort of take control of my computer and do
> everything on your own? I want to test your skills.

**Files modified:** none.
**What the agent did:** checked that it could actually push (Git credential
manager configured, Vercel deploying on push) before answering, then separated
what it could do alone from what it would not do for me: typing my Supabase
password, recording the demo video, and submitting the assignment.
**Human decision:** I keep the human decision note, the video and the
submission.

---

## Prompt 3 — Go

> go

**Files modified:** `docs/week-1/build-discipline-packet.md`,
`docs/week-1/ux-mockup.html`, `docs/week-1/ux-mockup.png`,
`docs/week-1/prompt-log.md`
**What the agent did:** wrote the Build Discipline Packet first and committed it
before any code, because the rubric's first gate is a plan that exists before
the build. Drew the `/core` wireframe as HTML and rendered it to PNG with
headless Edge — this machine has no image tools, and a wireframe is explicitly
allowed.
**Decisions taken in the packet:** rules instead of a paid model, labelled as
simulated on the card itself; `fetch` against Supabase's REST endpoint instead
of a client library; the raw description made unreadable to the public key.
**Commit:** `9f4df8a` — pushed before any Week 1 code.

---

## Prompt 4 — Task prompt: the extraction engine

> Write `js/core.js`: a deterministic extractor that maps vocabulary cues to
> the ten existing axes, handles simple negation, adds a small occasion prior,
> refuses to guess when no cue is found, and reuses `SM.archetype`,
> `SM.explorationAxes` and `SM.stylist.build` with the budget as a filter.

**Files modified:** `js/core.js` (new), `index.html`, `build.ps1`
**What the agent did:** 93 cues over the ten axes. Before running anything it
fixed four false positives it could predict from reading the cues: *"how I
dress"* counted as a dress, *"it suits me"* as tailoring, *"t-shirt"* as a
shirt, *"I check my phone"* as a checked print.
**Error encountered:** tested in the browser console, a €150 budget produced a
€340 outfit. Cause: the Week 0 outfit builder treats a budget as a preference —
when nothing in a category is cheap enough, it falls back to the whole
category, price ignored. The catalogue does allow a complete outfit at €138, so
this was a bug, not a limit.
**Fix applied:** a repair pass in `core.js` — drop the outerwear and accessories
first, bring each essential down until the total fits, then spend what is left
on the best-matching piece. Verified on 72 combinations (6 texts × 4 occasions ×
3 budgets): none over budget, all complete, all deterministic.
**What was rejected:** fixing the builder itself. The feed uses it too, and
every outfit already seeded for every user would have changed under them. The
feed has the same budget weakness; it is logged as follow-up work, not
smuggled into this week.
**Commit:** `2800ac4`

---

## Prompt 5 — Task prompt: the `/core` page

> Add a `/core` page: a hash route `#/core`, a `/core` rewrite in `vercel.json`
> and in `serve.ps1`, reachable before onboarding, with a row in the You menu.
> Build the intake form. Render the result as one card, labelled "Simulated
> agent — rule-based, no language model".

**Files modified:** `js/views.js`, `js/app.js`, `css/app.css`, `vercel.json`,
`serve.ps1`
**Error encountered:** at 1280 px, "Black Minimalism" ran under the figure. The
column beside the figure is 312 px wide.
**Fix applied:** a smaller title at that breakpoint — then every one of the 24
archetype names was put into the title in turn and measured, rather than
checking the one that happened to be on screen. None overflows, at 1280 px or
at 375 px.
**Commit:** `44f81b1` — pushed; first deployment of `/core`, which returned 200.

---

## Prompt 6 — Task prompt: Supabase save and dashboard

> Write `js/db.js`: insert and list against the Supabase REST endpoint with
> `fetch`, configured from `js/config.js`. Save must be idempotent from the UI.
> Put the table SQL, with row level security and column grants that keep
> `input_text` unreadable to the public key, in `supabase/core_outputs.sql`.
> Add the dashboard preview.

**Files modified:** `js/db.js` (new), `js/config.js` (new),
`supabase/core_outputs.sql` (new), `js/views.js`, `css/app.css`
**What the agent did:** the Save button locks on the first click and stays
locked once the row exists. The dashboard only ever shows what the database
returns. With no configuration, both say so instead of failing — checked
before any key existed.
**Decision:** row level security decides *which rows*; column grants decide
*which columns*. The public key may insert, and may read every column except
the free text. No update, no delete.
**Commit:** `946d2d9`

---

## Prompt 7 — Task prompt: the prompt library

> Add a Prompt library section to `/docs` and `docs/prompt-library.md`.

**Files modified:** `js/core.js`, `js/views.js`, `css/app.css`,
`docs/prompt-library.md` (new)
**What the agent did:** put the prompt in `js/core.js`, next to the rules that
carry it out, and rendered `/docs` from that constant, so the page cannot
drift from the code.
**Error encountered:** the prompt had hard line breaks at 95 characters; in the
narrower column on `/docs` every line wrapped a second time.
**Fix applied:** one line per paragraph; the page does the wrapping.
**Commit:** `8af46a4` — pushed; second deployment.

---

## Prompt 8 — The database step

The agent had asked me to run the table SQL in the Supabase SQL editor and
paste back the project URL and the publishable key.

> I can't do the SQL, the second step. Do as much as you can on your own.

**Files modified:** `js/config.js`
**What the agent did:** Chrome was not connected to it, so it opened the
Supabase dashboard in the desktop app's own browser, where I was already signed
in. The project turned out to be **paused** — free projects pause after a week
without activity — which I did not know. It resumed it (free, no plan change;
it did not touch "Upgrade to Pro"), ran `supabase/core_outputs.sql`, and read
the **publishable** key only. Before committing the key it tested it against
the REST endpoint: reading `input_text`, `select *`, `PATCH` and `DELETE` were
all refused with `permission denied`. Then a local smoke test: Save clicked
twice made one row, read back by the dashboard.
**Human decision:** I delegated the SQL step and the account actions it needed.
**Commit:** `0dab866` — pushed; fourth deployment.

---

## Prompt 9 — Task prompt: the three self-tests, live

> Test plan from the packet: the full loop on the live site, extraction quality
> with a negated cue and a second identical run, and the edges — too short, no
> signal, a €150 budget. Plus the security check from the browser.

**Files modified:** `docs/week-1/run-tests.ps1` (new)
**What the agent did:** scripted the tests so they can be re-run identically:
headless Edge driven over the DevTools protocol from PowerShell, a fresh
profile each run, the live site, the real database. Round 1: every check
passed.
**Error encountered:** the agent then read the screenshots and found the card
contradicting itself — *"left out: colour"* above a green cardigan and a blue
shirt; *"a leather jacket, heavy boots"* answered with a beige trench. The test
had checked the axes, never the clothes.
**Fix applied:** the test first — it now checks the outfit, and it was run
against the unfixed live site to confirm it fails (3 and 4 pieces outside the
colour rule, no Doc Martens, no leather jacket). Then the engine: named pieces
go in, refusals come out, the budget holds, and the card names what the budget
overruled. A 208-combination local battery found two more defects in the
budget pass before anything was deployed.
**Commit:** `1cf3db5` — pushed; fifth deployment. Round 2: every check passed,
including the new ones, and the screenshots show it.
**What I learned:** the same lesson as Week 0, one level deeper. An automated
test is only as good as the question it asks.

---

## Prompt 10 — Evidence and the submission file

> (continuation of prompt 8: do as much as you can on your own)

**Files modified:** `docs/week-1/supabase-evidence.md`,
`docs/week-1/test-evidence.md`, `docs/week-1/human-decision-note.md`,
`docs/week-1/make-submission.ps1`, `.gitignore`
**What the agent did:** ran two read-only queries in the Supabase SQL editor —
the rows themselves, and the security state (row level security on, no
table-level grant for the public role, `input_text` missing from what it may
read) — and wrote them up verbatim. Built the PDF from the markdown with
headless Edge, commits and deployments read live from `git log` and the GitHub
API so the PDF cannot claim more than happened.
**Left to me:** the human decision note is a draft I have to make my own; the
demo video; submitting.
