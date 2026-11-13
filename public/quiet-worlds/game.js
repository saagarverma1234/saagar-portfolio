/* Quiet Worlds: Choose Your Planet. Static browser game, no dependencies. (c) Saagar Verma */
(function () {
  'use strict';
  var WORLDS = (window.QW_WORLDS || []).slice();
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- storage (never throws) ---------- */
  var store = {
    get: function (k, d) { try { var v = window.localStorage.getItem('qw-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem('qw-' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- random ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffle(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

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
  /* Draws a dithered planet into a low-res canvas `cv` (size px square). */
  function drawGlobe(cv, w, rot, eerie) {
    var S = cv.width, g = cv.getContext('2d'), pal = (w.palette || ['#6b7fd6', '#f2c46b', '#ffe6a8']).map(hexRGB);
    var seed = hashStr(w.slug || w.name), tex = globeTex(seed % 997 + 1), ring = (seed % 3) === 0;
    var img = g.createImageData(S, S), D = img.data, c = S / 2, r = S * 0.34;
    var L = [-0.55, -0.45, 0.7], ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
    if (eerie) pal = [mix(pal[0], [40, 20, 60], 0.55), mix(pal[1], [150, 40, 60], 0.5), [255, 90, 90]];
    for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
      var nx = (px + 0.5 - c) / r, ny = (py + 0.5 - c) / r, d2 = nx * nx + ny * ny, o = (py * S + px) * 4, col, a = 255;
      if (d2 > 1) {
        var dd = Math.sqrt(d2); if (dd > 1.18) { D[o + 3] = 0; continue; }
        var gl = Math.pow(1 - (dd - 1) / 0.18, 2) * 0.55; col = pal[2]; a = 255 * gl;
      } else {
        var nz = Math.sqrt(1 - d2), lat = Math.asin(Math.max(-1, Math.min(1, ny))), lon = Math.atan2(nx, nz) + rot;
        var u = ((lon / (Math.PI * 2)) % 1 + 1) % 1, v = (lat + Math.PI / 2) / Math.PI;
        var tv = tex[Math.min(63, Math.floor(v * 64)) * 128 + Math.floor(u * 128) % 128];
        var base = tv < 0.42 ? mix(pal[0], [10, 12, 30], 0.35) : tv < 0.56 ? pal[0] : tv < 0.66 ? mix(pal[0], pal[1], 0.5) : pal[1];
        if (Math.abs(ny) > 0.86) base = mix(base, [240, 240, 250], 0.6);
        var lit = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), sh = 0.16 + 0.9 * lit;
        var rim = Math.pow(1 - nz, 3) * 0.6;
        col = [base[0] * sh + pal[2][0] * rim, base[1] * sh + pal[2][1] * rim, base[2] * sh + pal[2][2] * rim];
        if (eerie && lit < 0.12 && tv > 0.63) col = [255, 210, 120];
      }
      var b = (BAYER[(py & 3) * 4 + (px & 3)] / 16 - 0.5) * 0.9;
      D[o] = q(col[0], b); D[o + 1] = q(col[1], b); D[o + 2] = q(col[2], b); D[o + 3] = a;
    }
    g.clearRect(0, 0, S, S);
    var ringCol = 'rgba(' + pal[2].join(',') + ',0.8)';
    if (ring) { g.save(); g.translate(c, c); g.rotate(-0.32); g.strokeStyle = ringCol; g.lineWidth = Math.max(1, S / 48); g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.42, 0, Math.PI, Math.PI * 2); g.stroke(); g.restore(); }
    var tmp = drawGlobe.tmp || (drawGlobe.tmp = document.createElement('canvas'));
    tmp.width = S; tmp.height = S; tmp.getContext('2d').putImageData(img, 0, 0); g.drawImage(tmp, 0, 0);
    if (ring) { g.save(); g.translate(c, c); g.rotate(-0.32); g.strokeStyle = ringCol; g.lineWidth = Math.max(1, S / 48); g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.42, 0, 0, Math.PI); g.stroke(); g.restore(); }
  }
  function q(v, b) { var l = Math.round(v / 255 * 21 + b); return Math.max(0, Math.min(21, l)) * 255 / 21; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /* Art element for a world: our rendered still (WebP) or a code-drawn planet. */
  var imgCache = {};
  function loadImg(src) {
    if (imgCache[src]) return imgCache[src];
    var im = new Image(); im.decoding = 'async'; im.src = src; imgCache[src] = im; return im;
  }
  function artSrc(w, which) { return 'img/' + w.slug + '-' + which + '.webp?v=1'; }
  function artEl(w, which, alt) {
    if (w.img) { var im = loadImg(artSrc(w, which)).cloneNode(); im.alt = alt || ''; im.draggable = false; return im; }
    var cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; cv.style.imageRendering = 'pixelated';
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
    if (reduceMotion) drawSky(0);
  }
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
  function neb(x, y, r, c) { var g = sg.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = g; sg.fillRect(0, 0, skyW, skyH); }
  function mixHex(a, b, t) { var m = mix(a, b, t); return 'rgb(' + (m[0] | 0) + ',' + (m[1] | 0) + ',' + (m[2] | 0) + ')'; }

  /* menu globes: the 2x2 intro grid from the episodes */
  var gcv = $('globes'), gg = gcv.getContext('2d'), menuWorlds = [], lowCv = [];
  function setupMenuGlobes() {
    var pick = shuffle(WORLDS.slice(), mulberry(Date.now() & 0xffff)).slice(0, 4);
    menuWorlds = pick; lowCv = pick.map(function () { var c = document.createElement('canvas'); c.width = c.height = 88; return c; });
  }
  function drawMenu(t) {
    var r = gcv.getBoundingClientRect(); if (!r.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(r.width * dpr);
    if (gcv.width !== W) { gcv.width = W; gcv.height = W; }
    gg.clearRect(0, 0, W, W); gg.imageSmoothingEnabled = false;
    var h = W / 2;
    for (var i = 0; i < 4; i++) {
      var x = (i % 2) * h, y = Math.floor(i / 2) * h;
      drawGlobe(lowCv[i], menuWorlds[i], t * 0.00018 * (i % 2 ? 1 : -1) + i, false);
      var bob = reduceMotion ? 0 : Math.sin(t * 0.0012 + i * 1.7) * h * 0.02;
      gg.drawImage(lowCv[i], x + h * 0.04, y + h * 0.02 + bob, h * 0.92, h * 0.92);
      gg.font = Math.round(h * 0.13) + 'px VT, monospace'; gg.textAlign = 'center';
      var lab = '0' + (i + 1), tw = gg.measureText(lab).width;
      gg.fillStyle = 'rgba(8,9,20,0.85)'; gg.fillRect(x + h / 2 - tw / 2 - h * 0.04, y + h * 0.83, tw + h * 0.08, h * 0.13);
      gg.fillStyle = '#f5efe3'; gg.fillText(lab, x + h / 2, y + h * 0.935);
    }
  }

  var running = true, lastFrame = 0;
  function loop(t) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (t - lastFrame < 30) return; lastFrame = t;
    if (!reduceMotion) drawSky(t);
    if (!$('menu').hidden && (!reduceMotion || !drawMenu.done)) { drawMenu(t); drawMenu.done = true; }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; audio.suspend(); }
    else if (!running) { running = true; requestAnimationFrame(loop); audio.resume(); }
  });

  /* ---------- sound (all synthesised, starts after the first tap) ---------- */
  var audio = (function () {
    var ctx = null, master = null, padFilter = null, verbIn = null, muted = store.get('muted', false), chimeTimer = null, padNodes = [];
    var SCALE = [196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
    function init() {
      if (ctx || muted) return;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 3);
      // simple feedback-delay "reverb"
      verbIn = ctx.createGain(); verbIn.gain.value = 0.5;
      var d1 = ctx.createDelay(1), d2 = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      d1.delayTime.value = 0.31; d2.delayTime.value = 0.47; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2200;
      verbIn.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(master);
      // pad
      padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 520; padFilter.Q.value = 0.6;
      var padGain = ctx.createGain(); padGain.gain.value = 0.05; padFilter.connect(padGain); padGain.connect(master); padGain.connect(verbIn);
      [[98, -6], [98, 7], [146.8, 0], [196, 4], [246.9, -3]].forEach(function (f) {
        var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f[0]; o.detune.value = f[1];
        var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05 + Math.random() * 0.07; lg.gain.value = 6;
        lfo.connect(lg); lg.connect(o.detune); o.connect(padFilter); o.start(); lfo.start(); padNodes.push(o);
      });
      scheduleChime();
    }
    function scheduleChime() {
      clearTimeout(chimeTimer);
      chimeTimer = setTimeout(function () { if (ctx && !muted && !document.hidden) chime(SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1), 0.035, 3.5); scheduleChime(); }, 2600 + Math.random() * 5200);
    }
    function chime(f, g, dur, type, when) {
      if (!ctx || muted) return;
      var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), a = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = f; a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.02); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(a); a.connect(master); a.connect(verbIn); o.start(t); o.stop(t + dur + 0.05);
    }
    function swell(f, g, dur) {
      if (!ctx || muted) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), a = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 1.5; o2.detune.value = 12;
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + dur * 0.4); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(a); o2.connect(a); a.connect(master); a.connect(verbIn); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
    }
    function setMood(m) { if (ctx && padFilter) padFilter.frequency.setTargetAtTime(m ? 260 : 520, ctx.currentTime, 1.2); }
    return {
      init: init, muted: function () { return muted; },
      toggle: function () {
        muted = !muted; store.set('muted', muted);
        if (muted) { if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.1); setTimeout(function () { if (muted && ctx) ctx.suspend(); }, 400); } }
        else { if (!ctx) init(); else { ctx.resume(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4); } }
        return muted;
      },
      suspend: function () { if (ctx) ctx.suspend(); }, resume: function () { if (ctx && !muted) ctx.resume(); },
      select: function (i) { chime(SCALE[[2, 3, 4, 5][i] || 4], 0.06, 0.9); },
      confirm: function () { chime(392, 0.05, 1.2); chime(587.3, 0.04, 1.4, 'sine', 0.09); },
      but: function () { setMood(1); swell(55, 0.16, 3.2); chime(110, 0.05, 2.5, 'triangle'); },
      tick: function (i) { chime(300 + i * 70, 0.04, 0.25, 'square'); },
      outcome: function (o) {
        setMood(0);
        if (o === 'thrive') { [392, 493.9, 587.3, 784].forEach(function (f, i) { chime(f, 0.06, 2.2, 'sine', i * 0.12); }); }
        else if (o === 'barely') { chime(293.7, 0.06, 2, 'sine'); chime(392, 0.05, 2.2, 'sine', 0.22); chime(415.3, 0.03, 2, 'triangle', 0.45); }
        else { swell(41.2, 0.2, 3.5); chime(233.1, 0.05, 2.5, 'triangle', 0.1); chime(220, 0.05, 3, 'triangle', 0.5); }
      },
      end: function () { [261.6, 329.6, 392, 523.3, 659.3].forEach(function (f, i) { chime(f, 0.05, 2.6, 'sine', i * 0.16); }); }
    };
  })();
  function syncMuteIcon() { var m = audio.muted(); $('sndOn').style.display = m ? 'none' : ''; $('sndOff').style.display = m ? '' : 'none'; $('bMute').setAttribute('aria-pressed', String(!m)); }
  $('bMute').addEventListener('click', function () { audio.toggle(); syncMuteIcon(); });
  document.addEventListener('pointerdown', function first() { audio.init(); document.removeEventListener('pointerdown', first, true); }, true);
  document.addEventListener('keydown', function firstk() { audio.init(); document.removeEventListener('keydown', firstk, true); }, true);

  /* ---------- game ---------- */
  var DAILY_N = 5, CLASSIC_N = 10, EPOCH = Date.UTC(2026, 10, 13);
  var OUT = { thrive: 'YOU THRIVED', barely: 'BARELY SURVIVED', doomed: "DIDN'T MAKE IT" };
  var OUT_SHORT = { thrive: 'THRIVED', barely: 'BARELY', doomed: 'LOST' };
  var ASK = [['Choose a Planet', 'You must survive 1 year here'], ['Pick a World', 'You must survive 1 year here'], ['Select a Planet', 'Survive one whole year'], ['Choose a World', 'You must live here for a year']];
  var G = null, selIdx = -1, revealTimers = [], revealDone = false;

  function todayKey() { var d = new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
  function dailyNum() { var d = new Date(); return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - EPOCH) / 864e5) + 1; }

  function buildRounds(n, rnd, preferUnseen) {
    var seen = preferUnseen ? store.get('seen', {}) : {};
    function ordered(list) {
      var a = shuffle(list.slice(), rnd);
      if (preferUnseen) a.sort(function (x, y) { return (seen[x.slug] ? 1 : 0) - (seen[y.slug] ? 1 : 0); });
      return a;
    }
    var safe = ordered(WORLDS.filter(function (w) { return w.outcome === 'thrive'; }));
    var doom = ordered(WORLDS.filter(function (w) { return w.outcome === 'doomed'; }));
    var bar = ordered(WORLDS.filter(function (w) { return w.outcome === 'barely'; }));
    var rounds = [];
    for (var i = 0; i < n; i++) {
      var set = [safe.shift(), doom.shift()];
      for (var k = 0; k < 2; k++) {
        var useBar = bar.length && (rnd() < 0.62 || !doom.length);
        set.push(useBar ? bar.shift() : doom.shift());
      }
      rounds.push(shuffle(set.filter(Boolean), rnd));
    }
    return rounds;
  }

  function show(id) {
    ['menu', 'round', 'reveal', 'end'].forEach(function (s) { $(s).hidden = s !== id; });
    document.body.classList.toggle('ingame', id === 'round' || id === 'reveal');
    window.scrollTo(0, 0);
  }
  function setProg() {
    if (!G) { $('prog').textContent = ''; return; }
    var idx = Math.min(G.i + 1, G.rounds.length);
    $('prog').innerHTML = (G.mode === 'daily' ? 'Daily ' : 'World ') + '<b>' + idx + '/' + G.rounds.length + '</b> &middot; Streak <b>' + G.streak + '</b>';
  }

  function start(mode) {
    var rnd = mode === 'daily' ? mulberry(hashStr('qw-daily-' + todayKey())) : mulberry((Math.random() * 4294967296) >>> 0);
    var n = mode === 'daily' ? DAILY_N : CLASSIC_N;
    G = { mode: mode, rounds: buildRounds(n, rnd, mode !== 'daily'), i: 0, res: [], streak: 0, bestStreak: 0, day: todayKey() };
    G.rounds.forEach(function (r, k) { if (k < 2) r.forEach(preload); });
    showRound();
  }

  function showRound() {
    var set = G.rounds[G.i], grid = $('grid'), ask = ASK[G.i % ASK.length];
    selIdx = -1; grid.innerHTML = ''; grid.classList.remove('picked');
    $('askL1').textContent = ask[0]; $('askL2').textContent = ask[1];
    set.forEach(function (w, k) {
      var b = document.createElement('button'); b.className = 'card'; b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', 'Planet ' + (k + 1) + ': ' + w.name + '. ' + w.promise);
      var pic = document.createElement('div'); pic.className = 'pic'; pic.appendChild(artEl(w, 'a', ''));
      var num = document.createElement('span'); num.className = 'num'; num.textContent = '0' + (k + 1); pic.appendChild(num);
      var tx = document.createElement('div'); tx.className = 'txt';
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = w.name;
      var pr = document.createElement('div'); pr.className = 'pr'; pr.textContent = w.promise;
      tx.appendChild(nm); tx.appendChild(pr); b.appendChild(pic); b.appendChild(tx);
      b.addEventListener('click', function () { select(k); });
      grid.appendChild(b);
    });
    $('bChoose').disabled = true; $('bChoose').textContent = 'Pick a planet';
    $('hint').textContent = G.i === 0 ? 'Tap a planet to read it, then confirm.' : 'One of these four is safe.';
    if (G.rounds[G.i + 1]) G.rounds[G.i + 1].forEach(preload);
    setProg(); show('round');
  }
  function select(k) {
    selIdx = k; var cards = $('grid').children;
    for (var i = 0; i < cards.length; i++) { cards[i].classList.toggle('sel', i === k); cards[i].setAttribute('aria-checked', String(i === k)); }
    $('grid').classList.add('picked');
    var w = G.rounds[G.i][k]; $('bChoose').disabled = false; $('bChoose').textContent = 'Live on ' + w.name + ' for a year';
    audio.select(k);
  }

  function clearReveal() { revealTimers.forEach(clearTimeout); revealTimers = []; }
  function at(ms, fn) { revealTimers.push(setTimeout(fn, reduceMotion ? Math.min(ms, 120) : ms)); }

  function choose() {
    if (selIdx < 0 || !G) return;
    var set = G.rounds[G.i], w = set[selIdx], res = { w: w, k: selIdx, set: set };
    G.res.push(res);
    if (w.outcome === 'doomed') G.streak = 0; else { G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); }
    if (G.mode !== 'daily') { var seen = store.get('seen', {}); set.forEach(function (x) { seen[x.slug] = 1; }); store.set('seen', seen); }
    audio.confirm(); reveal(res);
  }

  function reveal(res) {
    var w = res.w; clearReveal(); revealDone = false;
    var pic = $('rvPic'); pic.classList.remove('secret');
    Array.prototype.slice.call(pic.querySelectorAll('img,canvas')).forEach(function (n) { n.remove(); });
    var a = artEl(w, 'a', w.name), b = artEl(w, 'b', 'The secret of ' + w.name); a.classList.add('a'); b.classList.add('b');
    pic.insertBefore(b, pic.firstChild); pic.insertBefore(a, pic.firstChild);
    $('rvTag').textContent = '0' + (res.k + 1);
    $('rvName').textContent = w.name; $('rvPromise').textContent = w.promise;
    var sec = $('rvSecret'); sec.innerHTML = '';
    var parts = w.secret.match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g) || [w.secret];
    parts.forEach(function (p) { var s = document.createElement('span'); s.textContent = p.trim() + ' '; sec.appendChild(s); });
    $('rvRule').textContent = w.rule;
    var blocks = $('rvMeter').querySelectorAll('i'); for (var i = 0; i < 5; i++) blocks[i].className = '';
    var st = $('rvStamp'); st.className = 'stamp ' + w.outcome; $('rvSt').textContent = OUT[w.outcome]; $('rvVerdict').textContent = w.verdict;
    var ol = $('rvOtherList'); ol.innerHTML = '';
    res.set.forEach(function (x, k) {
      if (k === res.k) return;
      var li = document.createElement('li'), bb = document.createElement('b'), o = document.createElement('span');
      bb.textContent = x.name; o.className = 'o ' + x.outcome; o.textContent = OUT_SHORT[x.outcome] === 'LOST' ? 'DOOMED' : x.outcome === 'thrive' ? 'THE SAFE ONE' : 'SURVIVABLE';
      li.appendChild(bb); li.appendChild(document.createTextNode(x.secret + ' ')); li.appendChild(o); ol.appendChild(li);
    });
    $('rvOthers').open = false;
    ['rvBut', 'rvRule', 'rvMeter', 'rvStamp', 'rvOthers', 'rvNext'].forEach(function (id) { $(id).classList.remove('on1'); });
    $('bNext').textContent = G.i + 1 >= G.rounds.length ? 'See my year' : 'Next round';
    $('bSkip').hidden = false;
    setProg(); show('reveal');
    at(1300, function () { $('rvBut').classList.add('on1'); audio.but(); moodT = 1; });
    at(2300, function () { pic.classList.add('secret'); });
    var t = 2700, spans = sec.children;
    for (var j = 0; j < spans.length; j++) (function (sp) { at(t, function () { sp.classList.add('on'); }); t += 1500; })(spans[j]);
    at(t, function () { $('rvRule').classList.add('on1'); }); t += 900;
    at(t, function () { $('rvMeter').classList.add('on1'); });
    for (var m = 0; m < w.danger; m++) (function (m) { at(t + 200 + m * 220, function () { blocks[m].className = 'f' + w.danger; audio.tick(m); }); })(m);
    t += 300 + w.danger * 220 + 400;
    at(t, finishReveal);
  }
  function finishReveal() {
    if (revealDone) return; revealDone = true; clearReveal();
    var w = G.res[G.res.length - 1].w, blocks = $('rvMeter').querySelectorAll('i');
    $('rvPic').classList.add('secret');
    Array.prototype.forEach.call($('rvSecret').children, function (s) { s.classList.add('on'); });
    for (var m = 0; m < 5; m++) blocks[m].className = m < w.danger ? 'f' + w.danger : '';
    ['rvBut', 'rvRule', 'rvMeter', 'rvStamp', 'rvOthers', 'rvNext'].forEach(function (id) { $(id).classList.add('on1'); });
    $('bSkip').hidden = true; moodT = 0;
    audio.outcome(w.outcome); setProg();
    setTimeout(function () {
      try { $('bNext').focus({ preventScroll: true }); } catch (e) {}
      var r = $('rvStamp').getBoundingClientRect();
      if (r.bottom > window.innerHeight) try { $('rvStamp').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); } catch (e) {}
    }, 400);
  }
  function next() {
    if (!revealDone) { finishReveal(); return; }
    G.i++;
    if (G.i >= G.rounds.length) endGame(); else showRound();
  }

  var RANKS = [
    [1, 'Keeper of Quiet Worlds', 'Every planet tried to keep you. None of them managed it.'],
    [0.8, 'Seasoned Traveller', 'You read between the lines. The planets noticed.'],
    [0.6, 'Careful Wanderer', 'Mostly sensible choices, and only a few doors you should not have opened.'],
    [0.4, 'Lucky Tourist', 'Some years went well. Some years went somewhere else entirely.'],
    [0.2, 'Lantern in the Dark', 'Brave, warm, and far too trusting of cosy cottages.'],
    [0, 'Gone but Remembered', 'Every planet you picked is still talking about you. Fondly.']
  ];
  function summary() {
    var n = G.res.length, surv = 0, thr = 0;
    G.res.forEach(function (r) { if (r.w.outcome !== 'doomed') surv++; if (r.w.outcome === 'thrive') thr++; });
    var f = n ? surv / n : 0, rank = RANKS[RANKS.length - 1];
    for (var i = 0; i < RANKS.length; i++) if (f >= RANKS[i][0] - 1e-9) { rank = RANKS[i]; break; }
    return { n: n, surv: surv, thr: thr, rank: rank };
  }
  function endGame() {
    var s = summary(); audio.end();
    $('prog').textContent = '';
    $('endKick').textContent = G.mode === 'daily' ? 'DAILY CHALLENGE #' + dailyNum() : 'ONE YEAR LATER';
    $('endBig').textContent = 'Survived ' + s.surv + ' of ' + s.n;
    $('endRank').textContent = s.rank[1];
    $('endDesc').textContent = s.rank[2] + ' Thrived on ' + s.thr + ', best streak ' + G.bestStreak + '.';
    var tr = $('endTrail'); tr.innerHTML = ''; tr.style.gridTemplateColumns = 'repeat(5, 1fr)';
    G.res.forEach(function (r) {
      var d = document.createElement('div'); d.className = r.w.outcome; d.title = r.w.name + ': ' + OUT[r.w.outcome];
      d.appendChild(artEl(r.w, 'b', r.w.name + ', ' + OUT[r.w.outcome]));
      var i = document.createElement('i'); i.textContent = OUT_SHORT[r.w.outcome]; d.appendChild(i); tr.appendChild(d);
    });
    if (G.mode === 'daily') {
      var key = 'daily-' + G.day; if (!store.get(key, null)) store.set(key, { s: s.surv, n: s.n, o: G.res.map(function (r) { return r.w.outcome[0]; }).join('') });
    } else {
      var best = store.get('best', 0); if (s.surv > best) store.set('best', s.surv);
      store.set('games', store.get('games', 0) + 1);
    }
    store.set('bestStreak', Math.max(store.get('bestStreak', 0), G.bestStreak));
    $('bEndDaily').textContent = G.mode === 'daily' ? 'Play 10 worlds' : 'Daily challenge';
    show('end'); refreshMenu();
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
  function makeCard() {
    var s = summary(), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a0b1c'); bg.addColorStop(1, '#1b1840'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var rnd = mulberry(11); for (var i = 0; i < 260; i++) { g.globalAlpha = 0.25 + rnd() * 0.7; g.fillStyle = '#fff'; var r = rnd() < 0.1 ? 3 : 1.6; g.fillRect(rnd() * W, rnd() * H, r, r); }
    g.globalAlpha = 1;
    var ng = g.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 600); ng.addColorStop(0, 'rgba(244,200,110,0.18)'); ng.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ng; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.fillStyle = '#f4c86e'; g.font = '52px VT, monospace';
    g.fillText(G.mode === 'daily' ? 'QUIET WORLDS  DAILY #' + dailyNum() : 'QUIET WORLDS', W / 2, 110);
    g.fillStyle = '#f5efe3'; g.font = '120px VT, monospace'; g.fillText('I survived ' + s.surv + ' of ' + s.n, W / 2, 230);
    g.font = '54px VT, monospace'; g.fillStyle = '#7fd6c6'; g.fillText(s.rank[1], W / 2, 300);
    g.font = '600 32px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; g.fillStyle = '#c9c3d8';
    g.fillText('Thrived on ' + s.thr + '  |  Best streak ' + G.bestStreak, W / 2, 352);
    var cols = 5, gap = 22, pad = 70, tw = (W - pad * 2 - gap * (cols - 1)) / cols, th = tw * 1.25, rows = Math.ceil(G.res.length / cols);
    var top = 400 + (rows === 1 ? 110 : 0), colr = { thrive: '#8fe39a', barely: '#ffb35c', doomed: '#ff6b6b' };
    G.res.forEach(function (r, k) {
      var x = pad + (k % cols) * (tw + gap), y = top + Math.floor(k / cols) * (th + 96);
      g.save(); roundRect(g, x, y, tw, th, 18); g.clip(); g.fillStyle = '#15162c'; g.fillRect(x, y, tw, th);
      var el = r.w.img ? imgCache[artSrc(r.w, 'b')] : artEl(r.w, 'b');
      try { if (el && (el.complete === undefined || el.complete)) { if (!r.w.img) g.imageSmoothingEnabled = false; drawCover(g, el, x, y, tw, th); g.imageSmoothingEnabled = true; } } catch (e) {}
      g.restore();
      g.lineWidth = 6; g.strokeStyle = colr[r.w.outcome]; roundRect(g, x, y, tw, th, 18); g.stroke();
      g.fillStyle = 'rgba(8,9,20,0.9)'; g.fillRect(x + 3, y + th - 44, tw - 6, 41);
      g.fillStyle = colr[r.w.outcome]; g.font = '600 22px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; g.fillText(OUT_SHORT[r.w.outcome], x + tw / 2, y + th - 15);
      g.fillStyle = '#f5efe3'; g.font = '36px VT, monospace';
      var nm = r.w.name; while (g.measureText(nm).width > tw + 14 && nm.length > 4) nm = nm.slice(0, -2) + '.';
      g.fillText(nm, x + tw / 2, y + th + 40);
    });
    g.fillStyle = 'rgba(14,15,32,0.92)'; roundRect(g, 120, H - 190, W - 240, 120, 24); g.fill();
    g.fillStyle = '#f5efe3'; g.font = '46px VT, monospace'; g.fillText('Can you survive more?', W / 2, H - 132);
    g.fillStyle = '#f4c86e'; g.font = '44px VT, monospace'; g.fillText('saagarverma.com/quiet-worlds', W / 2, H - 88);
    return cv;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function shareText() {
    var s = summary();
    return (G.mode === 'daily' ? 'Quiet Worlds Daily #' + dailyNum() + ': ' : 'Quiet Worlds: ') + 'I survived ' + s.surv + ' of ' + s.n + ' worlds (' + s.rank[1] + '). Can you beat me? https://saagarverma.com/quiet-worlds/';
  }
  var cardBlob = null;
  function share() {
    var go = function () {
      var cv = makeCard(), url = cv.toDataURL('image/png');
      $('cardImg').src = url; $('mSave').href = url;
      cardBlob = null;
      try { cv.toBlob(function (b) { cardBlob = b; }, 'image/png'); } catch (e) {}
      $('modal').hidden = false;
    };
    var waits = G.res.filter(function (r) { return r.w.img; }).map(function (r) {
      var im = loadImg(artSrc(r.w, 'b')); if (im.complete) return Promise.resolve();
      return new Promise(function (res) { im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true }); setTimeout(res, 2500); });
    });
    var fontP = document.fonts && document.fonts.load ? document.fonts.load('40px VT') : Promise.resolve();
    Promise.all(waits.concat([fontP.catch(function () {})])).then(go, go);
  }
  function nativeShare() {
    var text = shareText();
    try {
      if (cardBlob && navigator.canShare) {
        var f = new File([cardBlob], 'quiet-worlds-result.png', { type: 'image/png' });
        if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], text: text }).catch(function () {}); return; }
      }
      if (navigator.share) { navigator.share({ text: text, url: 'https://saagarverma.com/quiet-worlds/' }).catch(function () {}); return; }
    } catch (e) {}
    copy(text);
  }
  function copy(text) {
    var ok = function () { toast('Copied. Paste it anywhere.'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text); }); return; } } catch (e) {}
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied. Paste it anywhere.'); } catch (e) { toast('Could not copy'); }
    ta.remove();
  }
  var toastT = null;
  function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 2200); }

  /* ---------- menu ---------- */
  function refreshMenu() {
    var d = store.get('daily-' + todayKey(), null);
    $('dailyLab').textContent = d ? '#' + dailyNum() + ' done: ' + d.s + '/' + d.n : '#' + dailyNum() + ', 5 worlds';
    var best = store.get('best', 0), bs = store.get('bestStreak', 0);
    $('best').textContent = best || bs ? 'Your best: survived ' + best + ' of 10, longest streak ' + bs : WORLDS.length + ' worlds to discover';
  }
  function goMenu() { clearReveal(); moodT = 0; G = null; setProg(); refreshMenu(); show('menu'); drawMenu.done = false; }

  /* ---------- wire up ---------- */
  $('bPlay').addEventListener('click', function () { start('classic'); });
  $('bDaily').addEventListener('click', function () { start('daily'); });
  $('bChoose').addEventListener('click', choose);
  $('bNext').addEventListener('click', next);
  $('bSkip').addEventListener('click', finishReveal);
  $('bHome').addEventListener('click', goMenu);
  $('bAgain').addEventListener('click', function () { start(G && G.mode === 'daily' ? 'daily' : 'classic'); });
  $('bEndDaily').addEventListener('click', function () { start(G && G.mode === 'daily' ? 'classic' : 'daily'); });
  $('bShare').addEventListener('click', share);
  $('mShare').addEventListener('click', nativeShare);
  $('mCopy').addEventListener('click', function () { copy(shareText()); });
  $('mClose').addEventListener('click', function () { $('modal').hidden = true; });
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (!$('modal').hidden) { if (e.key === 'Escape') $('modal').hidden = true; return; }
    if (!$('round').hidden) {
      if (e.key >= '1' && e.key <= '4') { select(+e.key - 1); e.preventDefault(); }
      else if (e.key === 'Enter' && selIdx >= 0 && document.activeElement && !document.activeElement.classList.contains('card')) { choose(); e.preventDefault(); }
    } else if (!$('reveal').hidden && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { next(); e.preventDefault(); }
  });
  window.addEventListener('resize', skyResize);

  skyResize(); setupMenuGlobes(); syncMuteIcon(); refreshMenu();
  if (reduceMotion) drawSky(0);
  requestAnimationFrame(loop);
  window.__qw = { start: start, state: function () { return G; }, worlds: WORLDS.length };
})();
