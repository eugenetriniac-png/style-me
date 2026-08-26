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
