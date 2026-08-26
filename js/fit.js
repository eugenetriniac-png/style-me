/* ============================================================
   STYLE ME — fit.js

   Garments fitted to the figure. Everything is derived from the
   same skeleton the body uses, so a piece follows the pose, the
   build and the height rather than being pasted on top.

   The result is grouped into five independent layers:

       bottom · top · shoes · outer · accessory

   so a single piece can be swapped without redrawing the rest —
   updateLayer() rewrites one group and leaves the others exactly
   as they were.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var C = SM.color;
  var P = SM.P;
  var shade = C.shade, warm = C.warm, lum = C.luminance;
  var limbPath = null;   // resolved lazily from SM.figure

  var LAYERS = ['bottom', 'top', 'shoes', 'outer', 'accessory'];
  SM.FIT_LAYERS = LAYERS;

  function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  function edgeOf(item) {
    return lum(item.colour) > 0.45 ? shade(item.colour, -0.42) : shade(item.colour, -0.58);
  }

  /* Cloth on the body: ramp, weave, edge, plus creases clipped to
     the piece so the shading never spills past the silhouette. */
  function piece(paint, item, d, opt) {
    opt = opt || {};
    var fill = paint.cylinder(opt.colour || item.colour, { gloss: opt.gloss || item.material === 'leather' || item.material === 'silk' });
    var out = '<path d="' + d + '" fill="' + fill + '"/>' +
      SM.materials.overlay(d, item.material, opt.texture === undefined ? 0.95 : opt.texture);
    if (opt.creases) {
      out += '<g clip-path="url(#' + paint.clip(d) + ')">' + opt.creases + '</g>';
    }
    out += '<path d="' + d + '" fill="none" stroke="' + (opt.edge || edgeOf(item)) +
      '" stroke-opacity=".65" stroke-width="' + (opt.edgeWidth || 2) + '" stroke-linejoin="round"/>';
    return out;
  }

  function crease(d, item, w, strength) {
    var dark = shade(item.colour, -0.55);
    var s = strength === undefined ? 1 : strength;
    return '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-opacity="' + (0.08 * s) +
      '" stroke-width="' + (w * 3) + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-opacity="' + (0.12 * s) +
      '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  function sheen(d, item, w) {
    return '<path d="' + d + '" fill="none" stroke="' + warm(item.colour, 0.45) +
      '" stroke-opacity=".18" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  /* ---------- shells derived from the skeleton ------------------ */

  /* Torso with ease added — the gap between body and cloth. */
  function torsoShell(sk, o) {
    var ease = o.ease === undefined ? 12 : o.ease;
    var cxS = sk.cx + sk.shoulderOff, cxW = sk.cx + sk.waistOff, cxH = sk.cx + sk.hipOff;
    var sh = sk.shoulderHalf + ease * 0.5;
    var bu = sk.bustHalf + ease;
    var wa = sk.waistHalf + ease * (o.fitted ? 0.8 : 1.9);
    var hi = sk.hipHalf + ease;
    var hemY = o.hemY;
    var hemHalf = o.hemHalf || Math.max(bu, wa) + (o.flare || 0);
    var nh = o.neckHalf === undefined ? sk.neckHalf + 6 : o.neckHalf;
    var nd = sk.neckBase + (o.neckDrop === undefined ? 12 : o.neckDrop);
    var shY = sk.shoulderY + 4;

    var p = P()
      .M(cxS - sh, shY)
      .C(cxS - sh - 4, shY + 40, cxS - bu - 6, sk.armpitY - 10, cxS - bu, sk.bustY + 16)
      .C(cxW - bu + 4, sk.waistY - 56, cxW - wa - 2, sk.waistY - 22, cxW - wa, sk.waistY + 10)
      .C(cxH - wa - 8, sk.waistY + 52, cxH - hi + 4, sk.hipY - 28, cxH - hemHalf, hemY - 18)
      .C(cxH - hemHalf * 0.5, hemY + 10, cxH + hemHalf * 0.5, hemY + 10, cxH + hemHalf, hemY - 18)
      .C(cxH + hi - 4, sk.hipY - 28, cxW + wa + 8, sk.waistY + 52, cxW + wa, sk.waistY + 10)
      .C(cxW + wa + 2, sk.waistY - 22, cxS + bu + 6, sk.waistY - 56, cxS + bu, sk.bustY + 16)
      .C(cxS + bu + 6, sk.armpitY - 10, cxS + sh + 4, shY + 40, cxS + sh, shY);
    if (o.vNeck) {
      p.L(cxS + nh, shY + 6).L(cxS, nd + 30).L(cxS - nh, shY + 6);
    } else {
      p.C(cxS + sh - 24, shY - 10, cxS + nh + 10, nd - 12, cxS + nh, nd)
       .C(cxS + nh * 0.5, nd + 12, cxS - nh * 0.5, nd + 12, cxS - nh, nd)
       .C(cxS - nh - 10, nd - 12, cxS - sh + 24, shY - 10, cxS - sh, shY);
    }
    return p.Z().d();
  }

  /* A sleeve needs a rounded sleeve head over the shoulder. Cutting
     it off square is the single thing that makes fitted clothing
     look like cardboard stuck to the sides of a figure. */
  function sleeveShell(sk, arm, long, ease) {
    var a = arm.shoulder;
    var wA = sk.upperArmW + ease, b, c, wB, wC;
    if (long) {
      b = arm.elbow; c = arm.wrist;
      wB = sk.forearmW + ease; wC = sk.forearmW + ease * 0.6;
    } else {
      b = lerp(a, arm.elbow, 0.32); c = lerp(a, arm.elbow, 0.64);
      wB = wA * 0.99; wC = wA * 0.94;
    }
    var cap = wA * 0.5;
    return P()
      .M(a.x - wA, a.y)
      .C(a.x - wA, a.y - cap, a.x + wA, a.y - cap, a.x + wA, a.y)
      .C(a.x + wA + 2, a.y + (b.y - a.y) * 0.4, b.x + wB + 3, b.y - (b.y - a.y) * 0.35, b.x + wB, b.y)
      .C(b.x + wB + 1, b.y + (c.y - b.y) * 0.4, c.x + wC + 2, c.y - (c.y - b.y) * 0.3, c.x + wC, c.y)
      .C(c.x + wC * 0.4, c.y + wC * 0.5, c.x - wC * 0.4, c.y + wC * 0.5, c.x - wC, c.y)
      .C(c.x - wC - 2, c.y - (c.y - b.y) * 0.3, b.x - wB - 1, b.y + (c.y - b.y) * 0.4, b.x - wB, b.y)
      .C(b.x - wB - 3, b.y - (b.y - a.y) * 0.35, a.x - wA - 2, a.y + (b.y - a.y) * 0.4, a.x - wA, a.y)
      .Z().d();
  }

  /* Hips and seat, so trousers do not float on the thighs. */
  function seatShell(sk, ease, topY) {
    var cxH = sk.cx + sk.hipOff, hi = sk.hipHalf + ease;
    return P().M(cxH - hi, topY)
      .C(cxH - hi - 2, sk.hipY, cxH - hi * 0.8, sk.crotchY + 16, cxH - 12, sk.crotchY + 46)
      .C(cxH - 5, sk.crotchY + 34, cxH + 5, sk.crotchY + 34, cxH + 12, sk.crotchY + 46)
      .C(cxH + hi * 0.8, sk.crotchY + 16, cxH + hi + 2, sk.hipY, cxH + hi, topY)
      .C(cxH + hi * 0.5, topY - 12, cxH - hi * 0.5, topY - 12, cxH - hi, topY)
      .Z().d();
  }

  /* ============================================================
     Layer renderers
     ============================================================ */

  function renderTop(sk, item, paint) {
    var o = item.opts || {};
    var shape = item.shape;
    var long = shape === 'knit' || shape === 'hoodie' || shape === 'shirt' || o.long;
    var ease = shape === 'hoodie' ? 15 : shape === 'knit' ? 11 : shape === 'shirt' ? 9 : o.boxy ? 11 : 7;
    var hemY = sk.hipY + (shape === 'hoodie' ? 34 : shape === 'shirt' ? 42 : 22);
    var out = '';

    /* Hood behind the shoulders. */
    if (shape === 'hoodie' && !o.crew) {
      /* Bunched behind the neck, sitting on the shoulders — not
         pulled up over the head. */
      var cxS = sk.cx + sk.shoulderOff;
      var hood = P().M(cxS - 54, sk.neckBase + 30)
        .C(cxS - 66, sk.neckBase - 22, cxS + 66, sk.neckBase - 22, cxS + 54, sk.neckBase + 30)
        .C(cxS + 28, sk.neckBase + 50, cxS - 28, sk.neckBase + 50, cxS - 54, sk.neckBase + 30)
        .Z().d();
      out += piece(paint, item, hood, { colour: shade(item.colour, -0.1) });
    }

    if (!o.sleeveless && shape !== 'tank') {
      out += piece(paint, item, sleeveShell(sk, sk.arms.left, long, ease), { colour: shade(item.colour, -0.08) });
      out += piece(paint, item, sleeveShell(sk, sk.arms.right, long, ease));
    }

    var body = torsoShell(sk, {
      ease: ease,
      hemY: hemY,
      neckDrop: shape === 'knit' && o.turtle ? -22 : shape === 'hoodie' ? 20 : 14,
      neckHalf: shape === 'tank' ? sk.neckHalf + 18 : sk.neckHalf + 7,
      vNeck: o.collar === 'v'
    });
    var creases =
      crease(P().M(sk.cx - sk.bustHalf + 12, sk.bustY + 20).C(sk.cx - 30, sk.waistY - 20, sk.cx - 34, sk.waistY + 40, sk.cx - 26, hemY - 10).d(), item, 7) +
      crease(P().M(sk.cx + sk.bustHalf - 10, sk.bustY + 26).C(sk.cx + 34, sk.waistY - 10, sk.cx + 36, sk.waistY + 40, sk.cx + 28, hemY - 10).d(), item, 7) +
      sheen(P().M(sk.cx - sk.bustHalf * 0.5, sk.bustY + 10).C(sk.cx - sk.bustHalf * 0.55, sk.waistY, sk.cx - sk.bustHalf * 0.5, sk.waistY + 60, sk.cx - sk.bustHalf * 0.45, hemY - 16).d(), item, 22);
    out += piece(paint, item, body, { creases: creases });

    /* Collar treatments. */
    var nd = sk.neckBase + 14;
    if (shape === 'knit' && o.turtle) {
      out += piece(paint, item, P().M(sk.cx + sk.shoulderOff - sk.neckHalf - 8, sk.neckBase - 10)
        .C(sk.cx + sk.shoulderOff - sk.neckHalf - 6, sk.chin + 2, sk.cx + sk.shoulderOff + sk.neckHalf + 6, sk.chin + 2, sk.cx + sk.shoulderOff + sk.neckHalf + 8, sk.neckBase - 10)
        .C(sk.cx + sk.shoulderOff + sk.neckHalf, sk.neckBase + 10, sk.cx + sk.shoulderOff - sk.neckHalf, sk.neckBase + 10, sk.cx + sk.shoulderOff - sk.neckHalf - 8, sk.neckBase - 10)
        .Z().d(), { colour: shade(item.colour, -0.05) });
    } else if (shape === 'shirt') {
      var cxS2 = sk.cx + sk.shoulderOff;
      [-1, 1].forEach(function (side) {
        out += piece(paint, item, P().M(cxS2 + side * (sk.neckHalf + 4), sk.neckBase + 2)
          .C(cxS2 + side * (sk.neckHalf + 20), sk.neckBase + 10, cxS2 + side * (sk.neckHalf + 20), sk.neckBase + 24, cxS2 + side * 12, nd + 30)
          .L(cxS2 + side * 3, nd + 4).Z().d(), { colour: shade(item.colour, 0.05) });
      });
      out += '<path d="' + P().M(sk.cx + sk.shoulderOff, nd + 20).L(sk.cx + sk.waistOff, hemY - 8).d() +
        '" fill="none" stroke="' + edgeOf(item) + '" stroke-opacity=".5" stroke-width="1.6"/>';
    }
    return out;
  }

  function renderOuter(sk, item, paint) {
    var shape = item.shape;
    var longCoat = shape === 'coat' || shape === 'trench';
    var ease = shape === 'puffer' ? 20 : longCoat ? 15 : 12;
    var hemY = longCoat ? sk.kneeY + 40 : shape === 'blazer' || shape === 'cardigan' ? sk.hipY + 46 : sk.hipY + 16;
    var out = '';

    out += piece(paint, item, sleeveShell(sk, sk.arms.left, true, ease), { colour: shade(item.colour, -0.1) });
    out += piece(paint, item, sleeveShell(sk, sk.arms.right, true, ease));

    /* Back panel between the open fronts. */
    var shell = torsoShell(sk, { ease: ease, hemY: hemY, neckDrop: 6, neckHalf: sk.neckHalf + 12 });
    out += '<path d="' + shell + '" fill="' + shade(item.colour, -0.55) + '"/>';

    var cxS = sk.cx + sk.shoulderOff;
    var gap = shape === 'puffer' ? 5 : 9;
    var clipId = paint.clip(shell);
    [-1, 1].forEach(function (side) {
      var front = P()
        .M(cxS + side * (sk.shoulderHalf + ease), sk.shoulderY)
        .L(cxS + side * (sk.hipHalf + ease + 14), hemY + 20)
        .L(cxS + side * gap, hemY + 20)
        .L(cxS + side * gap, sk.neckBase + (shape === 'blazer' || longCoat ? 70 : 14))
        .L(cxS + side * (sk.neckHalf + 14), sk.neckBase + 2)
        .Z().d();
      out += '<g clip-path="url(#' + clipId + ')">' +
        piece(paint, item, front, {
          creases: crease(P().M(cxS + side * (sk.bustHalf + ease - 16), sk.bustY + 30)
            .C(cxS + side * 60, sk.waistY, cxS + side * 66, sk.waistY + 80, cxS + side * 54, hemY - 20).d(), item, 8)
        }) + '</g>';
    });

    /* Collar or lapels. */
    if (shape === 'blazer' || longCoat) {
      [-1, 1].forEach(function (side) {
        out += piece(paint, item, P()
          .M(cxS + side * (sk.neckHalf + 14), sk.neckBase + 2)
          .L(cxS + side * gap, sk.neckBase + 70)
          .L(cxS + side * (gap + 30), sk.neckBase + 52)
          .L(cxS + side * (sk.neckHalf + 26), sk.neckBase + 14)
          .Z().d(), { colour: shade(item.colour, 0.08) });
      });
    }
    out += piece(paint, item, P()
      .M(cxS - sk.neckHalf - 16, sk.neckBase + 6)
      .C(cxS - 14, sk.neckBase - 20, cxS + 14, sk.neckBase - 20, cxS + sk.neckHalf + 16, sk.neckBase + 6)
      .C(cxS + 12, sk.neckBase + 22, cxS - 12, sk.neckBase + 22, cxS - sk.neckHalf - 16, sk.neckBase + 6)
      .Z().d(), { colour: shade(item.colour, 0.04) });

    if (shape === 'puffer') {
      var inner = '';
      for (var y = sk.shoulderY + 40; y < hemY - 10; y += 46) {
        inner += crease(P().M(cxS - sk.bustHalf - ease - 6, y).C(cxS - 30, y + 8, cxS + 30, y + 8, cxS + sk.bustHalf + ease + 6, y).d(), item, 8, 1.6);
      }
      out += '<g clip-path="url(#' + clipId + ')">' + inner + '</g>';
    }
    return out;
  }

  function renderBottom(sk, item, paint) {
    var o = item.opts || {};
    var shape = item.shape;
    if (shape === 'skirt') return renderSkirt(sk, item, paint);

    var shorts = shape === 'shorts';
    var wide = (o.hemHalf || 100) > 120;
    var ease = wide ? 22 : shape === 'joggers' ? 12 : 10;
    var hemY = shorts ? sk.crotchY + (sk.kneeY - sk.crotchY) * 0.55 : sk.ankleY + 6;
    var out = '';

    ['left', 'right'].forEach(function (key) {
      var leg = sk.legs[key];
      var far = key === 'left';
      var ankle = { x: leg.ankle.x, y: hemY };
      var wHip = sk.thighHalf + ease;
      var wKnee = sk.kneeHalf + ease * (wide ? 1.5 : 1);
      var wHem = shorts ? sk.kneeHalf + ease * 1.4
        : (shape === 'joggers' ? sk.ankleHalf + 8 : sk.ankleHalf + ease * (wide ? 2.4 : 1.4));
      var d = limbPath(leg.hip, shorts ? lerp(leg.hip, leg.knee, 0.6) : leg.knee, ankle, wHip, wKnee, wHem);
      out += piece(paint, item, d, {
        colour: far ? shade(item.colour, -0.08) : item.colour,
        creases:
          crease(P().M(leg.knee.x - wKnee + 6, leg.knee.y - 60).C(leg.knee.x - 10, leg.knee.y, leg.knee.x - 6, leg.knee.y + 70, ankle.x - wHem + 8, hemY - 14).d(), item, 7) +
          crease(P().M(leg.knee.x + wKnee - 8, leg.knee.y - 90).C(leg.knee.x + 16, leg.knee.y - 10, leg.knee.x + 12, leg.knee.y + 60, ankle.x + wHem - 10, hemY - 16).d(), item, 6, 0.8) +
          sheen(P().M(leg.hip.x - 6, leg.hip.y + 30).C(leg.knee.x - 4, leg.knee.y - 40, leg.knee.x - 2, leg.knee.y + 60, ankle.x, hemY - 20).d(), item, 16)
      });
      if (o.cuff) {
        out += piece(paint, item, P().M(ankle.x - wHem, hemY - 26).L(ankle.x + wHem, hemY - 26)
          .L(ankle.x + wHem - 1, hemY).L(ankle.x - wHem + 1, hemY).Z().d(),
          { colour: shade(item.colour, -0.12) });
      }
    });

    var seatTop = sk.hipY - (shape === 'joggers' ? 34 : 42);
    out += piece(paint, item, seatShell(sk, ease, seatTop), {
      creases: crease(P().M(sk.cx + sk.hipOff + 6, seatTop + 20).C(sk.cx + sk.hipOff + 12, sk.hipY, sk.cx + sk.hipOff + 8, sk.crotchY - 20, sk.cx + sk.hipOff + 4, sk.crotchY + 6).d(), item, 6, 0.8)
    });
    /* Waistband */
    out += piece(paint, item, P()
      .M(sk.cx + sk.hipOff - sk.hipHalf - ease + 2, seatTop)
      .C(sk.cx + sk.hipOff - 30, seatTop - 12, sk.cx + sk.hipOff + 30, seatTop - 12, sk.cx + sk.hipOff + sk.hipHalf + ease - 2, seatTop)
      .L(sk.cx + sk.hipOff + sk.hipHalf + ease - 2, seatTop + 22)
      .C(sk.cx + sk.hipOff + 30, seatTop + 12, sk.cx + sk.hipOff - 30, seatTop + 12, sk.cx + sk.hipOff - sk.hipHalf - ease + 2, seatTop + 22)
      .Z().d(), { colour: shade(item.colour, 0.06) });
    return out;
  }

  function renderSkirt(sk, item, paint) {
    var o = item.opts || {};
    var mini = (o.hemY || 660) < 520;
    var hemY = mini ? sk.crotchY + (sk.kneeY - sk.crotchY) * 0.45 : sk.kneeY + 30;
    var cxH = sk.cx + sk.hipOff;
    var top = sk.hipY - 46;
    var hi = sk.hipHalf + 12;
    var flare = mini ? 14 : 46;
    var d = P()
      .M(cxH - hi, top)
      .C(cxH - hi - 6, sk.hipY + 20, cxH - hi - flare * 0.5, hemY - 90, cxH - hi - flare, hemY - 12)
      .C(cxH - hi * 0.5, hemY + 16, cxH + hi * 0.5, hemY + 16, cxH + hi + flare, hemY - 12)
      .C(cxH + hi + flare * 0.5, hemY - 90, cxH + hi + 6, sk.hipY + 20, cxH + hi, top)
      .C(cxH + hi * 0.5, top - 12, cxH - hi * 0.5, top - 12, cxH - hi, top)
      .Z().d();
    var inner = '';
    for (var i = -3; i <= 3; i++) {
      inner += crease(P().M(cxH + i * 18, top + 20).C(cxH + i * 26, sk.hipY + 60, cxH + i * 32, hemY - 80, cxH + i * 38, hemY - 6).d(), item, 7, o.pleated ? 1.4 : 0.8);
    }
    return piece(paint, item, d, { creases: inner });
  }

  function renderDress(sk, item, paint) {
    var o = item.opts || {};
    var hemY = sk.kneeY + 28;
    var body = torsoShell(sk, {
      ease: 12, hemY: hemY, hemHalf: sk.hipHalf + 54,
      neckDrop: o.strap ? 34 : 14,
      neckHalf: o.strap ? sk.neckHalf + 22 : sk.neckHalf + 8,
      fitted: true
    });
    var inner = '';
    for (var i = -3; i <= 3; i++) {
      inner += crease(P().M(sk.cx + i * 16, sk.waistY).C(sk.cx + i * 26, sk.hipY + 40, sk.cx + i * 34, hemY - 90, sk.cx + i * 42, hemY - 10).d(), item, 8, 0.9) +
        sheen(P().M(sk.cx + i * 16 + 8, sk.waistY + 20).C(sk.cx + i * 26 + 10, sk.hipY + 40, sk.cx + i * 34 + 12, hemY - 90, sk.cx + i * 42 + 14, hemY - 20).d(), item, 10);
    }
    var out = '';
    if (!o.strap) {
      out += piece(paint, item, sleeveShell(sk, sk.arms.left, o.long, 11), { colour: shade(item.colour, -0.08) });
      out += piece(paint, item, sleeveShell(sk, sk.arms.right, o.long, 11));
    }
    out += piece(paint, item, body, { creases: inner });
    if (o.strap) {
      var cxS = sk.cx + sk.shoulderOff;
      [-1, 1].forEach(function (side) {
        out += piece(paint, item, P().M(cxS + side * 22, sk.neckBase + 44).L(cxS + side * (sk.shoulderHalf - 16), sk.shoulderY - 2)
          .L(cxS + side * (sk.shoulderHalf - 6), sk.shoulderY + 4).L(cxS + side * 30, sk.neckBase + 48).Z().d());
      });
    }
    return out;
  }

  function renderShoes(sk, item, paint) {
    var o = item.opts || {};
    var shape = item.shape;
    var out = '';
    ['left', 'right'].forEach(function (key) {
      var leg = sk.legs[key];
      var far = key === 'left';
      var sign = key === 'right' ? 1 : -1;
      var x = leg.ankle.x + sign * 3;
      var w = sk.ankleHalf + 9;
      var sole = sk.soleY;
      var colour = far ? shade(item.colour, -0.1) : item.colour;

      if (shape === 'boot') {
        var shaftTop = o.tall ? sk.kneeY + 40 : sk.ankleY - 66;
        out += piece(paint, item, P()
          .M(x - w - 2, shaftTop)
          .C(x - w - 5, sk.ankleY, x - w - 6, sole - 16, x - w + 2, sole - 2)
          .L(x + w + sign * 16, sole - 2)
          .C(x + w + 6, sole - 22, x + w + 4, sk.ankleY, x + w + 2, shaftTop)
          .C(x + w * 0.4, shaftTop - 10, x - w * 0.4, shaftTop - 10, x - w - 2, shaftTop)
          .Z().d(), {
            colour: colour,
            creases: crease(P().M(x - w + 4, shaftTop + 20).C(x - 4, sk.ankleY - 20, x - 2, sk.ankleY + 10, x + 2, sole - 12).d(), item, 6)
          });
        out += '<path d="' + P().M(x - w - 4, sole - 12).L(x + w + sign * 18, sole - 12).L(x + w + sign * 18, sole).L(x - w - 4, sole).Z().d() +
          '" fill="' + shade(item.colour, -0.6) + '"/>';
      } else {
        var top = sk.ankleY + (shape === 'sandal' ? 12 : 2);
        out += piece(paint, item, P()
          .M(x - w, top)
          .C(x - w - 4, top + 22, x - w - 3, sole - 12, x - w + 3, sole - 8)
          .L(x + w + sign * 20, sole - 6)
          .C(x + w + sign * 22, sole - 20, x + w + 3, top + 16, x + w, top)
          .C(x + w * 0.4, top - 8, x - w * 0.4, top - 8, x - w, top)
          .Z().d(), { colour: colour });
        /* Sole unit */
        var soleColour = o.sole || shade(item.colour, -0.5);
        out += '<path d="' + P().M(x - w - 3, sole - 10).L(x + w + sign * 22, sole - 8)
          .C(x + w + sign * 24, sole + 2, x - w - 2, sole + 2, x - w - 3, sole - 10).Z().d() +
          '" fill="' + paint.cylinder(soleColour) + '"/>';
        if (shape === 'heel') {
          out += '<path d="' + P().M(x - w + 4, sole - 10).L(x - w + 12, sole - 10).L(x - w + 10, sole + 30).L(x - w + 2, sole + 30).Z().d() +
            '" fill="' + shade(item.colour, -0.2) + '"/>';
        }
        if (shape === 'sneaker') {
          out += '<path d="' + P().M(x - w + 2, top + 14).C(x - 2, top + 6, x + 4, top + 6, x + w - 2, top + 16).d() +
            '" fill="none" stroke="' + (o.lace || '#EFEAE0') + '" stroke-width="4" stroke-linecap="round"/>';
        }
      }
    });
    return out;
  }

  function renderAccessory(sk, item, paint) {
    var shape = item.shape;
    var cxS = sk.cx + sk.shoulderOff;
    var cy = sk.headCy, rx = sk.headRx, ry = sk.headRy;

    if (shape === 'cap') {
      var capY = cy - ry + 10;
      return piece(paint, item, P().M(cxS - rx - 3, capY + 16)
        .C(cxS - rx - 5, capY - 34, cxS + rx + 5, capY - 34, cxS + rx + 3, capY + 16)
        .C(cxS + rx * 0.5, capY + 24, cxS - rx * 0.5, capY + 24, cxS - rx - 3, capY + 16).Z().d()) +
        piece(paint, item, P().M(cxS - rx - 2, capY + 14).C(cxS - rx - 30, capY + 20, cxS - rx - 34, capY + 30, cxS - rx - 30, capY + 34)
          .C(cxS - rx - 4, capY + 30, cxS - rx + 4, capY + 26, cxS - rx + 2, capY + 20).Z().d(),
          { colour: shade(item.colour, -0.14) });
    }
    if (shape === 'beanie') {
      var bY = cy - ry + 12;
      return piece(paint, item, P().M(cxS - rx - 4, bY + 22)
        .C(cxS - rx - 6, bY - 38, cxS + rx + 6, bY - 38, cxS + rx + 4, bY + 22)
        .C(cxS + rx * 0.5, bY + 30, cxS - rx * 0.5, bY + 30, cxS - rx - 4, bY + 22).Z().d()) +
        '<rect x="' + (cxS - rx - 5) + '" y="' + (bY + 12) + '" width="' + (rx * 2 + 10) + '" height="18" rx="6" fill="' +
        paint.cylinder(shade(item.colour, -0.12)) + '"/>';
    }
    if (shape === 'sunglasses') {
      var eyeY = cy + ry * 0.06;
      var lensW = rx * 0.4, lensH = rx * 0.26;
      var s = '';
      [-1, 1].forEach(function (side) {
        var ex = cxS + side * rx * 0.42;
        s += '<rect x="' + (ex - lensW) + '" y="' + (eyeY - lensH) + '" width="' + (lensW * 2) + '" height="' + (lensH * 2) +
          '" rx="' + (lensH * 0.5) + '" fill="' + item.colour + '" opacity=".9"/>';
      });
      s += '<path d="M' + (cxS - 6) + ' ' + (eyeY - 2) + ' L' + (cxS + 6) + ' ' + (eyeY - 2) +
        '" stroke="' + item.colour + '" stroke-width="4"/>';
      return s;
    }
    if (shape === 'scarf') {
      var d = P().M(cxS - sk.neckHalf - 18, sk.neckBase - 4)
        .C(cxS - sk.neckHalf - 26, sk.neckBase + 40, cxS + sk.neckHalf + 26, sk.neckBase + 40, cxS + sk.neckHalf + 18, sk.neckBase - 4)
        .C(cxS + 14, sk.neckBase + 14, cxS - 14, sk.neckBase + 14, cxS - sk.neckHalf - 18, sk.neckBase - 4)
        .Z().d();
      var tail = P().M(cxS - 16, sk.neckBase + 22).L(cxS - 30, sk.bustY + 130).L(cxS - 2, sk.bustY + 134).L(cxS + 4, sk.neckBase + 24).Z().d();
      return piece(paint, item, d) + piece(paint, item, tail, { colour: shade(item.colour, -0.08) });
    }
    if (shape === 'belt') {
      var cxH = sk.cx + sk.hipOff;
      return '<rect x="' + (cxH - sk.hipHalf - 6) + '" y="' + (sk.hipY - 52) + '" width="' + (sk.hipHalf * 2 + 12) +
        '" height="16" rx="3" fill="' + paint.cylinder(item.colour) + '" stroke="' + edgeOf(item) + '" stroke-width="1.4"/>' +
        '<rect x="' + (cxH - 11) + '" y="' + (sk.hipY - 56) + '" width="22" height="24" rx="4" fill="#BFAE8E"/>';
    }
    /* bags */
    var bx = sk.cx + sk.hipOff + sk.hipHalf + 34;
    var by = sk.hipY + 26;
    var strap = P().M(sk.arms.right.shoulder.x + 8, sk.shoulderY + 6)
      .C(bx + 16, sk.bustY + 90, bx + 4, by - 70, bx - 2, by - 6).d();
    return '<path d="' + strap + '" fill="none" stroke="' + paint.cylinder(shade(item.colour, -0.2)) + '" stroke-width="9" stroke-linecap="round"/>' +
      piece(paint, item, P().M(bx - 34, by).L(bx + 34, by).C(bx + 38, by + 44, bx + 34, by + 76, bx + 30, by + 88)
        .C(bx, by + 96, bx - 30, by + 96, bx - 30, by + 88).C(bx - 34, by + 76, bx - 38, by + 44, bx - 34, by).Z().d(),
        { gloss: item.material === 'leather' });
  }

  /* ============================================================
     Assembly
     ============================================================ */
  function layerOf(item) {
    if (item.category === 'dress') return 'top';
    if (item.category === 'top') return 'top';
    if (item.category === 'outer') return 'outer';
    if (item.category === 'bottom') return 'bottom';
    if (item.category === 'shoes') return 'shoes';
    if (item.shape === 'belt') return 'bottom';
    return 'accessory';
  }
  SM.fitLayerOf = layerOf;

  function drawItem(sk, item, paint) {
    if (!item) return '';
    if (item.category === 'dress') return renderDress(sk, item, paint);
    if (item.category === 'top') return renderTop(sk, item, paint);
    if (item.category === 'outer') return renderOuter(sk, item, paint);
    if (item.category === 'bottom') return renderBottom(sk, item, paint);
    if (item.category === 'shoes') return renderShoes(sk, item, paint);
    return renderAccessory(sk, item, paint);
  }

  function group(outfit) {
    var by = { bottom: [], top: [], shoes: [], outer: [], accessory: [] };
    (outfit.items || []).forEach(function (it) {
      if (!it) return;
      by[layerOf(it)].push(it);
    });
    /* Scarves sit above a coat collar; hats above everything. */
    var order = { scarf: 1, bagShoulder: 2, bagTote: 3, cap: 4, beanie: 5, sunglasses: 6 };
    by.accessory.sort(function (a, b) { return (order[a.shape] || 9) - (order[b.shape] || 9); });
    return by;
  }
  SM.fitGroup = group;

  SM.fit = {
    layers: LAYERS,

    /* A stable name for whoever is wearing this, so a generated
       try-on is cached against the right person. */
    lookKey: function (look) {
      return (look && look.photo) ? 'me' : 'model';
    },

    render: function (outfit, look, opts) {
      opts = opts || {};
      /* A generated or supplied photograph of this exact outfit on
         this exact person always beats the drawing. */
      if (!opts.forceDrawing && SM.images) {
        var worn = SM.images.getWorn(outfit.id, SM.fit.lookKey(look));
        if (worn) {
          return '<img class="worn photo" src="' + worn + '" alt="Outfit worn by a model" ' +
            'loading="lazy" decoding="async" onerror="SM.images.wornFallback(this,\'' + outfit.id + '\')">';
        }
      }
      limbPath = SM.figure.limbPath;
      look = look || {};
      var paint = SM.newPaint();
      var sk = SM.figure.skeleton(look);
      var by = group(outfit);

      /* Hide the plain base layer wherever a garment already covers
         the body, so briefs never show through a pair of trousers. */
      look = Object.assign({}, look, {
        hideBriefs: by.bottom.some(function (i) { return i.category === 'bottom'; }) ||
          by.top.some(function (i) { return i.category === 'dress'; }),
        hideBand: by.top.length > 0
      });

      var body =
        SM.figure.groundShadow(sk, paint) +
        SM.figure.hairBack(sk, look, paint) +
        SM.figure.body(sk, look, paint) +
        SM.figure.head(sk, look, paint) +
        SM.figure.hairFront(sk, look, paint);

      var layers = LAYERS.map(function (name) {
        return '<g class="fit-layer" data-layer="' + name + '">' +
          by[name].map(function (it) { return drawItem(sk, it, paint); }).join('') + '</g>';
      }).join('');

      return '<svg class="worn" viewBox="' + SM.FIGURE_VIEWBOX + '" preserveAspectRatio="xMidYMax meet" ' +
        'role="img" aria-label="Outfit worn by a model">' +
        '<defs>' + SM.materials.defs() + '</defs>' +
        body + layers + paint.markup() + '</svg>';
    },

    /* Rewrite one layer in place. The other four groups keep the
       exact nodes they already had. */
    updateLayer: function (svgEl, outfit, look, layerName) {
      if (!svgEl) return;
      limbPath = SM.figure.limbPath;
      var paint = SM.newPaint();
      var sk = SM.figure.skeleton(look || {});
      var by = group(outfit);
      var g = svgEl.querySelector('[data-layer="' + layerName + '"]');
      if (!g) return;
      g.innerHTML = (by[layerName] || []).map(function (it) { return drawItem(sk, it, paint); }).join('');
      /* Newly created gradients need to reach the document. */
      var defs = svgEl.querySelector('defs');
      if (defs) defs.insertAdjacentHTML('beforeend', paint.markup().replace(/^<defs>|<\/defs>$/g, ''));
      g.classList.remove('layer-swap');
      void g.getBoundingClientRect();
      g.classList.add('layer-swap');
    }
  };
})(window.SM);
