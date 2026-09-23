/* ============================================================
   STYLE ME — research.js

   The logic behind /research: filtering, searching, placing
   risks on the grid, and turning the intake form into a record.

   Pure functions, no DOM — so the same code can be checked from
   a console, which is how the Week 2 tests read the counts.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var MIN = { question: 10, assumption: 10, falsifier: 10 };
  var MAX = { question: 200, assumption: 300, falsifier: 300, notes: 1200 };
  var MARKETS = ['global', 'mexico', 'both'];
  var VERDICTS = ['real', 'partly', 'not-proven'];

  function data() { return SM.RESEARCH; }

  function haystack(c) {
    return [c.name, c.does, c.gap, c.figure, c.where, c.sourceName]
      .concat(c.tags || []).join(' ').toLowerCase();
  }

  /* A row belongs to a market filter if it matches exactly, and
     'mexico' also catches the global products that dominate here —
     no, deliberately not: a product is listed under the market its
     evidence is about. Filters must not quietly widen. */
  function filter(opts) {
    opts = opts || {};
    var q = String(opts.query || '').trim().toLowerCase();
    return data().competitors.filter(function (c) {
      if (opts.type && opts.type !== 'all' && c.type !== opts.type) return false;
      if (opts.market && opts.market !== 'all' && c.market !== opts.market) return false;
      if (q && haystack(c).indexOf(q) === -1) return false;
      return true;
    });
  }

  function counts() {
    var out = { all: data().competitors.length, global: 0, mexico: 0 };
    data().types.forEach(function (t) { out[t.id] = 0; });
    data().competitors.forEach(function (c) {
      out[c.type] = (out[c.type] || 0) + 1;
      out[c.market] = (out[c.market] || 0) + 1;
    });
    return out;
  }

  /* Every claim on the page carries one source; this is what the
     page prints next to the date, and what test 3 walks. */
  function sources() {
    var d = data();
    var all = [];
    ['competitors', 'benchmarks', 'mexico'].forEach(function (k) {
      d[k].forEach(function (r) {
        if (r.source) all.push({ id: r.id, url: r.source, name: r.sourceName, kind: r.sourceKind || 'web' });
      });
    });
    return all;
  }

  function webSources() {
    return sources().filter(function (s) { return s.kind === 'web'; });
  }

  /* ---------- risk grid ----------------------------------------- */
  var LEVELS = ['low', 'medium', 'high'];

  function riskGrid() {
    var cells = {};
    LEVELS.forEach(function (l) {
      LEVELS.forEach(function (i) { cells[l + '|' + i] = []; });
    });
    data().risks.forEach(function (r) {
      var key = r.likelihood + '|' + r.impact;
      if (!cells[key]) cells[key] = [];
      cells[key].push(r);
    });
    return cells;
  }

  function riskById(id) {
    return data().risks.filter(function (r) { return r.id === id; })[0] || null;
  }

  /* A risk is "top priority" when neither axis is low: that is the
     rule the saved record uses, so it cannot drift from the map. */
  function topRisks() {
    return data().risks.filter(function (r) {
      return r.likelihood !== 'low' && r.impact !== 'low' &&
        (r.likelihood === 'high' || r.impact === 'high');
    });
  }

  /* ---------- the intake form ----------------------------------- */
  function validate(form) {
    var errors = [];
    ['question', 'assumption', 'falsifier'].forEach(function (k) {
      var v = String(form[k] || '').trim();
      if (v.length < MIN[k]) errors.push({ field: k, message: fieldName(k) + ' needs at least ' + MIN[k] + ' characters.' });
      else if (v.length > MAX[k]) errors.push({ field: k, message: fieldName(k) + ' is over ' + MAX[k] + ' characters.' });
    });
    if (String(form.notes || '').length > MAX.notes) errors.push({ field: 'notes', message: 'Notes are over ' + MAX.notes + ' characters.' });
    if (MARKETS.indexOf(form.market) === -1) errors.push({ field: 'market', message: 'Pick a market.' });
    if (VERDICTS.indexOf(form.verdict) === -1) errors.push({ field: 'verdict', message: 'Pick a verdict.' });
    return errors;
  }

  function fieldName(k) {
    return { question: 'The research question', assumption: 'The assumption', falsifier: 'The falsifier' }[k];
  }

  /* The record keeps what was on screen when it was saved: which
     rows were in view, and which risks the map called top
     priority. A record that only kept the conclusion would be a
     memory, not evidence. */
  function toRecord(form, visible) {
    var rows = visible || data().competitors;
    return {
      question: String(form.question || '').trim(),
      assumption: String(form.assumption || '').trim(),
      falsifier: String(form.falsifier || '').trim(),
      market: form.market,
      verdict: form.verdict,
      notes: String(form.notes || '').trim() || null,
      competitor_ids: rows.map(function (c) { return c.id; }),
      risk_ids: topRisks().map(function (r) { return r.id; }),
      source_count: sources().length
    };
  }

  SM.research = {
    MIN: MIN,
    MAX: MAX,
    MARKETS: MARKETS,
    VERDICTS: VERDICTS,
    LEVELS: LEVELS,
    filter: filter,
    counts: counts,
    sources: sources,
    webSources: webSources,
    riskGrid: riskGrid,
    riskById: riskById,
    topRisks: topRisks,
    validate: validate,
    toRecord: toRecord
  };
})(window.SM);
