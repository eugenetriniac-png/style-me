/* ============================================================
   STYLE ME — store.js
   Application state and local persistence. No account, no server:
   everything lives in this browser.
   ============================================================ */

window.SM = window.SM || {};

(function (SM) {
  'use strict';

  var KEY = 'style-me/v2';
  var fallback = null;          // used when localStorage is blocked

  function readRaw() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return fallback; }
  }
  function writeRaw(v) {
    try { window.localStorage.setItem(KEY, v); } catch (e) { fallback = v; }
  }

  function defaults() {
    return {
      version: 2,
      onboarded: false,
      profile: {
        axes: null,
        answers: {},
        seed: 'sm' + Math.floor(Math.random() * 100000),
        rev: 0
      },
      me: {
        name: 'You',
        handle: 'you',
        age: null,
        heightCm: 172,
        weightKg: null,
        skin: '#E3B48D',
        hairColour: '#2E1F16',
        hairStyle: 'short',
        build: 0.42,
        height: 0.5,
        frame: 0.45,
        photos: { face: null, front: null, side: null, back: null },
        useMe: false
      },
      likes: {},
      savedOutfits: [],
      savedItems: [],
      filters: SM.emptyFilters(),
      following: ['p5'],
      myPosts: [],
      postLikes: {},
      comments: {},
      threads: null,
      bag: []
    };
  }

  var state = null;

  SM.store = {
    get: function () {
      if (!state) {
        var raw = readRaw();
        try { state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults(); }
        catch (e) { state = defaults(); }
        if (!state.filters) state.filters = SM.emptyFilters();
        if (!state.threads) state.threads = SM.store.seedThreads();
      }
      return state;
    },

    save: function () {
      if (!state) return;
      try { writeRaw(JSON.stringify(state)); }
      catch (e) {
        /* Quota is usually the uploaded photos. Keep the face, drop
           the rest rather than losing everything else. */
        var lean = JSON.parse(JSON.stringify(state));
        lean.me.photos = { face: lean.me.photos.face, front: null, side: null, back: null };
        try { writeRaw(JSON.stringify(lean)); } catch (e2) { /* give up quietly */ }
      }
    },

    reset: function () {
      state = defaults();
      state.threads = SM.store.seedThreads();
      SM.store.save();
    },

    seedThreads: function () {
      return SM.THREAD_SEEDS.map(function (t) {
        return {
          personId: t.person,
          messages: t.messages.slice(),
          unread: t.messages.filter(function (m) { return !m.me; }).length
        };
      });
    },

    profile: function () {
      var s = SM.store.get();
      if (!s.profile.axes) s.profile.axes = SM.scoreQuiz({});
      return s.profile;
    },

    /* ---------- who wears the clothes ---------- */
    myLook: function () {
      var m = SM.store.get().me;
      return {
        skin: m.skin, hairColour: m.hairColour, hairStyle: m.hairStyle,
        build: m.build, height: m.height, frame: m.frame, photo: m.photos.face
      };
    },

    /* Models vary per outfit so the feed doesn't show the same
       body twenty times — but always the same one for a given
       outfit, so it never shuffles under you. */
    lookFor: function (outfit) {
      if (SM.store.get().me.useMe) return SM.store.myLook();
      var r = SM.rng('model' + outfit.id);
      var skins = SM.SKIN_TONES;
      var hairs = SM.HAIR_COLOURS;
      var styles = SM.HAIR_STYLES;
      return {
        skin: skins[Math.floor(r() * skins.length)].hex,
        hairColour: hairs[Math.floor(r() * hairs.length)].hex,
        hairStyle: styles[Math.floor(r() * styles.length)],
        build: 0.24 + r() * 0.5,
        height: 0.3 + r() * 0.5,
        frame: 0.2 + r() * 0.68
      };
    },

    /* ---------- likes & saves ---------- */
    isLiked: function (id) { return !!SM.store.get().likes[id]; },
    toggleLike: function (outfit) {
      var s = SM.store.get();
      var on = !s.likes[outfit.id];
      if (on) s.likes[outfit.id] = Date.now(); else delete s.likes[outfit.id];
      SM.stylist.learn(s.profile, outfit, on ? 1 : -1);
      SM.store.save();
      return on;
    },
    isSaved: function (id) { return SM.store.get().savedOutfits.indexOf(id) !== -1; },
    toggleSave: function (id) {
      var s = SM.store.get();
      var i = s.savedOutfits.indexOf(id);
      if (i === -1) s.savedOutfits.unshift(id); else s.savedOutfits.splice(i, 1);
      SM.store.save();
      return i === -1;
    },
    isItemSaved: function (id) { return SM.store.get().savedItems.indexOf(id) !== -1; },
    toggleItemSave: function (id) {
      var s = SM.store.get();
      var i = s.savedItems.indexOf(id);
      if (i === -1) s.savedItems.unshift(id); else s.savedItems.splice(i, 1);
      SM.store.save();
      return i === -1;
    },

    /* ---------- bag ---------- */
    bagCount: function () { return SM.store.get().bag.length; },
    inBag: function (id) {
      return SM.store.get().bag.some(function (b) { return b.id === id; });
    },
    addToBag: function (id, size) {
      var s = SM.store.get();
      if (!SM.store.inBag(id)) s.bag.push({ id: id, size: size || null });
      SM.store.save();
    },
    removeFromBag: function (id) {
      var s = SM.store.get();
      s.bag = s.bag.filter(function (b) { return b.id !== id; });
      SM.store.save();
    },
    bagTotal: function () {
      return SM.store.get().bag.reduce(function (a, b) {
        var it = SM.CATALOG.byId[b.id];
        return a + (it ? it.price : 0);
      }, 0);
    },

    /* ---------- community ---------- */
    isFollowing: function (id) { return SM.store.get().following.indexOf(id) !== -1; },
    toggleFollow: function (id) {
      var s = SM.store.get();
      var i = s.following.indexOf(id);
      if (i === -1) s.following.push(id); else s.following.splice(i, 1);
      SM.store.save();
      return i === -1;
    },
    togglePostLike: function (id) {
      var s = SM.store.get();
      var on = !s.postLikes[id];
      if (on) s.postLikes[id] = 1; else delete s.postLikes[id];
      SM.store.save();
      return on;
    },
    addComment: function (postId, text) {
      var s = SM.store.get();
      if (!s.comments[postId]) s.comments[postId] = [];
      s.comments[postId].push({ me: true, t: text, at: Date.now() });
      SM.store.save();
    },
    publish: function (outfitId, caption) {
      var s = SM.store.get();
      var post = { id: 'me-' + Date.now(), outfitId: outfitId, caption: caption, at: Date.now(), likes: 0 };
      s.myPosts.unshift(post);
      SM.store.save();
      return post;
    },
    deletePost: function (id) {
      var s = SM.store.get();
      s.myPosts = s.myPosts.filter(function (p) { return p.id !== id; });
      SM.store.save();
    },

    /* ---------- messages ---------- */
    thread: function (personId) {
      var s = SM.store.get();
      var t = s.threads.filter(function (x) { return x.personId === personId; })[0];
      if (!t) { t = { personId: personId, messages: [], unread: 0 }; s.threads.unshift(t); SM.store.save(); }
      return t;
    },
    sendMessage: function (personId, text) {
      var t = SM.store.thread(personId);
      t.messages.push({ me: true, t: text, at: Date.now() });
      SM.store.save();
      return t;
    },
    markRead: function (personId) {
      SM.store.thread(personId).unread = 0;
      SM.store.save();
    },
    unreadTotal: function () {
      return SM.store.get().threads.reduce(function (a, t) { return a + (t.unread || 0); }, 0);
    }
  };

  /* ---------- community posts, generated once ------------------ */
  SM.communityPosts = function () {
    if (SM._posts) return SM._posts;
    var posts = [];
    SM.PEOPLE.forEach(function (person, pi) {
      var profile = { axes: SM.normaliseAxes(person.axes), seed: person.id, rev: 0 };
      for (var k = 0; k < 3; k++) {
        var outfit = SM.stylist.build(profile, SM.emptyFilters(), person.id + ':' + k);
        var r = SM.rng(person.id + k);
        posts.push({
          id: person.id + '-' + k,
          personId: person.id,
          outfitId: outfit.id,
          caption: SM.CAPTIONS[(pi * 3 + k) % SM.CAPTIONS.length],
          likes: 40 + Math.floor(r() * 4200),
          at: Date.now() - Math.floor(r() * 1000 * 60 * 60 * 90),
          comments: SM.COMMENTS.filter(function (c) { return c.p !== person.id; })
            .slice(Math.floor(r() * 3), Math.floor(r() * 3) + 2 + Math.floor(r() * 2))
        });
      }
    });
    posts.sort(function (a, b) { return b.at - a.at; });
    SM._posts = posts;
    SM.POST_BY_ID = {};
    posts.forEach(function (p) { SM.POST_BY_ID[p.id] = p; });
    return posts;
  };
})(window.SM);
