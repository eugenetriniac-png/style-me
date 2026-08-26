/* ============================================================
   STYLE ME — images.js

   The photo layer.

   Every drawing in this app is a stand-in. The moment a real
   photograph exists for a piece — from a merchant feed, from a
   try-on generation, from a file you dropped in — it wins, and
   the drawing steps aside.

   Three places a photo can come from, in priority order:

     1. runtime overrides   (imported feeds, generated try-ons)
     2. item.images         (hard-coded in data.js)
     3. nothing             -> the SVG drawing

   Views:
     product  packshot on a plain ground
     model    the piece worn by someone
     detail   close-up of the cloth
     back     reverse of the garment
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var KEY = 'style-me/images/v1';
  var memory = null;
  var store = null;

  function read() {
    if (store) return store;
    var raw;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = memory; }
    try { store = raw ? JSON.parse(raw) : { items: {}, outfits: {} }; }
    catch (e) { store = { items: {}, outfits: {} }; }
    if (!store.items) store.items = {};
    if (!store.outfits) store.outfits = {};
    return store;
  }

  function persist() {
    var raw = JSON.stringify(store);
    try { window.localStorage.setItem(KEY, raw); }
    catch (e) { memory = raw; }
  }

  var VIEWS = ['product', 'model', 'detail', 'back'];

  var images = {
    VIEWS: VIEWS,

    /* ---------- writing ---------------------------------------- */
    set: function (itemId, view, url) {
      var s = read();
      if (!s.items[itemId]) s.items[itemId] = {};
      s.items[itemId][view || 'product'] = url;
      persist();
    },

    setMany: function (itemId, map) {
      var s = read();
      s.items[itemId] = Object.assign(s.items[itemId] || {}, map);
      persist();
    },

    clear: function (itemId) {
      var s = read();
      if (itemId) delete s.items[itemId];
      else { s.items = {}; s.outfits = {}; }
      persist();
    },

    /* Generated try-on results, keyed by outfit + who is wearing it. */
    setWorn: function (outfitId, lookKey, url) {
      var s = read();
      s.outfits[outfitId + '|' + (lookKey || 'default')] = url;
      persist();
    },
    getWorn: function (outfitId, lookKey) {
      var s = read();
      return s.outfits[outfitId + '|' + (lookKey || 'default')] || null;
    },

    /* ---------- reading ---------------------------------------- */
    get: function (item, view) {
      if (!item) return null;
      view = view || 'product';
      var s = read();
      var over = s.items[item.id];
      if (over && over[view]) return over[view];
      /* A product photo is a reasonable stand-in for a missing
         back or detail shot; the reverse is not true. */
      if (view !== 'product' && over && over.product) return null;
      if (item.images && item.images.length) {
        if (view === 'product') return item.images[0];
        var byView = { model: 1, detail: 2, back: 3 };
        return item.images[byView[view]] || null;
      }
      return null;
    },

    has: function (item, view) { return !!images.get(item, view); },

    /* How much of the catalogue is real photography. */
    coverage: function () {
      var total = SM.CATALOG.items.length;
      var withPhoto = SM.CATALOG.items.filter(function (i) { return images.has(i, 'product'); }).length;
      return { total: total, photos: withPhoto, percent: total ? Math.round(withPhoto / total * 100) : 0 };
    },

    /* ---------- rendering --------------------------------------- */
    /* A photo that quietly gives up and lets the drawing take over
       if the URL is dead — merchant feeds go stale constantly. */
    tag: function (url, item, view, cls) {
      return '<img class="photo ' + (cls || '') + '" src="' + url +
        '" alt="' + String(item.name || '').replace(/"/g, '') +
        '" loading="lazy" decoding="async"' +
        ' onerror="SM.images.fallback(this,\'' + item.id + '\',\'' + (view || 'product') + '\')">';
    },

    fallback: function (node, itemId, view) {
      var item = SM.CATALOG.byId[itemId];
      if (!item || !node.parentNode) return;
      /* Remember that this one is broken so we stop retrying it. */
      var s = read();
      if (s.items[itemId]) { delete s.items[itemId][view]; persist(); }
      node.outerHTML = SM.garment.productShot(item, { forceDrawing: true });
    },

    wornFallback: function (node, outfitId) {
      var outfit = SM.stylist.fromId(outfitId, SM.store.profile());
      if (!outfit || !node.parentNode) return;
      node.outerHTML = SM.fit.render(outfit, SM.store.lookFor(outfit), { forceDrawing: true });
    }
  };

  SM.images = images;
})(window.SM);
