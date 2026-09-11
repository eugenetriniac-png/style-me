# Build Discipline Packet — Week 1: Generative Core Agent

**Student:** Eugène Triniac
**Project:** Style Me
**Required live page:** `/core`
**Live URL:** https://style-me-five.vercel.app/core
**Repository:** https://github.com/eugenetriniac-png/style-me
**Written:** 10 September 2026, before any Week 1 code

---

## 🧩 Problem

Style Me already has a method: read someone's taste from indirect signals, place
it on ten style axes, name the result, and dress it. In Week 0 that method only
existed inside the twelve-question test — one fixed input, and a result that
lived and died in a single browser's `localStorage`.

Two problems follow. People do not describe their taste as multiple-choice
answers; they say *"mostly black, oversized, I live in my Doc Martens"*, and the
product cannot hear that. And a result that is never stored cannot be looked at
again, compared, or used to check whether the ten axes are the right ten.

This week turns the method into a standalone module: **free text in, a
structured Style Core out, saved to a database, visible on a dashboard.**

## 👤 User

Primary: the same person as Week 0 — 16 to 30, cares how they dress, can tell
when an outfit works but not why. The difference this week: this user *can*
describe what they like in a sentence, they just cannot name it. The Core gives
them the name.

Secondary: me, as the builder. The dashboard shows which archetypes real inputs
land on. If everyone comes out "Black Minimalism", the axes are wrong, and I
want to find that out from data rather than from a feeling.

## 🎯 Success (this week only)

1. `/core` loads from the public Vercel URL
2. Writing a description and pressing Generate produces a Style Core card
   instantly, with no network call
3. Save writes exactly one row to the Supabase table `core_outputs`, visible in
   the Supabase table editor
4. The dashboard lists that row after a page reload — read back from Supabase,
   not from `localStorage`
5. The extraction prompt is documented in the prompt library on `/docs` and in
   `docs/prompt-library.md`
6. Three test runs are recorded, each one saved to Supabase

## 🖼️ UX Concept

Wireframe of `/core` — see `docs/week-1/ux-mockup.png`.

**Implementation note.** Three decisions come out of the wireframe:

- **The card is the product.** The output card takes the most space, and the
  Save button lives *on* the card, not under the form. You save a result, not a
  form.
- **Two columns on desktop, one on mobile.** Form on the left, card on the right,
  so a user can change a word and watch the card change. On a phone the card
  drops under the form.
- **The dashboard sits below both,** as a horizontal strip of saved cores with a
  total count. It is a preview, not a full admin screen.

The card also carries a visible **"Simulated agent — rule-based, no language
model"** label. The course requires simulated AI output to be labelled; putting
the label on the card itself, rather than in the docs, means nobody can
screenshot a result without it.

## ✂️ Scope Cut

Looked good, deliberately not built this week:

- **A real language model call.** The hook exists (`SM.ai`) and the server
  function already keeps a key out of the browser, but it is a paid API and the
  course says free tools only. Extraction runs on rules. The prompt a model
  *would* receive is written anyway and lives in the prompt library, so the
  swap later is one function, not a redesign.
- **Accounts and ownership of saved rows.** No login, so saved cores are
  anonymous. No edit, no delete.
- **Feeding the Core back into the feed.** The Core does not overwrite the
  profile from the twelve-question test. Merging two profiles is a design
  question of its own.
- **Languages other than English.** The site is in English; the vocabulary is
  English.
- **A testing panel inside the product.** Test evidence belongs in the
  submission, not in a user-facing screen.

## 🧱 Product Spec — Acceptance Criteria

| # | Requirement | Acceptance criteria |
|---|---|---|
| 1 | Route | Typing `/core` in the address bar shows the Style Core screen, whether or not the visitor has taken the test. Also reachable from the You menu. Console clean |
| 2 | Intake form | Description (20–1200 characters), occasion (4 choices), budget (4 choices), optional name (≤ 40 characters). Fewer than 20 characters shows an inline message and generates nothing |
| 3 | Extraction | Rule-based and deterministic: the same input gives the same card twice. A negated cue (*"never any colour"*) lowers its axis instead of raising it. Input with no recognised cue says so, instead of falling back to a default archetype |
| 4 | Output card | Archetype and its line, top three axes with scores, the signals that were read (with their polarity), a one-paragraph thesis, key pieces drawn as an outfit with credits, two directions worth exploring, a confidence level, and the "Simulated agent" label. With a budget set, the outfit total never exceeds it |
| 5 | Save | One click writes one row to `core_outputs`. The button locks after success, so a double click cannot create a duplicate. On failure, an inline error, and the card stays on screen |
| 6 | Dashboard preview | Total count plus the five most recent cores, read from Supabase. After a reload, a core saved a moment ago is first in the list. Loading, empty and error states all exist |
| 7 | Prompt library | `/docs` has a Prompt library section with the Core prompt, its inputs and its output shape. Same text in `docs/prompt-library.md` |
| 8 | Privacy | The raw description is never readable through the public key: requesting `input_text` with it is refused by the database |

## 🏗️ Architecture

```
Browser — /core                                   (hash route #/core)
│
├── intake form ─────► SM.core.extract(input)            js/core.js
│                      ├─ vocabulary cues → 10 axes       new: ~150 cues, with negation
│                      ├─ occasion → small prior          new
│                      ├─ SM.archetype, explorationAxes   profile.js, reused as is
│                      └─ SM.stylist.build(axes, budget)  stylist.js, reused as is
│
├── Style Core object ─► output card                     js/views.js  V.core
│                         outfit drawn by SM.fit.render   fit.js, reused as is
│
├── Save ────────────► SM.db.insert('core_outputs', row)  js/db.js
└── Dashboard ◄──────── SM.db.list('core_outputs', …)     js/db.js
                                   │
                                   │  HTTPS · fetch · publishable key (js/config.js)
                                   ▼
                     Supabase — Postgres, REST (PostgREST)
                     table public.core_outputs
                     RLS on · anon may INSERT listed columns
                           · anon may SELECT every column except input_text
```

**Table `core_outputs`**

| Column | Type | Note |
|---|---|---|
| `id` | uuid | primary key, generated |
| `created_at` | timestamptz | default `now()` |
| `label` | text | optional name, ≤ 40 characters |
| `input_text` | text | 20–1200 characters — insert only, never readable publicly |
| `occasion` | text | `everyday` · `work` · `night` · `weekend` |
| `budget` | int | euros, `null` for no limit |
| `archetype` | text | e.g. "Archive Street" |
| `axes` | jsonb | all ten axes, 0–100 |
| `top_axes` | jsonb | the three strongest |
| `signals` | jsonb | the cues that were read, with polarity |
| `thesis` | text | the generated paragraph |
| `key_pieces` | jsonb | item ids, names, brands, prices |
| `confidence` | text | `low` · `medium` · `high` |
| `engine` | text | `rules-v1` — so a future model-generated row is distinguishable |

The SQL lives in `supabase/core_outputs.sql`, so the table can be rebuilt from
the repository alone.

## 🧰 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Page and logic | Plain HTML, CSS, JavaScript | Same deviation as Week 0, declared there: the renderer is a live SVG tree a framework would fight |
| Extraction | Hand-written rules in `js/core.js` | Free, instant, deterministic — so it can be tested. Labelled as simulated |
| Outfit for the card | Existing `SM.stylist` + `SM.fit` | The Core reuses the Week 0 engine instead of inventing a second one |
| Database | Supabase Free — Postgres + REST | Required this week; free tier is ample |
| Database client | `fetch` against the REST endpoint | No bundler here, and two calls (insert, select) do not justify a 100 KB client library from a CDN |
| Hosting | Vercel Hobby | Deploys on every push to `main` |
| Repo | GitHub | Public; the commit history is part of the evidence |
| Coding agent | Claude Code | Logged in `docs/week-1/prompt-log.md` |

## ⚙️ DevOps

- **GitHub** — `main`, direct commits, one commit per coherent step
- **Vercel** — every push deploys. `vercel.json` gains a rewrite so `/core`
  serves `index.html`, the same way `/docs` already does
- **Supabase** — table created from `supabase/core_outputs.sql` in the SQL
  editor; row level security on from the first second, never "on later"
- **Keys.** The Supabase URL and the **publishable** key sit in `js/config.js`,
  committed on purpose. This is a static site with no build step, so there is no
  moment at which an environment variable could be injected into the browser —
  and the publishable key is designed to be public. The protection is in the
  database: row level security plus column grants decide what that key can do.
  The **secret / service-role key never enters the repository**, the browser or
  Vercel. It is not needed for anything this week.
- **Local check** — `serve.ps1` learns the same rewrite as Vercel, so `/core`
  can be tested locally before any push

## 🧪 Test Plan

| # | Test | Input | Expected result |
|---|---|---|---|
| 1 | Full loop, live | A real description, Save, then reload | Card appears; one new row in the Supabase table editor; the row is first in the dashboard after reload |
| 2 | Extraction quality | *"I never wear colour. Black and grey, a leather jacket, heavy boots."* — run twice | Colour is not in the top three and appears as a negative signal; Edgy leads; both runs are identical |
| 3 | Edges | 10 characters · 40 characters of nonsense · a real description with a €150 budget | Inline length message · "not enough to go on" · outfit total ≤ €150 |

Plus one security check, from the browser console: request `input_text` with the
publishable key and confirm the database refuses it.

Method: the deployed site in a browser; Network tab for status codes; the
Supabase table editor for the rows themselves.

## 🤖 Coding Agent Prompt

The exact implementation prompt given to Claude Code, written from this packet:

> Implement the Week 1 Style Core module in my Style Me project, following
> `docs/week-1/build-discipline-packet.md` and nothing beyond it. Plain
> JavaScript on the existing global `SM`, no framework, no npm, no CDN library.
>
> 1. Add a `/core` page: a hash route `#/core`, a `/core` rewrite in
>    `vercel.json` and in `serve.ps1`, reachable before onboarding, with a row in
>    the You menu.
> 2. Build the intake form: description (20–1200 characters), occasion, budget,
>    optional name. Validate inline.
> 3. Write `js/core.js`: a deterministic extractor that maps vocabulary cues to
>    the ten existing axes, handles simple negation, adds a small occasion prior,
>    refuses to guess when no cue is found, and reuses `SM.archetype`,
>    `SM.explorationAxes` and `SM.stylist.build` with the budget as a filter.
> 4. Render the result as one card, labelled "Simulated agent — rule-based, no
>    language model".
> 5. Write `js/db.js`: insert and list against the Supabase REST endpoint with
>    `fetch`, configured from `js/config.js`. Save must be idempotent from the
>    UI. Put the table SQL, with row level security and column grants that keep
>    `input_text` unreadable to the public key, in `supabase/core_outputs.sql`.
> 6. Add the dashboard preview: count plus the five latest, with loading, empty
>    and error states.
> 7. Add a Prompt library section to `/docs` and `docs/prompt-library.md`.
>
> One commit per step. Do not touch the renderer. Verify each step in the
> browser before committing, and report what you checked.

Full log: `docs/week-1/prompt-log.md`
