STYLE ME — WEEK 0 SUBMISSION PACKET
Eugene Triniac

Live site : https://style-me-five.vercel.app
Repository: https://github.com/eugenetriniac-png/style-me
Demo video: not submitted

Evidence: 10 commits, 5 Vercel deployments, 1 Supabase project.


==================================================

# Build Discipline Packet — Week 0: Setup Sprint

**Student:** Eugène Triniac
**Project:** Style Me
**Required live page:** `/`
**Live URL:** https://style-me-five.vercel.app
**Repository:** https://github.com/eugenetriniac-png/style-me

---

## 🧩 Problem

Most people do not lack clothes — they lack a sense of what actually suits
them. Shopping sites answer "what is popular" or "what is similar to this
item", never "what is like *you*". The result is a wardrobe assembled from
single good-looking pieces that never combine into a look.

Style Me attacks the layer underneath shopping: helping someone name their own
taste, then showing complete outfits that follow from it.

## 👤 User

A person roughly 16 to 30 who cares about how they dress but cannot articulate
a direction. They can tell when an outfit works, and cannot say why. They are
not a fashion insider and will not read a style guide.

Secondary user, later: a brand that wants to reach people whose taste actually
matches its catalogue.

## 🎯 Success (this week only)

This week is infrastructure, not product features. It succeeds if:

1. `/` loads from a public Vercel URL, for anyone, on any machine
2. The code lives in a public GitHub repo with a readable history
3. A Supabase project exists, ready for the data layer
4. Navigation and a `/docs` page exist
5. The README lets a stranger run the project locally

## 🖼️ UX Concept

Image-generated mockup of the homepage — see `docs/ux-mockup.png`.

**Implementation note.** The mockup confirms three decisions and overturns none:
the dark ground, the oversized display type, and a single figure held to the
right of the headline. Its three-column band — *take the test / outfit feed /
saved outfits* — maps onto screens that already exist, so it validates the
information architecture rather than proposing a new one.

Two things carry over into the build:

- The mockup states **"12-question style test · takes 3 minutes"** before the
  button. The live homepage names the test but never says how long it takes.
  That is a cheap, real improvement and it is going into this week's build.
- The figure in the mockup is rendered at a larger scale and bleeds off the
  right edge. The live page already does this; the mockup confirms it reads as
  intentional rather than broken.

**What I rejected.** The generator renamed the product **"STYLEFIND"** in the
header. I kept **Style Me**. The name is the one thing in this project that is
mine, the whole product is about naming your own taste rather than being handed
someone else's, and a tool inventing a new brand mid-mockup is precisely the
kind of silent drift I am supposed to catch. I took the layout and left the
name.

I also did not adopt the mockup's **"Sign in"** button. Accounts are an explicit
scope cut this week — see below — and shipping a button that leads nowhere is
worse than not shipping it.

## ✂️ Scope Cut

Cut this week, deliberately:

- **Supabase read/write** — the project is created, but nothing is stored in it
  yet. State stays in `localStorage`. Wiring a database before the shape of the
  data is settled would mean migrating it twice.
- **Real product photography** — the `images` field already exists on every
  item, so photographs can be dropped in later without touching the renderer.
- **Accounts** — no login this week. There is nothing to protect yet.

## 🧱 Product Spec — Acceptance Criteria

| # | Requirement | Acceptance criteria |
|---|---|---|
| 1 | Homepage loads live | `GET /` returns 200 on the Vercel domain; CSS and every JS file return 200 |
| 2 | Renderer runs in production | The SVG figure is drawn on load; the browser console shows no errors |
| 3 | Navigation | Every nav item routes to its screen without a full page reload |
| 4 | Docs page | `/docs` exists and states what is real and what is simulated |
| 5 | Roadmap | A visible list of what is built and what comes next |
| 6 | Repo history | At least 5 commits, each touching one coherent layer |
| 7 | Deployment | At least 2 Vercel deployments, the latest one green |
| 8 | README | A stranger can serve the project locally from it alone |

## 🏗️ Architecture

```
Browser
├── index.html            shell, defines script load order
├── css/app.css           entire stylesheet
└── js/  (one global SM, no ES modules)
    ├── materials.js      fabric tiles generated once on canvas
    ├── figure.js         eight-head skeleton, body, face, hair
    ├── garment.js        product shots
    ├── fit.js            garments fitted to the figure, 5 layers
    ├── data.js           catalogue, brands, demo community
    ├── profile.js        12 questions, scoring, archetypes
    ├── stylist.js        outfit engine + SM.ai hook
    ├── store.js          state + localStorage persistence
    ├── ui.js / views.js  components and screens
    └── app.js            routing and start-up

Data flow
  quiz answers → profile.js → 10 style axes
              → stylist.js  → outfit (affinity + cohesion + harmony)
              → fit.js      → layered SVG on the figure
              → store.js    → localStorage

Server (present, not yet used in production)
  server/api/stylist.js    holds ANTHROPIC_API_KEY, the browser never sees it
  server/api/tryon.js      holds REPLICATE_API_TOKEN

Planned: Supabase replaces localStorage for saved outfits and test records.
```

Nothing leaves the browser today — not the quiz answers, not the photos.

## 🧰 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Markup / logic | Plain HTML, CSS, JavaScript | See the deviation note below |
| Rendering | Hand-written SVG + canvas | Swapping one garment must not redraw the others |
| Hosting | Vercel Hobby | Free, deploys on every push, provides the live URL |
| Repo | GitHub | Free, public; the commit history is the course evidence |
| Database | Supabase Free | Created this week, wired up in a later module |
| Dev server | `serve.ps1` (PowerShell) | This machine has no Node and no Python |
| Bundler | `build.ps1` (PowerShell) | Produces the offline single-file build |
| Coding agent | Claude Code | Required by the course; logged in `docs/prompt-log.md` |

**Deviation from the course stack — declared, not accidental.** The course asks
for Next.js and Tailwind. Style Me uses neither, for one reason: the product's
core promise is replacing a single garment without the rest of the silhouette
moving. That is a direct DOM operation on a live SVG tree —
`SM.fit.updateLayer` rewrites exactly one of five groups and leaves the other
four nodes untouched. A framework that re-renders from state would fight that,
and Tailwind utility classes cannot express canvas-generated fabric patterns.
The cost is that I get no routing or build tooling for free. I judged that a
fair trade, and I own the consequences.

## ⚙️ DevOps

- **GitHub** — `main`, direct commits, no branches; solo project this week
- **Vercel** — connected to the repo; every push to `main` deploys automatically
- **Build** — none. Static files served as-is (Framework Preset: Other)
- **Environment variables** — none in production yet. When the server endpoints
  go live, `ANTHROPIC_API_KEY` and `REPLICATE_API_TOKEN` will be set in the
  Vercel dashboard only. `server/.env.example` documents their names, never
  their values. `.gitignore` excludes every `.env` file.
- **Secrets check** — run before the first push: no key is hardcoded anywhere;
  every read goes through `process.env`.

## 🧪 Test Plan

| # | Test | Expected result |
|---|---|---|
| 1 | Open the Vercel URL in a fresh browser | Homepage renders, figure drawn, zero console errors |
| 2 | Click through every nav item | Each screen loads; `/docs` exists |
| 3 | Take the 12-question test end to end | A Style DNA result appears and survives a page reload |

Method: browser dev tools — Network tab for status codes, Console for errors.

## 🤖 Coding Agent Prompt

The exact prompt given to Claude Code for this week's build:

> Set up the infrastructure for my Style Me project so it satisfies my course's
> Week 0 requirements. Before writing any code, check the project for hardcoded
> secrets. Then initialise a git repository, write a `.gitignore` that excludes
> every `.env` file and the `.lab/` output folder, and split the existing code
> into five commits organised by layer — scaffold, render engine, data and
> recommendation, interface, documentation — not five arbitrary slices.
> Connect it to `github.com/eugenetriniac-png/style-me` and push.
> Then verify the Vercel deployment actually works: confirm that the page and
> every CSS and JS file return 200, that the console is clean, and that the SVG
> renderer runs in production rather than only locally. Report what you checked.
> Do not switch the project to a framework.

Full log: `docs/prompt-log.md`


==================================================

# Coding Agent Prompt Log — Week 0

**Agent used:** Claude Code (Opus 5)
**Date:** 25 August 2026

These are the actual prompts, in the order they were given. They are recorded
as they were typed, not cleaned up afterwards.

---

## Prompt 1 — Understanding the assignment

> Explain to me clearly what I have to do, I really did not understand
> anything. It feels like there are fifteen things to download, to use, to do.
> Just so you know, I already have the code for the site.

**Files modified:** none — planning only.
**What the agent did:** read the nine course HTML files, established that Week 0
is one PDF plus one live URL, and produced a nine-step ordered plan.
**Human decision:** I rejected the idea of doing everything at once and asked to
proceed one step at a time instead.

---

## Prompt 2 — Identifying what I actually had

> Here is the site link and the md doc, I think it is the code but I am not
> sure, tell me if that is it.

**Files inspected:** `README.md`, `js/`, `css/`, `server/`, `dist/`
**What the agent did:** established that `README.md` is documentation, not code;
that the real code is the 15 files in `js/`; that no git repository existed; and
that a `claude.ai` artifact link does not satisfy the course's "live URL"
requirement, which asks for Vercel.
**What I learned:** the difference between documentation, source code, and a
deployment.

---

## Prompt 3 — The three meanings of "Git"

> Is that the git? (pointing at `C:\ProgramData\...\Programs\Git`)

**Files modified:** none.
**What the agent did:** distinguished the Git *program* (installed, v2.55) from
a *repository* (did not exist) from *GitHub* (the remote host). Also detected
that the Git author identity was unconfigured.
**Error encountered:** none, but this is where my real confusion was.

---

## Prompt 4 — Repository and commits

> OK, let us redo everything step by step, because I am lost.

**Files modified:** `.gitignore` (created), `.git/` (initialised)
**What the agent did:** grepped the whole project for hardcoded API keys before
anything else — none found, every key read goes through `process.env`. Wrote a
`.gitignore` excluding `.env` files and `.lab/`. Initialised the repository,
then split the existing code into five commits by layer: scaffold, render
engine, data and recommendation, interface, documentation.
**Human decision:** I corrected the commit author name from a guessed one to
Eugène Triniac before any commit was made.
**What was rejected:** a single "initial commit" containing everything. The
course requires at least five commits and explicitly penalises a one-shot build,
and a per-layer split is also more readable for anyone reviewing the history.

---

## Prompt 5 — Publishing and verifying the deployment

> Yes. (authorising the push to public GitHub)

**Files modified:** none — publication and verification.
**What the agent did:** pushed five commits to `main`. After I connected Vercel
and gave it the resulting URL, it loaded the deployed site and checked it rather
than trusting that it looked fine: `GET /` returned 200, `css/app.css` and all
eleven JS files returned 200, the console showed no errors, and
`document.documentElement.scrollWidth` matched the viewport, proving there was
no horizontal overflow.
**Error encountered:** the deployed title appeared clipped in the preview pane.
**Fix applied:** none needed — measurement showed the viewport was 577 px wide,
so the clipping was in the preview tool, not on the site. Diagnosed before
changing anything.
**What I learned:** verify a deployment with status codes and measurements, not
with a screenshot that looks right.

---

## Prompt 6 — Build Discipline Packet

> Ask me for confirmation on the parts only I can answer.

**Files modified:** `docs/build-discipline-packet.md`, `docs/prompt-log.md`
**What the agent did:** drafted all eleven sections of the packet from the
codebase, and flagged the three that require my own judgement rather than
inventing answers for them: the problem statement, the user definition, and the
UX mockup.
**Human decision:** I confirmed the problem statement and the user definition as
drafted, and produced the mockup myself — see the next entry.

---

## Prompt 7 — UX mockup (image generation)

> Create a clean, modern UX mockup for a style-discovery web app homepage.
> Dark background, oversized display typography, a single illustrated fashion
> figure on the right. Sections for: a 12-question style test entry point, a
> vertical outfit feed, and saved outfits. Simple startup-product aesthetic,
> no photography, no complex animation.

**Files produced:** `docs/ux-mockup.png` (1024 x 1536)
**What was accepted:** the layout, the three-column band, the dark palette, and
one concrete copy change — stating that the test takes three minutes.
**What was rejected:** the generator renamed the product "STYLEFIND". I kept
Style Me. I also dropped its "Sign in" button, since accounts are an explicit
scope cut this week and a button leading nowhere is worse than no button.
**What I learned:** an image generator will quietly invent branding if you do
not pin the name in the prompt. Read the output before adopting it.


==================================================

# Test Evidence — Week 0

**Live URL under test:** https://style-me-five.vercel.app
**Date:** 25 August 2026
**Deployment tested:** commit `44a7e58`

---

## Round 1 — manual self-tests

Run by hand in a browser, against the deployed site.

| # | Test | User input | Expected result | Actual result | Pass |
|---|---|---|---|---|---|
| 1 | Deployment | Open the Vercel URL cold | Homepage renders, SVG figure drawn, no errors | Rendered as expected. `GET /` 200, `css/app.css` 200, all 11 JS files 200, console clean | ✅ |
| 2 | Navigation | Click all 5 nav tabs, then Docs in the footer | Every screen loads, `/docs` opens | All six destinations opened | ✅ |
| 3 | Full journey | Answer all 12 questions, then reload with F5 | A Style DNA result appears and survives the reload | Result appeared and persisted through the reload | ✅ |

**Round 1 conclusion: no defects found.** That conclusion was wrong, and the
next round shows why.

---

## Round 2 — measured pass

Round 1 passed because of *how* it was run: navigation was tested starting from
the homepage, in a session that had just been created. A second pass was run
against a session that had already completed the test, with element geometry
measured in the browser rather than judged by eye.

### Defect 1 — Docs becomes unreachable after onboarding

**Severity:** real navigation bug. **Found by:** measurement, not by eye.

The chain:

1. `SM.render` redirects `#/` to `#/feed` once `onboarded` is true
2. So the welcome screen — which carries the footer — is never shown again
3. The feed has no footer, deliberately: it is a full-screen surface
4. The nav bar has five tabs and none of them is Docs

Measured from the feed on a session with `onboarded: true`:

```
document.querySelectorAll('a[href*="docs"]').length  →  0
```

Any user who has taken the style test can no longer reach the Docs page from
the interface at all. They would have to type the URL.

This was invisible in Round 1 because the tester navigated from the homepage,
where the footer is present.

**Fix applied:** added a `Docs — how this works` row to the menu on the You
screen, and attached the shared footer to that screen. The You screen was
chosen because it is reachable from every other screen via the nav bar, and
because it is where a user already goes for account-level things.

**Verified after fix,** same session state:

```
document.querySelectorAll('a[href="#/docs"]').length  →  2
```

### Defect 2 — Footer links below the minimum tap target

**Severity:** minor, accessibility.

Measured at a 375 px viewport:

| Link | Before | After |
|---|---|---|
| Source | 47 × 26 px | 63 × 44 px |
| Docs | 34 × 26 px | 50 × 44 px |
| Feed | 33 × 26 px | 49 × 44 px |

26 px tall is well under the 44 × 44 px minimum recommended for touch targets.
These were the smallest tap targets in the product.

**Fix applied:** the link became an inline flex box with `min-height: 44px`,
and the underline moved onto an inner `<span>` so the rule still sits on the
text rather than around the whole padded box.

### Checked and found clean

Not every hypothesis produced a defect. Recorded so the pass is honest:

- **Footer hidden behind the floating nav bar** — suspected, measured, false.
  48 px of clearance at a 375 px viewport.
- **Horizontal overflow** — `document.documentElement.scrollWidth` equals
  `innerWidth` on `/`, `/docs`, `/feed` and `/shop`, at both mobile and desktop.
- **Roadmap tags wrapping at mobile width** — `scrollWidth` equals rendered
  width for every row.

---

## Iteration log

| # | What changed | Why | Commit |
|---|---|---|---|
| 1 | Docs reachable from the You screen | It was unreachable for any onboarded user | see below |
| 2 | Footer links raised to a 44 px tap target | Measured at 26 px, under the accessibility minimum | see below |
| 3 | Homepage states the test takes ~3 minutes | Adopted from the UX mockup, which stated it and the live page did not | `44a7e58` |

---

## What this round taught me

The first round of testing passed everything, and it was the weaker round. It
tested the paths I already had in my head, from the state my browser happened
to be in. The bug lived in a state I never occupied while testing — a returning
user rather than a new one — and it stayed invisible until element counts were
measured instead of eyeballed.

A test that finds nothing is not evidence that nothing is wrong. It is usually
evidence about the test.


==================================================

# Human Decision Note — Week 0

*Draft for Eugène to edit. 218 words.*

---

The decision I defend hardest this week is the one that breaks the rules. The
course specifies Next.js and Tailwind. Style Me uses neither, and I kept it that
way. The product's whole promise is swapping one garment without the rest of the
silhouette moving — a direct operation on a live SVG tree, where
`SM.fit.updateLayer` rewrites one of five groups and leaves the other four nodes
untouched. A framework that re-renders from state would fight that, and Tailwind
cannot express canvas-generated fabric. I lose free routing and tooling. I judged
that a fair trade and I have written it into the packet rather than hiding it.

The clearest thing I rejected was smaller. I asked an image generator for a
homepage mockup and it returned a good layout under a new brand name:
STYLEFIND. I took the layout and kept Style Me. I did adopt one line from it —
that the test takes three minutes — because the live page never said so.

The correction I did not expect to need was my own testing. My three tests
passed and I reported that nothing was wrong. A measured pass found that Docs
becomes unreachable for anyone who has finished the style test, because the
homepage footer is the only route to it and onboarded users never see the
homepage again. My tests passed because I ran them as a new user. I have since
fixed it and stopped treating a clean test round as good news.
