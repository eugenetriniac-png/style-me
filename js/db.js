/* ============================================================
   STYLE ME — db.js

   Two calls to Supabase, over its REST endpoint, with fetch. A
   client library would mean a 100 KB script from a CDN for an
   insert and a select; this project has no bundler to shake it.

   The key in config.js is the publishable one, public by design.
   What it may do is decided in the database — row level security
   and column grants, see supabase/core_outputs.sql — not by hiding
   it. The secret key never comes near this file.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  function cfg() { return SM.config && SM.config.supabase; }

  function configured() {
    var c = cfg();
    return !!(c && c.url && c.key);
  }

  function headers(extra) {
    var key = cfg().key;
    var h = { apikey: key, 'Content-Type': 'application/json' };
    /* Legacy anon keys are JWTs and go in Authorization too. The new
       publishable keys (sb_publishable_…) are not, and must not. */
    if (/^eyJ/.test(key)) h.Authorization = 'Bearer ' + key;
    return Object.assign(h, extra || {});
  }

  function endpoint(table, query) {
    return cfg().url.replace(/\/+$/, '') + '/rest/v1/' + table + (query ? '?' + query : '');
  }

  /* PostgREST errors come back as JSON with a message; network
     errors as a TypeError. Either way the caller gets one sentence. */
  function fail(res) {
    return res.json().catch(function () { return {}; }).then(function (body) {
      var err = new Error(body.message || ('HTTP ' + res.status));
      err.status = res.status;
      err.code = body.code;
      throw err;
    });
  }

  function notConfigured() {
    var err = new Error('Supabase is not configured');
    err.code = 'not-configured';
    return Promise.reject(err);
  }

  SM.db = {
    configured: configured,

    /* Returns only the columns the public key is allowed to read back. */
    insert: function (table, row, returning) {
      if (!configured()) return notConfigured();
      return fetch(endpoint(table, 'select=' + (returning || 'id,created_at')), {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(row)
      }).then(function (res) {
        if (!res.ok) return fail(res);
        return res.json().then(function (rows) { return rows[0]; });
      });
    },

    /* Rows plus the table's total count, from the Content-Range header. */
    list: function (table, opts) {
      if (!configured()) return notConfigured();
      opts = opts || {};
      var q = 'select=' + (opts.select || '*') +
        '&order=' + (opts.order || 'created_at.desc') +
        '&limit=' + (opts.limit || 5);
      return fetch(endpoint(table, q), {
        headers: headers({ Prefer: 'count=exact' })
      }).then(function (res) {
        if (!res.ok) return fail(res);
        var range = res.headers.get('Content-Range') || '';
        var total = parseInt(range.split('/')[1], 10);
        return res.json().then(function (rows) {
          return { rows: rows, total: isNaN(total) ? rows.length : total };
        });
      });
    }
  };
})(window.SM);
