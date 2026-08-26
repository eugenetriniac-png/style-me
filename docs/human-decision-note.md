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
