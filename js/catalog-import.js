/* ============================================================
   STYLE ME — catalog-import.js

   Turns a merchant product feed into a Style Me catalogue.

   Affiliate networks (Awin, Rakuten, CJ, Tradedoubler…) and
   Google Shopping all hand you the same shape of data: one row
   per product, with an image URL, a price, a colour word and a
   product type. This reads CSV, TSV and XML feeds, guesses the
   column mapping, and derives the four things the app needs that
   feeds never state outright:

     colour word  -> hex + colour family
     description  -> material
     product type -> category + drawing shape
     everything   -> style tags

   Nothing here talks to a network. You export the feed from the
   affiliate dashboard and drop the file in.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  /* ============================================================
     Parsing
     ============================================================ */

  /* A CSV reader that survives quoted fields containing commas and
     newlines, which product titles do constantly. */
  function parseDelimited(text, delimiter) {
    var rows = [];
    var row = [];
    var field = '';
    var quoted = false;
    var i = 0;

    while (i < text.length) {
      var c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          quoted = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { quoted = true; i++; continue; }
      if (c === delimiter) { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || (r[0] || '').trim(); });
  }

  function sniffDelimiter(text) {
    var head = text.slice(0, 4000);
    var counts = { ',': 0, '\t': 0, ';': 0, '|': 0 };
    Object.keys(counts).forEach(function (d) {
      counts[d] = (head.split(d).length - 1);
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  }

  function parseCSV(text) {
    var rows = parseDelimited(text, sniffDelimiter(text));
    if (!rows.length) return { headers: [], rows: [] };
    var headers = rows[0].map(function (h) { return h.trim(); });
    var body = rows.slice(1).map(function (r) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
      return o;
    });
    return { headers: headers, rows: body };
  }

  /* Google Shopping and most network XML feeds are <item> or
     <product> elements with flat children. */
  function parseXML(text) {
    var doc = new DOMParser().parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) return { headers: [], rows: [], error: 'This file is not valid XML.' };
    var nodes = doc.querySelectorAll('item, product, entry');
    var rows = [];
    var headerSet = {};
    Array.prototype.forEach.call(nodes, function (node) {
      var o = {};
      Array.prototype.forEach.call(node.children, function (child) {
        var key = child.localName;
        var value = (child.textContent || '').trim();
        if (o[key]) { o[key] += '|' + value; } else { o[key] = value; }
        headerSet[key] = 1;
      });
      if (Object.keys(o).length) rows.push(o);
    });
    return { headers: Object.keys(headerSet), rows: rows };
  }

  function parse(text) {
    var trimmed = text.trim();
    if (trimmed[0] === '<') return parseXML(trimmed);
    return parseCSV(trimmed);
  }

  /* ============================================================
     Column mapping
     ============================================================ */
  var FIELD_HINTS = {
    id:        ['id', 'sku', 'product_id', 'aw_product_id', 'merchant_product_id', 'gtin', 'mpn'],
    name:      ['title', 'name', 'product_name', 'product_title'],
    brand:     ['brand', 'manufacturer', 'merchant_name', 'brand_name'],
    price:     ['price', 'sale_price', 'search_price', 'display_price', 'current_price'],
    image:     ['image_link', 'image_url', 'imageurl', 'merchant_image_url', 'aw_image_url', 'large_image', 'image'],
    extraImage:['additional_image_link', 'alternate_image', 'aw_thumb_url', 'image_url_2'],
    link:      ['link', 'product_url', 'aw_deep_link', 'merchant_deep_link', 'url', 'deeplink'],
    colour:    ['colour', 'color', 'colour_name', 'attribute_colour'],
    material:  ['material', 'fabric', 'composition'],
    type:      ['product_type', 'category', 'google_product_category', 'merchant_category', 'category_name'],
    desc:      ['description', 'product_short_description', 'details'],
    gender:    ['gender', 'target_gender', 'department'],
    availability: ['availability', 'in_stock', 'stock_status']
  };

  function detectMapping(headers) {
    var lower = headers.map(function (h) { return h.toLowerCase().replace(/[\s-]/g, '_'); });
    var map = {};
    Object.keys(FIELD_HINTS).forEach(function (field) {
      var hints = FIELD_HINTS[field];
      for (var h = 0; h < hints.length; h++) {
        var idx = lower.indexOf(hints[h]);
        if (idx !== -1) { map[field] = headers[idx]; return; }
      }
      /* Second pass: a header that merely contains the hint. */
      for (var k = 0; k < hints.length; k++) {
        for (var j = 0; j < lower.length; j++) {
          if (lower[j].indexOf(hints[k]) !== -1) { map[field] = headers[j]; return; }
        }
      }
    });
    return map;
  }

  /* ============================================================
     Deriving what feeds don't tell you
     ============================================================ */

  /* Colour words seen in real fashion feeds, mapped to something
     the renderer and the harmony scoring can use. */
  var COLOUR_WORDS = [
    ['off white', '#EDE8DE', 'white'], ['offwhite', '#EDE8DE', 'white'],
    ['ecru', '#EAE3D4', 'white'], ['ivory', '#EFE9DB', 'white'], ['cream', '#E7DFC9', 'white'],
    ['bone', '#E8E2D6', 'white'], ['optic white', '#F6F4EF', 'white'], ['white', '#F2EFE7', 'white'],
    ['jet black', '#141416', 'black'], ['black', '#1A1A1E', 'black'], ['onyx', '#17171B', 'black'],
    ['charcoal', '#33363D', 'grey'], ['graphite', '#3C404A', 'grey'], ['anthracite', '#2E323A', 'grey'],
    ['heather grey', '#9A9CA3', 'grey'], ['grey marl', '#8E9098', 'grey'], ['marl', '#8E9098', 'grey'],
    ['silver', '#B9BCC2', 'grey'], ['grey', '#8C8E95', 'grey'], ['gray', '#8C8E95', 'grey'],
    ['beige', '#C9B79C', 'beige'], ['sand', '#D3C3A6', 'beige'], ['stone', '#C6B79E', 'beige'],
    ['taupe', '#A8998A', 'beige'], ['oatmeal', '#D8CFBB', 'beige'], ['khaki', '#B3A582', 'beige'],
    ['camel', '#B58F5E', 'beige'], ['tan', '#B08453', 'brown'], ['nude', '#DCC0A6', 'beige'],
    ['chocolate', '#4A3125', 'brown'], ['espresso', '#3A2A20', 'brown'], ['coffee', '#4B3728', 'brown'],
    ['tobacco', '#7A5636', 'brown'], ['cognac', '#8B5A2B', 'brown'], ['chestnut', '#6B4326', 'brown'],
    ['rust', '#9C4B24', 'brown'], ['brown', '#6B4B32', 'brown'], ['walnut', '#5A3E2B', 'brown'],
    ['navy', '#20304E', 'blue'], ['midnight', '#1C2440', 'blue'], ['indigo', '#2F4162', 'blue'],
    ['denim', '#3F5B83', 'blue'], ['cobalt', '#2A47B0', 'blue'], ['royal blue', '#2749A8', 'blue'],
    ['sky', '#9CC0DC', 'blue'], ['light blue', '#B7CCE0', 'blue'], ['powder blue', '#C3D5E2', 'blue'],
    ['teal', '#2C6068', 'blue'], ['blue', '#33507F', 'blue'],
    ['olive', '#5E6348', 'green'], ['khaki green', '#6A6A48', 'green'], ['sage', '#95A088', 'green'],
    ['forest', '#2E4432', 'green'], ['emerald', '#1F6647', 'green'], ['mint', '#A9CDBA', 'green'],
    ['moss', '#4E5A3B', 'green'], ['military', '#4C5340', 'green'], ['green', '#4A5F3C', 'green'],
    ['burgundy', '#6B2434', 'red'], ['wine', '#6A2434', 'red'], ['maroon', '#5F2229', 'red'],
    ['crimson', '#9E2231', 'red'], ['scarlet', '#B22B24', 'red'], ['brick', '#9A4A34', 'red'],
    ['terracotta', '#A8593C', 'red'], ['coral', '#E0715C', 'red'], ['red', '#9E2B25', 'red'],
    ['blush', '#DFC0BB', 'pink'], ['rose', '#C98A94', 'pink'], ['fuchsia', '#B33B7A', 'pink'],
    ['lilac', '#B9A6C9', 'pink'], ['lavender', '#B3A8CB', 'pink'], ['mauve', '#A8879A', 'pink'],
    ['purple', '#6B4A87', 'pink'], ['pink', '#D69AA2', 'pink'],
    ['mustard', '#C29A3A', 'yellow'], ['ochre', '#B98B36', 'yellow'], ['gold', '#B99447', 'yellow'],
    ['lemon', '#DECB60', 'yellow'], ['butter', '#E3D49A', 'yellow'], ['yellow', '#D8B24E', 'yellow'],
    ['orange', '#C4652A', 'red'], ['apricot', '#D9A070', 'beige'],
    ['multi', '#8C7FA8', 'pink'], ['print', '#8C7FA8', 'pink']
  ];

  function readColour(text) {
    var s = (text || '').toLowerCase();
    var hex = s.match(/#[0-9a-f]{6}/i);
    if (hex) return { hex: hex[0], family: familyFromHex(hex[0]), name: text };
    for (var i = 0; i < COLOUR_WORDS.length; i++) {
      if (s.indexOf(COLOUR_WORDS[i][0]) !== -1) {
        return { hex: COLOUR_WORDS[i][1], family: COLOUR_WORDS[i][2], name: titleCase(text) || titleCase(COLOUR_WORDS[i][0]) };
      }
    }
    return { hex: '#8C8E95', family: 'grey', name: titleCase(text) || 'Unspecified' };
  }

  function familyFromHex(hex) {
    var c = SM.color.hexToRgb(hex);
    var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    var lum = SM.color.luminance(hex);
    if (mx - mn < 26) return lum > 0.8 ? 'white' : lum < 0.18 ? 'black' : 'grey';
    if (lum < 0.16) return 'black';
    var h = 0, d = mx - mn;
    if (mx === c[0]) h = ((c[1] - c[2]) / d) % 6;
    else if (mx === c[1]) h = (c[2] - c[0]) / d + 2;
    else h = (c[0] - c[1]) / d + 4;
    h = (h * 60 + 360) % 360;
    if (h < 20 || h >= 330) return 'red';
    if (h < 45) return lum > 0.55 ? 'beige' : 'brown';
    if (h < 70) return 'yellow';
    if (h < 165) return 'green';
    if (h < 260) return 'blue';
    return 'pink';
  }

  var MATERIAL_WORDS = [
    ['denim', 'denim'], ['jean', 'denim'],
    ['leather', 'leather'], ['calfskin', 'leather'], ['nappa', 'leather'],
    ['suede', 'suede'], ['nubuck', 'suede'],
    ['corduroy', 'corduroy'], ['cord ', 'corduroy'], ['velvet', 'velvet'], ['velour', 'velvet'],
    ['linen', 'linen'], ['silk', 'silk'], ['satin', 'silk'], ['viscose', 'silk'], ['tencel', 'silk'],
    ['cashmere', 'knit'], ['merino', 'knit'], ['mohair', 'wool'], ['alpaca', 'wool'],
    ['wool', 'wool'], ['tweed', 'tweed'], ['herringbone', 'tweed'],
    ['rib', 'rib'], ['ribbed', 'rib'],
    ['knit', 'knit'], ['jumper', 'knit'], ['sweater', 'knit'],
    ['fleece', 'fleece'], ['loopback', 'fleece'], ['french terry', 'fleece'], ['sweat', 'fleece'],
    ['nylon', 'nylon'], ['polyester', 'nylon'], ['ripstop', 'nylon'], ['gore-tex', 'nylon'],
    ['technical', 'nylon'], ['shell', 'nylon'], ['down', 'nylon'],
    ['canvas', 'canvas'], ['duck', 'canvas'], ['twill', 'canvas'], ['drill', 'canvas'],
    ['jersey', 'jersey'], ['t-shirt', 'jersey'],
    ['cotton', 'cotton'], ['poplin', 'cotton'], ['oxford', 'cotton']
  ];

  function readMaterial(text) {
    var s = (text || '').toLowerCase();
    for (var i = 0; i < MATERIAL_WORDS.length; i++) {
      if (s.indexOf(MATERIAL_WORDS[i][0]) !== -1) return MATERIAL_WORDS[i][1];
    }
    return 'cotton';
  }

  /* Product type -> category + the drawing used when there is no
     photograph yet. Order matters: the most specific words first. */
  var TYPE_WORDS = [
    ['trench', 'outer', 'trench'], ['parka', 'outer', 'puffer'], ['puffer', 'outer', 'puffer'],
    ['down jacket', 'outer', 'puffer'], ['gilet', 'outer', 'puffer'],
    ['overcoat', 'outer', 'coat'], ['coat', 'outer', 'coat'],
    ['blazer', 'outer', 'blazer'], ['suit jacket', 'outer', 'blazer'],
    ['denim jacket', 'outer', 'denimJacket'], ['trucker', 'outer', 'denimJacket'],
    ['chore', 'outer', 'workJacket'], ['work jacket', 'outer', 'workJacket'],
    ['bomber', 'outer', 'bomber'], ['biker', 'outer', 'bomber'], ['leather jacket', 'outer', 'bomber'],
    ['cardigan', 'outer', 'cardigan'],
    ['jacket', 'outer', 'bomber'],

    ['hoodie', 'top', 'hoodie'], ['hooded', 'top', 'hoodie'], ['sweatshirt', 'top', 'hoodie'],
    ['jumper', 'top', 'knit'], ['sweater', 'top', 'knit'], ['knit', 'top', 'knit'],
    ['roll neck', 'top', 'knit'], ['turtleneck', 'top', 'knit'], ['polo neck', 'top', 'knit'],
    ['shirt dress', 'dress', 'dress'],
    ['shirt', 'top', 'shirt'], ['blouse', 'top', 'shirt'], ['overshirt', 'top', 'shirt'],
    ['vest', 'top', 'tank'], ['tank', 'top', 'tank'], ['cami', 'top', 'tank'],
    ['t-shirt', 'top', 'tee'], ['tee', 'top', 'tee'], ['top', 'top', 'tee'],

    ['jeans', 'bottom', 'jeans'], ['denim', 'bottom', 'jeans'],
    ['cargo', 'bottom', 'cargo'],
    ['jogger', 'bottom', 'joggers'], ['track pant', 'bottom', 'joggers'], ['sweatpant', 'bottom', 'joggers'],
    ['short', 'bottom', 'shorts'],
    ['skirt', 'bottom', 'skirt'],
    ['chino', 'bottom', 'trousers'], ['trouser', 'bottom', 'trousers'], ['pant', 'bottom', 'trousers'],

    ['dress', 'dress', 'dress'],

    ['trainer', 'shoes', 'sneaker'], ['sneaker', 'shoes', 'sneaker'], ['running', 'shoes', 'sneaker'],
    ['boot', 'shoes', 'boot'],
    ['loafer', 'shoes', 'flatShoe'], ['derby', 'shoes', 'flatShoe'], ['brogue', 'shoes', 'flatShoe'],
    ['oxford shoe', 'shoes', 'flatShoe'], ['moccasin', 'shoes', 'flatShoe'],
    ['heel', 'shoes', 'heel'], ['pump', 'shoes', 'heel'], ['court shoe', 'shoes', 'heel'],
    ['sandal', 'shoes', 'sandal'], ['slide', 'shoes', 'sandal'], ['flip flop', 'shoes', 'sandal'],
    ['shoe', 'shoes', 'flatShoe'],

    ['cap', 'accessory', 'cap'], ['beanie', 'accessory', 'beanie'], ['hat', 'accessory', 'beanie'],
    ['sunglass', 'accessory', 'sunglasses'], ['glasses', 'accessory', 'sunglasses'],
    ['scarf', 'accessory', 'scarf'],
    ['belt', 'accessory', 'belt'],
    ['tote', 'accessory', 'bagTote'],
    ['backpack', 'accessory', 'bagTote'], ['bag', 'accessory', 'bagShoulder']
  ];

  function readType(text) {
    var s = (text || '').toLowerCase();
    for (var i = 0; i < TYPE_WORDS.length; i++) {
      if (s.indexOf(TYPE_WORDS[i][0]) !== -1) {
        return { category: TYPE_WORDS[i][1], shape: TYPE_WORDS[i][2] };
      }
    }
    return null;
  }

  /* Style tags. Feeds never carry these, so they come from words
     in the title and description plus a fallback by category. */
  var TAG_WORDS = [
    ['oversized', 'street'], ['baggy', 'street'], ['relaxed', 'street'], ['streetwear', 'street'],
    ['tailored', 'classic'], ['classic', 'classic'], ['timeless', 'classic'], ['formal', 'classic'],
    ['minimal', 'minimal'], ['clean', 'minimal'], ['essential', 'minimal'], ['plain', 'minimal'],
    ['floral', 'romantic'], ['lace', 'romantic'], ['ruffle', 'romantic'], ['drape', 'romantic'],
    ['satin', 'romantic'], ['flowing', 'romantic'],
    ['leather', 'edgy'], ['biker', 'edgy'], ['studded', 'edgy'], ['distressed', 'edgy'],
    ['technical', 'sporty'], ['performance', 'sporty'], ['running', 'sporty'], ['training', 'sporty'],
    ['sport', 'sporty'], ['active', 'sporty'],
    ['utility', 'utility'], ['workwear', 'utility'], ['cargo', 'utility'], ['pocket', 'utility'],
    ['outdoor', 'utility'], ['hiking', 'utility'],
    ['retro', 'retro'], ['vintage', 'retro'], ['heritage', 'retro'], ['archive', 'retro'],
    ['70s', 'retro'], ['90s', 'retro'],
    ['print', 'colour'], ['bright', 'colour'], ['bold', 'colour'], ['colourful', 'colour'],
    ['asymmetric', 'avantGarde'], ['deconstructed', 'avantGarde'], ['sculptural', 'avantGarde']
  ];

  var CATEGORY_FALLBACK_TAGS = {
    top: ['minimal', 'classic'], outer: ['classic', 'minimal'], bottom: ['classic', 'minimal'],
    dress: ['romantic', 'classic'], shoes: ['classic', 'minimal'], accessory: ['minimal', 'utility']
  };

  function readTags(text, category, material) {
    var s = (text || '').toLowerCase();
    var found = {};
    TAG_WORDS.forEach(function (pair) {
      if (s.indexOf(pair[0]) !== -1) found[pair[1]] = 1;
    });
    if (material === 'denim') found.classic = 1;
    if (material === 'nylon') found.sporty = 1;
    if (material === 'canvas') found.utility = 1;
    if (material === 'silk') found.romantic = 1;
    var tags = Object.keys(found).slice(0, 3);
    return tags.length ? tags : (CATEGORY_FALLBACK_TAGS[category] || ['minimal']).slice();
  }

  function readPrice(text) {
    if (!text) return 0;
    var cleaned = String(text).replace(/[^\d.,]/g, '');
    /* "1.299,00" is European, "1,299.00" is not. Whichever
       separator comes last is the decimal point. */
    var lastComma = cleaned.lastIndexOf(',');
    var lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    else cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isFinite(n) ? Math.round(n) : 0;
  }

  function titleCase(s) {
    if (!s) return '';
    return s.trim().toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function slug(s, i) {
    var base = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (base || 'item').slice(0, 40) + '-' + i;
  }

  /* ============================================================
     Building items
     ============================================================ */
  function buildItems(rows, mapping, opts) {
    opts = opts || {};
    var out = [];
    var skipped = { noImage: 0, noType: 0, noPrice: 0, outOfStock: 0 };
    var brandTiers = {};

    rows.forEach(function (row, index) {
      function field(key) { return mapping[key] ? (row[mapping[key]] || '') : ''; }

      var availability = field('availability').toLowerCase();
      if (availability && /out.of.stock|oos|\b0\b|false|no/.test(availability) && !/in.stock/.test(availability)) {
        skipped.outOfStock++; return;
      }

      var image = (field('image') || '').split('|')[0].trim();
      if (!image && !opts.allowMissingImages) { skipped.noImage++; return; }

      var name = field('name');
      var type = readType(field('type') + ' ' + name + ' ' + field('desc'));
      if (!type) { skipped.noType++; return; }

      var price = readPrice(field('price'));
      if (!price && !opts.allowZeroPrice) { skipped.noPrice++; return; }

      var material = readMaterial(field('material') + ' ' + name + ' ' + field('desc'));
      var colour = readColour(field('colour') || name);
      var brand = titleCase(field('brand')) || opts.defaultBrand || 'Unbranded';

      if (!brandTiers[brand]) {
        brandTiers[brand] = price > 400 ? 3 : price > 90 ? 2 : 1;
      }

      var images = [image];
      var extra = field('extraImage');
      if (extra) extra.split('|').forEach(function (u) { if (u.trim()) images.push(u.trim()); });

      out.push({
        id: slug(name || field('id'), index),
        name: titleCase(name) || 'Untitled',
        brand: brand,
        price: price,
        colour: colour.hex,
        colourName: colour.name,
        family: colour.family,
        material: material,
        category: type.category,
        shape: type.shape,
        tags: readTags(name + ' ' + field('desc') + ' ' + field('type'), type.category, material),
        opts: {},
        images: images,
        buyLink: field('link') || null,
        tier: brandTiers[brand],
        imported: true
      });
    });

    return { items: out, skipped: skipped, brands: brandTiers };
  }

  /* ============================================================
     Installing
     ============================================================ */
  var STORE_KEY = 'style-me/catalog/v1';

  function saveCatalogue(items, brands) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ items: items, brands: brands })); }
    catch (e) { return false; }
    return true;
  }

  function loadCatalogue() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  SM.importer = {
    parse: parse,
    parseCSV: parseCSV,
    parseXML: parseXML,
    detectMapping: detectMapping,
    buildItems: buildItems,
    readColour: readColour,
    readMaterial: readMaterial,
    readType: readType,
    readPrice: readPrice,
    FIELD_HINTS: FIELD_HINTS,

    /* Swap the demo catalogue for the imported one. Everything
       downstream — the stylist, the filters, the feed — reads
       through SM.CATALOG, so nothing else needs to change. */
    install: function (items, brands) {
      if (!items.length) return false;
      SM.CATALOG.replace(items, brands);
      saveCatalogue(items, brands);
      SM._posts = null;                      // community regenerates against the new catalogue
      var s = SM.store.get();
      s.savedOutfits = [];
      s.savedItems = [];
      s.bag = [];
      s.likes = {};
      SM.store.save();
      return true;
    },

    restoreDemo: function () {
      try { window.localStorage.removeItem(STORE_KEY); } catch (e) {}
      SM.CATALOG.restore();
      SM._posts = null;
      var s = SM.store.get();
      s.savedOutfits = [];
      s.savedItems = [];
      s.bag = [];
      s.likes = {};
      SM.store.save();
    },

    /* Called at boot so an imported catalogue survives a reload. */
    rehydrate: function () {
      var saved = loadCatalogue();
      if (saved && saved.items && saved.items.length) {
        SM.CATALOG.replace(saved.items, saved.brands);
        return true;
      }
      return false;
    },

    isImported: function () { return !!loadCatalogue(); }
  };
})(window.SM);
