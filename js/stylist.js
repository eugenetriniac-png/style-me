/* ============================================================
   STYLE ME — stylist.js

   Puts outfits together. Three weighted signals per candidate:

     affinity  — the piece's tags against your style axes
     cohesion  — the piece against what is already in the outfit
     harmony   — its colour against the palette so far

   A like nudges your axes toward what you liked, a skip nudges
   them slightly the other way, so the feed actually moves.

   SM.ai at the bottom is where a real model plugs in. With no key
   configured it writes the copy locally, offline and repeatably.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  /* ---------- repeatable randomness ---------------------------- */
  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = typeof seed === 'string' ? hashString(seed) : (seed >>> 0);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  SM.rng = rng;

  /* ---------- colour ------------------------------------------- */
  var NEUTRAL = { black: 1, white: 1, grey: 1, beige: 1, brown: 1 };

  function hue(hex) {
    var c = SM.color.hexToRgb(hex).map(function (v) { return v / 255; });
    var mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), d = mx - mn;
    if (d === 0) return 0;
    var h;
    if (mx === c[0]) h = ((c[1] - c[2]) / d) % 6;
    else if (mx === c[1]) h = (c[2] - c[0]) / d + 2;
    else h = (c[0] - c[1]) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  }
  function saturation(hex) {
    var c = SM.color.hexToRgb(hex).map(function (v) { return v / 255; });
    var mx = Math.max.apply(null, c), mn = Math.min.apply(null, c);
    return mx === 0 ? 0 : (mx - mn) / mx;
  }

  /* 0 = clashes, 1 = works. Neutrals go with everything; close
     hues and true opposites work; the mushy middle does not. */
  function harmony(item, picked) {
    if (!picked.length) return 0.8;
    var total = picked.reduce(function (acc, p) {
      if (NEUTRAL[item.family] || NEUTRAL[p.family]) return acc + 0.9;
      if (saturation(item.colour) < 0.18 || saturation(p.colour) < 0.18) return acc + 0.9;
      var d = Math.abs(hue(item.colour) - hue(p.colour));
      if (d > 180) d = 360 - d;
      if (d < 35) return acc + 0.95;
      if (d > 145) return acc + 0.85;
      if (d > 80 && d < 130) return acc + 0.55;
      return acc + 0.35;
    }, 0);
    return total / picked.length;
  }

  function affinity(item, axes) {
    if (!axes) return 0.5;
    var s = 0;
    item.tags.forEach(function (t) { s += (axes[t] || 0); });
    return Math.min(1, s / (100 * item.tags.length) * 1.15);
  }
  SM.affinity = affinity;

  function cohesion(item, picked) {
    if (!picked.length) return 0.7;
    var score = picked.reduce(function (acc, p) {
      var shared = p.tags.filter(function (t) { return item.tags.indexOf(t) !== -1; }).length;
      return acc + (shared >= 2 ? 1 : shared === 1 ? 0.72 : 0.25);
    }, 0);
    return score / picked.length;
  }

  /* ---------- filters ------------------------------------------ */
  SM.emptyFilters = function () {
    return { budgetTotal: null, budgetPiece: null, brands: [], colours: [], materials: [], tiers: [], categories: [] };
  };

  function passes(item, f) {
    if (!f) return true;
    if (f.budgetPiece && item.price > f.budgetPiece) return false;
    if (f.brands.length && f.brands.indexOf(item.brand) === -1) return false;
    if (f.colours.length && f.colours.indexOf(item.family) === -1) return false;
    if (f.materials.length && f.materials.indexOf(item.material) === -1) return false;
    if (f.tiers.length && f.tiers.indexOf(item.tier) === -1) return false;
    return true;
  }
  SM.passesFilters = passes;

  SM.filterCount = function (f) {
    if (!f) return 0;
    var n = (f.budgetTotal ? 1 : 0) + (f.budgetPiece ? 1 : 0);
    ['brands', 'colours', 'materials', 'tiers', 'categories'].forEach(function (k) { n += (f[k] || []).length; });
    return n;
  };

  /* ---------- choosing one piece -------------------------------- */
  function pick(category, axes, picked, filters, rand, opts) {
    opts = opts || {};
    var pool = SM.CATALOG.byCategory(category).filter(function (i) { return passes(i, filters); });
    if (opts.maxPrice) pool = pool.filter(function (i) { return i.price <= opts.maxPrice; });
    if (opts.exclude) pool = pool.filter(function (i) { return opts.exclude.indexOf(i.id) === -1; });
    if (!pool.length) {
      /* Filters must never leave a silhouette half-dressed. */
      pool = SM.CATALOG.byCategory(category);
      if (opts.maxPrice) {
        var affordable = pool.filter(function (i) { return i.price <= opts.maxPrice; });
        if (affordable.length) pool = affordable;
      }
    }
    if (!pool.length) return null;

    var scored = pool.map(function (i) {
      var s = 0.46 * affinity(i, axes) + 0.31 * cohesion(i, picked) + 0.23 * harmony(i, picked);
      return { item: i, s: s + rand() * 0.22 };
    }).sort(function (a, b) { return b.s - a.s; });

    var span = Math.max(1, Math.min(scored.length, opts.wide ? 9 : 5));
    return scored[Math.floor(rand() * span)].item;
  }

  /* ---------- building an outfit -------------------------------- */
  SM.stylist = {};

  SM.stylist.build = function (profile, filters, seed) {
    var rand = rng(seed);
    var axes = profile && profile.axes;
    var f = filters || SM.emptyFilters();
    var budget = f.budgetTotal || null;
    var items = [];

    function left(reserve) {
      if (!budget) return null;
      var spent = items.reduce(function (a, i) { return a + i.price; }, 0);
      return Math.max(15, budget - spent - (reserve || 0));
    }

    var wantsDress = rand() < 0.22 && (!f.categories.length || f.categories.indexOf('dress') !== -1);
    if (wantsDress) {
      var dress = pick('dress', axes, items, f, rand, { maxPrice: left(150) });
      if (dress) items.push(dress);
    }
    if (!items.length) {
      var top = pick('top', axes, items, f, rand, { maxPrice: left(200) });
      if (top) items.push(top);
      var bottom = pick('bottom', axes, items, f, rand, { maxPrice: left(140) });
      if (bottom) items.push(bottom);
    }

    var shoes = pick('shoes', axes, items, f, rand, { maxPrice: left(0) });
    if (shoes) items.push(shoes);

    if (rand() < (wantsDress ? 0.42 : 0.62)) {
      var rest = left(0);
      if (!budget || rest > 60) {
        var outer = pick('outer', axes, items, f, rand, { maxPrice: rest });
        if (outer) items.push(outer);
      }
    }

    var nAcc = rand() < 0.3 ? 0 : (rand() < 0.72 ? 1 : 2);
    var used = [];
    for (var k = 0; k < nAcc; k++) {
      var restA = left(0);
      if (budget && restA < 25) break;
      var acc = pick('accessory', axes, items, f, rand, { maxPrice: restA, exclude: used, wide: true });
      if (acc && used.indexOf(acc.id) === -1) { items.push(acc); used.push(acc.id); }
    }

    return SM.stylist.wrap(items, profile);
  };

  var ORDER = { top: 0, dress: 0, bottom: 1, outer: 2, shoes: 3, accessory: 4 };

  SM.stylist.wrap = function (items, profile) {
    items = items.filter(Boolean).slice();
    items.sort(function (a, b) { return (ORDER[a.category] || 9) - (ORDER[b.category] || 9); });
    var total = items.reduce(function (a, i) { return a + i.price; }, 0);
    var axes = profile && profile.axes;
    var aff = items.length ? items.reduce(function (a, i) { return a + affinity(i, axes); }, 0) / items.length : 0.5;
    return {
      id: items.map(function (i) { return i.id; }).join('~'),
      items: items,
      total: total,
      match: Math.round(Math.min(98, 55 + aff * 45)),
      kind: 'full'
    };
  };

  SM.stylist.fromId = function (id, profile) {
    if (!id) return null;
    var items = id.split('~').map(function (k) { return SM.CATALOG.byId[k]; }).filter(Boolean);
    return items.length ? SM.stylist.wrap(items, profile) : null;
  };

  /* Swap exactly one piece; everything else is carried over. */
  SM.stylist.swap = function (outfit, oldId, newId, profile) {
    return SM.stylist.wrap(outfit.items.map(function (i) {
      return i.id === oldId ? SM.CATALOG.byId[newId] : i;
    }), profile);
  };

  SM.stylist.remove = function (outfit, id, profile) {
    return SM.stylist.wrap(outfit.items.filter(function (i) { return i.id !== id; }), profile);
  };

  SM.stylist.add = function (outfit, id, profile) {
    var it = SM.CATALOG.byId[id];
    if (!it) return outfit;
    var items = outfit.items.filter(function (i) {
      if (it.category === 'accessory') return i.id !== id;
      return i.category !== it.category;
    });
    items.push(it);
    return SM.stylist.wrap(items, profile);
  };

  SM.stylist.alternatives = function (outfit, item, profile, filters, limit) {
    var others = outfit.items.filter(function (i) { return i.id !== item.id; });
    var axes = profile && profile.axes;
    return SM.CATALOG.byCategory(item.category)
      .filter(function (i) { return i.id !== item.id; })
      .map(function (i) {
        var s = 0.42 * affinity(i, axes) + 0.33 * cohesion(i, others) + 0.25 * harmony(i, others);
        if (!passes(i, filters)) s -= 0.28;
        return { item: i, score: s };
      })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, limit || 24);
  };

  /* A card built around one piece rather than a whole look. */
  SM.stylist.spotlight = function (profile, filters, seed) {
    var rand = rng('spot' + seed);
    var f = filters || SM.emptyFilters();
    var categories = ['outer', 'top', 'bottom', 'shoes'];
    var category = categories[Math.floor(rand() * categories.length)];
    var hero = pick(category, profile && profile.axes, [], f, rand, { maxPrice: f.budgetPiece, wide: true });
    if (!hero) return null;
    var base = SM.stylist.build(profile, f, 'fill-' + seed);
    var items = base.items.filter(function (i) { return i.category !== hero.category; });
    items.push(hero);
    var outfit = SM.stylist.wrap(items, profile);
    outfit.kind = 'piece';
    outfit.hero = hero;
    return outfit;
  };

  SM.stylist.feed = function (profile, filters, from, count) {
    var out = [];
    for (var i = 0; i < (count || 6); i++) {
      var n = from + i;
      var seed = (profile && profile.seed ? profile.seed : 'sm') + ':' + n + ':' + (profile && profile.rev ? profile.rev : 0);
      var outfit = (n > 0 && n % 5 === 4)
        ? SM.stylist.spotlight(profile, filters, seed)
        : SM.stylist.build(profile, filters, seed);
      if (outfit) { outfit.index = n; out.push(outfit); }
    }
    return out;
  };

  SM.stylist.search = function (query, filters, profile) {
    var q = (query || '').trim().toLowerCase();
    var axes = profile && profile.axes;
    return SM.CATALOG.items
      .filter(function (i) { return passes(i, filters); })
      .filter(function (i) {
        if (filters && filters.categories.length && filters.categories.indexOf(i.category) === -1) return false;
        if (!q) return true;
        var hay = [i.name, i.brand, i.material, i.family, i.colourName].concat(i.tags).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      })
      .map(function (i) { return { item: i, score: affinity(i, axes) }; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (r) { return r.item; });
  };

  /* ---------- learning ------------------------------------------ */
  SM.stylist.learn = function (profile, outfit, direction) {
    var axes = Object.assign({}, profile.axes);
    var step = direction > 0 ? 3.2 : -1.1;
    outfit.items.forEach(function (item) {
      item.tags.forEach(function (t) {
        axes[t] = Math.max(0, Math.min(140, (axes[t] || 0) + step));
      });
    });
    profile.axes = SM.normaliseAxes(axes);
    profile.rev = (profile.rev || 0) + 1;
    return profile;
  };

  /* ============================================================
     SM.ai — the stylist's voice
     ============================================================ */
  var AI = {
    endpoint: null,
    apiKey: null,
    model: 'claude-opus-5',
    configure: function (cfg) { Object.assign(AI, cfg || {}); },
    available: function () { return !!(AI.endpoint && AI.apiKey); }
  };

  var OPENERS = {
    minimal: ['Three pieces, not one more.', 'The silhouette holds on its own.', 'Nothing here to take away.'],
    street: ['The volume does the work.', 'Wide on top, wide below, fully owned.', 'It breathes, it moves.'],
    classic: ['An outfit that won’t date.', 'Cuts that already existed in 1985.', 'Quiet, never neutral.'],
    romantic: ['The fabrics carry this one.', 'It moves when you walk.', 'Softness without sweetness.'],
    edgy: ['Closed silhouette, flat tone.', 'Black, but worked black.', 'Nothing decorative in it.'],
    sporty: ['Built for a day that keeps moving.', 'Comfort owned, not slouched.', 'Technical, still wearable in town.'],
    utility: ['Materials that age well.', 'Every piece has a reason to be there.', 'Solid before pretty.'],
    retro: ['An archive silhouette, straightened out.', 'Charity shop, but clean.', 'Proportions from another decade.'],
    colour: ['The colour carries the outfit.', 'A direct accord, not an accident.', 'Two tones arguing politely.'],
    avantGarde: ['One unexpected proportion, held by the rest.', 'It unsettles exactly enough.', 'The balance sits somewhere unusual.']
  };

  function localCopy(outfit, profile) {
    var axes = (profile && profile.axes) || {};
    var counts = {};
    outfit.items.forEach(function (i) { i.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var dominant = Object.keys(counts).sort(function (a, b) {
      return (counts[b] * 10 + (axes[b] || 0)) - (counts[a] * 10 + (axes[a] || 0));
    })[0] || 'minimal';

    var r = rng(outfit.id);
    var pool = OPENERS[dominant] || OPENERS.minimal;
    var lines = [pool[Math.floor(r() * pool.length)]];

    var key = outfit.items.filter(function (i) { return i.category === 'outer' || i.category === 'dress'; })[0] || outfit.items[0];
    var shoes = outfit.items.filter(function (i) { return i.category === 'shoes'; })[0];
    var materials = {};
    outfit.items.forEach(function (i) { materials[SM.MATERIALS[i.material] || i.material] = 1; });
    var mats = Object.keys(materials).slice(0, 3);

    if (key) lines.push('It starts with the ' + key.name.toLowerCase() + ' from ' + key.brand + '.');
    if (mats.length > 1) lines.push('The mix of ' + mats.join(', ').toLowerCase() + ' keeps it from reading as a uniform.');
    if (shoes) lines.push('The ' + shoes.name.toLowerCase() + ' closes the silhouette without weighing it down.');
    var top = SM.topAxes(axes, 1)[0];
    if (top && SM.AXES[top]) {
      lines.push('Picked because your profile leans ' + SM.AXES[top].label.toLowerCase() + ': ' + SM.AXES[top].note + '.');
    }
    return lines.join(' ');
  }

  AI.describe = function (outfit, profile) {
    if (!AI.available()) return Promise.resolve(localCopy(outfit, profile));
    var prompt = 'You are a stylist. In three sentences at most, explain why this outfit works for this ' +
      'person. Be concrete, never flattering.\n\nOutfit: ' +
      outfit.items.map(function (i) {
        return i.name + ' (' + i.brand + ', ' + i.colourName + ', ' + i.material + ')';
      }).join(' · ') +
      '\nProfile: ' + SM.topAxes(profile.axes, 3).map(function (k) { return SM.AXES[k].label; }).join(', ');
    return fetch(AI.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': AI.apiKey },
      body: JSON.stringify({ model: AI.model, max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var text = j && j.content && j.content[0] && j.content[0].text;
        return text || localCopy(outfit, profile);
      })
      .catch(function () { return localCopy(outfit, profile); });
  };

  var MOMENTS = ['for a Tuesday', 'for dinner with no dress code', 'for a day that overruns',
    'for an opening', 'for walking a long way', 'for something that matters',
    'for a slow Sunday', 'for a Friday night'];

  AI.title = function (outfit, profile) {
    var r = rng('t' + outfit.id);
    var arch = SM.archetype((profile && profile.axes) || {});
    return arch.name + ' ' + MOMENTS[Math.floor(r() * MOMENTS.length)];
  };

  SM.ai = AI;
})(window.SM);
