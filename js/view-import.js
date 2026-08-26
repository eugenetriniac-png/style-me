/* ============================================================
   STYLE ME — view-import.js

   The Data screen. Two jobs:

     1. Swap the demo catalogue for a real merchant feed, so every
        product image becomes an actual photograph.
     2. Point the app at a try-on endpoint, so the "on me" view
        becomes a generated photo instead of a drawing.

   Both are the difference between a convincing prototype and a
   demo, and neither should require editing a file.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var ui = SM.ui;
  var esc = ui.esc;

  /* Parsed but not yet installed. */
  var draft = null;

  var FIELDS = [
    ['name', 'Product name', true],
    ['price', 'Price', true],
    ['image', 'Image URL', true],
    ['type', 'Product type', true],
    ['brand', 'Brand', false],
    ['colour', 'Colour', false],
    ['material', 'Material', false],
    ['link', 'Buy link', false],
    ['desc', 'Description', false],
    ['extraImage', 'Extra images', false],
    ['availability', 'Availability', false]
  ];

  SM.views['import'] = {
    chrome: true,

    render: function () {
      var coverage = SM.images.coverage();
      var imported = SM.importer.isImported();
      var tryonCfg = SM.tryon.config();

      return '<div class="data-page">' +
        ui.header('Data', { back: true, kicker: 'Where the pictures come from' }) +

        '<div class="pad">' +

          '<div class="status-card">' +
            '<div class="status-row"><span>Catalogue</span><strong>' +
              (imported ? 'Imported feed' : 'Demo catalogue') + '</strong></div>' +
            '<div class="status-row"><span>Pieces</span><strong class="mono">' + coverage.total + '</strong></div>' +
            '<div class="status-row"><span>With real photography</span><strong class="mono' +
              (coverage.percent > 0 ? ' good' : '') + '">' + coverage.photos + ' · ' + coverage.percent + '%</strong></div>' +
            '<div class="status-row"><span>Try-on endpoint</span><strong>' +
              (tryonCfg.endpoint ? 'connected' : 'not set') + '</strong></div>' +
          '</div>' +

          '<h2 class="sec-title">1 · Import a product feed</h2>' +
          '<p class="muted">Export a CSV, TSV or XML feed from Awin, Rakuten, CJ, Tradedoubler or a ' +
            'Google Shopping export, then drop it here. Columns are detected automatically; ' +
            'colour, material and category are derived from the text.</p>' +

          '<div class="drop" id="drop">' +
            ui.icon('plus') +
            '<strong>Drop a feed file here</strong>' +
            '<span class="muted">or click to choose · .csv .tsv .xml</span>' +
            '<input type="file" id="feedFile" accept=".csv,.tsv,.txt,.xml" hidden>' +
          '</div>' +
          '<details class="paste"><summary>or paste the feed as text</summary>' +
            '<textarea id="feedText" rows="6" placeholder="id,title,price,image_link,product_type…"></textarea>' +
            '<button class="btn full" id="parsePaste">Parse this</button></details>' +

          '<div id="importResult"></div>' +

          (imported ? '<button class="btn btn-ghost full" id="restoreDemo" style="margin-top:16px">' +
            ui.icon('trash') + '<span>Remove the imported feed and go back to the demo catalogue</span></button>' : '') +

          '<h2 class="sec-title">2 · Connect virtual try-on</h2>' +
          '<p class="muted">Deploy the function in <code>server/</code> to Vercel or Cloudflare, then paste its ' +
            'URL here. The provider key stays on that server and never reaches this page.</p>' +
          '<label class="field"><span>Try-on endpoint</span>' +
            '<input id="tryonEndpoint" placeholder="https://your-app.vercel.app/api/tryon" value="' +
            esc(tryonCfg.endpoint || '') + '"></label>' +
          '<div class="row-btns">' +
            '<button class="btn" id="saveTryon">Save</button>' +
            '<button class="btn btn-ghost" id="testTryon">Test it</button>' +
          '</div>' +
          '<p class="mono muted" id="tryonStatus"></p>' +

          '<h2 class="sec-title">3 · Generated images</h2>' +
          '<p class="muted">Try-on results are cached against the outfit and the person wearing it, ' +
            'so swapping one piece only regenerates the last step.</p>' +
          '<button class="btn btn-ghost full" id="clearImages">' + ui.icon('trash') +
            '<span>Clear every cached and imported image</span></button>' +

          '<p class="disclaimer">Imported feeds are stored in this browser only. Product photographs stay on ' +
            'the merchant’s own servers — this app links to them, it does not copy them.</p>' +
        '</div></div>';
    },

    mount: function (root) {
      var drop = root.querySelector('#drop');
      var fileInput = root.querySelector('#feedFile');

      drop.addEventListener('click', function () { fileInput.click(); });
      ['dragenter', 'dragover'].forEach(function (e) {
        drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add('over'); });
      });
      ['dragleave', 'drop'].forEach(function (e) {
        drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove('over'); });
      });
      drop.addEventListener('drop', function (ev) {
        if (ev.dataTransfer.files && ev.dataTransfer.files[0]) readFile(ev.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) readFile(this.files[0]);
      });
      root.querySelector('#parsePaste').addEventListener('click', function () {
        handleText(root.querySelector('#feedText').value);
      });

      function readFile(file) {
        var reader = new FileReader();
        reader.onload = function () { handleText(String(reader.result)); };
        reader.readAsText(file);
      }

      function handleText(text) {
        if (!text || text.trim().length < 20) { ui.toast('That file looks empty'); return; }
        var parsed = SM.importer.parse(text);
        if (parsed.error) { ui.toast(parsed.error); return; }
        if (!parsed.rows.length) { ui.toast('No product rows found'); return; }
        draft = {
          headers: parsed.headers,
          rows: parsed.rows,
          mapping: SM.importer.detectMapping(parsed.headers)
        };
        drawMapping(root);
      }

      root.addEventListener('change', function (e) {
        var sel = e.target.closest('[data-field]');
        if (!sel || !draft) return;
        draft.mapping[sel.getAttribute('data-field')] = sel.value || undefined;
        drawPreview(root);
      });

      root.addEventListener('click', function (e) {
        if (e.target.closest('#installFeed')) return install(root);
        if (e.target.closest('#restoreDemo')) {
          SM.importer.restoreDemo();
          ui.toast('Back to the demo catalogue');
          SM.render();
          return;
        }
        if (e.target.closest('#saveTryon')) {
          var url = root.querySelector('#tryonEndpoint').value.trim();
          SM.tryon.configure({ endpoint: url || null });
          try { window.localStorage.setItem('style-me/tryon', url); } catch (err) {}
          ui.toast(url ? 'Try-on endpoint saved' : 'Try-on disabled');
          return;
        }
        if (e.target.closest('#testTryon')) return testEndpoint(root);
        if (e.target.closest('#clearImages')) {
          SM.images.clear();
          ui.toast('Image cache cleared');
          SM.render();
        }
      });
    }
  };

  /* ---------- mapping + preview -------------------------------- */
  function drawMapping(root) {
    var options = function (selected) {
      return '<option value="">— none —</option>' + draft.headers.map(function (h) {
        return '<option value="' + esc(h) + '"' + (h === selected ? ' selected' : '') + '>' + esc(h) + '</option>';
      }).join('');
    };

    root.querySelector('#importResult').innerHTML =
      '<h3 class="sub-title">' + draft.rows.length + ' rows found · check the mapping</h3>' +
      '<div class="mapping">' + FIELDS.map(function (f) {
        var missing = f[2] && !draft.mapping[f[0]];
        return '<label class="map-row' + (missing ? ' missing' : '') + '">' +
          '<span>' + f[1] + (f[2] ? ' *' : '') + '</span>' +
          '<select data-field="' + f[0] + '">' + options(draft.mapping[f[0]]) + '</select></label>';
      }).join('') + '</div>' +
      '<div id="importPreview"></div>';

    drawPreview(root);
  }

  function drawPreview(root) {
    var built = SM.importer.buildItems(draft.rows, draft.mapping);
    draft.built = built;

    var host = root.querySelector('#importPreview');
    if (!built.items.length) {
      host.innerHTML = '<p class="warn">Nothing could be read from this feed. The three starred ' +
        'columns are required — check the mapping above.</p>';
      return;
    }

    var skipped = built.skipped;
    var notes = [];
    if (skipped.noImage) notes.push(skipped.noImage + ' with no image');
    if (skipped.noType) notes.push(skipped.noType + ' whose type could not be read');
    if (skipped.noPrice) notes.push(skipped.noPrice + ' with no price');
    if (skipped.outOfStock) notes.push(skipped.outOfStock + ' out of stock');

    var byCategory = {};
    built.items.forEach(function (i) { byCategory[i.category] = (byCategory[i.category] || 0) + 1; });

    host.innerHTML =
      '<div class="status-card">' +
        '<div class="status-row"><span>Usable products</span><strong class="mono good">' + built.items.length + '</strong></div>' +
        '<div class="status-row"><span>Brands</span><strong class="mono">' + Object.keys(built.brands).length + '</strong></div>' +
        '<div class="status-row"><span>By category</span><strong class="mono">' +
          Object.keys(byCategory).map(function (c) { return c + ' ' + byCategory[c]; }).join(' · ') + '</strong></div>' +
        (notes.length ? '<div class="status-row"><span>Skipped</span><strong class="mono">' + notes.join(', ') + '</strong></div>' : '') +
      '</div>' +
      '<h3 class="sub-title">First twelve, as the app will show them</h3>' +
      '<div class="tile-grid">' + built.items.slice(0, 12).map(function (item) {
        return '<div class="tile">' +
          '<div class="shot-frame">' + SM.images.tag(item.images[0], item, 'product', 'shot-photo') + '</div>' +
          '<span class="tile-brand">' + esc(item.brand) + '</span>' +
          '<span class="tile-name">' + esc(item.name) + '</span>' +
          '<span class="tile-meta"><span class="tile-price">' + ui.price(item.price) + '</span>' +
          '<span class="tile-colour"><i style="background:' + item.colour + '"></i>' + esc(item.colourName) + '</span></span>' +
          '<span class="tile-derived mono">' + item.category + ' · ' + item.material + ' · ' + item.tags.join(' ') + '</span>' +
          '</div>';
      }).join('') + '</div>' +
      '<button class="btn btn-primary btn-lg full" id="installFeed" style="margin-top:18px">' +
        'Use these ' + built.items.length + ' products in the app</button>' +
      '<p class="disclaimer">Installing replaces the demo catalogue. Saved outfits, likes and the bag are ' +
        'cleared, because they point at pieces that no longer exist.</p>';
  }

  function install(root) {
    if (!draft || !draft.built || !draft.built.items.length) return;
    var ok = SM.importer.install(draft.built.items, draft.built.brands);
    if (!ok) { ui.toast('Could not install the feed'); return; }
    draft = null;
    ui.toast('Catalogue replaced — the whole app now uses real photography');
    location.hash = '#/shop';
  }

  function testEndpoint(root) {
    var status = root.querySelector('#tryonStatus');
    var url = root.querySelector('#tryonEndpoint').value.trim();
    if (!url) { status.textContent = 'Enter an endpoint first.'; return; }
    status.textContent = 'Calling…';
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ person: '', garment: '' })
    })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (r) {
        /* A 400 complaining about missing images is the correct
           answer here: it proves the function is alive and reading
           the body without spending a generation. */
        if (r.status === 400) status.textContent = 'Endpoint is alive and validating input. Ready.';
        else if (r.status === 200) status.textContent = 'Endpoint answered 200.';
        else status.textContent = 'Answered ' + r.status + ': ' + (r.body.error || 'unknown error');
      })
      .catch(function (err) {
        status.textContent = 'Could not reach it: ' + err.message + ' (CORS, or the URL is wrong)';
      });
  }
})(window.SM);
