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
