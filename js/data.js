/* ============================================================
   STYLE ME — data.js

   The catalogue, the style axes, and the demo community.

   Brands are real so the price tiers mean something. Product names
   are generic descriptions and prices are indicative — this is a
   demo catalogue, and every "buy" link opens a search on the
   brand's own site rather than a made-up product page.

   Drop real photography in by adding `images: ['url', …]` to an
   item; the renderer prefers a photograph over its drawing.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  /* ---------- style axes ---------------------------------------
     Ten axes shared by the quiz, the items and the ranking. */
  SM.AXES = {
    minimal:    { label: 'Minimal',     note: 'clean lines, nothing spare' },
    street:     { label: 'Street',      note: 'volume, city culture' },
    classic:    { label: 'Classic',     note: 'pieces that outlive seasons' },
    romantic:   { label: 'Romantic',    note: 'soft fabrics, movement' },
    edgy:       { label: 'Edgy',        note: 'black, leather, hard lines' },
    sporty:     { label: 'Sporty',      note: 'technical, built to move' },
    utility:    { label: 'Utility',     note: 'pockets, canvas, hardware' },
    retro:      { label: 'Retro',       note: 'archive cuts and colours' },
    colour:     { label: 'Colour',      note: 'colour before cut' },
    avantGarde: { label: 'Avant-garde', note: 'proportions you don’t expect' }
  };
  SM.AXIS_KEYS = Object.keys(SM.AXES);

  /* ---------- brands (tier 1 accessible → 3 designer) ---------- */
  SM.BRANDS = {
    'Uniqlo':          { tier: 1, search: 'https://www.uniqlo.com/uk/en/search?q=' },
    'Zara':            { tier: 1, search: 'https://www.zara.com/uk/en/search?searchTerm=' },
    'Weekday':         { tier: 1, search: 'https://www.weekday.com/en_gbp/search?q=' },
    'Monki':           { tier: 1, search: 'https://www.monki.com/en_gbp/search.html?q=' },
    'Levi’s':          { tier: 1, search: 'https://www.levi.com/GB/en_GB/search?q=' },
    'adidas':          { tier: 1, search: 'https://www.adidas.co.uk/search?q=' },
    'Nike':            { tier: 1, search: 'https://www.nike.com/gb/w?q=' },
    'Vans':            { tier: 1, search: 'https://www.vans.co.uk/search?q=' },
    'COS':             { tier: 2, search: 'https://www.cos.com/en_gbp/search.html?q=' },
    'Arket':           { tier: 2, search: 'https://www.arket.com/en_gbp/search.html?q=' },
    '& Other Stories': { tier: 2, search: 'https://www.stories.com/en_gbp/search.html?q=' },
    'Carhartt WIP':    { tier: 2, search: 'https://www.carhartt-wip.com/en/search?q=' },
    'Dr. Martens':     { tier: 2, search: 'https://www.drmartens.com/uk/en/search?q=' },
    'New Balance':     { tier: 2, search: 'https://www.newbalance.co.uk/search?q=' },
    'Veja':            { tier: 2, search: 'https://www.veja-store.com/en_gb/catalogsearch/result/?q=' },
    'Birkenstock':     { tier: 2, search: 'https://www.birkenstock.com/gb/search?q=' },
    'Salomon':         { tier: 2, search: 'https://www.salomon.com/en-gb/search?q=' },
    'Patagonia':       { tier: 2, search: 'https://eu.patagonia.com/gb/en/search/?q=' },
    'Stüssy':          { tier: 2, search: 'https://eu.stussy.com/search?q=' },
    'Massimo Dutti':   { tier: 2, search: 'https://www.massimodutti.com/gb/search?term=' },
    'Sandro':          { tier: 2, search: 'https://uk.sandro-paris.com/en/search?q=' },
    'A.P.C.':          { tier: 3, search: 'https://www.apc.fr/en/search?q=' },
    'Acne Studios':    { tier: 3, search: 'https://www.acnestudios.com/gb/en/search?q=' },
    'Our Legacy':      { tier: 3, search: 'https://ourlegacy.com/search?q=' },
    'Lemaire':         { tier: 3, search: 'https://www.lemaire.fr/search?q=' },
    'Toteme':          { tier: 3, search: 'https://toteme-studio.com/search?q=' },
    'Ganni':           { tier: 3, search: 'https://www.ganni.com/en-gb/search?q=' },
    'Jacquemus':       { tier: 3, search: 'https://www.jacquemus.com/search?q=' },
    'Aimé Leon Dore':  { tier: 3, search: 'https://www.aimeleondore.com/search?q=' },
    'Séfr':            { tier: 3, search: 'https://sefr.se/search?q=' }
  };

  /* ---------- materials, as shown to people -------------------- */
  SM.MATERIALS = {
    cotton:   'Cotton',    jersey: 'Cotton jersey', denim: 'Denim',
    wool:     'Wool',      knit:   'Knit',          rib:   'Ribbed knit',
    leather:  'Leather',   suede:  'Suede',         linen: 'Linen',
    silk:     'Silk',      nylon:  'Technical nylon', corduroy: 'Corduroy',
    velvet:   'Velvet',    canvas: 'Cotton canvas', tweed: 'Tweed',
    fleece:   'Fleece'
  };

  SM.COLOUR_FAMILIES = [
    { key: 'black',  label: 'Black',  swatch: '#1A1A1E' },
    { key: 'white',  label: 'White',  swatch: '#F2EFE7' },
    { key: 'grey',   label: 'Grey',   swatch: '#8C8E95' },
    { key: 'beige',  label: 'Beige',  swatch: '#C9B79C' },
    { key: 'brown',  label: 'Brown',  swatch: '#6B4B32' },
    { key: 'blue',   label: 'Blue',   swatch: '#33507F' },
    { key: 'green',  label: 'Green',  swatch: '#4A5F3C' },
    { key: 'red',    label: 'Red',    swatch: '#9E2B25' },
    { key: 'pink',   label: 'Pink',   swatch: '#D69AA2' },
    { key: 'yellow', label: 'Yellow', swatch: '#D8B24E' }
  ];

  SM.SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  SM.SHOE_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45'];

  /* ============================================================
     Catalogue
     ============================================================ */
  var items = [];
  function add(o) {
    o.tier = (SM.BRANDS[o.brand] || { tier: 2 }).tier;
    o.images = o.images || [];
    items.push(o);
  }

  /* --- tops ---------------------------------------------------- */
  add({ id: 'tee-heavy', name: 'Heavyweight Cotton Tee', brand: 'COS', price: 35, colour: '#EDE8DE', colourName: 'Off White', family: 'white', material: 'jersey', category: 'top', shape: 'tee', tags: ['minimal', 'classic'], opts: { boxy: true } });
  add({ id: 'tee-black-boxy', name: 'Boxy Cotton Tee', brand: 'Weekday', price: 22, colour: '#191A1E', colourName: 'Black', family: 'black', material: 'jersey', category: 'top', shape: 'tee', tags: ['minimal', 'street'], opts: { boxy: true } });
  add({ id: 'tee-graphic', name: 'Printed Cotton Tee', brand: 'Stüssy', price: 60, colour: '#3D4A3A', colourName: 'Moss', family: 'green', material: 'jersey', category: 'top', shape: 'tee', tags: ['street', 'retro'], opts: { boxy: true } });
  add({ id: 'tee-stripe', name: 'Striped Long Sleeve', brand: 'A.P.C.', price: 105, colour: '#243052', colourName: 'Navy', family: 'blue', material: 'jersey', category: 'top', shape: 'tee', tags: ['classic', 'retro'], opts: { long: true } });
  add({ id: 'tank-rib', name: 'Ribbed Tank', brand: 'Monki', price: 18, colour: '#F0EDE5', colourName: 'Ecru', family: 'white', material: 'rib', category: 'top', shape: 'tank', tags: ['minimal', 'sporty'], opts: { sleeveless: true, cropped: true } });
  add({ id: 'shirt-oxford', name: 'Oxford Shirt', brand: 'Uniqlo', price: 35, colour: '#D9E2EE', colourName: 'Pale Blue', family: 'blue', material: 'cotton', category: 'top', shape: 'shirt', tags: ['classic', 'minimal'] });
  add({ id: 'shirt-linen', name: 'Linen Shirt', brand: 'Arket', price: 75, colour: '#E3D8C4', colourName: 'Sand', family: 'beige', material: 'linen', category: 'top', shape: 'shirt', tags: ['romantic', 'classic'] });
  add({ id: 'shirt-silk-black', name: 'Fluid Silk Shirt', brand: 'Séfr', price: 190, colour: '#1B1B20', colourName: 'Black', family: 'black', material: 'silk', category: 'top', shape: 'shirt', tags: ['edgy', 'avantGarde'], opts: { pocket: false } });
  add({ id: 'shirt-check', name: 'Checked Flannel Shirt', brand: 'Carhartt WIP', price: 95, colour: '#7B3A2E', colourName: 'Brick', family: 'red', material: 'cotton', category: 'top', shape: 'shirt', tags: ['utility', 'retro'] });
  add({ id: 'knit-crew', name: 'Merino Crew Neck', brand: 'COS', price: 85, colour: '#59604F', colourName: 'Olive', family: 'green', material: 'knit', category: 'top', shape: 'knit', tags: ['minimal', 'classic'] });
  add({ id: 'knit-cable', name: 'Cable Knit Jumper', brand: 'Arket', price: 115, colour: '#E5DBC6', colourName: 'Cream', family: 'white', material: 'wool', category: 'top', shape: 'knit', tags: ['classic', 'romantic'], opts: { cable: true } });
  add({ id: 'knit-turtle', name: 'Fine Roll Neck', brand: 'Toteme', price: 210, colour: '#17171B', colourName: 'Black', family: 'black', material: 'knit', category: 'top', shape: 'knit', tags: ['minimal', 'edgy'], opts: { turtle: true } });
  add({ id: 'knit-mohair', name: 'Brushed Mohair Jumper', brand: 'Acne Studios', price: 310, colour: '#C08AA2', colourName: 'Dusty Pink', family: 'pink', material: 'wool', category: 'top', shape: 'knit', tags: ['romantic', 'colour'] });
  add({ id: 'knit-stripe', name: 'Wide Stripe Knit', brand: 'Our Legacy', price: 250, colour: '#9A6A3C', colourName: 'Tobacco', family: 'brown', material: 'knit', category: 'top', shape: 'knit', tags: ['retro', 'avantGarde'] });
  add({ id: 'hoodie-heavy', name: 'Heavyweight Hoodie', brand: 'Nike', price: 70, colour: '#8B8D94', colourName: 'Grey Marl', family: 'grey', material: 'fleece', category: 'top', shape: 'hoodie', tags: ['sporty', 'street'] });
  add({ id: 'hoodie-navy', name: 'Loopback Hoodie', brand: 'Aimé Leon Dore', price: 180, colour: '#2A3C60', colourName: 'Navy', family: 'blue', material: 'fleece', category: 'top', shape: 'hoodie', tags: ['street', 'retro'] });
  add({ id: 'sweat-crew', name: 'Crew Sweatshirt', brand: 'Uniqlo', price: 30, colour: '#D6D0C4', colourName: 'Oatmeal', family: 'beige', material: 'fleece', category: 'top', shape: 'hoodie', tags: ['sporty', 'minimal'], opts: { crew: true } });
  add({ id: 'top-satin', name: 'Satin Camisole', brand: '& Other Stories', price: 65, colour: '#7E2F3B', colourName: 'Burgundy', family: 'red', material: 'silk', category: 'top', shape: 'tank', tags: ['romantic', 'colour'], opts: { sleeveless: true } });

  /* --- outerwear ------------------------------------------------ */
  add({ id: 'blazer-wool', name: 'Single Breasted Blazer', brand: 'COS', price: 235, colour: '#24262D', colourName: 'Charcoal', family: 'black', material: 'wool', category: 'outer', shape: 'blazer', tags: ['classic', 'minimal'] });
  add({ id: 'blazer-oversize', name: 'Oversized Wool Blazer', brand: 'Toteme', price: 560, colour: '#B7A68B', colourName: 'Camel', family: 'beige', material: 'wool', category: 'outer', shape: 'blazer', tags: ['minimal', 'avantGarde'] });
  add({ id: 'jacket-denim', name: 'Trucker Jacket', brand: 'Levi’s', price: 110, colour: '#3F5B83', colourName: 'Rigid Indigo', family: 'blue', material: 'denim', category: 'outer', shape: 'denimJacket', tags: ['classic', 'retro'], opts: { rivets: true } });
  add({ id: 'jacket-denim-wash', name: 'Washed Denim Jacket', brand: 'Weekday', price: 85, colour: '#8FA6C4', colourName: 'Light Wash', family: 'blue', material: 'denim', category: 'outer', shape: 'denimJacket', tags: ['street', 'retro'] });
  add({ id: 'jacket-work', name: 'Cotton Work Jacket', brand: 'Carhartt WIP', price: 140, colour: '#3C4A38', colourName: 'Cypress', family: 'green', material: 'canvas', category: 'outer', shape: 'workJacket', tags: ['utility', 'street'] });
  add({ id: 'bomber-nylon', name: 'Nylon Bomber', brand: 'adidas', price: 120, colour: '#17171C', colourName: 'Black', family: 'black', material: 'nylon', category: 'outer', shape: 'bomber', tags: ['sporty', 'street'] });
  add({ id: 'bomber-suede', name: 'Suede Bomber', brand: 'Sandro', price: 470, colour: '#8A5A34', colourName: 'Tan', family: 'brown', material: 'suede', category: 'outer', shape: 'bomber', tags: ['retro', 'classic'] });
  add({ id: 'jacket-leather', name: 'Leather Biker Jacket', brand: 'Acne Studios', price: 1400, colour: '#141416', colourName: 'Black', family: 'black', material: 'leather', category: 'outer', shape: 'bomber', tags: ['edgy', 'classic'] });
  add({ id: 'coat-wool-long', name: 'Long Wool Coat', brand: 'Lemaire', price: 1250, colour: '#4C4438', colourName: 'Dark Taupe', family: 'brown', material: 'wool', category: 'outer', shape: 'coat', tags: ['minimal', 'avantGarde'] });
  add({ id: 'coat-check', name: 'Checked Wool Coat', brand: 'Acne Studios', price: 850, colour: '#6C7079', colourName: 'Grey Check', family: 'grey', material: 'tweed', category: 'outer', shape: 'coat', tags: ['avantGarde', 'retro'] });
  add({ id: 'trench-classic', name: 'Cotton Trench Coat', brand: 'Massimo Dutti', price: 240, colour: '#C6B393', colourName: 'Stone', family: 'beige', material: 'cotton', category: 'outer', shape: 'trench', tags: ['classic', 'minimal'] });
  add({ id: 'parka-tech', name: 'Technical Parka', brand: 'Patagonia', price: 270, colour: '#20395C', colourName: 'Deep Blue', family: 'blue', material: 'nylon', category: 'outer', shape: 'puffer', tags: ['sporty', 'utility'] });
  add({ id: 'puffer-black', name: 'Down Puffer Jacket', brand: 'Zara', price: 90, colour: '#1B1B1F', colourName: 'Black', family: 'black', material: 'nylon', category: 'outer', shape: 'puffer', tags: ['street', 'sporty'] });
  add({ id: 'cardigan-chunky', name: 'Chunky Wool Cardigan', brand: 'Our Legacy', price: 330, colour: '#6E4A55', colourName: 'Plum', family: 'pink', material: 'wool', category: 'outer', shape: 'cardigan', tags: ['romantic', 'retro'] });
  add({ id: 'cardigan-fine', name: 'Fine Knit Cardigan', brand: 'Uniqlo', price: 45, colour: '#2E3B2C', colourName: 'Forest', family: 'green', material: 'knit', category: 'outer', shape: 'cardigan', tags: ['classic', 'minimal'] });
  add({ id: 'shell-run', name: 'Running Shell', brand: 'Salomon', price: 200, colour: '#B33A24', colourName: 'Signal Red', family: 'red', material: 'nylon', category: 'outer', shape: 'puffer', tags: ['sporty', 'colour'] });

  /* --- bottoms -------------------------------------------------- */
  add({ id: 'jeans-straight', name: 'Straight Leg Jeans', brand: 'A.P.C.', price: 190, colour: '#2F4162', colourName: 'Raw Indigo', family: 'blue', material: 'denim', category: 'bottom', shape: 'jeans', tags: ['classic', 'minimal'], opts: { rivets: true, kneeHalf: 104, hemHalf: 96 } });
  add({ id: 'jeans-wide', name: 'Wide Leg Jeans', brand: 'Weekday', price: 65, colour: '#7C93B4', colourName: 'Mid Blue', family: 'blue', material: 'denim', category: 'bottom', shape: 'jeans', tags: ['street', 'retro'], opts: { rivets: true, whiskers: true, kneeHalf: 136, hemHalf: 132 } });
  add({ id: 'jeans-black-slim', name: 'Slim Black Jeans', brand: 'Levi’s', price: 100, colour: '#1D1D21', colourName: 'Black', family: 'black', material: 'denim', category: 'bottom', shape: 'jeans', tags: ['edgy', 'classic'], opts: { rivets: true, kneeHalf: 84, hemHalf: 74 } });
  add({ id: 'trouser-pleated', name: 'Pleated Wool Trousers', brand: 'COS', price: 105, colour: '#2B2D34', colourName: 'Ink', family: 'black', material: 'wool', category: 'bottom', shape: 'trousers', tags: ['classic', 'minimal'], opts: { crease: true, kneeHalf: 120, hemHalf: 112 } });
  add({ id: 'trouser-wide-cream', name: 'Wide Cotton Trousers', brand: 'Arket', price: 89, colour: '#DCD1BA', colourName: 'Cream', family: 'beige', material: 'cotton', category: 'bottom', shape: 'trousers', tags: ['minimal', 'romantic'], opts: { kneeHalf: 138, hemHalf: 134 } });
  add({ id: 'trouser-fluid', name: 'Fluid High Waist Trousers', brand: 'Lemaire', price: 590, colour: '#4E4C46', colourName: 'Slate', family: 'grey', material: 'silk', category: 'bottom', shape: 'trousers', tags: ['avantGarde', 'minimal'], opts: { kneeHalf: 142, hemHalf: 138 } });
  add({ id: 'trouser-cord', name: 'Corduroy Trousers', brand: 'Our Legacy', price: 280, colour: '#8A5B2E', colourName: 'Rust', family: 'brown', material: 'corduroy', category: 'bottom', shape: 'trousers', tags: ['retro', 'avantGarde'], opts: { kneeHalf: 118, hemHalf: 110 } });
  add({ id: 'cargo-canvas', name: 'Canvas Cargo Trousers', brand: 'Carhartt WIP', price: 115, colour: '#5B5C46', colourName: 'Field Green', family: 'green', material: 'canvas', category: 'bottom', shape: 'cargo', tags: ['utility', 'street'], opts: { cargo: true, kneeHalf: 126, hemHalf: 118 } });
  add({ id: 'cargo-tech', name: 'Technical Cargo Trousers', brand: 'Zara', price: 50, colour: '#1F1F23', colourName: 'Black', family: 'black', material: 'nylon', category: 'bottom', shape: 'cargo', tags: ['street', 'sporty'], opts: { cargo: true, cuff: true, kneeHalf: 120, hemHalf: 88 } });
  add({ id: 'joggers-fleece', name: 'Fleece Joggers', brand: 'Nike', price: 55, colour: '#8B8D94', colourName: 'Grey Marl', family: 'grey', material: 'fleece', category: 'bottom', shape: 'joggers', tags: ['sporty', 'street'], opts: { cuff: true, loops: false, kneeHalf: 114, hemHalf: 78 } });
  add({ id: 'shorts-denim', name: 'Denim Shorts', brand: 'Levi’s', price: 60, colour: '#9BB0C9', colourName: 'Light Wash', family: 'blue', material: 'denim', category: 'bottom', shape: 'shorts', tags: ['retro', 'sporty'], opts: { rivets: true, hemY: 520, kneeHalf: 132, hemHalf: 128 } });
  add({ id: 'shorts-tailored', name: 'Tailored Linen Shorts', brand: 'Massimo Dutti', price: 65, colour: '#BFAE92', colourName: 'Sand', family: 'beige', material: 'linen', category: 'bottom', shape: 'shorts', tags: ['classic', 'minimal'], opts: { crease: true, hemY: 520, kneeHalf: 128, hemHalf: 124 } });
  add({ id: 'skirt-pleated', name: 'Pleated Midi Skirt', brand: '& Other Stories', price: 85, colour: '#3C404C', colourName: 'Graphite', family: 'grey', material: 'silk', category: 'bottom', shape: 'skirt', tags: ['romantic', 'classic'], opts: { pleated: true } });
  add({ id: 'skirt-leather', name: 'Leather Mini Skirt', brand: 'Sandro', price: 310, colour: '#18181C', colourName: 'Black', family: 'black', material: 'leather', category: 'bottom', shape: 'skirt', tags: ['edgy', 'romantic'], opts: { hemY: 460, hemHalf: 168 } });
  add({ id: 'skirt-print', name: 'Printed Maxi Skirt', brand: 'Ganni', price: 235, colour: '#7C3F58', colourName: 'Berry', family: 'pink', material: 'silk', category: 'bottom', shape: 'skirt', tags: ['colour', 'romantic'], opts: { hemY: 700, hemHalf: 232 } });

  /* --- dresses -------------------------------------------------- */
  add({ id: 'dress-shirt', name: 'Cotton Shirt Dress', brand: 'COS', price: 125, colour: '#3B4A44', colourName: 'Deep Green', family: 'green', material: 'cotton', category: 'dress', shape: 'dress', tags: ['minimal', 'classic'], opts: { long: true } });
  add({ id: 'dress-slip', name: 'Bias Cut Slip Dress', brand: '& Other Stories', price: 120, colour: '#2C3A5E', colourName: 'Midnight', family: 'blue', material: 'silk', category: 'dress', shape: 'dress', tags: ['romantic', 'classic'], opts: { strap: true } });
  add({ id: 'dress-structured', name: 'Structured Wool Dress', brand: 'Acne Studios', price: 650, colour: '#151518', colourName: 'Black', family: 'black', material: 'wool', category: 'dress', shape: 'dress', tags: ['edgy', 'avantGarde'] });
  add({ id: 'dress-floral', name: 'Floral Print Dress', brand: 'Ganni', price: 285, colour: '#8C3A4E', colourName: 'Rose Red', family: 'red', material: 'silk', category: 'dress', shape: 'dress', tags: ['colour', 'romantic'] });
  add({ id: 'dress-rib', name: 'Ribbed Tank Dress', brand: 'Monki', price: 32, colour: '#C7BEB0', colourName: 'Taupe', family: 'beige', material: 'rib', category: 'dress', shape: 'dress', tags: ['minimal', 'sporty'], opts: { strap: true } });
  add({ id: 'dress-draped', name: 'Draped Asymmetric Dress', brand: 'Jacquemus', price: 790, colour: '#EBE4D6', colourName: 'Ivory', family: 'white', material: 'silk', category: 'dress', shape: 'dress', tags: ['avantGarde', 'romantic'], opts: { strap: true } });

  /* --- footwear ------------------------------------------------- */
  add({ id: 'sneaker-court', name: 'Leather Court Sneaker', brand: 'Veja', price: 120, colour: '#EFEDE6', colourName: 'White', family: 'white', material: 'leather', category: 'shoes', shape: 'sneaker', tags: ['minimal', 'classic'], opts: { accent: '#8E9A80', sole: '#F4F1E9' } });
  add({ id: 'sneaker-runner', name: 'Suede Retro Runner', brand: 'New Balance', price: 130, colour: '#B5B0A4', colourName: 'Grey', family: 'grey', material: 'suede', category: 'shoes', shape: 'sneaker', tags: ['retro', 'sporty'], opts: { accent: '#5E6B7A', sole: '#EDE7DA', airUnit: true } });
  add({ id: 'sneaker-canvas', name: 'High Top Canvas Sneaker', brand: 'Vans', price: 75, colour: '#17171B', colourName: 'Black', family: 'black', material: 'canvas', category: 'shoes', shape: 'sneaker', tags: ['street', 'retro'], opts: { accent: '#F1EDE3', sole: '#F1EDE3' } });
  add({ id: 'sneaker-trail', name: 'Technical Trail Shoe', brand: 'Salomon', price: 170, colour: '#2B2F39', colourName: 'Graphite', family: 'grey', material: 'nylon', category: 'shoes', shape: 'sneaker', tags: ['sporty', 'utility'], opts: { accent: '#C4402C', sole: '#D7D2C6', lace: '#C4402C' } });
  add({ id: 'sneaker-shell', name: 'Shell Toe Sneaker', brand: 'adidas', price: 95, colour: '#F0EDE4', colourName: 'White', family: 'white', material: 'leather', category: 'shoes', shape: 'sneaker', tags: ['retro', 'street'], opts: { accent: '#2A2A30', sole: '#EFE9DA' } });
  add({ id: 'boot-1460', name: 'Eight Eyelet Boot', brand: 'Dr. Martens', price: 189, colour: '#1C1719', colourName: 'Black', family: 'black', material: 'leather', category: 'shoes', shape: 'boot', tags: ['edgy', 'retro'], opts: { welt: '#D8C48A', lace: '#2A2420' } });
  add({ id: 'boot-chelsea', name: 'Suede Chelsea Boot', brand: 'Zara', price: 70, colour: '#7A5636', colourName: 'Tobacco', family: 'brown', material: 'suede', category: 'shoes', shape: 'boot', tags: ['classic', 'retro'], opts: { elastic: true } });
  add({ id: 'boot-square', name: 'Square Toe Leather Boot', brand: 'Our Legacy', price: 460, colour: '#2B211D', colourName: 'Dark Brown', family: 'brown', material: 'leather', category: 'shoes', shape: 'boot', tags: ['avantGarde', 'edgy'], opts: { elastic: true, tall: true } });
  add({ id: 'loafer-penny', name: 'Leather Penny Loafer', brand: 'Massimo Dutti', price: 125, colour: '#3A2A22', colourName: 'Chocolate', family: 'brown', material: 'leather', category: 'shoes', shape: 'flatShoe', tags: ['classic', 'retro'], opts: { penny: true } });
  add({ id: 'derby-black', name: 'Leather Derby Shoe', brand: 'COS', price: 165, colour: '#18181C', colourName: 'Black', family: 'black', material: 'leather', category: 'shoes', shape: 'flatShoe', tags: ['classic', 'minimal'], opts: { lace: true } });
  add({ id: 'heel-slim', name: 'Slim Leather Heel', brand: 'Sandro', price: 235, colour: '#17171B', colourName: 'Black', family: 'black', material: 'leather', category: 'shoes', shape: 'heel', tags: ['edgy', 'romantic'], opts: { heel: true } });
  add({ id: 'sandal-buckle', name: 'Two Strap Sandal', brand: 'Birkenstock', price: 105, colour: '#4A3A2E', colourName: 'Dark Brown', family: 'brown', material: 'leather', category: 'shoes', shape: 'sandal', tags: ['utility', 'retro'] });

  /* --- accessories ---------------------------------------------- */
  add({ id: 'cap-six-panel', name: 'Six Panel Cap', brand: 'Carhartt WIP', price: 32, colour: '#3C4A38', colourName: 'Cypress', family: 'green', material: 'canvas', category: 'accessory', shape: 'cap', tags: ['street', 'utility'] });
  add({ id: 'cap-flat', name: 'Flat Brim Cap', brand: 'Stüssy', price: 45, colour: '#1B1B20', colourName: 'Black', family: 'black', material: 'canvas', category: 'accessory', shape: 'cap', tags: ['street', 'sporty'], opts: { flat: true } });
  add({ id: 'beanie-rib', name: 'Ribbed Wool Beanie', brand: 'Arket', price: 25, colour: '#2C2F37', colourName: 'Navy', family: 'blue', material: 'wool', category: 'accessory', shape: 'beanie', tags: ['minimal', 'utility'] });
  add({ id: 'sunglasses-rect', name: 'Rectangular Sunglasses', brand: 'Acne Studios', price: 240, colour: '#141416', colourName: 'Black', family: 'black', material: 'nylon', category: 'accessory', shape: 'sunglasses', tags: ['edgy', 'avantGarde'] });
  add({ id: 'sunglasses-amber', name: 'Amber Tinted Sunglasses', brand: 'Zara', price: 25, colour: '#8A5C22', colourName: 'Amber', family: 'yellow', material: 'nylon', category: 'accessory', shape: 'sunglasses', tags: ['retro', 'colour'] });
  add({ id: 'scarf-wool', name: 'Oversized Wool Scarf', brand: 'COS', price: 65, colour: '#7E3A32', colourName: 'Rust', family: 'red', material: 'wool', category: 'accessory', shape: 'scarf', tags: ['classic', 'romantic'] });
  add({ id: 'scarf-silk', name: 'Printed Silk Scarf', brand: 'Ganni', price: 90, colour: '#C79BB0', colourName: 'Blush', family: 'pink', material: 'silk', category: 'accessory', shape: 'scarf', tags: ['romantic', 'colour'] });
  add({ id: 'belt-leather', name: 'Slim Leather Belt', brand: 'COS', price: 50, colour: '#28211D', colourName: 'Dark Brown', family: 'brown', material: 'leather', category: 'accessory', shape: 'belt', tags: ['classic', 'minimal'] });
  add({ id: 'bag-tote', name: 'Canvas Tote Bag', brand: 'Uniqlo', price: 20, colour: '#D8D0BE', colourName: 'Natural', family: 'beige', material: 'canvas', category: 'accessory', shape: 'bagTote', tags: ['minimal', 'utility'] });
  add({ id: 'bag-shoulder', name: 'Leather Shoulder Bag', brand: 'A.P.C.', price: 310, colour: '#2E241E', colourName: 'Dark Brown', family: 'brown', material: 'leather', category: 'accessory', shape: 'bagShoulder', tags: ['classic', 'minimal'] });
  add({ id: 'bag-mini', name: 'Structured Mini Bag', brand: 'Jacquemus', price: 550, colour: '#8E2F33', colourName: 'Red', family: 'red', material: 'leather', category: 'accessory', shape: 'bagShoulder', tags: ['colour', 'avantGarde'] });

  var DEMO_ITEMS = items;
  var DEMO_BRANDS = SM.BRANDS;

  function index(list) {
    var by = {};
    list.forEach(function (i) { by[i.id] = i; });
    return by;
  }

  SM.CATALOG = {
    items: items,
    byId: index(items),
    demo: true,

    byCategory: function (cat) {
      return SM.CATALOG.items.filter(function (i) { return i.category === cat; });
    },

    /* An imported product carries its own deep link; a demo one
       only gets a search on the brand's site, because inventing a
       product URL would be a lie. */
    searchLink: function (item) {
      if (item.buyLink) return item.buyLink;
      var b = SM.BRANDS[item.brand];
      var q = encodeURIComponent(item.name);
      return b && b.search ? b.search + q
        : 'https://www.google.com/search?q=' + encodeURIComponent(item.brand + ' ' + item.name);
    },

    sizesFor: function (item) {
      return item.category === 'shoes' ? SM.SHOE_SIZES : SM.SIZES;
    },

    /* Swap in a catalogue imported from a merchant feed. */
    replace: function (list, brandTiers) {
      SM.CATALOG.items = list;
      SM.CATALOG.byId = index(list);
      SM.CATALOG.demo = false;
      if (brandTiers) {
        var brands = {};
        Object.keys(brandTiers).forEach(function (name) {
          brands[name] = { tier: brandTiers[name], search: null };
        });
        SM.BRANDS = brands;
      }
    },

    restore: function () {
      SM.CATALOG.items = DEMO_ITEMS;
      SM.CATALOG.byId = index(DEMO_ITEMS);
      SM.CATALOG.demo = true;
      SM.BRANDS = DEMO_BRANDS;
    }
  };

  /* ============================================================
     Demo community
     ============================================================ */
  SM.PEOPLE = [
    { id: 'p1', handle: 'juliette.k', name: 'Juliette K.', city: 'Paris', bio: 'I sort my wardrobe by colour. It shows.', followers: 12400,
      axes: { minimal: 9, classic: 6, romantic: 5 },
      look: { skin: '#EFCDAE', hairColour: '#4E3220', hairStyle: 'long', build: 0.32, height: 0.62, frame: 0.26 } },
    { id: 'p2', handle: 'malik.ns', name: 'Malik N.', city: 'Marseille', bio: 'Cargos, cap, nothing to prove.', followers: 8300,
      axes: { street: 9, utility: 7, sporty: 5 },
      look: { skin: '#8E5A34', hairColour: '#171310', hairStyle: 'short', build: 0.55, height: 0.56, frame: 0.86 } },
    { id: 'p3', handle: 'nour.b', name: 'Nour B.', city: 'Brussels', bio: 'Nineties archive only. Almost.', followers: 21900,
      axes: { retro: 9, colour: 6, street: 5 },
      look: { skin: '#CE9A6E', hairColour: '#2E1F16', hairStyle: 'curly', build: 0.44, height: 0.48, frame: 0.42 } },
    { id: 'p4', handle: 'theo.mrn', name: 'Théo M.', city: 'Lyon', bio: 'Black, black, and a little dark grey.', followers: 5600,
      axes: { edgy: 9, minimal: 6, avantGarde: 6 },
      look: { skin: '#E3B48D', hairColour: '#171310', hairStyle: 'buzz', build: 0.42, height: 0.6, frame: 0.8 } },
    { id: 'p5', handle: 'sasha.lin', name: 'Sasha L.', city: 'Copenhagen', bio: 'Big coat, small shoes.', followers: 34100,
      axes: { minimal: 9, avantGarde: 7, classic: 5 },
      look: { skin: '#F6DFCB', hairColour: '#B98B4E', hairStyle: 'bob', build: 0.3, height: 0.7, frame: 0.3 } },
    { id: 'p6', handle: 'ines.ct', name: 'Inès C.', city: 'Bordeaux', bio: 'Floral dresses and work boots.', followers: 9700,
      axes: { romantic: 8, utility: 6, colour: 6 },
      look: { skin: '#D8AE8A', hairColour: '#6B3A22', hairStyle: 'long', build: 0.52, height: 0.44, frame: 0.34 } },
    { id: 'p7', handle: 'yanis.r', name: 'Yanis R.', city: 'Paris', bio: 'Sport as an excuse.', followers: 15200,
      axes: { sporty: 9, street: 7, colour: 4 },
      look: { skin: '#A06B45', hairColour: '#191214', hairStyle: 'curly', build: 0.62, height: 0.58, frame: 0.84 } },
    { id: 'p8', handle: 'camille.v', name: 'Camille V.', city: 'Nantes', bio: 'Everything second hand except the socks.', followers: 4300,
      axes: { retro: 8, romantic: 6, classic: 5 },
      look: { skin: '#F0DCC6', hairColour: '#8A6A4A', hairStyle: 'bun', build: 0.4, height: 0.5, frame: 0.32 } }
  ];
  SM.PERSON_BY_ID = {};
  SM.PEOPLE.forEach(function (p) { SM.PERSON_BY_ID[p.id] = p; });

  SM.CAPTIONS = [
    'Three pieces, no thinking required in the morning.',
    'The coat is my grandmother’s. The rest is not.',
    'Field test: does it survive the rain?',
    'Someone said it was too much. That was the idea.',
    'Same outfit as last week. No regrets.',
    'Twelve euros at a flea market and nobody believes me.',
    'The shoes are doing all the work here.',
    'Winter version of the look you liked most.',
    'Beige is a personality.',
    'Dressed for a wedding or for buying bread.',
    'Finally found the trousers. Six months of looking.',
    'With or without the jacket?'
  ];

  SM.COMMENTS = [
    { p: 'p3', t: 'That jacket 😮 where’s it from?' },
    { p: 'p5', t: 'The proportions are perfect here.' },
    { p: 'p2', t: 'Trying the same but wider' },
    { p: 'p8', t: 'This colour really suits you' },
    { p: 'p1', t: 'Copying this, sorry not sorry' },
    { p: 'p7', t: 'The shoes change everything' },
    { p: 'p4', t: 'Simple and sharp. Nothing to add.' },
    { p: 'p6', t: 'Would you do it in black too?' }
  ];

  SM.THREAD_SEEDS = [
    { person: 'p5', messages: [
      { me: false, t: 'Hey! Saw you liked my long coat look', at: '2d' },
      { me: false, t: 'It’s still in stock in a 38 if you want it', at: '2d' }
    ]},
    { person: 'p2', messages: [
      { me: false, t: 'yo, what size do you take in cargos?', at: '1d' },
      { me: true,  t: 'Honestly somewhere between M and L', at: '1d' },
      { me: false, t: 'take the L, it hangs better', at: '1d' }
    ]},
    { person: 'p6', messages: [
      { me: false, t: 'Thanks for the comment 🙏', at: '5h' },
      { me: false, t: 'The dress is last season, I’ll find you the link', at: '5h' }
    ]},
    { person: 'p3', messages: [
      { me: false, t: 'Clothes swap on Saturday if you’re in Brussels', at: '20m' }
    ]}
  ];

  SM.AUTO_REPLIES = [
    'Great, I’ll let you know 👌',
    'Completely agree with you',
    'Let me check and come back to you',
    'Haha yes exactly',
    'Tell me how it goes!',
    'I’ll send you a photo tomorrow'
  ];
})(window.SM);
