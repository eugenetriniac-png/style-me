/* ============================================================
   STYLE ME — materials.js

   Real fabric needs real texture. Every material here is drawn
   pixel by pixel onto an offscreen canvas once at start-up, then
   exposed as an SVG <pattern>. Garments paint the colour first,
   then blend the tile on top in "overlay" mode: the weave, grain
   and pile show through without shifting the hue.

   Generating the tiles once and reusing them as images keeps this
   cheap — SVG turbulence filters look similar but re-run on every
   repaint and stall a scrolling feed.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  /* ---------- deterministic noise ------------------------------ */
  function permutation(seed) {
    var p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    var s = seed >>> 0;
    for (i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      var j = s % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t;
    }
    var perm = new Uint8Array(512);
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    return perm;
  }

  function makeNoise(seed) {
    var perm = permutation(seed);
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function grad(h, x, y) {
      switch (h & 3) {
        case 0: return x + y;
        case 1: return -x + y;
        case 2: return x - y;
        default: return -x - y;
      }
    }
    /* Tiling noise: the lattice wraps on `period` so the finished
       tile repeats without a visible seam. */
    return function (x, y, period) {
      var X = Math.floor(x), Y = Math.floor(y);
      var xf = x - X, yf = y - Y;
      var x0 = ((X % period) + period) % period, x1 = (x0 + 1) % period;
      var y0 = ((Y % period) + period) % period, y1 = (y0 + 1) % period;
      var u = fade(xf), v = fade(yf);
      var aa = perm[perm[x0] + y0], ab = perm[perm[x0] + y1];
      var ba = perm[perm[x1] + y0], bb = perm[perm[x1] + y1];
      var n0 = grad(aa, xf, yf), n1 = grad(ba, xf - 1, yf);
      var n2 = grad(ab, xf, yf - 1), n3 = grad(bb, xf - 1, yf - 1);
      return (n0 + u * (n1 - n0)) * (1 - v) + (n2 + u * (n3 - n2)) * v;
    };
  }

  function fbm(noise, x, y, period, octaves, gain) {
    var sum = 0, amp = 1, freq = 1, norm = 0;
    for (var o = 0; o < octaves; o++) {
      sum += noise(x * freq, y * freq, period * freq) * amp;
      norm += amp;
      amp *= (gain || 0.5);
      freq *= 2;
    }
    return sum / norm;
  }

  /* ---------- tile helpers ------------------------------------- */
  var SIZE = 128;

  function blank() {
    var c = document.createElement('canvas');
    c.width = c.height = SIZE;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';         // neutral for overlay blending
    ctx.fillRect(0, 0, SIZE, SIZE);
    return { c: c, ctx: ctx };
  }

  /* Per-pixel pass. `fn(x, y)` returns -1…1; 0 leaves the colour
     untouched, negative darkens, positive lightens. */
  function pixels(ctx, fn, strength) {
    var img = ctx.getImageData(0, 0, SIZE, SIZE);
    var d = img.data;
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        var i = (y * SIZE + x) * 4;
        var v = 128 + fn(x, y) * strength;
        v = v < 0 ? 0 : v > 255 ? 255 : v;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /* Draw a stroke and its wrapped copies so nothing breaks at the
     tile edge. */
  function wrapped(ctx, fn) {
    var offsets = [-SIZE, 0, SIZE];
    offsets.forEach(function (dx) {
      offsets.forEach(function (dy) {
        ctx.save();
        ctx.translate(dx, dy);
        fn(ctx);
        ctx.restore();
      });
    });
  }

  function line(ctx, x1, y1, x2, y2, w, shade, alpha) {
    ctx.strokeStyle = shade;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ============================================================
     The materials. `unit` is how many SVG user units one tile
     covers — it sets the apparent scale of the weave.
     ============================================================ */
  var RECIPES = {

    cotton: { unit: 46, build: function (ctx) {
      var n = makeNoise(11);
      pixels(ctx, function (x, y) {
        var weave = ((x >> 1) + (y >> 1)) % 2 ? 0.5 : -0.5;
        return weave * 0.5 + fbm(n, x / 12, y / 12, 11, 3) * 1.4;
      }, 13);
    }},

    jersey: { unit: 40, build: function (ctx) {
      var n = makeNoise(23);
      pixels(ctx, function (x, y) {
        var loop = Math.sin(x * Math.PI / 4) * Math.cos(y * Math.PI / 5);
        return loop * 0.45 + fbm(n, x / 9, y / 9, 15, 3) * 1.2;
      }, 14);
    }},

    denim: { unit: 52, build: function (ctx) {
      var n = makeNoise(37);
      /* Twill: the weft passes over two warp threads then under
         one, which is what makes the diagonal ridge. */
      pixels(ctx, function (x, y) {
        var twill = ((x + y * 2) % 6) < 3 ? 0.85 : -0.85;
        var warp = Math.sin(x * Math.PI / 2) * 0.25;
        return twill + warp + fbm(n, x / 7, y / 7, 19, 4) * 1.1;
      }, 15);
      /* A few pale slubs, the way indigo cotton actually wears */
      var r = makeNoise(91);
      wrapped(ctx, function (c) {
        for (var i = 0; i < 26; i++) {
          var x = ((r(i * 3.1, 1, 32) + 1) / 2) * SIZE;
          var y = ((r(1, i * 2.7, 32) + 1) / 2) * SIZE;
          line(c, x, y, x + 5, y - 9, 1.2, '#ffffff', 0.16);
        }
      });
    }},

    wool: { unit: 44, build: function (ctx) {
      var n = makeNoise(53), m = makeNoise(54);
      pixels(ctx, function (x, y) {
        return fbm(n, x / 5, y / 5, 26, 4) * 1.5 + fbm(m, x / 18, y / 18, 8, 2) * 0.7;
      }, 16);
    }},

    knit: { unit: 34, build: function (ctx) {
      var n = makeNoise(67);
      pixels(ctx, function (x, y) {
        return fbm(n, x / 8, y / 8, 16, 3) * 0.9;
      }, 9);
      /* Rows of stitches: each loop is a small chevron. */
      wrapped(ctx, function (c) {
        c.lineCap = 'round';
        for (var row = 0; row < SIZE; row += 16) {
          for (var col = 0; col < SIZE; col += 13) {
            var ox = (row / 16) % 2 ? 6 : 0;
            c.strokeStyle = '#000';
            c.globalAlpha = 0.2;
            c.lineWidth = 2.4;
            c.beginPath();
            c.moveTo(col + ox, row + 12);
            c.quadraticCurveTo(col + ox + 6.5, row - 3, col + ox + 13, row + 12);
            c.stroke();
            c.strokeStyle = '#fff';
            c.globalAlpha = 0.17;
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(col + ox, row + 14.5);
            c.quadraticCurveTo(col + ox + 6.5, row - 0.5, col + ox + 13, row + 14.5);
            c.stroke();
          }
        }
        c.globalAlpha = 1;
      });
    }},

    rib: { unit: 30, build: function (ctx) {
      var n = makeNoise(71);
      pixels(ctx, function (x, y) {
        /* Rounded vertical columns — the shading is what makes a
           rib read as raised rather than striped. */
        var rib = Math.cos((x % 10) / 10 * Math.PI * 2);
        return rib * 1.15 + fbm(n, x / 10, y / 6, 12, 2) * 0.5;
      }, 17);
    }},

    leather: { unit: 88, build: function (ctx) {
      var n = makeNoise(83), m = makeNoise(84);
      /* Grain is cellular: wide soft cells with fine pores inside. */
      pixels(ctx, function (x, y) {
        var cell = fbm(n, x / 16, y / 16, 8, 3, 0.62);
        var pore = fbm(m, x / 2.2, y / 2.2, 58, 2);
        var creased = Math.abs(cell) < 0.09 ? -1 : cell * 0.5;
        return creased * 0.9 + pore * 0.5;
      }, 15);
      /* Broad specular sweep — leather always catches one light. */
      var g = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      g.addColorStop(0, 'rgba(255,255,255,0.16)');
      g.addColorStop(0.42, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }},

    suede: { unit: 54, build: function (ctx) {
      var n = makeNoise(97), m = makeNoise(98);
      pixels(ctx, function (x, y) {
        var nap = fbm(n, x / 2.6, y / 1.6, 50, 3);
        return nap * 1.3 + fbm(m, x / 22, y / 22, 6, 2) * 0.8;
      }, 12);
    }},

    linen: { unit: 44, build: function (ctx) {
      var n = makeNoise(101);
      pixels(ctx, function (x, y) {
        return fbm(n, x / 14, y / 14, 10, 3) * 1.1;
      }, 9);
      /* Irregular thick threads in both directions — the slubs are
         the whole character of linen. */
      var r = makeNoise(103);
      wrapped(ctx, function (c) {
        for (var i = 0; i < SIZE; i += 3) {
          var t = (r(i / 7, 0.5, 20) + 1) / 2;
          line(c, 0, i, SIZE, i + (t - 0.5) * 2, 1 + t * 1.6, t > 0.55 ? '#fff' : '#000', 0.13);
          var u = (r(0.5, i / 7, 20) + 1) / 2;
          line(c, i, 0, i + (u - 0.5) * 2, SIZE, 1 + u * 1.4, u > 0.6 ? '#fff' : '#000', 0.11);
        }
      });
    }},

    silk: { unit: 120, build: function (ctx) {
      var n = makeNoise(109);
      pixels(ctx, function (x, y) {
        return fbm(n, x / 30, y / 8, 5, 2) * 1.1;
      }, 10);
      var g = ctx.createLinearGradient(0, SIZE, SIZE, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.10)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.08)');
      g.addColorStop(0.85, 'rgba(255,255,255,0.14)');
      g.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }},

    nylon: { unit: 58, build: function (ctx) {
      var n = makeNoise(127);
      pixels(ctx, function (x, y) {
        var weave = ((x + y) % 3) ? 0.3 : -0.3;
        return weave + fbm(n, x / 6, y / 6, 21, 2) * 0.6;
      }, 8);
      /* Ripstop grid: reinforcing threads every few millimetres. */
      wrapped(ctx, function (c) {
        for (var i = 0; i < SIZE; i += 16) {
          line(c, i, 0, i, SIZE, 1.6, '#fff', 0.17);
          line(c, 0, i, SIZE, i, 1.6, '#fff', 0.17);
          line(c, i + 1.4, 0, i + 1.4, SIZE, 1, '#000', 0.13);
          line(c, 0, i + 1.4, SIZE, i + 1.4, 1, '#000', 0.13);
        }
      });
    }},

    corduroy: { unit: 34, build: function (ctx) {
      var n = makeNoise(131);
      pixels(ctx, function (x, y) {
        var wale = Math.cos((x % 11) / 11 * Math.PI * 2);
        var pile = fbm(n, x / 3, y / 1.4, 42, 2);
        return wale * 1.35 + pile * 0.55;
      }, 19);
    }},

    velvet: { unit: 64, build: function (ctx) {
      var n = makeNoise(137), m = makeNoise(139);
      pixels(ctx, function (x, y) {
        var pile = fbm(n, x / 2, y / 1.2, 64, 3);
        var sheen = fbm(m, x / 26, y / 20, 5, 2);
        return pile * 0.9 + sheen * 1.5;
      }, 14);
    }},

    canvas: { unit: 40, build: function (ctx) {
      var n = makeNoise(149);
      pixels(ctx, function (x, y) {
        /* Basket weave: pairs of threads over pairs. */
        var bx = (x >> 2) % 2, by = (y >> 2) % 2;
        var weave = bx === by ? 0.9 : -0.9;
        return weave + fbm(n, x / 8, y / 8, 16, 3) * 0.9;
      }, 13);
    }},

    tweed: { unit: 50, build: function (ctx) {
      var n = makeNoise(151);
      pixels(ctx, function (x, y) {
        var twill = ((x + y * 2) % 8) < 4 ? 0.5 : -0.5;
        return twill + fbm(n, x / 6, y / 6, 21, 3) * 1.2;
      }, 14);
      var r = makeNoise(157);
      wrapped(ctx, function (c) {
        for (var i = 0; i < 40; i++) {
          var x = ((r(i * 1.7, 2, 32) + 1) / 2) * SIZE;
          var y = ((r(2, i * 1.9, 32) + 1) / 2) * SIZE;
          c.fillStyle = i % 2 ? '#ffffff' : '#000000';
          c.globalAlpha = 0.2;
          c.beginPath();
          c.ellipse(x, y, 2.4, 1.3, i, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      });
    }},

    fleece: { unit: 56, build: function (ctx) {
      var n = makeNoise(163);
      pixels(ctx, function (x, y) {
        return fbm(n, x / 6, y / 6, 21, 4, 0.62) * 1.6;
      }, 15);
    }}
  };

  /* ---------- build & expose ----------------------------------- */
  var TILES = {};
  var ready = false;

  SM.materials = {
    keys: Object.keys(RECIPES),

    init: function () {
      if (ready) return;
      Object.keys(RECIPES).forEach(function (key) {
        var t = blank();
        RECIPES[key].build(t.ctx);
        TILES[key] = { url: t.c.toDataURL('image/png'), unit: RECIPES[key].unit };
      });
      ready = true;
    },

    unit: function (key) {
      return (TILES[key] || TILES.cotton).unit;
    },

    /* One <defs> block, injected once per SVG document. */
    defs: function () {
      SM.materials.init();
      return Object.keys(TILES).map(function (key) {
        var t = TILES[key];
        return '<pattern id="fab-' + key + '" width="' + t.unit + '" height="' + t.unit +
          '" patternUnits="userSpaceOnUse">' +
          '<image href="' + t.url + '" width="' + t.unit + '" height="' + t.unit + '"/>' +
          '</pattern>';
      }).join('');
    },

    fill: function (key) {
      return 'url(#fab-' + (TILES[key] ? key : 'cotton') + ')';
    },

    /* The blended pass that sits on top of a coloured shape. */
    overlay: function (d, key, opacity) {
      return '<path d="' + d + '" fill="' + SM.materials.fill(key) +
        '" opacity="' + (opacity === undefined ? 1 : opacity) +
        '" style="mix-blend-mode:overlay" pointer-events="none"/>';
    }
  };
})(window.SM);
