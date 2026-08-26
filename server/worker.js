/* ============================================================
   Cloudflare Worker version of /api/tryon.
   Same contract, same environment variables:

     wrangler secret put FAL_KEY
     wrangler deploy
   ============================================================ */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function falCategory(category) {
  if (category === 'bottom') return 'lower_body';
  if (category === 'dress') return 'dresses';
  return 'upper_body';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405, headers: CORS });
    }

    try {
      const { person, garment, category } = await request.json();
      if (!person || !garment) {
        return Response.json({ error: 'person and garment images are both required' },
          { status: 400, headers: CORS });
      }

      const upstream = await fetch('https://fal.run/fal-ai/idm-vton', {
        method: 'POST',
        headers: { Authorization: `Key ${env.FAL_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          human_image_url: person,
          garment_image_url: garment,
          category: falCategory(category)
        })
      });

      if (!upstream.ok) {
        return Response.json({ error: `provider ${upstream.status}` }, { status: 502, headers: CORS });
      }
      const json = await upstream.json();
      const image = json.image?.url || json.images?.[0]?.url;
      if (!image) return Response.json({ error: 'no image returned' }, { status: 502, headers: CORS });

      return Response.json({ image }, {
        headers: { ...CORS, 'Cache-Control': 'public, max-age=31536000, immutable' }
      });
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500, headers: CORS });
    }
  }
};
