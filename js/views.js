/* ============================================================
   STYLE ME — views.js
   One object per screen: { chrome, render(params), mount(root) }
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var ui = SM.ui;
  var esc = ui.esc;
  var V = {};
  SM.views = V;

  function go(hash) { location.hash = hash; }
  function profile() { return SM.store.profile(); }
  function state() { return SM.store.get(); }
  function outfitFromId(id) { return SM.stylist.fromId(id, profile()); }

  /* Copy from the stylist arrives asynchronously; cache it so the
     same outfit doesn't get re-described on every repaint. */
  var copyCache = {};
  function copyFor(outfit, onReady) {
    if (copyCache[outfit.id]) {
      if (onReady) onReady(copyCache[outfit.id]);
      return copyCache[outfit.id];
    }
    SM.ai.describe(outfit, profile()).then(function (text) {
      copyCache[outfit.id] = text;
      if (onReady) onReady(text);
    });
    return '';
  }

  /* ============================================================
     Welcome
     ============================================================ */
  V.welcome = {
    chrome: false,
    render: function () {
      var demo = [
        ['knit-turtle', 'trouser-pleated', 'derby-black', 'coat-wool-long'],
        ['tee-black-boxy', 'jeans-wide', 'sneaker-canvas', 'cap-six-panel'],
        ['dress-slip', 'jacket-leather', 'heel-slim']
      ];
      var figures = demo.map(function (ids, i) {
        var outfit = SM.stylist.wrap(ids.map(function (id) { return SM.CATALOG.byId[id]; }), null);
        var look = SM.store.lookFor(outfit);
        return '<div class="welcome-fig f' + i + '">' + SM.fit.render(outfit, look) + '</div>';
      }).join('');

      return '<div class="welcome">' +
        '<div class="welcome-art" aria-hidden="true">' + figures + '</div>' +
        '<div class="welcome-body">' +
          '<p class="kicker">Find what you actually wear</p>' +
          '<h1 class="wordmark">Style<span></span>Me</h1>' +
          '<p class="lede">Twelve questions that are barely about clothes. Then a feed of outfits built ' +
            'for you — and you can take any of them apart, piece by piece.</p>' +
          '<p class="welcome-meta mono">12 questions · about 3 minutes</p>' +
          '<button class="btn btn-primary btn-lg" data-nav="#/quiz">Take the style test</button>' +
          '<button class="btn btn-ghost" data-nav="#/feed">Skip and browse</button>' +
        '</div>' + footerHTML() + '</div>';
    }
  };

  /* ============================================================
     Quiz
     ============================================================ */
  var quiz = { index: 0, answers: {} };

  V.quiz = {
    chrome: false,
    render: function () {
      quiz = { index: 0, answers: Object.assign({}, state().profile.answers || {}) };
      return '<div class="quiz">' +
        '<div class="quiz-top">' +
          '<button class="icon-btn" data-quiz-back aria-label="Previous question">' + ui.icon('back') + '</button>' +
          '<div class="quiz-progress"><span id="qfill"></span></div>' +
          '<span class="mono" id="qcount">1/' + SM.QUESTIONS.length + '</span>' +
        '</div>' +
        '<div class="quiz-stage" id="qstage"></div></div>';
    },
    mount: function (root) {
      function draw() {
        var q = SM.QUESTIONS[quiz.index];
        root.querySelector('#qstage').innerHTML =
          '<div class="q">' +
            '<p class="kicker">' + esc(q.kicker) + '</p>' +
            '<h1 class="q-title">' + esc(q.q) + '</h1>' +
            '<div class="q-options">' + q.options.map(function (o, i) {
              return '<button class="q-option' + (quiz.answers[q.id] === i ? ' on' : '') + '" data-option="' + i + '">' +
                '<span class="q-mark" aria-hidden="true"></span><span>' + esc(o.t) + '</span></button>';
            }).join('') + '</div></div>';
        root.querySelector('#qfill').style.width = (quiz.index / SM.QUESTIONS.length * 100) + '%';
        root.querySelector('#qcount').textContent = (quiz.index + 1) + '/' + SM.QUESTIONS.length;
      }
      draw();

      root.addEventListener('click', function (e) {
        var opt = e.target.closest('[data-option]');
        if (opt) {
          var q = SM.QUESTIONS[quiz.index];
          quiz.answers[q.id] = parseInt(opt.getAttribute('data-option'), 10);
          root.querySelectorAll('.q-option').forEach(function (b) { b.classList.remove('on'); });
          opt.classList.add('on');
          setTimeout(function () {
            if (quiz.index < SM.QUESTIONS.length - 1) { quiz.index++; draw(); }
            else finish();
          }, 190);
          return;
        }
        if (e.target.closest('[data-quiz-back]')) {
          if (quiz.index > 0) { quiz.index--; draw(); } else go('#/');
        }
      });

      function finish() {
        var s = state();
        s.profile.answers = quiz.answers;
        s.profile.axes = SM.scoreQuiz(quiz.answers);
        s.profile.rev = 0;
        s.onboarded = true;
        SM.store.save();
        copyCache = {};
        go('#/dna');
      }
    }
  };

  /* ============================================================
     Style DNA
     ============================================================ */
  V.dna = {
    chrome: false,
    render: function () {
      var p = profile();
      var arch = SM.archetype(p.axes);
      var explore = SM.explorationAxes(p.axes);
      var picks = SM.stylist.feed(p, SM.emptyFilters(), 0, 3);
      return '<div class="dna">' +
        '<div class="dna-hero">' +
          '<p class="kicker">Your profile</p>' +
          '<h1 class="dna-name">' + esc(arch.name) + '</h1>' +
          '<p class="dna-line">' + esc(arch.line) + '</p>' +
        '</div>' +
        '<div class="dna-body">' +
          '<h2 class="sec-title">What pulls you</h2>' + ui.axisBars(p.axes, 6) +
          '<h2 class="sec-title">Worth exploring</h2>' +
          '<p class="muted">Neither what you already are nor what you clearly reject. The feed will slip these in.</p>' +
          '<div class="chips">' + explore.map(function (k) {
            return '<span class="chip">' + SM.AXES[k].label + '</span>';
          }).join('') + '</div>' +
          '<h2 class="sec-title">Three to start with</h2>' +
          '<div class="look-row">' + picks.map(lookThumb).join('') + '</div>' +
          '<div class="dna-cta">' +
            '<button class="btn btn-primary btn-lg" data-nav="#/feed">Open my feed</button>' +
            '<button class="btn btn-ghost" data-nav="#/quiz">Retake the test</button>' +
          '</div>' +
        '</div></div>';
    }
  };

  function lookThumb(outfit) {
    return '<a class="look-thumb" href="#/outfit/' + outfit.id + '">' +
      SM.fit.render(outfit, SM.store.lookFor(outfit)) +
      '<span class="look-cap mono">' + ui.price(outfit.total) + '</span></a>';
  }

  /* ============================================================
     Feed
     ============================================================ */
  var feed = { outfits: [], next: 0, observer: null };

  V.feed = {
    chrome: true,
    render: function () {
      feed.outfits = [];
      feed.next = 0;
      var s = state();
      var n = SM.filterCount(s.filters);
      return '<div class="feed">' +
        '<div class="feed-top">' +
          '<a class="wordmark sm" href="#/me">Style<span></span>Me</a>' +
          '<div class="feed-top-actions">' +
            '<button class="pill-btn' + (s.me.useMe ? ' on' : '') + '" data-act="onme">' + ui.icon('user') + '<span>On me</span></button>' +
            '<button class="pill-btn' + (n ? ' on' : '') + '" data-nav="#/shop">' + ui.icon('filter') +
              '<span>Filters' + (n ? ' · ' + n : '') + '</span></button>' +
          '</div></div>' +
        '<div class="feed-scroll" id="feedScroll" tabindex="0"></div></div>';
    },
    mount: function (root) {
      var scroll = root.querySelector('#feedScroll');
      appendCards(scroll, 4);

      feed.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          hydrate(entry.target);
          if (entry.intersectionRatio > 0.6) {
            var idx = parseInt(entry.target.getAttribute('data-index'), 10);
            if (idx >= feed.outfits.length - 3) appendCards(scroll, 3);
          }
        });
      }, { root: scroll, threshold: [0, 0.6], rootMargin: '120% 0px' });

      scroll.querySelectorAll('.card').forEach(function (c) { feed.observer.observe(c); });

      scroll.addEventListener('click', onCardClick);
      scroll.addEventListener('dblclick', function (e) {
        var card = e.target.closest('.card');
        if (card) { e.preventDefault(); like(card, true); }
      });
      scroll.addEventListener('keydown', function (e) {
        if (e.key === 'l' || e.key === 'L') {
          var card = currentCard(scroll);
          if (card) like(card, true);
        }
      });
      scroll.focus({ preventScroll: true });

      root.querySelector('[data-act="onme"]').addEventListener('click', function () {
        var s = state();
        if (!s.me.photos.face && !s.me.age && !s.me.weightKg) {
          go('#/studio');
          ui.toast('Add your measurements to see outfits on yourself');
          return;
        }
        s.me.useMe = !s.me.useMe;
        SM.store.save();
        this.classList.toggle('on', s.me.useMe);
        scroll.querySelectorAll('.card').forEach(function (c) {
          c.removeAttribute('data-hydrated');
          c.querySelector('.card-stage').innerHTML = '';
          hydrate(c);
        });
        ui.toast(s.me.useMe ? 'Outfits are now shown on your avatar' : 'Back to generated models');
      });
    },
    unmount: function () {
      if (feed.observer) { feed.observer.disconnect(); feed.observer = null; }
    }
  };

  function currentCard(scroll) {
    var cards = scroll.querySelectorAll('.card');
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (r.top > -80 && r.top < 200) return cards[i];
    }
    return cards[0];
  }

  function appendCards(scroll, n) {
    var s = state();
    var batch = SM.stylist.feed(s.profile, s.filters, feed.next, n);
    feed.next += n;
    feed.outfits = feed.outfits.concat(batch);
    var tmp = document.createElement('div');
    tmp.innerHTML = batch.map(cardHTML).join('');
    while (tmp.firstChild) {
      var node = tmp.firstChild;
      scroll.appendChild(node);
      if (feed.observer && node.nodeType === 1) feed.observer.observe(node);
    }
  }

  function cardHTML(outfit) {
    var liked = SM.store.isLiked(outfit.id);
    var saved = SM.store.isSaved(outfit.id);
    var title = SM.ai.title(outfit, state().profile);
    return '<article class="card" data-outfit="' + outfit.id + '" data-index="' + outfit.index + '">' +
      '<div class="card-stage"></div>' +
      '<div class="card-veil"></div>' +
      '<div class="card-rail">' +
        '<button class="rail-btn' + (liked ? ' liked' : '') + '" data-act="like" aria-pressed="' + liked + '" aria-label="Like">' +
          ui.icon('heart', { fill: liked }) + '</button>' +
        '<button class="rail-btn' + (saved ? ' saved' : '') + '" data-act="save" aria-pressed="' + saved + '" aria-label="Save">' +
          ui.icon('bookmark', { fill: saved }) + '</button>' +
        '<button class="rail-btn" data-act="detail" aria-label="Outfit details">' + ui.icon('swap') + '</button>' +
        '<button class="rail-btn" data-act="variant" aria-label="Another version">' + ui.icon('shuffle') + '</button>' +
        '<button class="rail-btn" data-act="share" aria-label="Share">' + ui.icon('share') + '</button>' +
      '</div>' +
      '<div class="card-info">' +
        '<div class="card-pills">' +
          '<span class="pill accent mono">' + outfit.match + '% you</span>' +
          '<span class="pill mono">' + (outfit.kind === 'piece' ? 'One piece' : outfit.items.length + ' pieces') + '</span>' +
          '<span class="pill mono">' + ui.price(outfit.total) + '</span>' +
        '</div>' +
        (outfit.kind === 'piece'
          ? '<p class="card-hero mono">The piece: ' + esc(outfit.hero.name) + ' — ' + esc(outfit.hero.brand) + '</p>' : '') +
        '<h2 class="card-title">' + esc(title) + '</h2>' +
        '<p class="card-why" data-why>' + esc(copyFor(outfit, function (t) {
          var el = document.querySelector('.card[data-outfit="' + outfit.id + '"] [data-why]');
          if (el) el.textContent = t;
        })) + '</p>' +
        '<div class="card-credits">' + outfit.items.slice(0, 2).map(function (i) { return ui.creditRow(i); }).join('') +
          '<button class="link-btn" data-act="detail">See all ' + outfit.items.length + ' pieces and swap</button>' +
        '</div>' +
      '</div>' +
      '<div class="burst" aria-hidden="true">' + ui.icon('heart', { fill: true }) + '</div>' +
      '</article>';
  }

  function hydrate(card) {
    if (card.getAttribute('data-hydrated')) return;
    var outfit = outfitFromId(card.getAttribute('data-outfit'));
    if (!outfit) return;
    card.querySelector('.card-stage').innerHTML = SM.fit.render(outfit, SM.store.lookFor(outfit));
    card.setAttribute('data-hydrated', '1');
  }

  function like(card, force) {
    var id = card.getAttribute('data-outfit');
    var outfit = outfitFromId(id);
    var btn = card.querySelector('[data-act="like"]');
    if (force && SM.store.isLiked(id)) { burst(card); return; }
    var on = SM.store.toggleLike(outfit);
    btn.classList.toggle('liked', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = ui.icon('heart', { fill: on });
    if (on) burst(card);
  }

  function burst(card) {
    var b = card.querySelector('.burst');
    b.classList.remove('go');
    void b.getBoundingClientRect();
    b.classList.add('go');
  }

  function onCardClick(e) {
    var btn = e.target.closest('[data-act]');
    var card = e.target.closest('.card');
    if (!card || !btn) return;
    var act = btn.getAttribute('data-act');
    var id = card.getAttribute('data-outfit');

    if (act === 'like') return like(card);
    if (act === 'save') {
      var on = SM.store.toggleSave(id);
      btn.classList.toggle('saved', on);
      btn.innerHTML = ui.icon('bookmark', { fill: on });
      ui.toast(on ? 'Outfit saved' : 'Removed from saved');
      return;
    }
    if (act === 'detail') return go('#/outfit/' + id);
    if (act === 'share') return ui.share('#/outfit/' + id, 'Look at this outfit');
    if (act === 'variant') {
      var outfit = outfitFromId(id);
      var keep = outfit.items.filter(function (i) { return i.category === 'top' || i.category === 'dress'; });
      var fresh = SM.stylist.build(state().profile, state().filters, id + Date.now());
      var mixed = keep.concat(fresh.items.filter(function (i) { return i.category !== 'top' && i.category !== 'dress'; }));
      var next = SM.stylist.wrap(mixed, state().profile);
      card.setAttribute('data-outfit', next.id);
      card.removeAttribute('data-hydrated');
      hydrate(card);
      card.querySelector('.card-credits').innerHTML =
        next.items.slice(0, 2).map(function (i) { return ui.creditRow(i); }).join('') +
        '<button class="link-btn" data-act="detail">See all ' + next.items.length + ' pieces and swap</button>';
      var why = card.querySelector('.card-why');
      copyFor(next, function (t) { why.textContent = t; });
      ui.toast('Same top, everything else changed');
    }
  }

  /* ============================================================
     Outfit — the page a look links to
     ============================================================ */
  var current = null;

  V.outfit = {
    chrome: true,
    render: function (params) {
      var outfit = outfitFromId(params.id);
      if (!outfit) {
        return ui.empty('Outfit not found', 'That link doesn’t match any combination.',
          '<button class="btn btn-primary" data-nav="#/feed">Back to the feed</button>');
      }
      current = outfit;
      return '<div class="outfit">' +
        ui.header(SM.ai.title(outfit, profile()), {
          back: true, kicker: 'Outfit',
          action: '<button class="icon-btn" data-act="share" aria-label="Share">' + ui.icon('share') + '</button>'
        }) +
        '<div class="outfit-grid">' +
          '<div class="outfit-stage" id="outfitStage">' + SM.fit.render(outfit, SM.store.lookFor(outfit)) +
            '<p class="stage-note mono">Every piece is its own layer. Swap one and the rest stays put.</p></div>' +
          '<div class="outfit-side">' +
            '<div class="outfit-actions">' +
              '<button class="btn' + (SM.store.isLiked(outfit.id) ? ' on' : '') + '" data-act="like">' +
                ui.icon('heart', { fill: SM.store.isLiked(outfit.id) }) + '<span>Like</span></button>' +
              '<button class="btn' + (SM.store.isSaved(outfit.id) ? ' on' : '') + '" data-act="save">' +
                ui.icon('bookmark', { fill: SM.store.isSaved(outfit.id) }) + '<span>Save</span></button>' +
              '<button class="btn" data-act="publish">' + ui.icon('plus') + '<span>Post</span></button>' +
            '</div>' +
            '<p class="why-block" id="whyBlock"></p>' +
            '<div class="side-head"><h2 class="sec-title">Credits</h2>' +
              '<span class="mono muted" id="outfitTotal">' + ui.price(outfit.total) + '</span></div>' +
            '<div class="credits" id="creditList">' +
              outfit.items.map(function (i) { return ui.creditRow(i, { swap: true }); }).join('') + '</div>' +
            '<button class="btn btn-ghost full" data-act="addpiece">' + ui.icon('plus') + '<span>Add a piece</span></button>' +
            '<p class="disclaimer">Demo catalogue. Prices are indicative; links open a search on the brand’s own site.</p>' +
          '</div></div></div>';
    },
    mount: function (root) {
      var why = root.querySelector('#whyBlock');
      if (why) copyFor(current, function (t) { why.textContent = t; });

      root.addEventListener('click', function (e) {
        var swap = e.target.closest('[data-swap]');
        if (swap) return openSwap(root, swap.getAttribute('data-swap'));
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-act');
        if (act === 'like') {
          var on = SM.store.toggleLike(current);
          btn.classList.toggle('on', on);
          btn.querySelector('svg').outerHTML = ui.icon('heart', { fill: on });
          ui.toast(on ? 'Liked — your feed will adjust' : 'Removed');
        } else if (act === 'save') {
          var saved = SM.store.toggleSave(current.id);
          btn.classList.toggle('on', saved);
          ui.toast(saved ? 'Outfit saved' : 'Removed from saved');
        } else if (act === 'share') {
          ui.share('#/outfit/' + current.id, 'Look at this outfit');
        } else if (act === 'publish') {
          openPublish(current);
        } else if (act === 'addpiece') {
          openAdd(root);
        }
      });
    }
  };

  function repaintLayers(root, items) {
    var svg = root.querySelector('#outfitStage svg');
    var look = SM.store.lookFor(current);
    var seen = {};
    items.filter(Boolean).forEach(function (item) {
      var layer = SM.fitLayerOf(item);
      if (seen[layer]) return;
      seen[layer] = 1;
      SM.fit.updateLayer(svg, current, look, layer);
    });
  }

  function refreshSide(root) {
    root.querySelector('#creditList').innerHTML =
      current.items.map(function (i) { return ui.creditRow(i, { swap: true }); }).join('');
    root.querySelector('#outfitTotal').textContent = ui.price(current.total);
    var why = root.querySelector('#whyBlock');
    SM.ai.describe(current, profile()).then(function (t) { if (why) why.textContent = t; });
    history.replaceState(null, '', '#/outfit/' + current.id);
  }

  function openSwap(root, itemId) {
    var item = SM.CATALOG.byId[itemId];
    var alternatives = SM.stylist.alternatives(current, item, profile(), state().filters, 30);
    ui.sheet({
      title: 'Replace: ' + item.name,
      sub: 'Only this layer is redrawn. The rest of the outfit stays exactly as it is.',
      body: '<div class="alt-grid">' + alternatives.map(function (a) {
        return '<button class="alt" data-alt="' + a.item.id + '">' +
          '<span class="alt-shot">' + SM.garment.productShot(a.item) + '</span>' +
          '<span class="alt-name">' + esc(a.item.name) + '</span>' +
          '<span class="alt-meta mono">' + esc(a.item.brand) + ' · ' + ui.price(a.item.price) + '</span></button>';
      }).join('') +
        '<button class="alt alt-remove" data-remove="' + item.id + '">' +
          '<span class="alt-shot">' + ui.icon('trash') + '</span>' +
          '<span class="alt-name">Remove this piece</span></button>' +
        '</div>',
      onMount: function (host) {
        host.addEventListener('click', function (e) {
          var remove = e.target.closest('[data-remove]');
          if (remove) {
            current = SM.stylist.remove(current, remove.getAttribute('data-remove'), profile());
            repaintLayers(root, [item]);
            refreshSide(root);
            ui.closeSheet();
            ui.toast('Piece removed');
            return;
          }
          var alt = e.target.closest('[data-alt]');
          if (!alt) return;
          var newId = alt.getAttribute('data-alt');
          current = SM.stylist.swap(current, itemId, newId, profile());
          repaintLayers(root, [item, SM.CATALOG.byId[newId]]);
          refreshSide(root);
          ui.closeSheet();
          ui.toast(SM.CATALOG.byId[newId].name + ' — nothing else moved');
        });
      }
    });
  }

  function openAdd(root) {
    var have = {};
    current.items.forEach(function (i) { have[i.category] = true; });
    var pool = SM.CATALOG.items.filter(function (i) {
      return i.category === 'accessory' || !have[i.category];
    }).slice(0, 60);
    ui.sheet({
      title: 'Add a piece',
      body: '<div class="alt-grid">' + pool.map(function (i) {
        return '<button class="alt" data-add="' + i.id + '">' +
          '<span class="alt-shot">' + SM.garment.productShot(i) + '</span>' +
          '<span class="alt-name">' + esc(i.name) + '</span>' +
          '<span class="alt-meta mono">' + esc(i.brand) + ' · ' + ui.price(i.price) + '</span></button>';
      }).join('') + '</div>',
      onMount: function (host) {
        host.addEventListener('click', function (e) {
          var add = e.target.closest('[data-add]');
          if (!add) return;
          var item = SM.CATALOG.byId[add.getAttribute('data-add')];
          current = SM.stylist.add(current, item.id, profile());
          repaintLayers(root, [item]);
          refreshSide(root);
          ui.closeSheet();
          ui.toast(item.name + ' added');
        });
      }
    });
  }

  function openPublish(outfit) {
    ui.sheet({
      title: 'Post this outfit',
      sub: 'It shows up in the community with every piece linked.',
      body: '<label class="field"><span>Caption</span><textarea id="pubCaption" rows="3" placeholder="Say something…"></textarea></label>' +
        '<button class="btn btn-primary full" id="pubGo">Post</button>',
      onMount: function (host) {
        host.querySelector('#pubGo').addEventListener('click', function () {
          var caption = host.querySelector('#pubCaption').value.trim() || 'New outfit.';
          SM.store.publish(outfit.id, caption);
          ui.closeSheet();
          ui.toast('Posted to the community');
          go('#/community');
        });
      }
    });
  }

  /* ============================================================
     Product page
     ============================================================ */
  V.item = {
    chrome: true,
    render: function (params) {
      var item = SM.CATALOG.byId[params.id];
      if (!item) return ui.empty('Piece not found', 'That reference isn’t in the catalogue.');
      var saved = SM.store.isItemSaved(item.id);
      var sizes = SM.CATALOG.sizesFor(item);
      var TIER = { 1: 'High street', 2: 'Mid range', 3: 'Designer' };

      var looks = [0, 1, 2].map(function (n) {
        return SM.stylist.add(SM.stylist.build(profile(), state().filters, item.id + ':' + n), item.id, profile());
      });
      var related = SM.CATALOG.byCategory(item.category)
        .filter(function (i) { return i.id !== item.id; })
        .sort(function (a, b) { return SM.affinity(b, profile().axes) - SM.affinity(a, profile().axes); })
        .slice(0, 6);

      return '<div class="product">' +
        ui.header(item.name, { back: true, kicker: item.brand,
          action: '<button class="icon-btn" data-act="share" aria-label="Share">' + ui.icon('share') + '</button>' }) +
        '<div class="product-grid">' +
          '<div class="product-media">' +
            '<div class="product-hero" id="productHero">' + SM.garment.productShot(item) + '</div>' +
            '<div class="product-thumbs" id="productThumbs">' +
              '<button class="pthumb on" data-view="product">' + SM.garment.productShot(item) + '</button>' +
              '<button class="pthumb" data-view="model">' + SM.fit.render(
                SM.stylist.wrap([item], profile()), SM.store.lookFor({ id: item.id })) + '</button>' +
              '<button class="pthumb" data-view="fabric">' + fabricSwatch(item) + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="product-info">' +
            '<p class="product-brand">' + esc(item.brand) + '</p>' +
            '<h2 class="product-name">' + esc(item.name) + '</h2>' +
            '<p class="product-colour"><i style="background:' + item.colour + '"></i>' + esc(item.colourName) + '</p>' +
            '<p class="product-price mono">' + ui.price(item.price) + '</p>' +

            '<div class="size-block">' +
              '<div class="size-head"><span>Select size</span><span class="muted">Size guide</span></div>' +
              '<div class="sizes" id="sizes">' + sizes.map(function (s, i) {
                return '<button class="size' + (i === 2 ? ' on' : '') + '" data-size="' + s + '">' + s + '</button>';
              }).join('') + '</div>' +
            '</div>' +

            '<div class="product-actions">' +
              '<button class="btn btn-primary btn-lg full" data-act="bag">' + ui.icon('bag') + '<span>Add to bag</span></button>' +
              '<button class="btn btn-ghost btn-lg full' + (saved ? ' on' : '') + '" data-act="save">' +
                ui.icon('bookmark', { fill: saved }) + '<span>' + (saved ? 'Saved' : 'Save') + '</span></button>' +
            '</div>' +

            '<dl class="specs">' +
              '<div><dt>Material</dt><dd>' + esc(SM.MATERIALS[item.material] || item.material) + '</dd></div>' +
              '<div><dt>Colour</dt><dd>' + esc(item.colourName) + '</dd></div>' +
              '<div><dt>Range</dt><dd>' + TIER[item.tier] + '</dd></div>' +
              '<div><dt>Style</dt><dd>' + item.tags.map(function (t) { return SM.AXES[t].label; }).join(', ') + '</dd></div>' +
            '</dl>' +

            '<a class="btn full" href="' + SM.CATALOG.searchLink(item) + '" target="_blank" rel="noopener noreferrer">' +
              ui.icon('link') + '<span>Search at ' + esc(item.brand) + '</span></a>' +
            '<p class="disclaimer">Demo catalogue with an indicative price. The link opens a search on the brand’s site.</p>' +
          '</div>' +
        '</div>' +

        '<div class="pad"><h2 class="sec-title">Three ways to wear it</h2>' +
          '<div class="look-row">' + looks.map(lookThumb).join('') + '</div></div>' +
        '<div class="pad"><h2 class="sec-title">You might also like</h2>' +
          '<div class="tile-grid">' + related.map(function (i) { return ui.tile(i); }).join('') + '</div></div>' +
        '</div>';
    },
    mount: function (root) {
      var id = location.hash.split('/')[2];
      var item = SM.CATALOG.byId[id];
      var chosenSize = SM.CATALOG.sizesFor(item)[2];

      root.addEventListener('click', function (e) {
        var thumb = e.target.closest('[data-view]');
        if (thumb) {
          root.querySelectorAll('.pthumb').forEach(function (t) { t.classList.remove('on'); });
          thumb.classList.add('on');
          root.querySelector('#productHero').innerHTML = thumb.innerHTML;
          return;
        }
        var size = e.target.closest('[data-size]');
        if (size) {
          root.querySelectorAll('.size').forEach(function (s) { s.classList.remove('on'); });
          size.classList.add('on');
          chosenSize = size.getAttribute('data-size');
          return;
        }
        var btn = e.target.closest('[data-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-act');
        if (act === 'save') {
          var on = SM.store.toggleItemSave(id);
          btn.classList.toggle('on', on);
          btn.innerHTML = ui.icon('bookmark', { fill: on }) + '<span>' + (on ? 'Saved' : 'Save') + '</span>';
          ui.toast(on ? 'Piece saved' : 'Removed');
        } else if (act === 'bag') {
          SM.store.addToBag(id, chosenSize);
          ui.toast('Added to bag · size ' + chosenSize);
          SM.render();
        } else if (act === 'share') {
          ui.share('#/item/' + id, item.name);
        }
      });
    }
  };

  /* A close-up of the cloth itself — the detail shot every
     retailer includes, and the clearest way to show a material. */
  function fabricSwatch(item) {
    return '<svg class="fabric" viewBox="0 0 300 300" role="img" aria-label="' + esc(item.material) + ' close up">' +
      '<defs>' + SM.materials.defs() + '</defs>' +
      '<rect width="300" height="300" fill="' + item.colour + '"/>' +
      '<rect width="300" height="300" fill="' + SM.materials.fill(item.material) + '" style="mix-blend-mode:overlay"/>' +
      '<rect width="300" height="300" fill="url(#fabShade)"/>' +
      '<defs><linearGradient id="fabShade" x1="0" y1="0" x2="0.7" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".16"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs></svg>';
  }

  /* ============================================================
     Shop — search and filters
     ============================================================ */
  V.shop = {
    chrome: true,
    render: function () {
      var f = state().filters;
      var CATS = [['top', 'Tops'], ['outer', 'Outerwear'], ['bottom', 'Bottoms'], ['dress', 'Dresses'],
        ['shoes', 'Shoes'], ['accessory', 'Accessories']];
      var TIERS = [[1, 'High street'], [2, 'Mid range'], [3, 'Designer']];
      return '<div class="shop">' +
        ui.header('Shop', { kicker: 'Everything in the catalogue',
          action: '<button class="btn btn-ghost sm" data-act="reset">Clear all</button>' }) +
        '<div class="search-bar">' + ui.icon('search') +
          '<input id="q" type="search" placeholder="Search a piece, a brand, a material…" autocomplete="off"></div>' +
        '<div class="filters">' +
          '<div class="filter-block"><div class="filter-head"><h3>Outfit budget</h3>' +
            '<span class="mono" id="btLabel">' + (f.budgetTotal ? ui.price(f.budgetTotal) : 'no limit') + '</span></div>' +
            '<input type="range" id="bt" min="0" max="3000" step="50" value="' + (f.budgetTotal || 0) + '"></div>' +
          '<div class="filter-block"><div class="filter-head"><h3>Per piece</h3>' +
            '<span class="mono" id="bpLabel">' + (f.budgetPiece ? ui.price(f.budgetPiece) : 'no limit') + '</span></div>' +
            '<input type="range" id="bp" min="0" max="800" step="10" value="' + (f.budgetPiece || 0) + '"></div>' +
          '<div class="filter-block"><h3>Category</h3><div class="chips">' + CATS.map(function (c) {
            return '<button class="chip tog' + (f.categories.indexOf(c[0]) !== -1 ? ' on' : '') +
              '" data-f="categories" data-v="' + c[0] + '">' + c[1] + '</button>';
          }).join('') + '</div></div>' +
          '<div class="filter-block"><h3>Colour</h3><div class="swatches">' + SM.COLOUR_FAMILIES.map(function (c) {
            return '<button class="swatch' + (f.colours.indexOf(c.key) !== -1 ? ' on' : '') +
              '" data-f="colours" data-v="' + c.key + '" aria-label="' + c.label + '">' +
              '<span style="background:' + c.swatch + '"></span><em>' + c.label + '</em></button>';
          }).join('') + '</div></div>' +
          '<div class="filter-block"><h3>Material</h3><div class="chips">' + Object.keys(SM.MATERIALS).map(function (m) {
            return '<button class="chip tog' + (f.materials.indexOf(m) !== -1 ? ' on' : '') +
              '" data-f="materials" data-v="' + m + '">' + SM.MATERIALS[m] + '</button>';
          }).join('') + '</div></div>' +
          '<div class="filter-block"><h3>Price range</h3><div class="chips">' + TIERS.map(function (t) {
            return '<button class="chip tog' + (f.tiers.indexOf(t[0]) !== -1 ? ' on' : '') +
              '" data-f="tiers" data-v="' + t[0] + '">' + t[1] + '</button>';
          }).join('') + '</div></div>' +
          '<div class="filter-block"><h3>Brand</h3><div class="chips scrollable">' + Object.keys(SM.BRANDS).map(function (b) {
            return '<button class="chip tog' + (f.brands.indexOf(b) !== -1 ? ' on' : '') +
              '" data-f="brands" data-v="' + esc(b) + '">' + esc(b) + '</button>';
          }).join('') + '</div></div>' +
        '</div>' +
        '<div class="pad" id="results"></div>' +
        '<div class="pad"><button class="btn btn-primary btn-lg full" data-act="apply">Build my feed from these filters</button></div>' +
        '</div>';
    },
    mount: function (root) {
      var f = state().filters;
      function draw() {
        var results = SM.stylist.search(root.querySelector('#q').value, f, profile()).slice(0, 48);
        root.querySelector('#results').innerHTML =
          '<h2 class="sec-title">' + results.length + ' piece' + (results.length === 1 ? '' : 's') + '</h2>' +
          '<div class="tile-grid">' + results.map(function (i) { return ui.tile(i); }).join('') + '</div>';
      }
      draw();

      root.querySelector('#q').addEventListener('input', draw);
      root.querySelector('#bt').addEventListener('input', function () {
        var v = parseInt(this.value, 10);
        f.budgetTotal = v === 0 ? null : v;
        root.querySelector('#btLabel').textContent = v === 0 ? 'no limit' : ui.price(v);
        SM.store.save();
      });
      root.querySelector('#bp').addEventListener('input', function () {
        var v = parseInt(this.value, 10);
        f.budgetPiece = v === 0 ? null : v;
        root.querySelector('#bpLabel').textContent = v === 0 ? 'no limit' : ui.price(v);
        SM.store.save();
        draw();
      });

      root.addEventListener('click', function (e) {
        var tog = e.target.closest('[data-f]');
        if (tog) {
          var key = tog.getAttribute('data-f');
          var val = tog.getAttribute('data-v');
          if (key === 'tiers') val = parseInt(val, 10);
          var arr = f[key];
          var i = arr.indexOf(val);
          if (i === -1) arr.push(val); else arr.splice(i, 1);
          tog.classList.toggle('on', i === -1);
          SM.store.save();
          draw();
          return;
        }
        var act = e.target.closest('[data-act]');
        if (!act) return;
        if (act.getAttribute('data-act') === 'reset') {
          state().filters = SM.emptyFilters();
          SM.store.save();
          SM.render();
          ui.toast('Filters cleared');
        } else {
          go('#/feed');
          ui.toast('Feed rebuilt with your filters');
        }
      });
    }
  };

  /* ============================================================
     Community
     ============================================================ */
  V.community = {
    chrome: true,
    render: function (params) {
      var tab = params.tab || 'all';
      var mine = state().myPosts.map(function (p) {
        return { id: p.id, personId: 'me', outfitId: p.outfitId, caption: p.caption, likes: p.likes, at: p.at, comments: [], mine: true };
      });
      var all = mine.concat(SM.communityPosts());
      if (tab === 'following') {
        all = all.filter(function (p) { return p.mine || SM.store.isFollowing(p.personId); });
      }
      return '<div class="community">' +
        ui.header('Community', { kicker: 'What other people are wearing',
          action: '<button class="icon-btn" data-nav="#/messages" aria-label="Messages">' + ui.icon('chat') +
            (SM.store.unreadTotal() ? '<span class="badge"></span>' : '') + '</button>' }) +
        '<div class="tabs">' +
          '<button class="tab' + (tab === 'all' ? ' on' : '') + '" data-nav="#/community">Discover</button>' +
          '<button class="tab' + (tab === 'following' ? ' on' : '') + '" data-nav="#/community/following">Following</button>' +
        '</div>' +
        (all.length ? '<div class="posts">' + all.map(postCard).join('') + '</div>'
          : ui.empty('Nobody here yet', 'Follow someone from Discover.')) +
        '</div>';
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var likeBtn = e.target.closest('[data-post-like]');
        if (likeBtn) {
          var id = likeBtn.getAttribute('data-post-like');
          var on = SM.store.togglePostLike(id);
          likeBtn.classList.toggle('liked', on);
          likeBtn.querySelector('svg').outerHTML = ui.icon('heart', { fill: on });
          var count = likeBtn.querySelector('.count');
          if (count) count.textContent = ui.compact(parseInt(count.getAttribute('data-base'), 10) + (on ? 1 : 0));
          return;
        }
        var del = e.target.closest('[data-post-del]');
        if (del) {
          SM.store.deletePost(del.getAttribute('data-post-del'));
          SM.render();
          ui.toast('Post deleted');
        }
      });
    }
  };

  function postCard(post) {
    var me = post.personId === 'me';
    var person = me
      ? { id: 'me', name: state().me.name, handle: state().me.handle, city: '' }
      : SM.PERSON_BY_ID[post.personId];
    var look = me ? SM.store.myLook() : person.look;
    var outfit = outfitFromId(post.outfitId);
    if (!outfit) return '';
    var liked = !!state().postLikes[post.id];
    var extra = (state().comments[post.id] || []).length;
    return '<article class="post">' +
      '<header class="post-head">' +
        '<a class="post-user" href="#/person/' + person.id + '">' +
          '<span class="post-av">' + ui.avatar(look) + '</span>' +
          '<span><strong>' + esc(person.name) + '</strong><em>@' + esc(person.handle) +
          (person.city ? ' · ' + esc(person.city) : '') + '</em></span></a>' +
        (post.mine ? '<button class="icon-btn" data-post-del="' + post.id + '" aria-label="Delete">' + ui.icon('trash') + '</button>'
          : '<span class="mono muted">' + ui.timeAgo(post.at) + '</span>') +
      '</header>' +
      '<a class="post-img" href="#/post/' + post.id + '">' + SM.fit.render(outfit, look) + '</a>' +
      '<div class="post-actions">' +
        '<button class="post-btn' + (liked ? ' liked' : '') + '" data-post-like="' + post.id + '">' +
          ui.icon('heart', { fill: liked }) + '<span class="count" data-base="' + post.likes + '">' +
          ui.compact(post.likes + (liked ? 1 : 0)) + '</span></button>' +
        '<a class="post-btn" href="#/post/' + post.id + '">' + ui.icon('comment') +
          '<span>' + ((post.comments || []).length + extra) + '</span></a>' +
        '<a class="post-btn ref" href="#/outfit/' + outfit.id + '">' + ui.icon('link') +
          '<span>Shop the look · ' + outfit.items.length + '</span></a>' +
      '</div>' +
      '<p class="post-caption"><strong>' + esc(person.handle) + '</strong> ' + esc(post.caption) + '</p>' +
      '</article>';
  }

  V.post = {
    chrome: true,
    render: function (params) {
      var post = SM.POST_BY_ID && SM.POST_BY_ID[params.id];
      if (!post) {
        var mine = state().myPosts.filter(function (p) { return p.id === params.id; })[0];
        if (mine) post = { id: mine.id, personId: 'me', outfitId: mine.outfitId, caption: mine.caption, likes: mine.likes, at: mine.at, comments: [], mine: true };
      }
      if (!post) return ui.empty('Post not found', 'It may have been deleted.');
      var outfit = outfitFromId(post.outfitId);
      var extra = state().comments[post.id] || [];
      var comments = (post.comments || []).map(function (c) {
        var p = SM.PERSON_BY_ID[c.p];
        return { name: p.handle, t: c.t, look: p.look };
      }).concat(extra.map(function (c) {
        return { name: state().me.handle, t: c.t, look: SM.store.myLook() };
      }));

      return '<div class="post-page">' +
        ui.header('Post', { back: true, kicker: post.personId === 'me' ? 'You' : '@' + SM.PERSON_BY_ID[post.personId].handle }) +
        '<div class="post-detail">' + postCard(post) + '</div>' +
        '<div class="pad">' +
          '<h2 class="sec-title">The pieces</h2>' +
          '<div class="credits">' + outfit.items.map(function (i) { return ui.creditRow(i); }).join('') + '</div>' +
          '<a class="btn btn-ghost full" href="#/outfit/' + outfit.id + '">Open the full outfit</a>' +
          '<h2 class="sec-title">Comments</h2>' +
          '<div class="comments">' + (comments.length ? comments.map(function (c) {
            return '<div class="comment"><span class="comment-av">' + ui.avatar(c.look) + '</span>' +
              '<p><strong>' + esc(c.name) + '</strong> ' + esc(c.t) + '</p></div>';
          }).join('') : '<p class="muted">No replies yet.</p>') + '</div>' +
          '<form class="comment-form" id="commentForm">' +
            '<input id="commentInput" placeholder="Add a comment…" autocomplete="off">' +
            '<button class="icon-btn accent" type="submit" aria-label="Send">' + ui.icon('send') + '</button>' +
          '</form>' +
        '</div></div>';
    },
    mount: function (root) {
      var form = root.querySelector('#commentForm');
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = root.querySelector('#commentInput');
        var v = input.value.trim();
        if (!v) return;
        SM.store.addComment(location.hash.split('/')[2], v);
        input.value = '';
        SM.render();
      });
    }
  };

  V.person = {
    chrome: true,
    render: function (params) {
      if (params.id === 'me') return V.me.render({});
      var person = SM.PERSON_BY_ID[params.id];
      if (!person) return ui.empty('Profile not found', 'That account doesn’t exist.');
      var posts = SM.communityPosts().filter(function (p) { return p.personId === person.id; });
      var following = SM.store.isFollowing(person.id);
      var axes = SM.normaliseAxes(person.axes);
      return '<div class="profile">' +
        ui.header(person.name, { back: true, kicker: '@' + person.handle }) +
        '<div class="prof-head">' +
          '<span class="prof-av">' + ui.avatar(person.look) + '</span>' +
          '<div class="prof-stats">' +
            '<div><strong class="mono">' + ui.compact(person.followers) + '</strong><span>followers</span></div>' +
            '<div><strong class="mono">' + posts.length + '</strong><span>posts</span></div>' +
            '<div><strong class="mono">' + SM.archetype(axes).name.split(' ')[0] + '</strong><span>profile</span></div>' +
          '</div></div>' +
        '<p class="prof-bio">' + esc(person.bio) + '</p>' +
        '<div class="prof-actions">' +
          '<button class="btn' + (following ? ' on' : ' btn-primary') + '" data-act="follow">' +
            (following ? ui.icon('check') + '<span>Following</span>' : ui.icon('plus') + '<span>Follow</span>') + '</button>' +
          '<a class="btn" href="#/thread/' + person.id + '">' + ui.icon('chat') + '<span>Message</span></a>' +
        '</div>' +
        '<div class="pad"><h2 class="sec-title">Their outfits</h2><div class="grid-3">' +
          posts.map(function (p) {
            return '<a class="grid-cell" href="#/post/' + p.id + '">' +
              SM.fit.render(outfitFromId(p.outfitId), person.look) + '</a>';
          }).join('') + '</div></div></div>';
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        if (!e.target.closest('[data-act="follow"]')) return;
        var on = SM.store.toggleFollow(location.hash.split('/')[2]);
        ui.toast(on ? 'Following' : 'Unfollowed');
        SM.render();
      });
    }
  };

  /* ============================================================
     Messages
     ============================================================ */
  V.messages = {
    chrome: true,
    render: function () {
      var threads = state().threads;
      return '<div class="messages">' + ui.header('Messages', { kicker: 'Conversations' }) +
        (threads.length ? '<div class="thread-list">' + threads.map(function (t) {
          var person = SM.PERSON_BY_ID[t.personId];
          var last = t.messages[t.messages.length - 1];
          return '<a class="thread-row" href="#/thread/' + person.id + '">' +
            '<span class="thread-av">' + ui.avatar(person.look) + (t.unread ? '<span class="badge"></span>' : '') + '</span>' +
            '<span class="thread-txt"><strong>' + esc(person.name) + '</strong>' +
            '<em>' + esc(last ? (last.me ? 'You: ' : '') + last.t : '') + '</em></span>' +
            '<span class="mono muted">' + ui.timeAgo(last ? last.at : Date.now()) + '</span></a>';
        }).join('') + '</div>' : ui.empty('No messages yet', 'Write to someone from their profile.')) +
        '</div>';
    }
  };

  V.thread = {
    chrome: false,
    render: function (params) {
      var person = SM.PERSON_BY_ID[params.id];
      if (!person) return ui.empty('Conversation not found', '');
      SM.store.markRead(person.id);
      var t = SM.store.thread(person.id);
      return '<div class="chat">' +
        '<header class="chat-head">' +
          '<button class="icon-btn" data-back="1" aria-label="Back">' + ui.icon('back') + '</button>' +
          '<a class="chat-user" href="#/person/' + person.id + '">' +
            '<span class="chat-av">' + ui.avatar(person.look) + '</span>' +
            '<span><strong>' + esc(person.name) + '</strong><em>@' + esc(person.handle) + '</em></span></a>' +
        '</header>' +
        '<div class="bubbles" id="bubbles">' + t.messages.map(bubble).join('') + '</div>' +
        '<form class="chat-form" id="chatForm">' +
          '<input id="chatInput" placeholder="Write a message…" autocomplete="off">' +
          '<button class="icon-btn accent" type="submit" aria-label="Send">' + ui.icon('send') + '</button>' +
        '</form></div>';
    },
    mount: function (root) {
      var box = root.querySelector('#bubbles');
      if (!box) return;
      box.scrollTop = box.scrollHeight;
      var id = location.hash.split('/')[2];
      root.querySelector('#chatForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = root.querySelector('#chatInput');
        var v = input.value.trim();
        if (!v) return;
        SM.store.sendMessage(id, v);
        box.insertAdjacentHTML('beforeend', bubble({ me: true, t: v, at: Date.now() }));
        input.value = '';
        box.scrollTop = box.scrollHeight;

        var typing = document.createElement('div');
        typing.className = 'bubble them typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        box.appendChild(typing);
        box.scrollTop = box.scrollHeight;
        setTimeout(function () {
          typing.remove();
          var reply = SM.AUTO_REPLIES[Math.floor(Math.random() * SM.AUTO_REPLIES.length)];
          SM.store.thread(id).messages.push({ me: false, t: reply, at: Date.now() });
          SM.store.save();
          box.insertAdjacentHTML('beforeend', bubble({ me: false, t: reply, at: Date.now() }));
          box.scrollTop = box.scrollHeight;
        }, 1400);
      });
    }
  };

  function bubble(m) {
    return '<div class="bubble ' + (m.me ? 'me' : 'them') + '">' + esc(m.t) + '</div>';
  }

  /* ============================================================
     Me / saved / bag / studio
     ============================================================ */
  V.me = {
    chrome: true,
    render: function () {
      var s = state();
      var p = profile();
      var arch = SM.archetype(p.axes);
      return '<div class="profile">' +
        ui.header(s.me.name, { kicker: '@' + s.me.handle,
          action: '<button class="icon-btn" data-nav="#/studio" aria-label="Studio">' + ui.icon('settings') + '</button>' }) +
        '<div class="prof-head">' +
          '<span class="prof-av">' + ui.avatar(SM.store.myLook()) + '</span>' +
          '<div class="prof-stats">' +
            '<div><strong class="mono">' + Object.keys(s.likes).length + '</strong><span>likes</span></div>' +
            '<div><strong class="mono">' + s.savedOutfits.length + '</strong><span>saved</span></div>' +
            '<div><strong class="mono">' + s.myPosts.length + '</strong><span>posts</span></div>' +
          '</div></div>' +
        '<a class="dna-card" href="#/dna">' +
          '<span class="kicker">Your style DNA</span>' +
          '<strong>' + esc(arch.name) + '</strong><em>' + esc(arch.line) + '</em>' +
          ui.axisBars(p.axes, 4) + '</a>' +
        '<a class="rs-widget" href="#/research" id="rsWidget" aria-live="polite">' + rsWidgetHTML(null) + '</a>' +
        '<div class="menu">' +
          '<a class="menu-row" href="#/bag">' + ui.icon('bag') + '<span>Bag</span><em class="mono">' +
            (SM.store.bagCount() || '') + '</em></a>' +
          '<a class="menu-row" href="#/saved">' + ui.icon('bookmark') + '<span>Saved</span><em class="mono">' +
            (s.savedOutfits.length + s.savedItems.length) + '</em></a>' +
          '<a class="menu-row" href="#/studio">' + ui.icon('camera') + '<span>Studio — body and photos</span><em class="mono">' +
            (s.me.photos.face ? 'ready' : 'to do') + '</em></a>' +
          '<a class="menu-row" href="#/messages">' + ui.icon('chat') + '<span>Messages</span><em class="mono">' +
            (SM.store.unreadTotal() || '') + '</em></a>' +
          '<a class="menu-row" href="#/quiz">' + ui.icon('sparkle') + '<span>Retake the style test</span><em></em></a>' +
          '<a class="menu-row" href="#/core">' + ui.icon('comment') + '<span>Style Core — describe it in your words</span><em></em></a>' +
          '<a class="menu-row" href="#/research">' + ui.icon('search') + '<span>Research desk — who else does this</span><em class="mono" id="rsWidgetCount"></em></a>' +
          /* Docs lives here because the welcome screen — the only other way in —
             stops being reachable the moment you finish the test. */
          '<a class="menu-row" href="#/docs">' + ui.icon('sparkle') + '<span>Docs — how this works</span><em></em></a>' +
          '<button class="menu-row" data-act="reset">' + ui.icon('trash') + '<span>Erase my data</span><em></em></button>' +
        '</div>' +
        (s.myPosts.length ? '<div class="pad"><h2 class="sec-title">My posts</h2><div class="grid-3">' +
          s.myPosts.map(function (p2) {
            return '<a class="grid-cell" href="#/post/' + p2.id + '">' +
              SM.fit.render(outfitFromId(p2.outfitId), SM.store.myLook()) + '</a>';
          }).join('') + '</div></div>' : '') +
        footerHTML() + '</div>';
    },
    mount: function (root) {
      rsLoadWidget(root);

      root.addEventListener('click', function (e) {
        if (!e.target.closest('[data-act="reset"]')) return;
        ui.sheet({
          title: 'Erase everything?',
          sub: 'Profile, likes, saved outfits, photos and messages are removed from this browser. This cannot be undone.',
          body: '<div class="row-btns"><button class="btn" data-close="1">Cancel</button>' +
            '<button class="btn btn-danger" id="doReset">Erase</button></div>',
          onMount: function (host) {
            host.querySelector('#doReset').addEventListener('click', function () {
              SM.store.reset();
              ui.closeSheet();
              location.hash = '#/';
              location.reload();
            });
          }
        });
      });
    }
  };

  V.saved = {
    chrome: true,
    render: function (params) {
      var s = state();
      var tab = params.tab || 'outfits';
      var body;
      if (tab === 'outfits') {
        body = s.savedOutfits.length
          ? '<div class="grid-2">' + s.savedOutfits.map(function (id) {
              var outfit = outfitFromId(id);
              if (!outfit) return '';
              return '<a class="grid-cell tall" href="#/outfit/' + id + '">' +
                SM.fit.render(outfit, SM.store.lookFor(outfit)) +
                '<span class="grid-cap mono">' + ui.price(outfit.total) + '</span></a>';
            }).join('') + '</div>'
          : ui.empty('No saved outfits', 'Tap the bookmark on any outfit in the feed.',
              '<button class="btn btn-primary" data-nav="#/feed">Open the feed</button>');
      } else {
        body = s.savedItems.length
          ? '<div class="tile-grid">' + s.savedItems.map(function (id) {
              var item = SM.CATALOG.byId[id];
              return item ? ui.tile(item) : '';
            }).join('') + '</div>'
          : ui.empty('No saved pieces', 'Use Save on any product page.');
      }
      return '<div class="saved-page">' + ui.header('Saved', { kicker: 'Your selection' }) +
        '<div class="tabs">' +
          '<button class="tab' + (tab === 'outfits' ? ' on' : '') + '" data-nav="#/saved">Outfits · ' + s.savedOutfits.length + '</button>' +
          '<button class="tab' + (tab === 'pieces' ? ' on' : '') + '" data-nav="#/saved/pieces">Pieces · ' + s.savedItems.length + '</button>' +
        '</div><div class="pad">' + body + '</div></div>';
    }
  };

  V.bag = {
    chrome: true,
    render: function () {
      var bag = state().bag;
      if (!bag.length) {
        return '<div class="bag-page">' + ui.header('Bag', { kicker: 'Nothing in it yet' }) +
          ui.empty('Your bag is empty', 'Add pieces from any product page.',
            '<button class="btn btn-primary" data-nav="#/shop">Browse the shop</button>') + '</div>';
      }
      return '<div class="bag-page">' + ui.header('Bag', { kicker: bag.length + ' item' + (bag.length === 1 ? '' : 's') }) +
        '<div class="pad"><div class="credits">' + bag.map(function (b) {
          var item = SM.CATALOG.byId[b.id];
          if (!item) return '';
          return '<div class="credit">' +
            '<a class="credit-thumb" href="#/item/' + item.id + '">' + SM.garment.productShot(item) + '</a>' +
            '<span class="credit-main"><span class="credit-cat">Size ' + esc(b.size || '—') + '</span>' +
            '<a class="credit-name" href="#/item/' + item.id + '">' + esc(item.name) + '</a>' +
            '<span class="credit-brand">' + esc(item.brand) + '</span></span>' +
            '<span class="credit-price">' + ui.price(item.price) + '</span>' +
            '<button class="credit-swap" data-remove-bag="' + item.id + '" aria-label="Remove">' + ui.icon('close') + '</button>' +
            '</div>';
        }).join('') + '</div>' +
        '<div class="bag-total"><span>Total</span><strong class="mono">' + ui.price(SM.store.bagTotal()) + '</strong></div>' +
        '<p class="disclaimer">This is a demo bag — nothing is ordered and no payment is taken. ' +
        'Each product page links out to a search on the brand’s own site.</p></div></div>';
    },
    mount: function (root) {
      root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-remove-bag]');
        if (!btn) return;
        SM.store.removeFromBag(btn.getAttribute('data-remove-bag'));
        SM.render();
        ui.toast('Removed from bag');
      });
    }
  };

  var HAIR_LABELS = { short: 'Short', buzz: 'Buzzed', bob: 'Bob', long: 'Long', curly: 'Curly', bun: 'Bun' };

  V.studio = {
    chrome: true,
    render: function () {
      var m = state().me;
      var demo = SM.stylist.build(profile(), SM.emptyFilters(), 'studio');
      return '<div class="studio">' +
        ui.header('Studio', { back: true, kicker: 'See the outfits on you' }) +
        '<div class="studio-grid">' +
          '<div class="studio-preview" id="studioPreview">' + SM.fit.render(demo, SM.store.myLook()) + '</div>' +
          '<div class="studio-form">' +
            '<h2 class="sec-title">You</h2>' +
            '<div class="field-row">' +
              '<label class="field"><span>Display name</span><input id="fName" value="' + esc(m.name) + '"></label>' +
              '<label class="field"><span>Handle</span><input id="fHandle" value="' + esc(m.handle) + '"></label>' +
            '</div>' +
            '<div class="field-row">' +
              '<label class="field"><span>Age</span><input id="fAge" type="number" min="12" max="99" value="' + (m.age || '') + '" placeholder="—"></label>' +
              '<label class="field"><span>Height (cm)</span><input id="fHeight" type="number" min="130" max="220" value="' + (m.heightCm || '') + '"></label>' +
              '<label class="field"><span>Weight (kg)</span><input id="fWeight" type="number" min="35" max="200" value="' + (m.weightKg || '') + '" placeholder="—"></label>' +
            '</div>' +
            '<h2 class="sec-title">Body</h2>' +
            '<label class="field"><span>Build <em class="mono" id="buildLabel"></em></span>' +
              '<input id="fBuild" type="range" min="0" max="100" value="' + Math.round(m.build * 100) + '"></label>' +
            '<label class="field"><span>Shoulders vs hips <em class="mono" id="frameLabel"></em></span>' +
              '<input id="fFrame" type="range" min="0" max="100" value="' + Math.round(m.frame * 100) + '"></label>' +
            '<h2 class="sec-title">Skin</h2>' +
            '<div class="swatch-row">' + SM.SKIN_TONES.map(function (t) {
              return '<button class="tone' + (m.skin === t.hex ? ' on' : '') + '" data-skin="' + t.hex +
                '" style="background:' + t.hex + '" aria-label="' + t.key + '"></button>';
            }).join('') + '</div>' +
            '<h2 class="sec-title">Hair</h2>' +
            '<div class="swatch-row">' + SM.HAIR_COLOURS.map(function (h) {
              return '<button class="tone' + (m.hairColour === h.hex ? ' on' : '') + '" data-hair="' + h.hex +
                '" style="background:' + h.hex + '" aria-label="' + h.key + '"></button>';
            }).join('') + '</div>' +
            '<div class="chips">' + SM.HAIR_STYLES.map(function (h) {
              return '<button class="chip tog' + (m.hairStyle === h ? ' on' : '') + '" data-hstyle="' + h + '">' +
                HAIR_LABELS[h] + '</button>';
            }).join('') + '</div>' +
            '<h2 class="sec-title">Photos</h2>' +
            '<p class="muted">The face photo is used on the model. Front, side and back help place the proportions. ' +
              'Everything stays on this device.</p>' +
            '<div class="photo-row">' + ['face', 'front', 'side', 'back'].map(function (k) {
              var labels = { face: 'Face', front: 'Front', side: 'Side', back: 'Back' };
              var v = m.photos[k];
              return '<label class="photo-slot' + (v ? ' has' : '') + '">' +
                (v ? '<img src="' + v + '" alt="' + labels[k] + '">' : ui.icon('camera')) +
                '<span>' + labels[k] + '</span>' +
                '<input type="file" accept="image/*" data-photo="' + k + '" hidden>' +
                (v ? '<button class="photo-clear" data-clear="' + k + '" aria-label="Remove">' + ui.icon('close') + '</button>' : '') +
                '</label>';
            }).join('') + '</div>' +
            '<label class="switch"><input type="checkbox" id="fUseMe"' + (m.useMe ? ' checked' : '') + '>' +
              '<span>Use my avatar in the feed</span></label>' +
            '<p class="disclaimer">No image is uploaded anywhere. They are stored in this browser and used only for the local render.</p>' +
          '</div></div></div>';
    },
    mount: function (root) {
      var m = state().me;
      var demo = SM.stylist.build(profile(), SM.emptyFilters(), 'studio');

      function labels() {
        root.querySelector('#buildLabel').textContent = m.build < 0.33 ? 'slim' : m.build < 0.66 ? 'average' : 'broad';
        root.querySelector('#frameLabel').textContent = m.frame < 0.33 ? 'hips wider' : m.frame < 0.66 ? 'balanced' : 'shoulders wider';
      }
      function repaint() {
        root.querySelector('#studioPreview').innerHTML = SM.fit.render(demo, SM.store.myLook());
        SM.store.save();
      }
      labels();

      root.addEventListener('input', function (e) {
        var t = e.target;
        if (t.id === 'fBuild') { m.build = t.value / 100; labels(); repaint(); }
        else if (t.id === 'fFrame') { m.frame = t.value / 100; labels(); repaint(); }
        else if (t.id === 'fName') { m.name = t.value; SM.store.save(); }
        else if (t.id === 'fHandle') { m.handle = t.value.replace(/\s/g, ''); SM.store.save(); }
        else if (t.id === 'fAge') { m.age = parseInt(t.value, 10) || null; SM.store.save(); }
        else if (t.id === 'fHeight') {
          m.heightCm = parseInt(t.value, 10) || 172;
          m.height = Math.max(0, Math.min(1, (m.heightCm - 150) / 50));
          repaint();
        } else if (t.id === 'fWeight') {
          m.weightKg = parseInt(t.value, 10) || null;
          if (m.weightKg && m.heightCm) {
            var bmi = m.weightKg / Math.pow(m.heightCm / 100, 2);
            m.build = Math.max(0, Math.min(1, (bmi - 16) / 18));
            root.querySelector('#fBuild').value = Math.round(m.build * 100);
          }
          labels(); repaint();
        } else if (t.id === 'fUseMe') {
          m.useMe = t.checked;
          SM.store.save();
          ui.toast(t.checked ? 'The feed will use your avatar' : 'The feed will use generated models');
        }
      });

      root.addEventListener('change', function (e) {
        var input = e.target.closest('[data-photo]');
        if (!input || !input.files || !input.files[0]) return;
        var key = input.getAttribute('data-photo');
        ui.downscale(input.files[0], key === 'face' ? 260 : 200, function (dataUrl) {
          m.photos[key] = dataUrl;
          SM.store.save();
          SM.render();
          ui.toast(key === 'face' ? 'Face applied to the model' : 'Photo saved');
        });
      });

      root.addEventListener('click', function (e) {
        var clear = e.target.closest('[data-clear]');
        if (clear) {
          e.preventDefault();
          m.photos[clear.getAttribute('data-clear')] = null;
          SM.store.save();
          SM.render();
          return;
        }
        var skin = e.target.closest('[data-skin]');
        if (skin) { m.skin = skin.getAttribute('data-skin'); only(root, '[data-skin]', skin); repaint(); return; }
        var hair = e.target.closest('[data-hair]');
        if (hair) { m.hairColour = hair.getAttribute('data-hair'); only(root, '[data-hair]', hair); repaint(); return; }
        var style = e.target.closest('[data-hstyle]');
        if (style) { m.hairStyle = style.getAttribute('data-hstyle'); only(root, '[data-hstyle]', style); repaint(); }
      });
    }
  };

  /* ============================================================
     Style Core — /core. The ten-axis method on free text.
     Engine in core.js. State survives leaving the screen, not a
     reload: nothing here is written to localStorage.
     ============================================================ */
  var EXAMPLES = [
    ['Black, sharper for work', 'Mostly black, oversized, I live in my Doc Martens. I never wear colour. I’d like to look sharper for work without looking like a banker.', 'work', 300],
    ['Flea-market seventies', 'Flea markets every Saturday. Corduroy, my grandad’s old wool coat, seventies colours. I’d rather look second-hand than brand new.', 'weekend', 150],
    ['Trail and pockets', 'Trail running at weekends, a Gore-Tex shell, lots of pockets, nothing fussy. Comfort first, but it has to work in town too.', 'everyday', 600]
  ];

  var coreState = { text: '', occasion: 'everyday', budget: 300, label: '', result: null, error: null, savedId: null, saving: false };

  var CORE_ORDER = { outer: 0, dress: 1, top: 1, bottom: 2, shoes: 3, accessory: 4 };

  function coreOutHTML() {
    var c = coreState;
    if (c.result) return coreCardHTML(c.result);
    if (c.error && c.error.error === 'nosignal') {
      return '<div class="core-empty"><span class="kicker">Nothing to read yet</span>' +
        '<p class="core-empty-title">Not enough to go on.</p>' +
        '<p class="muted">Nothing in that says anything about clothes the Core recognises. Rather than guess an ' +
        'archetype, it stops here. Try colours, fabrics, shoes, or a place you would wear it.</p></div>';
    }
    if (c.error && c.error.error === 'onlynegative') {
      return '<div class="core-empty"><span class="kicker">Only refusals</span>' +
        '<p class="core-empty-title">That is everything you don’t want.</p>' +
        '<p class="muted">Noted: ' + esc(c.error.signals.map(function (s) { return s.word; }).join(', ')) + '. ' +
        'Tell it one thing you do like — a colour, a fabric, a pair of shoes — and it will build from there.</p></div>';
    }
    return '<div class="core-empty"><span class="kicker">Your core appears here</span>' +
      '<p class="core-empty-title">Free text in, a Style Core out.</p>' +
      '<ol class="core-steps">' +
        '<li>It reads your words for cues — fabrics, colours, shoes, places — and for what you say you avoid.</li>' +
        '<li>It scores them on the same ten axes as the style test, and names the result.</li>' +
        '<li>It dresses that result from the catalogue, inside your budget.</li>' +
      '</ol>' +
      '<p class="disclaimer">Simulated agent: rules, not a language model. The same words always give the same core.</p></div>';
  }

  function coreSignalHTML(s) {
    var main = s.axes.slice().sort(function (a, b) { return s.weights[b] - s.weights[a]; })[0];
    return '<span class="core-sig' + (s.negated ? ' neg' : '') + '">' + esc(s.word) + ' → ' +
      (s.negated ? '−' : '') + esc(SM.AXES[main].label) + '</span>';
  }

  function corePieceHTML(item) {
    return '<div class="credit">' +
      '<span class="credit-thumb">' + SM.garment.productShot(item) + '</span>' +
      '<span class="credit-main">' +
        '<span class="credit-cat">' + esc(item.category) + '</span>' +
        '<span class="credit-name">' + esc(item.name) + '</span>' +
        '<span class="credit-brand">' + esc(item.brand) + '</span>' +
      '</span>' +
      '<span class="credit-price">' + ui.price(item.price) + '</span></div>';
  }

  function coreCardHTML(core) {
    var items = core.outfit.items.slice().sort(function (a, b) { return CORE_ORDER[a.category] - CORE_ORDER[b.category]; });
    var weak = core.confidence === 'low'
      ? '<p class="core-hint">Only a couple of signals. Add a few words — a fabric, a colour, shoes — for a sharper read.</p>' : '';
    return '<article class="core-card">' +
      '<span class="core-sim mono">Simulated agent — rule-based, no language model</span>' +
      '<div class="core-card-grid">' +
        '<div class="core-card-main">' +
          '<span class="kicker">Your Style Core · confidence ' + esc(core.confidence) + '</span>' +
          '<h2 class="core-arch">' + esc(core.archetype.name) + '</h2>' +
          '<p class="core-line">' + esc(core.archetype.line) + '</p>' +
          ui.axisBars(core.axes, 3) + weak +
          '<h3 class="sec-title">Signals read</h3>' +
          '<div class="core-signals">' + core.signals.map(coreSignalHTML).join('') + '</div>' +
          '<h3 class="sec-title">Thesis</h3>' +
          '<p class="core-thesis">' + esc(core.thesis) + '</p>' +
          '<h3 class="sec-title">Worth exploring</h3>' +
          '<div class="chips">' + core.explore.map(function (k) {
            return '<span class="chip">' + esc(SM.AXES[k].label) + '</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="core-card-side">' +
          '<div class="core-fig" role="img" aria-label="The key pieces, worn">' +
            SM.fit.render(core.outfit, SM.store.lookFor(core.outfit)) + '</div>' +
          '<div class="core-side-info">' +
            '<div class="credits">' + items.map(corePieceHTML).join('') + '</div>' +
            '<p class="core-meta mono"><span>total ' + ui.price(core.outfit.total) +
              (core.input.budget ? ' / ' + ui.price(core.input.budget) : '') + '</span>' +
              '<span>' + esc(core.engine) + '</span></p>' +
            coreSaveHTML() +
          '</div>' +
        '</div>' +
      '</div></article>';
  }

  /* Save is one row per result: the button locks the moment it is
     pressed, and stays locked once the row exists. */
  function coreSaveHTML() {
    var id = coreState.savedId;
    return '<button class="btn btn-primary full" id="coreSave" type="button"' + (id || coreState.saving ? ' disabled' : '') + '>' +
        (id ? ui.icon('check') + 'Saved' : coreState.saving ? 'Saving…' : 'Save this core') + '</button>' +
      '<p class="core-save-msg" id="coreSaveMsg">' + (id ? 'Saved to Supabase · row ' + esc(id.slice(0, 8)) : '') + '</p>';
  }

  function coreSave(root, onSaved) {
    var c = coreState;
    var btn = root.querySelector('#coreSave');
    var note = root.querySelector('#coreSaveMsg');
    if (!c.result || c.saving || c.savedId) return;
    if (!SM.db.configured()) {
      note.className = 'core-save-msg err';
      note.textContent = 'Saving is off on this deployment: the database is not configured.';
      return;
    }
    var result = c.result;
    c.saving = true;
    btn.disabled = true;
    btn.textContent = 'Saving…';
    note.textContent = '';

    SM.db.insert('core_outputs', SM.core.toRow(result)).then(function (row) {
      c.saving = false;
      if (c.result !== result) return;         // a new core was generated meanwhile
      c.savedId = row.id;
      if (!btn.isConnected) return;
      btn.innerHTML = ui.icon('check') + 'Saved';
      note.className = 'core-save-msg';
      note.textContent = 'Saved to Supabase · row ' + row.id.slice(0, 8);
      ui.toast('Saved to Supabase');
      if (onSaved) onSaved(row);
    }).catch(function (err) {
      c.saving = false;
      if (c.result !== result || !btn.isConnected) return;
      btn.disabled = false;
      btn.textContent = 'Save this core';
      note.className = 'core-save-msg err';
      note.textContent = 'Could not save: ' + err.message + '. Your core is still here — try again.';
    });
  }

  /* The dashboard reads Supabase, never local state: a core only
     shows up here once the database has it. input_text is not in the
     list — the public key is not allowed to read it back. */
  var DASH_COLUMNS = 'id,created_at,label,archetype,top_axes,confidence';

  function coreMiniHTML(r) {
    var tops = (r.top_axes || []).slice(0, 2).map(function (t) {
      return '<span class="core-sig">' + esc((SM.AXES[t.axis] || {}).label || t.axis) + '</span>';
    }).join('');
    return '<div class="core-mini' + (r.id === coreState.savedId ? ' is-new' : '') + '">' +
      '<span class="kicker">' + esc(ui.timeAgo(Date.parse(r.created_at))) + ' · ' + esc(r.label || 'anonymous') + '</span>' +
      '<strong>' + esc(r.archetype) + '</strong>' +
      '<div class="core-signals">' + tops + '</div></div>';
  }

  function coreLoadDash(root) {
    var el = root.querySelector('#coreDash');
    if (!el) return;
    var head = '<div class="core-dash-head"><h2 class="sec-title">Saved cores</h2>';
    if (!SM.db.configured()) {
      el.innerHTML = head + '</div><p class="core-dash-note">Saved cores will appear here once the database is connected.</p>';
      return;
    }
    el.innerHTML = head + '</div><p class="core-dash-note">Loading from Supabase…</p>';
    SM.db.list('core_outputs', { select: DASH_COLUMNS, limit: 5 }).then(function (res) {
      if (!el.isConnected) return;
      if (!res.rows.length) {
        el.innerHTML = head + '</div><p class="core-dash-note">No core saved yet. Yours would be the first.</p>';
        return;
      }
      el.innerHTML = head + '<p class="core-total"><strong>' + res.total + '</strong> <span class="kicker">in core_outputs</span></p></div>' +
        '<div class="core-mini-row">' + res.rows.map(coreMiniHTML).join('') + '</div>' +
        '<p class="disclaimer">The five most recent, read live from the Supabase table <code>core_outputs</code>.</p>';
    }).catch(function (err) {
      if (!el.isConnected) return;
      el.innerHTML = head + '</div><p class="core-dash-note">Could not reach the database: ' + esc(err.message) + '</p>' +
        '<button class="btn sm" type="button" data-dash-retry="1">Try again</button>';
    });
  }

  V.core = {
    chrome: true,
    render: function () {
      var c = coreState;
      var occasions = Object.keys(SM.core.OCCASIONS).map(function (k) {
        var on = c.occasion === k;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-occasion="' + k + '" aria-pressed="' + on + '">' +
          esc(SM.core.OCCASIONS[k].label) + '</button>';
      }).join('');
      var budgets = SM.core.BUDGETS.map(function (b) {
        var on = c.budget === b;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-budget="' + (b || 'none') + '" aria-pressed="' + on + '">' +
          (b ? ui.price(b) : 'No limit') + '</button>';
      }).join('');

      return '<div class="core">' + ui.header('Style Core', { kicker: 'Generative core agent' }) +
        '<p class="core-intro pad">Describe how you dress — or how you wish you did — in your own words. ' +
          'The Core reads it on the same ten axes as the style test, names it, and dresses it.</p>' +
        '<div class="core-grid">' +
          '<form class="core-form" id="coreForm" novalidate>' +
            '<label class="field" for="coreText"><span>Describe how you dress <em class="mono" id="coreCount">' +
              c.text.length + ' / ' + SM.core.MAX_CHARS + '</em></span>' +
              '<textarea id="coreText" rows="6" maxlength="' + SM.core.MAX_CHARS + '" ' +
                'placeholder="Colours, fabrics, shoes, a place you would wear it…">' + esc(c.text) + '</textarea></label>' +
            '<p class="core-examples"><span class="muted">Or start from</span>' + EXAMPLES.map(function (x, i) {
              return '<button type="button" class="link-btn" data-example="' + i + '">' + esc(x[0]) + '</button>';
            }).join('') + '</p>' +
            '<div class="field"><span>Occasion</span><div class="chips">' + occasions + '</div></div>' +
            '<div class="field"><span>Budget for one outfit</span><div class="chips">' + budgets + '</div></div>' +
            '<label class="field" for="coreLabel"><span>Name this run <em>optional</em></span>' +
              '<input id="coreLabel" maxlength="40" autocomplete="off" value="' + esc(c.label) + '"></label>' +
            '<p class="core-msg" id="coreMsg" role="alert"></p>' +
            '<button class="btn btn-primary btn-lg full" type="submit">Generate my Style Core</button>' +
          '</form>' +
          '<section class="core-out" id="coreOut" aria-live="polite">' + coreOutHTML() + '</section>' +
        '</div>' +
        '<section class="core-dash pad" id="coreDash" aria-live="polite"></section>' +
        footerHTML() + '</div>';
    },
    mount: function (root) {
      var c = coreState;
      var ta = root.querySelector('#coreText');
      var count = root.querySelector('#coreCount');
      var msg = root.querySelector('#coreMsg');
      var out = root.querySelector('#coreOut');

      function syncText() {
        count.textContent = ta.value.length + ' / ' + SM.core.MAX_CHARS;
      }
      function press(selector, el) {
        root.querySelectorAll(selector).forEach(function (n) {
          n.classList.toggle('on', n === el);
          n.setAttribute('aria-pressed', String(n === el));
        });
      }

      ta.addEventListener('input', function () {
        c.text = ta.value;
        syncText();
        msg.textContent = '';
      });
      root.querySelector('#coreLabel').addEventListener('input', function (e) { c.label = e.target.value; });

      root.addEventListener('click', function (e) {
        var occ = e.target.closest('[data-occasion]');
        if (occ) { c.occasion = occ.getAttribute('data-occasion'); press('[data-occasion]', occ); return; }

        var bud = e.target.closest('[data-budget]');
        if (bud) {
          var v = bud.getAttribute('data-budget');
          c.budget = v === 'none' ? null : parseInt(v, 10);
          press('[data-budget]', bud);
          return;
        }

        var ex = e.target.closest('[data-example]');
        if (ex) {
          var x = EXAMPLES[parseInt(ex.getAttribute('data-example'), 10)];
          c.text = ta.value = x[1];
          c.occasion = x[2];
          c.budget = x[3];
          press('[data-occasion]', root.querySelector('[data-occasion="' + x[2] + '"]'));
          press('[data-budget]', root.querySelector('[data-budget="' + (x[3] || 'none') + '"]'));
          syncText();
          msg.textContent = '';
          ta.focus();
          return;
        }

        if (e.target.closest('#coreSave')) { coreSave(root, function () { coreLoadDash(root); }); return; }
        if (e.target.closest('[data-dash-retry]')) coreLoadDash(root);
      });

      coreLoadDash(root);

      root.querySelector('#coreForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var res = SM.core.extract({ text: c.text, occasion: c.occasion, budget: c.budget, label: c.label });
        if (res.error === 'short') {
          msg.textContent = 'A little more, please — at least ' + res.min + ' characters. You have ' + res.length + '.';
          ta.focus();
          return;
        }
        if (res.error === 'long') {
          msg.textContent = 'That is over ' + res.max + ' characters. Trim it a little.';
          ta.focus();
          return;
        }
        msg.textContent = '';
        c.result = res.error ? null : res;
        c.error = res.error ? res : null;
        c.savedId = null;
        out.innerHTML = coreOutHTML();
        if (window.innerWidth < 900) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  /* ============================================================
     Research desk — /research

     Week 2. Who else solves this, where they stop, what is
     different in Mexico, and what could sink it. The dataset is
     in research-data.js, the logic in research.js; this file only
     draws it.
     ============================================================ */
  var rsState = {
    query: '', type: 'all', market: 'all',
    form: { question: '', assumption: '', falsifier: '', market: 'mexico', verdict: 'real', notes: '' },
    savedId: null, saving: false
  };

  function rsSourceHTML(r) {
    /* A row whose evidence has not been gathered yet says so, rather
       than borrowing the authority of the rows that have one. */
    if (r.pending) return '<span class="rs-src rs-src-pending" title="' + esc(r.sourceName) + '">awaiting interview</span>';
    if (r.sourceKind === 'interview') {
      return '<span class="rs-src rs-src-off" title="' + esc(r.sourceName) + '">interview</span>';
    }
    return '<a class="rs-src" href="' + esc(r.source) + '" target="_blank" rel="noopener noreferrer" ' +
      'title="' + esc(r.sourceName) + '">' + esc(rsHost(r.source)) + ' ↗</a>';
  }

  function rsHost(url) {
    var m = /^https?:\/\/([^/]+)/.exec(url || '');
    return m ? m[1].replace(/^www\./, '') : 'source';
  }

  function rsRowHTML(c) {
    var type = SM.RESEARCH.types.filter(function (t) { return t.id === c.type; })[0];
    return '<tr>' +
      '<th scope="row"><span class="rs-name">' + esc(c.name) + '</span>' +
        '<span class="rs-where">' + esc(c.where) + '</span></th>' +
      '<td><span class="rs-pill rs-' + esc(c.type) + '">' + esc(type ? type.label : c.type) + '</span></td>' +
      '<td>' + esc(c.does) + '</td>' +
      '<td class="rs-gap">' + esc(c.gap) + '</td>' +
      '<td class="rs-figure">' + esc(c.figure) +
        (c.note ? '<em class="rs-note">' + esc(c.note) + '</em>' : '') + '</td>' +
      '<td>' + rsSourceHTML(c) + '<span class="rs-checked mono">' + esc(c.checked) + '</span></td>' +
      '</tr>';
  }

  function rsTableHTML() {
    var rows = SM.research.filter({ query: rsState.query, type: rsState.type, market: rsState.market });
    if (!rows.length) {
      return '<p class="rs-empty">Nothing matches “' + esc(rsState.query) + '”. ' +
        'The dataset is twelve rows — it is meant to be read, not searched into silence.</p>';
    }
    return '<div class="rs-scroll"><table class="rs-table">' +
      '<thead><tr><th scope="col">Who</th><th scope="col">Type</th><th scope="col">What it does</th>' +
      '<th scope="col">Where it stops — the gap</th><th scope="col">Figure</th><th scope="col">Source</th></tr></thead>' +
      '<tbody>' + rows.map(rsRowHTML).join('') + '</tbody></table></div>';
  }

  function rsChipsHTML() {
    var c = SM.research.counts();
    var types = [{ id: 'all', label: 'All' }].concat(SM.RESEARCH.types);
    var typeChips = types.map(function (t) {
      var on = rsState.type === t.id;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-rs-type="' + t.id + '" aria-pressed="' + on + '">' +
        esc(t.label) + ' <em class="mono">' + (c[t.id] || 0) + '</em></button>';
    }).join('');
    var markets = [{ id: 'all', label: 'Everywhere' }, { id: 'global', label: 'Global' }, { id: 'mexico', label: 'Mexico' }];
    var marketChips = markets.map(function (m) {
      var on = rsState.market === m.id;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-rs-market="' + m.id + '" aria-pressed="' + on + '">' +
        esc(m.label) + ' <em class="mono">' + (c[m.id] || 0) + '</em></button>';
    }).join('');
    return '<div class="chips">' + typeChips + '</div><div class="chips">' + marketChips + '</div>';
  }

  function rsCountHTML() {
    var shown = SM.research.filter({ query: rsState.query, type: rsState.type, market: rsState.market }).length;
    return shown + ' of ' + SM.RESEARCH.competitors.length + ' · ' + SM.research.sources().length + ' sources';
  }

  function rsBenchHTML() {
    return SM.RESEARCH.benchmarks.map(function (b) {
      return '<article class="rs-card">' +
        '<span class="kicker">' + esc(b.name) + ' · ' + esc(b.place) + '</span>' +
        '<p class="rs-fig">' + esc(b.figure) + '</p>' +
        '<p class="rs-unit">' + esc(b.unit) + '</p>' +
        '<p class="rs-what">' + esc(b.what) + '</p>' +
        '<p class="rs-lesson"><strong>For Style Me.</strong> ' + esc(b.lesson) + '</p>' +
        '<p class="rs-cardsrc">' + rsSourceHTML(b) + '<span class="rs-checked mono">' + esc(b.checked) + '</span></p>' +
        '</article>';
    }).join('');
  }

  function rsMexicoHTML() {
    return SM.RESEARCH.mexico.map(function (m) {
      return '<div class="rs-find' + (m.contradiction ? ' rs-contra' : '') + '">' +
        '<span class="rs-find-fig">' + esc(m.figure) + '</span>' +
        '<span class="rs-find-txt">' + esc(m.claim) +
          ' <span class="rs-find-src">' + rsSourceHTML(m) + '</span></span></div>';
    }).join('');
  }

  function rsRiskHTML() {
    var grid = SM.research.riskGrid();
    var L = SM.research.LEVELS;                    // low · medium · high
    var rows = L.slice().reverse();                // high likelihood on top
    var head = '<div class="rs-axis rs-corner"><span class="mono">likelihood ↑</span></div>' +
      L.map(function (i) { return '<div class="rs-axis">' + i + ' impact</div>'; }).join('');
    var body = rows.map(function (l) {
      return '<div class="rs-axis rs-axis-y">' + l + '</div>' + L.map(function (i) {
        var cell = grid[l + '|' + i] || [];
        var hot = (l === 'high' && i === 'high') || (l === 'high' && i === 'medium') || (l === 'medium' && i === 'high');
        return '<div class="rs-cell' + (hot && cell.length ? ' rs-hot' : '') + '">' +
          cell.map(function (r) {
            return '<button type="button" class="rs-risk" data-rs-risk="' + r.id + '">' + esc(r.name) + '</button>';
          }).join('') + '</div>';
      }).join('');
    }).join('');
    return '<div class="rs-map">' + head + body + '</div>';
  }

  function rsIntakeHTML() {
    var f = rsState.form;
    var chips = function (name, list) {
      return list.map(function (v) {
        var on = f[name] === v.id;
        return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-rs-' + name + '="' + v.id + '" aria-pressed="' + on + '">' +
          esc(v.label) + '</button>';
      }).join('');
    };
    var saved = !!rsState.savedId;
    return '<form class="rs-intake" id="rsForm" novalidate>' +
      '<h2 class="sec-title">Research intake</h2>' +
      '<label class="field" for="rsQuestion"><span>Research question</span>' +
        '<input id="rsQuestion" maxlength="' + SM.research.MAX.question + '" autocomplete="off" value="' + esc(f.question) + '" ' +
        'placeholder="Do people need help naming their taste, or just help shopping?"></label>' +
      '<label class="field" for="rsAssumption"><span>What I believe</span>' +
        '<textarea id="rsAssumption" rows="3" maxlength="' + SM.research.MAX.assumption + '" ' +
        'placeholder="People recognise a good outfit but cannot name a direction…">' + esc(f.assumption) + '</textarea></label>' +
      '<label class="field" for="rsFalsifier"><span>What would prove me wrong</span>' +
        '<textarea id="rsFalsifier" rows="3" maxlength="' + SM.research.MAX.falsifier + '" ' +
        'placeholder="If people say they already know their style and only want cheaper shopping…">' + esc(f.falsifier) + '</textarea></label>' +
      '<div class="field"><span>Market</span><div class="chips">' + chips('market', [
        { id: 'global', label: 'Global' }, { id: 'mexico', label: 'Mexico' }, { id: 'both', label: 'Both' }]) + '</div></div>' +
      '<div class="field"><span>Verdict, on today’s evidence</span><div class="chips">' + chips('verdict', [
        { id: 'real', label: 'Problem is real' }, { id: 'partly', label: 'Partly' }, { id: 'not-proven', label: 'Not proven' }]) + '</div></div>' +
      '<label class="field" for="rsNotes"><span>Notes <em>optional · stored, never shown back</em></span>' +
        '<textarea id="rsNotes" rows="3" maxlength="' + SM.research.MAX.notes + '" ' +
        'placeholder="What the validation conversation changed…">' + esc(f.notes) + '</textarea></label>' +
      '<p class="core-msg" id="rsMsg" role="alert"></p>' +
      '<button class="btn btn-primary btn-lg full" id="rsSave" type="submit"' + (saved || rsState.saving ? ' disabled' : '') + '>' +
        (saved ? ui.icon('check') + 'Saved' : 'Save this research record') + '</button>' +
      '<p class="core-save-msg" id="rsSaveMsg">' + (saved ? 'Saved to Supabase · row ' + esc(rsState.savedId.slice(0, 8)) : '') + '</p>' +
      '<p class="disclaimer">The record keeps the rows in view and the risks the map calls top priority, ' +
        'so a conclusion can be re-checked later instead of remembered.</p>' +
      '</form>';
  }

  var RS_COLUMNS = 'id,created_at,question,market,verdict,source_count';

  function rsSavedHTML(res) {
    return '<div class="core-mini-row">' + res.rows.map(function (r) {
      return '<div class="core-mini' + (r.id === rsState.savedId ? ' is-new' : '') + '">' +
        '<span class="kicker">' + esc(ui.timeAgo(Date.parse(r.created_at))) + ' · ' + esc(r.market) + '</span>' +
        '<strong>' + esc(r.question) + '</strong>' +
        '<div class="core-signals"><span class="core-sig">' + esc(r.verdict) + '</span>' +
        '<span class="core-sig">' + esc(String(r.source_count)) + ' sources</span></div></div>';
    }).join('') + '</div>';
  }

  function rsLoadSaved(root) {
    var el = root.querySelector('#rsSaved');
    if (!el) return;
    var head = '<div class="core-dash-head"><h2 class="sec-title">Saved research records</h2>';
    if (!SM.db.configured()) {
      el.innerHTML = head + '</div><p class="core-dash-note">Saved records will appear here once the database is connected.</p>';
      return;
    }
    el.innerHTML = head + '</div><p class="core-dash-note">Loading from Supabase…</p>';
    SM.db.list('research_records', { select: RS_COLUMNS, limit: 5 }).then(function (res) {
      if (!el.isConnected) return;
      if (!res.rows.length) {
        el.innerHTML = head + '</div><p class="core-dash-note">No record saved yet. The first one is the baseline.</p>';
        return;
      }
      el.innerHTML = head + '<p class="core-total"><strong>' + res.total + '</strong> <span class="kicker">in research_records</span></p></div>' +
        rsSavedHTML(res) +
        '<p class="disclaimer">The five most recent, read live from the Supabase table <code>research_records</code>. ' +
        'Notes are not among the columns the public key may read.</p>';
    }).catch(function (err) {
      if (!el.isConnected) return;
      el.innerHTML = head + '</div><p class="core-dash-note">Could not reach the database: ' + esc(err.message) + '</p>' +
        '<button class="btn sm" type="button" data-rs-retry="1">Try again</button>';
    });
  }

  /* The dashboard widget on the You screen: how much research is on
     the record, and the last question asked. Read from Supabase —
     the widget is empty until the database says otherwise. */
  function rsWidgetHTML(state) {
    var head = '<span class="kicker">Research desk</span>';
    if (!state) return head + '<p class="rs-widget-note">Loading…</p>';
    if (state.error) return head + '<p class="rs-widget-note">' + esc(state.error) + '</p>';
    if (!state.total) {
      return head + '<p class="rs-widget-note">No research record saved yet — ' +
        SM.RESEARCH.competitors.length + ' competitors and ' + SM.research.sources().length +
        ' sources are on the page.</p>';
    }
    return head +
      '<p class="rs-widget-row"><strong class="rs-widget-num">' + state.total + '</strong>' +
      '<span class="rs-widget-txt">research record' + (state.total === 1 ? '' : 's') + ' saved<br>' +
      '<em>latest: “' + esc(state.latest) + '”</em></span></p>';
  }

  function rsLoadWidget(root) {
    var el = root.querySelector('#rsWidget');
    if (!el) return;
    if (!SM.db.configured()) {
      el.innerHTML = rsWidgetHTML({ error: 'Connect the database to see saved research.' });
      return;
    }
    SM.db.list('research_records', { select: 'id,created_at,question', limit: 1 }).then(function (res) {
      if (!el.isConnected) return;
      el.innerHTML = rsWidgetHTML({ total: res.total, latest: res.rows.length ? res.rows[0].question : '' });
      var badge = root.querySelector('#rsWidgetCount');
      if (badge) badge.textContent = res.total || '';
    }).catch(function (err) {
      if (!el.isConnected) return;
      el.innerHTML = rsWidgetHTML({ error: 'Could not reach the database: ' + err.message });
    });
  }

  V.research = {
    chrome: true,
    render: function () {
      var d = SM.RESEARCH;
      return '<div class="research">' + ui.header('Research desk', { kicker: 'Week 2 · research and benchmarking' }) +
        '<p class="core-intro pad">Who else solves this, where they stop, what is different in Mexico, and what ' +
          'could sink it. Every claim below carries the source it came from and the date it was checked — ' +
          'compiled ' + esc(d.compiled) + ', by hand, from ' + SM.research.sources().length + ' sources.</p>' +

        '<div class="rs-top pad">' + rsIntakeHTML() +
          '<section class="rs-bench-sec"><h2 class="sec-title">Benchmarks — five global examples</h2>' +
            '<div class="rs-bench">' + rsBenchHTML() + '</div></section>' +
        '</div>' +

        '<section class="rs-sec pad"><h2 class="sec-title">Competitors and substitutes</h2>' +
          '<div class="rs-controls">' + rsChipsHTML() +
            '<div class="rs-search-row">' +
              '<input id="rsSearch" class="rs-search" type="search" autocomplete="off" ' +
                'placeholder="Search name, description, tag…" value="' + esc(rsState.query) + '" aria-label="Search the table">' +
              '<span class="rs-count mono" id="rsCount">' + rsCountHTML() + '</span>' +
            '</div></div>' +
          '<div id="rsTable">' + rsTableHTML() + '</div></section>' +

        '<div class="rs-two pad">' +
          '<section><h2 class="sec-title">Mexico — what is different here</h2>' + rsMexicoHTML() +
            '<p class="disclaimer">The contradiction is the finding, and it is left in: the market that says it ' +
            'worries about fast fashion is the market buying the most of it.</p></section>' +
          '<section><h2 class="sec-title">Risk map</h2>' + rsRiskHTML() +
            '<p class="disclaimer">Eight risks, placed by likelihood and impact. No score was invented; click one ' +
            'for what would be done about it.</p></section>' +
        '</div>' +

        '<section class="rs-sec pad" id="rsSaved" aria-live="polite"></section>' +
        footerHTML() + '</div>';
    },

    mount: function (root) {
      var search = root.querySelector('#rsSearch');
      var table = root.querySelector('#rsTable');
      var count = root.querySelector('#rsCount');
      var msg = root.querySelector('#rsMsg');

      function repaint() {
        table.innerHTML = rsTableHTML();
        count.textContent = rsCountHTML();
        root.querySelectorAll('[data-rs-type]').forEach(function (b) {
          var on = b.getAttribute('data-rs-type') === rsState.type;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        root.querySelectorAll('[data-rs-market]').forEach(function (b) {
          var on = b.getAttribute('data-rs-market') === rsState.market;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
      }

      search.addEventListener('input', function () { rsState.query = search.value; repaint(); });

      ['question', 'assumption', 'falsifier', 'notes'].forEach(function (k) {
        var el = root.querySelector('#rs' + k.charAt(0).toUpperCase() + k.slice(1));
        el.addEventListener('input', function () { rsState.form[k] = el.value; msg.textContent = ''; });
      });

      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-rs-type]');
        if (t) { rsState.type = t.getAttribute('data-rs-type'); repaint(); return; }

        var m = e.target.closest('[data-rs-market]');
        if (m) { rsState.market = m.getAttribute('data-rs-market'); repaint(); return; }

        var risk = e.target.closest('[data-rs-risk]');
        if (risk) { rsShowRisk(risk.getAttribute('data-rs-risk')); return; }

        ['market', 'verdict'].forEach(function (field) {
          var chip = e.target.closest('[data-rs-' + field + ']');
          if (!chip) return;
          rsState.form[field] = chip.getAttribute('data-rs-' + field);
          root.querySelectorAll('[data-rs-' + field + ']').forEach(function (b) {
            var on = b === chip;
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', String(on));
          });
        });

        if (e.target.closest('[data-rs-retry]')) rsLoadSaved(root);
      });

      root.querySelector('#rsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        rsSave(root);
      });

      rsLoadSaved(root);
    }
  };

  function rsShowRisk(id) {
    var r = SM.research.riskById(id);
    if (!r) return;
    ui.sheet({
      title: r.name,
      sub: r.likelihood + ' likelihood · ' + r.impact + ' impact',
      body: '<p class="rs-sheet-p">' + esc(r.detail) + '</p>' +
        '<p class="rs-sheet-p"><strong>What is done about it.</strong> ' + esc(r.mitigation) + '</p>'
    });
  }

  function rsSave(root) {
    var btn = root.querySelector('#rsSave');
    var msg = root.querySelector('#rsMsg');
    var note = root.querySelector('#rsSaveMsg');
    if (rsState.saving || rsState.savedId) return;

    var errors = SM.research.validate(rsState.form);
    if (errors.length) {
      msg.textContent = errors[0].message;
      var field = root.querySelector('#rs' + errors[0].field.charAt(0).toUpperCase() + errors[0].field.slice(1));
      if (field) field.focus();
      return;
    }
    msg.textContent = '';

    if (!SM.db.configured()) {
      note.className = 'core-save-msg err';
      note.textContent = 'Saving is off on this deployment: the database is not configured.';
      return;
    }

    var visible = SM.research.filter({ query: rsState.query, type: rsState.type, market: rsState.market });
    var row = SM.research.toRecord(rsState.form, visible);
    rsState.saving = true;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    SM.db.insert('research_records', row).then(function (saved) {
      rsState.saving = false;
      rsState.savedId = saved.id;
      if (!btn.isConnected) return;
      btn.innerHTML = ui.icon('check') + 'Saved';
      note.className = 'core-save-msg';
      note.textContent = 'Saved to Supabase · row ' + saved.id.slice(0, 8);
      ui.toast('Research record saved');
      rsLoadSaved(root);
    }).catch(function (err) {
      rsState.saving = false;
      if (!btn.isConnected) return;
      btn.disabled = false;
      btn.textContent = 'Save this research record';
      note.className = 'core-save-msg err';
      note.textContent = 'Could not save: ' + err.message + '. Nothing was lost — try again.';
    });
  }

  /* ============================================================
     Docs — what this is, what is real, and what comes next
     ============================================================ */
  var ROADMAP = [
    ['done', 'Style test and scoring', 'Twelve questions, ten axes, a named archetype.'],
    ['done', 'Outfit engine', 'Affinity, cohesion and colour harmony, recalculated as you like and skip.'],
    ['done', 'Layered rendering', 'Five independent layers, so one piece can change without the rest moving.'],
    ['done', 'Feed, shop, community, studio', 'The screens the product needs to be judged as a product.'],
    ['done', 'Infrastructure', 'Public repo, automatic deployment, a database project standing by.'],
    ['now', 'Style Core', 'The ten-axis method on free text, saved to Supabase — the first data that outlives the browser.'],
    ['next', 'Saved outfits in Supabase', 'Outfits and likes still live in localStorage and die with the browser.'],
    ['next', 'Real catalogue', 'Swap the demo data for a merchant feed. The item shape is already stable.'],
    ['later', 'Accounts', 'Carry a wardrobe between devices, and make the community real.'],
    ['later', 'Sizing', 'Cross the height and weight already collected with brand size charts.']
  ];

  /* Prompt library: every prompt the product uses or is designed
     around, with its status. Rendered from the constant the engine
     sits next to, so the page cannot drift from the code. */
  function promptLibraryHTML() {
    var p = SM.core.PROMPT;
    return '<section class="docs-sec docs-prompts" id="prompt-library"><h2>Prompt library</h2>' +
      '<p>Each entry is a prompt the product runs, or is built to run. One so far.</p>' +
      '<div class="prompt-entry">' +
        '<p class="prompt-meta mono">#1 · ' + esc(p.id) + ' · ' + esc(p.version) + ' · page /core</p>' +
        '<h3>Style Core extraction</h3>' +
        '<ul class="docs-list">' +
          '<li><strong>Job</strong> — free text about how someone dresses, in; ten axes, the signals behind ' +
            'them, an archetype, a thesis and a confidence level, out.</li>' +
          '<li><strong>Status</strong> — live as rules (engine <code>' + esc(SM.core.ENGINE) + '</code>), ' +
            'the same contract carried out by hand, ' + SM.core.cueCount + ' vocabulary cues. Paid APIs are ' +
            'out of scope for the course, so no model receives it yet. Saved rows record the engine, so ' +
            'model output would stay distinguishable.</li>' +
          '<li><strong>Not the model’s job</strong> — products. The catalogue engine picks the pieces from ' +
            'the axes, inside the budget, so nothing invented can reach the card.</li>' +
        '</ul>' +
        '<p class="prompt-label mono">System</p><pre class="docs-pre">' + esc(p.system) + '</pre>' +
        '<p class="prompt-label mono">User</p><pre class="docs-pre">' + esc(p.user) + '</pre>' +
      '</div></section>';
  }

  V.docs = {
    chrome: true,
    render: function () {
      var rows = ROADMAP.map(function (r) {
        return '<li class="road-row road-' + r[0] + '">' +
          '<span class="road-tag mono">' + r[0] + '</span>' +
          '<span class="road-txt"><strong>' + esc(r[1]) + '</strong><em>' + esc(r[2]) + '</em></span></li>';
      }).join('');

      return '<div class="docs">' + ui.header('Docs', { kicker: 'How this works' }) +

        '<section class="docs-sec"><h2>What Style Me is</h2>' +
        '<p>Twelve questions that are barely about clothes, then a feed of outfits built for you. ' +
        'Every outfit opens onto its credits, where any single piece can be swapped without the rest ' +
        'of the silhouette moving.</p></section>' +

        '<section class="docs-sec"><h2>Nothing here is a photograph</h2>' +
        '<p>There is no image model and no photo library. Every garment and every model is drawn in ' +
        'the browser, in SVG, at render time. Fabrics are generated pixel by pixel on a canvas once at ' +
        'start-up and reused as patterns — denim twill, knit loops, corduroy wales, leather grain.</p>' +
        '<p>That is what makes swapping one piece honest rather than a claim: changing a garment ' +
        'rewrites exactly one of five layer groups and leaves the other four nodes untouched.</p></section>' +

        '<section class="docs-sec"><h2>Real and simulated</h2>' +
        '<ul class="docs-list">' +
        '<li><strong>Real</strong> — the test and its scoring, the outfit engine, the layered rendering, ' +
        'the filters, saved items, the bag, local persistence, photo import.</li>' +
        '<li><strong>Simulated</strong> — the community profiles and their posts are generated at load, ' +
        'as are the replies in Messages.</li>' +
        '<li><strong>Simulated agent</strong> — the <a class="docs-link" href="#/core">Style Core</a> reads free text ' +
        'with rules, not a language model, and says so on every card. What it saves in Supabase is real.</li>' +
        '<li><strong>Demo catalogue</strong> — brands are real so the price tiers mean something, but ' +
        'product names and prices are invented and labelled as such. Buy buttons open a search on the ' +
        'brand’s own site, never a fabricated product page. The bag takes no payment.</li>' +
        '</ul>' +
        '<p class="muted">Nothing leaves the browser — not your answers, not your photos — except a Style Core ' +
          'you choose to save. Its description is stored, and never readable back through the public key.</p></section>' +

        promptLibraryHTML() +

        '<section class="docs-sec"><h2>Roadmap</h2><ul class="roadmap">' + rows + '</ul></section>' +

        footerHTML() + '</div>';
    }
  };

  /* Shared footer. Deliberately absent from the feed, which is full-screen. */
  function footerHTML() {
    return '<footer class="foot">' +
      '<p class="foot-mark">Style Me</p>' +
      '<p class="foot-line">Built by Eugène Triniac. Every model and garment drawn in SVG in your browser.</p>' +
      '<p class="foot-links">' +
      '<a href="https://github.com/eugenetriniac-png/style-me" target="_blank" rel="noopener"><span>Source</span></a>' +
      '<a href="#/docs"><span>Docs</span></a>' +
      '<a href="#/core"><span>Style Core</span></a>' +
      '<a href="#/research"><span>Research</span></a>' +
      '<a href="#/feed"><span>Feed</span></a></p>' +
      '<p class="foot-note mono">Demo catalogue — invented prices, no payment taken.</p>' +
      '</footer>';
  }
  SM.footerHTML = footerHTML;

  function only(root, selector, el) {
    root.querySelectorAll(selector).forEach(function (n) { n.classList.remove('on'); });
    el.classList.add('on');
  }
})(window.SM);
