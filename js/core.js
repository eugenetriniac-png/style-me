/* ============================================================
   STYLE ME — core.js

   The Style Core: the ten-axis method from the style test, run on
   free text instead of twelve fixed answers.

   This is a simulated agent. There is no language model: a
   vocabulary of cues pushes the same ten axes the quiz uses, and
   the rest — archetype, directions to explore, the outfit — comes
   from the engine that already exists. It is deterministic on
   purpose: the same words always give the same core, which is what
   makes it testable. The prompt a real model would receive lives
   in the prompt library on /docs.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var ENGINE = 'rules-v1';
  var MIN_CHARS = 20;
  var MAX_CHARS = 1200;

  /* ---------- vocabulary ----------------------------------------
     [pattern, label shown on the card, weights]. Patterns are
     matched on lower-cased text; the label is what the user sees
     under "Signals read". Weights run 1–3, like the quiz. */
  var CUES = [
    /* minimal */
    [/\bminimal\w*/, 'minimal', { minimal: 3 }],
    [/\bsimpl(e|icity)\b/, 'simple', { minimal: 2 }],
    [/\bclean\b/, 'clean', { minimal: 2 }],
    [/\bplain\b/, 'plain', { minimal: 2 }],
    [/\bbasics?\b/, 'basics', { minimal: 2, classic: 1 }],
    [/\bneutrals?\b/, 'neutral', { minimal: 2, classic: 1 }],
    [/\bcapsule\b/, 'capsule', { minimal: 3 }],
    [/\b(understated|discreet|subtle|low[- ]key)\b/, 'understated', { minimal: 2, classic: 1 }],
    [/\bmuted\b/, 'muted', { minimal: 2 }],
    [/\b(monochrome|tonal)\b/, 'monochrome', { minimal: 2, edgy: 1 }],
    [/\b(white|off[- ]white|cream|ecru)\b/, 'white', { minimal: 1 }],
    [/\b(grey|gray)\b/, 'grey', { minimal: 2 }],
    [/\bbeige\b/, 'beige', { minimal: 2, classic: 1 }],
    [/\b(cos|uniqlo|muji)\b/, 'COS / Uniqlo', { minimal: 3 }],

    /* street */
    [/\bstreet\w*/, 'streetwear', { street: 3 }],
    [/\b(oversized?|baggy|loose)\b/, 'oversized', { street: 2 }],
    [/\bwide[- ]?(leg|fit|trousers?|jeans|pants)?\b/, 'wide', { street: 2, avantGarde: 1 }],
    [/\bhood(ie|ies|y)\b/, 'hoodie', { street: 3, sporty: 1 }],
    [/\b(sneakers?|trainers?|kicks)\b/, 'sneakers', { street: 2, sporty: 1 }],
    [/\b(jordans?|dunks?|air max|nike|adidas)\b/, 'Nike / Adidas', { street: 2, sporty: 2 }],
    [/\bskat(e|er|ing|eboard)\w*/, 'skate', { street: 3 }],
    [/\b(hip[- ]hop|rap|drill)\b/, 'hip-hop', { street: 3 }],
    [/\bgraphic( tees?)?\b/, 'graphic tee', { street: 2, colour: 1 }],
    [/\b(caps?|beanies?)\b/, 'cap', { street: 2 }],
    [/\bpuffer\b/, 'puffer', { street: 2, utility: 1 }],

    /* classic */
    [/\bclassic\w*/, 'classic', { classic: 3 }],
    [/\btimeless\b/, 'timeless', { classic: 3 }],
    /* "it suits me" is not tailoring */
    [/\b(tailor\w*|blazers?)\b|\bsuits?\b(?! (me|you|him|her|them|my|your|everyone))/, 'tailoring', { classic: 3 }],
    /* "t-shirt" is not a shirt */
    [/\b(button[- ](up|down)|oxford)\b|(?<!t-)\bshirts?\b/, 'shirt', { classic: 2 }],
    [/\b(t-?shirts?|tees?)\b/, 't-shirt', { minimal: 1, street: 1 }],
    [/\b(loafers?|derb(y|ies)|brogues?)\b/, 'loafers', { classic: 3 }],
    [/\btrench\b/, 'trench', { classic: 3 }],
    [/\bchinos?\b/, 'chinos', { classic: 2 }],
    [/\b(preppy|polo|ralph lauren)\b/, 'preppy', { classic: 3 }],
    [/\b(smart|sharp(er)?|polished|elegant|put[- ]together|refined)\b/, 'sharp', { classic: 2, minimal: 1 }],
    [/\b(office|corporate|professional|banker)\b/, 'office', { classic: 3 }],
    [/\b(navy|camel)\b/, 'navy / camel', { classic: 2 }],
    [/\b(cashmere|merino|wool|knit\w*)\b/, 'wool', { classic: 2, romantic: 1 }],

    /* romantic */
    [/\bromantic\w*/, 'romantic', { romantic: 3 }],
    [/\bsoft(ness)?\b/, 'soft', { romantic: 2 }],
    [/\b(flow(y|ing)|drap(e|ed|ing)|fluid|floaty)\b/, 'flowing', { romantic: 3 }],
    [/\b(silk\w*|satin|velvet|lace|chiffon)\b/, 'silk / velvet', { romantic: 3 }],
    /* the noun only: "how I dress" says nothing about dresses */
    [/\b(dresses|skirts?)\b|\b(a|my|the|slip|summer|maxi|midi|long|wrap|black) dress\b/, 'dress / skirt', { romantic: 2 }],
    [/\b(floral|flowers?|pastels?|pink|lilac|blush)\b/, 'floral / pastel', { romantic: 2, colour: 1 }],
    [/\b(ruffles?|puff(ed)? sleeves?|bows?)\b/, 'ruffles', { romantic: 3 }],
    [/\b(gentle|delicate|feminine|dreamy)\b/, 'delicate', { romantic: 2 }],

    /* edgy */
    [/\bedg(y|e)\b/, 'edgy', { edgy: 3 }],
    [/\b(all[- ]black|black on black)\b/, 'all black', { edgy: 3, minimal: 1 }],
    [/\bblack\b/, 'black', { edgy: 2, minimal: 1 }],
    [/\bleather\b/, 'leather', { edgy: 3, classic: 1 }],
    [/\b(doc martens|dr\.? ?martens|docs)\b/, 'Doc Martens', { edgy: 3, retro: 1 }],
    [/\bboots?\b/, 'boots', { edgy: 2, utility: 1 }],
    [/\b(punk|goth\w*|grunge|metal|rock)\b/, 'punk / grunge', { edgy: 3, retro: 1 }],
    [/\b(chains?|studs?|studded|rings?)\b/, 'chains / rings', { edgy: 2 }],
    [/\bdark\b/, 'dark', { edgy: 2 }],
    [/\b(biker|moto)\b/, 'biker', { edgy: 3 }],
    [/\b(ripped|distressed)\b/, 'distressed', { edgy: 2, street: 1 }],

    /* sporty */
    [/\b(sport\w*|athlet\w*|athleisure)\b/, 'sporty', { sporty: 3 }],
    [/\b(gym|running|runners?|trail)\b/, 'running', { sporty: 3 }],
    [/\b(leggings?|shorts|jerseys?)\b/, 'jersey / shorts', { sporty: 2 }],
    [/\b(joggers?|tracksuits?|track ?pants)\b/, 'tracksuit', { sporty: 3, street: 1 }],
    [/\b(technical|performance|gore[- ]?tex|nylon|fleece)\b/, 'technical fabric', { sporty: 2, utility: 2 }],
    [/\b(comfy|comfort\w*)\b/, 'comfort', { sporty: 1, romantic: 1 }],
    [/\b(salomon|arc'?teryx|north face|patagonia)\b/, 'outdoor brands', { utility: 2, sporty: 2 }],

    /* utility */
    [/\b(utility|utilitarian|functional|practical)\b/, 'practical', { utility: 3 }],
    [/\b(workwear|carhartt|dickies)\b/, 'workwear', { utility: 3, retro: 1 }],
    [/\bcargos?\b/, 'cargo', { utility: 2, street: 2 }],
    [/\bpockets?\b/, 'pockets', { utility: 2 }],
    [/\b(canvas|chore coat|overshirt)\b/, 'canvas', { utility: 2 }],
    [/\b(outdoors?|hik(e|es|ing)|camping|mountains?|waterproof|rain)\b/, 'outdoors', { utility: 3, sporty: 1 }],
    [/\b(olive|khaki|military|army)\b/, 'khaki / military', { utility: 3 }],
    [/\b(durable|sturdy|built to last)\b/, 'durable', { utility: 2, classic: 1 }],
    [/\bparkas?\b/, 'parka', { utility: 2 }],

    /* retro */
    [/\b(retro|vintage|archive)\b/, 'vintage', { retro: 3 }],
    [/\b(thrift\w*|second[- ]?hand|charity shops?|flea|depop|vinted)\b/, 'second-hand', { retro: 3, avantGarde: 1 }],
    [/\b(sixties|seventies|eighties|nineties|[6789]0s|'[6789]0s)\b/, 'decades', { retro: 3 }],
    [/\b(old[- ]school|grandpa|grandad|grandma|granny)\b/, 'old-school', { retro: 2, classic: 1 }],
    [/\bcord(uroy)?\b/, 'corduroy', { retro: 2, utility: 1 }],
    [/\b(levi'?s|501s?|mom jeans|straight[- ]leg)\b/, "Levi's", { retro: 2, classic: 1 }],
    [/\b(denim|jeans)\b/, 'denim', { retro: 1, street: 1, utility: 1 }],
    [/\b(varsity|college jacket)\b/, 'varsity', { retro: 2, sporty: 1 }],

    /* colour */
    [/\bcolou?r(s|ful)?\b/, 'colour', { colour: 3 }],
    [/\b(bright|bold|vivid|loud|neon|saturated)\b/, 'bright', { colour: 3 }],
    [/\b(red|orange|yellow|green|blue|purple)\b/, 'a named colour', { colour: 1 }],
    [/\b(prints?|patterns?|patterned|stripes?|striped|checked|gingham|plaid|tartan|leopard)\b/, 'print / pattern', { colour: 2, retro: 1 }],
    [/\bmix(ing)? (and|&) match\w*/, 'mix and match', { colour: 2, avantGarde: 1 }],

    /* avant-garde */
    [/\b(avant[- ]?garde|experimental|conceptual)\b/, 'avant-garde', { avantGarde: 3 }],
    [/\b(weird|odd|unusual|strange|unexpected)\b/, 'unusual', { avantGarde: 2 }],
    [/\b(asymmetr\w*|deconstruct\w*|sculptural|architectural|proportions?|volumes?)\b/, 'proportion', { avantGarde: 3 }],
    [/\b(arty|artsy|artistic|gallery|designer)\b/, 'artistic', { avantGarde: 2 }],
    [/\b(rick owens|yohji|comme des|margiela|issey)\b/, 'Rick Owens / Yohji', { avantGarde: 3, edgy: 1 }],
    [/\blayer(s|ing|ed)?\b/, 'layering', { avantGarde: 1, utility: 1 }],
    [/\b(stand out|statement|unique|nobody else)\b/, 'statement', { avantGarde: 2, colour: 1 }]
  ];

  /* A cue is negated when one of these sits between it and the start
     of its clause: "I never wear colour" lowers Colour instead of
     raising it. A comma, "but" or a full stop ends the clause, so
     "no colour, mostly black" still counts black. */
  var NEGATOR = /\b(no|not|never|don'?t|dont|doesn'?t|won'?t|can'?t stand|hate|avoid|without|nothing|zero|less|dislike|anything but)\b/;
  /* ...except when the negation is itself negated. */
  var UNNEGATED = /\b(not|never|no longer) (afraid|scared|shy)\b|\bdon'?t mind\b/;
  var CLAUSE_END = /[.,;:!?\n]|\bbut\b|\bexcept\b/g;
  var NEGATED_FACTOR = 0.8;

  function clauseBefore(text, index) {
    var head = text.slice(Math.max(0, index - 60), index);
    var last = -1, m;
    CLAUSE_END.lastIndex = 0;
    while ((m = CLAUSE_END.exec(head))) last = m.index + m[0].length;
    return last === -1 ? head : head.slice(last);
  }

  /* Situations nudge, they don't decide: at most three points, where a
     single strong cue is worth three on its own. */
  var OCCASIONS = {
    everyday: { label: 'Everyday', phrase: 'for every day', prior: {} },
    work:     { label: 'Work', phrase: 'for work', prior: { classic: 3, minimal: 2 } },
    night:    { label: 'Night out', phrase: 'for a night out', prior: { edgy: 2, colour: 1, romantic: 1 } },
    weekend:  { label: 'Weekend', phrase: 'for the weekend', prior: { utility: 2, sporty: 1, street: 1 } }
  };
  var BUDGETS = [150, 300, 600, null];

  /* ---------- extraction ---------------------------------------- */
  /* Each signal keeps the cue it matched and the words the user
     actually wrote: the card shows the words, so the reading can be
     checked against the text. */
  function readSignals(text) {
    var signals = [];
    CUES.forEach(function (cue) {
      var m = cue[0].exec(text);
      if (!m) return;
      var clause = clauseBefore(text, m.index);
      var negated = NEGATOR.test(clause) && !UNNEGATED.test(clause);
      signals.push({ cue: cue[1], word: m[0].trim(), axes: Object.keys(cue[2]), weights: cue[2], negated: negated, at: m.index });
    });
    /* "all black" already counts black: keep the stronger cue only. */
    if (signals.some(function (s) { return s.cue === 'all black'; })) {
      signals = signals.filter(function (s) { return s.cue !== 'black'; });
    }
    return signals.sort(function (a, b) { return a.at - b.at; });
  }

  /* ---------- dressing what was actually said --------------------
     The outfit builder only knows axes. Found in live testing: a card
     that said "left out, because you said so: colour" showed a green
     cardigan and a blue shirt, and someone who wrote "a leather
     jacket, heavy boots" got a beige trench and sneakers. So the Core
     passes over the built outfit, in order of what matters most:
       1. pieces the person named go in
       2. what they refused comes out — colour included
       3. the budget holds, whatever it costs 1 and 2
     Whatever cannot survive the budget is said on the card. */

  /* [pattern, label, category, which catalogue items count] */
  function nameIs(re) { return function (i) { return re.test(i.name); }; }
  var PIECES = [
    [/\bleather jacket\b|\bbiker\b/, 'leather jacket', 'outer', function (i) { return i.material === 'leather'; }],
    [/\btrench\b/, 'trench', 'outer', nameIs(/trench/i)],
    [/\bblazers?\b/, 'blazer', 'outer', nameIs(/blazer/i)],
    [/\bparkas?\b/, 'parka', 'outer', nameIs(/parka/i)],
    [/\bpuffer\b/, 'puffer', 'outer', nameIs(/puffer/i)],
    [/\bbombers?\b/, 'bomber', 'outer', nameIs(/bomber/i)],
    [/\b(denim|jean) jacket\b/, 'denim jacket', 'outer', nameIs(/denim jacket|trucker/i)],
    [/\bcardigans?\b/, 'cardigan', 'outer', nameIs(/cardigan/i)],
    [/\bcoats?\b/, 'coat', 'outer', nameIs(/coat/i)],
    [/\bhood(ie|ies|y)\b/, 'hoodie', 'top', nameIs(/hoodie/i)],
    [/\b(jumpers?|sweaters?|knitwear)\b/, 'jumper', 'top', nameIs(/jumper|knit|crew neck|roll neck/i)],
    [/\b(t-?shirts?|tees?)\b/, 't-shirt', 'top', nameIs(/\btee\b/i)],
    [/\b(button[- ](up|down)|oxford)\b|(?<!t-)\bshirts?\b/, 'shirt', 'top', nameIs(/shirt$/i)],
    [/\bcargos?\b/, 'cargo trousers', 'bottom', nameIs(/cargo/i)],
    [/\bjeans\b/, 'jeans', 'bottom', nameIs(/jeans/i)],
    [/\bcorduroy|\bcords\b/, 'corduroy', 'bottom', nameIs(/corduroy/i)],
    [/\b(chinos?|trousers|pants)\b/, 'trousers', 'bottom', nameIs(/trousers/i)],
    [/\bskirts?\b/, 'skirt', 'bottom', nameIs(/skirt/i)],
    [/\bjoggers?\b/, 'joggers', 'bottom', nameIs(/jogger/i)],
    [/\bshorts\b/, 'shorts', 'bottom', nameIs(/shorts/i)],
    [/\b(dresses|(a|my|the|slip|summer|maxi|midi|long|wrap|black) dress)\b/, 'dress', 'dress', function () { return true; }],
    [/\bdoc martens\b|\bdr\.? ?martens\b/, 'Doc Martens', 'shoes', function (i) { return /martens/i.test(i.brand); }],
    [/\bboots?\b/, 'boots', 'shoes', nameIs(/boot/i)],
    [/\bloafers?\b/, 'loafers', 'shoes', nameIs(/loafer/i)],
    [/\b(derb(y|ies)|brogues?)\b/, 'derbies', 'shoes', nameIs(/derby/i)],
    [/\b(sneakers?|trainers?|kicks)\b/, 'sneakers', 'shoes', nameIs(/sneaker|runner|trail shoe/i)],
    [/\bheels?\b/, 'heels', 'shoes', nameIs(/heel/i)],
    [/\bsandals?\b/, 'sandals', 'shoes', nameIs(/sandal/i)],
    [/\bcaps?\b/, 'cap', 'accessory', nameIs(/\bcap\b/i)],
    [/\bbeanies?\b/, 'beanie', 'accessory', nameIs(/beanie/i)],
    [/\b(scarf|scarves)\b/, 'scarf', 'accessory', nameIs(/scarf/i)],
    [/\bsunglasses\b/, 'sunglasses', 'accessory', nameIs(/sunglasses/i)]
  ];

  var NEUTRALS = ['black', 'white', 'grey', 'beige', 'brown'];
  var DARK = ['black', 'grey', 'white'];
  var OPTIONAL = { outer: 1, accessory: 1 };

  /* Colour words, by the catalogue's colour families. "Nothing black"
     bans a family the same way "never any colour" bans all of them. */
  var FAMILY_WORDS = {
    black: /\bblack\b/g, white: /\b(white|off[- ]white|cream|ecru)\b/g, grey: /\b(grey|gray)\b/g,
    beige: /\bbeige\b/g, brown: /\bbrown\b/g, blue: /\b(blue|navy)\b/g, green: /\b(green|olive|khaki)\b/g,
    red: /\b(red|burgundy)\b/g, pink: /\bpink\b/g, yellow: /\b(yellow|mustard)\b/g
  };
  var FAMILIES = Object.keys(FAMILY_WORDS);

  function readConstraints(text, signals) {
    var pins = [], refused = [], taken = {};
    PIECES.map(function (p) {
      var m = p[0].exec(text);
      if (!m) return null;
      var clause = clauseBefore(text, m.index);
      return { label: p[1], category: p[2], test: p[3], at: m.index,
        negated: NEGATOR.test(clause) && !UNNEGATED.test(clause) };
    }).filter(Boolean).sort(function (a, b) { return a.at - b.at; }).forEach(function (p) {
      if (p.negated) { refused.push(p); return; }
      /* one named piece per slot, the first one mentioned; a dress and a
         top or bottom cannot both be pinned */
      if (taken[p.category] || (p.category === 'dress' && (taken.top || taken.bottom)) ||
          ((p.category === 'top' || p.category === 'bottom') && taken.dress)) return;
      if (p.category !== 'accessory') taken[p.category] = true;
      pins.push(p);
    });

    function said(cue, negated) {
      return signals.some(function (s) { return s.cue === cue && s.negated === negated; });
    }
    var banned = FAMILIES.filter(function (f) {
      var re = FAMILY_WORDS[f], m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        var clause = clauseBefore(text, m.index);
        if (NEGATOR.test(clause) && !UNNEGATED.test(clause)) return true;
      }
      return false;
    });
    var noColour = said('colour', true) || said('bright', true);
    var dark = (said('black', false) || said('all black', false)) && banned.indexOf('black') === -1;
    var mode = said('all black', false) ? 'dark' : noColour ? (dark ? 'dark' : 'neutral') : null;
    var base = mode === 'dark' ? DARK : mode === 'neutral' ? NEUTRALS : FAMILIES;
    var colours = mode || banned.length ? base.filter(function (f) { return banned.indexOf(f) === -1; }) : null;
    return { pins: pins, refused: refused, colours: colours, mode: mode, banned: banned };
  }

  function dressFor(built, axes, c, budget) {
    var items = built.items.slice();
    function byMatch(a, b) { return SM.affinity(b, axes) - SM.affinity(a, axes) || a.price - b.price; }
    function allowed(i) {
      if (c.colours && c.colours.indexOf(i.family) === -1) return false;
      return !c.refused.some(function (p) { return p.category === i.category && p.test(i); });
    }
    function pinFor(category) {
      return category === 'accessory' ? null : c.pins.filter(function (p) { return p.category === category; })[0];
    }
    function honoursPin(i) { var p = pinFor(i.category); return !p || p.test(i); }
    function named(i) { return c.pins.some(function (p) { return p.category === i.category && p.test(i); }); }
    function sum() { return items.reduce(function (a, i) { return a + i.price; }, 0); }
    function has(category) { return items.some(function (i) { return i.category === category; }); }

    /* The best piece for a slot, loosening one rule at a time: the
       named kind in an allowed colour, the named kind, any allowed
       piece, anything. */
    function choose(category, maxPrice, pin) {
      var pool = SM.CATALOG.byCategory(category).filter(function (i) {
        return (maxPrice === undefined || i.price <= maxPrice) && items.indexOf(i) === -1;
      });
      var tiers = [
        pool.filter(function (i) { return (!pin || pin.test(i)) && allowed(i); }),
        pin ? pool.filter(function (i) { return pin.test(i); }) : [],
        pool.filter(allowed),
        pool
      ];
      for (var t = 0; t < tiers.length; t++) if (tiers[t].length) return tiers[t].sort(byMatch)[0];
      return null;
    }

    /* A dress nobody asked for, under a colour rule, becomes a top and a
       bottom: the catalogue has two neutral dresses, at €650 and €790,
       and dozens of neutral separates. */
    if (c.colours && has('dress') && !c.pins.some(function (p) { return p.category === 'dress'; })) {
      items = items.filter(function (i) { return i.category !== 'dress'; });
      ['top', 'bottom'].forEach(function (k) { if (!has(k)) items.push(choose(k, undefined, pinFor(k))); });
    }

    /* 1. named pieces go in */
    c.pins.forEach(function (p) {
      if (items.some(function (i) { return i.category === p.category && p.test(i); })) return;
      if (p.category === 'dress') items = items.filter(function (i) { return i.category !== 'top' && i.category !== 'bottom'; });
      if ((p.category === 'top' || p.category === 'bottom') && has('dress')) {
        items = items.filter(function (i) { return i.category !== 'dress'; });
        var other = p.category === 'top' ? 'bottom' : 'top';
        if (!has(other)) items.push(choose(other, undefined, pinFor(other)));
      }
      if (p.category !== 'accessory') items = items.filter(function (i) { return i.category !== p.category; });
      var piece = choose(p.category, undefined, p);
      if (piece) items.push(piece);
    });

    /* 2. refusals come out, colour included */
    items = items.map(function (i) {
      if (allowed(i) && honoursPin(i)) return i;
      var keep = items.indexOf(i);
      items[keep] = null;                       // free the slot so choose() can reuse the category
      var next = choose(i.category, undefined, pinFor(i.category)) || i;
      items[keep] = next;
      return next;
    });

    /* 3. the budget holds */
    if (budget && sum() > budget) {
      items.filter(function (i) { return OPTIONAL[i.category]; })
        .sort(function (a, b) { return (named(a) - named(b)) || b.price - a.price; })
        .forEach(function (i) { if (sum() > budget) items.splice(items.indexOf(i), 1); });

      /* Pieces nobody named are cut down first. When nothing fits the
         room left, the cheapest piece that still respects what was
         refused — each pass frees room for the next. Only if three
         passes cannot make it fit does the budget overrule a refusal:
         at €150 the cheapest shoe in the catalogue is a boot, but
         someone who hates boots can still get €143 without one. */
      function cheapest(category, strict) {
        return SM.CATALOG.byCategory(category).filter(function (x) { return items.indexOf(x) === -1 && (!strict || allowed(x)); })
          .sort(function (a, b) { return a.price - b.price; })[0];
      }
      for (var pass = 0; pass < 4 && sum() > budget; pass++) {
        var strict = pass < 3;
        items.slice().sort(function (a, b) { return (named(a) - named(b)) || b.price - a.price; }).forEach(function (i) {
          if (sum() <= budget) return;
          var at = items.indexOf(i);
          var room = budget - (sum() - i.price);
          items[at] = null;
          var next = choose(i.category, room, pinFor(i.category));
          if (next && strict && !allowed(next) && allowed(i)) next = null;
          next = next || cheapest(i.category, strict) || cheapest(i.category, false);
          items[at] = next && next.price < i.price ? next : i;
        });
      }

      /* spend what is left on a better match, never breaking 1 or 2 */
      items.slice().sort(function (a, b) { return SM.affinity(a, axes) - SM.affinity(b, axes); }).forEach(function (i) {
        var at = items.indexOf(i);
        var room = budget - (sum() - i.price);
        items[at] = null;
        var better = choose(i.category, room, pinFor(i.category));
        var ok = better && SM.affinity(better, axes) > SM.affinity(i, axes) &&
          (!allowed(i) || allowed(better)) && (!named(i) || named(better));
        items[at] = ok ? better : i;
      });
    }

    var outfit = SM.stylist.wrap(items.filter(Boolean), { axes: axes });
    outfit.named = c.pins.filter(function (p) {
      return outfit.items.some(function (i) { return i.category === p.category && p.test(i); });
    });
    outfit.missed = c.pins.filter(function (p) { return outfit.named.indexOf(p) === -1; });
    outfit.colours = c.colours;
    outfit.mode = c.mode;
    outfit.banned = c.banned;
    outfit.offColour = c.colours ? outfit.items.filter(function (i) { return c.colours.indexOf(i.family) === -1; }) : [];
    return outfit;
  }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  function extract(input) {
    var raw = String(input.text || '');
    var text = raw.trim();
    if (text.length < MIN_CHARS) return { error: 'short', min: MIN_CHARS, length: text.length };
    if (text.length > MAX_CHARS) return { error: 'long', max: MAX_CHARS, length: text.length };

    var lower = text.toLowerCase().replace(/[’‘]/g, "'");
    var signals = readSignals(lower);
    if (!signals.length) return { error: 'nosignal' };

    var occasion = OCCASIONS[input.occasion] ? input.occasion : 'everyday';
    var budget = BUDGETS.indexOf(input.budget) !== -1 ? input.budget : null;

    var sums = {};
    SM.AXIS_KEYS.forEach(function (k) { sums[k] = 0; });
    signals.forEach(function (s) {
      s.axes.forEach(function (k) {
        sums[k] += s.negated ? -NEGATED_FACTOR * s.weights[k] : s.weights[k];
      });
    });
    var prior = OCCASIONS[occasion].prior;
    Object.keys(prior).forEach(function (k) { sums[k] += prior[k]; });
    SM.AXIS_KEYS.forEach(function (k) { sums[k] = Math.max(0, sums[k]); });

    var positives = signals.filter(function (s) { return !s.negated; });
    if (!positives.length) return { error: 'onlynegative', signals: signals };

    var axes = SM.normaliseAxes(sums);
    var top = SM.topAxes(axes, 3);
    var archetype = SM.archetype(axes);
    var explore = SM.explorationAxes(axes).slice(0, 2);

    /* The outfit comes from the Week 0 engine, seeded by the input so
       the same words always dress the same way. */
    var seed = 'core:' + hash(lower + '|' + occasion + '|' + budget);
    var constraints = readConstraints(lower, signals);
    var filters = SM.emptyFilters();
    filters.budgetTotal = budget;
    if (constraints.colours) filters.colours = constraints.colours.slice();
    var outfit = dressFor(SM.stylist.build({ axes: axes, seed: seed }, filters, seed), axes, constraints, budget);

    var distinct = positives.length + (signals.length - positives.length) * 0.5;
    var confidence = distinct >= 6 ? 'high' : distinct >= 3 ? 'medium' : 'low';

    return {
      engine: ENGINE,
      input: { text: text, occasion: occasion, budget: budget, label: String(input.label || '').trim().slice(0, 40) },
      axes: axes,
      top: top,
      archetype: archetype,
      signals: signals,
      explore: explore,
      outfit: outfit,
      thesis: thesis(archetype, top, signals, occasion, budget, outfit),
      confidence: confidence
    };
  }

  function thesis(archetype, top, signals, occasion, budget, outfit) {
    var A = SM.AXES;
    var parts = [archetype.name + ' ' + OCCASIONS[occasion].phrase + ': built on ' +
      A[top[0]].label + ' — ' + A[top[0]].note + ' — and ' + A[top[1]].label + ' — ' + A[top[1]].note + '.'];

    var refused = signals.filter(function (s) { return s.negated; }).map(function (s) { return s.word; });
    /* Only claim the colour rule held if it did. */
    if (refused.length) parts.push('Left out, because you said so: ' + refused.join(', ') + '.');
    /* A banned colour already reads as "left out"; it only needs its own
       sentence when the budget forced an exception. */
    if (outfit.colours && (outfit.mode || outfit.offColour.length)) {
      var rule = outfit.mode
        ? 'Kept to ' + (outfit.mode === 'dark' ? 'black, grey and white' : 'neutrals') +
          (outfit.banned.length ? ', without ' + outfit.banned.join(' or ') : '')
        : 'Nothing in ' + outfit.banned.join(' or ');
      var off = outfit.offColour.map(function (i) { return i.name.toLowerCase(); });
      parts.push(rule + (off.length
        ? ' where the budget allows — the ' + off.join(' and ') + (off.length > 1 ? ' are' : ' is') + ' the exception'
        : '') + '.');
    }

    /* The piece to start from is one they named, if any survived. */
    var namedItems = outfit.items.filter(function (i) {
      return outfit.named.some(function (p) { return p.category === i.category && p.test(i); });
    });
    if (namedItems.length) {
      parts.push('Built around what you named: ' + namedItems.map(function (i) {
        return 'the ' + i.name.toLowerCase() + ' from ' + i.brand;
      }).join(' and ') + '.');
    } else {
      var key = ['outer', 'dress', 'top'].map(function (c) {
        return outfit.items.filter(function (i) { return i.category === c; })[0];
      }).filter(Boolean)[0] || outfit.items[0];
      if (key) parts.push('Start with the ' + key.name.toLowerCase() + ' from ' + key.brand + ' and build out from it.');
    }
    if (outfit.missed.length) {
      parts.push('Not in the catalogue' + (budget ? ' within your budget' : '') + ': ' +
        outfit.missed.map(function (p) { return p.label; }).join(', ') + '.');
    }
    if (budget) {
      parts.push(outfit.total <= budget
        ? 'The whole outfit comes to ' + SM.ui.price(outfit.total) + ', inside your ' + SM.ui.price(budget) + '.'
        : 'Even stripped back, this look comes to ' + SM.ui.price(outfit.total) + ' — over your ' + SM.ui.price(budget) + '.');
    }
    return parts.join(' ');
  }

  /* ---------- the row that goes to Supabase --------------------- */
  function toRow(core) {
    return {
      label: core.input.label || null,
      input_text: core.input.text,
      occasion: core.input.occasion,
      budget: core.input.budget,
      archetype: core.archetype.name,
      axes: core.axes,
      top_axes: core.top.map(function (k) { return { axis: k, score: core.axes[k] }; }),
      signals: core.signals.map(function (s) { return { cue: s.cue, word: s.word, axes: s.axes, negated: s.negated }; }),
      thesis: core.thesis,
      key_pieces: core.outfit.items.map(function (i) {
        return { id: i.id, name: i.name, brand: i.brand, category: i.category, price: i.price };
      }),
      confidence: core.confidence,
      engine: core.engine
    };
  }

  /* ---------- the prompt a model would receive -----------------
     Prompt library entry #1, shown on /docs and kept in
     docs/prompt-library.md. The rules above are this prompt, carried
     out by hand. Products are never part of the model's job: the
     catalogue engine picks them from the axes, so nothing invented
     can end up on the card. */
  var PROMPT = {
    id: 'style-core-extract',
    version: 'v1',
    /* One line per paragraph: the page wraps them, hard breaks would
       wrap twice. */
    system: [
      'You are the Style Core extractor for Style Me. You read how a person describes the way they dress — or would like to — and return their Style Core as JSON. You do not flatter, you do not invent anything the text does not say, and you never guess when the text says nothing about clothes.',
      '',
      'The ten axes, each scored 0–100 relative to the strongest: minimal, street, classic, romantic, edgy, sporty, utility, retro, colour, avantGarde.',
      '',
      'Rules:',
      '1. Count only words about clothes, fabrics, colours, shoes, brands, or places and habits of dress. Quote each one exactly as written.',
      '2. A refused cue ("I never wear colour", "without looking like a banker") lowers its axis. Mark it negated.',
      '3. The occasion nudges and never decides: at most 3 points before normalising.',
      '4. No cue at all: return {"error": "nosignal"}. Every cue negated: return {"error": "onlynegative"}. Never fall back to a default archetype.',
      '5. Name the archetype from the two strongest axes, using the Style Me list.',
      '6. The thesis is at most three sentences: what the core is built on, what was left out because the person said so, and where to start.',
      '7. List the pieces the person names ("a leather jacket", "my Doc Martens") and the colours they refuse. They are constraints on the outfit, not style signals only.'
    ].join('\n'),
    user: [
      'Description: {{text}}',
      'Occasion: {{occasion}}   (everyday | work | night | weekend)',
      'Budget for one outfit: {{budget}} EUR, or none',
      '',
      'Return only JSON:',
      '{',
      '  "axes": { "minimal": 0-100, … all ten },',
      '  "signals": [{ "word": "…", "axis": "…", "negated": false }],',
      '  "archetype": "…",',
      '  "thesis": "…",',
      '  "explore": ["axis", "axis"],',
      '  "named": ["…"],',
      '  "refusedColours": ["…"],',
      '  "confidence": "low" | "medium" | "high"',
      '}'
    ].join('\n')
  };

  SM.core = {
    PROMPT: PROMPT,
    ENGINE: ENGINE,
    MIN_CHARS: MIN_CHARS,
    MAX_CHARS: MAX_CHARS,
    OCCASIONS: OCCASIONS,
    BUDGETS: BUDGETS,
    extract: extract,
    toRow: toRow,
    cueCount: CUES.length
  };
})(window.SM);
