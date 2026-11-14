/* Metronome Sync: player levels (share links), the daily challenge and the share card.
   Pure helpers, no DOM state: game.js wires them up. Also loads in Node for tests (module.exports).

   Level link, version 1:  ?l=1_<N>_<bpm>_<start>_<spread>_<tools>_<weights>_<target>_<flips>_<seed>[.<title>]
   every number in base 36; title = base64url of UTF-8 text. Decoding is strict: anything out of range = no level. */
(function (root) {
  'use strict';

  var TOOLS = ['nudge', 'shake', 'flip', 'big', 'weights', 'lift'];          // bit 0..5
  var STARTS = ['random', 'tie2', 'tie3'];
  var TITLE_MAX = 40;

  // ---------------- titles ----------------
  // Control characters, zero-width and bidi-override characters out; spaces collapsed; at most 40 characters.
  // Titles are only ever shown with textContent / canvas fillText, never as HTML; < and > go as well, belt and braces.
  function sanitizeTitle(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) { try { s = s.normalize('NFC'); } catch (e) {} }
    s = s.replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF<>]/g, ' ')
         .replace(/\s+/g, ' ').trim();
    var cps = Array.from ? Array.from(s) : s.split('');
    if (cps.length > TITLE_MAX) s = cps.slice(0, TITLE_MAX).join('').trim();
    return s;
  }

  function utf8ToB64url(str) {
    var bytes = unescape(encodeURIComponent(str)), b64;
    b64 = typeof btoa === 'function' ? btoa(bytes) : Buffer.from(bytes, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlToUtf8(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bytes = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    return decodeURIComponent(escape(bytes));            // throws on invalid UTF-8
  }

  // ---------------- level codec ----------------
  function clampInt(v, a, b) { v = Math.round(+v); return v !== v ? a : Math.max(a, Math.min(b, v)); }

  function normalizeLevel(L) {
    var tools = {};
    TOOLS.forEach(function (t) { tools[t] = !!(L.tools && L.tools[t]); });
    return {
      N: clampInt(L.N, 1, 100),
      bpm: 120 + 4 * clampInt((L.bpm - 120) / 4, 0, 30),
      start: STARTS.indexOf(L.start) >= 0 ? L.start : 'random',
      spread: clampInt((L.spread == null ? 1 : L.spread) * 10, 1, 10) / 10,
      tools: tools,
      weights: !!L.weights,
      target: clampInt((L.target || 0) * 10, 0, 6000) / 10,
      maxFlips: clampInt(L.maxFlips || 0, 0, 99),
      seed: clampInt(L.seed || 0, 0, 2147483647),
      title: sanitizeTitle(L.title)
    };
  }

  function toolMask(tools) { var m = 0; TOOLS.forEach(function (t, i) { if (tools[t]) m |= 1 << i; }); return m; }

  function encodeLevel(L) {
    L = normalizeLevel(L);
    var f = [1, L.N, (L.bpm - 120) / 4, STARTS.indexOf(L.start), Math.round(L.spread * 10), toolMask(L.tools),
             L.weights ? 1 : 0, Math.round(L.target * 10), L.maxFlips, L.seed];
    var code = f.map(function (n) { return n.toString(36); }).join('_');
    if (L.title) code += '.' + utf8ToB64url(L.title);
    return code;
  }

  var RE = /^1_([0-9a-z]{1,2})_([0-9a-z]{1,2})_([0-9a-z])_([0-9a-z]{1,2})_([0-9a-z]{1,2})_([01])_([0-9a-z]{1,3})_([0-9a-z]{1,2})_([0-9a-z]{1,6})(?:\.([A-Za-z0-9_-]{1,220}))?$/;
  function decodeLevel(code) {
    if (typeof code !== 'string' || code.length > 300) return null;
    var m = RE.exec(code);
    if (!m) return null;
    var n = function (k) { return parseInt(m[k], 36); };
    var N = n(1), b = n(2), st = n(3), sp = n(4), tl = n(5), w = n(6), tg = n(7), mf = n(8), seed = n(9);
    if (!(N >= 1 && N <= 100 && b >= 0 && b <= 30 && st >= 0 && st <= 2 && sp >= 1 && sp <= 10 && tl >= 0 && tl <= 63 &&
          tg >= 0 && tg <= 6000 && mf >= 0 && mf <= 99 && seed >= 0 && seed <= 2147483647)) return null;
    var title = '';
    if (m[10]) { try { title = sanitizeTitle(b64urlToUtf8(m[10])); } catch (e) { return null; } }
    var tools = {};
    TOOLS.forEach(function (t, i) { tools[t] = !!(tl & (1 << i)); });
    return { N: N, bpm: 120 + 4 * b, start: STARTS[st], spread: sp / 10, tools: tools, weights: w === 1, target: tg / 10, maxFlips: mf, seed: seed, title: title };
  }

  // ---------------- daily challenge ----------------
  // One puzzle per UTC day, the same for everyone: it is built only from the day number with integer maths.
  var DAY0 = Date.UTC(2026, 10, 14);           // Daily #1 = 14 Nov 2026 (UTC)
  function dayNumber(now) { return Math.floor(((now == null ? Date.now() : now) - DAY0) / 86400000) + 1; }
  function msToNextDay(now) { now = now == null ? Date.now() : now; return 86400000 - ((now - DAY0) % 86400000 + 86400000) % 86400000; }
  function fmtCountdown(ms) {
    var m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60);
    return h ? h + 'h ' + (m % 60) + 'm' : (m % 60) + 'm';
  }
  function rng(seed) {                         // mulberry32, same as the engine
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function round1(x) { return Math.round(x * 10) / 10; }
  function tools(list) { var t = {}; TOOLS.forEach(function (k) { t[k] = list.indexOf(k) >= 0; }); return t; }
  function hash32(x) {                         // murmur3 finaliser: spreads nearby day numbers far apart
    x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x85ebca6b) >>> 0; x = (x ^ (x >>> 13)) >>> 0;
    x = Math.imul(x, 0xc2b2ae35) >>> 0; return (x ^ (x >>> 16)) >>> 0;
  }
  // kind of puzzle: never the same as the day before (walks from day 1, a few thousand steps at most)
  function kindOf(day) {
    var k = hash32(1 * 2654435761) % 5;
    for (var d = 2; d <= day; d++) k = (k + 1 + hash32(Math.imul(d, 2654435761) ^ 0x5eed) % 4) % 5;
    return k;
  }

  // Pars come from running the engine offline (median of several seeds, then a bit tighter than "just wait").
  function daily(day) {
    day = Math.max(1, Math.min(100000, Math.floor(day) || 1));
    var t = kindOf(day), r = rng(hash32(day * 40503 + 977));
    var L = { start: 'random', spread: 1, weights: false, seed: (day * 7919 + 17) % 1000000000, maxFlips: 0 }, K;
    switch (t) {
      case 0:
        L.N = 30 + 10 * Math.floor(r() * 8); L.bpm = 192 + 8 * Math.floor(r() * 6); K = pick(r, [4, 6, 10]);
        L.tools = tools(['nudge', 'flip']); L.maxFlips = K; L.target = round1(8 * Math.pow(208 / L.bpm, 3));
        L.name = 'Race the clock';
        L.goal = 'Sync ' + L.N + ' metronomes at ' + L.bpm + ' bpm. Only Nudge and Flip work, at most ' + K + ' flips.';
        break;
      case 1:
        L.N = 40 + 10 * Math.floor(r() * 7); L.bpm = 208 + 8 * Math.floor(r() * 4);
        L.tools = tools(['shake']); L.target = 5;
        L.name = 'Motor only';
        L.goal = 'The motor is your only tool. Find the best moment to switch it on (and off) and sync ' + L.N + ' metronomes.';
        break;
      case 2:
        L.N = pick(r, [40, 60, 80, 100]); L.bpm = 208; L.start = 'tie2'; K = pick(r, [2, 3, 4]);
        L.tools = tools(['flip']); L.maxFlips = K; L.target = K === 2 ? 8.5 : K === 3 ? 7.5 : 7;
        L.name = 'Break the tie';
        L.goal = 'Pink vs cyan, half a swing apart. You get ' + K + ' flips and nothing else. Tap metronomes of one colour to flip them.';
        break;
      case 3:
        L.N = pick(r, [60, 70, 80, 90, 100]); L.bpm = 208; L.start = 'tie3';
        L.tools = tools(['flip', 'lift', 'big']); L.maxFlips = 12; L.target = 9.5;
        L.name = '3-way deadlock';
        L.goal = 'Three teams a third of a swing apart: left alone they never sync. Flip (max 12), lift 20 off or add the big one.';
        break;
      default:
        L.N = pick(r, [60, 70, 80, 90, 100]); L.bpm = 208; L.weights = true; K = 6;
        L.tools = tools(['weights', 'nudge', 'flip']); L.maxFlips = K; L.target = 15;
        L.name = 'Heavy board';
        L.goal = '48 kg of weights pin the board. Get them off and sync all ' + L.N + '. Nudge and up to ' + K + ' flips allowed.';
    }
    L.day = day; L.kind = 'daily'; L.type = t;
    L.title = 'Daily #' + day + ': ' + L.name;
    return L;
  }

  // ---------------- daily progress (localStorage, optional) ----------------
  var DKEY = 'c2o-daily-v1';
  function loadProgress() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(DKEY) || 'null'); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    return { streak: +p.streak || 0, last: +p.last || 0, bestStreak: +p.bestStreak || 0, best: p.best && typeof p.best === 'object' ? p.best : {} };
  }
  function saveProgress(p) { try { localStorage.setItem(DKEY, JSON.stringify(p)); } catch (e) {} }
  function currentStreak(p, today) { return p.last >= today - 1 ? p.streak : 0; }
  // Records a finished daily. Returns {streak, best, newBest}.
  function recordDaily(day, time) {
    var p = loadProgress();
    if (p.last !== day) { p.streak = p.last === day - 1 ? p.streak + 1 : 1; p.last = day; }
    p.bestStreak = Math.max(p.bestStreak, p.streak);
    var prev = +p.best[day], newBest = !(prev <= time);
    if (newBest) p.best[day] = Math.round(time * 10) / 10;
    Object.keys(p.best).forEach(function (k) { if (+k < day - 30) delete p.best[k]; });
    saveProgress(p);
    return { streak: p.streak, best: p.best[day], newBest: newBest, bestStreak: p.bestStreak };
  }

  // ---------------- share card ----------------
  // 1080 x 1350 PNG in the game's look: a frame of the board, the result and the site address.
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function fitText(g, text, maxW, size, weight) {
    var s = size;
    do { g.font = (weight || '700') + ' ' + s + 'px InterB, system-ui, -apple-system, sans-serif'; if (g.measureText(text).width <= maxW) break; s -= 2; } while (s > 18);
    return s;
  }
  function drawTarget(g, cx, cy, r) {                 // a small bullseye instead of an emoji (emoji fonts vary)
    [[1, '#ff5494'], [0.68, '#f4f4f7'], [0.38, '#ff5494']].forEach(function (q) { g.fillStyle = q[1]; g.beginPath(); g.arc(cx, cy, r * q[0], 0, 7); g.fill(); });
    g.strokeStyle = '#ffcc66'; g.lineWidth = r * 0.16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + r * 1.15, cy - r * 1.15); g.lineTo(cx + r * 0.05, cy - r * 0.05); g.stroke();
  }
  /* o: { source: canvas, line1, line2, tag, sub, url } -> canvas */
  function drawCard(o) {
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d');
    var lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, '#1b1c24'); lg.addColorStop(0.55, '#101116'); lg.addColorStop(1, '#0b0b0f');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    [[0, 0, 900, 'rgba(90,108,205,.22)'], [W, 0, 760, 'rgba(180,102,190,.12)'], [W, H, 1000, 'rgba(51,140,165,.14)'], [0, H, 860, 'rgba(255,204,102,.10)']].forEach(function (q) {
      var rg = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], q[2]); rg.addColorStop(0, q[3]); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    });
    g.strokeStyle = 'rgba(255,255,255,.045)'; g.lineWidth = 1.5; g.beginPath();
    for (var x = 0; x <= W; x += 72) { g.moveTo(x, 0); g.lineTo(x, H); }
    for (var y = 0; y <= H; y += 72) { g.moveTo(0, y); g.lineTo(W, y); }
    g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    // kicker + mode tag
    g.fillStyle = '#b8bac7'; g.font = '700 30px InterB, system-ui, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '9px';
    g.fillText('CHAOS TO ORDER', W / 2 + 4, 108);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    var top = 140;
    if (o.tag) {
      var ts = fitText(g, o.tag, W - 200, 34), tw = g.measureText(o.tag).width + 56;
      g.fillStyle = 'rgba(255,204,102,.14)'; g.strokeStyle = 'rgba(255,204,102,.7)'; g.lineWidth = 2;
      roundRect(g, (W - tw) / 2, top, tw, ts + 30, (ts + 30) / 2); g.fill(); g.stroke();
      g.fillStyle = '#ffcc66'; g.fillText(o.tag, W / 2, top + ts + 6);
      top += ts + 56;
    } else top += 20;
    // the board, cropped to fill a rounded frame
    var fx = 60, fw = W - 120, fy = top, fh = 600;
    g.save(); roundRect(g, fx, fy, fw, fh, 34); g.clip();
    g.fillStyle = '#101116'; g.fillRect(fx, fy, fw, fh);
    if (o.source && o.source.width) {
      var sw = o.source.width, sh = o.source.height, k = Math.max(fw / sw, fh / sh), dw = sw * k, dh = sh * k;
      // phones: the board sits low in a tall stage, so crop towards it
      var cyBias = sh > sw * 1.2 ? 0.62 : 0.55;
      var dy = fy + fh / 2 - dh * cyBias;
      dy = Math.min(fy, Math.max(fy + fh - dh, dy));
      try { g.drawImage(o.source, fx + (fw - dw) / 2, dy, dw, dh); } catch (e) {}
    }
    g.restore();
    g.strokeStyle = 'rgba(255,204,102,.55)'; g.lineWidth = 3; roundRect(g, fx, fy, fw, fh, 34); g.stroke();
    // result
    var y0 = fy + fh + 118;
    g.fillStyle = '#f4f4f7'; fitText(g, o.line1, W - 140, 66); g.fillText(o.line1, W / 2, y0);
    var s2 = fitText(g, o.line2, W - 300, 128), w2 = g.measureText(o.line2).width;
    g.fillStyle = '#ffcc66'; g.shadowColor = 'rgba(255,190,80,.45)'; g.shadowBlur = 40;
    g.fillText(o.line2, W / 2 - 46, y0 + s2 + 14); g.shadowBlur = 0;
    var tr = Math.min(48, s2 * 0.4);
    drawTarget(g, W / 2 - 46 + w2 / 2 + tr + 22, y0 + s2 * 0.62, tr);
    if (o.sub) { g.fillStyle = '#b8bac7'; fitText(g, o.sub, W - 160, 36); g.fillText(o.sub, W / 2, y0 + s2 + 84); }
    // footer
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, H - 120, W, 120);
    g.fillStyle = '#f4f4f7'; g.font = '700 34px InterB, system-ui, sans-serif'; g.textAlign = 'left';
    g.fillText('Can you beat it?', 60, H - 48);
    g.fillStyle = '#ffcc66'; g.textAlign = 'right'; fitText(g, o.url, 560, 34); g.fillText(o.url, W - 60, H - 48);
    return c;
  }

  var api = {
    TOOLS: TOOLS, STARTS: STARTS, TITLE_MAX: TITLE_MAX,
    sanitizeTitle: sanitizeTitle, encodeLevel: encodeLevel, decodeLevel: decodeLevel, normalizeLevel: normalizeLevel, toolMask: toolMask,
    dayNumber: dayNumber, msToNextDay: msToNextDay, fmtCountdown: fmtCountdown, daily: daily,
    loadProgress: loadProgress, recordDaily: recordDaily, currentStreak: currentStreak,
    drawCard: drawCard
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MetroLevels = api;
})(this);
