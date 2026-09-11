# Prompt Library — Style Me

Every prompt the product runs, or is built to run. The live copy is on
[`/docs`](https://style-me-five.vercel.app/docs#prompt-library), rendered from
`SM.core.PROMPT` in `js/core.js`, so the page cannot drift from the code. This
file mirrors it.

---

## #1 — Style Core extraction · `style-core-extract` · v1

**Page:** `/core` · **Added:** Week 1, 10 September 2026

### Job

Free text about how someone dresses, or would like to, goes in. Out come ten
axis scores, the signals behind them, an archetype, a short thesis and a
confidence level.

### Status

**Live as rules, engine `rules-v1`.** The course allows free tools only, so no
model receives this prompt yet. `js/core.js` carries out the same contract by
hand: a vocabulary of 93 cues mapped onto the ten axes, simple
negation, a small occasion prior, and a refusal to guess. Every saved row
records its `engine`, so a future model-generated row stays distinguishable
from a rules-generated one.

**Not the model's job: products.** The catalogue engine (`SM.stylist`) picks
the key pieces from the axes, inside the budget. A model could invent a jacket
that does not exist; the rule-based catalogue cannot.

### System prompt

```
You are the Style Core extractor for Style Me. You read how a person describes the way they dress — or would like to — and return their Style Core as JSON. You do not flatter, you do not invent anything the text does not say, and you never guess when the text says nothing about clothes.

The ten axes, each scored 0–100 relative to the strongest: minimal, street, classic, romantic, edgy, sporty, utility, retro, colour, avantGarde.

Rules:
1. Count only words about clothes, fabrics, colours, shoes, brands, or places and habits of dress. Quote each one exactly as written.
2. A refused cue ("I never wear colour", "without looking like a banker") lowers its axis. Mark it negated.
3. The occasion nudges and never decides: at most 3 points before normalising.
4. No cue at all: return {"error": "nosignal"}. Every cue negated: return {"error": "onlynegative"}. Never fall back to a default archetype.
5. Name the archetype from the two strongest axes, using the Style Me list.
6. The thesis is at most three sentences: what the core is built on, what was left out because the person said so, and where to start.
7. List the pieces the person names ("a leather jacket", "my Doc Martens") and the colours they refuse. They are constraints on the outfit, not style signals only.
```

### User prompt

```
Description: {{text}}
Occasion: {{occasion}}   (everyday | work | night | weekend)
Budget for one outfit: {{budget}} EUR, or none

Return only JSON:
{
  "axes": { "minimal": 0-100, … all ten },
  "signals": [{ "word": "…", "axis": "…", "negated": false }],
  "archetype": "…",
  "thesis": "…",
  "explore": ["axis", "axis"],
  "named": ["…"],
  "refusedColours": ["…"],
  "confidence": "low" | "medium" | "high"
}
```

**Changed in v1, after live testing:** rule 7 and the two fields that carry it.
The first version treated *"a leather jacket, heavy boots"* and *"I never wear
colour"* as style signals only, so the card could say "left out: colour" above
a green cardigan. Named pieces and refused colours are now constraints on the
outfit; what the budget forces through anyway is said on the card.

### Why it is written this way

- **Quote the words.** The card shows exactly which words were read. A reader
  can check the reading against their own text, which is the only way to trust
  it — or to catch it being wrong.
- **Refusals count.** People describe their style as much by what they avoid as
  by what they wear. A keyword counter that reads *"I never wear colour"* as a
  vote for Colour is worse than useless.
- **No default archetype.** Returning "Minimal" for gibberish would look like a
  result. An explicit `nosignal` is honest and testable.
- **The occasion is capped.** Otherwise choosing "Work" would turn everyone
  Classic, whatever they wrote.
- **What someone names is a constraint.** A person who writes "my Doc Martens"
  and gets canvas sneakers stops trusting everything else on the card.
  Priority order in the rules version: named pieces go in, refusals come out,
  and the budget holds whatever it costs the first two — out loud.

### Known limits of the rules version

- English only.
- Negation only reaches back to the start of its clause: a comma, a full stop
  or "but" ends it. *"No colour, mostly black"* is read correctly; a negation
  two sentences earlier is not.
- A handful of double negatives are handled (*"not afraid of colour"*,
  *"I don't mind"*); sarcasm is not.
- 93 cues. Words outside the vocabulary are ignored, not guessed.

### Test inputs

| # | Input | Occasion · budget | Expected |
|---|---|---|---|
| 1 | *Mostly black, oversized, I live in my Doc Martens. I never wear colour. I'd like to look sharper for work without looking like a banker.* | work · €300 | Edgy leads; *colour* and *banker* negative; total ≤ €300 |
| 2 | *I never wear colour. Black and grey, a leather jacket, heavy boots.* | everyday · none | Colour not in the top three and negative; identical on a second run |
| 3 | *asdf qwerty lorem ipsum dolor sit amet blah* | everyday · none | `nosignal`, no archetype |
