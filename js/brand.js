/* ============================================================
   STYLE ME — brand.js

   The brand system, read from the stylesheet rather than typed
   out again. Every swatch asks the document what
   `--klein` currently is; change the variable in css/app.css and
   this page changes with it.

   A brand page that keeps its own copy of the colours is wrong
   within a week, and nobody notices until a screenshot is taken
   for a deck.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var COLOURS = [
    { v: '--ink', name: 'Ink', use: 'The ground. Everything else sits on it.' },
    { v: '--ink-1', name: 'Ink raised', use: 'Cards and panels, one step off the ground.' },
    { v: '--bone', name: 'Bone', use: 'Text. Never pure white: it glares on a phone at night.' },
    { v: '--bone-2', name: 'Bone dim', use: 'Secondary text and long reading.' },
    { v: '--ash', name: 'Ash', use: 'Labels, units, captions.' },
    { v: '--klein', name: 'Klein', use: 'The one action colour. Used once per screen, deliberately.' },
    { v: '--klein-2', name: 'Klein light', use: 'Focus rings, active bars, the lit state.' },
    { v: '--flame', name: 'Flame', use: 'Warnings, refusals, and anything marked as a guess.' },
    { v: '--paper', name: 'Paper', use: 'The ground behind a drawn garment, never behind text.' }
  ];

  var TYPE = [
    { v: '--display', name: 'Display', sample: 'Know what suits you', use: 'Headlines and figures. Tight tracking, heavy weight.' },
    { v: '--ui', name: 'Interface', sample: 'Describe how you dress in one sentence', use: 'Everything a person reads in sentences.' },
    { v: '--mono', name: 'Mono', sample: '28% · AMVO 2026 · checked 2026-10-20', use: 'Numbers, sources, dates. Anything that must be checkable.' }
  ];

  /* The voice rules are the ones this project has actually been
     following for four weeks, written down rather than invented
     for the brand page. */
  var VOICE = [
    { rule: 'Say the number, then name the source.', why: 'Every figure on this site carries a link. Marketing copy does not get an exemption.' },
    { rule: 'Never promise a feeling.', why: '"Feel confident" is unfalsifiable. "28% of returns are fashion" is not.' },
    { rule: 'Say what is simulated.', why: 'The Style Core prints "rule-based, no language model" on its own card. The posts say the same.' },
    { rule: 'Do not sell what is planned.', why: 'Second-hand matching is the thing he reacted to and it does not exist. No post may imply it does.' },
    { rule: 'One call to action, and it costs one sentence.', why: 'He said he could not be bothered to install a style app. The ask has to be smaller than that.' }
  ];

  function readVar(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v || '').trim();
  }

  function colours() {
    return COLOURS.map(function (c) {
      return { variable: c.v, name: c.name, use: c.use, value: readVar(c.v) };
    });
  }

  function type() {
    return TYPE.map(function (t) {
      var stack = readVar(t.v);
      return {
        variable: t.v, name: t.name, sample: t.sample, use: t.use,
        stack: stack,
        family: (stack.split(',')[0] || '').replace(/['"]/g, '').trim()
      };
    });
  }

  function radii() {
    return ['--r-sm', '--r', '--r-lg'].map(function (v) {
      return { variable: v, value: readVar(v) };
    });
  }

  SM.brand = {
    colours: colours,
    type: type,
    radii: radii,
    voice: VOICE,
    readVar: readVar
  };
})(window.SM);
