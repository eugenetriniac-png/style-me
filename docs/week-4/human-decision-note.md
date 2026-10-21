# Human Decision Note — Week 4

---

Marketing is where this project's one rule was always going to hurt. Three
weeks of labelling what is sourced and what is guessed is easy on a research
page and inconvenient on a landing page, whose job is to sound certain.

The persona is therefore not invented. It is the student interviewed on
24 September, quoted in his own French; every line that is mine is marked as
an inference. The proof points under the headline are the AMVO and NRF figures
that carry links on `/research`. The brand page reads its colours from the live
stylesheet, because a page keeping its own copy of the hex codes goes wrong
within a week and nobody notices.

I rejected two things that would have made this easier. Email capture:
collecting addresses means handling personal data under the law this project
cites, for a list nobody would be mailed. And declaring an A/B winner: the
panel is forbidden from naming one below 100 impressions per arm, so it prints
how far away that is instead.

Two defects earn the space. The experiments were secretly one: `hash % 2` reads
the lowest bit of an FNV hash, which an odd multiplier never changes, so both
names shared a parity and every visitor got the same letter twice. Twenty
thousand draws caught it. No test caught the second — impressions were counted
per page load, so one person who reloaded weighed sixteen rows. I found it by
reading the table after a green run.
