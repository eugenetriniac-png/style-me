/* ============================================================
   STYLE ME — tryon.js

   Client for a virtual try-on service (IDM-VTON, CatVTON,
   OOTDiffusion, FASHN and friends, hosted on fal.ai, Replicate or
   your own box). The API key never comes near the browser: this
   talks to a small endpoint of yours, and that endpoint holds the
   key. Templates for it are in server/.

   The interesting part is how an outfit is built. A try-on model
   dresses one garment at a time, so a full look is a chain:

       person → +bottom → +top → +outer → +shoes

   Every step is cached under the ordered list of pieces applied so
   far. So when someone swaps only the jacket, the person-in-
   trousers-and-jumper image is already sitting in the cache and
   only the last pass has to run. One generation instead of four —
   which is the difference between this being affordable and not.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var config = {
    endpoint: null,        // e.g. '/api/tryon' — your server, not the provider
    concurrency: 2,
    timeout: 90000,
    enabled: false
  };

  /* Try-on models dress the body outwards. Accessories are left
     alone: no current model handles a bag or sunglasses well, and
     a bad pass is worse than none. */
  var ORDER = ['bottom', 'dress', 'top', 'outer', 'shoes'];

  function steps(outfit) {
    var out = [];
    ORDER.forEach(function (category) {
      outfit.items.forEach(function (item) {
        if (item.category === category) out.push(item);
      });
    });
    return out;
  }

  function cacheKey(personKey, applied) {
    return personKey + '::' + applied.map(function (i) { return i.id; }).join('>');
  }

  /* ---------- a small queue so we never hammer the provider ----- */
  var running = 0;
  var pending = [];

  function schedule(task) {
    return new Promise(function (resolve, reject) {
      pending.push({ task: task, resolve: resolve, reject: reject });
      pump();
    });
  }

  function pump() {
    while (running < config.concurrency && pending.length) {
      var job = pending.shift();
      running++;
      job.task()
        .then(job.resolve, job.reject)
        .then(function () { running--; pump(); });
    }
  }

  function callEndpoint(payload) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, config.timeout);
    return fetch(config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
      .then(function (r) {
        if (!r.ok) throw new Error('try-on failed: ' + r.status);
        return r.json();
      })
      .then(function (json) {
        if (!json.image) throw new Error('try-on returned no image');
        return json.image;
      })
      .finally(function () { clearTimeout(timer); });
  }

  var tryon = {
    configure: function (cfg) {
      Object.assign(config, cfg || {});
      config.enabled = !!config.endpoint;
      return config;
    },

    available: function () { return !!config.endpoint; },

    config: function () { return Object.assign({}, config); },

    /* Dress a person in one outfit, reusing every cached step.
       `personImage` is a photo of whoever is modelling — the
       user's own front shot, or one of your house models. */
    generate: function (outfit, personImage, personKey, onProgress) {
      if (!config.endpoint) return Promise.reject(new Error('No try-on endpoint configured'));
      if (!personImage) return Promise.reject(new Error('No person image'));

      personKey = personKey || 'me';
      var chain = steps(outfit);
      if (!chain.length) return Promise.resolve(personImage);

      /* Walk back from the full outfit to the longest prefix we
         already have, so we only pay for what changed. */
      var startAt = 0;
      var current = personImage;
      for (var i = chain.length; i > 0; i--) {
        var cached = SM.images.getWorn(cacheKey(personKey, chain.slice(0, i)), 'chain');
        if (cached) { current = cached; startAt = i; break; }
      }

      var promise = Promise.resolve(current);
      chain.slice(startAt).forEach(function (item, offset) {
        promise = promise.then(function (personSoFar) {
          if (onProgress) onProgress(startAt + offset + 1, chain.length, item);
          var garment = SM.images.get(item, 'product');
          if (!garment) return personSoFar;   // nothing to composite from
          return schedule(function () {
            return callEndpoint({
              person: personSoFar,
              garment: garment,
              category: item.category,
              name: item.name
            });
          }).then(function (url) {
            SM.images.setWorn(cacheKey(personKey, chain.slice(0, startAt + offset + 1)), 'chain', url);
            return url;
          });
        });
      });

      return promise.then(function (finalImage) {
        SM.images.setWorn(outfit.id, personKey, finalImage);
        return finalImage;
      });
    },

    /* Warm the cache for outfits the person is about to scroll
       past. Failures are deliberately silent — this is a nicety,
       not something the feed should wait on. */
    prefetch: function (outfits, personImage, personKey) {
      if (!config.endpoint || !personImage) return;
      outfits.forEach(function (outfit) {
        if (SM.images.getWorn(outfit.id, personKey || 'me')) return;
        tryon.generate(outfit, personImage, personKey).catch(function () {});
      });
    },

    pendingCount: function () { return pending.length + running; }
  };

  SM.tryon = tryon;
})(window.SM);
