# Human Decision Note — Week 4

---

Marketing is where this project's one rule was always going to hurt. Three
weeks of labelling what is sourced and what is guessed is easy on a research
page and inconvenient on a landing page, where the job is to sound certain.

So the persona is not invented. It is the student interviewed on 24 September,
quoted in French with the translation beside it, and every line that is mine
rather than his is marked as an inference. The three proof points under the
headline are the same AMVO and NRF figures that carry links on `/research`. The
brand page reads its colours from the live stylesheet with
`getComputedStyle`, because a brand page that keeps its own copy of the hex
codes is wrong within a week and nobody notices.

I rejected two things that would have made the week easier. Email capture:
collecting addresses means handling personal data under the law this project
cites, for a list nobody would ever be mailed. And declaring an A/B winner:
the panel is forbidden in code from naming one below 100 impressions per arm,
so it currently prints how far away that is instead.

The correction I would not have found by testing: the two experiments were
secretly one. `hash % 2` reads only the lowest bit of an FNV hash, which
multiplication by an odd number never changes — so it was the parity of the
characters, and both experiment names shared it. Every visitor got the same
letter twice. Twenty thousand simulated draws showed 100% agreement; with a
proper mixing step it is 50.5%, which is a coin.
