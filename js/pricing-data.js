/* ============================================================
   STYLE ME — pricing-data.js

   Week 3. Three tiers, two segments, the feature map, and every
   assumption the revenue model rests on.

   Two rules hold this file together, and both are tested:

   1. Every assumption says what kind it is — `sourced` (with a
      link and a date), `estimate` (derived, with the derivation
      written down), or `guess` (a number someone picked). A model
      whose inputs all look equally solid is a sales deck.

   2. The scenario toggle may only move `guess` and `estimate`
      values. A sourced number is the same in every scenario,
      because optimism is not a research method.

   Prices are in Mexican pesos. Sources that published in USD or
   EUR are quoted in their own currency with the rate stated.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var CHECKED = '2026-10-06';
  var VERSION = 'pricing-v1';

  /* ---------- the two segments ---------------------------------- */
  var SEGMENTS = [
    {
      id: 'person',
      name: 'The person getting dressed',
      who: '16–30, Mexico, phone first. Buys second-hand, compares prices, already knows roughly what they like.',
      pays: 'Almost nothing — and that is a finding, not a hope.',
      evidence: 'Week 2 validation conversation: “acheter moins cher et plus vite, 100 %” — cheaper and faster, 100%. Walk-away price for one outfit: €150.'
    },
    {
      id: 'brand',
      name: 'The brand or marketplace',
      who: 'Sells clothes online in Mexico, pays for traffic, and absorbs the return rate.',
      pays: 'For orders that are kept rather than returned.',
      evidence: 'Fashion is 28% of Mexican online returns (AMVO) and 19.3% of online orders come back (NRF). A return is the same mistake the Style Core tries to prevent, already measured in pesos.'
    }
  ];

  /* ---------- the three tiers ----------------------------------- */
  var TIERS = [
    {
      id: 'free',
      name: 'Free',
      segment: 'person',
      price: 0,
      unit: 'forever',
      line: 'Everything the product does on its own stays free.',
      why: 'The one person we interviewed will not pay for software, and pricing against that would be inventing a customer.',
      includes: ['Style Core — free text to a named style', 'Outfit feed and the layered renderer', 'Saved outfits and bag', 'The research desk']
    },
    {
      id: 'styled',
      name: 'Styled',
      segment: 'person',
      price: 249,
      unit: 'per lookbook — not a subscription',
      line: 'A human stylist builds you a lookbook, when you want one.',
      why: 'Indyx sells the same thing at $50 and it is the only consumer money in this category that is visibly working. Per lookbook, because a subscription is what the interview rejected.',
      includes: ['Everything in Free', 'A lookbook made by a person, not the engine', 'Pay once, keep it', 'No renewal, no card on file']
    },
    {
      id: 'brand',
      name: 'Brand',
      segment: 'brand',
      price: 4900,
      unit: 'per month, per catalogue',
      line: 'Your catalogue inside the engine, and a report on what got kept.',
      why: 'The segment that already counts returns in pesos. Priced per catalogue, with an optional share of the returns it avoids — off by default until a brand agrees to it.',
      includes: ['Catalogue in the outfit engine', 'Fit and returns reporting', 'Kept-not-returned measurement', 'Optional: a share of the returns avoided']
    }
  ];

  /* ---------- the feature map -----------------------------------
     `status` is the honest column: built means it runs today at the
     path given, planned means it does not exist yet. */
  var FEATURES = [
    { id: 'core', name: 'Style Core', what: 'Free text in, a named style and an outfit out.', tier: 'free', segment: 'person', status: 'built', where: '/core' },
    { id: 'feed', name: 'Outfit feed', what: 'Outfits built from your axes, endlessly.', tier: 'free', segment: 'person', status: 'built', where: '/feed' },
    { id: 'render', name: 'Layered SVG renderer', what: 'Every garment drawn in the browser; one piece swaps without the rest moving.', tier: 'free', segment: 'person', status: 'built', where: '/outfit' },
    { id: 'quiz', name: 'Twelve-question style test', what: 'The original way in: ten axes, a named archetype.', tier: 'free', segment: 'person', status: 'built', where: '/quiz' },
    { id: 'saved', name: 'Saved outfits and bag', what: 'Keep what you liked; local to the browser.', tier: 'free', segment: 'person', status: 'built', where: '/saved' },
    { id: 'research', name: 'Research desk', what: 'Twelve competitors, five benchmarks, eight risks, every claim sourced.', tier: 'free', segment: 'both', status: 'built', where: '/research' },
    { id: 'pricing', name: 'Pricing simulator', what: 'This page: the model, its assumptions, and what they are worth.', tier: 'free', segment: 'both', status: 'built', where: '/pricing' },
    { id: 'lookbook', name: 'Human lookbook', what: 'A stylist builds a set of looks around your core.', tier: 'styled', segment: 'person', status: 'planned', where: '—' },
    { id: 'wardrobe', name: 'Your own wardrobe', what: 'Photograph what you own and dress from it.', tier: 'styled', segment: 'person', status: 'planned', where: '—' },
    { id: 'catalogue', name: 'Brand catalogue feed', what: 'A real catalogue replaces the demo items.', tier: 'brand', segment: 'brand', status: 'planned', where: '—' },
    { id: 'returns', name: 'Returns reporting', what: 'Which recommended orders were kept, and which came back.', tier: 'brand', segment: 'brand', status: 'planned', where: '—' },
    { id: 'resale', name: 'Second-hand matching', what: 'The same look, found on GoTrendier instead of bought new.', tier: 'free', segment: 'person', status: 'planned', where: '—' }
  ];

  /* ---------- assumptions ---------------------------------------
     kind: sourced | estimate | guess. Only estimate and guess may
     move between scenarios — see SCENARIOS below. */
  var ASSUMPTIONS = [
    {
      id: 'a-returns-mx', label: 'Fashion share of Mexican online returns', value: 28, unit: '%',
      kind: 'sourced', checked: CHECKED,
      source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
      sourceName: 'AMVO, Estudio de Venta Online 2026',
      note: 'The highest of any category. This is why the brand segment exists.'
    },
    {
      id: 'a-returns-online', label: 'Share of online orders returned', value: 19.3, unit: '%',
      kind: 'sourced', checked: CHECKED,
      source: 'https://nrf.com/research/2025-retail-returns-landscape',
      sourceName: 'NRF, 2025 Retail Returns Landscape',
      note: '15.8% of all retail sales, $849.9bn; online runs higher. The baseline the model subtracts from.'
    },
    {
      id: 'a-minwage', label: 'Mexican minimum wage, 2026', value: 9582, unit: 'MX$/month',
      kind: 'sourced', checked: CHECKED,
      source: 'https://www.littler.com/news-analysis/asap/mexico-aumenta-el-salario-minimo-para-el-2026',
      sourceName: 'Littler, January 2026 (MX$315.04/day)',
      note: 'What a MX$249 lookbook costs someone: 2.6% of a minimum monthly wage.'
    },
    {
      id: 'a-indyx', label: 'Human lookbook, benchmark price', value: 50, unit: 'USD',
      kind: 'sourced', checked: CHECKED,
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx, own pricing',
      note: 'About MX$900. Styled is priced below it, for a market where the minimum wage is MX$9,582.'
    },
    {
      id: 'a-walkaway', label: 'Price at which the interviewee walks away', value: 150, unit: 'EUR per outfit',
      kind: 'sourced', checked: CHECKED,
      source: 'docs/week-2/validation-conversation.md', sourceKind: 'interview',
      sourceName: 'Week 2 validation conversation, 24 Sep 2026',
      note: '“Si je dois lâcher 150 balles pour ressembler à l’image, je passe mon tour.” About MX$3,040.'
    },
    {
      id: 'a-buyers', label: 'Digital buyers in Mexico', value: 77200000, unit: 'people',
      kind: 'sourced', checked: CHECKED,
      source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
      sourceName: 'AMVO, Estudio de Venta Online 2026',
      note: 'The ceiling, not a target. Nothing in this model assumes a share of it.'
    },
    {
      id: 'a-fx-eur', label: 'Exchange rate used', value: 20.3, unit: 'MX$ per EUR',
      kind: 'estimate', checked: CHECKED,
      source: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-mxn.es.html',
      sourceName: 'ECB reference rate, consulted 6 Oct 2026',
      note: 'Fixed on the date shown. There is no live FX in this page on purpose.'
    },
    {
      id: 'a-fx-usd', label: 'Exchange rate used', value: 18.1, unit: 'MX$ per USD',
      kind: 'estimate', checked: CHECKED,
      source: 'https://www.banxico.org.mx/tipcamb/main.do?page=tip&idioma=sp',
      sourceName: 'Banco de México, consulted 6 Oct 2026',
      note: 'Same: fixed, dated, not fetched.'
    },
    {
      id: 'a-stylist', label: 'Paid to the stylist per lookbook', value: 150, unit: 'MX$',
      kind: 'estimate', checked: CHECKED,
      note: 'Derived: about two hours at roughly double the minimum hourly wage (MX$315.04 ÷ 8h ≈ MX$39/h). The only cost of goods in the model.'
    },
    {
      id: 'a-return-cost', label: 'What one return costs a brand', value: 420, unit: 'MX$',
      kind: 'guess', checked: CHECKED,
      note: 'Industry writing puts an apparel return at $20–30 all-in, but every trail leads to content marketing rather than a primary study. Treated as a guess the user can move, never as a fact.'
    },
    {
      id: 'a-annual-discount', label: 'Annual prepay discount, brand tier', value: 10, unit: '%',
      kind: 'estimate', checked: CHECKED,
      note: 'The ordinary SaaS trade: two months off for paying up front. Applied to the brand subscription line only.'
    },
    {
      id: 'a-lookbook-rate', label: 'Users asking for a lookbook in a month', value: 1.2, unit: '%',
      kind: 'guess', checked: CHECKED,
      note: 'Nobody has been offered one yet. This is the number to attack first: the whole consumer line moves with it.'
    },
    {
      id: 'a-points-avoided', label: 'Return rate avoided on influenced orders', value: 3, unit: 'points of 19.3%',
      kind: 'guess', checked: CHECKED,
      note: 'The product\'s central claim, and completely unproven. Three points is a sixth of the baseline.'
    }
  ];

  /* ---------- calculator inputs ----------------------------------
     `scenario: true` marks an input the scenario toggle may scale.
     Every one of those traces back to a guess or an estimate. */
  var INPUTS = [
    { id: 'mau', segment: 'person', label: 'Monthly active users', value: 12000, min: 0, max: 300000, step: 500, unit: 'people', scenario: true, basedOn: null },
    { id: 'lookbookRate', segment: 'person', label: 'Ask for a lookbook each month', value: 1.2, min: 0, max: 20, step: 0.1, unit: '%', scenario: true, basedOn: 'a-lookbook-rate' },
    { id: 'lookbookPrice', segment: 'person', label: 'Price per lookbook', value: 249, min: 0, max: 3000, step: 10, unit: 'MX$', scenario: false, basedOn: 'a-indyx' },
    { id: 'stylistPay', segment: 'person', label: 'Paid to the stylist per lookbook', value: 150, min: 0, max: 3000, step: 10, unit: 'MX$', scenario: false, basedOn: 'a-stylist' },
    { id: 'brands', segment: 'brand', label: 'Partner brands', value: 6, min: 0, max: 200, step: 1, unit: 'brands', scenario: true, basedOn: null },
    { id: 'brandFee', segment: 'brand', label: 'Monthly fee per brand', value: 4900, min: 0, max: 100000, step: 100, unit: 'MX$', scenario: false, basedOn: null },
    { id: 'ordersPerBrand', segment: 'brand', label: 'Orders influenced per brand each month', value: 900, min: 0, max: 50000, step: 50, unit: 'orders', scenario: true, basedOn: null },
    { id: 'pointsAvoided', segment: 'brand', label: 'Return rate avoided', value: 3, min: 0, max: 19.3, step: 0.1, unit: 'points', scenario: true, basedOn: 'a-points-avoided' },
    { id: 'returnCost', segment: 'brand', label: 'What one return costs the brand', value: 420, min: 0, max: 3000, step: 10, unit: 'MX$', scenario: false, basedOn: 'a-return-cost' },
    { id: 'takeRate', segment: 'brand', label: 'Share of the saved money billed', value: 0, min: 0, max: 50, step: 1, unit: '%', scenario: false, basedOn: null, note: 'Off by default: no brand has agreed to this line.' }
  ];

  /* ---------- scenarios ------------------------------------------
     Multipliers apply to inputs marked scenario:true and to nothing
     else. There is no entry here for a sourced assumption, and a
     test checks that none appears. */
  var SCENARIOS = [
    {
      id: 'conservative', label: 'Conservative',
      line: 'Half the uptake, half the claim.',
      multipliers: { mau: 0.6, lookbookRate: 0.5, brands: 0.5, ordersPerBrand: 0.8, pointsAvoided: 0.5 }
    },
    {
      id: 'base', label: 'Base',
      line: 'The numbers as entered.',
      multipliers: { mau: 1, lookbookRate: 1, brands: 1, ordersPerBrand: 1, pointsAvoided: 1 }
    },
    {
      id: 'optimistic', label: 'Optimistic',
      line: 'Twice the uptake, and the claim holds.',
      multipliers: { mau: 1.8, lookbookRate: 2, brands: 2, ordersPerBrand: 1.3, pointsAvoided: 1.67 }
    }
  ];

  SM.PRICING = {
    version: VERSION,
    compiled: CHECKED,
    currency: 'MXN',
    segments: SEGMENTS,
    tiers: TIERS,
    features: FEATURES,
    assumptions: ASSUMPTIONS,
    inputs: INPUTS,
    scenarios: SCENARIOS
  };
})(window.SM);
