/* Metronome Sync Game (Chaos to Order). Drawing, controls, sound and challenges. Physics lives in engine.js. */
(function () {
  'use strict';
  var E = window.MetroEngine, Sim = E.Sim, BIG = E.BIG;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var OG = params.has('og');
  if (OG) document.body.classList.add('og');

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
    { id: 'lift', name: 'Lift 20 off', N: 100, start: 'tie3', goal: 'A perfect 3-way tie. Lift 20 lime ones off the board. What do the other 80 do?' },
    { id: 'big', name: 'Add 1 big one', N: 100, start: 'tie3', goal: 'A perfect 3-way tie. Add one big metronome, 18x heavier. Whose beat wins?' }
  ];
  var CHMAP = {}; CH.forEach(function (c) { CHMAP[c.id] = c; });
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------------- state ----------------
  var setup = { N: 100, bpm: 208, start: 'random', weights: false, seed: 0 };
  var challenge = null;
  var sim = null, beatEst = null;
  var lay = null;                      // layout for N
  var round = { t0: 0, synced: false, hold0: -1, time: 0, flips0: 0 };
  var fx = { lift: new Float64Array(101).fill(-1), drop: new Float64Array(101).fill(-1), bigT: -1, weightsT: -1, weightsOn: false, push: -1, gold: 0, pulse: 0 };
  var xf = 0;                          // camera follow of the board
  var flipN = 4, liftedIdx = [];
  var started = OG;

  function newSim(keepSeed) {
    if (!keepSeed) setup.seed = (Math.random() * 1e9) | 0;
    lay = layout(setup.N);
    sim = new Sim({ N: setup.N, bpm: setup.bpm, start: setup.start, seed: setup.seed, weights: setup.weights, xs: lay.u });
    beatEst = sim.beatEstimator();
    round = { t0: 0, synced: false, hold0: -1, time: 0, flips0: 0 };
    fx.lift.fill(-1); fx.drop.fill(-1); fx.bigT = -1; fx.weightsOn = setup.weights; fx.weightsT = -1; fx.push = -1; fx.gold = 0;
    liftedIdx = []; xf = 0;
    hideBanner(true); syncButtons();
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
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    geom(); bgCanvas = null;
  }
  function geom() {
    var wide = W / H;
    G.yBack = H * (OG ? 0.30 : 0.40); G.yFront = H * (OG ? 0.68 : 0.72);
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
    var gA = 0.16 + (gold ? 0.18 * gold * (0.6 + pulse) : 0);
    ctx.fillStyle = rgb(col, gA * alpha); ctx.beginPath(); ctx.arc(bobx, boby, br * (2.3 + (gold ? pulse * 0.8 : 0)), 0, 7); ctx.fill();
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
  var hud = $('hud'), elPct = $('pct'), elBar = $('bar'), elTimer = $('timer'), elTag = $('tag'), lastPct = -1, lastTimer = '', lastTag = '';
  var bannerTimer = 0;
  function activeCount() { var a = 0; for (var i = 0; i < 100; i++) a += sim.active[i]; return a; }
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
  function fmt(s) { return (Math.max(0, s)).toFixed(1); }
  function updateHud() {
    var p = sim.pct();
    if (p !== lastPct) { elPct.textContent = p; elBar.style.width = Math.min(100, p) + '%'; lastPct = p; }
    hud.classList.toggle('gold', fx.gold > 0.5);
    var tt = round.synced ? 'Synced in ' + fmt(round.time) + ' s' : fmt(sim.t - round.t0) + ' s';
    if (tt !== lastTimer) { elTimer.textContent = tt; lastTimer = tt; }
    var tag = '';
    if (sim.motor) {
      var b = beatEst(sim.t);
      tag = 'MOTOR ' + sim.motorBpm() + (p >= 90 && b === b ? ' · BEAT NOW ' + Math.round(b) : '');
    } else if (fx.weightsOn) tag = 'WEIGHT ON BOARD: 48 KG';
    else if (setup.start !== 'random') {
      var c = [0, 0, 0]; for (var i = 0; i < setup.N; i++) if (sim.active[i]) c[sim.team[i]]++;
      tag = setup.start === 'tie2' ? 'PINK ' + c[0] + ' · CYAN ' + c[1] : 'PINK ' + c[0] + ' · CYAN ' + c[1] + ' · LIME ' + c[2];
      if (sim.bigOn) tag += ' · BIG 1';
    } else tag = activeCount() + ' METRONOMES · ' + setup.bpm + ' BPM';
    if (tag !== lastTag) { elTag.textContent = tag; lastTag = tag; }
    $('flipsUsed').textContent = sim.flips;
  }
  function onSynced() {
    var flips = sim.flips - round.flips0, n = activeCount();
    var big = 'Synced in ' + fmt(round.time) + ' s!', sub = n + ' metronomes in step';
    if (flips) sub += ' · ' + flips + (flips === 1 ? ' flip' : ' flips');
    if (challenge) {
      var key = 'c2o-best-' + challenge.id, prev = parseFloat(store(key) || 'NaN');
      var score = challenge.score === 'flips' ? flips * 1000 + round.time : round.time;
      if (!(score >= prev)) { store(key, String(score)); sub += ' · new best!'; renderChips(); }
      else sub += ' · best ' + bestText(challenge, prev);
    }
    $('bannerBig').textContent = big; $('bannerSub').textContent = sub;
    $('banner').classList.add('show');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(function () { $('banner').classList.remove('show'); }, 4000);
    if (AC && !muted) { var t0 = AC.currentTime + 0.05; [523.25, 659.25, 783.99].forEach(function (f, k) { chime(f, t0 + k * 0.06); }); }
  }
  function chime(f, when) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.12, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, when + 1.4);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + 1.5);
  }
  function hideBanner(now) { clearTimeout(bannerTimer); $('banner').classList.remove('show'); }
  function bestText(c, v) {
    if (!(v === v)) return '';
    if (c.score === 'flips') { var f = Math.floor(v / 1000); return f + (f === 1 ? ' flip' : ' flips') + ', ' + fmt(v - f * 1000) + ' s'; }
    return fmt(v) + ' s';
  }
  function acted() {                       // any move after a sync starts a new attempt
    if (round.synced) { round.synced = false; round.t0 = sim.t; round.hold0 = -1; round.flips0 = sim.flips; hideBanner(); }
  }

  // ---------------- controls ----------------
  function syncButtons() {
    $('aShake').classList.toggle('on', sim.motor);
    $('shakeSub').textContent = (sim.motor ? 'on · ' : 'motor ') + sim.motorBpm();
    $('aBig').classList.toggle('on', sim.bigOn); $('aBig').firstChild.textContent = sim.bigOn ? 'Remove big one' : 'Add big one';
    $('aWeights').classList.toggle('on', fx.weightsOn); $('aWeights').firstChild.textContent = fx.weightsOn ? 'Remove weights' : 'Add weights';
    $('aLift').classList.toggle('on', liftedIdx.length > 0);
    $('aLift').firstChild.textContent = liftedIdx.length ? 'Put 20 back' : 'Lift 20 off';
    $('aLift').disabled = !liftedIdx.length && activeCount() < 21;
    $('flipLab').textContent = flipN; $('flipN').textContent = flipN;
    document.querySelectorAll('.seg .btn').forEach(function (b) { b.classList.toggle('on', b.dataset.start === setup.start); });
    $('sN').value = setup.N; $('oN').textContent = setup.N; $('sB').value = setup.bpm; $('oB').textContent = setup.bpm;
  }
  function on(id, fn) { $(id).addEventListener('click', function (e) { initAudio(); fn(e); }); }
  on('aNudge', function () { acted(); sim.nudge(); fx.push = sim.t; play(BUF.knock, AC ? AC.currentTime + 0.01 : 0, 0.9, 1); });
  on('aShake', function () { acted(); sim.setMotor(!sim.motor); syncButtons(); });
  on('aFlip', function () {
    acted();
    var pool = [], i, pick = null;
    for (i = 0; i < setup.N; i++) if (sim.active[i] && !sim.flip[i]) pool.push(i);
    if (setup.start !== 'random') {             // flip from ONE team (cyan): flipping evenly across teams changes nothing
      var cy = pool.filter(function (k) { return sim.team[k] === 1; }); if (cy.length) pool = cy;
    }
    // nearest the middle and the front first, like the videos' hand
    pool.sort(function (a, b) { return (Math.abs(lay.u[a]) - lay.z[a] * 0.6) - (Math.abs(lay.u[b]) - lay.z[b] * 0.6); });
    for (i = 0; i < Math.min(flipN, pool.length); i++) sim.flipOne(pool[i]);
    tapSound();
  });
  on('fMinus', function () { flipN = Math.max(1, flipN - 1); syncButtons(); });
  on('fPlus', function () { flipN = Math.min(20, flipN + 1); syncButtons(); });
  on('aBig', function () {
    acted();
    if (sim.bigOn) { sim.removeBig(); fx.bigT = sim.t; fx.bigOut = true; }
    else { sim.addBig(); fx.bigT = sim.t; fx.bigOut = false; play(BUF.knock, AC ? AC.currentTime + 0.4 : 0, 0.7, 0.8); }
    syncButtons();
  });
  on('aWeights', function () {
    acted();
    fx.weightsOn = !fx.weightsOn; fx.weightsT = sim.t; sim.setWeights(fx.weightsOn); setup.weights = fx.weightsOn;
    play(BUF.knock, AC ? AC.currentTime + (fx.weightsOn ? 0.38 : 0.01) : 0, 0.8, 0.7);
    syncButtons();
  });
  on('aLift', function () {
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
  on('reset', function () { newSim(true); });
  on('rand', function () { newSim(false); });
  document.querySelectorAll('.seg .btn').forEach(function (b) {
    b.addEventListener('click', function () { initAudio(); setChallenge(null); setup.start = b.dataset.start; newSim(false); });
  });
  $('sN').addEventListener('input', function () { setChallenge(null); setup.N = +this.value; $('oN').textContent = setup.N; newSim(true); });
  $('sB').addEventListener('input', function () {
    setup.bpm = +this.value; $('oB').textContent = setup.bpm; sim.setBpm(setup.bpm); acted(); syncButtons();
    if (challenge) setChallenge(null, true);
  });
  $('mute').addEventListener('click', function () { setMuted(!muted); });
  $('play').addEventListener('click', function () { initAudio(); begin(); });
  on('bAgain', function () { newSim(false); });
  on('bShare', share); on('share', share);

  function tapSound() { play(BUF.tick, AC ? AC.currentTime + 0.005 : 0, 0.3, 1.6); }

  // tap a metronome to flip it
  cv.addEventListener('pointerdown', function (e) {
    initAudio();
    if (!started) { begin(); return; }
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 1e9;
    for (var i = 0; i < setup.N; i++) {
      if (!sim.active[i] || !pos.r[i]) continue;
      var dx = x - pos.bx[i], dy = y - pos.by[i], d = dx * dx + dy * dy;
      if (d < pos.r[i] * pos.r[i] && d < bd) { bd = d; best = i; }
    }
    if (best >= 0) { acted(); if (sim.flipOne(best)) tapSound(); }
  });

  // ---------------- challenges UI ----------------
  function renderChips() {
    var box = $('chips'); box.innerHTML = '';
    CH.forEach(function (c) {
      var b = document.createElement('button'); b.className = 'chip' + (challenge && challenge.id === c.id ? ' on' : '');
      b.textContent = c.name;
      var best = parseFloat(store('c2o-best-' + c.id) || 'NaN');
      if (best === best) { var s = document.createElement('span'); s.className = 'best'; s.textContent = bestText(c, best); b.appendChild(s); }
      b.addEventListener('click', function () { initAudio(); setChallenge(c); if (!started) begin(); });
      box.appendChild(b);
    });
    $('goaltext').textContent = challenge ? challenge.goal : 'Free play. Pick a challenge, or change the set-up below and tap metronomes to flip them.';
  }
  function setChallenge(c, keep) {
    challenge = c;
    if (c) {
      setup.N = c.N; setup.start = c.start; setup.bpm = 208; setup.weights = !!c.weights;
      newSim(false);
      try { history.replaceState(null, '', '?c=' + c.id); } catch (e) {}
    } else {
      setup.weights = fx.weightsOn;
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }
    renderChips();
  }
  function begin() {
    started = true; $('start').classList.add('hide');
    newSim(true);            // the timer starts from a fresh out-of-step board
    round.t0 = sim.t; round.hold0 = -1; round.synced = false; round.flips0 = sim.flips;
  }

  // ---------------- share ----------------
  var toastT = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function share() {
    var url = location.origin + location.pathname + (challenge ? '?c=' + challenge.id : '');
    var text = round.synced
      ? 'I got ' + activeCount() + ' metronomes in sync in ' + fmt(round.time) + ' s' + (sim.flips - round.flips0 ? ' with ' + (sim.flips - round.flips0) + ' flips' : '') + '. Can you beat it?'
      : 'Can you get 100 metronomes to sync? Real physics from Chaos to Order.';
    if (navigator.share) { navigator.share({ title: 'Metronome Sync Game', text: text, url: url }).catch(function () {}); return; }
    var full = text + ' ' + url;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(function () { toast('Link copied'); }, function () { toast(url); });
    else toast(url);
  }

  // ---------------- main loop ----------------
  var H_STEP = 1 / 600, SUB = 10, MAX_CHUNKS = 4;   // 10 RK4 steps per 1/60 s; at most 4 chunks (1/15 s) per frame
  var acc = 0, last = 0;
  function frame(now) {
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now;
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
    requestAnimationFrame(frame);
  }

  // ---------------- boot ----------------
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  var c0 = CHMAP[params.get('c')];
  if (c0) { setChallenge(c0); $('start').querySelector('h2').innerHTML = c0.name.replace(/\?$/, '') + '<br><span>Your turn.</span>'; $('start').querySelector('p').textContent = c0.goal; }
  else { newSim(false); renderChips(); }
  setMuted(muted);
  if (OG) {                       // share image: a frame part-way from chaos to order
    setup.seed = 3; newSim(true); for (var k = 0; k < 60 * 6; k++) { sim.step(H_STEP, SUB); sim.sample(); }
    sim.ticks.length = 0; xf = sim.x;
  }
  resize();
  window.__game = { get sim() { return sim; }, get round() { return round; }, begin: begin, setChallenge: function (id) { setChallenge(CHMAP[id] || null); } };
  requestAnimationFrame(frame);
})();
