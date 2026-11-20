/* Metronome Sync Game (Chaos to Order). Drawing, controls, sound, challenges, player levels, the daily
   challenge and the share card. Physics lives in engine.js; level links, daily puzzles and the card image in levels.js. */
(function () {
  'use strict';
  var E = window.MetroEngine, Sim = E.Sim, BIG = E.BIG, LV = window.MetroLevels;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var OG = params.has('og');
  if (OG) document.body.classList.add('og');
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;   // mouse + keyboard
  var Q = { low: params.has('lowfx') };      // low = no glow, 1x pixels (set automatically on slow devices)

  // ---------------- palette ----------------
  var TEAM = [[255, 84, 148], [51, 217, 255], [158, 240, 64]];
  var GOLD = [255, 204, 102], VIOLET = [158, 115, 255];
  function hsl(h, s, l) {
    s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }
  var HUES = (function () {      // evenly spread hues, shuffled over the board (fixed)
    var r = E.mulberry(7), a = [];
    for (var i = 0; i < 100; i++) a.push(hsl((i * 360 / 100 + 8) % 360, 92, 62));
    for (i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  })();
  function mix(c1, c2, k) { return [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }

  // ---------------- challenges ----------------
  var CH = [
    { id: 'c100', name: 'Can 100 sync?', N: 100, start: 'random', goal: '100 metronomes, random start. Get all 100 in step. Just wait, or help them: a nudge or the motor can speed it up.' },
    { id: '5050', name: '50 vs 50', N: 100, start: 'tie2', goal: 'Pink vs cyan: a perfect tie, exactly half a swing apart. Break it: tap a few metronomes to flip them, or nudge the board. Left alone it breaks in about 15 s. Beat that.' },
    { id: 'tie3', name: 'Break the 3-way tie', N: 100, start: 'tie3', score: 'flips', goal: 'Three teams a third of a swing apart. Left alone, this tie never breaks. Fewest flips wins: tap metronomes of ONE team to flip them. How many does it take?' },
    { id: 'shake', name: 'Shake at 229', N: 100, start: 'random', goal: 'All dialled to 208. Turn on the motor: it shakes the board at 229. Whose beat do they end up on?' },
    { id: 'weights', name: 'Weights off', N: 100, start: 'random', weights: true, goal: '48 kg of weights on the board. It is too heavy for the metronomes to move, so they stay out of step. Take the weights off.' },
    { id: 'lift', name: 'Lift 20 off', N: 100, start: 'tie3', goal: 'A perfect 3-way tie. Lift 20 lime ones off the board, then wait about 8 s. What do the other 80 do?' },
    { id: 'big', name: 'Add 1 big one', N: 100, start: 'tie3', goal: 'A perfect 3-way tie. Add one big metronome, 18x heavier. Whose beat wins?' }
  ];
  var CHMAP = {}; CH.forEach(function (c) { CHMAP[c.id] = c; });
  function T(name, data) { try { if (!OG && window.c2oStats) window.c2oStats.track(name, data); } catch (e) {} }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------------- state ----------------
  var DEFAULT = { N: 100, bpm: 208, start: 'random', weights: false, spread: 1 };
  var setup = { N: 100, bpm: 208, start: 'random', weights: false, spread: 1, seed: 0 };
  var challenge = null;
  var spec = null;                     // a player level ({kind:'level'}) or today's daily ({kind:'daily'}); null = free play / challenge
  var sim = null, beatEst = null;
  var lay = null;                      // layout for N
  var round = { t0: 0, synced: false, hold0: -1, time: 0, flips0: 0 };
  var fx = { lift: new Float64Array(101).fill(-1), drop: new Float64Array(101).fill(-1), bigT: -1, weightsT: -1, weightsOn: false, push: -1, gold: 0, pulse: 0 };
  var xf = 0;                          // camera follow of the board
  var flipN = 4, liftedIdx = [];
  var started = OG;
  var last = { time: 0, n: 0, flips: 0, beaten: null, result: null };   // the latest sync, for the share card

  function newSim(keepSeed) {
    if (!keepSeed) setup.seed = (Math.random() * 1e9) | 0;
    lay = layout(setup.N);
    sim = new Sim({ N: setup.N, bpm: setup.bpm, start: setup.start, seed: setup.seed, weights: setup.weights, spread: setup.spread, xs: lay.u });
    beatEst = sim.beatEstimator();
    round = { t0: 0, synced: false, hold0: -1, time: 0, flips0: 0 };
    fx.lift.fill(-1); fx.drop.fill(-1); fx.bigT = -1; fx.weightsOn = setup.weights; fx.weightsT = -1; fx.push = -1; fx.gold = 0;
    liftedIdx = []; xf = 0;
    hideBanner(); syncButtons();
  }

  // ---------------- layout ----------------
  // staggered lattice like the videos; u = across [-.5,.5], z = depth 0 (back) .. 1 (front)
  function layout(N) {
    var C = N <= 5 ? N : Math.ceil(Math.sqrt(N)), R = Math.ceil(N / C);
    var u = new Float64Array(N), z = new Float64Array(N), row = new Int32Array(N);
    for (var k = 0; k < N; k++) {
      var r = Math.floor(k / C), c = k % C, inRow = Math.min(C, N - r * C);
      var st = R > 1 ? (r % 2 ? 0.22 : -0.22) : 0;
      u[k] = (c - (inRow - 1) / 2 + st) / Math.max(C, 1.6);
      z[k] = R === 1 ? 1 : r / (R - 1);
      row[k] = r;
    }
    return { N: N, C: C, R: R, u: u, z: z, row: row };
  }

  // ---------------- canvas ----------------
  var cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
  var W = 0, H = 0, DPR = 1, G = {}, bgCanvas = null;
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    DPR = Math.min(Q.low ? 1 : 2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    geom(); bgCanvas = null;
  }
  function geom() {
    var wide = W / H;
    G.yBack = H * (OG ? 0.30 : 0.40); G.yFront = H * (OG ? 0.68 : 0.72);
    if (!OG && H > W * 1.3) { G.yBack = H * 0.35; G.yFront = H * 0.77; }   // tall phone stage: deeper board, less empty floor
    G.P = Math.min(W * 0.93, H * 0.98);                        // px across the lattice at the front row
    G.cx = W / 2;
    G.pxm = G.P / 1.3;                                          // px per metre at the front (lattice ~1.3 m wide)
    G.frontHalf = Math.max(W * 0.58, G.P * 0.62);
    G.backHalf = G.frontHalf * 0.62;
    G.wide = wide;
  }
  function S(z) { return 0.6 + 0.4 * z; }
  function rowY(z) { return G.yBack + (G.yFront - G.yBack) * z; }
  function unit() { return Math.min(G.P / lay.C * 0.92, H * 0.13, (G.yFront - G.yBack + H * 0.2) / Math.max(1, lay.R) * 1.6); }

  function drawBackground() {
    bgCanvas = document.createElement('canvas'); bgCanvas.width = cv.width; bgCanvas.height = cv.height;
    var g = bgCanvas.getContext('2d'); g.scale(DPR, DPR);
    var lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, '#1b1c24'); lg.addColorStop(0.55, '#101116'); lg.addColorStop(1, '#0b0b0f');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    [[0, 0, W * 0.9, [90, 108, 205], 0.17], [W, 0, W * 0.75, [180, 102, 190], 0.08], [W, H, W, [51, 140, 165], 0.10], [0, H, W * 0.85, [180, 128, 64], 0.07]].forEach(function (q) {
      var rg = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], q[2]);
      rg.addColorStop(0, rgb(q[3], q[4])); rg.addColorStop(1, rgb(q[3], 0)); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    });
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    var step = Math.max(28, W / 15);
    g.beginPath();
    for (var x = 0; x <= W; x += step) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
    for (var y = 0; y <= H; y += step) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
    g.stroke();
    // floor below the rollers, perspective lines
    var m = unit(), fy = floorY(m);
    g.fillStyle = 'rgba(8,8,11,.55)'; g.fillRect(0, fy, W, H - fy);
    g.strokeStyle = 'rgba(255,255,255,.06)';
    g.beginPath(); g.moveTo(0, fy + .5); g.lineTo(W, fy + .5);
    for (var i = -8; i <= 8; i++) { g.moveTo(G.cx + i * W * 0.09, fy); g.lineTo(G.cx + i * W * 0.3, H); }
    for (var j = 1; j < 5; j++) { var yy = fy + (H - fy) * (j * j) / 25; g.moveTo(0, yy); g.lineTo(W, yy); }
    g.stroke();
  }
  function boardFrontY(m) { return G.yFront + m * 0.62; }
  function lipH(m) { return Math.max(8, m * 0.3); }
  function rollerR(m) { return Math.max(9, m * 0.34); }
  function floorY(m) { return boardFrontY(m) + lipH(m) + 2 * rollerR(m); }

  // ---------------- drawing ----------------
  var pos = { bx: new Float64Array(101), by: new Float64Array(101), r: new Float64Array(101) };
  function draw(now) {
    if (!bgCanvas) drawBackground();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var m = unit(), t = sim.t;
    var dxm = (sim.x - xf) * 2;                                 // board sway drawn 2x (said in the footer)
    var shift = function (z) { return dxm * G.pxm * S(z); };
    var yB = G.yBack - m * 0.5, yF = boardFrontY(m), lh = lipH(m), rr = rollerR(m);
    // rollers
    var rot = sim.x / (rr / G.pxm * 1.0);
    [-0.62, 0.62].forEach(function (k) {
      var cx = G.cx + k * G.frontHalf * 0.62 + shift(1) / 2, cy = yF + lh + rr;
      ctx.fillStyle = '#2a2c36'; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      for (var s = 0; s < 3; s++) { var a = rot + s * 2.094; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rr * 0.85, cy + Math.sin(a) * rr * 0.85); }
      ctx.stroke();
      ctx.fillStyle = '#d9472b'; ctx.beginPath(); ctx.arc(cx + Math.cos(rot) * rr * 0.62, cy + Math.sin(rot) * rr * 0.62, Math.max(2, rr * 0.12), 0, 7); ctx.fill();
    });
    // motor under the lip
    if (sim.motor || (sim.motorOffT >= 0 && t - sim.motorOffT < 0.5)) {
      var mx = G.cx + shift(1), my = yF + lh + rr * 0.9, mr = rr * 0.95;
      ctx.fillStyle = '#9aa0ab'; ctx.fillRect(mx - mr * 1.5, yF + lh - 2, mr * 3, 5);
      ctx.fillStyle = '#23252e'; ctx.strokeStyle = 'rgba(255,204,102,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill(); ctx.stroke();
      var fm = sim.bpm * sim.p.motorRatio / 120, ph = 6.2832 * fm * (t - sim.motorT0);
      ctx.fillStyle = '#ff8c2e'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, mr * 0.8, ph - 0.7, ph + 0.7); ctx.closePath(); ctx.fill();
    }
    // board top (trapezoid) + lip
    var sb = shift(0), sf = shift(1);
    var bg = ctx.createLinearGradient(0, yB, 0, yF);
    bg.addColorStop(0, '#4a3524'); bg.addColorStop(1, '#7a5636');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(G.cx - G.backHalf + sb, yB); ctx.lineTo(G.cx + G.backHalf + sb, yB);
    ctx.lineTo(G.cx + G.frontHalf + sf, yF); ctx.lineTo(G.cx - G.frontHalf + sf, yF); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for (var gl = 1; gl < 9; gl++) { var gz = gl / 9, yy = yB + (yF - yB) * gz, hw = G.backHalf + (G.frontHalf - G.backHalf) * gz, ss = sb + (sf - sb) * gz; ctx.moveTo(G.cx - hw + ss, yy); ctx.lineTo(G.cx + hw + ss, yy); }
    ctx.stroke();
    if (fx.gold > 0) { ctx.fillStyle = rgb(GOLD, 0.06 * fx.gold * (1 + fx.pulse)); ctx.fill(); }
    ctx.fillStyle = '#3d2a1b'; ctx.fillRect(G.cx - G.frontHalf + sf, yF, G.frontHalf * 2, lh);
    ctx.fillStyle = 'rgba(255,220,170,.18)'; ctx.fillRect(G.cx - G.frontHalf + sf, yF, G.frontHalf * 2, 1.5);

    // push arrow + ripple
    if (fx.push >= 0 && t - fx.push < 0.8) {
      var pu = (t - fx.push) / 0.8, al = 1 - pu;
      ctx.strokeStyle = 'rgba(255,255,255,' + al + ')'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 4;
      var ax = G.cx - G.frontHalf * 0.35 + sf, ay = yF + lh + rr, len = Math.min(120, W * 0.2);
      ctx.beginPath(); ctx.moveTo(ax - len / 2, ay); ctx.lineTo(ax + len / 2 - 12, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + len / 2, ay); ctx.lineTo(ax + len / 2 - 16, ay - 10); ctx.lineTo(ax + len / 2 - 16, ay + 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.35 * al + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(G.cx + sf, (yB + yF) / 2, G.frontHalf * (0.3 + pu), (yF - yB) * (0.2 + pu * 0.5), 0, 0, 7); ctx.stroke();
    }

    // metronomes, back to front
    var N = setup.N, gold = fx.gold, pulse = fx.pulse;
    for (var i = 0; i < N; i++) {
      var z = lay.z[i], s = S(z), mm = m * s;
      var bx = G.cx + lay.u[i] * G.P * s + shift(z), by = rowY(z);
      var alpha = 1, lift = 0;
      if (!sim.active[i]) {
        var lt = fx.lift[i]; if (lt < 0 || t - lt > 0.6) { pos.r[i] = 0; continue; }
        var lu = (t - lt) / 0.6; lift = lu * lu * H * 0.35; alpha = 1 - lu;
      } else if (fx.drop[i] >= 0 && t - fx.drop[i] < 0.4) {
        var du = 1 - (t - fx.drop[i]) / 0.4; lift = du * du * H * 0.3; alpha = 1 - du * 0.8;
      }
      drawMetronome(bx, by - lift, mm, sim.th[i], colorOf(i, gold), alpha, i, pulse, gold);
    }
    // big one at the front centre
    if (sim.bigOn || (fx.bigT >= 0 && fx.bigOut)) {
      var bt = fx.bigT, bu = Math.min(1, (t - bt) / 0.45), off = fx.bigOut ? (bu * bu) : (1 - bu) * (1 - bu);
      if (!(fx.bigOut && bu >= 1)) {
        var bm = Math.min(m * 2.8, H * 0.2), bxx = G.cx + sf, byy = boardFrontY(m) - m * 0.12 - off * H * 0.5;
        drawMetronome(bxx, byy, bm, sim.bigOn ? sim.th[BIG] : E.A0, mix(VIOLET, GOLD, gold * 0.35), fx.bigOut ? 1 - bu : 1, BIG, pulse, gold);
      }
    }
    // weights on the front strip
    if (fx.weightsOn || (fx.weightsT >= 0 && t - fx.weightsT < 0.5)) {
      var wu = fx.weightsOn ? (fx.weightsT >= 0 ? Math.max(0, 1 - (t - fx.weightsT) / 0.4) : 0) : Math.min(1, (t - fx.weightsT) / 0.5);
      var wl = wu * wu * H * 0.4, wa = fx.weightsOn ? 1 : 1 - wu;
      var ww = Math.min(G.frontHalf * 0.34, m * 2.2), wh = Math.max(16, m * 0.5);
      ctx.globalAlpha = wa;
      [-0.6, -0.2, 0.2, 0.6].forEach(function (k) {
        var x0 = G.cx + k * G.frontHalf * 0.82 + sf - ww / 2, y0 = boardFrontY(m) - wh * 0.5 - wl;
        ctx.fillStyle = '#26272d'; ctx.fillRect(x0, y0 - wh, ww, wh);
        ctx.fillStyle = '#3a3c45'; ctx.fillRect(x0, y0 - wh, ww, 3);
        ctx.fillStyle = '#ff5252'; ctx.font = '700 ' + Math.round(Math.max(10, wh * 0.42)) + 'px InterB, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('12 kg', x0 + ww / 2, y0 - wh / 2 + 1);
      });
      ctx.globalAlpha = 1;
    }
  }

  function colorOf(i, gold) {
    var c = setup.start === 'random' ? HUES[i % 100] : TEAM[sim.team[i]];
    return gold > 0 ? mix(c, GOLD, gold * 0.35) : c;
  }

  function drawMetronome(bx, by, mm, th, col, alpha, i, pulse, gold) {
    var bw = mm * 0.62, bh = mm * 0.62;
    ctx.globalAlpha = alpha;
    // body: dark pyramid with a light edge
    ctx.fillStyle = '#16171d'; ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = Math.max(1, mm * 0.025);
    ctx.beginPath(); ctx.moveTo(bx - bw / 2, by); ctx.lineTo(bx + bw / 2, by); ctx.lineTo(bx + bw * 0.16, by - bh); ctx.lineTo(bx - bw * 0.16, by - bh); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // rod from the pivot, swinging th (angle from vertical)
    var px = bx, py = by - bh * 0.3, L = mm * 1.2, sn = Math.sin(th), cs = Math.cos(th);
    var tx = px + sn * L, ty = py - cs * L, bobx = px + sn * L * 0.64, boby = py - cs * L * 0.64, br = Math.max(2.6, mm * 0.115);
    ctx.strokeStyle = rgb(col); ctx.lineWidth = Math.max(1.6, mm * 0.055); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();
    // glow + bob
    if (!Q.low) {                          // soft glow: the first thing dropped on a slow device
      var gA = 0.16 + (gold ? 0.18 * gold * (0.6 + pulse) : 0);
      ctx.fillStyle = rgb(col, gA * alpha); ctx.beginPath(); ctx.arc(bobx, boby, br * (2.3 + (gold ? pulse * 0.8 : 0)), 0, 7); ctx.fill();
    }
    ctx.fillStyle = rgb(col); ctx.strokeStyle = 'rgba(10,10,14,.75)'; ctx.lineWidth = Math.max(1, br * 0.3);
    ctx.beginPath(); ctx.arc(bobx, boby, br, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, mm * 0.04), 0, 7); ctx.fill();
    // flip marks: pending = pulsing white ring, done = expanding spark ring
    if (i < 101) {
      if (sim.flip[i]) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * Math.sin(performance.now() / 70)) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bobx, boby, br * 2.2, 0, 7); ctx.stroke();
      } else if (sim.flipT[i] >= 0 && sim.t - sim.flipT[i] < 0.7) {
        var fu = (sim.t - sim.flipT[i]) / 0.7;
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - fu) + ')'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py - L * 0.5 * cs, br * (2 + fu * 5), 0, 7); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (i < 100) { pos.bx[i] = (px + bobx) / 2 + (tx - px) * 0.1; pos.by[i] = (py + boby) / 2; pos.r[i] = Math.max(22, L * 0.55); }
  }

  // ---------------- sound ----------------
  var AC = null, master = null, BUF = {}, muted = store('c2o-muted') === '1';
  function initAudio() {
    if (AC || muted) { if (AC && AC.state === 'suspended') AC.resume(); return; }
    var Ctor = window.AudioContext || window.webkitAudioContext; if (!Ctor) return;
    AC = new Ctor();
    var comp = AC.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.12;
    master = AC.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(AC.destination);
    BUF.tick = click(1.0, 1); BUF.tock = click(0.88, 1); BUF.big = click(0.5, 2.2); BUF.knock = click(0.32, 3);
  }
  function click(fs, len) {          // synthesised wooden click: damped body modes + a short noise burst
    var sr = AC.sampleRate, n = Math.round(sr * 0.07 * len), b = AC.createBuffer(1, n, sr), d = b.getChannelData(0);
    var modes = [[1850, 0.012, 1], [2950, 0.008, 0.6], [4150, 0.005, 0.35], [980, 0.02, 0.55], [520, 0.03, 0.3]];
    var r = E.mulberry(11), pk = 0;
    for (var k = 0; k < n; k++) {
      var t = k / sr, v = 0;
      for (var j = 0; j < modes.length; j++) v += modes[j][2] * Math.exp(-t / (modes[j][1] * len)) * Math.sin(6.2832 * modes[j][0] * fs * t);
      if (t < 0.002) v += (r() * 2 - 1) * (1 - t / 0.002) * 0.8;
      d[k] = v; pk = Math.max(pk, Math.abs(v));
    }
    for (k = 0; k < n; k++) d[k] /= pk;
    return b;
  }
  function play(buf, when, gain, rate) {
    if (!AC || muted || AC.state !== 'running') return;
    var s = AC.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate || 1;
    var g = AC.createGain(); g.gain.value = gain; s.connect(g); g.connect(master);
    s.start(Math.max(AC.currentTime, when));
  }
  var BIN = 0.008;
  function flushTicks() {
    var tk = sim.ticks; if (!tk.length) return 0;
    var unified = 0;
    if (AC && !muted && AC.state === 'running') {
      var base = AC.currentTime + 0.07, now = sim.t, bins = {};
      for (var k = 0; k < tk.length; k++) {
        var e = tk[k];
        if (e.i === BIG) { play(BUF.big, base + (e.t - now), 0.55, 1); continue; }
        var key = Math.floor(e.t / BIN), bnn = bins[key] || (bins[key] = { c: 0, d: 0, t: e.t });
        bnn.c++; bnn.d += e.dir;
      }
      var act = 0; for (var i = 0; i < 100; i++) act += sim.active[i];
      for (var kk in bins) {
        var q = bins[kk];
        play(q.d >= 0 ? BUF.tick : BUF.tock, base + (q.t - now), 0.055 * Math.pow(q.c, 0.62), 0.97 + Math.random() * 0.06);
        if (q.c >= Math.max(2, act * 0.6)) unified = 1;
      }
    } else {
      var cnt = {}; for (var j = 0; j < tk.length; j++) { var kj = Math.floor(tk[j].t / BIN); cnt[kj] = (cnt[kj] || 0) + 1; }
      var a2 = 0; for (var i2 = 0; i2 < 100; i2++) a2 += sim.active[i2];
      for (var c in cnt) if (cnt[c] >= Math.max(2, a2 * 0.6)) unified = 1;
    }
    tk.length = 0;
    return unified;
  }
  function setMuted(m) {
    muted = m; store('c2o-muted', m ? '1' : '0');
    $('snd-on').style.display = m ? 'none' : ''; $('snd-off').style.display = m ? '' : 'none';
    $('mute').setAttribute('aria-pressed', m ? 'true' : 'false');
    if (!m) initAudio();
  }

  // ---------------- HUD / round ----------------
  var hud = $('hud'), elPct = $('pct'), elBar = $('bar'), elTimer = $('timer'), elTag = $('tag'), lastPct = -1, lastTimer = '', lastTag = '', lastFlips = -1;
  function activeCount() { var a = 0; for (var i = 0; i < 100; i++) a += sim.active[i]; return a; }
  function allowed(tool) { return !spec || !!spec.tools[tool]; }
  function flipLimit() { return spec && spec.tools.flip && spec.maxFlips ? spec.maxFlips : 0; }
  function flipsLeft() { var m = flipLimit(); return m ? Math.max(0, m - sim.flips) : Infinity; }
  function updateRound() {
    var p = sim.pct(), t = sim.t;
    if (!round.synced) {
      if (p >= 100) {
        if (round.hold0 < 0) round.hold0 = t;
        if (t - round.hold0 >= 0.5 && started) {
          round.synced = true; round.time = round.hold0 - round.t0;
          onSynced();
        }
      } else round.hold0 = -1;
    } else if (p < 90) {
      round.synced = false; round.t0 = t; round.hold0 = -1; round.flips0 = sim.flips; hideBanner();
    }
    var g = round.synced || p >= 97 ? 1 : 0;
    fx.gold += (g - fx.gold) * 0.08;
  }
  function clip(s, n) { var a = Array.from(s); return a.length > n ? a.slice(0, n - 1).join('').trim() + '…' : s; }
  function fmt(s) { return (Math.max(0, s)).toFixed(1); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function updateHud() {
    var p = sim.pct();
    if (p !== lastPct) { elPct.textContent = p; elBar.style.width = Math.min(100, p) + '%'; lastPct = p; }
    hud.classList.toggle('gold', fx.gold > 0.5);
    var tt = round.synced ? 'Synced in ' + fmt(round.time) + ' s' : fmt(sim.t - round.t0) + ' s';
    if (spec && spec.target) tt += (spec.kind === 'daily' ? ' · par ' : ' · target ') + fmt(spec.target) + ' s';
    if (tt !== lastTimer) { elTimer.textContent = tt; lastTimer = tt; }
    var tag = '';
    if (spec) {
      tag = spec.kind === 'daily' ? 'DAILY #' + spec.day : (spec.title ? clip(spec.title, 18).toUpperCase() : 'PLAYER LEVEL');
      if (flipLimit()) tag += ' · FLIPS ' + sim.flips + '/' + flipLimit();
      if (sim.motor) tag += ' · MOTOR ' + sim.motorBpm();
      else if (fx.weightsOn) tag += ' · 48 KG ON';
    } else if (sim.motor) {
      var b = beatEst(sim.t);
      tag = 'MOTOR ' + sim.motorBpm() + (p >= 90 && b === b ? ' · BEAT NOW ' + Math.round(b) : '');
    } else if (fx.weightsOn) tag = 'WEIGHT ON BOARD: 48 KG';
    else if (setup.start !== 'random') {
      var c = [0, 0, 0]; for (var i = 0; i < setup.N; i++) if (sim.active[i]) c[sim.team[i]]++;
      tag = setup.start === 'tie2' ? 'PINK ' + c[0] + ' · CYAN ' + c[1] : 'PINK ' + c[0] + ' · CYAN ' + c[1] + ' · LIME ' + c[2];
      if (sim.bigOn) tag += ' · BIG 1';
    } else tag = activeCount() + ' METRONOMES · ' + setup.bpm + ' BPM';
    if (tag !== lastTag) { elTag.textContent = tag; lastTag = tag; }
    if (sim.flips !== lastFlips) {
      lastFlips = sim.flips;
      $('flipsUsed').textContent = flipLimit() ? sim.flips + '/' + flipLimit() : sim.flips;
      if (flipLimit()) syncButtons();
    }
  }
  var dailyDoneSent = {};
  function onSynced() {
    var flips = sim.flips - round.flips0, n = activeCount(), t = round.time;
    var big = 'Synced in ' + fmt(t) + ' s!', sub = n + ' metronomes in step', note = '', small = 'image + link';
    if (flips) sub += ' · ' + flips + (flips === 1 ? ' flip' : ' flips');
    last = { time: t, n: n, flips: flips, beaten: null, streak: 0 };
    var meaningful = false;   // a daily done or a challenge best: worth one pointer to the save code
    if (challenge) {
      var key = 'c2o-best-' + challenge.id, prev = parseFloat(store(key) || 'NaN');
      var score = challenge.score === 'flips' ? flips * 1000 + t : t;
      if (!(score >= prev)) { store(key, String(score)); sub += ' · new best!'; renderChips(); meaningful = true; }
      else sub += ' · best ' + bestText(challenge, prev);
    }
    if (spec) {
      var beaten = spec.target ? r1(t) <= spec.target : null;
      last.beaten = beaten;
      if (spec.kind === 'daily') {
        var rec = spec.day === LV.dayNumber() ? LV.recordDaily(spec.day, t) : null;
        meaningful = !!rec;
        big = 'Daily #' + spec.day + ' done!';
        sub = fmt(t) + ' s · par ' + fmt(spec.target) + ' s ' + (beaten ? 'beaten' : 'missed');
        if (rec) {
          last.streak = rec.streak;
          sub += ' · ' + rec.streak + '-day streak';
          if (!rec.newBest) sub += ' · best ' + fmt(rec.best) + ' s';
        }
        note = 'Next daily in ' + LV.fmtCountdown(LV.msToNextDay());
        if (!dailyDoneSent[spec.day]) { dailyDoneSent[spec.day] = 1; T('daily_completed', { day: spec.day, t: r1(t), flips: flips, par: beaten ? 1 : 0 }); }
        renderDailyBits(); renderChips();
      } else {
        if (spec.target) {
          var d = Math.abs(spec.target - r1(t));
          if (beaten) big = 'Beat it! ' + fmt(t) + ' s';
          sub = 'Target ' + fmt(spec.target) + ' s · ' + (beaten ? 'beaten by ' + fmt(d) + ' s' : 'missed by ' + fmt(d) + ' s');
          if (!beaten) note = 'So close. Again gives you the same start.';
        }
        small = beaten || !spec.target ? 'dare: beat ' + fmt(t) + ' s' : 'send the level';
      }
    }
    T('synced', { t: r1(t), n: n, flips: flips, ch: challenge ? challenge.id : '', m: mode() });
    if (challenge) T('challenge_complete', { ch: challenge.id, t: r1(t), flips: flips });
    $('bannerBig').textContent = big; $('bannerSub').textContent = sub;
    $('bannerNote').textContent = note; $('bannerNote').hidden = !note;
    $('bShareSub').textContent = small;
    var sh = meaningful && !!saveCode && saveCode.hintDue();
    $('bBSave').hidden = !sh; if (sh) saveCode.hintShown();
    $('banner').classList.add('show');
    if (AC && !muted) { var t0 = AC.currentTime + 0.05; [523.25, 659.25, 783.99].forEach(function (f, k) { chime(f, t0 + k * 0.06); }); }
  }
  function chime(f, when) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.12, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, when + 1.4);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + 1.5);
  }
  function hideBanner() { var b = $('banner'); if (b) b.classList.remove('show'); }
  function bestText(c, v) {
    if (!(v === v)) return '';
    if (c.score === 'flips') { var f = Math.floor(v / 1000); return f + (f === 1 ? ' flip' : ' flips') + ', ' + fmt(v - f * 1000) + ' s'; }
    return fmt(v) + ' s';
  }
  function acted() {                       // any move after a sync starts a new attempt
    if (round.synced) { round.synced = false; round.t0 = sim.t; round.hold0 = -1; round.flips0 = sim.flips; hideBanner(); }
  }
  function mode() { return spec ? spec.kind : challenge ? 'challenge' : 'free'; }

  // ---------------- controls ----------------
  var ACTS = { aNudge: 'nudge', aShake: 'shake', aFlip: 'flip', aBig: 'big', aWeights: 'weights', aLift: 'lift' };
  function setAct(id, label, sub) { var b = $(id); b.querySelector('.t').textContent = label; b.querySelector('small').textContent = sub; }
  function lockMsg(id) {
    if (id === 'aFlip' && allowed('flip') && flipsLeft() <= 0) return 'No flips left. Reset or Again to start over.';
    return spec && spec.kind === 'daily' ? 'Not allowed in today’s daily' : 'Not allowed in this level';
  }
  function syncButtons() {
    if (!sim) return;
    var left = flipsLeft();
    setAct('aNudge', 'Nudge', 'push board once');
    setAct('aShake', 'Shake', (sim.motor ? 'on · ' : 'motor ') + sim.motorBpm());
    setAct('aFlip', 'Flip ' + Math.max(0, Math.min(flipN, left)), left === Infinity ? 'reverse swings' : left + (left === 1 ? ' flip left' : ' flips left'));
    setAct('aBig', sim.bigOn ? 'Remove big one' : 'Add big one', '18x heavier');
    setAct('aWeights', fx.weightsOn ? 'Remove weights' : 'Add weights', '48 kg');
    setAct('aLift', liftedIdx.length ? 'Put 20 back' : 'Lift 20 off', 'off the board');
    $('aShake').classList.toggle('on', sim.motor);
    $('aBig').classList.toggle('on', sim.bigOn);
    $('aWeights').classList.toggle('on', fx.weightsOn);
    $('aLift').classList.toggle('on', liftedIdx.length > 0);
    $('aLift').disabled = !liftedIdx.length && activeCount() < 21;
    Object.keys(ACTS).forEach(function (id) {
      var b = $(id), lk = !allowed(ACTS[id]) || (id === 'aFlip' && left <= 0);
      b.classList.toggle('locked', lk);
      b.setAttribute('aria-disabled', lk ? 'true' : 'false');
      if (lk) b.querySelector('small').textContent = !allowed(ACTS[id]) ? (spec.kind === 'daily' ? 'not today' : 'not in this level') : 'no flips left';
    });
    var flipOff = !allowed('flip');
    $('fMinus').disabled = flipOff || flipN <= 1; $('fPlus').disabled = flipOff || flipN >= 20;
    $('flipN').textContent = flipN;
    $('flipsUsed').textContent = flipLimit() ? sim.flips + '/' + flipLimit() : sim.flips;
    document.querySelectorAll('#pSet .seg .btn').forEach(function (b) { b.classList.toggle('on', b.dataset.start === setup.start); });
    $('sN').value = setup.N; $('oN').textContent = setup.N; $('sB').value = setup.bpm; $('oB').textContent = setup.bpm;
  }
  function hit(b) {                          // visible (and on phones, felt) feedback for every press
    b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
    if (!FINE && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  }
  function nope(b) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); }
  function on(id, fn) {
    $(id).addEventListener('click', function (e) {
      initAudio();
      var b = $(id), act = /^a[A-Z]/.test(id);
      if (b.classList.contains('locked')) { toast(lockMsg(id)); nope(b); return; }
      if (!started && act) begin();
      if (act) hit(b);
      fn(e);
    });
  }
  on('aNudge', function () { T('control', { c: 'nudge' }); acted(); sim.nudge(); fx.push = sim.t; play(BUF.knock, AC ? AC.currentTime + 0.01 : 0, 0.9, 1); });
  on('aShake', function () { T('control', { c: 'shake' }); acted(); sim.setMotor(!sim.motor); syncButtons(); });
  on('aFlip', function () {
    T('control', { c: 'flip', n: flipN });
    acted();
    var pool = [], i;
    for (i = 0; i < setup.N; i++) if (sim.active[i] && !sim.flip[i]) pool.push(i);
    if (setup.start !== 'random') {             // flip from ONE team (cyan): flipping evenly across teams changes nothing
      var cy = pool.filter(function (k) { return sim.team[k] === 1; }); if (cy.length) pool = cy;
    }
    // nearest the middle and the front first, like the videos' hand
    pool.sort(function (a, b) { return (Math.abs(lay.u[a]) - lay.z[a] * 0.6) - (Math.abs(lay.u[b]) - lay.z[b] * 0.6); });
    var n = Math.min(flipN, pool.length, flipsLeft());
    for (i = 0; i < n; i++) sim.flipOne(pool[i]);
    tapSound(); syncButtons();
  });
  on('fMinus', function () { flipN = Math.max(1, flipN - 1); syncButtons(); });
  on('fPlus', function () { flipN = Math.min(20, flipN + 1); syncButtons(); });
  on('aBig', function () {
    T('control', { c: 'big' });
    acted();
    if (sim.bigOn) { sim.removeBig(); fx.bigT = sim.t; fx.bigOut = true; }
    else { sim.addBig(); fx.bigT = sim.t; fx.bigOut = false; play(BUF.knock, AC ? AC.currentTime + 0.4 : 0, 0.7, 0.8); }
    syncButtons();
  });
  on('aWeights', function () {
    T('control', { c: 'weights' });
    acted();
    fx.weightsOn = !fx.weightsOn; fx.weightsT = sim.t; sim.setWeights(fx.weightsOn); setup.weights = fx.weightsOn;
    play(BUF.knock, AC ? AC.currentTime + (fx.weightsOn ? 0.38 : 0.01) : 0, 0.8, 0.7);
    syncButtons();
  });
  on('aLift', function () {
    T('control', { c: 'lift' });
    acted();
    if (liftedIdx.length) {
      for (var k = 0; k < liftedIdx.length; k++) { sim.active[liftedIdx[k]] = 1; fx.drop[liftedIdx[k]] = sim.t; }
      sim.lifted = 0; sim.M = sim.mass(); sim.zeroMomentum(); liftedIdx = [];
    } else {
      var pool = [];
      for (var i = 0; i < setup.N; i++) if (sim.active[i] && (setup.start !== 'tie3' || sim.team[i] === 2)) pool.push(i);
      if (pool.length < 20) { pool = []; for (i = 0; i < setup.N; i++) if (sim.active[i]) pool.push(i); }
      var r = E.mulberry(setup.seed + 5);
      for (i = pool.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      liftedIdx = pool.slice(0, 20);
      sim.lift(liftedIdx); liftedIdx.forEach(function (k) { fx.lift[k] = sim.t; });
    }
    syncButtons();
  });
  on('reset', function () { T('control', { c: 'reset' }); newSim(true); });
  on('rand', function () {
    T('control', { c: 'randomise' });
    if (spec) { toast('Levels keep the same start: this restarts it'); newSim(true); return; }
    newSim(false);
  });
  document.querySelectorAll('#pSet .seg .btn').forEach(function (b) {
    b.addEventListener('click', function () { T('control', { c: 'teams', v: b.dataset.start }); initAudio(); setChallenge(null); setup.start = b.dataset.start; newSim(false); });
  });
  $('sN').addEventListener('input', function () { setChallenge(null); setup.N = +this.value; $('oN').textContent = setup.N; newSim(true); });
  $('sB').addEventListener('input', function () {
    setup.bpm = +this.value; $('oB').textContent = setup.bpm; sim.setBpm(setup.bpm); acted();
    if (challenge || spec) setChallenge(null);
    syncButtons();
  });
  $('sN').addEventListener('change', function () { T('control', { c: 'count', v: setup.N }); });
  $('sB').addEventListener('change', function () { T('control', { c: 'speed', v: setup.bpm }); });
  $('mute').addEventListener('click', function () { setMuted(!muted); T('mute', { on: muted ? 1 : 0 }); });
  on('bAgain', function () { T('control', { c: 'again' }); newSim(!!spec); });
  $('bClose').addEventListener('click', function () { hideBanner(); });
  on('bShare', function () { openCard(); });
  on('share', function () { T('share', { w: 'top', synced: round.synced ? 1 : 0 }); share(); });

  function tapSound() { play(BUF.tick, AC ? AC.currentTime + 0.005 : 0, 0.3, 1.6); }

  // tap a metronome to flip it
  var lockToastT = 0;
  cv.addEventListener('pointerdown', function (e) {
    initAudio();
    if (!started) { begin(); return; }
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 1e9;
    for (var i = 0; i < setup.N; i++) {
      if (!sim.active[i] || !pos.r[i]) continue;
      var dx = x - pos.bx[i], dy = y - pos.by[i], d = dx * dx + dy * dy;
      if (d < pos.r[i] * pos.r[i] && d < bd) { bd = d; best = i; }
    }
    if (best < 0) return;
    if (!allowed('flip') || flipsLeft() <= 0) {
      if (Date.now() - lockToastT > 2500) { lockToastT = Date.now(); toast(allowed('flip') ? 'No flips left' : (spec.kind === 'daily' ? 'No flipping in today’s daily' : 'No flipping in this level')); }
      return;
    }
    acted();
    if (sim.flipOne(best)) { tapSound(); T('control', { c: 'tap' }); doneHint(); syncButtons(); }
  });

  // ---------------- keyboard (desktop) ----------------
  var KEYS = { n: 'aNudge', ' ': 'aNudge', s: 'aShake', f: 'aFlip', b: 'aBig', w: 'aWeights', l: 'aLift', '+': 'fPlus', '=': 'fPlus', '-': 'fMinus', r: 'bAgain' };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || OG) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { if (e.key === 'Escape' && openModal) closeModal(); return; }
    if (openModal) { if (e.key === 'Escape') closeModal(); return; }
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    var startOpen = !$('start').classList.contains('hide');
    if (startOpen) {
      if ((k === 'Enter' || k === ' ') && (tag === 'BODY' || !tag)) { e.preventDefault(); $('play').click(); }
      else if (k === 'Escape' && started) closeStart();
      return;
    }
    if (k === 'm') { $('mute').click(); return; }
    if (k === 'Escape') { hideBanner(); return; }
    var id = KEYS[k];
    if (!id || (k === ' ' && tag === 'BUTTON')) return;
    e.preventDefault();
    if (id === 'bAgain') { T('control', { c: 'again' }); newSim(!!spec); hit($('reset')); return; }
    $(id).click();
  });

  // ---------------- challenges + modes UI ----------------
  function el(tag, cls, text) { var x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; }
  function renderChips() {
    var box = $('chips'); box.innerHTML = '';
    var today = LV.dayNumber(), prog = LV.loadProgress(), done = prog.last === today;
    var d = el('button', 'chip daily' + (spec && spec.kind === 'daily' ? ' on' : ''), 'Daily #' + today);
    if (done) d.appendChild(el('span', 'best', 'done'));
    d.addEventListener('click', function () { openDaily('chip'); });
    box.appendChild(d);
    var mk = el('button', 'chip make', '+ Create level');
    mk.addEventListener('click', function () { openBuilder(); });
    box.appendChild(mk);
    CH.forEach(function (c) {
      var b = el('button', 'chip' + (challenge && challenge.id === c.id ? ' on' : ''), c.name);
      var best = parseFloat(store('c2o-best-' + c.id) || 'NaN');
      if (best === best) b.appendChild(el('span', 'best', bestText(c, best)));
      b.addEventListener('click', function () { initAudio(); setChallenge(c); T('challenge_start', { ch: c.id, src: 'chip' }); if (!started) begin(); else closeStart(); });
      box.appendChild(b);
    });
    if (saveCode) {
      var sv = el('button', 'chip save', 'Save code');
      sv.addEventListener('click', function () { saveCode.open(); });
      box.appendChild(sv);
    }
    var g = $('goaltext'); g.innerHTML = '';
    if (spec) {
      g.appendChild(el('strong', 'gt-title', spec.kind === 'daily' ? spec.title : (spec.title || 'Player level')));
      g.appendChild(el('span', 'gt-line', spec.kind === 'daily' ? spec.goal : describe(spec)));
      g.appendChild(el('span', 'gt-line', toolsText(spec) + (spec.target ? ' · ' + (spec.kind === 'daily' ? 'par ' : 'target ') + fmt(spec.target) + ' s' : '')));
      var x = el('button', 'btn gt-exit', 'Back to free play');
      x.addEventListener('click', function () { setSpec(null); });
      g.appendChild(x);
    } else g.textContent = challenge ? challenge.goal : 'Free play. Pick a challenge, try the daily, make your own level, or change the set-up below and tap metronomes to flip them.';
  }
  function url(q) { try { history.replaceState(null, '', q); } catch (e) {} }
  function setChallenge(c) {
    var hadSpec = !!spec;
    challenge = c; spec = null;
    if (c) {
      setup.N = c.N; setup.start = c.start; setup.bpm = 208; setup.weights = !!c.weights; setup.spread = 1;
      newSim(false);
      url('?c=' + c.id);
    } else {
      setup.weights = fx.weightsOn;
      if (hadSpec) setup.spread = 1;
      url(location.pathname);
    }
    renderChips(); syncButtons();
  }
  function setSpec(L, src) {
    challenge = null; spec = L || null;
    if (spec) {
      if (src) spec.src = src;
      setup.N = L.N; setup.bpm = L.bpm; setup.start = L.start; setup.weights = L.weights; setup.spread = L.spread; setup.seed = L.seed;
      newSim(true);
      url(spec.kind === 'daily' ? '?daily' : '?l=' + LV.encodeLevel(spec));
    } else {
      for (var k in DEFAULT) setup[k] = DEFAULT[k];
      newSim(false);
      url(location.pathname);
    }
    renderChips(); syncButtons();
  }
  var TOOLNAME = { nudge: 'Nudge', shake: 'Shake', flip: 'Flip', big: 'Big one', weights: 'Weights', lift: 'Lift 20' };
  function describe(L) {
    var parts = [L.N + (L.N === 1 ? ' metronome' : ' metronomes'), L.bpm + ' bpm',
      L.start === 'random' ? (L.spread < 1 ? 'start chaos ' + Math.round(L.spread * 100) + '%' : 'random start') : L.start === 'tie2' ? '2 teams' : '3 teams'];
    if (L.weights) parts.push('48 kg on the board');
    return parts.join(' · ');
  }
  function toolsText(L) {
    var list = LV.TOOLS.filter(function (t) { return L.tools[t]; }).map(function (t) { return TOOLNAME[t] + (t === 'flip' && L.maxFlips ? ' (max ' + L.maxFlips + ')' : ''); });
    return list.length ? 'Tools: ' + list.join(', ') : 'No tools: just watch';
  }
  var playedKeys = {};
  function trackSpecPlay() {
    var key = spec.kind === 'daily' ? 'd' + spec.day : LV.encodeLevel(spec);
    if (playedKeys[key]) return; playedKeys[key] = 1;
    if (spec.kind === 'daily') T('daily_played', { day: spec.day });
    else T('level_played', { src: spec.src === 'builder' ? 'builder' : 'link', n: spec.N, tg: spec.target });
  }
  function openDaily(src) {
    initAudio();
    setSpec(LV.daily(LV.dayNumber()), src);
    showStart('intro');
  }

  // ---------------- save code (/game-save.v1.js): best times + daily streak to another phone. Progress only, no IDs. ----------------
  // code data: c = challenge bests {id: score}, d = [streak, last day, best streak], b = daily best times {day: s}
  var GS = window.GameSave, saveCode = null;
  function exportProgress() {
    var c = {}, any = false, p = LV.loadProgress(), out = {};
    CH.forEach(function (ch) { var v = parseFloat(store('c2o-best-' + ch.id)); if (v === v && v > 0) { c[ch.id] = Math.round(v * 1000) / 1000; any = true; } });
    if (any) out.c = c;
    if (p.last) out.d = [p.streak | 0, p.last | 0, p.bestStreak | 0];
    if (Object.keys(p.best).length) out.b = p.best;
    return out;
  }
  function mergeProgress(o) {
    if ((o.c != null && (typeof o.c !== 'object' || Array.isArray(o.c))) || (o.b != null && (typeof o.b !== 'object' || Array.isArray(o.b)))) throw new Error('bad');
    var better = 0, note = '', today = LV.dayNumber();
    Object.keys(o.c || {}).forEach(function (id) {
      var v = o.c[id]; if (!CHMAP[id] || !GS.isNum(v, 0.001, 1e7)) return;
      var prev = parseFloat(store('c2o-best-' + id) || 'NaN');
      if (!(v >= prev - 0.001)) { store('c2o-best-' + id, String(v)); better++; }
    });
    var p = LV.loadProgress(), d = o.d, changed = false;
    if (Array.isArray(d) && GS.isInt(d[0], 0, 1e5) && GS.isInt(d[1], 1, today + 1) && GS.isInt(d[2], 0, 1e5)) {
      var before = LV.currentStreak(p, today), m = GS.mergeStreak(p.streak, p.last, d[0], d[1]);
      p.streak = m.streak; p.last = m.last; p.bestStreak = Math.max(p.bestStreak, d[2], m.streak); changed = true;
      var now = LV.currentStreak(p, today); if (now > before) note = ' Daily streak: ' + now + ' days.';
    }
    Object.keys(o.b || {}).forEach(function (k) {
      var day = +k, v = o.b[k];
      if (!GS.isInt(day, today - 30, today + 1) || !GS.isNum(v, 0.1, 1e5)) return;
      if (!(+p.best[day] <= v)) { p.best[day] = Math.round(v * 10) / 10; changed = true; }
    });
    if (changed) LV.saveProgress(p);
    if (!better && !note) return 'Loaded. You already had everything in that code, so nothing changed.';
    return 'Loaded: ' + (better ? better + ' better challenge time' + (better === 1 ? '' : 's') + '.' : 'no better times.') + note + ' Nothing you had was lost.';
  }
  if (GS) saveCode = GS.create({
    prefix: 'MS', title: 'Metronome Sync', accent: '#ffcc66', ink: '#1a1406',
    intro: 'Your best times live only in this browser. Copy this code and keep it somewhere safe. Load it on another phone or browser to get your challenge bests and daily streak back. It holds only game progress, nothing personal.',
    get: exportProgress, merge: mergeProgress,
    after: function () { renderChips(); renderDailyBits(); }
  });
  $('bBSave').addEventListener('click', function () { if (saveCode) saveCode.open(); $('bBSave').hidden = true; });

  // ---------------- start screen: home (Play / Daily / Create) or a mode intro ----------------
  var startMode = 'home';
  function setStartTitle(main, gold) {
    var h = $('sTitle'); h.innerHTML = '';
    h.appendChild(document.createTextNode(main));
    if (gold) { h.appendChild(document.createElement('br')); h.appendChild(el('span', '', gold)); }
  }
  function renderDailyBits() {
    var today = LV.dayNumber(), p = LV.loadProgress(), st = LV.currentStreak(p, today), done = p.last === today;
    $('dailyName').textContent = 'Daily #' + today;
    $('dailySub').textContent = done ? 'Done · next in ' + LV.fmtCountdown(LV.msToNextDay()) : st ? st + '-day streak' : 'New puzzle today';
    $('bDaily').classList.toggle('done', done);
  }
  function showStart(kind) {
    startMode = kind;
    var s = $('start'), intro = kind === 'intro';
    $('sRow').hidden = intro; $('sMeta').hidden = !intro;
    $('play').lastChild.textContent = intro ? (spec ? (spec.kind === 'daily' ? 'Start' : 'Play level') : 'Play') : 'Play';
    $('toChallenges').textContent = intro ? 'Back to free play' : 'Challenges';
    if (!intro) {
      $('sKick').textContent = 'CHAOS TO ORDER';
      setStartTitle('Can 100 metronomes', 'sync up?');
      $('sText').textContent = 'Tap to flip. Watch chaos turn into order.';
      renderDailyBits();
    } else if (spec && spec.kind === 'daily') {
      var p = LV.loadProgress(), today = LV.dayNumber(), st = LV.currentStreak(p, today), best = p.best[spec.day];
      $('sKick').textContent = 'DAILY CHALLENGE #' + spec.day + (st ? ' · ' + st + '-DAY STREAK' : '');
      setStartTitle(spec.name, 'Par ' + fmt(spec.target) + ' s');
      $('sText').textContent = (best ? 'Done today in ' + fmt(best) + ' s. Go again for a better time. ' : '') + spec.goal;
      $('sMeta').textContent = describe(spec) + ' · new puzzle in ' + LV.fmtCountdown(LV.msToNextDay()) + ' (00:00 UTC)';
    } else if (spec) {
      $('sKick').textContent = 'PLAYER LEVEL';
      setStartTitle(spec.title || 'A player’s level', spec.target ? 'Beat ' + fmt(spec.target) + ' s' : 'Can you sync it?');
      $('sText').textContent = describe(spec) + '.';
      $('sMeta').textContent = toolsText(spec);
    } else if (challenge) {
      $('sKick').textContent = 'CHALLENGE';
      setStartTitle(challenge.name.replace(/\?$/, ''), 'Your turn.');
      $('sText').textContent = challenge.goal;
      $('sMeta').hidden = true;
    }
    s.classList.toggle('intro', intro);
    s.classList.remove('hide');
    $('startX').hidden = !started;
    var top = $('stage').getBoundingClientRect().top;
    if (top < -40) { try { window.scrollTo({ top: Math.max(0, window.scrollY + top - 8), behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }
  }
  function closeStart() { $('start').classList.add('hide'); }
  $('play').addEventListener('click', function () {
    initAudio();
    if (startMode === 'home' && (spec || challenge)) { spec = null; challenge = null; for (var k in DEFAULT) setup[k] = DEFAULT[k]; url(location.pathname); renderChips(); }
    begin();
  });
  $('toChallenges').addEventListener('click', function () {
    if (startMode === 'intro') { setSpec(null); setChallenge(null); showStart('home'); return; }
    closeStart();
    var pCh = $('pCh');
    pCh.scrollIntoView({ behavior: 'smooth', block: 'start' });
    pCh.classList.add('flash'); setTimeout(function () { pCh.classList.remove('flash'); }, 1600);
  });
  $('bDaily').addEventListener('click', function () { openDaily('home'); });
  $('bCreate').addEventListener('click', function () { openBuilder(); });
  $('startX').addEventListener('click', closeStart);
  $('menu').addEventListener('click', function () { T('control', { c: 'menu' }); hideBanner(); showStart('home'); });
  function begin() {
    started = true; closeStart();
    T('play', { ch: challenge ? challenge.id : '' });
    if (spec) trackSpecPlay();
    newSim(true);            // the timer starts from a fresh out-of-step board
    round.t0 = sim.t; round.hold0 = -1; round.synced = false; round.flips0 = sim.flips;
    showHint();
  }

  // ---------------- first-time hint ----------------
  function showHint() { if (store('c2o-tip1') !== '1' && allowed('flip')) $('hint').hidden = false; }
  function doneHint() { if (!$('hint').hidden) { $('hint').hidden = true; store('c2o-tip1', '1'); } }
  $('hintX').addEventListener('click', doneHint);
  if (FINE) $('hintT').textContent = 'Click a metronome to flip it';

  // ---------------- modals ----------------
  var openModal = null, lastFocus = null;
  function showModal(m) {
    if (openModal) closeModal();
    openModal = m; lastFocus = document.activeElement;
    m.hidden = false; document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () { m.classList.add('in'); });
    var c = m.querySelector('[data-close]'); if (c) { try { c.focus({ preventScroll: true }); } catch (e) {} }
  }
  function closeModal() {
    var m = openModal; if (!m) return;
    openModal = null; m.classList.remove('in'); m.hidden = true;
    document.documentElement.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || (e.target.closest && e.target.closest('[data-close]'))) closeModal(); });
  });

  // ---------------- level builder ----------------
  var bd = null, createdSent = {};
  function bdRead() {
    bd.title = LV.sanitizeTitle($('bdTitle').value);
    bd.N = +$('bdN').value; bd.bpm = +$('bdB').value; bd.spread = +$('bdS').value / 10; bd.target = +$('bdT').value;
    return LV.normalizeLevel(bd);
  }
  function bdRender() {
    var L = bdRead();
    $('bdNo').textContent = L.N; $('bdBo').textContent = L.bpm; $('bdSo').textContent = Math.round(L.spread * 100) + '%';
    $('bdTo').textContent = fmt(L.target) + ' s';
    $('bdTitleN').textContent = Array.from($('bdTitle').value).length + '/' + LV.TITLE_MAX;
    $('bdSpreadF').classList.toggle('off', L.start !== 'random'); $('bdS').disabled = L.start !== 'random';
    document.querySelectorAll('#bdStart .btn').forEach(function (b) { b.classList.toggle('on', b.dataset.v === L.start); });
    document.querySelectorAll('#bdTools .chip').forEach(function (b) { var on = !!L.tools[b.dataset.t]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    $('bdW').classList.toggle('on', L.weights); $('bdW').setAttribute('aria-pressed', L.weights ? 'true' : 'false');
    $('bdF').textContent = L.maxFlips ? L.maxFlips : 'Any';
    $('bdFm').disabled = !L.maxFlips; $('bdFp').disabled = L.maxFlips >= 99;
    $('bdFlipRow').classList.toggle('off', !L.tools.flip);
    $('bdLink').value = location.origin + location.pathname + '?l=' + LV.encodeLevel(L);
  }
  function openBuilder() {
    initAudio();
    var src = spec && spec.kind === 'level' ? spec : setup;
    bd = { N: src.N, bpm: src.bpm, start: src.start, spread: src.spread || 1, weights: !!(src.weights), target: spec && spec.kind === 'level' && spec.target ? spec.target : 15,
           maxFlips: spec && spec.kind === 'level' ? spec.maxFlips : 0, seed: (Math.random() * 2147483647) | 0, title: spec && spec.kind === 'level' ? spec.title : '',
           tools: spec && spec.kind === 'level' ? Object.assign({}, spec.tools) : { nudge: true, shake: true, flip: true, big: true, weights: true, lift: true } };
    if (bd.N < 2) bd.N = 2;
    $('bdTitle').value = bd.title; $('bdN').value = bd.N; $('bdB').value = bd.bpm; $('bdS').value = Math.round(bd.spread * 10); $('bdT').value = bd.target;
    bdRender();
    T('control', { c: 'create' });
    showModal($('builder'));
  }
  ['bdTitle', 'bdN', 'bdB', 'bdS', 'bdT'].forEach(function (id) { $(id).addEventListener('input', bdRender); });
  document.querySelectorAll('#bdStart .btn').forEach(function (b) { b.addEventListener('click', function () { bd.start = b.dataset.v; bdRender(); }); });
  document.querySelectorAll('#bdTools .chip').forEach(function (b) { b.addEventListener('click', function () { bd.tools[b.dataset.t] = !bd.tools[b.dataset.t]; bdRender(); }); });
  $('bdW').addEventListener('click', function () { bd.weights = !bd.weights; bdRender(); });
  $('bdFm').addEventListener('click', function () { bd.maxFlips = Math.max(0, (bd.maxFlips || 0) - 1); bdRender(); });
  $('bdFp').addEventListener('click', function () { bd.maxFlips = Math.min(99, (bd.maxFlips || 0) + 1); bdRender(); });
  $('bdTitle').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });
  function levelCreated(L, how) {
    var code = LV.encodeLevel(L);
    if (createdSent[code]) return; createdSent[code] = 1;
    T('level_created', { n: L.N, b: L.bpm, s: L.start, tl: LV.toolMask(L.tools), tg: L.target, mf: L.maxFlips, w: L.weights ? 1 : 0, how: how });
  }
  function levelShareText(L, myTime) {
    var t = myTime != null ? myTime : L.target;
    return (L.title ? '“' + L.title + '”: ' : '') + 'sync ' + L.N + ' metronomes' + (t ? ' in under ' + fmt(t) + ' s' : '') + '. My Metronome Sync level. Can you beat it?';
  }
  $('bdPlay').addEventListener('click', function () {
    var L = bdRead(); levelCreated(L, 'play');
    var lv = LV.decodeLevel(LV.encodeLevel(L)); lv.kind = 'level';
    closeModal(); setSpec(lv, 'builder'); begin();
  });
  $('bdShare').addEventListener('click', function () {
    var L = bdRead(); levelCreated(L, 'share');
    shareLink($('bdLink').value, levelShareText(L), 'Metronome Sync level');
  });
  $('bdCopy').addEventListener('click', function () {
    var L = bdRead(); levelCreated(L, 'copy');
    copyText($('bdLink').value).then(function (ok) { if (ok) toast('Level link copied'); else { $('bdLink').select(); toast('Select the link and copy it'); } });
  });

  // ---------------- share: link, text, card ----------------
  var toastT = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  function copyText(s) {
    function legacy() {
      try {
        var ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, s.length);
        var ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(function () { return true; }, function () { return legacy(); });
    return Promise.resolve(legacy());
  }
  function shareLink(link, text, title) {
    if (navigator.share) { navigator.share({ title: title, text: text, url: link }).catch(function () {}); return; }
    copyText(text + ' ' + link).then(function (ok) { toast(ok ? 'Link copied' : link); });
  }
  /* utm_source=share (20 Nov 2026): /admin shows how many visitors the shared results bring back */
  var UTM_SHARE = 'utm_source=share&utm_campaign=metronomes';
  function shareUrl(useMyTime) {
    var base = location.origin + location.pathname;
    if (spec && spec.kind === 'daily') return base + '?daily&' + UTM_SHARE;
    if (spec) {
      var L = {}; for (var k in spec) L[k] = spec[k];
      if (useMyTime && last.time && (last.beaten || !spec.target)) L.target = Math.min(r1(last.time), spec.target || 1e9);
      return base + '?l=' + LV.encodeLevel(L) + '&' + UTM_SHARE;
    }
    return base + (challenge ? '?c=' + challenge.id + '&' : '?') + UTM_SHARE;
  }
  function share() {
    var link = shareUrl(round.synced);
    var text = round.synced
      ? 'I got ' + activeCount() + ' metronomes in sync in ' + fmt(round.time) + ' s' + (sim.flips - round.flips0 ? ' with ' + (sim.flips - round.flips0) + ' flips' : '') + '. Can you beat it?'
      : spec && spec.kind === 'level' ? levelShareText(spec) : 'Can you get 100 metronomes to sync? Real physics from Chaos to Order.';
    shareLink(link, text, 'Metronome Sync Game');
  }
  function resultText() {
    var s = 'I synced ' + last.n + ' metronomes in ' + fmt(last.time) + ' s 🎯';
    if (spec && spec.kind === 'daily') s += ' on Daily #' + spec.day + (last.streak > 1 ? ' (' + last.streak + '-day streak)' : '') + '.';
    else if (spec) s += spec.title ? ' on “' + spec.title + '”.' : ' on a player level.';
    else if (challenge) s += ' in “' + challenge.name.replace(/\?$/, '') + '”.';
    return s + ' Can you beat it?';
  }
  var card = { blob: null, file: null, text: '', link: '' };
  function cardData() {
    var o = { source: cv, line1: 'I synced ' + last.n + (last.n === 1 ? ' metronome' : ' metronomes'), line2: 'in ' + fmt(last.time) + ' s', url: 'saagarverma.com/metronomes', tag: '', sub: '' };
    var sub = [];
    if (last.flips) sub.push(last.flips + (last.flips === 1 ? ' flip' : ' flips'));
    if (spec && spec.kind === 'daily') {
      o.tag = 'DAILY #' + spec.day + ' · ' + spec.name.toUpperCase();
      if (last.beaten) sub.push('par ' + fmt(spec.target) + ' s beaten');
      if (last.streak > 1) sub.push(last.streak + '-day streak');
    } else if (spec) {
      o.tag = spec.title ? '“' + spec.title + '”' : 'PLAYER LEVEL';
      if (spec.target && last.beaten) sub.push('target ' + fmt(spec.target) + ' s beaten');
    } else if (challenge) o.tag = challenge.name.toUpperCase();
    else sub.push(setup.bpm + ' bpm');
    o.sub = sub.join(' · ');
    return o;
  }
  function openCard() {
    if (!last.time && !round.synced) { share(); return; }
    var go = function () {
      var c = LV.drawCard(cardData());
      card.text = resultText(); card.link = shareUrl(true); card.blob = null; card.file = null;
      $('cdImg').src = c.toDataURL('image/png');
      c.toBlob(function (b) {
        card.blob = b;
        try { card.file = new File([b], 'metronome-sync-' + fmt(last.time) + 's.png', { type: 'image/png' }); } catch (e) { card.file = null; }
        var files = card.file && navigator.canShare && (function () { try { return navigator.canShare({ files: [card.file] }); } catch (e) { return false; } })();
        $('cdShare').querySelector('.t').textContent = files ? 'Share image' : 'Share link';
        $('cdHint').textContent = files ? '' : (FINE ? '' : 'Tip: press and hold the image to save it.');
        $('cdHint').hidden = !$('cdHint').textContent;
        card.canFiles = !!files;
      }, 'image/png');
      T('share_card', { w: 'open', m: mode() });
      showModal($('cardM'));
    };
    if (document.fonts && document.fonts.load) document.fonts.load('700 64px InterB').then(go, go); else go();
  }
  $('cdShare').addEventListener('click', function () {
    T('share_card', { w: 'share', m: mode() });
    if (card.canFiles && navigator.share) {
      navigator.share({ files: [card.file], title: 'Metronome Sync', text: card.text + ' ' + card.link }).catch(function (e) {
        if (e && e.name !== 'AbortError') shareLink(card.link, card.text, 'Metronome Sync');
      });
      return;
    }
    shareLink(card.link, card.text, 'Metronome Sync');
  });
  $('cdSave').addEventListener('click', function () {
    T('share_card', { w: 'save', m: mode() });
    var a = document.createElement('a');
    a.href = card.blob && window.URL && URL.createObjectURL ? URL.createObjectURL(card.blob) : $('cdImg').src;
    a.download = 'metronome-sync-' + fmt(last.time) + 's.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
    toast(FINE ? 'Image saved' : 'Saving image. If nothing happens, press and hold it.');
  });
  $('cdCopy').addEventListener('click', function () {
    T('share_card', { w: 'copy', m: mode() });
    copyText(card.text + ' ' + card.link).then(function (ok) { toast(ok ? 'Text + link copied' : card.link); });
  });

  // ---------------- main loop ----------------
  var H_STEP = 1 / 600, SUB = 10, MAX_CHUNKS = 4;   // 10 RK4 steps per 1/60 s; at most 4 chunks (1/15 s) per frame
  var acc = 0, lastNow = 0, perf = { n: 0, ema: 6, dt: 16.7 };
  function frame(now) {
    var w0 = performance.now();
    var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
    acc += dt;
    var chunks = 0, unified = 0;
    while (acc >= 1 / 60 && chunks < MAX_CHUNKS) {
      sim.step(H_STEP, SUB); sim.sample(); updateRound(); acc -= 1 / 60; chunks++;
      beatEst(sim.t);
      unified |= flushTicks();
    }
    if (acc > 1 / 60) acc = 0;                  // a slow device runs the sim slower instead of piling up work
    xf += (sim.x - xf) * (1 - Math.exp(-dt / 2.5));
    if (unified && fx.gold > 0.3) fx.pulse = 1; else fx.pulse *= Math.exp(-dt / 0.11);
    draw(now); updateHud();
    // slow device (work per frame eats most of a 60 fps budget, or frames come slower than ~48 fps): drop the glow and draw at 1x
    var work = performance.now() - w0;
    if (dt < 0.09) { perf.ema += (work - perf.ema) * 0.05; perf.dt += (dt * 1000 - perf.dt) * 0.03; perf.n++; }
    if (!Q.low && perf.n > 120 && (perf.ema > 11 || perf.dt > 21)) { Q.low = true; resize(); }
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  var lcode = params.get('l'), lv0 = lcode ? LV.decodeLevel(lcode) : null, c0 = CHMAP[params.get('c')];
  if (lv0) { lv0.kind = 'level'; setSpec(lv0, 'link'); showStart('intro'); }
  else if (params.has('daily')) { setSpec(LV.daily(LV.dayNumber()), 'link'); showStart('intro'); }
  else if (c0) { setChallenge(c0); T('challenge_start', { ch: c0.id, src: 'link' }); showStart('intro'); }
  else {
    newSim(false); renderChips(); showStart('home');
    if (lcode) { url(location.pathname); setTimeout(function () { toast('That level link is broken, so here is free play'); }, 400); }
  }
  setMuted(muted);
  setInterval(function () { if (!document.hidden) { renderDailyBits(); } }, 30000);
  if (OG) {                       // share image: a frame part-way from chaos to order
    setup.seed = 3; newSim(true); for (var k = 0; k < 60 * 6; k++) { sim.step(H_STEP, SUB); sim.sample(); }
    sim.ticks.length = 0; xf = sim.x;
  }
  resize();
  window.__game = {
    get sim() { return sim; }, get round() { return round; }, get spec() { return spec; }, get quality() { return Q.low ? 'low' : 'high'; }, get perf() { return perf.ema; },
    begin: begin, setChallenge: function (id) { setChallenge(CHMAP[id] || null); }, openCard: openCard, levels: LV, saveCode: function () { return saveCode; }
  };
  requestAnimationFrame(frame);
})();
