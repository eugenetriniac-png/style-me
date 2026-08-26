# Style Me

A web app for finding — or discovering — your own style.

Twelve questions that are barely about clothes, then a vertical feed of
outfits built for you. Every outfit opens onto its credits page, where **any
single piece can be swapped without the rest of the silhouette moving**.

No dependencies, no build step required, no server: plain HTML, CSS and
JavaScript. Open it in a browser and it works.

---

## Running it

**Simplest** — open `dist/style-me.html` (double click). Everything is in that
one file: it works offline and can be shared as-is.

**For development** — the sources are split, so you need a small server
(browsers block some things over `file://`):

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then <http://localhost:8123/>. The server stamps the CSS and JS with a version
so the browser never hands you a stale build. `Ctrl+C` stops it.

**Rebuild the single file** after any change:

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```

**Check the rendering** — `lab.html` draws contact sheets of every figure,
fabric, product shot and outfit, and saves them as PNGs into `.lab/`. It is the
fastest way to see whether a change to the drawing code helped or hurt.

---

## What's in it

| Screen | What you do there |
|---|---|
| **Welcome / Test** | 12 questions about mornings, your flat, music, people — only the last one mentions clothes |
| **Style DNA** | Ten axes scored out of 100, a named archetype, two directions to explore |
| **Feed** | Full-screen vertical scroll, like, save, reshuffle; whole outfits *and* single-piece cards |
| **Outfit** | The look on a model plus its credit list; replace, remove or add a piece; post it |
| **Product** | Big product shot, on-model and fabric close-up views, size picker, bag, brand search |
| **Shop** | Outfit budget and per-piece budget, category, colour, material, price range, brand, text search |
| **Community** | Posts, likes, comments, following, and "Shop the look" straight through to the outfit page |
| **Messages** | A thread per person |
| **You / Studio** | Name, age, height, weight, build, skin, hair, photos from four angles, and a switch to wear every outfit on your own avatar |
| **Saved / Bag** | Saved outfits and pieces; a demo bag that never takes payment |

---

## How the pictures are made

This is the part that matters, so it's worth being precise: **nothing here is a
photograph.** There is no image model and no photo library. Every garment and
every model is drawn in the browser, in SVG, at render time.

Four pieces do that work:

### `materials.js` — fabric

Each material is generated pixel by pixel on an offscreen canvas once at
start-up, then exposed as an SVG pattern: denim twill with its diagonal ridge
and pale slubs, knit loops, corduroy wales, leather grain with pores, ripstop
grid, linen slubs, velvet pile, tweed flecks. Garments paint their colour first
and then blend the tile on top in `overlay` mode, so the weave shows without
shifting the hue.

Generating the tiles once and reusing them as images is deliberate: SVG
turbulence filters look similar but re-run on every repaint and stall a
scrolling feed.

### `figure.js` — the body

One skeleton drives everything. Proportions follow the eight-head figure used
in fashion drawing, and the pose is a mild contrapposto — weight on one leg,
pelvis tipped, shoulders counter-tipped. Skin uses a six-stop ramp with a warm
highlight and a cool shadow rather than a light-to-dark version of one hue,
which is what usually makes flat illustration look like plastic. Every shading
mark is clipped to the form it belongs to.

`build`, `height` and `frame` reshape the skeleton, so the same outfit falls
differently on different bodies.

### `garment.js` — product shots

Each garment is drawn the way a retailer photographs one: filled out as if
worn, no body inside, lit from the upper left, dropped on a light ground —
shoulder seams, topstitching, ribbed collars, plackets, buttons, rivets, zips,
pocket bags, sole units. Shoes are drawn in profile, which is how they are
actually sold.

### `fit.js` — clothes on the body

Garments derived from the same skeleton, grouped into five independent layers:

```
bottom · top · shoes · outer · accessory
```

`SM.fit.updateLayer(svg, outfit, look, 'bottom')` rewrites **only** that group.
Open the inspector during a swap: the other four layers keep the exact nodes
they already had. That is what makes "change one piece without touching the
others" true rather than a claim.

### Putting real photographs in

Add `images: ['https://…']` to any item in `js/data.js` and the renderer uses
the photograph instead of its drawing — no other change needed. The drawings
are a stand-in until a real catalogue exists, not the end state.

---

## The recommendations

Three weighted signals per candidate piece:

1. **affinity** — the piece's tags against your style axes
2. **cohesion** — the piece against the pieces already chosen
3. **harmony** — its colour against the palette so far (neutrals go anywhere,
   close hues and true opposites work, the mushy middle is penalised)

A like moves your axes toward what you liked; a skip moves them slightly the
other way. The feed recalculates as you go.

### Plugging in a real model

`SM.ai` is the hook. Unconfigured, the stylist copy is written locally, offline
and repeatably. To use a real model:

```js
SM.ai.configure({
  endpoint: 'https://your-proxy.example/anthropic',  // your backend, not the API
  apiKey: '…',
  model: 'claude-opus-5'
});
```

`SM.ai.describe(outfit, profile)` returns a promise and falls back to the local
copy on any failure. **Never call a model API directly from the browser** — the
key would be visible to everyone. It needs a small server in between.

---

## Real vs simulated

- **Real**: the quiz and its scoring, the outfit engine, the layered rendering,
  the filters, saved items, the bag, local persistence, photo import.
- **Simulated**: the community (eight profiles and their posts are generated at
  load), the replies in Messages, and image generation — the models are
  parametric SVG, not a diffusion model.
- **Demo catalogue**: brands are real so the price tiers mean something, but
  product names and prices are invented and labelled as such. Buy buttons open
  a **search** on the brand's own site, never a fabricated product page. The bag
  takes no payment.

Nothing leaves the browser — not the photos, not the quiz answers.

---

## Files

```
index.html          shell and load order
css/app.css         the whole stylesheet
js/materials.js     canvas-generated fabric tiles
js/figure.js        skeleton, body, face, hair
js/garment.js       product shots
js/data.js          catalogue, brands, demo community
js/fit.js           garments fitted to the figure, in layers
js/profile.js       questions, scoring, archetypes
js/stylist.js       outfit engine + the AI hook
js/store.js         state and localStorage
js/ui.js            icons, tiles, credit rows, sheets
js/views.js         one object per screen
js/app.js           routing, navigation, start-up
lab.html            render lab (contact sheets → .lab/*.png)
serve.ps1           dev server
build.ps1           single-file bundler
```

Each file adds to one global `SM`. No ES modules, so the whole thing also runs
straight from `file://`.

---

## Where to take it next

- **A real catalogue** — replace `js/data.js` with a merchant feed. The item
  shape is stable: `{id, name, brand, price, colour, colourName, family,
  material, tags, category, shape, opts, images}`.
- **Accounts and a backend** — everything is in `localStorage` today. An account
  would carry saved outfits between devices and make the community real.
- **Real product photography** — the fastest single upgrade, and the `images`
  field is already there for it. Worth knowing: the "swap one piece" promise is
  easy in layered SVG and hard with generated images, since each generation
  redraws everything. If you go that way, keep this SVG as the pose guide and
  the inpainting mask.
- **An app** — it is already built for touch and full screen; a manifest and a
  service worker would make it installable.
- **Sizing** — the Studio already collects height and weight; the next step is
  crossing that with brand size charts.
