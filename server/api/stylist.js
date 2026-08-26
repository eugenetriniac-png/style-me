/* ============================================================
   POST /api/stylist
   { prompt } -> { text }

   Optional. Point SM.ai at this and the stylist copy comes from a
   real model instead of the local templates:

     SM.ai.configure({ endpoint: 'https://…/api/stylist', apiKey: 'unused' });

   The key lives here, in ANTHROPIC_API_KEY, and never leaves.
   ============================================================ */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { messages, model, max_tokens } = req.body || {};
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        max_tokens: max_tokens || 300,
        messages
      })
    });
    const json = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(json);
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
