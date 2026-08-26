/* ============================================================
   STYLE ME — app.js
   Hash routing, the navigation shell, and start-up.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var ui = SM.ui;
  var currentView = null;

  var ROUTES = [
    { re: /^#?\/?$/,                    name: 'welcome' },
    { re: /^#\/quiz$/,                  name: 'quiz' },
    { re: /^#\/dna$/,                   name: 'dna' },
    { re: /^#\/feed$/,                  name: 'feed' },
    { re: /^#\/outfit\/([\w~-]+)$/,     name: 'outfit', keys: ['id'] },
    { re: /^#\/item\/([\w-]+)$/,        name: 'item', keys: ['id'] },
    { re: /^#\/shop$/,                  name: 'shop' },
    { re: /^#\/community(?:\/(\w+))?$/, name: 'community', keys: ['tab'] },
    { re: /^#\/post\/([\w-]+)$/,        name: 'post', keys: ['id'] },
    { re: /^#\/person\/(\w+)$/,         name: 'person', keys: ['id'] },
    { re: /^#\/messages$/,              name: 'messages' },
    { re: /^#\/thread\/(\w+)$/,         name: 'thread', keys: ['id'] },
    { re: /^#\/me$/,                    name: 'me' },
    { re: /^#\/saved(?:\/(\w+))?$/,     name: 'saved', keys: ['tab'] },
    { re: /^#\/bag$/,                   name: 'bag' },
    { re: /^#\/studio$/,                name: 'studio' }
  ];

  function resolve() {
    var hash = location.hash || '#/';
    for (var i = 0; i < ROUTES.length; i++) {
      var m = hash.match(ROUTES[i].re);
      if (!m) continue;
      var params = {};
      (ROUTES[i].keys || []).forEach(function (k, j) { params[k] = m[j + 1]; });
      return { name: ROUTES[i].name, params: params };
    }
    return { name: 'feed', params: {} };
  }

  var NAV = [
    { hash: '#/feed', icon: 'home', label: 'Feed', match: ['feed', 'outfit'] },
    { hash: '#/shop', icon: 'search', label: 'Shop', match: ['shop', 'item'] },
    { hash: '#/community', icon: 'users', label: 'Community', match: ['community', 'post', 'person'] },
    { hash: '#/messages', icon: 'chat', label: 'Messages', match: ['messages', 'thread'] },
    { hash: '#/me', icon: 'user', label: 'You', match: ['me', 'saved', 'studio', 'dna', 'bag'] }
  ];

  function navHTML(active) {
    var unread = SM.store.unreadTotal();
    return '<nav class="nav" aria-label="Main navigation">' + NAV.map(function (n) {
      var on = n.match.indexOf(active) !== -1;
      return '<a class="nav-item' + (on ? ' on' : '') + '" href="' + n.hash + '"' + (on ? ' aria-current="page"' : '') + '>' +
        ui.icon(n.icon) + (n.icon === 'chat' && unread ? '<span class="badge"></span>' : '') +
        '<span>' + n.label + '</span></a>';
    }).join('') + '</nav>';
  }

  var TITLES = {
    welcome: 'Style Me', quiz: 'Style test — Style Me', dna: 'Style DNA — Style Me',
    feed: 'Feed — Style Me', outfit: 'Outfit — Style Me', item: 'Product — Style Me',
    shop: 'Shop — Style Me', community: 'Community — Style Me', post: 'Post — Style Me',
    person: 'Profile — Style Me', messages: 'Messages — Style Me', thread: 'Chat — Style Me',
    me: 'You — Style Me', saved: 'Saved — Style Me', bag: 'Bag — Style Me', studio: 'Studio — Style Me'
  };

  SM.render = function () {
    var route = resolve();
    var s = SM.store.get();

    /* First visit goes to the welcome screen, except for the feed,
       which anyone can look at before answering anything. */
    if (!s.onboarded && ['welcome', 'quiz', 'dna', 'feed'].indexOf(route.name) === -1) {
      location.hash = '#/';
      return;
    }
    if (route.name === 'welcome' && s.onboarded) { location.hash = '#/feed'; return; }

    var view = SM.views[route.name];
    if (!view) { location.hash = '#/feed'; return; }

    if (currentView && currentView.unmount) currentView.unmount();

    var app = document.getElementById('app');
    app.className = 'app' + (view.chrome ? ' with-nav' : '') + ' scr-' + route.name;
    app.innerHTML = '<main class="screen" id="screen" data-screen="' + route.name + '">' +
      view.render(route.params) + '</main>' + (view.chrome ? navHTML(route.name) : '');

    var root = document.getElementById('screen');
    if (view.mount) view.mount(root);
    currentView = view;

    if (route.name !== 'feed') window.scrollTo(0, 0);
    document.title = TITLES[route.name] || 'Style Me';
  };

  /* ---------- global delegation --------------------------------- */
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); location.hash = nav.getAttribute('data-nav'); return; }

    var back = e.target.closest('[data-back]');
    if (back) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.hash = '#/feed';
      return;
    }

    var close = e.target.closest('[data-close]');
    if (close) { e.preventDefault(); ui.closeSheet(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') ui.closeSheet();
  });

  window.addEventListener('hashchange', SM.render);

  /* ---------- start-up ------------------------------------------ */
  function boot() {
    SM.materials.init();     // fabric tiles, generated once
    SM.store.get();
    SM.communityPosts();
    SM.render();
    document.body.classList.remove('booting');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.SM);
