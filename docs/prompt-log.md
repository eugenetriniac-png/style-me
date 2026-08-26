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
**Human decision pending:** those three sections.

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
