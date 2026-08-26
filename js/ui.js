/* ============================================================
   STYLE ME — ui.js
   Shared interface parts: icons, product tiles, credit rows,
   sheets, toasts.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var ui = {};
  SM.ui = ui;

  ui.esc = function (s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  ui.price = function (n) { return money.format(n); };

  ui.compact = function (n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k';
    return String(n);
  };

  ui.timeAgo = function (ts) {
    if (typeof ts === 'string') return ts;
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    return Math.floor(h / 24) + 'd';
  };

  /* ---------- icons -------------------------------------------- */
  var ICONS = {
    heart: '<path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 0 1 19.7 13z"/>',
    bookmark: '<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>',
    comment: '<path d="M20.5 12.2c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.6-.34L4 21l1.3-3.6A6.9 6.9 0 0 1 3.5 12.2C3.5 8.2 7.3 5 12 5s8.5 3.2 8.5 7.2z"/>',
    share: '<path d="M4 12v7.5h16V12"/><path d="M12 15.5V3.5"/><path d="m7.5 8 4.5-4.5L16.5 8"/>',
    swap: '<path d="M4 8h13l-3.5-3.5"/><path d="M20 16H7l3.5 3.5"/>',
    filter: '<path d="M3.5 6h17"/><path d="M6.5 12h11"/><path d="M10 18h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/>',
    users: '<circle cx="9" cy="9" r="3.4"/><path d="M3 20c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4"/><path d="M16 6.2a3.4 3.4 0 0 1 0 6.6"/><path d="M17.5 14.9c2.2.6 3.5 2.4 3.5 5.1"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c0-3.9 3.3-6.4 7.5-6.4s7.5 2.5 7.5 6.4"/>',
    back: '<path d="M15 4.5 7.5 12l7.5 7.5"/>',
    close: '<path d="M5.5 5.5 18.5 18.5"/><path d="M18.5 5.5 5.5 18.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    camera: '<path d="M3.5 8h4l1.5-2.5h6L16.5 8h4v12h-17z"/><circle cx="12" cy="13.5" r="3.6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1.6 1.6"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1.6-1.6"/>',
    sparkle: '<path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9z"/><path d="M18.5 4v3"/><path d="M20 5.5h-3"/>',
    send: '<path d="M4 12 20.5 4.5 13.5 20.5 11.5 13z"/>',
    trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7 7.5 20h9L17.5 7"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7"/>',
    shuffle: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>'
  };

  ui.icon = function (name, opt) {
    opt = opt || {};
    return '<svg class="ic ' + (opt.cls || '') + '" viewBox="0 0 24 24" fill="' + (opt.fill ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="' + (opt.sw || 1.6) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- product imagery ---------------------------------- */
  ui.shot = function (item, cls) {
    return '<div class="shot-frame ' + (cls || '') + '">' + SM.garment.productShot(item) + '</div>';
  };

  ui.tile = function (item, opts) {
    opts = opts || {};
    return '<a class="tile" href="#/item/' + item.id + '">' +
      ui.shot(item) +
      '<span class="tile-brand">' + ui.esc(item.brand) + '</span>' +
      '<span class="tile-name">' + ui.esc(item.name) + '</span>' +
      '<span class="tile-meta"><span class="tile-price">' + ui.price(item.price) + '</span>' +
      (opts.colour === false ? '' : '<span class="tile-colour"><i style="background:' + item.colour + '"></i>' + ui.esc(item.colourName) + '</span>') +
      '</span></a>';
  };

  /* The credit line — how a magazine lists what someone is
     wearing. Reused everywhere a look is broken down. */
  ui.creditRow = function (item, opts) {
    opts = opts || {};
    var LABEL = { top: 'Top', bottom: 'Bottom', outer: 'Outerwear', shoes: 'Footwear', accessory: 'Accessory', dress: 'Dress' };
    return '<div class="credit" data-item="' + item.id + '">' +
      '<a class="credit-thumb" href="#/item/' + item.id + '">' + SM.garment.productShot(item) + '</a>' +
      '<span class="credit-main">' +
        '<span class="credit-cat">' + (LABEL[item.category] || '') + '</span>' +
        '<a class="credit-name" href="#/item/' + item.id + '">' + ui.esc(item.name) + '</a>' +
        '<span class="credit-brand">' + ui.esc(item.brand) + ' · ' + ui.esc(item.colourName) + '</span>' +
      '</span>' +
      '<span class="credit-price">' + ui.price(item.price) + '</span>' +
      (opts.swap ? '<button class="credit-swap" data-swap="' + item.id + '" aria-label="Replace ' + ui.esc(item.name) + '">' +
        ui.icon('swap') + '</button>' : '') +
      '</div>';
  };

  /* ---------- avatar ------------------------------------------- */
  ui.avatar = function (look, cls) {
    var paint = SM.newPaint();
    var sk = SM.figure.skeleton(look || {});
    var cx = sk.cx + sk.shoulderOff;
    var box = sk.headRx * 2.5;
    return '<svg class="av ' + (cls || '') + '" viewBox="' + (cx - box / 2) + ' ' + (sk.headCy - box / 2 + 4) +
      ' ' + box + ' ' + box + '" aria-hidden="true">' +
      '<rect x="' + (cx - box) + '" y="' + (sk.headCy - box) + '" width="' + (box * 2) + '" height="' + (box * 2) +
      '" fill="' + SM.color.shade((look && look.skin) || '#E3B48D', -0.62) + '"/>' +
      SM.figure.hairBack(sk, look || {}, paint) +
      SM.figure.head(sk, look || {}, paint) +
      SM.figure.hairFront(sk, look || {}, paint) +
      paint.markup() + '</svg>';
  };

  /* ---------- axis bars ---------------------------------------- */
  ui.axisBars = function (axes, limit) {
    var keys = SM.AXIS_KEYS.slice().sort(function (a, b) { return axes[b] - axes[a]; });
    if (limit) keys = keys.slice(0, limit);
    return '<div class="axes">' + keys.map(function (k) {
      return '<div class="axis">' +
        '<span class="axis-label">' + SM.AXES[k].label + '</span>' +
        '<span class="axis-track"><span class="axis-fill" style="width:' + Math.max(4, axes[k]) + '%"></span></span>' +
        '<span class="axis-val">' + axes[k] + '</span></div>';
    }).join('') + '</div>';
  };

  /* ---------- chrome ------------------------------------------- */
  ui.header = function (title, opts) {
    opts = opts || {};
    return '<header class="scr-head">' +
      (opts.back ? '<button class="icon-btn" data-back="1" aria-label="Back">' + ui.icon('back') + '</button>' : '') +
      '<div class="scr-head-txt">' +
        (opts.kicker ? '<span class="kicker">' + ui.esc(opts.kicker) + '</span>' : '') +
        '<h1 class="scr-title">' + ui.esc(title) + '</h1>' +
      '</div>' + (opts.action || '') + '</header>';
  };

  ui.empty = function (title, sub, cta) {
    return '<div class="empty"><p class="empty-title">' + ui.esc(title) + '</p>' +
      '<p class="empty-sub">' + ui.esc(sub) + '</p>' + (cta || '') + '</div>';
  };

  /* ---------- toast -------------------------------------------- */
  var toastTimer;
  ui.toast = function (message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.className = 'toast show';
    el.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2400);
  };

  /* ---------- sheet -------------------------------------------- */
  ui.sheet = function (opts) {
    var host = document.getElementById('sheet');
    host.innerHTML =
      '<div class="sheet-scrim" data-close="1"></div>' +
      '<div class="sheet-panel" role="dialog" aria-modal="true" aria-label="' + ui.esc(opts.title || '') + '">' +
        '<div class="sheet-head"><h2 class="sheet-title">' + ui.esc(opts.title || '') + '</h2>' +
        '<button class="icon-btn" data-close="1" aria-label="Close">' + ui.icon('close') + '</button></div>' +
        (opts.sub ? '<p class="sheet-sub">' + ui.esc(opts.sub) + '</p>' : '') +
        '<div class="sheet-body">' + (opts.body || '') + '</div>' +
      '</div>';
    host.classList.add('open');
    document.body.classList.add('no-scroll');
    if (opts.onMount) opts.onMount(host);
    return host;
  };

  ui.closeSheet = function () {
    var host = document.getElementById('sheet');
    host.classList.remove('open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { if (!host.classList.contains('open')) host.innerHTML = ''; }, 220);
  };

  /* ---------- misc --------------------------------------------- */
  ui.share = function (path, label) {
    var url = location.href.split('#')[0] + path;
    if (navigator.share) {
      navigator.share({ title: 'Style Me', text: label || 'Look at this', url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { ui.toast('Link copied'); });
    } else {
      ui.toast(url);
    }
  };

  /* Photos are shrunk before they are stored — localStorage is
     small and a phone camera file is not. */
  ui.downscale = function (file, max, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        done(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
})(window.SM);
