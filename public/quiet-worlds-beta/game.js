/* Quiet Worlds: Choose Your Planet (daily drop, a year of choices, keepsakes). Static browser game, no dependencies. (c) Saagar Verma */
(function () {
  'use strict';
  var WORLDS = (window.QW_WORLDS || []).slice(), STORY = window.QW_STORY || {}, KEEP = window.QW_KEEPSAKES || {};
  var BY = {}; WORLDS.forEach(function (w) { BY[w.slug] = w; });
  var $ = function (id) { return document.getElementById(id); };
  var stats = window.qwStats || { track: function () {}, test: 0 };
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- settings that change when the preview goes live ---------- */
  var PUBLIC_URL = 'https://saagarverma.com/quiet-worlds-beta/';
  var IMG_BASE = '/quiet-worlds/img/';
  var VOTES_API = '/quiet-worlds-api/votes';
  var LAUNCH = Date.UTC(2026, 10, 15);   // Day 1 of the daily drop (UTC)

  var DAY_MS = 864e5, YEAR = 365;
  var END_STAMP = ['YOU THRIVED', 'YOU SURVIVED THE YEAR', "YOU DIDN'T MAKE IT"];
  var END_WORD = ['thrived on', 'survived the year on', "didn't make it on"];
  var END_SHORT = ['Thrived', 'Survived', "Didn't make it"];
  var RAR = ['Common', 'Rare', 'Epic', 'Legendary'];

  /* ---------- save (one key, never throws; works in memory when storage is blocked) ---------- */
  var SAVE_KEY = 'qw2-save', storageOk = true;
  function blank() { return { v: 1, days: {}, ks: {}, run: null, free: { streak: 0, best: 0 }, muted: false, tip: 0, years: 0 }; }
  function isInt(v, lo, hi) { return typeof v === 'number' && Math.floor(v) === v && v >= lo && v <= hi; }
  function cleanDays(src) {
    var out = {};
    if (!src || typeof src !== 'object') return out;
    Object.keys(src).forEach(function (k) {
      var d = +k, r = src[k];
      if (!isInt(d, 1, 100000) || !r || !BY[r.w] || !isInt(r.e, 0, 2)) return;
      var c = Array.isArray(r.c) ? r.c.filter(function (x) { return isInt(x, 0, 2); }).slice(0, 3) : [];
      out[d] = { w: r.w, e: r.e, c: c };
    });
    return out;
  }
  function cleanKs(src) {
    var out = {};
    if (!src || typeof src !== 'object') return out;
    Object.keys(src).forEach(function (s) {
      var r = src[s];
      if (!BY[s] || !r || !isInt(r.r, 0, 3) || !isInt(r.d, 1, 100000)) return;
      out[s] = { r: r.r, d: r.d, t: typeof r.t === 'number' ? r.t : 0 };
    });
    return out;
  }
  function cleanRun(r) {
    if (!r || !BY[r.w] || !STORY[r.w] || !isInt(r.day, 1, 100000) || !Array.isArray(r.set) || r.set.length !== 4) return null;
    if (!r.set.every(function (s) { return !!BY[s]; }) || !isInt(r.b, -1, 2)) return null;
    var c = Array.isArray(r.c) ? r.c.slice(0, 3) : [];
    for (var i = 0; i < c.length; i++) if (!isInt(c[i], 0, 2)) return null;
    return { m: 'drop', off: true, day: r.day, set: r.set.slice(), w: r.w, k: r.set.indexOf(r.w), b: r.b, c: c };
  }
  function load() {
    var d = blank();
    try {
      var raw = window.localStorage.getItem(SAVE_KEY), p = raw ? JSON.parse(raw) : null;
      if (p && p.v === 1) {
        d.days = cleanDays(p.days); d.ks = cleanKs(p.ks); d.run = cleanRun(p.run);
        if (p.free) d.free = { streak: isInt(p.free.streak, 0, 1e6) ? p.free.streak : 0, best: isInt(p.free.best, 0, 1e6) ? p.free.best : 0 };
        d.muted = !!p.muted; d.tip = p.tip ? 1 : 0; d.years = isInt(p.years, 0, 1e7) ? p.years : 0;
      }
      window.localStorage.setItem(SAVE_KEY + '-probe', '1'); window.localStorage.removeItem(SAVE_KEY + '-probe');
    } catch (e) { storageOk = false; }
    return d;
  }
  var S = load();
  function persist() { try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(S)); storageOk = true; } catch (e) { storageOk = false; } }

  /* ---------- random ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

  /* ---------- days (UTC) ---------- */
  function dayOf(t) { var d = new Date(t); return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - LAUNCH) / DAY_MS) + 1; }
  function today() { return Math.max(1, dayOf(Date.now())); }
  function msToNext() { var t = Date.now(), d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - t; }
  function hms(ms) { var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); s %= 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
  function dateLabel(day) {
    var d = new Date(LAUNCH + (day - 1) * DAY_MS);
    try { return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return d.toISOString().slice(0, 10); }
  }

  /* The daily drop: one safe world + three others, the same for everyone. Safe worlds cycle without
     repeats every 24 days, the others every 16 days (3 a day), each cycle in a fresh seeded order. */
  var SAFE = WORLDS.filter(function (w) { return w.outcome === 'thrive'; });
  var RISKY = WORLDS.filter(function (w) { return w.outcome !== 'thrive'; });
  function dropSet(day) {
    var i = day - 1, perRisky = Math.floor(RISKY.length / 3);
    var cs = Math.floor(i / SAFE.length), cr = Math.floor(i / perRisky), jr = (i % perRisky) * 3;
    var safe = shuffle(SAFE.slice(), mulberry(hashStr('qw-drop-safe-' + cs)))[i % SAFE.length];
    var risky = shuffle(RISKY.slice(), mulberry(hashStr('qw-drop-risky-' + cr))).slice(jr, jr + 3);
    return shuffle([safe].concat(risky), mulberry(hashStr('qw-drop-order-' + day)));
  }
  var lastFree = [];
  function freeSet() {
    var rnd = Math.random, avoid = function (w) { return lastFree.indexOf(w.slug) < 0; };
    var safe = shuffle(SAFE.filter(avoid), rnd)[0] || SAFE[0];
    var risky = shuffle(RISKY.filter(avoid), rnd).slice(0, 3);
    var set = shuffle([safe].concat(risky), rnd);
    lastFree = set.map(function (w) { return w.slug; });
    return set;
  }

  /* ---------- endings ---------- */
  function mistakes(w, choices) {
    var st = STORY[w.slug], m = 0;
    st.beats.forEach(function (b, i) { var o = b.options[choices[i]]; if (!o || !o.ok) m++; });
    return m;
  }
  /* The safe world forgives everything, risky worlds one slip, doomed worlds none. */
  function ending(w, choices) {
    var m = mistakes(w, choices);
    if (w.outcome === 'thrive') return m === 0 ? 0 : 1;
    if (w.outcome === 'barely') return m <= 1 ? 1 : 2;
    return m === 0 ? 1 : 2;
  }
  function bestEnding(w) { return w.outcome === 'thrive' ? 0 : 1; }
  function endText(w, e) {
    var alt = STORY[w.slug].alt;
    if (w.outcome === 'thrive') return e === 0 ? w.verdict : alt;
    if (w.outcome === 'barely') return e === 1 ? w.verdict : alt;
    return e === 2 ? w.verdict : alt;
  }
  function optOrder(slug, b, n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return shuffle(a, mulberry(hashStr('qw-opt-' + slug + '-' + b))); }

  /* ---------- keepsakes ---------- */
  function rollRarity(w) {
    var odds = w.danger >= 4 ? [45, 33, 16, 6] : w.danger >= 2 ? [55, 29, 12, 4] : [62, 27, 9, 2], r = Math.random() * 100, acc = 0;
    for (var i = 0; i < 4; i++) { acc += odds[i]; if (r < acc) return i; }
    return 0;
  }
  function sprite(slug) {
    var c = document.createElement('canvas'); c.width = c.height = 16;
    var k = KEEP[slug]; if (!k || !k.px) return c;
    var g = c.getContext('2d');
    k.px.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var col = k.pal[row[x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } } });
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', k.name || 'Keepsake');
    return c;
  }
  function ksName(slug) { return (KEEP[slug] && KEEP[slug].name) || 'A keepsake'; }
  function ksNote(slug) { return (KEEP[slug] && KEEP[slug].note) || ''; }
  function ksCount() { return Object.keys(S.ks).length; }

  /* ---------- globe art (code-made, dithered like the channel's look) ---------- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function hexRGB(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function vnoise(seed) {
    var rnd = mulberry(seed), P = new Float32Array(4096);
    for (var i = 0; i < 4096; i++) P[i] = rnd();
    function h(x, y, z) { return P[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 4095]; }
    function s(t) { return t * t * (3 - 2 * t); }
    return function (x, y, z) {
      var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = s(x - xi), yf = s(y - yi), zf = s(z - zi);
      var a = h(xi, yi, zi) + (h(xi + 1, yi, zi) - h(xi, yi, zi)) * xf, b = h(xi, yi + 1, zi) + (h(xi + 1, yi + 1, zi) - h(xi, yi + 1, zi)) * xf;
      var c = h(xi, yi, zi + 1) + (h(xi + 1, yi, zi + 1) - h(xi, yi, zi + 1)) * xf, d = h(xi, yi + 1, zi + 1) + (h(xi + 1, yi + 1, zi + 1) - h(xi, yi + 1, zi + 1)) * xf;
      var e = a + (b - a) * yf, f = c + (d - c) * yf; return e + (f - e) * zf;
    };
  }
  var texCache = {};
  function globeTex(seed) {
    if (texCache[seed]) return texCache[seed];
    var n = vnoise(seed), W = 128, H = 64, t = new Float32Array(W * H);
    for (var j = 0; j < H; j++) {
      var lat = (j + 0.5) / H * Math.PI - Math.PI / 2;
      for (var i = 0; i < W; i++) {
        var lon = (i + 0.5) / W * Math.PI * 2, x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
        t[j * W + i] = 0.65 * n(x * 2.1 + 9, y * 2.1 + 9, z * 2.1 + 9) + 0.35 * n(x * 5 + 40, y * 5 + 40, z * 5 + 40);
      }
    }
    return (texCache[seed] = t);
  }
  function q(v, b) { var l = Math.round(v / 255 * 21 + b); return Math.max(0, Math.min(21, l)) * 255 / 21; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function drawGlobe(cv, w, rot, eerie) {
    var S2 = cv.width, g = cv.getContext('2d'), pal = (w.palette || ['#6b7fd6', '#f2c46b', '#ffe6a8']).map(hexRGB);
    var seed = hashStr(w.slug || w.name), tex = globeTex(seed % 997 + 1), ring = (seed % 3) === 0;
    var img = g.createImageData(S2, S2), D = img.data, c = S2 / 2, r = S2 * 0.34;
    var L = [-0.55, -0.45, 0.7], ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
    if (eerie) pal = [mix(pal[0], [40, 20, 60], 0.55), mix(pal[1], [150, 40, 60], 0.5), [255, 90, 90]];
    for (var py = 0; py < S2; py++) for (var px = 0; px < S2; px++) {
      var nx = (px + 0.5 - c) / r, ny = (py + 0.5 - c) / r, d2 = nx * nx + ny * ny, o = (py * S2 + px) * 4, col, a = 255;
      if (d2 > 1) {
        var dd = Math.sqrt(d2); if (dd > 1.18) { D[o + 3] = 0; continue; }
        var gl = Math.pow(1 - (dd - 1) / 0.18, 2) * 0.55; col = pal[2]; a = 255 * gl;
      } else {
        var nz = Math.sqrt(1 - d2), lat = Math.asin(Math.max(-1, Math.min(1, ny))), lon = Math.atan2(nx, nz) + rot;
        var u = ((lon / (Math.PI * 2)) % 1 + 1) % 1, v = (lat + Math.PI / 2) / Math.PI;
        var tv = tex[Math.min(63, Math.floor(v * 64)) * 128 + Math.floor(u * 128) % 128];
        var base = tv < 0.42 ? mix(pal[0], [10, 12, 30], 0.35) : tv < 0.56 ? pal[0] : tv < 0.66 ? mix(pal[0], pal[1], 0.5) : pal[1];
        if (Math.abs(ny) > 0.86) base = mix(base, [240, 240, 250], 0.6);
        var lit = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), sh = 0.16 + 0.9 * lit, rim = Math.pow(1 - nz, 3) * 0.6;
        col = [base[0] * sh + pal[2][0] * rim, base[1] * sh + pal[2][1] * rim, base[2] * sh + pal[2][2] * rim];
        if (eerie && lit < 0.12 && tv > 0.63) col = [255, 210, 120];
      }
      var bb = (BAYER[(py & 3) * 4 + (px & 3)] / 16 - 0.5) * 0.9;
      D[o] = q(col[0], bb); D[o + 1] = q(col[1], bb); D[o + 2] = q(col[2], bb); D[o + 3] = a;
    }
    g.clearRect(0, 0, S2, S2);
    var ringCol = 'rgba(' + pal[2].join(',') + ',0.8)';
    function ringArc(a0, a1) { g.save(); g.translate(c, c); g.rotate(-0.32); g.strokeStyle = ringCol; g.lineWidth = Math.max(1, S2 / 48); g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.42, 0, a0, a1); g.stroke(); g.restore(); }
    if (ring) ringArc(Math.PI, Math.PI * 2);
    var tmp = drawGlobe.tmp || (drawGlobe.tmp = document.createElement('canvas'));
    tmp.width = S2; tmp.height = S2; tmp.getContext('2d').putImageData(img, 0, 0); g.drawImage(tmp, 0, 0);
    if (ring) ringArc(0, Math.PI);
  }

  /* Art element for a world: our rendered still (WebP) or a code-drawn planet. */
  var imgCache = {};
  function loadImg(src) { if (imgCache[src]) return imgCache[src]; var im = new Image(); im.decoding = 'async'; im.src = src; imgCache[src] = im; return im; }
  function artSrc(w, which) { return IMG_BASE + w.slug + '-' + which + '.webp?v=1'; }
  function artEl(w, which, alt, size) {
    if (w.img) { var im = loadImg(artSrc(w, which)).cloneNode(); im.alt = alt || ''; im.draggable = false; return im; }
    var cv = document.createElement('canvas'); cv.width = cv.height = size || 96; cv.style.imageRendering = 'pixelated';
    cv.style.background = which === 'b' ? 'radial-gradient(circle at 50% 45%, #2a1030, #0a0714 70%)' : 'radial-gradient(circle at 50% 45%, #1d2350, #0a0b1a 70%)';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', alt || w.name);
    drawGlobe(cv, w, (hashStr(w.slug) % 100) / 16, which === 'b'); return cv;
  }
  function preload(w) { if (w && w.img) { loadImg(artSrc(w, 'a')); loadImg(artSrc(w, 'b')); } }

  /* ---------- starfield ---------- */
  var sky = $('sky'), sg = sky.getContext('2d'), stars = [], skyW = 0, skyH = 0, shoot = null, mood = 0, moodT = 0;
  function skyResize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1); skyW = window.innerWidth; skyH = window.innerHeight;
    sky.width = Math.round(skyW * dpr); sky.height = Math.round(skyH * dpr); sg.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(skyW * skyH / 3600), rnd = mulberry(7); stars = [];
    for (var i = 0; i < n; i++) stars.push({ x: rnd() * skyW, y: rnd() * skyH, r: rnd() < 0.08 ? 1.6 : 0.6 + rnd() * 0.8, p: rnd() * 6.28, s: 0.4 + rnd() * 1.4, c: rnd() < 0.15 ? '#ffd9a0' : rnd() < 0.2 ? '#bcd0ff' : '#ffffff' });
    drawSky(0);
  }
  function neb(x, y, r, c) { var g = sg.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = g; sg.fillRect(0, 0, skyW, skyH); }
  function mixHex(a, b, t) { var m = mix(a, b, t); return 'rgb(' + (m[0] | 0) + ',' + (m[1] | 0) + ',' + (m[2] | 0) + ')'; }
  function drawSky(t) {
    mood += (moodT - mood) * 0.02;
    var g = sg.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, mixHex([10, 11, 28], [20, 8, 22], mood)); g.addColorStop(1, mixHex([18, 16, 44], [34, 10, 26], mood));
    sg.fillStyle = g; sg.fillRect(0, 0, skyW, skyH);
    neb(skyW * 0.18, skyH * 0.22, skyW * 0.6, mood > 0.5 ? 'rgba(160,50,80,0.13)' : 'rgba(120,90,220,0.12)');
    neb(skyW * 0.85, skyH * 0.75, skyW * 0.7, 'rgba(244,200,110,0.07)');
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], a = 0.45 + 0.55 * Math.sin(t * 0.001 * s.s + s.p) * 0.5 + 0.25;
      sg.globalAlpha = Math.max(0.1, Math.min(1, a)); sg.fillStyle = s.c; sg.fillRect(s.x, s.y, s.r, s.r);
    }
    sg.globalAlpha = 1;
    if (!reduceMotion) {
      if (!shoot && Math.random() < 0.002) shoot = { x: Math.random() * skyW, y: Math.random() * skyH * 0.5, t: 0 };
      if (shoot) {
        shoot.t += 1; var k = shoot.t / 50, x = shoot.x + k * 220, y = shoot.y + k * 90;
        var lg = sg.createLinearGradient(x - 60, y - 25, x, y); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,' + (0.7 * (1 - k)) + ')');
        sg.strokeStyle = lg; sg.lineWidth = 1.4; sg.beginPath(); sg.moveTo(x - 60, y - 25); sg.lineTo(x, y); sg.stroke();
        if (shoot.t > 50) shoot = null;
      }
    }
  }
  var running = true, lastFrame = 0;
  function loop(t) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (t - lastFrame < 33) return; lastFrame = t;
    if (!reduceMotion) drawSky(t);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; audio.suspend(); }
    else if (!running) { running = true; requestAnimationFrame(loop); audio.resume(); tick(); }
  });

  /* ---------- sound (all synthesised, starts after the first tap) ---------- */
  var audio = (function () {
    var ctx = null, master = null, padFilter = null, verbIn = null, chimeTimer = null;
    var SCALE = [196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
    function init() {
      if (ctx || S.muted) return;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 3);
      verbIn = ctx.createGain(); verbIn.gain.value = 0.5;
      var d1 = ctx.createDelay(1), d2 = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      d1.delayTime.value = 0.31; d2.delayTime.value = 0.47; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2200;
      verbIn.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(master);
      padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 520; padFilter.Q.value = 0.6;
      var padGain = ctx.createGain(); padGain.gain.value = 0.05; padFilter.connect(padGain); padGain.connect(master); padGain.connect(verbIn);
      [[98, -6], [98, 7], [146.8, 0], [196, 4], [246.9, -3]].forEach(function (f) {
        var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f[0]; o.detune.value = f[1];
        var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05 + Math.random() * 0.07; lg.gain.value = 6;
        lfo.connect(lg); lg.connect(o.detune); o.connect(padFilter); o.start(); lfo.start();
      });
      scheduleChime();
    }
    function scheduleChime() {
      clearTimeout(chimeTimer);
      chimeTimer = setTimeout(function () { if (ctx && !S.muted && !document.hidden) chime(SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1), 0.035, 3.5); scheduleChime(); }, 2600 + Math.random() * 5200);
    }
    function chime(f, g, dur, type, when) {
      if (!ctx || S.muted) return;
      var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), a = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = f; a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(a); a.connect(master); a.connect(verbIn); o.start(t); o.stop(t + dur + 0.05);
    }
    function swell(f, g, dur) {
      if (!ctx || S.muted) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), a = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 1.5; o2.detune.value = 12;
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + dur * 0.4); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(a); o2.connect(a); a.connect(master); a.connect(verbIn); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
    }
    function setMood(m) { if (ctx && padFilter) padFilter.frequency.setTargetAtTime(m ? 260 : 520, ctx.currentTime, 1.2); }
    return {
      init: init,
      toggle: function () {
        S.muted = !S.muted; persist();
        if (S.muted) { if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.1); setTimeout(function () { if (S.muted && ctx) ctx.suspend(); }, 400); } }
        else { if (!ctx) init(); else { ctx.resume(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4); } }
      },
      suspend: function () { if (ctx) ctx.suspend(); }, resume: function () { if (ctx && !S.muted) ctx.resume(); },
      select: function (i) { chime(SCALE[[2, 3, 4, 5][i] || 4], 0.06, 0.9); },
      confirm: function () { chime(392, 0.05, 1.2); chime(587.3, 0.04, 1.4, 'sine', 0.09); },
      choice: function (eerie) { setMood(eerie ? 1 : 0); chime(eerie ? 233.1 : 440, 0.045, 1.4, eerie ? 'triangle' : 'sine'); if (eerie) swell(55, 0.1, 2.4); },
      tick: function (i) { chime(300 + i * 70, 0.04, 0.25, 'square'); },
      outcome: function (e) {
        setMood(0);
        if (e === 0) { [392, 493.9, 587.3, 784].forEach(function (f, i) { chime(f, 0.06, 2.2, 'sine', i * 0.12); }); }
        else if (e === 1) { chime(293.7, 0.06, 2, 'sine'); chime(392, 0.05, 2.2, 'sine', 0.22); chime(440, 0.04, 2, 'sine', 0.45); }
        else { swell(41.2, 0.2, 3.5); chime(233.1, 0.05, 2.5, 'triangle', 0.1); chime(220, 0.05, 3, 'triangle', 0.5); }
      },
      found: function () { [523.3, 659.3, 784, 1046.5].forEach(function (f, i) { chime(f, 0.05, 1.8, 'sine', 0.6 + i * 0.1); }); }
    };
  })();
  function syncMuteIcon() { var m = S.muted; $('sndOn').style.display = m ? 'none' : ''; $('sndOff').style.display = m ? '' : 'none'; $('bMute').setAttribute('aria-pressed', String(!m)); }
  $('bMute').addEventListener('click', function () { audio.toggle(); syncMuteIcon(); });
  document.addEventListener('pointerdown', function first() { audio.init(); document.removeEventListener('pointerdown', first, true); }, true);
  document.addEventListener('keydown', function firstk() { audio.init(); document.removeEventListener('keydown', firstk, true); }, true);

  /* ---------- "% of players picked this" ---------- */
  var VOTES = {}, voteWaiters = [];
  function votes(w, day) { var v = VOTES[w + ':' + day]; return v && typeof v === 'object' ? v : null; }
  function fetchVotes(w, day) {
    var key = w + ':' + day;
    if (VOTES[key]) return;
    if (!window.fetch || !/^https?:$/.test(location.protocol)) { VOTES[key] = 'fail'; return; }
    VOTES[key] = 'loading';
    var url = VOTES_API + '?w=' + encodeURIComponent(w) + '&day=' + day + (stats.test ? '&beta=1' : '');
    var done = function (v) { VOTES[key] = v; var ws = voteWaiters; voteWaiters = []; ws.forEach(function (f) { try { f(); } catch (e) {} }); };
    try {
      fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { done(j && j.ok ? j : 'fail'); }, function () { done('fail'); });
    } catch (e) { done('fail'); }
  }
  function whenVotes(fn) { voteWaiters.push(fn); }
  function vote(name, data) { if (R && R.off) stats.track(name, data); }

  /* ---------- screens + navigation ---------- */
  var SCREENS = ['start', 'drop', 'year', 'end', 'past', 'shelf'], current = 'start', histPushed = false, ignorePop = false;
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    current = id;
    document.body.classList.toggle('ingame', id !== 'start');
    if (id !== 'start' && !histPushed) { try { history.pushState({ qw: 1 }, ''); histPushed = true; } catch (e) {} }
    window.scrollTo(0, 0);
  }
  function setProg(html) { $('prog').innerHTML = html || ''; }
  function goStart() {
    clearTimers(); closeSheets(); moodT = 0; R = null; D = null;
    if (histPushed) { histPushed = false; ignorePop = true; try { history.back(); } catch (e) { ignorePop = false; } }
    setProg(''); refreshStart(); show('start');
  }
  window.addEventListener('popstate', function () {
    if (ignorePop) { ignorePop = false; return; }
    histPushed = false;
    if (openSheet()) { closeSheets(); if (current !== 'start') { try { history.pushState({ qw: 1 }, ''); histPushed = true; } catch (e) {} } return; }
    if (current !== 'start') goStart();
  });

  /* ---------- start ---------- */
  function refreshStart() {
    var t = today(), done = S.days[t], line = $('stLine'), btn = $('bToday');
    if (S.run) {
      var w = BY[S.run.w], st = STORY[S.run.w], b = S.run.b;
      line.textContent = 'Your year on ' + w.name + ' is waiting. Day ' + (b < 0 ? 1 : st.beats[b].day) + ' of 365.';
      btn.textContent = 'Continue your year';
    } else if (done) {
      line.innerHTML = '';
      line.appendChild(document.createTextNode('You ' + END_WORD[done.e] + ' ' + BY[done.w].name + ' today. Next four planets in '));
      var b2 = document.createElement('b'); b2.className = 'cdv'; b2.textContent = hms(msToNext()); line.appendChild(b2);
      line.appendChild(document.createTextNode('.'));
      btn.textContent = "Explore today's planets";
    } else {
      line.textContent = 'Four new planets every day. Only one is safe. Survive a year.';
      btn.textContent = "See today's planets";
    }
    renderedDay = t;
  }

  /* ---------- drop: four planets ---------- */
  var D = null, R = null;
  function openToday() {
    if (S.run) { R = S.run; R.k = R.set.indexOf(R.w); fetchVotes(R.w, R.day); showYear(); return; }
    openDrop(today(), 'drop');
  }
  function openDrop(day, m) {
    var set = m === 'free' ? freeSet() : dropSet(day);
    D = { m: m, day: day, set: set, sel: -1 };
    set.forEach(preload);
    var mine = m !== 'free' && S.days[day] ? S.days[day] : null;
    var l1 = $('dropL1'), l2 = $('dropL2'), sub = $('dropSub'), note = $('dropNote');
    sub.innerHTML = ''; note.hidden = true;
    if (m === 'free') {
      l1.textContent = 'Free play'; l2.textContent = 'One of these is safe. Survive a year.';
      sub.textContent = 'Practice. Years survived in a row: ' + S.free.streak + ' (best ' + S.free.best + ')';
      setProg('Free play');
    } else if (m === 'drop') {
      l1.textContent = "Today's four planets"; l2.textContent = 'Exactly one is safe. Survive a year.';
      sub.appendChild(document.createTextNode('Day #' + day + ' · next four planets in '));
      var b = document.createElement('b'); b.className = 'cdv'; b.textContent = hms(msToNext()); sub.appendChild(b);
      setProg('Day <b>#' + day + '</b>');
    } else {
      l1.textContent = 'Day #' + day + ' · ' + dateLabel(day); l2.textContent = 'Exactly one is safe. Survive a year.';
      sub.textContent = 'Practice: keepsakes only drop on the day itself.';
      setProg('Past · Day <b>#' + day + '</b>');
    }
    if (mine) {
      note.textContent = 'You ' + END_WORD[mine.e] + ' ' + BY[mine.w].name + (m === 'drop' ? ' today' : ' that day') + '. Other years here are practice.';
      note.hidden = false;
    }
    var grid = $('grid'); grid.innerHTML = ''; grid.classList.remove('picked');
    set.forEach(function (w, k) {
      var b2 = document.createElement('button'); b2.className = 'card'; b2.type = 'button';
      b2.setAttribute('role', 'radio'); b2.setAttribute('aria-checked', 'false');
      b2.setAttribute('aria-label', 'Planet ' + (k + 1) + ': ' + w.name + '. ' + w.promise);
      var pic = document.createElement('div'); pic.className = 'pic'; pic.appendChild(artEl(w, 'a', ''));
      var num = document.createElement('span'); num.className = 'num'; num.textContent = '0' + (k + 1); pic.appendChild(num);
      if (mine && mine.w === w.slug) { var mn = document.createElement('span'); mn.className = 'mine'; mn.textContent = 'YOUR PICK'; pic.appendChild(mn); }
      var tx = document.createElement('div'); tx.className = 'txt';
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = w.name;
      var pr = document.createElement('div'); pr.className = 'pr'; pr.textContent = w.promise;
      tx.appendChild(nm); tx.appendChild(pr); b2.appendChild(pic); b2.appendChild(tx);
      b2.addEventListener('click', function () { selectPlanet(k); });
      grid.appendChild(b2);
    });
    $('bChoose').disabled = true; $('bChoose').textContent = 'Pick a planet';
    show('drop');
  }
  function selectPlanet(k) {
    if (!D) return;
    D.sel = k; var cards = $('grid').children;
    for (var i = 0; i < cards.length; i++) { cards[i].classList.toggle('sel', i === k); cards[i].setAttribute('aria-checked', String(i === k)); }
    $('grid').classList.add('picked');
    $('bChoose').disabled = false; $('bChoose').textContent = 'Live on ' + D.set[k].name + ' for a year';
    audio.select(k);
  }
  function confirmPlanet() {
    if (!D || D.sel < 0) return;
    var w = D.set[D.sel], t = today();
    var off = D.m === 'drop' && D.day === t && !S.days[t] && !S.run;
    R = { m: D.m, off: off, day: D.day, set: D.set.map(function (x) { return x.slug; }), w: w.slug, k: D.sel, b: -1, c: [] };
    if (off) { S.run = R; persist(); }
    stats.track('play', {});
    stats.track('level', { m: D.m === 'drop' ? 'daily' : 'classic', n: D.day });
    vote('qw_pick', { w: w.slug, day: R.day });
    fetchVotes(w.slug, R.m === 'free' ? t : R.day);
    audio.confirm();
    showYear();
  }

  /* ---------- the year ---------- */
  function runLabel() { return R.m === 'free' ? 'Free play' : R.off ? 'Day #' + R.day : R.m === 'drop' ? 'Practice' : 'Past #' + R.day; }
  function showYear() {
    var w = BY[R.w], st = STORY[R.w];
    var pic = $('yPic'); Array.prototype.slice.call(pic.querySelectorAll('img,canvas')).forEach(function (n) { n.remove(); });
    pic.insertBefore(artEl(w, 'a', w.name), pic.firstChild);
    $('yName').textContent = w.name;
    var tr = $('yTrack'); Array.prototype.slice.call(tr.querySelectorAll('.mk')).forEach(function (n) { n.remove(); });
    st.beats.forEach(function (b) { var mk = document.createElement('i'); mk.className = 'mk'; mk.style.left = (b.day / YEAR * 100) + '%'; tr.appendChild(mk); });
    setProg(runLabel() + ' · <b>' + escapeHtml(w.name) + '</b>');
    show('year');
    renderBeat();
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function renderBeat() {
    var w = BY[R.w], st = STORY[R.w], b = R.b, opts = $('yOpts');
    opts.innerHTML = ''; opts.className = 'opts'; $('yRes').textContent = ''; $('yCrowd').textContent = '';
    var day = b < 0 ? 1 : st.beats[b].day;
    $('yDay').textContent = 'DAY ' + day;
    $('yFill').style.width = (day / YEAR * 100) + '%';
    Array.prototype.forEach.call($('yTrack').querySelectorAll('.mk'), function (mk, i) { mk.classList.toggle('done', i < b || (i === b && R.c[b] != null)); });
    var img = $('yPic').querySelector('img,canvas');
    if (img) img.style.filter = b < 1 ? '' : b === 1 ? 'saturate(.9) brightness(.92)' : 'saturate(.78) brightness(.84) hue-rotate(-8deg)';
    if (b < 0) {
      $('yText').textContent = st.arrive;
      $('yNext').textContent = 'Begin the year';
      $('yNextWrap').hidden = false;
      if (R.m !== 'free') { showPickShare(); whenVotes(function () { if (R && R.b < 0 && current === 'year') showPickShare(); }); }
      return;
    }
    var beat = st.beats[b];
    $('yText').textContent = beat.text;
    optOrder(R.w, b, beat.options.length).forEach(function (oi, pos) {
      var o = beat.options[oi], btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'opt'; btn.dataset.o = oi;
      btn.innerHTML = '<span class="bar"></span><span class="lab"></span><span class="pct"></span>';
      btn.querySelector('.lab').textContent = o.t;
      btn.setAttribute('aria-keyshortcuts', String(pos + 1));
      btn.addEventListener('click', function () { chooseOption(oi); });
      opts.appendChild(btn);
    });
    if (R.c[b] != null) { markChosen(); } else { $('yNextWrap').hidden = true; }
  }
  function showPickShare() {
    var v = votes(R.w, R.day), el = $('yCrowd'), w = BY[R.w];
    if (!v) { el.textContent = ''; return; }
    var p = v.pick && v.pick.pct ? v.pick.pct[R.w] : null;
    el.textContent = v.pick && v.pick.pct ? (p || 0) + '% of players picked ' + w.name + (R.day === today() ? ' today.' : ' on day #' + R.day + '.') : '';
  }
  function chooseOption(oi) {
    var b = R.b; if (b < 0 || R.c[b] != null) return;
    R.c[b] = oi;
    if (R.off) { S.run = R; persist(); }
    vote('qw_choice', { w: R.w, b: b + 1, o: oi });
    var o = STORY[R.w].beats[b].options[oi];
    audio.choice(!o.ok);
    markChosen();
    setTimeout(function () {
      try { var r = $('yNextWrap').getBoundingClientRect(); if (r.bottom > window.innerHeight) $('yNextWrap').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' }); } catch (e) {}
    }, 120);
  }
  function markChosen() {
    var b = R.b, oi = R.c[b], beat = STORY[R.w].beats[b], opts = $('yOpts');
    opts.classList.add('done');
    Array.prototype.forEach.call(opts.children, function (btn) {
      btn.disabled = true;
      if (+btn.dataset.o === oi) { btn.classList.add('chosen'); btn.setAttribute('aria-pressed', 'true'); }
    });
    $('yRes').textContent = beat.options[oi].r;
    $('yNext').textContent = b < 2 ? 'Continue' : 'See day 365';
    $('yNextWrap').hidden = false;
    Array.prototype.forEach.call($('yTrack').querySelectorAll('.mk'), function (mk, i) { mk.classList.toggle('done', i <= b); });
    showBeatShares();
    whenVotes(function () { if (R && R.b === b && current === 'year') showBeatShares(); });
  }
  function showBeatShares() {
    var b = R.b, oi = R.c[b], v = votes(R.w, R.m === 'free' ? today() : R.day), opts = $('yOpts'), el = $('yCrowd');
    var raw = VOTES[R.w + ':' + (R.m === 'free' ? today() : R.day)];
    if (raw === 'loading') { el.textContent = ''; return; }
    var pct = v && v.beats && v.beats[b] ? v.beats[b].pct : null;
    if (!pct) { el.textContent = 'Too few players have been here yet. You are one of the first.'; return; }
    opts.classList.add('shown');
    Array.prototype.forEach.call(opts.children, function (btn) {
      var p = pct[+btn.dataset.o] || 0;
      btn.querySelector('.pct').textContent = p + '%';
      btn.querySelector('.bar').style.width = p + '%';
      btn.setAttribute('aria-label', btn.querySelector('.lab').textContent + ', ' + p + '% of players');
    });
    el.textContent = (pct[oi] || 0) + '% of players chose the same.';
  }
  function nextBeat() {
    if (!R) return;
    if (R.b >= 0 && R.c[R.b] == null) return;
    if (R.b < 2) { R.b++; if (R.off) { S.run = R; persist(); } renderBeat(); window.scrollTo(0, 0); return; }
    finishYear();
  }

  /* ---------- day 365 ---------- */
  var timers = [], endDone = false;
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, reduceMotion ? Math.min(ms, 80) : ms)); }
  function finishYear() {
    var w = BY[R.w], e = ending(w, R.c);
    R.e = e; R.ks = '';
    if (R.off) {
      S.days[R.day] = { w: R.w, e: e, c: R.c.slice() }; S.run = null;
      if (e === bestEnding(w)) {
        if (S.ks[R.w]) R.ks = 'have';
        else { S.ks[R.w] = { r: rollRarity(w), d: R.day, t: Date.now() }; R.ks = 'new'; }
      } else R.ks = 'missed';
      vote('qw_end', { w: R.w, r: e, day: R.day });
    } else R.ks = R.m === 'free' ? 'free' : 'practice';
    if (R.m === 'free') { if (e < 2) { S.free.streak++; S.free.best = Math.max(S.free.best, S.free.streak); } else S.free.streak = 0; }
    S.years++;
    persist();
    stats.track('result', { m: R.m === 'drop' && R.off ? 'daily' : 'classic', n: R.day, won: e === bestEnding(w) ? 1 : 0, sc: e });
    showEnd();
  }
  function showEnd() {
    var w = BY[R.w], e = R.e; clearTimers(); endDone = false;
    var pic = $('rvPic'); pic.classList.remove('secret');
    Array.prototype.slice.call(pic.querySelectorAll('img,canvas')).forEach(function (n) { n.remove(); });
    var a = artEl(w, 'a', w.name), b = artEl(w, 'b', 'The secret of ' + w.name); a.classList.add('a'); b.classList.add('b');
    pic.insertBefore(b, pic.firstChild); pic.insertBefore(a, pic.firstChild);
    $('rvStamp').className = 'stamp e' + e; $('rvSt').textContent = END_STAMP[e]; $('rvVerdict').textContent = endText(w, e);
    $('rvName').textContent = w.name; $('rvSecret').textContent = w.secret; $('rvRule').textContent = 'The rule: ' + w.rule;
    var blocks = $('rvMeter').querySelectorAll('i'); for (var i = 0; i < 5; i++) blocks[i].className = '';
    renderEndCrowd(); whenVotes(function () { if (current === 'end' && R) renderEndCrowd(); });
    renderEndKs();
    var ol = $('rvOtherList'); ol.innerHTML = '';
    R.set.forEach(function (s) {
      if (s === R.w) return;
      var x = BY[s], li = document.createElement('li'), bb = document.createElement('b'), o = document.createElement('span');
      bb.textContent = x.name; o.className = 'o ' + x.outcome; o.textContent = x.outcome === 'thrive' ? 'THE SAFE ONE' : x.outcome === 'barely' ? 'RISKY' : 'DOOMED';
      li.appendChild(bb); li.appendChild(document.createTextNode(x.secret + ' ')); li.appendChild(o); ol.appendChild(li);
    });
    $('rvOthers').open = false;
    $('rvTip').hidden = !(R.off && !S.tip && !isStandalone());
    setEndButtons();
    ['rvSecretWrap', 'rvRest'].forEach(function (id) { $(id).classList.remove('on'); });
    $('bSkip').hidden = false;
    setProg(runLabel() + ' · <b>' + escapeHtml(w.name) + '</b>');
    show('end');
    audio.outcome(e);
    at(900, function () { pic.classList.add('secret'); moodT = e === 2 ? 1 : 0; });
    at(1500, function () { $('rvSecretWrap').classList.add('on'); });
    for (var m = 0; m < w.danger; m++) (function (m) { at(1900 + m * 200, function () { blocks[m].className = 'f' + w.danger; audio.tick(m); }); })(m);
    at(2100 + w.danger * 200, finishEnd);
  }
  function finishEnd() {
    if (endDone) return; endDone = true; clearTimers();
    var w = BY[R.w], blocks = $('rvMeter').querySelectorAll('i');
    $('rvPic').classList.add('secret');
    for (var m = 0; m < 5; m++) blocks[m].className = m < w.danger ? 'f' + w.danger : '';
    $('rvSecretWrap').classList.add('on'); $('rvRest').classList.add('on');
    $('bSkip').hidden = true; moodT = 0;
    if (R.ks === 'new') { $('rvKs').classList.add('new'); audio.found(); }
    tick();
  }
  function renderEndCrowd() {
    var el = $('rvCrowd'), v = votes(R.w, R.m === 'free' ? today() : R.day), raw = VOTES[R.w + ':' + (R.m === 'free' ? today() : R.day)];
    el.innerHTML = '<h3>How other players\' years ended here</h3>';
    var pct = v && v.end ? v.end.pct : null;
    if (!pct) {
      var p = document.createElement('p'); p.className = 'few';
      p.textContent = raw === 'loading' ? 'Checking...' : 'Not enough players have finished a year here yet. You are one of the first.';
      el.appendChild(p); return;
    }
    ['thrived', 'survived', 'lost'].forEach(function (k, i) {
      var row = document.createElement('div'); row.className = 'cbar e' + i + (i === R.e ? ' me' : '');
      var lab = document.createElement('span'); lab.textContent = END_SHORT[i] + (i === R.e ? ' (you)' : '');
      var num = document.createElement('b'); num.textContent = (pct[k] || 0) + '%';
      var t = document.createElement('span'); t.className = 't'; var fill = document.createElement('i'); t.appendChild(fill);
      row.appendChild(lab); row.appendChild(num); row.appendChild(t); el.appendChild(row);
      requestAnimationFrame(function () { fill.style.width = (pct[k] || 0) + '%'; });
    });
  }
  function renderEndKs() {
    var box = $('rvKs'), w = BY[R.w], k = S.ks[R.w], found = R.ks === 'new' || R.ks === 'have';
    box.className = 'ks' + (found ? ' found rar' + k.r : ' lost');
    box.innerHTML = '<div class="spr"></div><div class="kt"><h3></h3><div class="kn"></div><p class="kd"></p></div>';
    box.querySelector('.spr').appendChild(sprite(R.w));
    var h = box.querySelector('h3'), kn = box.querySelector('.kn'), kd = box.querySelector('.kd');
    if (R.ks === 'new') { h.textContent = 'Keepsake found · ' + RAR[k.r]; kn.textContent = ksName(R.w); kd.textContent = ksNote(R.w); }
    else if (R.ks === 'have') { h.textContent = 'Already on your shelf · ' + RAR[k.r]; kn.textContent = ksName(R.w); kd.textContent = 'Rarity is rolled once, so yours stays ' + RAR[k.r].toLowerCase() + '.'; }
    else {
      h.textContent = 'A keepsake was hidden here';
      kn.textContent = k ? ksName(R.w) : '???';
      kd.textContent = R.ks === 'missed' ? 'Reach ' + w.name + "'s best ending on a day it drops to find it." :
        R.ks === 'free' ? 'Free play is practice. Keepsakes only drop on daily planets.' :
        'This was practice. Keepsakes only drop on your first planet of the day.';
      if (k) { box.className = 'ks found rar' + k.r; kd.textContent = 'You found this one before (' + RAR[k.r].toLowerCase() + ').'; h.textContent = 'On your shelf'; }
    }
  }
  function setEndButtons() {
    var main = $('bEndMain'), a = $('bEndA'), b = $('bEndB'), cd = $('rvCd');
    cd.innerHTML = '';
    if (R.m === 'free') {
      main.textContent = 'Next planet'; main.onclick = function () { openDrop(today(), 'free'); };
      a.textContent = 'Share'; a.onclick = share;
      cd.textContent = 'Years survived in a row: ' + S.free.streak + ' (best ' + S.free.best + ')';
    } else {
      main.textContent = 'Share my year'; main.onclick = share;
      if (R.m === 'past') { a.textContent = 'Past planets'; a.onclick = function () { openPast(); }; }
      else { a.textContent = 'Other planets'; a.onclick = function () { openDrop(today(), 'drop'); }; }
      cd.appendChild(document.createTextNode('Next four planets in '));
      var bb = document.createElement('b'); bb.className = 'cdv'; bb.textContent = hms(msToNext()); cd.appendChild(bb);
    }
    b.textContent = 'Home'; b.onclick = goStart;
  }

  /* ---------- past planets ---------- */
  var pastShown = 30;
  function openPast() { pastShown = 30; renderPast(); setProg(''); show('past'); }
  function renderPast() {
    var list = $('pastList'), t = today(); list.innerHTML = '';
    if (t <= 1) {
      var em = document.createElement('p'); em.className = 'empty';
      em.textContent = 'No past planets yet. Day #1 is today, ' + dateLabel(1) + '. Tomorrow, today\'s four will wait here.';
      list.appendChild(em); $('bPastMore').hidden = true; return;
    }
    var last = Math.max(1, t - pastShown);
    for (var d = t - 1; d >= last; d--) (function (d) {
      var set = dropSet(d), mine = S.days[d], btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'day';
      var th = document.createElement('span'); th.className = 'th';
      set.forEach(function (w) {
        var el;
        if (w.img) { el = document.createElement('img'); el.loading = 'lazy'; el.decoding = 'async'; el.alt = ''; el.src = artSrc(w, 'a'); }
        else el = artEl(w, 'a', '', 40);
        th.appendChild(el);
      });
      var dt = document.createElement('span'); dt.className = 'dt';
      var bb = document.createElement('b'); bb.textContent = 'Day #' + d + ' · ' + dateLabel(d);
      var sm = document.createElement('small');
      if (mine) { sm.className = 'e' + mine.e; sm.textContent = 'You ' + END_WORD[mine.e] + ' ' + BY[mine.w].name; }
      else sm.textContent = 'Not played · ' + set.map(function (w) { return w.name; }).join(', ');
      dt.appendChild(bb); dt.appendChild(sm);
      btn.appendChild(th); btn.appendChild(dt);
      btn.setAttribute('aria-label', 'Day ' + d + ', ' + dateLabel(d) + '. ' + sm.textContent);
      btn.addEventListener('click', function () { openDrop(d, 'past'); });
      list.appendChild(btn);
    })(d);
    $('bPastMore').hidden = last <= 1;
  }

  /* ---------- keepsake shelf ---------- */
  var shelfFilter = 'all';
  function openShelf() { renderShelf(); setProg('<b>' + ksCount() + '</b>/' + WORLDS.length); show('shelf'); }
  function renderShelf() {
    var n = ksCount(), counts = [0, 0, 0, 0];
    Object.keys(S.ks).forEach(function (s) { counts[S.ks[s].r]++; });
    $('shelfLead').textContent = n ? n + ' of ' + WORLDS.length + ' keepsakes found.' : 'Your shelf is empty. Reach a planet\'s best ending on the day it drops to find its keepsake.';
    $('shelfWarn').hidden = storageOk;
    var chips = $('chips'); chips.innerHTML = '';
    [['all', 'All', n]].concat(RAR.map(function (r, i) { return [String(i), r, counts[i]]; })).forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (c[0] === 'all' ? '' : ' rar' + c[0]);
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(shelfFilter === c[0]));
      b.innerHTML = (c[0] === 'all' ? '' : '<i></i>') + '<span></span>';
      b.querySelector('span').textContent = c[1] + ' ' + c[2];
      b.addEventListener('click', function () { shelfFilter = c[0]; renderShelf(); });
      chips.appendChild(b);
    });
    var grid = $('shelfGrid'), empty = $('shelfEmpty'); grid.innerHTML = '';
    var list = WORLDS.filter(function (w) { return shelfFilter === 'all' || (S.ks[w.slug] && String(S.ks[w.slug].r) === shelfFilter); });
    list.forEach(function (w) {
      var k = S.ks[w.slug], b = document.createElement('button'); b.type = 'button';
      b.className = 'slot' + (k ? ' found rar' + k.r : '');
      b.appendChild(sprite(w.slug));
      if (k) { var dot = document.createElement('span'); dot.className = 'rd'; b.appendChild(dot); }
      b.setAttribute('aria-label', k ? ksName(w.slug) + ', ' + RAR[k.r] + ', from ' + w.name : 'Not found yet: hidden on ' + w.name);
      b.addEventListener('click', function () { openKs(w.slug); });
      grid.appendChild(b);
    });
    empty.hidden = list.length > 0;
    if (!list.length) empty.textContent = 'No ' + RAR[+shelfFilter].toLowerCase() + ' keepsakes yet.';
  }
  function openKs(slug) {
    var w = BY[slug], k = S.ks[slug], box = $('ksBig'); box.innerHTML = '';
    box.className = 'kbig' + (k ? ' rar' + k.r : '');
    var rk = document.createElement('div'); rk.className = 'rk'; rk.textContent = k ? RAR[k.r].toUpperCase() : 'NOT FOUND YET';
    var cv = sprite(slug); if (!k) cv.style.filter = 'brightness(0) opacity(.45)';
    var kn = document.createElement('h2'); kn.id = 'ksH'; kn.className = 'kn'; kn.textContent = k ? ksName(slug) : 'Hidden on ' + w.name;
    var p = document.createElement('p');
    p.textContent = k ? ksNote(slug) + ' Found on ' + w.name + ', day #' + k.d + ' (' + dateLabel(k.d) + ').' : 'Reach ' + w.name + "'s best ending on a day it drops, and this keepsake is yours.";
    box.appendChild(cv); box.appendChild(rk); box.appendChild(kn); box.appendChild(p);
    openSheetEl('ksSheet');
  }

  /* ---------- sheets ---------- */
  var SHEETS = ['menuSheet', 'saveSheet', 'a2hsSheet', 'ksSheet'], lastFocus = null;
  function openSheet() { for (var i = 0; i < SHEETS.length; i++) if (!$(SHEETS[i]).hidden) return SHEETS[i]; return !$('modal').hidden ? 'modal' : null; }
  function openSheetEl(id) {
    closeSheets(true); lastFocus = document.activeElement;
    $(id).hidden = false;
    var f = $(id).querySelector('.in > .row button, .in > button.mi, .in > button') || $(id).querySelector('button'); try { if (f) f.focus({ preventScroll: true }); } catch (e) {}
  }
  function closeSheets(keepFocus) {
    SHEETS.forEach(function (id) { $(id).hidden = true; }); $('modal').hidden = true;
    if (!keepFocus && lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} lastFocus = null; }
  }
  SHEETS.forEach(function (id) {
    var el = $(id);
    el.addEventListener('click', function (e) { if (e.target === el || (e.target.closest && e.target.closest('[data-close]'))) closeSheets(); });
  });
  function openMenu() {
    var t = today();
    $('miPast').textContent = t > 1 ? (t - 1) + (t - 1 === 1 ? ' day' : ' days') : 'From tomorrow';
    $('miShelf').textContent = ksCount() + '/' + WORLDS.length;
    $('miFree').textContent = S.free.best ? 'Best streak ' + S.free.best : 'Practice';
    $('miA2hs').hidden = isStandalone();
    openSheetEl('menuSheet');
  }
  $('menuSheet').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-go]'); if (!b) return;
    var go = b.getAttribute('data-go'); closeSheets(true);
    if (go === 'past') openPast();
    else if (go === 'shelf') openShelf();
    else if (go === 'free') openDrop(today(), 'free');
    else if (go === 'save') openSave();
    else if (go === 'a2hs') openA2hs();
    else if (go === 'how') { try { $('how-it-works').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (err) {} }
  });

  /* ---------- save code (copy on one phone, load on another) ---------- */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function exportCode() {
    var json = JSON.stringify({ v: 1, d: S.days, k: S.ks, f: S.free });
    return 'QW1-' + hashStr(json).toString(36) + '-' + b64e(json);
  }
  function importCode(str) {
    var m = /^QW1-([0-9a-z]+)-([A-Za-z0-9_-]+)$/.exec(String(str || '').replace(/\s+/g, ''));
    if (!m) return 'That does not look like a Quiet Worlds save code.';
    var json, p;
    try { json = b64d(m[2]); p = JSON.parse(json); } catch (e) { return 'That code is damaged. Copy it again, all of it.'; }
    if (hashStr(json).toString(36) !== m[1] || !p || p.v !== 1) return 'That code is damaged. Copy it again, all of it.';
    var days = cleanDays(p.d), ks = cleanKs(p.k), addedD = 0, addedK = 0;
    Object.keys(days).forEach(function (d) { if (!S.days[d]) { S.days[d] = days[d]; addedD++; } });
    Object.keys(ks).forEach(function (s) { if (!S.ks[s]) { S.ks[s] = ks[s]; addedK++; } });
    if (p.f && isInt(p.f.best, 0, 1e6)) S.free.best = Math.max(S.free.best, p.f.best);
    persist();
    return 'Loaded: ' + addedK + ' new keepsake' + (addedK === 1 ? '' : 's') + ' and ' + addedD + ' day' + (addedD === 1 ? '' : 's') + '. Keepsakes you already had kept their rarity.' + (storageOk ? '' : ' (This browser is not saving, so it lasts until you close the page.)');
  }
  function openSave() { $('saveOut').value = exportCode(); $('saveIn').value = ''; $('saveMsg').textContent = ''; openSheetEl('saveSheet'); }
  $('bSaveCopy').addEventListener('click', function () { copy($('saveOut').value, 'Save code copied.'); });
  $('saveOut').addEventListener('focus', function () { try { this.select(); } catch (e) {} });
  $('bSaveLoad').addEventListener('click', function () {
    var v = $('saveIn').value.trim();
    if (!v) { $('saveMsg').textContent = 'Paste a code first.'; return; }
    $('saveMsg').textContent = importCode(v);
    $('saveOut').value = exportCode(); refreshStart();
  });

  /* ---------- add to home screen (no notifications, ever) ---------- */
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; });
  window.addEventListener('appinstalled', function () { installEvt = null; S.tip = 1; persist(); $('rvTip').hidden = true; });
  function isStandalone() { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } }
  function openA2hs() {
    var ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|YouTube|GSA\//i.test(ua);
    var steps = inApp ? ['Open this page in ' + (ios ? 'Safari' : 'Chrome') + ' first: tap the menu (three dots) and choose Open in browser.', ios ? 'In Safari, tap the Share button, then Add to Home Screen.' : 'In Chrome, open the menu and tap Add to Home screen.'] :
      ios ? ['Tap the Share button (the square with an arrow) in Safari\'s toolbar.', 'Scroll down and tap Add to Home Screen.', 'Tap Add. Quiet Worlds now opens from your home screen.'] :
      /Android/i.test(ua) ? ['Tap the menu (three dots) in your browser.', 'Tap Add to Home screen or Install app.', 'Tap Add.'] :
      ['In Chrome or Edge, click the install icon at the right of the address bar.', 'Or open the browser menu and choose Install Quiet Worlds.'];
    var ol = $('a2hsSteps'); ol.innerHTML = '';
    steps.forEach(function (s) { var li = document.createElement('li'); li.textContent = s; ol.appendChild(li); });
    ol.hidden = !!installEvt; $('a2hsInstallRow').hidden = !installEvt;
    openSheetEl('a2hsSheet');
  }
  $('bInstall').addEventListener('click', function () {
    if (!installEvt) return;
    try { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; closeSheets(); }, function () {}); } catch (e) {}
  });
  $('bTipHow').addEventListener('click', openA2hs);
  $('bTipX').addEventListener('click', function () { S.tip = 1; persist(); $('rvTip').hidden = true; });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { try { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {}); } catch (e) {} });
  }

  /* ---------- share card ---------- */
  function wrapLines(g, text, maxW) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  function drawCover(g, el, x, y, w, h) {
    var iw = el.naturalWidth || el.width, ih = el.naturalHeight || el.height; if (!iw || !ih) return;
    var s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    g.drawImage(el, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', ECOL = ['#8fe39a', '#ffb35c', '#ff6b6b'], RCOL = ['#b9b4cc', '#6fb4ff', '#c58cff', '#ffcf5c'];
  function makeCard() {
    var w = BY[R.w], e = R.e, W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a0b1c'); bg.addColorStop(1, '#1b1840'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var rnd = mulberry(11); for (var i = 0; i < 240; i++) { g.globalAlpha = 0.25 + rnd() * 0.7; g.fillStyle = '#fff'; var r = rnd() < 0.1 ? 3 : 1.6; g.fillRect(rnd() * W, rnd() * H, r, r); }
    g.globalAlpha = 1; g.textAlign = 'center';
    g.fillStyle = '#f4c86e'; g.font = '52px VT, monospace';
    g.fillText(R.m === 'free' ? 'QUIET WORLDS  ·  FREE PLAY' : 'QUIET WORLDS  ·  DAY #' + R.day, W / 2, 96);
    var ix = 110, iy = 130, iw = W - 220, ih = 520;
    g.save(); roundRect(g, ix, iy, iw, ih, 26); g.clip(); g.fillStyle = '#15162c'; g.fillRect(ix, iy, iw, ih);
    var el = w.img ? imgCache[artSrc(w, 'b')] : artEl(w, 'b');
    try { if (el && (el.complete === undefined || el.complete)) { g.imageSmoothingEnabled = !!w.img; drawCover(g, el, ix, iy, iw, ih); g.imageSmoothingEnabled = true; } } catch (err) {}
    g.restore();
    g.lineWidth = 6; g.strokeStyle = ECOL[e]; roundRect(g, ix, iy, iw, ih, 26); g.stroke();
    g.fillStyle = 'rgba(8,9,20,0.88)'; roundRect(g, ix + 24, iy + ih - 92, 330, 68, 14); g.fill();
    g.fillStyle = '#f5efe3'; g.font = '50px VT, monospace'; g.textAlign = 'left'; g.fillText('DAY 365', ix + 48, iy + ih - 42); g.textAlign = 'center';
    g.fillStyle = '#f4c86e'; g.font = '92px VT, monospace'; g.fillText(w.name, W / 2, 750);
    g.fillStyle = ECOL[e]; g.font = '64px VT, monospace'; g.fillText(END_STAMP[e], W / 2, 822);
    g.fillStyle = '#c9c3d8'; g.font = '500 32px ' + SANS;
    wrapLines(g, endText(w, e), W - 260).slice(0, 3).forEach(function (ln, k) { g.fillText(ln, W / 2, 880 + k * 44); });
    var k2 = S.ks[R.w], hasK = R.ks === 'new' || R.ks === 'have';
    var by = 1025, bw = W - 240;
    g.fillStyle = 'rgba(27,28,54,0.95)'; roundRect(g, 120, by, bw, 150, 22); g.fill();
    if (hasK) {
      g.strokeStyle = RCOL[k2.r]; g.lineWidth = 3; roundRect(g, 120, by, bw, 150, 22); g.stroke();
      g.imageSmoothingEnabled = false; g.drawImage(sprite(R.w), 150, by + 15, 120, 120); g.imageSmoothingEnabled = true;
      g.textAlign = 'left'; g.fillStyle = RCOL[k2.r]; g.font = '700 26px ' + SANS; g.fillText((R.ks === 'new' ? 'KEEPSAKE FOUND  ·  ' : 'KEEPSAKE  ·  ') + RAR[k2.r].toUpperCase(), 300, by + 62);
      g.fillStyle = '#f5efe3'; g.font = '56px VT, monospace'; g.fillText(ksName(R.w), 300, by + 116); g.textAlign = 'center';
    } else {
      g.fillStyle = '#c9c3d8'; g.font = '46px VT, monospace'; g.fillText(e === bestEnding(w) ? 'A year well lived.' : 'The keepsake stayed hidden.', W / 2, by + 90);
    }
    g.fillStyle = '#f5efe3'; g.font = '46px VT, monospace'; g.fillText('Which planet would you pick?', W / 2, H - 100);
    g.fillStyle = '#f4c86e'; g.font = '44px VT, monospace'; g.fillText(PUBLIC_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, H - 50);
    return cv;
  }
  function shareText() {
    var w = BY[R.w], k = S.ks[R.w], hasK = R.ks === 'new' || R.ks === 'have';
    return (R.m === 'free' ? 'Quiet Worlds: ' : 'Quiet Worlds Day #' + R.day + ': ') + 'I picked ' + w.name + ' and ' + ['thrived', 'survived the year', "didn't make it"][R.e] + '.' +
      (hasK ? ' Keepsake: ' + ksName(R.w) + ' (' + RAR[k.r] + ').' : '') + ' Which planet would you pick? ' + PUBLIC_URL;
  }
  var cardBlob = null;
  function share() {
    if (!R || R.e == null) return;
    var go = function () {
      var cv = makeCard(), url = cv.toDataURL('image/png');
      $('cardImg').src = url; $('mSave').href = url; cardBlob = null;
      try { cv.toBlob(function (b) { cardBlob = b; }, 'image/png'); } catch (e) {}
      lastFocus = document.activeElement; $('modal').hidden = false;
      try { $('mShare').focus({ preventScroll: true }); } catch (e) {}
    };
    var w = BY[R.w], waits = [];
    if (w.img) { var im = loadImg(artSrc(w, 'b')); if (!im.complete) waits.push(new Promise(function (res) { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); setTimeout(res, 2500); })); }
    var fontP = document.fonts && document.fonts.load ? document.fonts.load('40px VT') : Promise.resolve();
    Promise.all(waits.concat([fontP.catch(function () {})])).then(go, go);
  }
  function nativeShare() {
    var text = shareText();
    try {
      if (cardBlob && navigator.canShare) {
        var f = new File([cardBlob], 'quiet-worlds-year.png', { type: 'image/png' });
        if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], text: text }).catch(function () {}); return; }
      }
      if (navigator.share) { navigator.share({ text: text }).catch(function () {}); return; }
    } catch (e) {}
    copy(text);
  }
  function copy(text, msg) {
    var ok = function () { toast(msg || 'Copied. Paste it anywhere.'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text, msg); }); return; } } catch (e) {}
    fallbackCopy(text, msg);
  }
  function fallbackCopy(text, msg) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg || 'Copied. Paste it anywhere.'); } catch (e) { toast('Could not copy. Select the text and copy it.'); }
    ta.remove();
  }
  var toastT = null;
  function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 2400); }

  /* ---------- countdown ---------- */
  var renderedDay = 0;
  function tick() {
    var left = hms(msToNext());
    Array.prototype.forEach.call(document.querySelectorAll('.cdv'), function (el) { el.textContent = left; });
    if (today() !== renderedDay && current === 'start') refreshStart();
  }
  setInterval(function () { if (!document.hidden) tick(); }, 1000);

  /* ---------- wire up ---------- */
  $('bToday').addEventListener('click', openToday);
  $('bMore').addEventListener('click', openMenu);
  $('bChoose').addEventListener('click', confirmPlanet);
  $('yNext').addEventListener('click', function () { if (R && R.b < 0) { R.b = 0; if (R.off) { S.run = R; persist(); } renderBeat(); window.scrollTo(0, 0); } else nextBeat(); });
  $('bSkip').addEventListener('click', finishEnd);
  $('bHome').addEventListener('click', goStart);
  $('bPastMore').addEventListener('click', function () { pastShown += 60; renderPast(); });
  $('bBack').addEventListener('click', function (e) { if (current === 'start') return; e.preventDefault(); goStart(); });
  $('mShare').addEventListener('click', function () { stats.track('share', { w: 'share' }); nativeShare(); });
  $('mCopy').addEventListener('click', function () { stats.track('share', { w: 'copy' }); copy(shareText()); });
  $('mSave').addEventListener('click', function () { stats.track('share', { w: 'save' }); });
  $('mClose').addEventListener('click', function () { closeSheets(); });
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (openSheet()) { if (e.key === 'Escape') closeSheets(); return; }
    if (current === 'drop') {
      if (e.key >= '1' && e.key <= '4') { selectPlanet(+e.key - 1); e.preventDefault(); }
      else if (e.key === 'Enter' && D && D.sel >= 0 && !(document.activeElement && document.activeElement.classList.contains('card'))) { confirmPlanet(); e.preventDefault(); }
    } else if (current === 'year' && R) {
      var opts = $('yOpts').children;
      if (e.key >= '1' && e.key <= String(opts.length) && R.b >= 0 && R.c[R.b] == null) { opts[+e.key - 1].click(); e.preventDefault(); }
      else if (e.key === 'Enter' && !$('yNextWrap').hidden && document.activeElement === document.body) { $('yNext').click(); e.preventDefault(); }
    } else if (current === 'end' && !endDone && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { finishEnd(); e.preventDefault(); }
  });
  window.addEventListener('resize', skyResize);

  skyResize(); syncMuteIcon(); refreshStart(); show('start');
  requestAnimationFrame(loop);
  /* test hooks for the headless checks (read-only helpers) */
  window.__qw = { dropSet: function (d) { return dropSet(d).map(function (w) { return w.slug; }); }, today: today, ending: function (s, c) { return ending(BY[s], c); }, save: function () { return JSON.parse(JSON.stringify(S)); }, storageOk: function () { return storageOk; }, exportCode: exportCode };
})();
