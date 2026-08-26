/* ============================================================
   STYLE ME — garment.js

   Product shots. Each garment is drawn the way a retailer
   photographs one: filled out as if worn but with no body inside,
   lit from the upper left, dropped on a light ground.

   Construction is what sells it — shoulder seams, topstitching,
   ribbed collars, plackets, pocket bags, sole units. A coloured
   silhouette reads as a sticker; the seams are what make it read
   as a thing you could pick up.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var C = SM.color;
  var P = SM.P;
  var shade = C.shade, mix = C.mix, warm = C.warm, lum = C.luminance;

  /* ---------- shared drawing helpers --------------------------- */

  /* A soft crease. Three stacked strokes fake a blur without
     paying for a filter on every repaint. */
  function fold(d, dark, w, strength) {
    var s = strength === undefined ? 1 : strength;
    return '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-opacity="' + (0.07 * s) +
      '" stroke-width="' + (w * 3.2) + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-opacity="' + (0.10 * s) +
      '" stroke-width="' + (w * 1.7) + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + dark + '" stroke-opacity="' + (0.13 * s) +
      '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  function highlight(d, light, w, opacity) {
    return '<path d="' + d + '" fill="none" stroke="' + light + '" stroke-opacity="' + (opacity || 0.35) +
      '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }

  function stitch(d, colour, dash, width) {
    return '<path d="' + d + '" fill="none" stroke="' + colour + '" stroke-width="' + (width || 2.2) +
      '" stroke-dasharray="' + (dash || '7 6') + '" stroke-linecap="round" opacity=".9"/>';
  }

  function seamLine(d, colour) {
    return '<path d="' + d + '" fill="none" stroke="' + colour + '" stroke-width="1.8" opacity=".55"/>';
  }

  /* Contrast stitching on denim and workwear, tonal elsewhere. */
  function thread(item) {
    if (item.opts && item.opts.thread) return item.opts.thread;
    if (item.material === 'denim') return '#D9A24B';
    if (item.material === 'canvas') return '#E4D9BE';
    return lum(item.colour) > 0.5 ? shade(item.colour, -0.4) : shade(item.colour, 0.35);
  }

  function edgeColour(item) {
    return lum(item.colour) > 0.45 ? shade(item.colour, -0.42) : shade(item.colour, -0.55);
  }

  /* One piece of cloth: colour ramp, woven texture, edge. */
  function cloth(g, d, opt) {
    opt = opt || {};
    var colour = opt.colour || g.item.colour;
    var fill = opt.flat ? colour : g.paint.cylinder(colour, { gloss: opt.gloss });
    return '<path d="' + d + '" fill="' + fill + '"/>' +
      SM.materials.overlay(d, opt.material || g.item.material, opt.texture === undefined ? 1 : opt.texture) +
      '<path d="' + d + '" fill="none" stroke="' + (opt.edge || edgeColour(g.item)) +
      '" stroke-opacity="' + (opt.edgeOpacity || 0.7) + '" stroke-width="' + (opt.edgeWidth || 1.6) +
      '" stroke-linejoin="round"/>';
  }

  /* Ribbed knit band — collars, cuffs, hems. */
  function ribBand(g, d, colour) {
    var c = colour || shade(g.item.colour, -0.08);
    return '<path d="' + d + '" fill="' + g.paint.cylinder(c) + '"/>' +
      SM.materials.overlay(d, 'rib', 1) +
      '<path d="' + d + '" fill="none" stroke="' + edgeColour(g.item) + '" stroke-opacity=".6" stroke-width="1.4"/>';
  }

  function button(x, y, r, colour) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + colour +
      '" stroke="' + shade(colour, -0.45) + '" stroke-width="1"/>' +
      '<circle cx="' + (x - r * 0.3) + '" cy="' + (y - r * 0.2) + '" r="' + (r * 0.13) + '" fill="' + shade(colour, -0.5) + '"/>' +
      '<circle cx="' + (x + r * 0.3) + '" cy="' + (y - r * 0.2) + '" r="' + (r * 0.13) + '" fill="' + shade(colour, -0.5) + '"/>';
  }

  function metalRivet(x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#B9A88C"/>' +
      '<circle cx="' + (x - r * 0.25) + '" cy="' + (y - r * 0.25) + '" r="' + (r * 0.4) + '" fill="#E9E0CC"/>';
  }

  function zipper(x, y1, y2, tone) {
    var teeth = '';
    for (var y = y1 + 4; y < y2; y += 9) {
      teeth += '<rect x="' + (x - 3.4) + '" y="' + y + '" width="6.8" height="4.4" rx="1.4" fill="' + tone + '"/>';
    }
    return '<rect x="' + (x - 6) + '" y="' + y1 + '" width="12" height="' + (y2 - y1) +
      '" rx="3" fill="' + shade(tone, -0.55) + '" opacity=".8"/>' + teeth +
      '<rect x="' + (x - 5) + '" y="' + (y1 + 6) + '" width="10" height="18" rx="4" fill="' + shade(tone, 0.25) + '"/>' +
      '<rect x="' + (x - 2.4) + '" y="' + (y1 + 20) + '" width="4.8" height="16" rx="2.4" fill="' + tone + '"/>';
  }

  /* Contact shadow so the garment sits on the ground. */
  function groundShadow(g, cx, cy, rx, ry) {
    var fill = g.paint.radial('#4A4236', '#4A4236', 0.34);
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"/>';
  }

  /* The dark opening you see into a garment — neck, cuff, waist. */
  function inside(g, d) {
    return '<path d="' + d + '" fill="' + shade(g.item.colour, -0.62) + '"/>' +
      '<path d="' + d + '" fill="' + g.paint.radial('#000000', '#000000', 0.4) + '"/>';
  }

  /* ============================================================
     Tops
     ============================================================ */
  function topGeometry(o) {
    o = o || {};
    var chestHalf = o.chestHalf || 166;
    return {
      cx: 320,
      shoulderY: o.shoulderY || 104,
      shoulderHalf: o.shoulderHalf || 148,
      chestHalf: chestHalf,
      hemHalf: o.hemHalf || (chestHalf - 4),
      hemY: o.hemY || 556,
      neckHalf: o.neckHalf || 52,
      neckDrop: o.neckDrop || 34,
      chestY: o.chestY || 250
    };
  }

  function topBodyPath(t, o) {
    o = o || {};
    var cx = t.cx;
    var hemCurve = o.hemCurve === undefined ? 12 : o.hemCurve;
    var p = P()
      .M(cx - t.shoulderHalf, t.shoulderY)
      .C(cx - t.shoulderHalf - 6, t.shoulderY + 60, cx - t.chestHalf, t.chestY - 40, cx - t.chestHalf, t.chestY)
      .C(cx - t.chestHalf - 2, t.chestY + 90, cx - t.hemHalf, t.hemY - 120, cx - t.hemHalf, t.hemY - hemCurve)
      .C(cx - t.hemHalf * 0.5, t.hemY + hemCurve, cx + t.hemHalf * 0.5, t.hemY + hemCurve, cx + t.hemHalf, t.hemY - hemCurve)
      .C(cx + t.hemHalf, t.hemY - 120, cx + t.chestHalf + 2, t.chestY + 90, cx + t.chestHalf, t.chestY)
      .C(cx + t.chestHalf, t.chestY - 40, cx + t.shoulderHalf + 6, t.shoulderY + 60, cx + t.shoulderHalf, t.shoulderY);
    if (o.collar === 'v') {
      p.L(cx + t.neckHalf - 6, t.shoulderY + 6).L(cx, t.shoulderY + t.neckDrop + 40).L(cx - t.neckHalf + 6, t.shoulderY + 6);
    } else {
      p.C(cx + t.shoulderHalf - 40, t.shoulderY - 12, cx + t.neckHalf + 12, t.shoulderY + t.neckDrop - 16, cx + t.neckHalf, t.shoulderY + t.neckDrop)
       .C(cx + t.neckHalf * 0.55, t.shoulderY + t.neckDrop + 20, cx - t.neckHalf * 0.55, t.shoulderY + t.neckDrop + 20, cx - t.neckHalf, t.shoulderY + t.neckDrop)
       .C(cx - t.neckHalf - 12, t.shoulderY + t.neckDrop - 16, cx - t.shoulderHalf + 40, t.shoulderY - 12, cx - t.shoulderHalf, t.shoulderY);
    }
    return p.Z().d();
  }

  /* A sleeve leaves the shoulder, widens over the bicep and tapers
     to the cuff. The underarm seam has to run back to the armpit,
     not into the middle of the body — that was making sleeves look
     stuck on rather than sewn in. */
  function sleevePath(t, side, o) {
    o = o || {};
    var s = side;
    var cx = t.cx;
    var sx = cx + s * t.shoulderHalf;
    var armpitX = cx + s * (t.chestHalf - 4);
    var armpitY = (t.chestY || 250) - 10;
    var long = !!o.long;
    var cuffCx = sx + s * (long ? 88 : 52);
    var cuffY = long ? 496 : 292;
    var cuffW = long ? 30 : 44;
    var bicepOut = sx + s * (long ? 72 : 66);
    return P()
      .M(sx, t.shoulderY)
      .C(sx + s * 34, t.shoulderY + 14, bicepOut, t.shoulderY + 74, bicepOut + s * 4, t.shoulderY + 150)
      .C(cuffCx + s * (cuffW + 8), cuffY - 90, cuffCx + s * (cuffW + 4), cuffY - 30, cuffCx + s * cuffW, cuffY)
      .C(cuffCx + s * cuffW * 0.4, cuffY + 12, cuffCx - s * cuffW * 0.4, cuffY + 12, cuffCx - s * cuffW, cuffY - 6)
      .C(cuffCx - s * (cuffW + 6), cuffY - 90, armpitX + s * 16, armpitY + 90, armpitX, armpitY)
      .C(cx + s * (t.chestHalf + 2), armpitY - 52, cx + s * (t.shoulderHalf - 4), t.shoulderY + 46, sx, t.shoulderY)
      .Z().d();
  }

  function bodyFolds(g, t, hemY) {
    var dark = shade(g.item.colour, -0.5);
    var light = warm(g.item.colour, 0.4);
    var cx = t.cx;
    return fold(P().M(cx - t.chestHalf + 26, t.chestY - 40).C(cx - 70, t.chestY + 90, cx - 84, hemY - 150, cx - 62, hemY - 20).d(), dark, 9) +
      fold(P().M(cx + t.chestHalf - 30, t.chestY - 30).C(cx + 74, t.chestY + 100, cx + 88, hemY - 150, cx + 66, hemY - 20).d(), dark, 9) +
      fold(P().M(cx - 12, t.chestY + 60).C(cx - 22, hemY - 190, cx - 16, hemY - 110, cx - 24, hemY - 24).d(), dark, 6, 0.7) +
      highlight(P().M(cx - 96, t.chestY - 20).C(cx - 104, t.chestY + 120, cx - 100, hemY - 130, cx - 92, hemY - 40).d(), light, 22, 0.16);
  }

  /* ---------- tee / long sleeve -------------------------------- */
  function tee(g) {
    var o = g.item.opts || {};
    var t = topGeometry({
      shoulderHalf: o.boxy ? 162 : 146,
      chestHalf: o.boxy ? 178 : 164,
      hemY: o.cropped ? 500 : 580,
      neckDrop: 32
    });
    var th = thread(g.item);
    var cx = t.cx;
    var out = groundShadow(g, cx + 12, t.hemY + 40, t.hemHalf + 30, 26);

    if (!o.sleeveless) {
      out += cloth(g, sleevePath(t, -1, { long: o.long }));
      out += cloth(g, sleevePath(t, 1, { long: o.long }));
    }

    var body = topBodyPath(t, { collar: o.collar });
    out += cloth(g, body);
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + bodyFolds(g, t, t.hemY) + '</g>';

    var nd = t.shoulderY + t.neckDrop;
    var neckOuter = P()
      .M(cx - t.neckHalf - 10, nd - 8)
      .C(cx - t.neckHalf, nd + 26, cx + t.neckHalf, nd + 26, cx + t.neckHalf + 10, nd - 8)
      .C(cx + t.neckHalf, nd + 4, cx - t.neckHalf, nd + 4, cx - t.neckHalf - 10, nd - 8)
      .Z().d();
    out += inside(g, neckOuter);
    out += ribBand(g, P()
      .M(cx - t.neckHalf - 12, nd - 12)
      .C(cx - t.neckHalf - 2, nd + 18, cx + t.neckHalf + 2, nd + 18, cx + t.neckHalf + 12, nd - 12)
      .C(cx + t.neckHalf + 4, nd - 24, cx - t.neckHalf - 4, nd - 24, cx - t.neckHalf - 12, nd - 12)
      .Z().d());

    out += stitch(P().M(cx - t.shoulderHalf + 6, t.shoulderY + 6).C(cx - 100, t.shoulderY + 4, cx - 70, t.shoulderY + 18, cx - t.neckHalf - 6, nd - 12).d(), th);
    out += stitch(P().M(cx + t.shoulderHalf - 6, t.shoulderY + 6).C(cx + 100, t.shoulderY + 4, cx + 70, t.shoulderY + 18, cx + t.neckHalf + 6, nd - 12).d(), th);
    out += stitch(P().M(cx - t.hemHalf + 6, t.hemY - 22).C(cx - 80, t.hemY - 6, cx + 80, t.hemY - 6, cx + t.hemHalf - 6, t.hemY - 22).d(), th);
    return out;
  }

  /* ---------- shirt -------------------------------------------- */
  function shirt(g) {
    var o = g.item.opts || {};
    var t = topGeometry({ shoulderHalf: 150, chestHalf: 168, hemY: 590, neckHalf: 48, neckDrop: 26 });
    var th = thread(g.item);
    var cx = t.cx;
    var nd = t.shoulderY + t.neckDrop;
    var out = groundShadow(g, cx + 12, t.hemY + 40, t.hemHalf + 30, 26);

    out += cloth(g, sleevePath(t, -1, { long: !o.short }));
    out += cloth(g, sleevePath(t, 1, { long: !o.short }));

    var body = topBodyPath(t, { hemCurve: 26 });
    out += cloth(g, body);
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + bodyFolds(g, t, t.hemY) + '</g>';

    var plackW = 20;
    var plack = P().M(cx - plackW, nd).L(cx + plackW, nd)
      .L(cx + plackW - 2, t.hemY - 6).L(cx - plackW + 2, t.hemY - 6).Z().d();
    out += cloth(g, plack, { colour: shade(g.item.colour, 0.05) });
    out += stitch(P().M(cx - plackW + 5, nd).L(cx - plackW + 6, t.hemY - 10).d(), th, '6 5', 1.8);
    out += stitch(P().M(cx + plackW - 5, nd).L(cx + plackW - 6, t.hemY - 10).d(), th, '6 5', 1.8);
    var btnColour = o.buttonColour || mix(g.item.colour, '#F3EFE6', 0.75);
    for (var i = 0; i < 6; i++) out += button(cx, nd + 46 + i * 84, 8.5, btnColour);

    var standD = P()
      .M(cx - t.neckHalf - 6, nd + 4)
      .C(cx - t.neckHalf, t.shoulderY + 4, cx + t.neckHalf, t.shoulderY + 4, cx + t.neckHalf + 6, nd + 4)
      .C(cx + t.neckHalf, nd + 20, cx - t.neckHalf, nd + 20, cx - t.neckHalf - 6, nd + 4)
      .Z().d();
    out += inside(g, standD);
    [-1, 1].forEach(function (side) {
      var leaf = P()
        .M(cx + side * (t.neckHalf + 6), nd - 2)
        .C(cx + side * (t.neckHalf + 34), nd + 8, cx + side * (t.neckHalf + 40), nd + 34, cx + side * 30, nd + 74)
        .L(cx + side * 6, nd + 12)
        .Z().d();
      out += cloth(g, leaf, { colour: shade(g.item.colour, 0.03) });
      out += stitch(P().M(cx + side * (t.neckHalf + 2), nd + 4)
        .C(cx + side * (t.neckHalf + 26), nd + 16, cx + side * (t.neckHalf + 30), nd + 34, cx + side * 32, nd + 68).d(), th, '5 4', 1.6);
    });

    if (o.pocket !== false) {
      var pk = P().M(cx - 128, t.chestY + 4).L(cx - 58, t.chestY + 4).L(cx - 60, t.chestY + 76).L(cx - 126, t.chestY + 76).Z().d();
      out += cloth(g, pk, { colour: shade(g.item.colour, 0.02) });
      out += stitch(P().M(cx - 128, t.chestY + 12).L(cx - 58, t.chestY + 12).d(), th, '5 4', 1.6);
    }
    out += seamLine(P().M(cx - t.shoulderHalf + 14, t.shoulderY + 62).C(cx - 60, t.shoulderY + 76, cx + 60, t.shoulderY + 76, cx + t.shoulderHalf - 14, t.shoulderY + 62).d(), edgeColour(g.item));
    return out;
  }

  /* ---------- knitwear ------------------------------------------ */
  function knit(g) {
    var o = g.item.opts || {};
    var t = topGeometry({ shoulderHalf: 152, chestHalf: 170, hemY: 540, neckHalf: o.turtle ? 44 : 50, neckDrop: o.turtle ? 10 : 30 });
    var cx = t.cx;
    var nd = t.shoulderY + t.neckDrop;
    var out = groundShadow(g, cx + 12, t.hemY + 42, t.hemHalf + 30, 26);

    out += cloth(g, sleevePath(t, -1, { long: true }));
    out += cloth(g, sleevePath(t, 1, { long: true }));
    out += ribBand(g, P().M(cx - 218, 452).L(cx - 152, 440).L(cx - 142, 494).L(cx - 210, 508).Z().d());
    out += ribBand(g, P().M(cx + 218, 452).L(cx + 152, 440).L(cx + 142, 494).L(cx + 210, 508).Z().d());

    var body = topBodyPath(t, {});
    out += cloth(g, body);
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + bodyFolds(g, t, t.hemY) + '</g>';

    if (o.cable) {
      var rope = shade(g.item.colour, -0.3), lift = warm(g.item.colour, 0.32);
      for (var k = -1; k <= 1; k += 2) {
        var bx = cx + k * 66, d = '';
        for (var y = t.chestY - 70; y < t.hemY - 40; y += 58) {
          d += 'M' + (bx - 22) + ' ' + y + 'C' + (bx + 24) + ' ' + (y + 18) + ' ' + (bx - 24) + ' ' + (y + 40) + ' ' + (bx + 22) + ' ' + (y + 58);
          d += 'M' + (bx + 22) + ' ' + y + 'C' + (bx - 24) + ' ' + (y + 18) + ' ' + (bx + 24) + ' ' + (y + 40) + ' ' + (bx - 22) + ' ' + (y + 58);
        }
        out += '<path d="' + d + '" fill="none" stroke="' + rope + '" stroke-opacity=".55" stroke-width="15" stroke-linecap="round"/>';
        out += '<path d="' + d + '" fill="none" stroke="' + lift + '" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>';
      }
    }

    if (o.turtle) {
      var roll = P()
        .M(cx - t.neckHalf - 16, t.shoulderY + 24)
        .C(cx - t.neckHalf - 10, t.shoulderY - 44, cx + t.neckHalf + 10, t.shoulderY - 44, cx + t.neckHalf + 16, t.shoulderY + 24)
        .C(cx + t.neckHalf, t.shoulderY + 48, cx - t.neckHalf, t.shoulderY + 48, cx - t.neckHalf - 16, t.shoulderY + 24)
        .Z().d();
      out += ribBand(g, roll);
      out += seamLine(P().M(cx - t.neckHalf - 12, t.shoulderY - 4).C(cx - 30, t.shoulderY - 26, cx + 30, t.shoulderY - 26, cx + t.neckHalf + 12, t.shoulderY - 4).d(), edgeColour(g.item));
    } else {
      var neckOuter = P()
        .M(cx - t.neckHalf - 12, nd - 10)
        .C(cx - t.neckHalf, nd + 28, cx + t.neckHalf, nd + 28, cx + t.neckHalf + 12, nd - 10)
        .C(cx + t.neckHalf, nd + 6, cx - t.neckHalf, nd + 6, cx - t.neckHalf - 12, nd - 10)
        .Z().d();
      out += inside(g, neckOuter);
      out += ribBand(g, P()
        .M(cx - t.neckHalf - 16, nd - 14)
        .C(cx - t.neckHalf - 4, nd + 22, cx + t.neckHalf + 4, nd + 22, cx + t.neckHalf + 16, nd - 14)
        .C(cx + t.neckHalf + 6, nd - 30, cx - t.neckHalf - 6, nd - 30, cx - t.neckHalf - 16, nd - 14)
        .Z().d());
    }

    out += ribBand(g, P()
      .M(cx - t.hemHalf, t.hemY - 54)
      .C(cx - 80, t.hemY - 40, cx + 80, t.hemY - 40, cx + t.hemHalf, t.hemY - 54)
      .C(cx + t.hemHalf, t.hemY - 6, cx + t.hemHalf - 2, t.hemY + 4, cx + t.hemHalf - 4, t.hemY + 6)
      .C(cx + 60, t.hemY + 20, cx - 60, t.hemY + 20, cx - t.hemHalf + 4, t.hemY + 6)
      .Z().d());
    return out;
  }

  /* ---------- hoodie / sweatshirt ------------------------------- */
  function hoodie(g) {
    var o = g.item.opts || {};
    var t = topGeometry({ shoulderHalf: 168, chestHalf: 186, hemY: 552, neckHalf: 60, neckDrop: 24 });
    var cx = t.cx, th = thread(g.item);
    var nd = t.shoulderY + t.neckDrop;
    var out = groundShadow(g, cx + 12, t.hemY + 44, t.hemHalf + 34, 28);

    if (!o.crew) {
      var hood = P()
        .M(cx - 108, t.shoulderY + 40)
        .C(cx - 130, t.shoulderY - 74, cx + 130, t.shoulderY - 74, cx + 108, t.shoulderY + 40)
        .C(cx + 60, t.shoulderY + 66, cx - 60, t.shoulderY + 66, cx - 108, t.shoulderY + 40)
        .Z().d();
      out += cloth(g, hood, { colour: shade(g.item.colour, -0.06) });
      out += seamLine(P().M(cx, t.shoulderY - 46).L(cx, t.shoulderY + 52).d(), edgeColour(g.item));
    }

    out += cloth(g, sleevePath(t, -1, { long: true }));
    out += cloth(g, sleevePath(t, 1, { long: true }));
    out += ribBand(g, P().M(cx - 232, 448).L(cx - 164, 436).L(cx - 152, 496).L(cx - 224, 510).Z().d());
    out += ribBand(g, P().M(cx + 232, 448).L(cx + 164, 436).L(cx + 152, 496).L(cx + 224, 510).Z().d());

    var body = topBodyPath(t, {});
    out += cloth(g, body);
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + bodyFolds(g, t, t.hemY) + '</g>';

    var pocket = P()
      .M(cx - 132, t.hemY - 196)
      .C(cx - 60, t.hemY - 210, cx + 60, t.hemY - 210, cx + 132, t.hemY - 196)
      .L(cx + 118, t.hemY - 64)
      .C(cx + 50, t.hemY - 52, cx - 50, t.hemY - 52, cx - 118, t.hemY - 64)
      .Z().d();
    out += cloth(g, pocket, { colour: shade(g.item.colour, -0.03) });
    out += stitch(P().M(cx - 130, t.hemY - 188).C(cx - 60, t.hemY - 200, cx + 60, t.hemY - 200, cx + 130, t.hemY - 188).d(), th);
    out += fold(P().M(cx - 118, t.hemY - 66).C(cx - 50, t.hemY - 54, cx + 50, t.hemY - 54, cx + 118, t.hemY - 66).d(), shade(g.item.colour, -0.5), 8);

    var neckOuter = P()
      .M(cx - t.neckHalf - 14, nd)
      .C(cx - t.neckHalf, nd + 46, cx + t.neckHalf, nd + 46, cx + t.neckHalf + 14, nd)
      .C(cx + t.neckHalf, nd + 14, cx - t.neckHalf, nd + 14, cx - t.neckHalf - 14, nd)
      .Z().d();
    out += inside(g, neckOuter);
    if (!o.crew) {
      var cord = mix(g.item.colour, '#F0EBE0', 0.7);
      [-1, 1].forEach(function (side) {
        out += '<path d="' + P().M(cx + side * 22, nd + 30)
          .C(cx + side * 26, t.shoulderY + 120, cx + side * 16, t.shoulderY + 170, cx + side * 24, t.shoulderY + 214).d() +
          '" fill="none" stroke="' + cord + '" stroke-width="7" stroke-linecap="round"/>';
        out += '<rect x="' + (cx + side * 24 - 6) + '" y="' + (t.shoulderY + 212) + '" width="12" height="18" rx="4" fill="#C9BDA6"/>';
      });
    }

    out += ribBand(g, P()
      .M(cx - t.hemHalf, t.hemY - 52)
      .C(cx - 80, t.hemY - 38, cx + 80, t.hemY - 38, cx + t.hemHalf, t.hemY - 52)
      .L(cx + t.hemHalf - 4, t.hemY + 8)
      .C(cx + 60, t.hemY + 22, cx - 60, t.hemY + 22, cx - t.hemHalf + 4, t.hemY + 8)
      .Z().d());
    return out;
  }

  /* ---------- open jackets -------------------------------------- */
  function openJacket(g, cfg) {
    var o = g.item.opts || {};
    var cx = 320, shoulderY = 104;
    var shoulderHalf = cfg.shoulderHalf, chestHalf = cfg.chestHalf;
    var hemY = cfg.hemY, hemHalf = cfg.hemHalf || chestHalf + 4;
    var gap = cfg.gap || 16;
    var th = thread(g.item);
    var out = groundShadow(g, cx + 12, hemY + 40, hemHalf + 34, 28);

    var back = P()
      .M(cx - shoulderHalf + 22, shoulderY + 10)
      .C(cx - chestHalf + 18, 260, cx - hemHalf + 20, hemY - 160, cx - hemHalf + 22, hemY - 10)
      .L(cx + hemHalf - 22, hemY - 10)
      .C(cx + hemHalf - 20, hemY - 160, cx + chestHalf - 18, 260, cx + shoulderHalf - 22, shoulderY + 10)
      .Z().d();
    out += '<path d="' + back + '" fill="' + shade(g.item.colour, -0.5) + '"/>';
    out += SM.materials.overlay(back, g.item.material, 0.6);

    var t = { cx: cx, shoulderY: shoulderY, shoulderHalf: shoulderHalf, chestHalf: chestHalf };
    out += cloth(g, sleevePath(t, -1, { long: true }));
    out += cloth(g, sleevePath(t, 1, { long: true }));

    [-1, 1].forEach(function (side) {
      var panel = P()
        .M(cx + side * shoulderHalf, shoulderY)
        .C(cx + side * (shoulderHalf + 6), shoulderY + 60, cx + side * chestHalf, 220, cx + side * chestHalf, 280)
        .C(cx + side * (chestHalf + 2), 360, cx + side * hemHalf, hemY - 150, cx + side * hemHalf, hemY - 14)
        .C(cx + side * hemHalf * 0.6, hemY + 10, cx + side * gap * 2, hemY + 10, cx + side * gap, hemY - 6)
        .L(cx + side * gap, shoulderY + (cfg.lapel || 60))
        .L(cx + side * (cfg.collarHalf || 54), shoulderY + 6)
        .Z().d();
      out += cloth(g, panel);
      out += '<g clip-path="url(#' + g.paint.clip(panel) + ')">' +
        fold(P().M(cx + side * (chestHalf - 30), 240).C(cx + side * 96, 360, cx + side * 104, hemY - 150, cx + side * 88, hemY - 30).d(), shade(g.item.colour, -0.5), 9) +
        '</g>';
      out += stitch(P().M(cx + side * (gap + 9), shoulderY + (cfg.lapel || 60) + 10).L(cx + side * (gap + 9), hemY - 20).d(), th, '7 6', 1.8);
    });

    if (cfg.lapel) {
      [-1, 1].forEach(function (side) {
        var lap = P()
          .M(cx + side * (cfg.collarHalf || 54), shoulderY + 6)
          .L(cx + side * gap, shoulderY + cfg.lapel)
          .L(cx + side * (gap + 54), shoulderY + cfg.lapel - 34)
          .L(cx + side * ((cfg.collarHalf || 54) + 16), shoulderY + 34)
          .Z().d();
        out += cloth(g, lap, { colour: shade(g.item.colour, 0.07) });
        out += stitch(P().M(cx + side * (gap + 6), shoulderY + cfg.lapel - 6).L(cx + side * (gap + 46), shoulderY + cfg.lapel - 32).d(), th, '5 4', 1.6);
      });
      out += cloth(g, P()
        .M(cx - (cfg.collarHalf || 54) - 6, shoulderY + 8)
        .C(cx - 30, shoulderY - 24, cx + 30, shoulderY - 24, cx + (cfg.collarHalf || 54) + 6, shoulderY + 8)
        .C(cx + 30, shoulderY + 24, cx - 30, shoulderY + 24, cx - (cfg.collarHalf || 54) - 6, shoulderY + 8)
        .Z().d(), { colour: shade(g.item.colour, 0.04) });
    } else {
      var ch = cfg.collarHalf || 60;
      var col = P()
        .M(cx - ch - 10, shoulderY + 12)
        .C(cx - 40, shoulderY - 30, cx + 40, shoulderY - 30, cx + ch + 10, shoulderY + 12)
        .C(cx + 40, shoulderY + 34, cx - 40, shoulderY + 34, cx - ch - 10, shoulderY + 12)
        .Z().d();
      out += cloth(g, col, { colour: shade(g.item.colour, 0.05) });
      out += stitch(P().M(cx - ch, shoulderY + 18).C(cx - 30, shoulderY + 30, cx + 30, shoulderY + 30, cx + ch, shoulderY + 18).d(), th, '5 4', 1.6);
    }

    if (cfg.buttons) {
      var bc = o.buttonColour || shade(g.item.colour, -0.35);
      for (var i = 0; i < cfg.buttons; i++) {
        out += button(cx + gap + 22, shoulderY + (cfg.lapel || 70) + 40 + i * cfg.buttonGap, 10, bc);
      }
    }

    if (cfg.pockets === 'welt') {
      [-1, 1].forEach(function (side) {
        var y = hemY - 170;
        out += cloth(g, P().M(cx + side * 60, y).L(cx + side * 150, y - 8).L(cx + side * 152, y + 22).L(cx + side * 62, y + 30).Z().d(),
          { colour: shade(g.item.colour, -0.1) });
      });
    } else if (cfg.pockets === 'flap') {
      [-1, 1].forEach(function (side) {
        var y = 250;
        out += cloth(g, P().M(cx + side * 54, y).L(cx + side * 132, y - 6).L(cx + side * 134, y + 40).L(cx + side * 56, y + 46).Z().d(),
          { colour: shade(g.item.colour, -0.06) });
        out += stitch(P().M(cx + side * 58, y + 38).L(cx + side * 130, y + 32).d(), th, '5 4', 1.6);
      });
    }
    return out;
  }

  /* ---------- puffer -------------------------------------------- */
  function puffer(g) {
    var cx = 320, shoulderY = 100, chestHalf = 190, hemY = 600;
    var t = topGeometry({ shoulderY: shoulderY, shoulderHalf: 170, chestHalf: chestHalf, hemHalf: chestHalf - 10, hemY: hemY, neckHalf: 56, neckDrop: 22 });
    var out = groundShadow(g, cx + 12, hemY + 44, chestHalf + 30, 30);

    out += cloth(g, sleevePath(t, -1, { long: true }), { gloss: true });
    out += cloth(g, sleevePath(t, 1, { long: true }), { gloss: true });

    var body = topBodyPath(t, {});
    out += cloth(g, body, { gloss: true });

    var inner = '';
    var dark = shade(g.item.colour, -0.55), light = warm(g.item.colour, 0.45);
    for (var y = shoulderY + 54; y < hemY - 10; y += 62) {
      inner += fold(P().M(cx - chestHalf - 10, y).C(cx - 70, y + 12, cx + 70, y + 12, cx + chestHalf + 10, y).d(), dark, 10, 1.5);
      inner += highlight(P().M(cx - chestHalf - 10, y + 26).C(cx - 70, y + 40, cx + 70, y + 40, cx + chestHalf + 10, y + 26).d(), light, 16, 0.22);
    }
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + inner + '</g>';

    var neckOuter = P().M(cx - 66, shoulderY + 22).C(cx - 50, shoulderY + 62, cx + 50, shoulderY + 62, cx + 66, shoulderY + 22)
      .C(cx + 46, shoulderY + 36, cx - 46, shoulderY + 36, cx - 66, shoulderY + 22).Z().d();
    out += inside(g, neckOuter);
    out += cloth(g, P().M(cx - 70, shoulderY + 20).C(cx - 60, shoulderY - 30, cx + 60, shoulderY - 30, cx + 70, shoulderY + 20)
      .C(cx + 46, shoulderY + 40, cx - 46, shoulderY + 40, cx - 70, shoulderY + 20).Z().d(),
      { colour: shade(g.item.colour, -0.05), gloss: true });
    out += zipper(cx, shoulderY + 26, hemY - 12, '#C6C0B4');
    return out;
  }

  /* ============================================================
     Bottoms
     ============================================================ */
  function trousers(g) {
    var o = g.item.opts || {};
    var cx = 280, waistY = 96, waistHalf = o.waistHalf || 128;
    var hipHalf = waistHalf + 16;
    var crotchY = 300;
    var kneeHalf = o.kneeHalf || 108;
    var hemHalf = o.hemHalf || 100;
    var hemY = o.hemY || 830;
    var th = thread(g.item);
    var out = groundShadow(g, cx + 10, hemY + 26, waistHalf + 40, 22);

    [-1, 1].forEach(function (side) {
      /* Down the outside seam, across the hem, back up the inseam
         to the crotch, then straight up the centre front. Without
         that last leg the seat is missing and the trousers read as
         two separate cones. */
      var leg = P()
        .M(cx + side * hipHalf, waistY + 40)
        .C(cx + side * hipHalf, 300, cx + side * (kneeHalf + 26), 460, cx + side * (kneeHalf + 8), 620)
        .C(cx + side * (hemHalf + 10), 720, cx + side * (hemHalf + 6), hemY - 40, cx + side * (hemHalf + 2), hemY)
        .L(cx + side * 8, hemY)
        .C(cx + side * 6, hemY - 60, cx + side * 12, 700, cx + side * 16, 620)
        .C(cx + side * 20, 500, cx + side * 14, 380, cx + side * 7, crotchY + 6)
        .C(cx + side * 3, crotchY - 60, cx + side * 2, waistY + 120, cx + side * 2, waistY + 34)
        .Z().d();
      out += cloth(g, leg);
      out += '<g clip-path="url(#' + g.paint.clip(leg) + ')">' +
        fold(P().M(cx + side * (kneeHalf + 6), 380).C(cx + side * 46, 520, cx + side * 44, 660, cx + side * 40, hemY - 20).d(), shade(g.item.colour, -0.5), 9) +
        fold(P().M(cx + side * (kneeHalf + 30), 470).C(cx + side * 78, 560, cx + side * 66, 640, cx + side * 60, 720).d(), shade(g.item.colour, -0.5), 6, 0.7) +
        highlight(P().M(cx + side * 34, 360).C(cx + side * 30, 520, cx + side * 30, 660, cx + side * 30, hemY - 30).d(), warm(g.item.colour, 0.4), 26, 0.14) +
        (o.whiskers ? whiskering(cx, side, crotchY) : '') +
        '</g>';
      out += stitch(P().M(cx + side * 12, crotchY + 30).C(cx + side * 20, 470, cx + side * 18, 640, cx + side * (hemHalf - 2), hemY - 12).d(), th, '8 7', 1.8);
      if (o.cuff) {
        out += cloth(g, P().M(cx + side * (hemHalf + 6), hemY - 44).L(cx + side * 6, hemY - 44).L(cx + side * 8, hemY).L(cx + side * (hemHalf + 4), hemY).Z().d(),
          { colour: shade(g.item.colour, -0.08) });
      }
      if (o.crease) {
        out += highlight(P().M(cx + side * (kneeHalf * 0.55 + 18), 330).L(cx + side * (hemHalf * 0.5 + 14), hemY - 10).d(), warm(g.item.colour, 0.5), 4, 0.4);
      }
    });

    var band = P()
      .M(cx - waistHalf, waistY)
      .C(cx - 60, waistY - 12, cx + 60, waistY - 12, cx + waistHalf, waistY)
      .L(cx + waistHalf + 4, waistY + 52)
      .C(cx + 60, waistY + 42, cx - 60, waistY + 42, cx - waistHalf - 4, waistY + 52)
      .Z().d();
    out += cloth(g, band, { colour: shade(g.item.colour, 0.04) });
    out += stitch(P().M(cx - waistHalf - 2, waistY + 44).C(cx - 60, waistY + 34, cx + 60, waistY + 34, cx + waistHalf + 2, waistY + 44).d(), th);
    out += stitch(P().M(cx - waistHalf + 2, waistY + 8).C(cx - 60, waistY - 2, cx + 60, waistY - 2, cx + waistHalf - 2, waistY + 8).d(), th);

    if (o.loops !== false) {
      for (var i = -2; i <= 2; i++) {
        var lx = cx + i * (waistHalf * 0.46);
        out += '<rect x="' + (lx - 7) + '" y="' + (waistY - 4) + '" width="14" height="60" rx="3" fill="' + shade(g.item.colour, -0.12) +
          '" stroke="' + edgeColour(g.item) + '" stroke-opacity=".5" stroke-width="1.2"/>';
      }
    }

    out += stitch(P().M(cx + 14, waistY + 54).C(cx + 30, 190, cx + 26, 250, cx + 16, crotchY - 6).d(), th, '8 7', 2);
    if (o.pockets !== false) {
      [-1, 1].forEach(function (side) {
        out += seamLine(P().M(cx + side * (waistHalf - 6), waistY + 56).C(cx + side * (waistHalf - 30), waistY + 120, cx + side * (waistHalf - 62), waistY + 140, cx + side * (waistHalf - 78), waistY + 146).d(), edgeColour(g.item));
        if (o.rivets) {
          out += metalRivet(cx + side * (waistHalf - 8), waistY + 60, 5);
          out += metalRivet(cx + side * (waistHalf - 76), waistY + 146, 5);
        }
      });
    }
    if (o.cargo) {
      [-1, 1].forEach(function (side) {
        var py = 430;
        out += cloth(g, P().M(cx + side * (kneeHalf + 38), py).L(cx + side * (kneeHalf - 22), py + 8)
          .L(cx + side * (kneeHalf - 16), py + 116).L(cx + side * (kneeHalf + 44), py + 106).Z().d(),
          { colour: shade(g.item.colour, -0.05) });
        out += stitch(P().M(cx + side * (kneeHalf + 38), py + 22).L(cx + side * (kneeHalf - 22), py + 30).d(), th, '6 5', 1.8);
      });
    }
    return out;
  }

  function whiskering(cx, side, crotchY) {
    var s = '';
    for (var i = 0; i < 4; i++) {
      var y = crotchY - 90 + i * 34;
      s += '<path d="' + P().M(cx + side * 26, y).C(cx + side * 70, y - 8, cx + side * 96, y + 4, cx + side * 118, y + 16).d() +
        '" fill="none" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="' + (7 - i) + '" stroke-linecap="round"/>';
    }
    return s;
  }

  function skirt(g) {
    var o = g.item.opts || {};
    var cx = 280, waistY = 100, waistHalf = 118;
    var hemY = o.hemY || 660, hemHalf = o.hemHalf || 214;
    var out = groundShadow(g, cx + 10, hemY + 32, hemHalf + 20, 24);
    var body = P()
      .M(cx - waistHalf, waistY)
      .C(cx - waistHalf - 12, 220, cx - hemHalf + 10, hemY - 220, cx - hemHalf, hemY - 24)
      .C(cx - hemHalf * 0.5, hemY + 20, cx + hemHalf * 0.5, hemY + 20, cx + hemHalf, hemY - 24)
      .C(cx + hemHalf - 10, hemY - 220, cx + waistHalf + 12, 220, cx + waistHalf, waistY)
      .C(cx + 40, waistY - 14, cx - 40, waistY - 14, cx - waistHalf, waistY)
      .Z().d();
    out += cloth(g, body);
    var inner = '';
    var dark = shade(g.item.colour, -0.5), light = warm(g.item.colour, 0.4);
    for (var i = -4; i <= 4; i++) {
      inner += fold(P().M(cx + i * 24, waistY + 40).C(cx + i * 38, 340, cx + i * 46, hemY - 200, cx + i * 52, hemY - 10).d(), dark, 8, o.pleated ? 1.4 : 0.8);
      if (o.pleated) {
        inner += highlight(P().M(cx + i * 24 + 12, waistY + 40).C(cx + i * 38 + 16, 340, cx + i * 46 + 20, hemY - 200, cx + i * 52 + 22, hemY - 10).d(), light, 10, 0.2);
      }
    }
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + inner + '</g>';
    out += cloth(g, P().M(cx - waistHalf - 2, waistY - 6).C(cx - 40, waistY - 20, cx + 40, waistY - 20, cx + waistHalf + 2, waistY - 6)
      .L(cx + waistHalf + 4, waistY + 40).C(cx + 40, waistY + 28, cx - 40, waistY + 28, cx - waistHalf - 4, waistY + 40).Z().d(),
      { colour: shade(g.item.colour, 0.05) });
    return out;
  }

  function dress(g) {
    var o = g.item.opts || {};
    var t = topGeometry({ shoulderHalf: o.strap ? 60 : 140, chestHalf: 150, hemY: 820, hemHalf: 210, neckHalf: 48, neckDrop: o.strap ? 74 : 30 });
    var cx = t.cx;
    var out = groundShadow(g, cx + 12, t.hemY + 34, 240, 26);
    if (!o.strap) {
      out += cloth(g, sleevePath(t, -1, { long: o.long }));
      out += cloth(g, sleevePath(t, 1, { long: o.long }));
    }
    var body = P()
      .M(cx - t.shoulderHalf, t.shoulderY)
      .C(cx - 158, 260, cx - 128, 380, cx - 126, 440)
      .C(cx - 150, 560, cx - 200, 700, cx - t.hemHalf, t.hemY - 30)
      .C(cx - 100, t.hemY + 24, cx + 100, t.hemY + 24, cx + t.hemHalf, t.hemY - 30)
      .C(cx + 200, 700, cx + 150, 560, cx + 126, 440)
      .C(cx + 128, 380, cx + 158, 260, cx + t.shoulderHalf, t.shoulderY)
      .C(cx + t.shoulderHalf - 20, t.shoulderY + 20, cx + t.neckHalf, t.shoulderY + t.neckDrop - 10, cx, t.shoulderY + t.neckDrop)
      .C(cx - t.neckHalf, t.shoulderY + t.neckDrop - 10, cx - t.shoulderHalf + 20, t.shoulderY + 20, cx - t.shoulderHalf, t.shoulderY)
      .Z().d();
    out += cloth(g, body, { gloss: g.item.material === 'silk' });
    var inner = '';
    var dark = shade(g.item.colour, -0.5), light = warm(g.item.colour, 0.45);
    for (var i = -3; i <= 3; i++) {
      inner += fold(P().M(cx + i * 26, 300).C(cx + i * 40, 500, cx + i * 54, 680, cx + i * 62, t.hemY - 20).d(), dark, 9, 0.9);
      inner += highlight(P().M(cx + i * 26 + 14, 320).C(cx + i * 40 + 18, 500, cx + i * 54 + 22, 680, cx + i * 62 + 24, t.hemY - 30).d(), light, 12, 0.16);
    }
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + inner + '</g>';
    if (o.strap) {
      [-1, 1].forEach(function (side) {
        out += cloth(g, P().M(cx + side * 44, t.shoulderY + t.neckDrop - 6).L(cx + side * 96, t.shoulderY - 40)
          .L(cx + side * 110, t.shoulderY - 34).L(cx + side * 58, t.shoulderY + t.neckDrop + 2).Z().d());
      });
    }
    return out;
  }

  /* ============================================================
     Footwear — drawn in profile, the way shoes are sold
     ============================================================ */
  /* Shoes are drawn in profile with the toe to the left, the way
     every sportswear site shoots them. Ground line at y = 330. */
  var GROUND = 330;

  function outsole(g, colour, toeX, heelX, top, opts) {
    opts = opts || {};
    var mid = P()
      .M(toeX - 6, top)
      .C(toeX - 18, top + 20, toeX - 10, GROUND - 6, toeX + 22, GROUND - 2)
      .L(heelX - 26, GROUND)
      .C(heelX + 4, GROUND - 4, heelX + 14, top + 22, heelX + 8, top - 6)
      .L(toeX - 6, top)
      .Z().d();
    var s = '<path d="' + mid + '" fill="' + g.paint.cylinder(colour) + '"/>' +
      SM.materials.overlay(mid, 'leather', 0.45) +
      '<path d="' + mid + '" fill="none" stroke="' + shade(colour, -0.35) + '" stroke-width="1.6" opacity=".7"/>' +
      '<path d="' + P().M(toeX - 12, GROUND - 20).C(toeX + 60, GROUND + 4, heelX - 60, GROUND + 6, heelX + 12, GROUND - 22).d() +
      '" fill="none" stroke="' + shade(colour, -0.6) + '" stroke-width="14" stroke-linecap="round" opacity=".9"/>';
    if (opts.airUnit) {
      s += '<ellipse cx="' + (heelX - 66) + '" cy="' + (GROUND - 26) + '" rx="46" ry="16" fill="' + shade(colour, -0.22) + '" opacity=".5"/>';
    }
    return s;
  }

  function sneaker(g) {
    var o = g.item.opts || {};
    var sole = o.sole || '#F2EFE7';
    var toeX = 86, heelX = 606, midTop = 286;
    var out = groundShadow(g, 350, GROUND + 14, 260, 16);

    /* Upper: toe box, vamp, throat, collar, heel counter. */
    var upper = P()
      .M(toeX + 4, midTop)
      .C(86, 232, 152, 200, 232, 190)
      .C(304, 180, 358, 168, 396, 150)
      .C(434, 132, 472, 120, 514, 120)
      .C(566, 120, 600, 152, 610, 206)
      .C(616, 240, 614, 266, 612, midTop)
      .L(toeX + 4, midTop)
      .Z().d();
    out += cloth(g, upper);
    out += '<g clip-path="url(#' + g.paint.clip(upper) + ')">' +
      seamLine(P().M(250, 190).C(240, 226, 244, 258, 256, midTop).d(), shade(g.item.colour, -0.5)) +
      seamLine(P().M(360, 168).C(348, 208, 352, 248, 364, midTop).d(), shade(g.item.colour, -0.5)) +
      highlight(P().M(150, 232).C(240, 202, 330, 190, 400, 176).d(), warm(g.item.colour, 0.45), 16, 0.22) +
      '</g>';

    /* Collar opening and heel counter. */
    out += inside(g, P().M(500, 126).C(546, 118, 584, 142, 596, 186)
      .C(566, 168, 528, 160, 500, 164).Z().d());
    out += cloth(g, P().M(556, 130).C(592, 148, 612, 190, 614, 240)
      .C(596, 206, 572, 176, 546, 158).Z().d(), { colour: shade(g.item.colour, -0.14) });

    /* Tongue rising out of the throat. */
    out += cloth(g, P().M(392, 152).C(414, 116, 460, 100, 502, 106)
      .C(500, 138, 474, 158, 434, 172).Z().d(), { colour: shade(g.item.colour, 0.07) });

    /* Side panel — the graphic that makes a sneaker recognisable. */
    var accent = o.accent || shade(g.item.colour, lum(g.item.colour) > 0.5 ? -0.5 : 0.4);
    out += '<path d="' + P().M(190, midTop - 12).C(268, 254, 350, 216, 432, 170)
      .C(452, 158, 464, 176, 446, 190).C(360, 240, 280, 274, 208, midTop).Z().d() +
      '" fill="' + accent + '" opacity=".9"/>';

    /* Lacing */
    var lace = o.lace || '#EFEAE0';
    for (var i = 0; i < 5; i++) {
      var lx = 388 + i * 28, ly = 164 - i * 11;
      out += '<path d="M' + lx + ' ' + (ly + 10) + ' Q' + (lx + 18) + ' ' + (ly - 18) + ' ' + (lx + 38) + ' ' + (ly - 8) +
        '" fill="none" stroke="' + lace + '" stroke-width="7" stroke-linecap="round"/>';
      out += '<circle cx="' + (lx + 1) + '" cy="' + (ly + 12) + '" r="3.6" fill="' + shade(g.item.colour, -0.5) + '"/>';
      out += '<circle cx="' + (lx + 40) + '" cy="' + (ly - 6) + '" r="3.6" fill="' + shade(g.item.colour, -0.5) + '"/>';
    }

    out += outsole(g, sole, toeX, heelX, midTop, { airUnit: o.airUnit });
    return out;
  }

  function boot(g) {
    var o = g.item.opts || {};
    var out = groundShadow(g, 344, GROUND + 14, 240, 16);
    var shaftTop = o.tall ? 46 : 92;
    var toeX = 110, heelX = 588, midTop = 294;
    var upper = P()
      .M(toeX + 4, midTop)
      .C(104, 246, 154, 216, 240, 204)
      .C(320, 192, 372, 180, 400, 168)
      .L(404, shaftTop + 6)
      .C(452, shaftTop - 8, 540, shaftTop - 4, 566, shaftTop + 10)
      .L(578, 210)
      .C(590, 244, 596, 272, 594, midTop)
      .L(toeX + 4, midTop)
      .Z().d();
    out += cloth(g, upper, { gloss: g.item.material === 'leather' });
    out += '<g clip-path="url(#' + g.paint.clip(upper) + ')">' +
      fold(P().M(416, 200).C(400, 234, 404, 262, 420, 290).d(), shade(g.item.colour, -0.55), 8) +
      fold(P().M(300, 210).C(288, 240, 292, 266, 306, 292).d(), shade(g.item.colour, -0.55), 7, 0.8) +
      highlight(P().M(478, shaftTop + 40).C(470, 184, 472, 240, 478, 288).d(), warm(g.item.colour, 0.4), 26, 0.16) +
      '</g>';
    if (o.elastic) {
      var gore = P().M(548, shaftTop + 12).L(560, 212).L(586, 218).L(572, shaftTop + 6).Z().d();
      out += '<path d="' + gore + '" fill="' + shade(g.item.colour, -0.32) + '"/>' + SM.materials.overlay(gore, 'rib', 1);
      out += '<rect x="560" y="' + (shaftTop - 6) + '" width="30" height="12" rx="5" fill="' + shade(g.item.colour, -0.42) + '"/>';
    } else {
      for (var i = 0; i < 5; i++) {
        var y = shaftTop + 34 + i * 34;
        out += '<path d="M420 ' + y + ' L486 ' + (y + 14) + '" stroke="' + (o.lace || '#3A322A') + '" stroke-width="6" stroke-linecap="round"/>';
        out += metalRivet(420, y, 4.8);
        out += metalRivet(488, y + 14, 4.8);
      }
    }
    var welt = o.welt || shade(g.item.colour, 0.3);
    out += '<path d="' + P().M(toeX - 4, midTop - 4).L(596, midTop).L(598, midTop + 18).L(toeX - 6, midTop + 14).Z().d() +
      '" fill="' + welt + '"/>';
    out += stitch(P().M(toeX, midTop + 6).L(594, midTop + 10).d(), shade(welt, -0.4), '7 6', 2);
    out += outsole(g, shade(g.item.colour, -0.5), toeX - 4, heelX, midTop + 14, {});
    return out;
  }

  function flatShoe(g) {
    var o = g.item.opts || {};
    var toeX = 118, heelX = 578, midTop = 288;
    var out = groundShadow(g, 344, GROUND + 12, 230, 14);
    var upper = P()
      .M(toeX + 2, midTop)
      .C(108, 240, 168, 212, 262, 200)
      .C(352, 188, 428, 180, 484, 190)
      .C(548, 202, 582, 240, 584, midTop)
      .L(toeX + 2, midTop)
      .Z().d();
    out += cloth(g, upper, { gloss: true });
    out += '<g clip-path="url(#' + g.paint.clip(upper) + ')">' +
      highlight(P().M(180, 250).C(280, 222, 400, 212, 500, 226).d(), warm(g.item.colour, 0.5), 20, 0.2) +
      fold(P().M(300, 204).C(292, 236, 296, 262, 308, 288).d(), shade(g.item.colour, -0.55), 7, 0.7) +
      '</g>';
    out += inside(g, P().M(340, 202).C(390, 190, 452, 190, 492, 202)
      .C(452, 214, 390, 216, 340, 210).Z().d());
    if (o.penny) {
      out += cloth(g, P().M(304, 212).C(344, 202, 400, 200, 436, 208).L(434, 238).C(398, 228, 344, 230, 306, 238).Z().d(),
        { colour: shade(g.item.colour, -0.12) });
      out += '<rect x="356" y="214" width="30" height="9" rx="4" fill="' + shade(g.item.colour, -0.5) + '"/>';
    }
    if (o.lace) {
      for (var i = 0; i < 3; i++) {
        out += '<path d="M' + (360 + i * 26) + ' 214 L' + (396 + i * 26) + ' 226" stroke="' + shade(g.item.colour, -0.55) + '" stroke-width="5" stroke-linecap="round"/>';
      }
    }
    if (o.heel) {
      out += cloth(g, P().M(508, midTop - 4).L(548, midTop - 4).L(560, GROUND + 78).L(530, GROUND + 78).Z().d(),
        { colour: shade(g.item.colour, -0.08) });
      out += groundShadow(g, 546, GROUND + 84, 40, 8);
      out += '<path d="' + P().M(toeX - 2, midTop - 2).C(180, midTop + 22, 440, midTop + 24, 552, midTop - 2).L(550, midTop + 14)
        .C(438, midTop + 40, 178, midTop + 38, toeX - 4, midTop + 14).Z().d() +
        '" fill="' + shade(g.item.colour, -0.6) + '"/>';
      return out;
    }
    out += outsole(g, shade(g.item.colour, -0.55), toeX - 2, heelX, midTop, {});
    return out;
  }

  function sandal(g) {
    var out = groundShadow(g, 340, 300, 210, 14);
    var base = P().M(120, 262).C(180, 250, 500, 244, 580, 254).L(584, 286).C(500, 300, 180, 302, 118, 288).Z().d();
    out += cloth(g, base, { gloss: true });
    [0, 1].forEach(function (i) {
      var x = 230 + i * 130;
      out += cloth(g, P().M(x, 258).C(x + 30, 206, x + 110, 202, x + 140, 250).L(x + 140, 264).C(x + 108, 224, x + 32, 228, x + 4, 268).Z().d(),
        { colour: shade(g.item.colour, 0.04), gloss: true });
    });
    out += '<path d="' + P().M(116, 286).C(180, 302, 500, 300, 584, 284).L(582, 300).C(498, 318, 178, 320, 114, 300).Z().d() +
      '" fill="' + shade(g.item.colour, -0.55) + '"/>';
    return out;
  }

  /* ============================================================
     Accessories
     ============================================================ */
  function cap(g) {
    var o = g.item.opts || {};
    var out = groundShadow(g, 300, 322, 200, 16);
    var crown = P().M(120, 268).C(112, 150, 214, 84, 320, 84).C(422, 84, 508, 148, 502, 268).Z().d();
    out += cloth(g, crown);
    out += '<g clip-path="url(#' + g.paint.clip(crown) + ')">' +
      seamLine(P().M(320, 86).L(320, 268).d(), shade(g.item.colour, -0.5)) +
      seamLine(P().M(212, 108).C(238, 180, 244, 226, 244, 268).d(), shade(g.item.colour, -0.5)) +
      seamLine(P().M(428, 108).C(402, 180, 396, 226, 396, 268).d(), shade(g.item.colour, -0.5)) +
      highlight(P().M(200, 200).C(214, 140, 268, 106, 322, 100).d(), warm(g.item.colour, 0.45), 22, 0.2) +
      '</g>';
    out += '<circle cx="320" cy="90" r="10" fill="' + shade(g.item.colour, -0.2) + '"/>';
    var brim = o.flat
      ? P().M(120, 262).L(560, 250).L(566, 292).L(120, 300).Z().d()
      : P().M(118, 262).C(180, 300, 470, 320, 596, 286).C(584, 318, 420, 348, 200, 330).C(150, 322, 118, 300, 118, 262).Z().d();
    out += cloth(g, brim, { colour: shade(g.item.colour, -0.1) });
    out += stitch(P().M(140, 284).C(220, 318, 440, 332, 578, 296).d(), thread(g.item), '7 6', 2);
    return out;
  }

  function beanie(g) {
    var out = groundShadow(g, 300, 338, 180, 14);
    var body = P().M(140, 300).C(126, 150, 220, 74, 320, 74).C(420, 74, 514, 150, 500, 300).Z().d();
    out += cloth(g, body);
    out += SM.materials.overlay(body, 'rib', 1);
    out += ribBand(g, P().M(132, 292).C(220, 314, 420, 314, 508, 292).L(510, 356).C(420, 380, 220, 380, 130, 356).Z().d(),
      shade(g.item.colour, -0.06));
    return out;
  }

  function sunglasses(g) {
    var out = groundShadow(g, 320, 250, 220, 12);
    var frame = g.item.colour;
    [-1, 1].forEach(function (side) {
      var x = 320 + side * 118;
      var lens = P().M(x - 92, 150).C(x - 96, 216, x + 78, 226, x + 84, 158)
        .C(x + 30, 140, x - 40, 140, x - 92, 150).Z().d();
      out += '<path d="' + lens + '" fill="' + g.paint.cylinder(mix(frame, '#111014', 0.55), { gloss: true }) + '" opacity=".92"/>';
      out += '<path d="' + P().M(x - 96, 146).C(x - 100, 224, x + 82, 234, x + 88, 154)
        .C(x + 30, 132, x - 42, 132, x - 96, 146).Z().d() +
        '" fill="none" stroke="' + frame + '" stroke-width="13"/>';
      out += highlight(P().M(x - 70, 164).C(x - 50, 190, x - 16, 200, x + 10, 196).d(), '#FFFFFF', 9, 0.3);
    });
    out += '<path d="M296 152 C310 140 330 140 344 152" fill="none" stroke="' + frame + '" stroke-width="12" stroke-linecap="round"/>';
    return out;
  }

  function scarf(g) {
    var out = groundShadow(g, 320, 620, 200, 20);
    var body = P().M(150, 120).C(120, 260, 160, 420, 210, 600)
      .L(340, 588).C(300, 400, 288, 250, 316, 118).Z().d();
    out += cloth(g, body);
    out += cloth(g, P().M(316, 118).C(346, 250, 380, 400, 356, 588)
      .L(486, 600).C(506, 420, 500, 260, 470, 120).Z().d(), { colour: shade(g.item.colour, -0.06) });
    var inner = '';
    for (var i = 0; i < 6; i++) {
      inner += fold(P().M(180 + i * 54, 130).C(176 + i * 54, 300, 190 + i * 52, 450, 200 + i * 50, 596).d(), shade(g.item.colour, -0.5), 8, 0.8);
    }
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' + inner + '</g>';
    for (var f = 0; f < 12; f++) {
      var fx = 200 + f * 26;
      out += '<path d="M' + fx + ' 594 L' + (fx + 3) + ' 646" stroke="' + shade(g.item.colour, -0.15) + '" stroke-width="6" stroke-linecap="round"/>';
    }
    return out;
  }

  function belt(g) {
    var out = groundShadow(g, 320, 250, 260, 12);
    var strap = P().M(60, 180).L(500, 176).L(502, 226).L(60, 230).Z().d();
    out += cloth(g, strap, { gloss: true });
    out += stitch(P().M(72, 188).L(492, 184).d(), thread(g.item), '8 7', 2);
    out += stitch(P().M(72, 218).L(492, 214).d(), thread(g.item), '8 7', 2);
    out += '<rect x="496" y="162" width="18" height="80" rx="6" fill="#B9A88C"/>';
    out += '<rect x="512" y="170" width="66" height="64" rx="10" fill="none" stroke="#C9B999" stroke-width="14"/>';
    out += '<rect x="506" y="196" width="52" height="9" rx="4" fill="#C9B999"/>';
    for (var i = 0; i < 5; i++) {
      out += '<ellipse cx="' + (120 + i * 34) + '" cy="203" rx="6" ry="9" fill="' + shade(g.item.colour, -0.6) + '"/>';
    }
    return out;
  }

  function bagTote(g) {
    var out = groundShadow(g, 320, 616, 190, 18);
    var body = P().M(126, 220).L(514, 220).C(524, 380, 512, 520, 500, 600)
      .C(400, 618, 240, 618, 140, 600).C(128, 520, 116, 380, 126, 220).Z().d();
    out += cloth(g, body);
    out += '<g clip-path="url(#' + g.paint.clip(body) + ')">' +
      fold(P().M(220, 226).C(206, 380, 212, 500, 224, 596).d(), shade(g.item.colour, -0.5), 10) +
      fold(P().M(420, 226).C(434, 380, 428, 500, 416, 596).d(), shade(g.item.colour, -0.5), 10) +
      highlight(P().M(300, 240).C(292, 380, 296, 500, 306, 592).d(), warm(g.item.colour, 0.4), 30, 0.14) +
      '</g>';
    [-1, 1].forEach(function (side) {
      var x = 320 + side * 92;
      out += '<path d="M' + (x - 26) + ' 224 C' + (x - 22) + ' 110 ' + (x + 22) + ' 110 ' + (x + 26) + ' 224" fill="none" stroke="' +
        g.paint.cylinder(shade(g.item.colour, -0.12)) + '" stroke-width="20" stroke-linecap="round"/>';
    });
    out += stitch(P().M(140, 236).L(500, 236).d(), thread(g.item), '8 7', 2);
    return out;
  }

  function bagShoulder(g) {
    var out = groundShadow(g, 330, 590, 170, 16);
    out += '<path d="' + P().M(150, 330).C(120, 180, 200, 96, 320, 96).C(440, 96, 520, 180, 490, 330).d() +
      '" fill="none" stroke="' + g.paint.cylinder(shade(g.item.colour, -0.15)) + '" stroke-width="18" stroke-linecap="round"/>';
    var body = P().M(150, 320).L(490, 320).C(504, 420, 500, 510, 492, 566)
      .C(400, 584, 240, 584, 148, 566).C(140, 510, 136, 420, 150, 320).Z().d();
    out += cloth(g, body, { gloss: g.item.material === 'leather' });
    out += cloth(g, P().M(144, 312).L(496, 312).C(504, 366, 500, 404, 494, 424)
      .C(400, 442, 240, 442, 146, 424).C(140, 404, 136, 366, 144, 312).Z().d(),
      { colour: shade(g.item.colour, -0.07), gloss: true });
    out += stitch(P().M(160, 322).L(482, 322).d(), thread(g.item), '8 7', 2);
    out += '<rect x="296" y="414" width="48" height="34" rx="8" fill="#B9A88C"/>';
    out += '<rect x="306" y="424" width="28" height="14" rx="5" fill="#8A7B62"/>';
    return out;
  }

  /* ============================================================
     Registry
     ============================================================ */
  var SHAPES = {
    tee: { fn: tee, view: '0 0 640 660' },
    tank: { fn: tee, view: '0 0 640 660' },
    shirt: { fn: shirt, view: '0 0 640 700' },
    knit: { fn: knit, view: '0 0 640 660' },
    hoodie: { fn: hoodie, view: '0 0 640 680' },

    blazer: { fn: function (g) { return openJacket(g, { shoulderHalf: 156, chestHalf: 172, hemY: 600, lapel: 190, collarHalf: 50, buttons: 2, buttonGap: 96, pockets: 'welt' }); }, view: '0 0 640 700' },
    coat: { fn: function (g) { return openJacket(g, { shoulderHalf: 168, chestHalf: 190, hemY: 800, hemHalf: 206, lapel: 210, collarHalf: 58, buttons: 3, buttonGap: 110, pockets: 'welt' }); }, view: '0 0 640 880' },
    trench: { fn: function (g) { return openJacket(g, { shoulderHalf: 170, chestHalf: 192, hemY: 740, hemHalf: 210, lapel: 200, collarHalf: 62, buttons: 3, buttonGap: 104, pockets: 'flap' }); }, view: '0 0 640 820' },
    denimJacket: { fn: function (g) { return openJacket(g, { shoulderHalf: 158, chestHalf: 172, hemY: 520, gap: 10, collarHalf: 56, buttons: 4, buttonGap: 74, pockets: 'flap' }); }, view: '0 0 640 600' },
    workJacket: { fn: function (g) { return openJacket(g, { shoulderHalf: 164, chestHalf: 178, hemY: 540, gap: 14, collarHalf: 58, buttons: 4, buttonGap: 84, pockets: 'flap' }); }, view: '0 0 640 640' },
    bomber: { fn: function (g) { return openJacket(g, { shoulderHalf: 162, chestHalf: 178, hemY: 500, gap: 12, collarHalf: 54, pockets: 'welt' }); }, view: '0 0 640 600' },
    cardigan: { fn: function (g) { return openJacket(g, { shoulderHalf: 154, chestHalf: 168, hemY: 560, gap: 14, collarHalf: 44, buttons: 5, buttonGap: 78 }); }, view: '0 0 640 660' },
    puffer: { fn: puffer, view: '0 0 640 740' },

    jeans: { fn: trousers, view: '0 0 560 900' },
    trousers: { fn: trousers, view: '0 0 560 900' },
    cargo: { fn: trousers, view: '0 0 560 900' },
    joggers: { fn: trousers, view: '0 0 560 900' },
    shorts: { fn: trousers, view: '0 0 560 620' },
    skirt: { fn: skirt, view: '0 0 560 740' },
    dress: { fn: dress, view: '0 0 640 900' },

    sneaker: { fn: sneaker, view: '0 0 700 380' },
    boot: { fn: boot, view: '0 0 700 400' },
    flatShoe: { fn: flatShoe, view: '0 0 700 380' },
    heel: { fn: flatShoe, view: '0 0 700 460' },
    sandal: { fn: sandal, view: '0 0 700 360' },

    cap: { fn: cap, view: '0 0 640 380' },
    beanie: { fn: beanie, view: '0 0 640 400' },
    sunglasses: { fn: sunglasses, view: '0 0 640 300' },
    scarf: { fn: scarf, view: '0 0 640 680' },
    belt: { fn: belt, view: '0 0 640 300' },
    bagTote: { fn: bagTote, view: '0 0 640 660' },
    bagShoulder: { fn: bagShoulder, view: '0 0 640 640' }
  };

  SM.garment = {
    shapes: SHAPES,

    /* The catalogue image. A real photograph always wins — the
       drawing is only a stand-in until one exists. */
    productShot: function (item, opts) {
      opts = opts || {};
      if (!opts.forceDrawing && SM.images) {
        var photo = SM.images.get(item, opts.view || 'product');
        if (photo) return SM.images.tag(photo, item, opts.view || 'product', 'shot-photo');
      }
      var def = SHAPES[item.shape] || SHAPES.tee;
      var paint = SM.newPaint();
      var body = def.fn({ item: item, paint: paint });
      return '<svg class="shot" viewBox="' + def.view + '" preserveAspectRatio="xMidYMid meet" ' +
        'role="img" aria-label="' + String(item.name).replace(/"/g, '') + '">' +
        '<defs>' + SM.materials.defs() + '</defs>' +
        body + paint.markup() + '</svg>';
    },

    helpers: {
      fold: fold, highlight: highlight, stitch: stitch, seamLine: seamLine, cloth: cloth,
      ribBand: ribBand, button: button, zipper: zipper, inside: inside, metalRivet: metalRivet,
      thread: thread, edgeColour: edgeColour, groundShadow: groundShadow
    }
  };
})(window.SM);
