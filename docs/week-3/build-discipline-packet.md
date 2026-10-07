# Build Discipline Packet — Week 3: Product Architecture + Pricing Simulator

**Student:** Eugène Triniac
**Project:** Style Me
**Required live pages:** `/product` and `/pricing`
**Live URLs:** https://style-me-five.vercel.app/product · https://style-me-five.vercel.app/pricing
**Repository:** https://github.com/eugenetriniac-png/style-me
**Written:** 6 October 2026, before any Week 3 code

---

## 🧩 Problem

Style Me has a product and, since last week, evidence. It has no idea who pays
for it.

That is not an abstract gap. Week 2's validation conversation closed one door
loudly: asked whether he wanted help choosing or just cheaper and faster
shopping, the person answered *"acheter moins cher et plus vite, 100 %"*, and
named €150 as the price at which he walks away from an outfit. A consumer
subscription priced at what the product costs to run would be a number invented
against the only direct evidence this project owns.

So the question this week is narrow and answerable: **if the person getting
dressed will not pay, who will, and how much does that have to be before the
thing is worth building?** The same research that closed the first door points
at the second: fashion is the most returned category in Mexican e-commerce at
**28% of all returns** (AMVO), and **19.3%** of online orders come back
anywhere (NRF). A returned garment is the same mistake the Style Core tries to
prevent, except a brand already measures it in pesos.

A pricing simulator is how that argument gets tested instead of asserted. Put
the assumptions on screen, label which ones are sourced and which ones are
guesses, and let anyone move the guesses and watch the business appear or
collapse.

## 👤 User

**Segment 1 — the person getting dressed.** 16 to 30, Mexico, phone first.
Minimum wage is MX$315.04 a day, MX$9,582 a month since January 2026, so a
MX$199 subscription is 2% of a minimum monthly wage for something they told us
they do not want. **Expected willingness to pay: near zero, by evidence, not by
assumption.** They are the reason the product exists and they are not the
customer.

**Segment 2 — the brand or marketplace.** Sells clothes online in Mexico, eats
the return rate, and pays for traffic that converts. They have a budget line
for "reduce returns" and another for "acquisition"; Style Me's claim fits both.
They are the customer.

Also reading this page: **me**, deciding whether this is a business or a
portfolio piece, and the grader, who should be able to move one slider and see
which assumption the whole thing rests on.

## 🎯 Success (this week only)

1. `/product` and `/pricing` both load from the public Vercel URL
2. **A feature map** on `/product`: every feature of Style Me, what it does,
   which tier it belongs to, which segment it serves, and whether it is **built
   today or planned** — no pretending
3. **Three tiers** and **two segments**, defined once in data and rendered on
   both pages, so the two pages cannot drift apart
4. **A revenue calculator**: inputs for both segments, monthly and annual
   revenue, gross margin where a tier has a human cost
5. **A scenario toggle** — conservative, base, optimistic — that moves the
   guesses and provably never moves a sourced number
6. **An assumptions table** where every row says whether it is *sourced*
   (with the link) or an *estimate* or a *guess*
7. **Saved scenarios** in Supabase (`pricing_scenarios`), listed on `/pricing`
8. **2 pricing-logic tests and 3 software tests**, all green against the live
   site

## 🖼️ UX Concept

Wireframe of both pages — see `docs/week-3/ux-mockup.png`.

**Implementation note.** Three things the wireframe settles:

- **The assumptions table is not an appendix, it sits under the calculator.**
  A number with no visible assumption is a sales pitch. Scrolling from the
  revenue figure to the reason for it must take one screen, not a click.
- **The tier cards are the same component on both pages.** `/product` shows
  what each tier *contains*; `/pricing` shows what each tier *costs*. One data
  file, two views — which is also acceptance criterion 3.
- **The scenario toggle sits with the calculator, not with the assumptions**,
  because it changes guesses, not facts, and the layout should say so before
  anyone reads the labels.

The calculator is sliders and number fields, no chart. A revenue line drawn
over three invented years would be the most confident-looking and least honest
thing on the page.

## ✂️ Scope Cut

Deliberately not built this week:

- **Payments.** No Stripe, no checkout, nothing that takes money. Pricing is a
  model this week, not a transaction.
- **Charts.** Numbers and a table. See above.
- **Cohorts, churn curves, CAC/LTV.** A student project with zero users
  modelling retention curves is arithmetic cosplay. One month, one year, and
  the assumptions visible.
- **Currency conversion.** Everything is stated in MXN with the source's own
  currency next to it where the source used USD or EUR. No live FX.
- **Editing or deleting saved scenarios.** Insert and read, as in Weeks 1 and 2.
- **A third segment** (resale marketplaces such as GoTrendier). The research
  says it is the most interesting one; two segments is what the week asks for
  and what I can defend.

## 🧱 Product Spec — Acceptance Criteria

| # | Requirement | Acceptance criteria |
|---|---|---|
| 1 | Routes | `/product` and `/pricing` both return 200 and render for a visitor who has never taken the style test. Console clean on both |
| 2 | Feature map | Every feature row carries a tier, a segment and a **built / planned** status; the built ones match what actually exists in the app today |
| 3 | One source of truth | The three tiers and two segments are defined once in `js/pricing-data.js`; both pages render from it. Changing a tier name in data changes both pages |
| 4 | Calculator | Inputs for both segments produce monthly revenue, annual revenue and gross margin; every output updates within one frame of an input changing |
| 5 | Scenario toggle | Conservative ≤ base ≤ optimistic for every output, and **no assumption marked `sourced` changes value between scenarios** |
| 6 | Assumptions table | Every row shows value, unit and kind (`sourced` · `estimate` · `guess`); every `sourced` row has a working link and a checked date |
| 7 | Saved scenario | Saving writes one row to `pricing_scenarios` with inputs **and** outputs; the button locks; the row reads back field for field as entered |
| 8 | Honest arithmetic | Zero users produces zero revenue; no input combination produces negative revenue; consumer + brand revenue equals total revenue to the peso |
| 9 | Privacy | The free-text note on a saved scenario is not readable through the public key |

## 🏗️ Architecture

```
Browser — /product and /pricing                 (hash routes #/product, #/pricing)
│
├── js/pricing-data.js    tiers (3) · segments (2) · feature map ·
│                         assumptions, each { value, unit, kind,
│                         source?, checked? } · scenario multipliers.
│                         One file, both pages. No network.
│
├── js/pricing.js         pure functions, no DOM:
│                           compute(inputs, scenario) → revenue by tier,
│                           segment, month, year, margin
│                           assumptionsFor(scenario)
│                           validate(inputs) · toRecord(inputs, result)
│                         This is what the two pricing-logic tests call.
│
├── js/views.js  V.product   feature map + tier cards (what you get)
│               V.pricing    tier cards (what it costs) + calculator +
│                            scenario toggle + assumptions + saved list
│
└── js/db.js              insert / list → Supabase REST (unchanged again)
                                   │
                                   ▼
                     Supabase — public.pricing_scenarios
                     RLS on · anon may INSERT listed columns
                           · anon may SELECT all but `note`
```

`db.js` is now carrying its third table without a change. If this week needs an
edit to it, that is a finding worth writing down.

**Table `pricing_scenarios`**

| Column | Type | Note |
|---|---|---|
| `id` | uuid | primary key |
| `created_at` | timestamptz | default `now()` |
| `label` | text | optional name, ≤ 60 characters |
| `scenario` | text | `conservative` · `base` · `optimistic` |
| `inputs` | jsonb | every calculator input as entered |
| `outputs` | jsonb | monthly, annual, by segment and tier |
| `mrr_mxn` | int | monthly revenue, so rows can be ordered and compared |
| `arr_mxn` | int | annual revenue |
| `assumptions_version` | text | which dataset produced it |
| `note` | text | free text — insert only, never readable publicly |

## 🧰 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Pages and logic | Plain HTML, CSS, JavaScript | Same declared deviation as Week 0 |
| Pricing engine | Hand-written pure functions | The arithmetic has to be testable from a console, which is exactly what the two logic tests do |
| Data | One JavaScript file | Tiers, segments and assumptions in one place is acceptance criterion 3 |
| Database | Supabase Free — same project | Third table, same client |
| Keeping it awake | `api/keepalive.js` + Vercel cron, from Week 2 | It worked: the project was still awake twelve days later, where it used to pause after seven |
| Hosting / repo | Vercel Hobby + GitHub | Deploys on push |
| Coding agent | Claude Code | Logged in `docs/week-3/prompt-log.md` |

## ⚙️ DevOps

- **GitHub** — `main`, one commit per step
- **Vercel** — `/product` and `/pricing` added to the rewrites in `vercel.json`
  and to `serve.ps1`, so local and production agree. That makes five rewritten
  paths; anything else is a hash route, which is a lesson from Week 2's tests
- **Supabase** — `supabase/pricing_scenarios.sql`, row level security on from
  the first second, column grants keeping `note` unreadable
- **Keys** — unchanged: publishable key in `js/config.js`, secret key nowhere

## 🧪 Test Plan

**Two pricing-logic tests** — pure arithmetic, run against `SM.pricing` with no
page involved:

| # | Test | Expected |
|---|---|---|
| L1 | One fixed input set, computed by hand first and written into the test | The engine matches the hand-computed peso figure exactly; annual equals monthly × 12 less the stated annual discount; consumer + brand equals total |
| L2 | Invariants across scenarios and edges | Conservative ≤ base ≤ optimistic on every output; **no `sourced` assumption differs between scenarios**; zero users gives zero revenue; negative or absurd inputs are clamped, never negative revenue |

**Three software tests** — against the live site:

| # | Test | Expected |
|---|---|---|
| S1 | Both pages load; the tier names, prices and segments on `/product` and `/pricing` come from the same data | 200 on both, console clean, the two pages agree on all three tiers |
| S2 | Fill the calculator with values that are **not** the defaults, save twice | One row; every field reads back as entered; it appears in the saved list after a reload |
| S3 | Responsive sweep at 375, 414, 600, 768, 900 and 1280 px, and every source link in the assumptions table answers | No horizontal overflow at any width; all source URLs < 400 |

Plus the standing security check: the publishable key cannot read `note`,
cannot `select=*`, cannot delete.

## 🤖 Coding Agent Prompt

The exact implementation prompt given to Claude Code, written from this packet:

> Build the Week 3 pricing module for Style Me, following
> `docs/week-3/build-discipline-packet.md` and nothing beyond it. Plain
> JavaScript on the global `SM`, no framework, no npm, no CDN.
>
> 1. `js/pricing-data.js`: three tiers, two segments, the feature map, the
>    assumptions and the scenario multipliers. Every assumption carries
>    `kind: 'sourced' | 'estimate' | 'guess'`, and every sourced one carries a
>    URL and a checked date. Reuse the Week 2 figures already verified.
> 2. `js/pricing.js`: pure functions — `compute(inputs, scenario)`,
>    `assumptionsFor(scenario)`, `validate(inputs)`, `toRecord(...)`. No DOM,
>    no rounding until the last step, and clamp inputs rather than trusting
>    them.
> 3. `/product`: the feature map with tier, segment and built/planned status,
>    plus the tier cards.
> 4. `/pricing`: tier cards, calculator, scenario toggle, assumptions table,
>    saved scenarios. Routes, `vercel.json` and `serve.ps1` rewrites, reachable
>    before onboarding.
> 5. `supabase/pricing_scenarios.sql`: table, RLS, column grants — `note`
>    insert-only.
> 6. Save through the existing `SM.db`, locking the button as the other pages
>    do.
> 7. `docs/week-3/run-tests.ps1`: the two logic tests and the three software
>    tests above, plus the security check, against the live site, with
>    screenshots. Fill forms with values that are not the defaults, and read
>    saved rows back field by field.
>
> One commit per step, in French, conventional prefix. Verify each step in the
> browser before committing and report what you checked.

Full log: `docs/week-3/prompt-log.md`
