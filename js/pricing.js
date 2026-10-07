/* ============================================================
   STYLE ME — pricing.js

   The revenue model. Pure functions, no DOM: the page calls them
   and so do the two pricing-logic tests, which is the point —
   arithmetic that can only be checked by clicking is arithmetic
   nobody checks.

   Three rules the tests enforce:
     · zero users, zero revenue, and no input can make it negative
     · consumer + brand equals the total, to the peso
     · a scenario may move a guess, never a sourced number
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  function data() { return SM.PRICING; }

  function inputById(id) {
    return data().inputs.filter(function (i) { return i.id === id; })[0] || null;
  }

  function assumption(id) {
    return data().assumptions.filter(function (a) { return a.id === id; })[0] || null;
  }

  function scenarioById(id) {
    return data().scenarios.filter(function (s) { return s.id === id; })[0] || data().scenarios[1];
  }

  /* Defaults straight from the dataset, so the page and the tests
     start from the same place. */
  function defaults() {
    var out = {};
    data().inputs.forEach(function (i) { out[i.id] = i.value; });
    return out;
  }

  /* Inputs are clamped rather than trusted: a negative user count
     is a typo, not a request for negative revenue. */
  function clamp(id, value) {
    var spec = inputById(id);
    var n = Number(value);
    if (!spec) return 0;
    if (!isFinite(n)) return spec.value;
    return Math.min(spec.max, Math.max(spec.min, n));
  }

  function normalise(inputs) {
    var out = {};
    data().inputs.forEach(function (i) {
      out[i.id] = clamp(i.id, inputs && inputs[i.id] !== undefined ? inputs[i.id] : i.value);
    });
    return out;
  }

  /* The scenario scales only the inputs marked scenario:true. A
     sourced assumption has no multiplier and cannot acquire one:
     `scenarioTouches` is what test L2 reads. */
  function scenarioTouches(scenarioId) {
    var m = scenarioById(scenarioId).multipliers;
    return Object.keys(m).filter(function (id) {
      var spec = inputById(id);
      return spec && spec.scenario;
    });
  }

  function applyScenario(inputs, scenarioId) {
    var m = scenarioById(scenarioId).multipliers;
    var out = {};
    Object.keys(inputs).forEach(function (id) {
      var spec = inputById(id);
      var factor = (spec && spec.scenario && m[id]) ? m[id] : 1;
      out[id] = clamp(id, inputs[id] * factor);
    });
    return out;
  }

  function round(n) { return Math.round(n); }

  /* ---------- the model ------------------------------------------
     Monthly first, annual from it. The only annual difference is the
     brand prepay discount, which is an estimate, stated in the
     assumptions table and applied to the subscription line alone. */
  function compute(rawInputs, scenarioId) {
    var entered = normalise(rawInputs);
    var i = applyScenario(entered, scenarioId);
    var discount = assumption('a-annual-discount').value / 100;

    var lookbooks = i.mau * (i.lookbookRate / 100);
    var styledRevenue = lookbooks * i.lookbookPrice;
    var stylistCost = lookbooks * i.stylistPay;

    var brandSubs = i.brands * i.brandFee;
    var ordersInfluenced = i.brands * i.ordersPerBrand;
    var returnsAvoided = ordersInfluenced * (i.pointsAvoided / 100);
    var savedForBrands = returnsAvoided * i.returnCost;
    var keptOrderRevenue = savedForBrands * (i.takeRate / 100);

    var personMonthly = styledRevenue;
    var brandMonthly = brandSubs + keptOrderRevenue;
    var mrr = personMonthly + brandMonthly;

    var personAnnual = styledRevenue * 12;
    var brandAnnual = (brandSubs * 12 * (1 - discount)) + (keptOrderRevenue * 12);
    var arr = personAnnual + brandAnnual;

    var cogsMonthly = stylistCost;
    var grossMonthly = mrr - cogsMonthly;

    return {
      scenario: scenarioById(scenarioId).id,
      version: data().version,
      entered: entered,
      effective: i,
      lines: [
        { id: 'styled', label: 'Styled lookbooks', segment: 'person', monthly: round(styledRevenue), annual: round(personAnnual), detail: round(lookbooks) + ' lookbooks a month' },
        { id: 'stylist', label: 'Paid to stylists', segment: 'person', monthly: -round(stylistCost), annual: -round(stylistCost * 12), detail: 'the only cost of goods in the model', cost: true },
        { id: 'subs', label: 'Brand subscriptions', segment: 'brand', monthly: round(brandSubs), annual: round(brandSubs * 12 * (1 - discount)), detail: i.brands + ' brands, ' + (discount * 100) + '% off annual prepay' },
        { id: 'kept', label: 'Share of returns avoided', segment: 'brand', monthly: round(keptOrderRevenue), annual: round(keptOrderRevenue * 12), detail: i.takeRate > 0 ? round(returnsAvoided) + ' returns avoided a month' : 'off by default — no brand has agreed to it' }
      ],
      bySegment: { person: round(personMonthly), brand: round(brandMonthly) },
      mrr: round(mrr),
      arr: round(arr),
      cogsMonthly: round(cogsMonthly),
      grossMonthly: round(grossMonthly),
      margin: mrr > 0 ? Math.round((grossMonthly / mrr) * 1000) / 10 : 0,
      ordersInfluenced: round(ordersInfluenced),
      returnsAvoided: round(returnsAvoided),
      savedForBrands: round(savedForBrands),
      lookbooks: round(lookbooks)
    };
  }

  /* ---------- the sanity check the interview earns ---------------
     The Styled price has to sit under what a real person said they
     would walk away from. Converted at the stated, dated rate. */
  function priceCheck(inputs) {
    var i = normalise(inputs);
    var walkAway = assumption('a-walkaway');
    var fx = assumption('a-fx-eur');
    var limitMxn = walkAway.value * fx.value;
    return {
      price: i.lookbookPrice,
      limitMxn: Math.round(limitMxn),
      ok: i.lookbookPrice <= limitMxn,
      share: Math.round((i.lookbookPrice / limitMxn) * 1000) / 10,
      ofMinWage: Math.round((i.lookbookPrice / assumption('a-minwage').value) * 1000) / 10
    };
  }

  /* ---------- assumptions, per scenario ---------------------------
     Returns every assumption with the value that scenario uses. A
     sourced row is returned unchanged by construction: nothing here
     consults the multipliers for it. */
  function assumptionsFor(scenarioId) {
    var m = scenarioById(scenarioId).multipliers;
    return data().assumptions.map(function (a) {
      var input = data().inputs.filter(function (i) { return i.basedOn === a.id; })[0];
      var moved = !!(input && input.scenario && m[input.id] && m[input.id] !== 1);
      return {
        id: a.id, label: a.label, unit: a.unit, kind: a.kind,
        value: a.value,
        scenarioValue: moved ? Math.round(a.value * m[input.id] * 100) / 100 : a.value,
        moved: moved,
        source: a.source, sourceName: a.sourceName, sourceKind: a.sourceKind,
        checked: a.checked, note: a.note
      };
    });
  }

  function sources() {
    return data().assumptions.filter(function (a) { return a.source; }).map(function (a) {
      return { id: a.id, url: a.source, name: a.sourceName, kind: a.sourceKind || 'web' };
    });
  }

  /* ---------- validation and the saved row ------------------------ */
  function validate(form) {
    var errors = [];
    var label = String(form.label || '').trim();
    if (label.length > 60) errors.push({ field: 'label', message: 'The name is over 60 characters.' });
    if (String(form.note || '').length > 1200) errors.push({ field: 'note', message: 'The note is over 1200 characters.' });
    if (data().scenarios.filter(function (s) { return s.id === form.scenario; }).length === 0) {
      errors.push({ field: 'scenario', message: 'Pick a scenario.' });
    }
    return errors;
  }

  function toRecord(form, result) {
    return {
      label: String(form.label || '').trim() || null,
      scenario: result.scenario,
      inputs: result.entered,
      outputs: {
        mrr: result.mrr, arr: result.arr, margin: result.margin,
        bySegment: result.bySegment,
        lines: result.lines.map(function (l) { return { id: l.id, monthly: l.monthly, annual: l.annual }; })
      },
      mrr_mxn: result.mrr,
      arr_mxn: result.arr,
      assumptions_version: data().version,
      note: String(form.note || '').trim() || null
    };
  }

  SM.pricing = {
    defaults: defaults,
    clamp: clamp,
    normalise: normalise,
    applyScenario: applyScenario,
    scenarioTouches: scenarioTouches,
    compute: compute,
    priceCheck: priceCheck,
    assumptionsFor: assumptionsFor,
    sources: sources,
    validate: validate,
    toRecord: toRecord,
    inputById: inputById,
    assumption: assumption
  };
})(window.SM);
