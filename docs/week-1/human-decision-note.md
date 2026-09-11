# Human Decision Note — Week 1

*Draft for Eugène to edit before submitting — it has to say what I think. 245 words; the limit is 250.*

---

This week I tested how far a coding agent could take a feature on its own. The
decisions I own are the constraints I set and what I accepted after checking
the result.

The biggest trade-off: the Style Core is not an AI model. Paid APIs are out of
scope, and I preferred an honest rule-based agent to a fake "AI" label. It reads
free text through 93 cues, treats *"I never wear colour"* as a refusal, and says
"Simulated agent" on every card. Being deterministic is what makes it testable.
The prompt a real model would receive is already in the prompt library.

I rejected supabase-js — 100 KB for two requests, with no bundler — and made the
database, not the page, enforce privacy: the public key can save what someone
writes about themselves but never read it back.

The correction that mattered: every scripted test passed while the card
contradicted itself. It said "left out: colour" above a green cardigan, and
answered "a leather jacket, heavy boots" with a beige trench. The test checked
the axes; a person reads the clothes. I changed the test first, watched it fail
on the live site, then fixed the engine: named pieces go in, refusals come out,
the budget still wins, and the card says whatever the budget overruled.

I left the feed's outfit builder alone although it shares the budget weakness:
changing it would reshuffle every outfit the feed already generates. It is
logged for later.
