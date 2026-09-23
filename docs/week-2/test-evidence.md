# Test Evidence — Week 2

**Live page under test:** https://style-me-five.vercel.app/research
**Date:** 23 September 2026

---

## How the tests are run

The three software tests from the Build Discipline Packet are scripted in
`docs/week-2/run-tests.ps1`, so anyone can run them again, identically. As in
Week 1, the script drives headless Edge over the Chrome DevTools Protocol from
PowerShell — this machine has no Node and no Playwright — with a fresh browser
profile every run: a visitor who has never taken the style test, which is what
a grader opening `/research` is.

Every run hits the **live** site and the **real** database. Test 2 saves a row
to `research_records`; test 3 makes a real HTTP request to every source URL the
page cites.

One thing changed since Week 1, and it is the point of the week: **test 1
compares the page against the dataset**, not against numbers written into the
test. It reads `SM.research.counts()` — what `research-data.js` says — and
checks the rendered table against that. A test that hard-codes "3 substitutes"
keeps passing after someone deletes a row.

Two checks run alongside: security (S1) and mobile (M1).

---

## Results

*[filled in from `evidence/results.json` after the run]*

---

## Iteration log

*[filled in after the run]*
