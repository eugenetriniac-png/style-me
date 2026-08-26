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
