/* ============================================================
   STYLE ME — api/keepalive.js

   A Supabase free project pauses after a week without activity.
   It has paused twice already, and each time the Save buttons on
   /core and /research would have failed for any visitor — which
   is exactly what happens if nobody opens the site between
   handing an assignment in and it being marked.

   So: one cheap read a day, run by Vercel's scheduler (see the
   "crons" entry in vercel.json). It counts as activity, it reads
   nothing private — the same publishable key the browser already
   carries, which may not read input_text or notes — and it writes
   nothing at all.

   This is the mitigation for the risk the research page lists as
   "free-tier infrastructure": high likelihood, low impact.
   ============================================================ */

const URL_DEFAULT = 'https://ssyqkfqwhpvahtefmxdy.supabase.co';
const KEY_DEFAULT = 'sb_publishable_oLwiCvRCogi_68jSX_qydg_CCLIyERj';

module.exports = async function handler(req, res) {
  const base = process.env.SUPABASE_URL || URL_DEFAULT;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || KEY_DEFAULT;

  const tables = ['core_outputs', 'research_records'];
  const checked = {};
  let ok = true;

  for (const table of tables) {
    try {
      const r = await fetch(base + '/rest/v1/' + table + '?select=id&limit=1', {
        headers: { apikey: key }
      });
      checked[table] = r.status;
      if (r.status !== 200) ok = false;
    } catch (e) {
      checked[table] = 'unreachable: ' + e.message;
      ok = false;
    }
  }

  /* 200 even when the database is down: this endpoint reports, it does
     not page anyone. The body carries the truth. */
  res.status(200).json({ ok: ok, checked: checked, at: new Date().toISOString() });
};
