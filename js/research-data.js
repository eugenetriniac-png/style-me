/* ============================================================
   STYLE ME — research-data.js

   The Week 2 dataset: who else solves this, what the numbers
   say, what is different in Mexico, and what could sink it.

   One rule holds this file together: **no claim without a
   source**. Every record carries the URL it came from, the name
   of that source, and the date the claim was checked. Where a
   figure only existed in a competitor's own marketing or in an
   SEO comparison page, it was left out rather than laundered —
   `note` says so when the source is an interested party.

   Static on purpose: a research page that silently re-fetches is
   a research page that silently goes wrong. Re-check the dates.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var CHECKED = '2026-09-23';

  /* ---------- 12 competitors and substitutes -------------------- */
  var COMPETITORS = [
    {
      id: 'whering',
      name: 'Whering',
      type: 'wardrobe-app',
      market: 'global',
      where: 'London · global',
      does: 'Digitise the clothes you own, then build and shuffle outfits from them. Resale integrations.',
      gap: 'You must photograph your whole wardrobe before it is useful. It styles what you own; it never tells you what you are.',
      figure: '10M users · $7M seed from eBay Ventures and Google AI Futures',
      source: 'https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/',
      sourceName: 'Tech.eu, July 2026',
      checked: CHECKED,
      tags: ['wardrobe', 'outfits', 'resale', 'sustainability', 'free']
    },
    {
      id: 'acloset',
      name: 'Acloset',
      type: 'wardrobe-app',
      market: 'global',
      where: 'South Korea · global',
      does: 'Wardrobe cataloguing with background removal, weather-based outfit suggestions, a community feed and a second-hand marketplace.',
      gap: 'Suggestions are driven by weather and what you already own, not by a stated identity. Its own category rivals rate the AI as the weak part.',
      figure: 'Free; AI outfit suggestions by weather',
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx comparison, 2026 — a competitor writing about a competitor',
      checked: CHECKED,
      note: 'A widely repeated "7M users" figure traces back only to SEO comparison pages, so it is not quoted here.',
      tags: ['wardrobe', 'weather', 'community', 'korea', 'free']
    },
    {
      id: 'indyx',
      name: 'Indyx',
      type: 'wardrobe-app',
      market: 'global',
      where: 'United States',
      does: 'Wardrobe analytics — gaps, redundancies, cost per wear — plus lookbooks put together by a real human stylist.',
      gap: 'The judgement people pay for is human and priced per lookbook. It does not scale to someone who cannot pay $50, which is most of the target user.',
      figure: 'Lookbooks styled by a human from $50',
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx, 2026 (own pricing)',
      checked: CHECKED,
      tags: ['wardrobe', 'human stylist', 'analytics', 'paid', 'cost per wear']
    },
    {
      id: 'cladwell',
      name: 'Cladwell',
      type: 'wardrobe-app',
      market: 'global',
      where: 'United States',
      does: 'Capsule-wardrobe method: pre-built capsules, daily outfit recommendations, an optional human stylist over text.',
      gap: 'Sells a method, not a diagnosis, and rents it monthly. Its AI layer is a general chatbot behind the scenes.',
      figure: '$7.99/month, or $49/month with a stylist',
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx comparison, 2026 — a competitor writing about a competitor',
      checked: CHECKED,
      tags: ['capsule', 'subscription', 'method', 'chatgpt', 'human stylist']
    },
    {
      id: 'save-your-wardrobe',
      name: 'Save Your Wardrobe',
      type: 'wardrobe-app',
      market: 'global',
      where: 'London · Europe',
      does: 'Digital wardrobe with outfit planning, plus matching to local repair, alteration and cleaning services.',
      gap: 'Aimed at keeping clothes alive, not at deciding what suits you. The services layer is city-by-city and absent in Mexico.',
      figure: 'Free; care and repair services layer',
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx comparison, 2026 — a competitor writing about a competitor',
      checked: CHECKED,
      tags: ['wardrobe', 'repair', 'circular', 'europe', 'free']
    },
    {
      id: 'stitch-fix',
      name: 'Stitch Fix',
      type: 'styling-service',
      market: 'global',
      where: 'United States, United Kingdom',
      does: 'A human stylist backed by algorithms picks clothes and ships them to you; you keep what you like.',
      gap: 'Styling only exists as a way to sell you a box, it is not offered in Mexico, and the model is shrinking: fewer clients each year, more money extracted from each.',
      figure: '2,307,000 active clients on 1 Nov 2025, down from 2,434,000 a year earlier — −5.2% — while revenue per client rose to $559',
      source: 'https://www.sec.gov/Archives/edgar/data/1576942/000162828025055606/sfix-20251101.htm',
      sourceName: 'Stitch Fix 10-Q filed with the SEC, quarter ended 1 Nov 2025',
      checked: CHECKED,
      tags: ['human stylist', 'subscription box', 'retention', 'public company']
    },
    {
      id: 'zalando',
      name: 'Zalando — Algorithmic Fashion Companion',
      type: 'retailer',
      market: 'global',
      where: 'Europe, 17 markets',
      does: 'Inside the shop: takes an item you looked at and completes the look, learning from outfits made by its own stylists and creators plus purchase data.',
      gap: 'Every recommendation must end in its own catalogue. It answers "what goes with this?", never "what suits me?" — and it does not operate in Mexico.',
      figure: 'Trained on stylist- and creator-made outfits; reported in 2018 to produce a "good outfit" about half the time and to lift basket size by 40%',
      source: 'https://corporate.zalando.com/en/company/how-zalando-helps-customers-make-perfect-fashion-choices',
      sourceName: 'Zalando Corporate (method); the 50% / 40% figures are S&P Global Market Intelligence, 2018, not Zalando',
      checked: CHECKED,
      tags: ['retailer', 'complete the look', 'recommender', 'europe']
    },
    {
      id: 'liverpool',
      name: 'Liverpool',
      type: 'retailer',
      market: 'mexico',
      where: 'Mexico',
      does: 'The department store Mexicans know best, with in-store advice, services and its own credit.',
      gap: 'Advice is a person in a shop, during opening hours, in the store\'s own stock. Nothing carries it home or across brands.',
      figure: '96% brand awareness in Mexico — the highest of any fashion retailer, ahead of Shein (93%)',
      source: 'https://www.merca20.com/quien-compra-ropa-en-shein-y-temu-este-es-el-perfil-de-sus-usuarios-en-mexico/',
      sourceName: 'Statista brand data via Merca2.0, January 2025',
      checked: CHECKED,
      tags: ['mexico', 'department store', 'in-store', 'personal shopper']
    },
    {
      id: 'gotrendier',
      name: 'GoTrendier',
      type: 'marketplace',
      market: 'mexico',
      where: 'Mexico (and Colombia)',
      does: 'Mexico\'s largest second-hand fashion marketplace: people sell clothes they no longer wear to people nearby.',
      gap: 'A search box over other people\'s wardrobes. Nothing tells a buyer whether a piece suits them, and its supply is one-of-a-kind, so outfit building is impossible.',
      figure: 'More than 9M registered users in Mexico (June 2026); transactions +4% in 2024, from 900k to 1M garments between January and October',
      source: 'https://mexicobusiness.news/ecommerce/news/second-hand-fashion-attract-73-mexicans-2025',
      sourceName: 'Mexico Business News, Dec 2024; user count from GoTrendier press coverage, June 2026',
      checked: CHECKED,
      tags: ['mexico', 'resale', 'second-hand', 'marketplace', 'circular']
    },
    {
      id: 'shein-temu',
      name: 'Shein and Temu',
      type: 'substitute',
      market: 'mexico',
      where: 'Global, dominant in Mexico',
      does: 'An effectively infinite catalogue at prices that make a mistake cost nothing. The default way under-30s in Mexico buy clothes.',
      gap: 'They make the problem worse, not better: infinite choice with zero guidance. Nothing there answers "does this suit me", and the answer to a bad buy is another bad buy.',
      figure: 'Shein 93% brand awareness in Mexico, 53% bought in the last 12 months; Temu 90% awareness, 35% bought',
      source: 'https://www.merca20.com/quien-compra-ropa-en-shein-y-temu-este-es-el-perfil-de-sus-usuarios-en-mexico/',
      sourceName: 'Statista brand data via Merca2.0, January 2025',
      checked: CHECKED,
      tags: ['mexico', 'fast fashion', 'substitute', 'price', 'gen z']
    },
    {
      id: 'creators',
      name: 'TikTok, Instagram and Pinterest',
      type: 'substitute',
      market: 'global',
      where: 'Global, heavily used in Mexico',
      does: 'Where people actually look for style: creators, get-ready-with-me videos, saved boards — free, endless, and social.',
      gap: 'Shows you what suits someone else. No memory of your body, your budget or what you already own, and TikTok Shop turns advice straight back into buying.',
      figure: 'Gen Z buying on Temu, Shein and TikTok Shop keeps accelerating in Mexico despite tariff pressure',
      source: 'https://expansion.mx/tecnologia/2026/06/05/jovenes-comprara-temu-y-shein-impulsan-industria-low-cost',
      sourceName: 'Expansión, June 2026',
      checked: CHECKED,
      tags: ['substitute', 'social', 'creators', 'free', 'gen z']
    },
    {
      id: 'friends',
      name: 'Asking a friend',
      type: 'substitute',
      market: 'mexico',
      where: 'Everywhere',
      does: 'A photo in a group chat before buying, or a friend whose taste you trust coming along to the shop.',
      gap: 'Free, trusted and instant — and completely unscalable. It is also the benchmark: anything this product says has to be at least as useful as a friend replying "no, not that one".',
      figure: 'Reported in this week\'s validation conversation — see the interview record',
      source: 'docs/week-2/validation-conversation.md',
      sourceName: 'Human validation conversation, Week 2',
      sourceKind: 'interview',
      checked: CHECKED,
      tags: ['substitute', 'free', 'social', 'benchmark', 'mexico']
    }
  ];

  /* ---------- 5 global benchmarks ------------------------------- */
  var BENCHMARKS = [
    {
      id: 'b-whering',
      name: 'Whering',
      place: 'London',
      figure: '10M',
      unit: 'users',
      what: 'Built a 10-million-user product on one premise: style the clothes you already own. eBay Ventures and Google\'s AI Futures Fund put $7M behind it in July 2026.',
      lesson: 'The premise is proven at scale, so Style Me does not have to prove it again. What it must avoid is Whering\'s toll gate: a wardrobe you have to photograph before anything works. The Style Core asks for a sentence instead.',
      source: 'https://tech.eu/2026/07/07/whering-lands-7m-as-digital-wardrobe-platform-reaches-10m-users/',
      sourceName: 'Tech.eu, July 2026',
      checked: CHECKED
    },
    {
      id: 'b-stitchfix',
      name: 'Stitch Fix',
      place: 'United States',
      figure: '−5.2%',
      unit: 'active clients, year on year',
      what: 'The best-funded attempt at algorithmic styling was down to 2,307,000 active clients on 1 November 2025 from 2,434,000 a year before, while revenue per remaining client rose to $559. Its own filing blames "challenges in acquiring and retaining active clients".',
      lesson: 'Styling is not an acquisition problem, it is a retention problem. A diagnosis is used once; a wardrobe is used weekly. Style Me has to be worth reopening, or it becomes a quiz people took once.',
      source: 'https://www.sec.gov/Archives/edgar/data/1576942/000162828025055606/sfix-20251101.htm',
      sourceName: 'Stitch Fix 10-Q, SEC, quarter ended 1 Nov 2025',
      checked: CHECKED
    },
    {
      id: 'b-zalando',
      name: 'Zalando',
      place: 'Europe',
      figure: 'AFC',
      unit: 'outfits from stylist data',
      what: 'Zalando\'s Algorithmic Fashion Companion learns from outfits its own stylists and creators built, then completes the look around something you viewed.',
      lesson: 'Seed the engine with real outfits rather than statistics about clicks. Style Me\'s catalogue tags and hand-written rules are the small version of that, and the honest label says so.',
      source: 'https://corporate.zalando.com/en/company/how-zalando-helps-customers-make-perfect-fashion-choices',
      sourceName: 'Zalando Corporate',
      checked: CHECKED
    },
    {
      id: 'b-indyx',
      name: 'Indyx',
      place: 'United States',
      figure: '$50',
      unit: 'per human-styled lookbook',
      what: 'A free wardrobe app whose paid tier is a lookbook made by a human stylist.',
      lesson: 'The willingness to pay sits on human judgement, not on software. If Style Me ever charges, it should be for something a person did — not for unlocking a filter.',
      source: 'https://www.myindyx.com/blog/the-best-wardrobe-apps',
      sourceName: 'Indyx (own pricing), 2026',
      checked: CHECKED
    },
    {
      id: 'b-amvo',
      name: 'AMVO — Mexican online retail',
      place: 'Mexico',
      figure: '28%',
      unit: 'of online returns are fashion',
      what: 'Fashion is both the most-bought online category in Mexico and the most returned one: 28% of returns, the highest of any category, in a market worth MX$941bn in 2025.',
      lesson: 'The money is already being spent and a quarter of it comes back. "What suits me" is not a soft question here — it is a returns-cost question, which is the version of it a brand will pay to fix.',
      source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
      sourceName: 'AMVO, Estudio de Venta Online 2026, via Marketing4eCommerce',
      checked: CHECKED
    }
  ];

  /* ---------- Mexico ------------------------------------------- */
  var MEXICO = [
    {
      id: 'mx-market',
      figure: 'MX$941bn',
      claim: 'Retail e-commerce in Mexico reached 941 billion pesos in 2025, up 19.2%, now 17.7% of all retail sales — eighth in the world, with 77.2 million digital buyers.',
      source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
      sourceName: 'AMVO, Estudio de Venta Online 2026',
      checked: CHECKED
    },
    {
      id: 'mx-fashion-first',
      figure: '6 in 10',
      claim: 'Six of every ten digital buyers bought fashion in the past year, and eight of ten of those mix online and physical shops. Fashion was the fastest-growing category, at 41.7%.',
      source: 'https://retailers.mx/moda-la-gran-protagonista-del-ecommerce-en-mexico/',
      sourceName: 'AMVO “Pulso: Moda en Venta Online”, via Retailers.mx',
      checked: CHECKED
    },
    {
      id: 'mx-returns',
      figure: '28%',
      claim: 'Fashion leads returns in Mexican e-commerce at 28%, ahead of car parts (12%) and toys (9%). Online is already 59% of fashion purchases.',
      source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
      sourceName: 'AMVO, Estudio de Venta Online 2026',
      checked: CHECKED
    },
    {
      id: 'mx-satisfaction',
      figure: '35%',
      claim: 'During HOT Fashion, more than 50% of digital buyers planned to buy clothing — against 32% for beauty and 24% for electronics — yet only 35% rated the experience "very satisfactory". High interest, low satisfaction.',
      source: 'https://blog.amvo.org.mx/blog/moda-en-ecommerce-2025-alto-inter%C3%A9s-baja-conversi%C3%B3n',
      sourceName: 'AMVO blog, 2025',
      checked: CHECKED
    },
    {
      id: 'mx-resale',
      figure: '73%',
      claim: 'GoTrendier projects that 73% of Mexican consumers will buy second-hand, and recorded a 4% rise in transactions in 2024 — from 900,000 to 1 million garments between January and October. Resale is mainstream here, not a niche.',
      source: 'https://mexicobusiness.news/ecommerce/news/second-hand-fashion-attract-73-mexicans-2025',
      sourceName: 'Mexico Business News, Dec 2024 (figure produced by GoTrendier)',
      checked: CHECKED
    },
    {
      id: 'mx-contradiction',
      figure: '65% vs 93%',
      claim: 'Research by Universidad Iberoamericana and Greenpeace finds 65% of Mexican consumers worry about fast fashion\'s footprint and 70% would pay more for ethically made clothes — in the same market where Shein has 93% brand awareness and 53% bought from it in the last year.',
      contradiction: true,
      source: 'https://mexicobusiness.news/ecommerce/news/second-hand-fashion-attract-73-mexicans-2025',
      sourceName: 'Ibero / Greenpeace via Mexico Business News, Dec 2024; Statista via Merca2.0, Jan 2025',
      checked: CHECKED
    },
    {
      id: 'mx-law',
      figure: '21 Mar 2025',
      claim: 'A new Federal Law on Protection of Personal Data Held by Private Parties came into force on 21 March 2025, moving oversight from INAI to the Secretaría Anticorrupción y Buen Gobierno. Anything personal this product stores falls under it.',
      source: 'https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares',
      sourceName: 'EY México',
      checked: CHECKED
    }
  ];

  /* ---------- 8 risks ------------------------------------------- */
  var RISKS = [
    {
      id: 'r-coldstart',
      name: 'Cold start',
      likelihood: 'high',
      impact: 'high',
      detail: 'Every wardrobe app hits the same wall: nobody photographs forty garments to try a product. Whering reached 10M users despite it, which proves the wall is survivable, not that it is small.',
      mitigation: 'The Style Core needs one sentence, no photos, no account. Wardrobe upload stays optional and late.'
    },
    {
      id: 'r-catalogue',
      name: 'Catalogue rights',
      likelihood: 'medium',
      impact: 'high',
      detail: 'Real brand names with invented prices and drawn garments are fine for a student demo and not fine for a product. Product data, imagery and price feeds are licensed, not scraped.',
      mitigation: 'Demo catalogue is labelled as such on /docs; buy buttons open a search on the brand\'s own site. A real catalogue means an affiliate feed with terms.'
    },
    {
      id: 'r-retention',
      name: 'Used once, then forgotten',
      likelihood: 'high',
      impact: 'medium',
      detail: 'A diagnosis is a one-off. Stitch Fix was down 5.2% of its clients year on year while earning more per client — the shape of a product people stop coming back to.',
      mitigation: 'Give a reason to reopen: saved cores, the feed, and later the wardrobe. Measure returning visits before adding features.'
    },
    {
      id: 'r-noimage',
      name: 'No image model',
      likelihood: 'high',
      impact: 'medium',
      detail: 'Everything is drawn in SVG, so garments read as illustration, not as the thing you would wear. Competitors show photographs.',
      mitigation: 'Lean into it: the drawing is what makes swapping one layer honest. Photography can be dropped into the existing images field per item.'
    },
    {
      id: 'r-money',
      name: 'Thin monetisation in Mexico',
      likelihood: 'medium',
      impact: 'medium',
      detail: 'The two platforms that dominate under-30 fashion buying here, Shein and Temu, are not places a small affiliate earns meaningfully, and Mexican resale is peer-to-peer.',
      mitigation: 'Do not design for affiliate revenue. The defensible paid layer, per Indyx, is human judgement — not unlocking software features.'
    },
    {
      id: 'r-trust',
      name: 'Trust in a labelled simulation',
      likelihood: 'medium',
      impact: 'medium',
      detail: 'The card says "simulated agent, rule-based". Honest, and it may read as "not real AI" to a user who came for AI.',
      mitigation: 'Show the reasoning — the words it read, in their own text. A visible reason beats a claimed model.'
    },
    {
      id: 'r-privacy',
      name: 'Personal data law',
      likelihood: 'low',
      impact: 'high',
      detail: 'Mexico\'s new data protection law took effect on 21 March 2025. Free text about yourself, photos and body measurements are personal data.',
      mitigation: 'Store as little as possible: no accounts, no names; the free text is insert-only and unreadable through the public key; photos never leave the browser.'
    },
    {
      id: 'r-infra',
      name: 'Free-tier infrastructure',
      likelihood: 'high',
      impact: 'low',
      detail: 'The Supabase project pauses after a week idle. It has paused twice, and each time the Save button would have failed for any visitor.',
      mitigation: 'The page degrades honestly instead of breaking, and the pause is documented. A paid tier is the fix when there are real users.'
    }
  ];

  var TYPES = [
    { id: 'wardrobe-app', label: 'Wardrobe app' },
    { id: 'styling-service', label: 'Styling service' },
    { id: 'retailer', label: 'Retailer' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'substitute', label: 'Substitute' }
  ];

  SM.RESEARCH = {
    compiled: CHECKED,
    competitors: COMPETITORS,
    benchmarks: BENCHMARKS,
    mexico: MEXICO,
    risks: RISKS,
    types: TYPES
  };
})(window.SM);
