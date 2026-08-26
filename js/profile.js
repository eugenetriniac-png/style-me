/* ============================================================
   STYLE ME — profile.js

   The entry quiz. Deliberately almost nothing about clothes: how
   you wake up, what your flat looks like, what you notice in
   people. Those predict taste far better than asking someone what
   they think their style is.

   Every answer pushes one to three of the ten style axes.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  SM.QUESTIONS = [
    {
      id: 'q1', kicker: 'Mornings',
      q: 'Your alarm goes off. What happens?',
      options: [
        { t: 'I’m already up', w: { classic: 3, minimal: 2, sporty: 1 } },
        { t: 'Snooze ×4, then panic', w: { street: 3, sporty: 2 } },
        { t: 'I stay in bed with my phone', w: { romantic: 2, retro: 2, colour: 1 } },
        { t: 'I don’t use an alarm', w: { avantGarde: 3, edgy: 2 } }
      ]
    },
    {
      id: 'q2', kicker: 'Home',
      q: 'Your flat, seen from the front door:',
      options: [
        { t: 'White walls, three objects, a lot of space', w: { minimal: 4, avantGarde: 1 } },
        { t: 'Plants everywhere, wood, rugs', w: { romantic: 2, utility: 2, retro: 1 } },
        { t: 'Posters, records, a bit of mess', w: { retro: 3, street: 2, colour: 1 } },
        { t: 'Everything second hand, nothing matches', w: { avantGarde: 3, colour: 2, retro: 1 } }
      ]
    },
    {
      id: 'q3', kicker: 'Sound',
      q: 'What’s on repeat right now?',
      options: [
        { t: 'Rap and drill', w: { street: 4, sporty: 1 } },
        { t: 'Guitars, loud ones', w: { edgy: 3, retro: 2 } },
        { t: 'Minimal electronic, ambient', w: { minimal: 3, avantGarde: 2 } },
        { t: 'Pop, disco, eighties', w: { colour: 3, retro: 3 } },
        { t: 'Jazz, classical, film scores', w: { classic: 3, romantic: 2 } }
      ]
    },
    {
      id: 'q4', kicker: 'At the counter',
      q: 'What do you order without thinking?',
      options: [
        { t: 'An espresso, standing up', w: { classic: 2, minimal: 2, edgy: 1 } },
        { t: 'A flat white in a heavy mug', w: { minimal: 2, romantic: 2 } },
        { t: 'Something iced with syrup in it', w: { colour: 3, street: 1 } },
        { t: 'Tea, and I stay two hours', w: { romantic: 3, classic: 1 } },
        { t: 'A beer, and it’s 4pm', w: { retro: 2, utility: 2, street: 1 } }
      ]
    },
    {
      id: 'q5', kicker: 'Weekends',
      q: 'Saturday, 3pm. Where are you?',
      options: [
        { t: 'At a flea market', w: { retro: 4, avantGarde: 1 } },
        { t: 'Outside, walking or climbing', w: { utility: 4, sporty: 2 } },
        { t: 'In a gallery or a bookshop', w: { minimal: 2, avantGarde: 3 } },
        { t: 'At the court or the skatepark', w: { street: 4, sporty: 2 } },
        { t: 'At home, and it’s great', w: { minimal: 2, romantic: 2 } }
      ]
    },
    {
      id: 'q6', kicker: 'People',
      q: 'Meeting someone, what do you notice first?',
      options: [
        { t: 'Their shoes', w: { classic: 3, minimal: 2 } },
        { t: 'The way they walk', w: { street: 3, sporty: 1 } },
        { t: 'Their hands, their rings', w: { edgy: 2, romantic: 2, avantGarde: 1 } },
        { t: 'Their voice', w: { romantic: 3, classic: 1 } },
        { t: 'One odd detail nobody else sees', w: { avantGarde: 4 } }
      ]
    },
    {
      id: 'q7', kicker: 'Elsewhere',
      q: 'One-way ticket. You take:',
      options: [
        { t: 'Tokyo', w: { avantGarde: 3, street: 2, minimal: 1 } },
        { t: 'Copenhagen', w: { minimal: 4, classic: 1 } },
        { t: 'Marrakesh', w: { colour: 3, romantic: 2 } },
        { t: 'New York', w: { street: 3, classic: 2 } },
        { t: 'A hut in the Alps', w: { utility: 4, sporty: 2 } }
      ]
    },
    {
      id: 'q8', kicker: 'Touch',
      q: 'A material you want to put your hand on:',
      options: [
        { t: 'Raw wood', w: { utility: 3, retro: 1 } },
        { t: 'Velvet', w: { romantic: 3, retro: 2 } },
        { t: 'Cold metal', w: { edgy: 3, avantGarde: 2 } },
        { t: 'Crumpled linen', w: { minimal: 3, romantic: 1 } },
        { t: 'Leather that creaks', w: { edgy: 3, classic: 2 } }
      ]
    },
    {
      id: 'q9', kicker: 'Under pressure',
      q: 'Someone says "you can’t wear that". You:',
      options: [
        { t: 'Agree, and change', w: { classic: 3, minimal: 1 } },
        { t: 'Wear it twice as often', w: { edgy: 3, avantGarde: 3 } },
        { t: 'Genuinely ask why', w: { romantic: 2, minimal: 2 } },
        { t: 'Hadn’t noticed I was wearing it', w: { utility: 3, sporty: 2 } }
      ]
    },
    {
      id: 'q10', kicker: 'Three things',
      q: 'The building’s on fire. You grab:',
      options: [
        { t: 'My notebooks', w: { romantic: 3, avantGarde: 1 } },
        { t: 'My camera', w: { retro: 3, minimal: 1 } },
        { t: 'My favourite trainers', w: { street: 4, sporty: 1 } },
        { t: 'My grandfather’s watch', w: { classic: 4, retro: 1 } },
        { t: 'The bag I already packed', w: { utility: 4 } }
      ]
    },
    {
      id: 'q11', kicker: 'Colour',
      q: 'A room painted one single colour. Which?',
      options: [
        { t: 'Off white', w: { minimal: 4 } },
        { t: 'Matte black', w: { edgy: 4 } },
        { t: 'Forest green', w: { utility: 3, classic: 1 } },
        { t: 'Deep red', w: { colour: 4, romantic: 1 } },
        { t: 'Electric blue', w: { colour: 3, avantGarde: 2 } }
      ]
    },
    {
      id: 'q12', kicker: 'The wardrobe',
      q: 'Last question about clothes, promise. Yours is:',
      options: [
        { t: 'Sorted by colour', w: { minimal: 3, classic: 2 } },
        { t: 'Two piles: clean and nearly clean', w: { street: 3, sporty: 2 } },
        { t: 'Full of things I never wear', w: { colour: 2, romantic: 2, retro: 1 } },
        { t: 'Five of the same thing', w: { minimal: 3, edgy: 2, utility: 1 } }
      ]
    }
  ];

  /* ---------- scoring ------------------------------------------ */
  SM.scoreQuiz = function (answers) {
    var axes = {};
    SM.AXIS_KEYS.forEach(function (k) { axes[k] = 0; });
    SM.QUESTIONS.forEach(function (q) {
      var idx = answers[q.id];
      if (idx === undefined || idx === null) return;
      var opt = q.options[idx];
      if (!opt) return;
      Object.keys(opt.w).forEach(function (k) { axes[k] += opt.w[k]; });
    });
    return SM.normaliseAxes(axes);
  };

  /* Rescaled to 0–100 so the bars and the ranking share a scale. */
  SM.normaliseAxes = function (axes) {
    var max = 1;
    SM.AXIS_KEYS.forEach(function (k) { max = Math.max(max, axes[k] || 0); });
    var out = {};
    SM.AXIS_KEYS.forEach(function (k) { out[k] = Math.round(((axes[k] || 0) / max) * 100); });
    return out;
  };

  SM.topAxes = function (axes, n) {
    return SM.AXIS_KEYS.slice()
      .sort(function (a, b) { return (axes[b] || 0) - (axes[a] || 0); })
      .slice(0, n || 3);
  };

  /* ---------- archetypes ----------------------------------------
     Named from the two dominant axes. */
  var PAIRS = {
    'classic|minimal':    { name: 'Neo-classic', line: 'Few pieces, cut well. You replace rather than add.' },
    'edgy|minimal':       { name: 'Black Minimalism', line: 'A three-colour palette, two of which are black.' },
    'avantGarde|minimal': { name: 'Quiet Strange', line: 'Calm at first glance, one odd proportion at the second.' },
    'minimal|romantic':   { name: 'Soft Minimal', line: 'Fabrics that fall, colours that don’t shout.' },
    'minimal|utility':    { name: 'Functional Clean', line: 'Nothing spare, but everything has a pocket.' },
    'sporty|street':      { name: 'Athletic Street', line: 'Comfort first, wide silhouette, shoes that matter.' },
    'retro|street':       { name: 'Archive Street', line: 'You pull out pieces other people gave up on too early.' },
    'street|utility':     { name: 'Urban Utility', line: 'Heavy canvas, pockets, nothing afraid of rain.' },
    'colour|street':      { name: 'Loud Street', line: 'Colour is your main accessory.' },
    'edgy|street':        { name: 'Sharp Street', line: 'Wide volumes, hard materials, no compromise.' },
    'classic|retro':      { name: 'Period Classic', line: 'Cuts that existed before you and will outlast you.' },
    'classic|romantic':   { name: 'Tender Classic', line: 'Collars, drape, and a certain idea of getting dressed.' },
    'classic|utility':    { name: 'Field Classic', line: 'The trench — but the one that has actually been used.' },
    'colour|romantic':    { name: 'Saturated Romantic', line: 'Prints, movement, and never by halves.' },
    'retro|romantic':     { name: 'Vintage Romantic', line: 'You dress like a film photograph.' },
    'avantGarde|romantic':{ name: 'Deconstructed Romantic', line: 'The drape, deliberately in the wrong place.' },
    'avantGarde|edgy':    { name: 'Experimental Edge', line: 'Black, unexpected volume, and real pleasure in unsettling people.' },
    'edgy|retro':         { name: 'Archive Edge', line: 'Leather, boots, and a culture thirty years old.' },
    'sporty|utility':     { name: 'Techwear', line: 'Built to move, even when you’re standing still.' },
    'retro|sporty':       { name: 'Period Sport', line: 'Jerseys, tracksuits, and pitch-side colours.' },
    'retro|utility':      { name: 'Workwear', line: 'Work clothes worn by someone who doesn’t work in them.' },
    'avantGarde|colour':  { name: 'Colourist', line: 'You build outfits the way other people build paintings.' },
    'colour|retro':       { name: 'Archive Pop', line: 'Colours straight out of the seventies, fully owned.' }
  };

  var SOLO = {
    minimal:    { name: 'Minimal', line: 'Your strength is what you take away.' },
    street:     { name: 'Street', line: 'The clothes follow the movement, not the other way round.' },
    classic:    { name: 'Classic', line: 'You look for pieces that don’t date.' },
    romantic:   { name: 'Romantic', line: 'Fabric matters more than cut.' },
    edgy:       { name: 'Edgy', line: 'A silhouette that asks nobody’s permission.' },
    sporty:     { name: 'Sporty', line: 'Comfort, technical fabric, and real shoes.' },
    utility:    { name: 'Utility', line: 'Solid, practical, and good-looking because it works.' },
    retro:      { name: 'Retro', line: 'You raid decades the way other people raid wardrobes.' },
    colour:     { name: 'Colour', line: 'Colour is the starting point, not the finish.' },
    avantGarde: { name: 'Avant-garde', line: 'You care about proportion before anything else.' }
  };

  SM.archetype = function (axes) {
    var t = SM.topAxes(axes, 2);
    var key = [t[0], t[1]].sort().join('|');
    return PAIRS[key] || SOLO[t[0]] || SOLO.minimal;
  };

  /* Two directions worth exploring: neither what you already are
     nor what you clearly reject. */
  SM.explorationAxes = function (axes) {
    return SM.AXIS_KEYS.slice()
      .sort(function (a, b) { return (axes[b] || 0) - (axes[a] || 0); })
      .slice(3, 6);
  };
})(window.SM);
