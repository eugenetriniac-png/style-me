/* ============================================================
   STYLE ME — config.js

   Public configuration, committed on purpose.

   The Supabase key below is the PUBLISHABLE key (sb_publishable_…
   or the legacy "anon" key). It is designed to ship in browser
   code: what it can do is limited by row level security and
   column grants in the database — supabase/core_outputs.sql.

   Never put the secret / service_role key here, or anywhere in
   this repository.
   ============================================================ */

window.SM = window.SM || {};

SM.config = {
  supabase: {
    url: 'https://ssyqkfqwhpvahtefmxdy.supabase.co',
    key: 'sb_publishable_oLwiCvRCogi_68jSX_qydg_CCLIyERj'
  }
};
