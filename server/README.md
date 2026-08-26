# The backend Style Me needs

Two endpoints, both tiny, both existing only to hold a secret the browser
must never see:

| Endpoint | Why it exists |
|---|---|
| `POST /api/tryon` | Runs a virtual try-on. Takes a person image + a garment image, returns a person wearing the garment. |
| `POST /api/stylist` | Optional. Proxies a text model for the stylist copy (`SM.ai`). |

**Never put an API key in the front end.** Anything in `js/` is readable by
anyone who opens the site. That is the whole reason this folder exists.

---

## Deploying

Both templates are plain functions with no dependencies and no build step.

### Vercel

```bash
npm i -g vercel
cd server
vercel
vercel env add FAL_KEY          # or REPLICATE_API_TOKEN
vercel --prod
```

Vercel serves `api/tryon.js` at `/api/tryon` automatically.

### Cloudflare Workers

```bash
npm i -g wrangler
cd server
wrangler secret put FAL_KEY
wrangler deploy
```

### Then point the app at it

In the browser console, or in `js/app.js` at boot:

```js
SM.tryon.configure({ endpoint: 'https://your-app.vercel.app/api/tryon' });
```

If your API is on a different origin than the site, add CORS — both templates
already do.

---

## Choosing a provider

As of early 2026:

| Provider | Notes |
|---|---|
| **[fal.ai](https://fal.ai/explore/virtual-try-on-apis)** | Cheapest for most use, several try-on models behind one API, fast queue. |
| **[Replicate](https://replicate.com)** | IDM-VTON runs around **$0.025 per image** (~40 runs per $1), roughly 19s each. Better documentation, slightly pricier. |
| **[FASHN](https://fashn.ai/products/api)** | Purpose-built for fashion try-on rather than a general model host. |

Two things to check before you commit:

1. **Licensing.** IDM-VTON's commercial status is unclear. If Style Me ever
   makes money, confirm the licence of whichever model you ship, or use a
   provider that indemnifies commercial use.
2. **Cost at your volume.** At ~$0.025 an image and four passes per outfit, a
   full look is ~$0.10 if nothing is cached. `SM.tryon` chains the passes and
   caches every intermediate precisely so a single swap costs one pass, not
   four — keep that behaviour.

---

## Cost control that actually matters

- **Never generate inside the scroll.** Pre-generate overnight for the outfits
  most likely to be seen; serve cache in the feed.
- **Generate on the user's own photo only when they ask.** That is the moment
  worth paying for.
- **Persist results somewhere permanent.** `SM.images` uses `localStorage`,
  which is fine for one person on one device and useless as a real cache. Move
  it to object storage (R2, S3, Cloudinary) keyed by the same
  `outfit + person` string once you have accounts.
- **A handful of house models.** Generating eight fixed models once and reusing
  them across every outfit is far cheaper than a new face each time, and it
  makes the feed look coherent rather than random.
