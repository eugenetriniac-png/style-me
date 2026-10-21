# Build Discipline Packet — Week 4: Marketing Engine + Content System

**Student:** Eugène Triniac
**Project:** Style Me
**Required live page:** `/marketing` (plus the upgraded homepage at `/`)
**Live URL:** https://style-me-five.vercel.app/marketing
**Repository:** https://github.com/eugenetriniac-png/style-me
**Written:** 20 October 2026, before any Week 4 code

---

## 🧩 Problem

Three weeks in, Style Me can explain itself to a grader and to nobody else.
`/research` proves the problem is real, `/pricing` says who would pay — and the
first thing an actual visitor sees is a welcome screen written in week zero,
before any of that was known. It says "twelve questions that are barely about
clothes". It does not say what the product is for, who it is for, or why
anyone should believe it.

That gap is the week's problem, and it has two halves.

**The visitor's half.** Someone arriving from a link has about five seconds and
no context. Today they get a mood, not a proposition.

**My half.** Writing marketing for a product is where made-up numbers breed:
personas invented to be flattering, headlines chosen because the author likes
them, "engagement" claimed with nothing behind it. This project spent two weeks
building a habit of labelling what is sourced and what is guessed. Marketing is
the first place that habit is genuinely inconvenient — so it is the first real
test of whether the habit holds.

So: a marketing engine where the **persona is the person we actually
interviewed**, the proof points are the sourced figures already on `/research`,
and the only claim about which words work better is settled by **a real A/B
test with real counts**, however small those counts turn out to be.

## 👤 User

**The visitor.** A student in Mexico City, phone in hand, arriving from a
WhatsApp link or a classmate's screen. Five seconds to decide whether this is a
toy or something for them. They are the audience for the upgraded homepage.

**The persona behind the copy** is not invented: it is the person interviewed
on 24 September 2026, in his own words — *"relax et ample"*, buys second-hand,
*"mon vrai problème, c'est pas l'inspiration, c'est mon budget"*, walks away at
€150, *"j'ai la flemme"* about style apps. Every line of copy this week is
written at him, and the page says so.

**Me**, needing fourteen days of posts I can actually publish, and a way to
find out whether the headline I prefer is the one that works.

## 🎯 Success (this week only)

1. `/marketing` loads from the public Vercel URL
2. **The homepage is a landing page**: headline, subhead, three proof points
   each carrying its source, the three tiers, one call to action
3. **A brand system** rendered *from the live CSS variables*, so it cannot
   drift from the product it describes
4. **The persona**, quoted from the interview, with what each quote implies for
   the copy
5. **Landing-page copy, 10 social posts, 3 video scripts, a 14-day calendar** —
   each with a channel, a length, and a copy button that works
6. **A real A/B headline test**: a visitor is assigned a variant, the
   assignment sticks, impressions and conversions are recorded in Supabase, and
   the page shows the counts it actually has
7. **Saved marketing assets** in Supabase (`marketing_assets`), listed on
   `/marketing`
8. **2 A/B tests and 3 software tests**, green against the live site

## 🖼️ UX Concept

Wireframe of `/marketing` and the upgraded homepage — see
`docs/week-4/ux-mockup.png`.

**Implementation note.** Three decisions the wireframe settles:

- **The homepage keeps the figure and loses the mood.** The drawn model stays —
  it is the one thing no competitor's landing page has — but the copy beside it
  becomes a proposition with three sourced proof points under it.
- **Content cards carry their channel and their length.** A post that does not
  say "Instagram, 180 characters" is a note to self, not an asset. The copy
  button copies exactly what would be published, nothing else.
- **The A/B panel shows counts, not a winner.** Until the numbers are big
  enough to mean something, the page prints the sample size and the words "not
  enough data" rather than a green tick next to whichever variant is ahead.

The calendar is a 14-cell grid, not a timeline component. Fourteen days of
posts is a table.

## ✂️ Scope Cut

Deliberately not built this week:

- **Email capture and any mailing list.** Collecting addresses means handling
  personal data under the law cited on `/research`, for a list nobody would be
  sent anything from.
- **Analytics SDKs.** No Google Analytics, no Meta pixel. The A/B test records
  two event types in our own table and nothing else — which is also the only
  version of this I can honestly claim is privacy-respecting.
- **Generated images or video.** Three video *scripts*, not three videos.
- **Paid ads, UTM dashboards, SEO audits.** There is no budget and no traffic.
- **A winner declared from this week's data.** The test runs; the sample will
  be tiny; the page and the evidence will say so.
- **Spanish copy.** The site is in English. The posts are written in English
  with the Mexican references intact; a Spanish pass needs a native speaker.

## 🧱 Product Spec — Acceptance Criteria

| # | Requirement | Acceptance criteria |
|---|---|---|
| 1 | Routes | `/marketing` returns 200 and renders for a first-time visitor; the homepage renders the new landing page. Console clean on both |
| 2 | Brand system | Colours, type and spacing are read from `getComputedStyle(document.documentElement)` at render time, not retyped. Changing a CSS variable changes the swatch |
| 3 | Persona | Every persona claim is a quotation from the Week 2 interview or is marked as an inference drawn from it |
| 4 | Content | 10 social posts, 3 video scripts, landing copy and 14 calendar days, each with channel, length and a copy button that puts exactly the published text on the clipboard |
| 5 | A/B assignment | A visitor is assigned a variant once and keeps it across reloads; assignment is independent per experiment; over 10,000 simulated assignments each variant lands within 2 points of 50% |
| 6 | A/B recording | An impression is recorded once per visitor per experiment; a click on the call to action records a conversion; both reach `ab_events` |
| 7 | A/B reporting | The panel shows impressions, conversions and rate per variant, and says **"not enough data"** until each arm has at least 100 impressions |
| 8 | Saved assets | Saving writes one row to `marketing_assets`; the button locks; the row reads back field for field |
| 9 | Privacy | The visitor id is a random local string, never a name or an address; the free-text note on a saved asset is unreadable through the public key |

## 🏗️ Architecture

```
Browser — / (landing) and /marketing          (hash routes #/ and #/marketing)
│
├── js/marketing-data.js   persona (quoted) · landing copy · 10 posts ·
│                          3 scripts · 14-day calendar · experiments and
│                          their variants. No network.
│
├── js/brand.js            reads the live CSS custom properties and
│                          describes them: swatches, type scale, voice
│                          rules. Cannot drift from the stylesheet.
│
├── js/ab.js               assign(experiment) → variant, sticky per
│                          visitor; record(event); summarise(rows) →
│                          counts, rate, and "enough data" or not.
│                          Pure except for one localStorage read.
│
├── js/views.js  V.welcome   the upgraded landing page
│               V.marketing  brand · persona · content · calendar ·
│                            A/B panel · saved assets
│
└── js/db.js               insert / list → Supabase REST (unchanged, 4th week)
                                   │
                                   ▼
            Supabase — public.marketing_assets   (saved copy)
                       public.ab_events          (impressions, conversions)
            RLS on both · anon may INSERT listed columns · SELECT all but note
```

**Table `ab_events`**

| Column | Type | Note |
|---|---|---|
| `id` | uuid | primary key |
| `created_at` | timestamptz | default `now()` |
| `experiment` | text | `headline` · `cta` |
| `variant` | text | `a` · `b` |
| `event` | text | `impression` · `conversion` |
| `visitor` | text | a random 12-character local id, never personal |
| `surface` | text | which page recorded it |

**Table `marketing_assets`**

| Column | Type | Note |
|---|---|---|
| `id` | uuid | primary key |
| `created_at` | timestamptz | default `now()` |
| `kind` | text | `post` · `script` · `landing` · `calendar` |
| `channel` | text | instagram · tiktok · whatsapp · x · landing |
| `title` | text | ≤ 120 characters |
| `body` | text | the text as it would be published, ≤ 2000 characters |
| `variant` | text | which headline variant it was written for, or `none` |
| `note` | text | free text — insert only, never readable publicly |

## 🧰 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Pages and logic | Plain HTML, CSS, JavaScript | Same declared deviation as Week 0 |
| Brand system | `getComputedStyle` over the CSS variables | A brand page that retypes its own colours is wrong within a week |
| A/B assignment | A hashed random visitor id in `localStorage` | No cookies, no third party, no personal data |
| Event storage | Supabase, two new tables | Same client, fourth and fifth table |
| Copy buttons | `navigator.clipboard` with a textarea fallback | Works in the browsers this will be opened in |
| Hosting / repo | Vercel Hobby + GitHub | Deploys on push |
| Coding agent | Claude Code | Logged in `docs/week-4/prompt-log.md` |

## ⚙️ DevOps

- **GitHub** — `main`, one commit per step
- **Vercel** — `/marketing` added to the rewrites in `vercel.json` and to
  `serve.ps1`. That makes six rewritten paths
- **Supabase** — `supabase/marketing_assets.sql` and `supabase/ab_events.sql`,
  RLS on from the first second, column grants keeping `note` unreadable.
  `api/keepalive.js` gets the new tables added to its daily read — it currently
  names only the first two, which is a gap this week closes
- **Keys** — unchanged: publishable key in `js/config.js`, secret key nowhere

## 🧪 Test Plan

**Two A/B tests:**

| # | Test | Method | Expected |
|---|---|---|---|
| A1 | The assignment is fair, sticky and independent | 10,000 assignments per experiment in the browser, plus a reload check | Each variant within 2 points of 50%; the same visitor id always gets the same variant; the headline and CTA experiments do not correlate |
| A2 | The experiment runs end to end on the live site, and is read honestly | Visit `/` as a fresh visitor, record the impression, click the CTA, read the rows back from Supabase, then compute what the data supports | Both event types land with the right variant; the panel reports the real counts; with the sample this will have, the verdict printed is **"not enough data"**, and the evidence states the sample size a real decision would need |

**Three software tests:**

| # | Test | Expected |
|---|---|---|
| S1 | Both surfaces load, console clean; the brand swatches equal the live CSS variables | 200 on `/` and `/marketing`; every swatch hex equals `getComputedStyle` for its variable |
| S2 | Content is complete and copyable | 10 posts, 3 scripts, 14 calendar days, each with channel and length; a copy button puts the exact body text on the clipboard |
| S3 | Saving an asset, and the responsive sweep | One row per double click, read back field for field; no horizontal overflow at 375, 414, 600, 768, 900, 1280 px on both surfaces |

Plus the standing security check on both new tables.

## 🤖 Coding Agent Prompt

The exact implementation prompt given to Claude Code, written from this packet:

> Build the Week 4 marketing module for Style Me, following
> `docs/week-4/build-discipline-packet.md` and nothing beyond it. Plain
> JavaScript on the global `SM`, no framework, no npm, no CDN.
>
> 1. `js/marketing-data.js`: the persona quoted from
>    `docs/week-2/validation-conversation.md`, landing copy, 10 social posts,
>    3 video scripts, a 14-day calendar, and the two experiments with their
>    variants. Mark every persona line as `quote` or `inference`.
> 2. `js/brand.js`: read the CSS custom properties at render time and describe
>    them. No hex codes typed into this file.
> 3. `js/ab.js`: `assign`, `record`, `summarise`. Sticky per visitor,
>    independent per experiment, and `summarise` must refuse to name a winner
>    below 100 impressions per arm.
> 4. Upgrade the homepage into a landing page: headline from the experiment,
>    subhead, three sourced proof points, the tiers, one CTA that records a
>    conversion.
> 5. `/marketing`: brand system, persona, content cards with copy buttons, the
>    calendar, the A/B panel, saved assets.
> 6. `supabase/marketing_assets.sql` and `supabase/ab_events.sql`, plus the two
>    new tables added to `api/keepalive.js`.
> 7. `docs/week-4/run-tests.ps1`: A1, A2, S1, S2, S3 and the security check,
>    against the live site, with screenshots. Fill forms with values that are
>    not the defaults and read saved rows back field by field.
>
> One commit per step, in French, conventional prefix. Verify each step in the
> browser before committing and report what you checked.

Full log: `docs/week-4/prompt-log.md`
