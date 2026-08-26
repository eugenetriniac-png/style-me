/* ============================================================
   STYLE ME — figure.js

   The human figure. Everything is driven by one skeleton so that
   garments can be fitted to it later, and so that height and build
   actually change the silhouette.

   Proportions follow the standard eight-head figure used in
   fashion drawing. The pose is a mild contrapposto — weight on one
   leg, pelvis tipped, shoulders counter-tipped — because a
   perfectly symmetrical stance is the single thing that makes a
   drawn person look like a mannequin.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  /* ---------- colour utilities --------------------------------- */
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(c) {
    return '#' + c.map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  function shade(hex, amt) {
    var c = hexToRgb(hex);
    return rgbToHex(c.map(function (v) {
      return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
    }));
  }
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; }));
  }
  function luminance(hex) {
    var c = hexToRgb(hex);
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }
  /* Warm the highlight, cool the shadow. Flat light/dark ramps of a
     single hue are the main reason flat illustration looks plastic. */
  function warm(hex, amt) { return mix(shade(hex, amt), '#FFD9A8', 0.18); }
  function cool(hex, amt) { return mix(shade(hex, amt), '#2A3550', 0.16); }

  SM.color = {
    hexToRgb: hexToRgb, rgbToHex: rgbToHex,
    shade: shade, mix: mix, luminance: luminance, warm: warm, cool: cool
  };

  /* ---------- per-render definition collector ------------------ */
  var seq = 0;
  SM.newPaint = function () {
    var defs = [];
    var tag = 'p' + (++seq);
    var n = 0;

    function add(markup) { defs.push(markup); }

    /* A six-stop horizontal ramp. Rim shadow, highlight, body,
       core shadow, then a touch of bounce light on the far edge —
       the way a cylinder actually behaves under one key light. */
    function cylinder(base, opt) {
      opt = opt || {};
      var id = tag + '_c' + (++n);
      var flip = opt.flip ? 1 : 0;
      var stops =
        '<stop offset="0" stop-color="' + cool(base, -0.34) + '"/>' +
        '<stop offset="0.10" stop-color="' + shade(base, -0.10) + '"/>' +
        '<stop offset="0.32" stop-color="' + warm(base, opt.gloss ? 0.30 : 0.16) + '"/>' +
        '<stop offset="0.58" stop-color="' + base + '"/>' +
        '<stop offset="0.86" stop-color="' + cool(base, -0.30) + '"/>' +
        '<stop offset="1" stop-color="' + shade(base, -0.14) + '"/>';
      add('<linearGradient id="' + id + '" x1="' + flip + '" y1="0" x2="' + (1 - flip) + '" y2="0">' + stops + '</linearGradient>');
      return 'url(#' + id + ')';
    }

    /* Vertical ramp — used for hems fading into shadow. */
    function drop(base, topAmt, bottomAmt) {
      var id = tag + '_d' + (++n);
      add('<linearGradient id="' + id + '" x1="0" y1="0" x2="0.25" y2="1">' +
        '<stop offset="0" stop-color="' + warm(base, topAmt) + '"/>' +
        '<stop offset="0.55" stop-color="' + base + '"/>' +
        '<stop offset="1" stop-color="' + cool(base, bottomAmt) + '"/>' +
        '</linearGradient>');
      return 'url(#' + id + ')';
    }

    function radial(inner, outer, opacity) {
      var id = tag + '_r' + (++n);
      add('<radialGradient id="' + id + '">' +
        '<stop offset="0" stop-color="' + inner + '" stop-opacity="' + (opacity || 1) + '"/>' +
        '<stop offset="1" stop-color="' + outer + '" stop-opacity="0"/>' +
        '</radialGradient>');
      return 'url(#' + id + ')';
    }

    function clip(d) {
      var id = tag + '_k' + (++n);
      add('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>');
      return id;
    }

    function blur(amount) {
      var id = tag + '_b' + (++n);
      add('<filter id="' + id + '" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feGaussianBlur stdDeviation="' + amount + '"/></filter>');
      return id;
    }

    return {
      cylinder: cylinder, drop: drop, radial: radial, clip: clip, blur: blur,
      raw: add,
      markup: function () { return '<defs>' + defs.join('') + '</defs>'; }
    };
  };

  /* ============================================================
     Skeleton
     ============================================================ */
  var VIEW = { w: 600, h: 1240 };
  SM.FIGURE_VIEWBOX = '0 0 ' + VIEW.w + ' ' + VIEW.h;
  SM.FIGURE_VIEW = VIEW;

  function pt(x, y) { return { x: x, y: y }; }

  SM.figure = {};

  SM.figure.skeleton = function (look) {
    look = look || {};
    var build = clamp(look.build === undefined ? 0.42 : look.build, 0, 1);
    var height = clamp(look.height === undefined ? 0.5 : look.height, 0, 1);
    var frame = clamp(look.frame === undefined ? 0.45 : look.frame, 0, 1);

    var cx = VIEW.w / 2;
    var H = 132 + height * 10;          // one head
    var top = 96 - height * 26;
    var sway = 13;                       // pelvis offset onto the weight leg

    var s = {
      cx: cx, H: H, build: build, frame: frame, sway: sway,
      headTop: top,
      chin: top + H,
      headRx: H * 0.345,
      headRy: H * 0.50,
      headCy: top + H * 0.50
    };

    s.neckTop = s.chin - H * 0.12;
    s.neckBase = s.chin + H * 0.24;
    s.shoulderY = top + H * 1.30;
    s.armpitY = top + H * 1.88;
    s.bustY = top + H * 2.05;
    s.waistY = top + H * 2.95;
    s.hipY = top + H * 3.55;
    s.crotchY = top + H * 4.00;
    s.kneeY = top + H * 5.68;
    s.calfY = top + H * 6.15;
    s.ankleY = top + H * 7.58;
    s.soleY = top + H * 8.00;

    /* Widths are set against the head, the way a croquis is
       measured: shoulders about two heads across, waist a little
       over one, hips between the two. */
    s.neckHalf = 17 + build * 4;
    s.shoulderHalf = 74 + frame * 20 + build * 16;
    s.bustHalf = 62 + frame * 8 + build * 18;
    s.waistHalf = 41 + build * 28 + frame * 8;
    s.hipHalf = 78 - frame * 10 + build * 22;
    s.thighHalf = 39 + build * 16;
    s.kneeHalf = 26 + build * 7;
    s.calfHalf = 30 + build * 9;
    s.ankleHalf = 16 + build * 3;
    s.upperArmW = 18 + build * 7;
    s.forearmW = 14 + build * 5;

    s.hideBriefs = !!look.hideBriefs;
    s.hideBand = !!look.hideBand;

    /* Lean: shoulders drift away from the weight-bearing hip. */
    s.shoulderOff = -sway * 0.42;
    s.waistOff = sway * 0.15;
    s.hipOff = sway;

    /* Legs. Right (viewer's right, +x) carries the weight and runs
       almost straight; the left is released, knee closer in. */
    s.legs = {
      right: {
        hip: pt(cx + sway + s.hipHalf * 0.44, s.crotchY - 34),
        knee: pt(cx + sway + 24, s.kneeY),
        ankle: pt(cx + sway + 17, s.ankleY),
        inner: pt(cx + sway + 5, s.crotchY)
      },
      left: {
        hip: pt(cx + sway - s.hipHalf * 0.48, s.crotchY - 34),
        knee: pt(cx + sway - 33, s.kneeY - 8),
        ankle: pt(cx + sway - 44, s.ankleY + 4),
        inner: pt(cx + sway - 5, s.crotchY)
      }
    };

    /* Arms hang with a small gap and a soft elbow break. The
       shoulder joint sits inside the deltoid so the arm grows out
       of the torso instead of being parked next to it. */
    function arm(sign, extra) {
      var sx = cx + s.shoulderOff + sign * (s.shoulderHalf - s.upperArmW * 0.95);
      return {
        shoulder: pt(sx, s.shoulderY + 20),
        elbow: pt(cx + sign * (s.shoulderHalf + 6 + extra), s.waistY + 22),
        wrist: pt(cx + sign * (s.shoulderHalf + 1 + extra * 0.4), s.crotchY + 26),
        hand: pt(cx + sign * (s.shoulderHalf + extra * 0.3), s.crotchY + 80)
      };
    }
    s.arms = { left: arm(-1, 2), right: arm(1, 7) };

    return s;
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- path helpers ------------------------------------- */
  function P() {
    var d = '';
    var api = {
      M: function (x, y) { d += 'M' + r(x) + ' ' + r(y); return api; },
      L: function (x, y) { d += 'L' + r(x) + ' ' + r(y); return api; },
      C: function (a, b, c, e, f, g) { d += 'C' + r(a) + ' ' + r(b) + ' ' + r(c) + ' ' + r(e) + ' ' + r(f) + ' ' + r(g); return api; },
      Q: function (a, b, c, e) { d += 'Q' + r(a) + ' ' + r(b) + ' ' + r(c) + ' ' + r(e); return api; },
      Z: function () { d += 'Z'; return api; },
      d: function () { return d; }
    };
    return api;
  }
  function r(v) { return Math.round(v * 10) / 10; }
  SM.P = P;

  /* A tapered limb: a closed outline from joint to joint so the
     silhouette narrows the way a real arm or leg does. */
  function limb(a, b, c, wA, wB, wC) {
    var p = P();
    p.M(a.x - wA, a.y);
    p.C(a.x - wA - 2, a.y + (b.y - a.y) * 0.4, b.x - wB - 3, b.y - (b.y - a.y) * 0.35, b.x - wB, b.y);
    p.C(b.x - wB - 1, b.y + (c.y - b.y) * 0.4, c.x - wC - 2, c.y - (c.y - b.y) * 0.3, c.x - wC, c.y);
    p.L(c.x + wC, c.y);
    p.C(c.x + wC + 2, c.y - (c.y - b.y) * 0.3, b.x + wB + 1, b.y + (c.y - b.y) * 0.4, b.x + wB, b.y);
    p.C(b.x + wB + 3, b.y - (b.y - a.y) * 0.35, a.x + wA + 2, a.y + (b.y - a.y) * 0.4, a.x + wA, a.y);
    p.Z();
    return p.d();
  }
  SM.figure.limbPath = limb;

  /* ============================================================
     Skin
     ============================================================ */
  SM.SKIN_TONES = [
    { key: 'porcelain', hex: '#F6DFCB' },
    { key: 'fair',      hex: '#EFCDAE' },
    { key: 'light',     hex: '#E3B48D' },
    { key: 'olive',     hex: '#CE9A6E' },
    { key: 'tan',       hex: '#B27B50' },
    { key: 'brown',     hex: '#8E5A34' },
    { key: 'deep',      hex: '#6A3F24' },
    { key: 'rich',      hex: '#4B2A18' }
  ];

  SM.HAIR_COLOURS = [
    { key: 'black',    hex: '#171310' },
    { key: 'darkBrown',hex: '#2E1F16' },
    { key: 'brown',    hex: '#4E3220' },
    { key: 'auburn',   hex: '#6E3320' },
    { key: 'blonde',   hex: '#B98B4E' },
    { key: 'platinum', hex: '#D8C8AC' },
    { key: 'grey',     hex: '#8B8880' },
    { key: 'dyed',     hex: '#3A34E8' }
  ];

  SM.HAIR_STYLES = ['short', 'buzz', 'bob', 'long', 'curly', 'bun'];

  function skinPaint(paint, skin) {
    return {
      arm: paint.cylinder(skin),
      armFar: paint.cylinder(shade(skin, -0.13), { flip: true }),
      leg: paint.cylinder(skin),
      legFar: paint.cylinder(shade(skin, -0.10)),
      torso: paint.cylinder(skin),
      neck: paint.cylinder(shade(skin, -0.16)),
      head: paint.cylinder(skin)
    };
  }

  /* ---------- legs, torso, arms -------------------------------- */
  SM.figure.body = function (s, look, paint) {
    var skin = look.skin || '#E3B48D';
    var g = skinPaint(paint, skin);
    var out = '';

    /* Every shading mark is clipped to the form it belongs to.
       An unclipped soft ellipse leaks past the silhouette and
       reads as a hard band floating next to the body. */
    function shaded(d, fill, marks) {
      return '<path d="' + d + '" fill="' + fill + '"/>' +
        '<g clip-path="url(#' + paint.clip(d) + ')">' + marks + '</g>';
    }

    /* --- legs (far leg first so it sits behind) --- */
    var L = s.legs.left, R = s.legs.right;
    var farLeg = limb(L.hip, L.knee, L.ankle, s.thighHalf * 0.92, s.kneeHalf, s.ankleHalf);
    var nearLeg = limb(R.hip, R.knee, R.ankle, s.thighHalf, s.kneeHalf, s.ankleHalf);

    out += foot(s, L, -1, shade(skin, -0.1));
    out += shaded(farLeg, g.legFar,
      softMark(paint, L.hip.x + 4, L.hip.y + 96, s.thighHalf * 0.55, 96, warm(skin, 0.08), 0.3) +
      softMark(paint, L.knee.x - 3, L.knee.y - 4, s.kneeHalf * 0.8, 20, shade(skin, -0.2), 0.4));

    out += foot(s, R, 1, skin);
    out += shaded(nearLeg, g.leg,
      /* quadriceps sweep, knee cap, calf swell */
      softMark(paint, R.hip.x - 6, R.hip.y + 96, s.thighHalf * 0.6, 104, warm(skin, 0.13), 0.38) +
      softMark(paint, R.knee.x + 3, R.knee.y - 4, s.kneeHalf * 0.85, 22, shade(skin, -0.17), 0.42) +
      softMark(paint, R.ankle.x + 7, s.calfY, s.calfHalf * 0.6, 56, warm(skin, 0.11), 0.32));

    /* --- arms, drawn before the torso so the shoulder joint is
       covered by the chest. Overlap is what reads as attachment;
       a cap drawn on top always looks like a puffed sleeve. --- */
    function drawArm(a, sign, fill, tone) {
      var armD = limb(a.shoulder, a.elbow, a.wrist, s.upperArmW, s.forearmW + 2, s.forearmW - 2);
      return shaded(armD, fill,
        softMark(paint, a.elbow.x - sign * 5, a.elbow.y, s.forearmW * 0.7, 30, shade(tone, -0.2), 0.4)) +
        hand(s, a, sign, tone, paint);
    }
    out += drawArm(s.arms.left, -1, g.armFar, shade(skin, -0.08));
    out += drawArm(s.arms.right, 1, g.arm, skin);

    /* --- torso --- */
    var torsoD = torsoPath(s);
    var cxS = s.cx + s.shoulderOff;
    var torsoMarks =
      softMark(paint, cxS + s.bustHalf * 0.66, s.bustY + 60, s.bustHalf * 0.5, 140, cool(skin, -0.22), 0.5) +
      softMark(paint, cxS - s.bustHalf * 0.28, s.bustY + 30, s.bustHalf * 0.44, 120, warm(skin, 0.12), 0.32) +
      softMark(paint, s.cx + s.waistOff + 3, s.waistY + 30, 7, 11, shade(skin, -0.32), 0.45);
    /* Collarbones: barely there, but they place the shoulders. */
    [-1, 1].forEach(function (sign) {
      torsoMarks += '<path d="' + P()
        .M(cxS + sign * (s.neckHalf + 6), s.neckBase + 2)
        .Q(cxS + sign * (s.shoulderHalf * 0.52), s.neckBase + 16, cxS + sign * (s.shoulderHalf * 0.76), s.neckBase + 10).d() +
        '" fill="none" stroke="' + shade(skin, -0.26) + '" stroke-opacity=".28" stroke-width="2.6" stroke-linecap="round"/>';
    });
    out += shaded(torsoD, g.torso, torsoMarks);

    /* --- base layer -------------------------------------------
       A plain briefs (and bandeau on a narrower frame) so the
       undressed figure is presentable in the studio, and so the
       pelvis reads as a body rather than an odd pale wedge. */
    if (!look.bare) {
      out += '<g clip-path="url(#' + paint.clip(torsoD) + ')">' + baseLayer(s, paint, skin) + '</g>';
    }

    return out;
  };

  function baseLayer(s, paint, skin) {
    var cxH = s.cx + s.hipOff, hi = s.hipHalf;
    /* Keyed off the skin so it stays a quiet undergarment rather
       than a bright white band across the figure. */
    var cloth = mix(skin, '#EFE9E1', 0.62);
    var briefs = P()
      .M(cxH - hi - 2, s.hipY - 4)
      .C(cxH - hi + 3, s.crotchY - 42, cxH - hi * 0.70, s.crotchY - 12, cxH - 8, s.crotchY + 14)
      .C(cxH - 4, s.crotchY + 4, cxH + 4, s.crotchY + 4, cxH + 8, s.crotchY + 14)
      .C(cxH + hi * 0.70, s.crotchY - 12, cxH + hi - 3, s.crotchY - 42, cxH + hi + 2, s.hipY - 4)
      .C(cxH + hi * 0.5, s.hipY - 18, cxH - hi * 0.5, s.hipY - 18, cxH - hi - 2, s.hipY - 4)
      .Z().d();
    var out = s.hideBriefs ? '' : '<path d="' + briefs + '" fill="' + paint.cylinder(cloth) + '"/>';
    if (s.frame < 0.55 && !s.hideBand) {
      var cxS = s.cx + s.shoulderOff, bu = s.bustHalf;
      out += '<path d="' + P()
        .M(cxS - bu - 2, s.bustY + 26)
        .C(cxS - bu * 0.4, s.bustY + 52, cxS + bu * 0.4, s.bustY + 52, cxS + bu + 2, s.bustY + 26)
        .L(cxS + bu + 2, s.bustY + 66)
        .C(cxS + bu * 0.4, s.bustY + 84, cxS - bu * 0.4, s.bustY + 84, cxS - bu - 2, s.bustY + 66)
        .Z().d() + '" fill="' + paint.cylinder(cloth) + '"/>';
    }
    return out;
  }

  /* Torso outline, read from the top down: trapezius sloping out of
     the neck, deltoid cap, armpit, ribcage tapering to the waist,
     flare over the hips, then an inverted V at the crotch. Skipping
     the trapezius slope is what makes a drawn torso look like a
     rectangle with a head on it. */
  function torsoPath(s) {
    var cxS = s.cx + s.shoulderOff, cxW = s.cx + s.waistOff, cxH = s.cx + s.hipOff;
    var sh = s.shoulderHalf, bu = s.bustHalf, wa = s.waistHalf, hi = s.hipHalf;
    var nh = s.neckHalf, nb = s.neckBase, shY = s.shoulderY;
    return P()
      .M(cxS - nh - 3, nb - 16)
      .C(cxS - nh - 20, nb - 4, cxS - sh + 18, shY - 6, cxS - sh, shY + 24)
      .C(cxS - sh - 4, shY + 40, cxS - bu - 14, s.armpitY - 16, cxS - bu, s.bustY + 14)
      .C(cxW - bu + 5, s.waistY - 62, cxW - wa - 3, s.waistY - 28, cxW - wa, s.waistY + 6)
      .C(cxH - wa - 9, s.waistY + 48, cxH - hi + 5, s.hipY - 32, cxH - hi, s.hipY + 12)
      .C(cxH - hi + 3, s.crotchY - 42, cxH - hi * 0.70, s.crotchY - 12, cxH - 8, s.crotchY + 12)
      .C(cxH - 4, s.crotchY + 2, cxH + 4, s.crotchY + 2, cxH + 8, s.crotchY + 12)
      .C(cxH + hi * 0.70, s.crotchY - 12, cxH + hi - 3, s.crotchY - 42, cxH + hi, s.hipY + 12)
      .C(cxH + hi - 5, s.hipY - 32, cxW + wa + 9, s.waistY + 48, cxW + wa, s.waistY + 6)
      .C(cxW + wa + 3, s.waistY - 28, cxS + bu - 5, s.waistY - 62, cxS + bu, s.bustY + 14)
      .C(cxS + bu + 14, s.armpitY - 16, cxS + sh + 4, shY + 40, cxS + sh, shY + 24)
      .C(cxS + sh - 18, shY - 6, cxS + nh + 20, nb - 4, cxS + nh + 3, nb - 16)
      .Z().d();
  }
  SM.figure.torsoPath = torsoPath;

  function softMark(paint, x, y, rx, ry, colour, opacity) {
    var fill = paint.radial(colour, colour, opacity);
    return '<ellipse cx="' + r(x) + '" cy="' + r(y) + '" rx="' + r(rx) + '" ry="' + r(ry) + '" fill="' + fill + '"/>';
  }
  SM.figure.softMark = softMark;

  /* Seen head-on a foot is heavily foreshortened: a short wedge
     from the ankle to the toes, turned a few degrees outward. */
  function foot(s, leg, sign, skin) {
    var x = leg.ankle.x + sign * 3, y = s.ankleY - 6, sole = s.soleY;
    var half = s.ankleHalf;
    /* Almost always hidden by a shoe, so this only needs to give
       the ankle something believable to sit on. */
    var d = P()
      .M(x - half, y)
      .C(x - half - 4, sole - 24, x - half - 4, sole - 3, x - half + 3, sole)
      .L(x + half + 12, sole)
      .C(x + half + 16, sole - 6, x + half + 4, y + 14, x + half, y)
      .Z().d();
    return '<path d="' + d + '" fill="' + skin + '"/>' +
      '<ellipse cx="' + r(x + half * 0.2) + '" cy="' + r(sole - 16) + '" rx="' + r(half * 1.1) +
      '" ry="10" fill="' + shade(skin, -0.14) + '" opacity=".45"/>';
  }

  /* A hand that reads at small sizes: palm mass, thumb, and two
     finger separations. More detail than that just turns to mud. */
  /* A relaxed hand: the palm mass narrows into fingers that taper
     and come to a rounded point, with the thumb tucked against the
     thigh. Anything more articulated turns to mud at feed size. */
  function hand(s, arm, sign, skin, paint) {
    var w = arm.wrist, h = arm.hand;
    var ww = s.forearmW - 2;
    var tip = h.y + 4;
    var palm = P()
      .M(w.x - ww, w.y - 4)
      .C(w.x - ww - 3, w.y + 24, h.x - ww - 1, h.y - 30, h.x - ww * 0.86, h.y - 12)
      .C(h.x - ww * 0.7, tip - 2, h.x + ww * 0.7, tip - 2, h.x + ww * 0.86, h.y - 12)
      .C(h.x + ww + 1, h.y - 30, w.x + ww + 3, w.y + 24, w.x + ww, w.y - 4)
      .Z().d();
    var thumbX = w.x - sign * (ww - 2);
    var thumbY = w.y + 26;
    return '<path d="' + palm + '" fill="' + paint.cylinder(skin) + '"/>' +
      '<g clip-path="url(#' + paint.clip(palm) + ')">' +
      '<path d="' + P().M(h.x - ww * 0.3, h.y - 34).L(h.x - ww * 0.34, h.y - 6).d() +
      '" stroke="' + shade(skin, -0.26) + '" stroke-opacity=".45" stroke-width="1.8" fill="none"/>' +
      '<path d="' + P().M(h.x + ww * 0.28, h.y - 34).L(h.x + ww * 0.32, h.y - 6).d() +
      '" stroke="' + shade(skin, -0.26) + '" stroke-opacity=".45" stroke-width="1.8" fill="none"/>' +
      '</g>' +
      '<ellipse cx="' + r(thumbX) + '" cy="' + r(thumbY) + '" rx="' + r(ww * 0.38) +
      '" ry="11" transform="rotate(' + (sign * 16) + ' ' + r(thumbX) + ' ' + r(thumbY) +
      ')" fill="' + shade(skin, 0.04) + '"/>';
  }

  /* ============================================================
     Head, face, hair
     ============================================================ */
  SM.figure.hairBack = function (s, look, paint) {
    var colour = look.hairColour || '#2E1F16';
    var style = look.hairStyle || 'short';
    var cx = s.cx + s.shoulderOff, cy = s.headCy, rx = s.headRx, ry = s.headRy;
    var dark = shade(colour, -0.3);

    if (style === 'long') {
      return '<path d="' + P()
        .M(cx - rx - 3, cy - 10)
        .C(cx - rx - 14, cy + ry * 1.4, cx - rx - 20, s.shoulderY + 30, cx - rx - 10, s.shoulderY + 96)
        .L(cx - rx + 26, s.shoulderY + 100)
        .C(cx - rx + 16, s.shoulderY + 20, cx - rx + 8, cy + ry * 0.5, cx - rx + 6, cy)
        .L(cx + rx - 6, cy)
        .C(cx + rx - 8, cy + ry * 0.5, cx + rx - 16, s.shoulderY + 20, cx + rx - 26, s.shoulderY + 100)
        .L(cx + rx + 10, s.shoulderY + 96)
        .C(cx + rx + 20, s.shoulderY + 30, cx + rx + 14, cy + ry * 1.4, cx + rx + 3, cy - 10)
        .Z().d() + '" fill="' + paint.cylinder(dark) + '"/>';
    }
    if (style === 'curly') {
      var out = '';
      for (var i = 0; i < 16; i++) {
        var a = Math.PI * (0.92 + (i / 15) * 1.16);
        var px = cx + Math.cos(a) * (rx + 16);
        var py = cy + Math.sin(a) * (ry + 10) - 6;
        out += '<circle cx="' + r(px) + '" cy="' + r(py) + '" r="' + (17 + (i % 3) * 3) +
          '" fill="' + (i % 2 ? colour : dark) + '"/>';
      }
      return out;
    }
    if (style === 'bob') {
      return '<path d="' + P()
        .M(cx - rx - 4, cy - 8)
        .C(cx - rx - 12, cy + ry * 0.9, cx - rx - 6, cy + ry * 1.5, cx - rx + 4, cy + ry * 1.55)
        .L(cx + rx - 4, cy + ry * 1.55)
        .C(cx + rx + 6, cy + ry * 1.5, cx + rx + 12, cy + ry * 0.9, cx + rx + 4, cy - 8)
        .Z().d() + '" fill="' + paint.cylinder(dark) + '"/>';
    }
    if (style === 'bun') {
      return '<circle cx="' + r(cx) + '" cy="' + r(cy - ry - 16) + '" r="30" fill="' + paint.cylinder(dark) + '"/>';
    }
    return '';
  };

  SM.figure.head = function (s, look, paint) {
    var skin = look.skin || '#E3B48D';
    var cx = s.cx + s.shoulderOff;
    var cy = s.headCy, rx = s.headRx, ry = s.headRy;
    var out = '';

    /* Neck, sitting in the shadow the jaw casts. */
    out += '<path d="' + P()
      .M(cx - s.neckHalf, s.neckTop)
      .C(cx - s.neckHalf - 2, s.neckBase - 18, cx - s.neckHalf - 5, s.neckBase - 4, cx - s.neckHalf - 8, s.neckBase + 4)
      .L(cx + s.neckHalf + 8, s.neckBase + 4)
      .C(cx + s.neckHalf + 5, s.neckBase - 4, cx + s.neckHalf + 2, s.neckBase - 18, cx + s.neckHalf, s.neckTop)
      .Z().d() + '" fill="' + paint.cylinder(shade(skin, -0.2)) + '"/>';

    /* Ears before the skull so they tuck behind the jaw line. */
    [-1, 1].forEach(function (sign) {
      out += '<ellipse cx="' + r(cx + sign * (rx - 1)) + '" cy="' + r(cy + 6) +
        '" rx="9" ry="15" fill="' + shade(skin, -0.08) + '"/>';
    });

    /* Skull: an egg, wider at the cranium, tapering to the chin. */
    var skull = P()
      .M(cx - rx, cy - 6)
      .C(cx - rx, cy - ry - 6, cx + rx, cy - ry - 6, cx + rx, cy - 6)
      .C(cx + rx - 1, cy + ry * 0.42, cx + rx * 0.68, cy + ry * 0.86, cx, cy + ry)
      .C(cx - rx * 0.68, cy + ry * 0.86, cx - rx + 1, cy + ry * 0.42, cx - rx, cy - 6)
      .Z().d();
    out += '<path d="' + skull + '" fill="' + paint.cylinder(skin) + '"/>';

    /* Planes of the face: temple, cheekbone, jaw shadow. */
    out += softMark(paint, cx + rx * 0.55, cy + 4, rx * 0.5, ry * 0.55, cool(skin, -0.2), 0.55);
    out += softMark(paint, cx - rx * 0.42, cy + ry * 0.34, rx * 0.42, ry * 0.26, warm(skin, 0.14), 0.4);
    out += softMark(paint, cx, cy + ry * 0.9, rx * 0.6, ry * 0.18, shade(skin, -0.18), 0.5);

    out += face(s, look, paint, cx, cy, rx, ry, skin);
    return out;
  };

  /* The face is deliberately restrained: eyes, brows, a nose read
     purely as shadow, and lips. At feed size the head is roughly
     forty pixels tall, and anything more becomes noise. */
  function face(s, look, paint, cx, cy, rx, ry, skin) {
    var eyeY = cy + ry * 0.06;
    var eyeDX = rx * 0.42;
    var eyeW = rx * 0.30;
    var eyeH = eyeW * 0.52;
    var iris = look.eyeColour || '#4A3626';
    var lash = '#241A14';
    var out = '';

    [-1, 1].forEach(function (sign) {
      var ex = cx + sign * eyeDX;
      var socket = P()
        .M(ex - eyeW, eyeY)
        .C(ex - eyeW * 0.5, eyeY - eyeH * 1.5, ex + eyeW * 0.55, eyeY - eyeH * 1.35, ex + eyeW, eyeY - eyeH * 0.15)
        .C(ex + eyeW * 0.5, eyeY + eyeH * 1.2, ex - eyeW * 0.5, eyeY + eyeH * 1.25, ex - eyeW, eyeY)
        .Z().d();
      var clipId = paint.clip(socket);
      out += '<path d="' + socket + '" fill="#FBF6F0"/>';
      out += '<g clip-path="url(#' + clipId + ')">' +
        '<circle cx="' + r(ex + sign * 1) + '" cy="' + r(eyeY - eyeH * 0.1) + '" r="' + r(eyeH * 1.05) + '" fill="' + iris + '"/>' +
        '<circle cx="' + r(ex + sign * 1) + '" cy="' + r(eyeY - eyeH * 0.1) + '" r="' + r(eyeH * 0.48) + '" fill="#100C0A"/>' +
        '<circle cx="' + r(ex + sign * 1 - eyeW * 0.22) + '" cy="' + r(eyeY - eyeH * 0.6) + '" r="' + r(eyeH * 0.3) + '" fill="#fff" opacity=".9"/>' +
        '<ellipse cx="' + r(ex) + '" cy="' + r(eyeY - eyeH * 1.5) + '" rx="' + r(eyeW * 1.1) + '" ry="' + r(eyeH * 0.9) + '" fill="' + shade(skin, -0.3) + '" opacity=".55"/>' +
        '</g>';
      /* Lash line — the single heaviest mark on the face. */
      out += '<path d="' + P()
        .M(ex - eyeW, eyeY - eyeH * 0.06)
        .C(ex - eyeW * 0.5, eyeY - eyeH * 1.5, ex + eyeW * 0.55, eyeY - eyeH * 1.35, ex + eyeW, eyeY - eyeH * 0.2).d() +
        '" fill="none" stroke="' + lash + '" stroke-width="' + r(eyeH * 0.42) + '" stroke-linecap="round"/>';
      /* Brow */
      out += '<path d="' + P()
        .M(ex - eyeW * 1.15, eyeY - eyeH * 2.9)
        .Q(ex + sign * eyeW * 0.1, eyeY - eyeH * 4.0, ex + eyeW * 1.15, eyeY - eyeH * 2.4).d() +
        '" fill="none" stroke="' + mix(look.hairColour || '#2E1F16', skin, 0.25) +
        '" stroke-width="' + r(eyeH * 0.5) + '" stroke-linecap="round" opacity=".85"/>';
    });

    /* Nose: no outline, only the shadow down one side and the base. */
    var noseY = cy + ry * 0.42;
    out += '<path d="' + P()
      .M(cx + 2, eyeY + eyeH)
      .C(cx + rx * 0.16, noseY - ry * 0.14, cx + rx * 0.17, noseY - 4, cx + rx * 0.07, noseY).d() +
      '" fill="none" stroke="' + shade(skin, -0.26) + '" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>';
    out += '<ellipse cx="' + r(cx) + '" cy="' + r(noseY + 2) + '" rx="' + r(rx * 0.15) + '" ry="' + r(ry * 0.035) +
      '" fill="' + shade(skin, -0.3) + '" opacity=".5"/>';

    /* Lips */
    var lipY = cy + ry * 0.63;
    var lipW = rx * 0.30;
    var lipColour = mix(skin, '#9C4A44', 0.5);
    out += '<path d="' + P()
      .M(cx - lipW, lipY)
      .C(cx - lipW * 0.5, lipY - ry * 0.075, cx - lipW * 0.15, lipY - ry * 0.03, cx, lipY - ry * 0.012)
      .C(cx + lipW * 0.15, lipY - ry * 0.03, cx + lipW * 0.5, lipY - ry * 0.075, cx + lipW, lipY)
      .C(cx + lipW * 0.55, lipY + ry * 0.085, cx - lipW * 0.55, lipY + ry * 0.085, cx - lipW, lipY)
      .Z().d() + '" fill="' + lipColour + '"/>';
    out += '<path d="' + P().M(cx - lipW * 0.9, lipY).Q(cx, lipY + ry * 0.012, cx + lipW * 0.9, lipY).d() +
      '" fill="none" stroke="' + shade(lipColour, -0.45) + '" stroke-width="1.6" opacity=".7"/>';
    out += '<ellipse cx="' + r(cx - lipW * 0.25) + '" cy="' + r(lipY + ry * 0.04) + '" rx="' + r(lipW * 0.3) +
      '" ry="' + r(ry * 0.018) + '" fill="#fff" opacity=".28"/>';

    return out;
  }

  SM.figure.hairFront = function (s, look, paint) {
    var colour = look.hairColour || '#2E1F16';
    var style = look.hairStyle || 'short';
    var cx = s.cx + s.shoulderOff, cy = s.headCy, rx = s.headRx, ry = s.headRy;
    var fill = paint.cylinder(colour, { gloss: true });
    var out = '';

    if (style === 'buzz') {
      out += '<path d="' + P()
        .M(cx - rx - 1, cy - 4)
        .C(cx - rx - 1, cy - ry - 8, cx + rx + 1, cy - ry - 8, cx + rx + 1, cy - 4)
        .C(cx + rx * 0.7, cy - ry * 0.52, cx - rx * 0.7, cy - ry * 0.52, cx - rx - 1, cy - 4)
        .Z().d() + '" fill="' + fill + '" opacity=".92"/>';
      return out;
    }

    /* Everything else gets a proper hairline with a parting, plus a
       couple of strand highlights so it isn't a solid slab. */
    var sweep = style === 'bun' ? 0.30 : 0.46;
    out += '<path d="' + P()
      .M(cx - rx - 3, cy + 4)
      .C(cx - rx - 5, cy - ry - 14, cx + rx + 5, cy - ry - 14, cx + rx + 3, cy + 4)
      .C(cx + rx * 0.86, cy - ry * 0.30, cx + rx * 0.30, cy - ry * sweep, cx - rx * 0.10, cy - ry * 0.42)
      .C(cx - rx * 0.55, cy - ry * 0.34, cx - rx * 0.86, cy - ry * 0.18, cx - rx - 3, cy + 4)
      .Z().d() + '" fill="' + fill + '"/>';

    var hi = shade(colour, luminance(colour) > 0.5 ? -0.25 : 0.42);
    out += '<path d="' + P()
      .M(cx - rx * 0.55, cy - ry * 0.72)
      .Q(cx - rx * 0.1, cy - ry * 0.92, cx + rx * 0.45, cy - ry * 0.62).d() +
      '" fill="none" stroke="' + hi + '" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>';
    out += '<path d="' + P()
      .M(cx - rx * 0.72, cy - ry * 0.40)
      .Q(cx - rx * 0.3, cy - ry * 0.72, cx + rx * 0.2, cy - ry * 0.78).d() +
      '" fill="none" stroke="' + hi + '" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>';

    if (style === 'long' || style === 'bob') {
      [-1, 1].forEach(function (sign) {
        out += '<path d="' + P()
          .M(cx + sign * (rx - 4), cy - ry * 0.5)
          .C(cx + sign * (rx + 8), cy - 6, cx + sign * (rx + 6), cy + ry * 0.5, cx + sign * (rx - 2), cy + ry * 0.92).d() +
          '" fill="none" stroke="' + colour + '" stroke-width="12" stroke-linecap="round" opacity=".9"/>';
      });
    }
    return out;
  };

  /* ---------- ground shadow ------------------------------------ */
  SM.figure.groundShadow = function (s, paint) {
    var fill = paint.radial('#000000', '#000000', 0.5);
    return '<ellipse cx="' + r(s.cx + s.sway) + '" cy="' + r(s.soleY + 6) +
      '" rx="' + r(s.hipHalf + 78) + '" ry="20" fill="' + fill + '"/>';
  };

  /* ---------- a full bare figure (used by the studio) ---------- */
  SM.figure.render = function (look) {
    look = look || {};
    var paint = SM.newPaint();
    var s = SM.figure.skeleton(look);
    var body =
      SM.figure.groundShadow(s, paint) +
      SM.figure.hairBack(s, look, paint) +
      SM.figure.body(s, look, paint) +
      SM.figure.head(s, look, paint) +
      SM.figure.hairFront(s, look, paint);
    return '<svg viewBox="' + SM.FIGURE_VIEWBOX + '" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Figure">' +
      body + paint.markup() + '</svg>';
  };
})(window.SM);
