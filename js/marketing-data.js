/* ============================================================
   STYLE ME — marketing-data.js

   Week 4. The persona, the landing copy, ten social posts,
   three video scripts, a fourteen-day calendar, and the two
   experiments.

   One rule, inherited from Weeks 2 and 3: nothing here is
   invented about a person. The persona is the student
   interviewed on 24 September 2026, in his own words; every line
   that is not his is marked as an inference drawn from what he
   said. The proof points on the landing page are the figures
   already carrying sources on /research.

   Lengths are not stored. They are counted from the text at
   render time, so a post cannot claim to be 96 characters while
   being 230.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var CHECKED = '2026-10-20';

  /* ---------- the persona, quoted ------------------------------- */
  var PERSONA = {
    who: 'A French student on exchange in Mexico City, early twenties',
    where: 'Interviewed in person, 24 September 2026 — see docs/week-2/validation-conversation.md',
    lines: [
      {
        kind: 'quote',
        fr: '« Relax et ample. Un jean large, un t-shirt basique oversize, une bonne paire de sneakers. »',
        en: '"Relaxed and loose. Wide jeans, a basic oversized tee, a good pair of sneakers."',
        implies: 'The copy never offers to find him a style. He has one, and he can say it in eight words. What he lacks is a way to act on it.'
      },
      {
        kind: 'quote',
        fr: '« Mon vrai problème tous les matins, c\'est pas l\'inspiration, c\'est mon budget. »',
        en: '"My real problem every morning isn\'t inspiration, it\'s my budget."',
        implies: 'Price belongs in the headline, not in the footer. Every post that leads with inspiration is written for somebody else.'
      },
      {
        kind: 'quote',
        fr: '« J\'utilise pas d\'appli dédiée au style, j\'ai la flemme. »',
        en: '"I don\'t use any style app, I can\'t be bothered."',
        implies: 'No post may end in "download". The call to action is one sentence typed into a page that needs no account.'
      },
      {
        kind: 'quote',
        fr: '« Une chemise un peu trop cintrée… je l\'ai mise dix minutes, je me trouvais ridicule. »',
        en: '"A shirt that was a bit too fitted… I wore it ten minutes, I thought I looked ridiculous."',
        implies: 'The strongest story we own, and it is his, not ours. It is the hook of the first post and the first video.'
      },
      {
        kind: 'quote',
        fr: '« Si ton site me trouve la même tenue sur Vinted pour 15 euros, là je signe. »',
        en: '"If your site finds me the same outfit on Vinted for €15, I\'m in."',
        implies: 'Second-hand is the promise he reacted to. It is planned, not built — so no post may claim it exists yet.'
      },
      {
        kind: 'inference',
        en: 'He is reachable on WhatsApp and TikTok, not on email or LinkedIn.',
        implies: 'The calendar weights WhatsApp and TikTok. Drawn from how he described asking friends — a snap to the group chat — not from a survey.'
      },
      {
        kind: 'inference',
        en: 'He will try something once, out of curiosity, and not come back unless it earned it.',
        implies: 'Measured as a risk on /research and confirmed in the same conversation. The campaign is judged on returning visits, which this week cannot yet measure.'
      }
    ]
  };

  /* ---------- the two experiments -------------------------------- */
  var EXPERIMENTS = [
    {
      id: 'headline',
      question: 'Does leading with money beat leading with identity?',
      variants: [
        { id: 'a', text: 'Know what suits you before you pay for it.', angle: 'money and regret — his stated problem' },
        { id: 'b', text: 'Your style already has a name. Here it is.', angle: 'identity — what the product technically does' }
      ]
    },
    {
      id: 'cta',
      question: 'Does naming the effort beat naming the reward?',
      variants: [
        { id: 'a', text: 'Describe your style — one sentence', angle: 'the effort, stated plainly' },
        { id: 'b', text: 'See what suits you — free, no account', angle: 'the reward and the absence of friction' }
      ]
    }
  ];

  /* ---------- landing page copy ---------------------------------- */
  var LANDING = {
    kicker: 'Style Me',
    sub: 'Describe how you dress in one sentence. Get a name for it, and outfits built from real pieces — not a mood board. No account, nothing stored about you.',
    proofs: [
      {
        figure: '28%',
        claim: 'of online returns in Mexico are fashion — the most returned category of all',
        source: 'https://marketing4ecommerce.mx/estudio-de-venta-online-2026-amvo-mexico/',
        sourceName: 'AMVO, Estudio de Venta Online 2026'
      },
      {
        figure: '19.3%',
        claim: 'of online orders come back anywhere in the world',
        source: 'https://nrf.com/research/2025-retail-returns-landscape',
        sourceName: 'NRF, 2025 Retail Returns Landscape'
      },
      {
        figure: 'Free',
        claim: 'no account, no card, no photo leaves your browser',
        source: '#/docs',
        sourceName: 'What is real and what is simulated, on /docs',
        internal: true
      }
    ],
    secondary: 'Or read the research it is built on — twelve competitors, every claim sourced.'
  };

  /* ---------- ten social posts ----------------------------------- */
  var POSTS = [
    {
      id: 'p1', channel: 'instagram', format: 'carousel', variant: 'a',
      body: 'He bought a shirt for one party. Wore it ten minutes at home, looked in the mirror, never put it on again. It is still in a wardrobe in Lille.\n\nThat shirt cost more than the app that would have told him. Style Me: one sentence about how you dress, and you get a name for it plus three outfits built from real pieces. Free, no account.'
    },
    {
      id: 'p2', channel: 'tiktok', format: 'caption', variant: 'a',
      body: 'POV: you already know your style. "Relaxed, wide jeans, a good pair of sneakers." You said it in eight words. So why is shopping still a guess? styleme → one sentence, three outfits.'
    },
    {
      id: 'p3', channel: 'whatsapp', format: 'share text', variant: 'b',
      body: 'remember that shirt you never wore? this names your style from one sentence and shows you outfits before you spend anything. 3 min, free, no sign-up →'
    },
    {
      id: 'p4', channel: 'x', format: 'post', variant: 'a',
      body: 'In Mexico, fashion is the most-returned category online: 28% of all returns (AMVO 2026). Every one of those is somebody who found out too late that it did not suit them. We built the thing that tells you first.'
    },
    {
      id: 'p5', channel: 'instagram', format: 'story', variant: 'b',
      body: 'Type one sentence: "mostly black, oversized, I live in my boots." Get: Black Minimalism, three outfits, and the reason for each. Swipe up — nothing to install.'
    },
    {
      id: 'p6', channel: 'tiktok', format: 'caption', variant: 'b',
      body: 'Your style already has a name. It is not "basic". Here is what the engine called mine after one sentence, and the three outfits it built around what I already own.'
    },
    {
      id: 'p7', channel: 'instagram', format: 'post', variant: 'a',
      body: 'Nothing on this app is a photograph. Every garment and every model is drawn in your browser, in SVG, as the page loads — which is why you can swap one piece and the rest of the silhouette stays exactly where it was.'
    },
    {
      id: 'p8', channel: 'x', format: 'post', variant: 'b',
      body: 'We asked one real person whether he wanted help choosing clothes. He said: "cheaper and faster, 100%." That answer contradicted our whole premise, so we published it on /research instead of burying it.'
    },
    {
      id: 'p9', channel: 'whatsapp', format: 'share text', variant: 'a',
      body: 'if you are about to buy something and you are not sure: paste how you dress into this, it tells you what your style is called and whether the piece fits it. free, 3 minutes, no account →'
    },
    {
      id: 'p10', channel: 'instagram', format: 'carousel', variant: 'b',
      body: 'Ten axes: minimal, street, classic, romantic, edgy, sporty, utility, retro, colour, avant-garde. One sentence from you places you on all ten. No quiz required, no photos uploaded, nothing kept.'
    }
  ];

  /* ---------- three video scripts --------------------------------- */
  var SCRIPTS = [
    {
      id: 's1', platform: 'tiktok', seconds: 45, title: 'The ten-minute shirt',
      beats: [
        { at: '0:00', shot: 'Hand pulling a shirt out of a wardrobe', line: 'This shirt was worn for ten minutes. Three years ago.' },
        { at: '0:05', shot: 'Mirror, half-turn, unconvinced face', line: 'It looked right in the shop and ridiculous at home.' },
        { at: '0:12', shot: 'Phone screen: typing one sentence into /core', line: 'So I typed how I actually dress into this. One sentence.' },
        { at: '0:22', shot: 'The card appearing: archetype, axes, the signals it read', line: 'It named it, and showed me the words it read to get there.' },
        { at: '0:33', shot: 'Three outfits, swapping one garment', line: 'Three outfits from real pieces. Swap one, the rest stays put.' },
        { at: '0:40', shot: 'URL on screen', line: 'Free, no account. The link is in the bio.' }
      ]
    },
    {
      id: 's2', platform: 'tiktok', seconds: 30, title: 'What the research says',
      beats: [
        { at: '0:00', shot: 'Screen recording of /research', line: 'Twenty-four claims on this page. Every one has a link.' },
        { at: '0:08', shot: 'Zoom on the 28% row', line: 'Fashion is the most returned thing bought online in Mexico.' },
        { at: '0:16', shot: 'Zoom on the row marked "awaiting interview"', line: 'And this row stayed empty until a real person had actually said it.' },
        { at: '0:24', shot: 'Homepage', line: 'That is the standard. Style Me.' }
      ]
    },
    {
      id: 's3', platform: 'instagram', seconds: 60, title: 'One sentence, ten axes',
      beats: [
        { at: '0:00', shot: 'Typing: "mostly black, oversized, I live in my Doc Martens, I never wear colour"', line: 'Watch what one sentence does.' },
        { at: '0:12', shot: 'The signals list highlighting each word', line: 'It reads your words — and the ones you refuse.' },
        { at: '0:25', shot: '"never colour" shown as a negative signal', line: '"Never colour" lowers colour. Most things would raise it.' },
        { at: '0:38', shot: 'The outfit: black, grey, the boots', line: 'So it dresses you in what you said, not in what is trending.' },
        { at: '0:50', shot: 'The simulated-agent label on the card', line: 'And it says on the card that it is rules, not a language model. Free.' }
      ]
    }
  ];

  /* ---------- fourteen-day calendar -------------------------------
     Weighted to WhatsApp and TikTok because that is where the person
     interviewed actually is. Two rest days, on purpose: a student
     posting daily for fourteen days is a plan that fails on day five. */
  var CALENDAR = [
    { day: 1, weekday: 'Mon', channel: 'instagram', asset: 'p1', note: 'The ten-minute shirt, as a carousel. Strongest story first.' },
    { day: 2, weekday: 'Tue', channel: 'whatsapp', asset: 'p3', note: 'Send to three group chats. No broadcast list.' },
    { day: 3, weekday: 'Wed', channel: 'tiktok', asset: 's1', note: 'The 45-second video. Film in one take.' },
    { day: 4, weekday: 'Thu', channel: 'instagram', asset: 'p5', note: 'Story with the typing shot from the video.' },
    { day: 5, weekday: 'Fri', channel: 'x', asset: 'p4', note: 'The returns figure, with the AMVO link.' },
    { day: 6, weekday: 'Sat', channel: 'none', asset: null, note: 'Rest day. Planned, not skipped.' },
    { day: 7, weekday: 'Sun', channel: 'none', asset: null, note: 'Read the A/B counts. Do not act on them yet.' },
    { day: 8, weekday: 'Mon', channel: 'instagram', asset: 'p7', note: 'Everything is drawn, nothing is photographed.' },
    { day: 9, weekday: 'Tue', channel: 'tiktok', asset: 's3', note: 'One sentence, ten axes. 60 seconds.' },
    { day: 10, weekday: 'Wed', channel: 'whatsapp', asset: 'p9', note: 'The before-you-buy framing, to the same chats.' },
    { day: 11, weekday: 'Thu', channel: 'instagram', asset: 'p10', note: 'The ten axes as a carousel.' },
    { day: 12, weekday: 'Fri', channel: 'x', asset: 'p8', note: 'The interview that contradicted us.' },
    { day: 13, weekday: 'Sat', channel: 'tiktok', asset: 's2', note: 'What the research says. 30 seconds.' },
    { day: 14, weekday: 'Sun', channel: 'none', asset: null, note: 'Read both experiments. Decide only if each arm has 100 impressions.' }
  ];

  SM.MARKETING = {
    compiled: CHECKED,
    persona: PERSONA,
    experiments: EXPERIMENTS,
    landing: LANDING,
    posts: POSTS,
    scripts: SCRIPTS,
    calendar: CALENDAR
  };
})(window.SM);
