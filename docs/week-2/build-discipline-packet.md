# Build Discipline Packet — Week 2: Research + Benchmarking Dashboard

**Student:** Eugène Triniac
**Project:** Style Me
**Required live page:** `/research`
**Live URL:** https://style-me-five.vercel.app/research
**Repository:** https://github.com/eugenetriniac-png/style-me
**Written:** 23 September 2026, before any Week 2 code

---

## 🧩 Problem

Style Me has a working product and no evidence. Week 0 built the shell, Week 1
built the Style Core — and every scope decision so far rests on one person's
intuition about what people need. Nothing in the project answers the two
questions any reader asks first: *who already does this, and where do they
stop?* Nothing answers the question this course's market asks: *what is
different in Mexico?*

That is a real cost, not a paperwork exercise. "People cannot name their own
taste" is either a problem worth building on or a sentence I made up. Ten
million people uploading their wardrobes to Whering says the first; a styling
service losing 7.9% of its clients in a year says the shape of the risk.
Without that on the record, the roadmap is taste, and a reader has no way to
tell a toy from a product.

This week builds the evidence into the product itself: a `/research` page that
holds competitors, benchmarks, the Mexican picture and the risks — every claim
carrying its source and the date it was checked — and lets a research question
be saved as a dated record, so a conclusion can be re-checked later instead of
being remembered fondly.

## 👤 User

Primary: **me, deciding what to build next.** The page exists to make me choose
against evidence rather than mood — which of the eight things the product could
do next is the one nobody else covers.

Second: **the reader who has to judge the project** — the grader this week, a
collaborator later. They land on a demo with no way to check whether it answers
a real gap. `/research` is that answer, in public, with sources they can click.

Third, and only later: a **partner or investor**, who asks for exactly this and
usually receives a slide with no citations.

## 🎯 Success (this week only)

1. `/research` loads from the public Vercel URL
2. **12 competitors and substitutes** in one table, filterable by type and
   market and searchable by text, every row carrying a source link and a
   *where it stops* column
3. **5 global benchmarks** as cards, each with a figure, its source, and the
   one thing Style Me should copy or avoid
4. A **Mexico** section: what is different here, sourced
5. A **risk map**: 8 risks placed by likelihood and impact, each with a
   mitigation
6. A research question can be **saved to Supabase** (`research_records`) and
   shows up on a **dashboard widget** on the You screen
7. **One real human validation conversation**, recorded with what it changed
8. Three software tests, one of them checking that every source link resolves

## 🖼️ UX Concept

Wireframe of `/research` — see `docs/week-2/ux-mockup.png`.

**Implementation note.** The wireframe settles three things:

- **The table is the page.** Benchmarks and risks are supporting material; the
  competitor table is what a reader came for, so it sits directly under the
  intake and takes the full width.
- **Filters are chips, not dropdowns.** Six type chips and three market chips
  read as a summary of the landscape even before anything is clicked — the
  counts are the finding.
- **Every row ends in a link.** The last column of every row is its source.
  A research page whose claims cannot be clicked is a blog post.

The risk map is a 3 × 3 grid rather than a scatter plot: with 8 risks, the grid
is honest about the precision I actually have, and needs no chart library.

## ✂️ Scope Cut

Deliberately not built this week:

- **Live competitor data.** No scraping, no pricing APIs. The dataset is
  static, dated, and carries the date each claim was checked. A page that
  silently re-fetches is a page that silently goes wrong.
- **Charts.** The risk map is CSS grid. A charting library for eight points is
  a dependency I would have to defend.
- **Editing or deleting saved records.** Insert and read only, as in Week 1.
- **More than one validation conversation.** The course asks for one; five
  would be better research and would not fit this week honestly.
- **Spanish.** The site is in English. The Mexican sources are in Spanish and
  are quoted as they are, with the figure in English next to them.
- **A "score" for each competitor.** Ranking eleven products on a made-up
  0–100 scale would look rigorous and mean nothing.

## 🧱 Product Spec — Acceptance Criteria

| # | Requirement | Acceptance criteria |
|---|---|---|
| 1 | Route | `/research` returns 200 and renders, for a visitor who has never taken the style test. Console clean |
| 2 | Competitor table | 12 rows, each with name, type, market, what it does, where it stops, a figure with its date, and a source link. Every row has a source |
| 3 | Filter and search | Type and market chips filter the table; the search box matches name, description and tags; the result count updates; "All" restores 12 rows |
| 4 | Benchmarks | 5 global cards, each with one figure, its source and the lesson for Style Me |
| 5 | Mexico | At least 5 sourced findings specific to Mexico, including one that contradicts a global assumption |
| 6 | Risk map | 8 risks on a likelihood × impact grid, each with a mitigation; clicking one opens its detail |
| 7 | Research record | The intake form saves one row to `research_records`; the button locks after success; a failure shows an inline error and keeps the form |
| 8 | Dashboard widget | The You screen shows the number of saved research records and the latest question, read from Supabase |
| 9 | Sources hold | Every source URL in the dataset resolves (HTTP < 400) when the test script runs |
| 10 | Privacy | Notes typed into the intake are not readable through the public key |

## 🏗️ Architecture

```
Browser — /research                                  (hash route #/research)
│
├── js/research-data.js     the dataset: 12 competitors, 5 benchmarks,
│                           5 Mexico findings, 8 risks — each with
│                           { claim, figure, source, checked } . No network.
│
├── js/research.js          filter + search + counts, risk placement,
│                           record building  (pure functions, testable)
│
├── js/views.js  V.research intake · table · benchmark cards · Mexico ·
│                           risk map · saved records
│
├── js/views.js  V.me       dashboard widget: count + latest question
│
└── js/db.js                insert / list  →  Supabase REST (unchanged)
                                   │
                                   ▼
                     Supabase — public.research_records
                     RLS on · anon may INSERT listed columns
                           · anon may SELECT every column except notes
```

Same shape as Week 1 on purpose: `db.js` did not need a line changed, which is
the test of whether last week's boundary was in the right place.

**Table `research_records`**

| Column | Type | Note |
|---|---|---|
| `id` | uuid | primary key |
| `created_at` | timestamptz | default `now()` |
| `question` | text | the research question, 10–200 characters |
| `assumption` | text | what I believe, 10–300 characters |
| `falsifier` | text | what would prove me wrong, 10–300 characters |
| `market` | text | `global` · `mexico` · `both` |
| `competitor_ids` | jsonb | the rows considered when the record was saved |
| `risk_ids` | jsonb | the risks judged top priority |
| `verdict` | text | `real` · `partly` · `not-proven` |
| `notes` | text | free text — insert only, never readable publicly |
| `source_count` | int | how many sources the page carried that day |

## 🧰 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Page and logic | Plain HTML, CSS, JavaScript | Same declared deviation as Week 0 |
| Dataset | A JavaScript file of records | The research *is* data; keeping it in code means it is versioned, reviewable in a diff, and testable |
| Filtering | Hand-written, `Array.filter` | Twelve rows |
| Risk map | CSS grid | See scope cut |
| Database | Supabase Free — Postgres + REST | Same project and client as Week 1 |
| Research | Real web sources, cited | The point of the week |
| Hosting / repo | Vercel Hobby + GitHub | Deploys on push |
| Coding agent | Claude Code | Logged in `docs/week-2/prompt-log.md` |

## ⚙️ DevOps

- **GitHub** — `main`, one commit per step
- **Vercel** — `/research` added to the rewrites in `vercel.json`, and to
  `serve.ps1` so local and production agree
- **Supabase** — `supabase/research_records.sql`, row level security on from
  the first second, column grants keeping `notes` unreadable to the public key.
  The free project pauses after a week idle: it paused between Week 1 and
  today, and was resumed from the dashboard before any work
- **Keys** — unchanged: the publishable key stays in `js/config.js`, the secret
  key exists nowhere in the repository

## 🧪 Test Plan

| # | Test | Method | Expected |
|---|---|---|---|
| T1 | Filter and search | Scripted, live: click each type chip, then search "mexico", then clear | Counts match the dataset; "All" returns 12; no row without a source |
| T2 | Save a record | Scripted, live: fill the intake, click Save twice | Exactly one new row in `research_records`; the widget count rises by one after reload |
| T3 | Sources resolve | Scripted: HTTP request to every source URL in the dataset | Every URL returns < 400 |
| S1 | Security | Request `notes` and `select=*` with the publishable key | Refused |
| H1 | **Human validation conversation** | 15–20 minutes with a real person in the target segment, from a written script, notes taken during the call | At least one belief changed or confirmed with a quote, written up with what it changed |

## 🤖 Coding Agent Prompt

The exact implementation prompt given to Claude Code, written from this packet:

> Build the Week 2 research module for Style Me, following
> `docs/week-2/build-discipline-packet.md` and nothing beyond it. Plain
> JavaScript on the global `SM`, no framework, no npm, no CDN.
>
> 1. `js/research-data.js`: the dataset — 12 competitors and substitutes, 5
>    global benchmarks, 5 Mexico findings, 8 risks. Every record carries
>    `source` (a URL), `sourceName` and `checked` (a date). No claim without
>    one. Do not invent a figure: if the number cannot be sourced, leave it out.
> 2. `js/research.js`: pure functions — `filter(query, type, market)`,
>    `counts()`, `riskCell(risk)`, `toRecord(form)`. No DOM.
> 3. `/research` page: intake form, competitor table with chips and a search
>    box, five benchmark cards, the Mexico section, the risk map as a 3 × 3
>    grid, and the saved records list. Route, `vercel.json` and `serve.ps1`
>    rewrites, reachable before onboarding.
> 4. `supabase/research_records.sql`: table, RLS, column grants — `notes`
>    insert-only.
> 5. Save through the existing `SM.db`, locking the button as `/core` does.
> 6. A widget on the You screen: number of saved records and the latest
>    question.
> 7. `docs/week-2/run-tests.ps1`: the three tests above plus the security
>    check, against the live site, with screenshots.
>
> One commit per step, in French, conventional prefix. Verify each step in the
> browser before committing and report what you checked.

Full log: `docs/week-2/prompt-log.md`
