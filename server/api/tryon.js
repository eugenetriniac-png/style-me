/* ============================================================
   POST /api/tryon
   { person, garment, category } -> { image }

   Holds the provider key so the browser never has to. Works as a
   Vercel function as-is; the Cloudflare Worker version is in
   worker.js and shares the same body.
   ============================================================ */

const PROVIDER = process.env.TRYON_PROVIDER || 'fal';

/* --- fal.ai ------------------------------------------------- */
async function viaFal({ person, garment, category }) {
  const res = await fetch('https://fal.run/fal-ai/idm-vton', {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      human_image_url: person,
      garment_image_url: garment,
      /* upper_body | lower_body | dresses — the model needs to be
         told which part of the body it is dressing. */
      category: falCategory(category)
    })
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.image?.url || json.images?.[0]?.url;
}

function falCategory(category) {
  if (category === 'bottom') return 'lower_body';
  if (category === 'dress') return 'dresses';
  return 'upper_body';
}

/* --- Replicate ----------------------------------------------- */
async function viaReplicate({ person, garment, category }) {
  const start = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      'content-type': 'application/json',
      Prefer: 'wait'
    },
    body: JSON.stringify({
      version: process.env.REPLICATE_VERSION,
      input: {
        human_img: person,
        garm_img: garment,
        category: falCategory(category),
        garment_des: category
      }
    })
  });
  if (!start.ok) throw new Error(`replicate ${start.status}: ${await start.text()}`);
  const json = await start.json();
  if (json.output) return Array.isArray(json.output) ? json.output[0] : json.output;

  /* Prefer: wait usually returns finished work; poll if it did not. */
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(json.urls.get, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
    });
    const state = await poll.json();
    if (state.status === 'succeeded') {
      return Array.isArray(state.output) ? state.output[0] : state.output;
    }
    if (state.status === 'failed' || state.status === 'canceled') {
      throw new Error(`replicate ${state.status}: ${state.error}`);
    }
  }
  throw new Error('replicate timed out');
}

/* --- handler -------------------------------------------------- */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { person, garment, category } = req.body || {};
    if (!person || !garment) {
      return res.status(400).json({ error: 'person and garment images are both required' });
    }
    const image = PROVIDER === 'replicate'
      ? await viaReplicate({ person, garment, category })
      : await viaFal({ person, garment, category });

    if (!image) return res.status(502).json({ error: 'provider returned no image' });
    /* Cache hard: the same person plus the same garment is always
       the same picture, and every regeneration costs money. */
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).json({ image });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
