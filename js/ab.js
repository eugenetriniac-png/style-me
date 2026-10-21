/* ============================================================
   STYLE ME — ab.js

   A/B assignment, recording and reading.

   Three properties the tests check, and the reason each exists:

   · **sticky** — a visitor gets the same variant every time, or
     the experiment measures nothing but reload behaviour.
   · **independent** — the headline draw must not predict the CTA
     draw, or the two experiments are one experiment.
   · **honest** — `summarise` refuses to name a winner below a
     declared threshold. The hard part of an A/B test is not
     splitting traffic, it is not reading a story into eleven
     visits.

   The visitor id is twelve random characters in localStorage. No
   cookie, no fingerprint, no third party, nothing personal — the
   same standard the rest of the project claims on /docs.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var KEY = 'style-me/visitor';
  var MIN_PER_ARM = 100;          // below this, no winner is named
  var ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

  function newId() {
    var out = '';
    var bytes = new Uint8Array(12);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
    return out;
  }

  /* One id per browser. If storage is blocked the visitor still gets
     an id for this page view — they simply will not be sticky, and
     that is better than throwing on a marketing page. */
  var memory = null;
  function visitor() {
    try {
      var v = window.localStorage.getItem(KEY);
      if (!v) { v = newId(); window.localStorage.setItem(KEY, v); }
      return v;
    } catch (e) {
      if (!memory) memory = newId();
      return memory;
    }
  }

  /* FNV-1a over visitor + experiment, then an avalanche step.
     The avalanche is not decoration. FNV's multiplier is odd, so
     multiplication never changes the lowest bit: `hash(s) % 2` is
     nothing but the parity of the character codes. Both experiment
     names happened to share that parity, which made the headline
     draw and the CTA draw identical for every visitor — two
     experiments that were secretly one coin. Mixing the high bits
     down before the modulo fixes it, and test A1 measures it. */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 2246822507);
    h ^= h >>> 13; h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function experiment(id) {
    return SM.MARKETING.experiments.filter(function (e) { return e.id === id; })[0] || null;
  }

  function assignFor(visitorId, experimentId) {
    var exp = experiment(experimentId);
    if (!exp) return null;
    var index = hash(visitorId + ':' + experimentId) % exp.variants.length;
    return exp.variants[index];
  }

  function assign(experimentId) {
    return assignFor(visitor(), experimentId);
  }

  /* ---------- recording ------------------------------------------
     One impression and one conversion per visitor per experiment,
     **ever** — not per page load.

     The first version de-duplicated in a variable, which survives
     a click but not a reload, so one visitor opening the homepage
     six times counted as six. The test run proved it: six
     impressions, one visitor. With the denominator inflated, every
     conversion rate reads lower than it is, and the two arms are
     only comparable if both are inflated equally — which is a
     coin-flip, not a property.

     The flag lives in localStorage beside the visitor id, so the
     denominator is "people who saw it" and the rate is "share of
     people who acted". */
  var SEEN_KEY = 'style-me/ab-seen';

  function seenMap() {
    try { return JSON.parse(window.localStorage.getItem(SEEN_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function markSeen(key) {
    try {
      var m = seenMap();
      m[key] = 1;
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(m));
    } catch (e) { /* storage blocked: the row is simply recorded again */ }
  }

  function alreadySeen(key) { return !!seenMap()[key]; }

  function record(experimentId, eventName, surface) {
    var variant = assign(experimentId);
    if (!variant) return Promise.resolve(null);
    var key = experimentId + ':' + eventName;
    if (alreadySeen(key)) return Promise.resolve(null);
    markSeen(key);
    if (!SM.db.configured()) return Promise.resolve(null);
    return SM.db.insert('ab_events', {
      experiment: experimentId,
      variant: variant.id,
      event: eventName,
      visitor: visitor(),
      surface: surface || location.hash || '/'
    }).catch(function () { return null; });   // a marketing page never breaks on a failed beacon
  }

  /* ---------- reading --------------------------------------------
     Takes the rows as the database returns them and counts. No
     winner below MIN_PER_ARM impressions in *every* arm. */
  function summarise(rows, experimentId) {
    var exp = experiment(experimentId);
    if (!exp) return null;
    /* PostgREST answers an error as an object, not an array, and a
       summary that throws on a bad fetch takes the page down with it.
       No rows is a real state — it is what "no data yet" looks like. */
    if (!Array.isArray(rows)) rows = [];
    var arms = exp.variants.map(function (v) {
      var mine = rows.filter(function (r) { return r.experiment === experimentId && r.variant === v.id; });
      var impressions = mine.filter(function (r) { return r.event === 'impression'; }).length;
      var conversions = mine.filter(function (r) { return r.event === 'conversion'; }).length;
      return {
        id: v.id, text: v.text, angle: v.angle,
        impressions: impressions,
        conversions: conversions,
        rate: impressions ? Math.round((conversions / impressions) * 1000) / 10 : null
      };
    });

    var smallest = Math.min.apply(null, arms.map(function (a) { return a.impressions; }));
    var enough = smallest >= MIN_PER_ARM;
    var leader = arms.slice().sort(function (a, b) { return (b.rate || 0) - (a.rate || 0); })[0];

    return {
      experiment: experimentId,
      question: exp.question,
      arms: arms,
      total: arms.reduce(function (a, b) { return a + b.impressions; }, 0),
      smallestArm: smallest,
      minPerArm: MIN_PER_ARM,
      enough: enough,
      /* Named only when the data earns it. Until then the page says
         how far away it is, which is the useful number anyway. */
      winner: enough ? leader.id : null,
      verdict: enough
        ? 'Variant ' + leader.id.toUpperCase() + ' leads at ' + leader.rate + '%.'
        : 'Not enough data. ' + smallest + ' impressions in the smaller arm, ' + MIN_PER_ARM + ' needed before this page names anything.'
    };
  }

  SM.ab = {
    MIN_PER_ARM: MIN_PER_ARM,
    visitor: visitor,
    newId: newId,
    hash: hash,
    assign: assign,
    assignFor: assignFor,
    record: record,
    summarise: summarise
  };
})(window.SM);
