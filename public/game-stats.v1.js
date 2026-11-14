/* Anonymous play stats for the saagarverma.com games (same beacon as /metronomes/stats.js).
   No cookies, nothing personal. It only watches the page (clicks and what the game shows);
   it never calls into or changes the game, and any error just turns it off.
   Load with: <script src="/game-stats.v1.js" data-game="bump-theory" defer></script> */
(function () {
  'use strict';
  var noop = { track: function () {} };
  window.gameStats = noop;
  try {
    var me = document.currentScript;
    var game = me && me.getAttribute('data-game');
    var params = new URLSearchParams(location.search);
    if (params.has('og') || !/^https?:$/.test(location.protocol)) return;

    var $ = function (id) { return document.getElementById(id); };
    var txt = function (id) { var el = $(id); return el ? (el.textContent || '').trim() : ''; };
    var shown = function (id) { var el = $(id); return !!el && !el.hidden; };
    // daily challenges are logged as mode "daily", n = UTC day of the year (1-366)
    var dayOfYear = function () { var d = new Date(); return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1; };

    /* Per-game wiring. Everything here only reads the DOM.
       kids: family audience, so no browser ID is stored or sent (returning = the game's own save exists).
       play: clicks that start real play. share: share actions -> how. */
    var GAMES = {
      'bump-theory': {
        saveKey: 'bt1',
        play: '#bPlay, #bMenuSand, #bDaily, #grid .tile:not(.locked), #bDrop, #inv',
        share: { mShare: 'share', mCopy: 'copy', mSave: 'save' },
        setup: function (track) {
          var lastLevel = null;
          function readLevel() {
            var small = document.querySelector('#ttl small'), t = small ? small.textContent : '';
            var m = /LEVEL\s+(\d+)/i.exec(t);
            if (m) return { m: 'level', n: +m[1] };
            if (/DAILY/i.test(t)) return { m: 'daily', n: dayOfYear() };
            if (/SANDBOX/i.test(t)) return { m: 'sandbox', n: 0 };
            return null;
          }
          function onTitle() { var l = readLevel(); if (l) { lastLevel = l; track('level', l); } }
          watch('ttl', { childList: true, subtree: true, characterData: true }, onTitle);
          onTitle();   // a ?level= link loads the level before this script runs
          watchShown('result', function () {
            var r = null;
            try { r = window.__bt && window.__bt.G && window.__bt.G.lastResult; } catch (e) {}
            if (r && typeof r.level === 'number') {
              track('result', { m: r.daily ? 'daily' : 'level', n: r.daily ? dayOfYear() : r.level + 1, won: r.stars > 0 ? 1 : 0, st: r.stars | 0, sc: r.count | 0 });
            } else if (lastLevel) {
              track('result', { m: lastLevel.m, n: lastLevel.n, won: $('rcard') && $('rcard').classList.contains('win') ? 1 : 0, sc: parseInt(txt('rnum').replace(/\D/g, ''), 10) || 0 });
            }
          });
        }
      },
      'swipe-theory': {
        kids: true,
        saveKey: 'protect-pumpkin-v1',
        // the game writes its save (sound setting) on load, so "returning" = it holds at least one star
        returning: function (raw) { try { var v = JSON.parse(raw); return !!(v && v.stars && Object.keys(v.stars).some(function (k) { return v.stars[k] > 0; })); } catch (e) { return false; } },
        play: '#bPlay, #bMenuEndless, #bDaily, #grid button[data-lv]:not([disabled]), #bRetry, #bNext',
        share: { cShare: 'share', cCopy: 'copy', cSave: 'save' },
        setup: function (track) {
          var lastLevel = null;
          function onTitle() {
            var t = txt('ttl'), m = /^(\d+)-(\d+)/.exec(t);
            var l = m ? { m: 'level', n: (+m[1] - 1) * 3 + +m[2] } : /^Endless/i.test(t) ? { m: 'endless', n: 0 } : /^Daily/i.test(t) ? { m: 'daily', n: dayOfYear() } : null;
            if (l) { lastLevel = l; track('level', l); }
          }
          watch('ttl', { childList: true, subtree: true, characterData: true }, onTitle);
          watchShown('result', function () {
            if (!lastLevel) return;
            var level = lastLevel;
            setTimeout(function () {   // the stars light up a moment after the card shows
              try {
                var won = $('rcard') && $('rcard').classList.contains('win') ? 1 : 0;
                var d = { m: level.m, n: level.n, won: won };
                if (level.m === 'endless') {
                  var s = /scored\s+([\d,]+)/i.exec(txt('rline'));
                  if (s) d.sc = parseInt(s[1].replace(/,/g, ''), 10) || 0;
                } else {
                  d.st = document.querySelectorAll('#rstars i.on').length;
                }
                track('result', d);
              } catch (e) {}
            }, 400);
          });
        }
      },
      'quiet-worlds': {
        saveKey: 'qw-bestStreak',
        play: '#bPlay, #bDaily, #bAgain, #bEndDaily',
        share: { mShare: 'share', mCopy: 'copy', mSave: 'save' },
        setup: function (track) {
          var lastKey = '', mode = 'classic';
          watch('prog', { childList: true, subtree: true, characterData: true }, function () {
            var m = /^(World|Daily)\s+(\d+)\s*\/\s*(\d+)/.exec(txt('prog'));
            if (!m) return;
            mode = m[1] === 'Daily' ? 'daily' : 'classic';
            var key = mode + m[2];
            if (key === lastKey) return;   // the bar also updates mid-round (streak)
            lastKey = key;
            track('level', { m: mode, n: +m[2] });
          });
          watchShown('end', function () {
            lastKey = '';
            var m = /Survived\s+(\d+)\s+of\s+(\d+)/i.exec(txt('endBig'));
            if (m) track('result', { m: mode, n: +m[2], sc: +m[1], won: m[1] === m[2] ? 1 : 0 });
          });
        }
      }
    };
    var cfg = GAMES[game];
    if (!cfg) return;

    function watch(id, opts, fn) {
      var el = $(id);
      if (!el || !window.MutationObserver) return;
      new MutationObserver(function () { try { fn(); } catch (e) {} }).observe(el, opts);
    }
    function watchShown(id, fn) {
      var el = $(id), was;
      if (!el || !window.MutationObserver) return;
      was = !el.hidden;
      new MutationObserver(function () {
        try { var now = !el.hidden; if (now && !was) fn(); was = now; } catch (e) {}
      }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    }

    var END = '/metronomes-api/event';
    var lsGet = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
    var rid = function () { var s = ''; for (var i = 0; i < 4; i++) s += Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'); return s; };

    var saved = lsGet(cfg.saveKey);
    var cid = '', ret = saved !== null && (!cfg.returning || cfg.returning(saved)) ? 1 : 0;
    if (!cfg.kids) {
      // the same random browser ID as the metronome game (key c2o-vid), described in the privacy policy
      cid = lsGet('c2o-vid');
      if (!cid || !/^[0-9a-f]{16}$/.test(cid)) {
        cid = rid();
        try { localStorage.setItem('c2o-vid', cid); } catch (e) {}
        if (lsGet('c2o-vid') !== cid) cid = '';
      }
    }
    var sid = rid();
    var test = lsGet('c2o-stats-test') === '1' || params.has('statstest') ? 1 : 0;
    var last = {}, sent = 0;

    function send(name, data) {
      try {
        if (sent >= 400) return;
        var now = Date.now();
        var key = name + ':' + JSON.stringify(data || {});
        if (name !== 'heartbeat' && name !== 'pageview' && last[key] && now - last[key] < 1000) return;   // the same event twice in a second counts once
        last[key] = now; sent++;
        var body = { e: name, g: game, sid: sid, test: test, d: data || {} };
        if (cid) body.cid = cid;
        body = JSON.stringify(body);
        if (navigator.sendBeacon && navigator.sendBeacon(END, new Blob([body], { type: 'text/plain' }))) return;
        if (window.fetch) fetch(END, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
      } catch (e) {}
    }

    var refHost = '';
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    send('pageview', {
      ref: refHost, ret: ret,
      us: params.get('utm_source') || '', um: params.get('utm_medium') || '', uc: params.get('utm_campaign') || '',
      tp: navigator.maxTouchPoints || 0, sw: (screen && screen.width) || 0
    });

    // visible time: a beat every 15 s while the tab is visible, plus the remainder when it hides
    var visSince = document.visibilityState === 'visible' ? Date.now() : 0;
    function flush() {
      if (!visSince) return;
      var s = Math.round((Date.now() - visSince) / 1000); visSince = document.visibilityState === 'visible' ? Date.now() : 0;
      if (s > 0) send('heartbeat', { s: Math.min(s, 60) });
    }
    setInterval(function () { if (document.visibilityState === 'visible') flush(); }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') visSince = Date.now(); else flush();
    });
    window.addEventListener('pagehide', flush);

    var played = false;
    function track(name, data) {
      try {
        if (name === 'play') { if (played) return; played = true; }
        send(name, data);
      } catch (e) {}
    }

    // play = the first real interaction; share = a share action. Capture phase, passive: the game sees every event unchanged.
    function onPress(e) {
      try {
        var t = e.target && e.target.closest ? e.target : null;
        if (!t) return;
        if (!played && t.closest(cfg.play)) track('play', {});
        if (e.type === 'click') {
          for (var id in cfg.share) {
            if (t.closest('#' + id)) { track('share', { w: cfg.share[id] }); break; }
          }
        }
      } catch (err) {}
    }
    document.addEventListener('click', onPress, { capture: true, passive: true });
    document.addEventListener('pointerdown', onPress, { capture: true, passive: true });   // a drag from the tray never becomes a click

    cfg.setup(track);
    window.gameStats = { track: track };
  } catch (e) { window.gameStats = noop; }
})();
