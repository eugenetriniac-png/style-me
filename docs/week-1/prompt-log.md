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
