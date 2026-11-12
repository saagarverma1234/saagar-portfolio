/* Metronome Sync engine (Chaos to Order). A JS port of the Python engine behind the channel's videos
   (physics-sync/tools/lf/engine.py): Pantaleone 2002, "Synchronization of metronomes", Am. J. Phys. 70, 992.

   Per metronome i:  th_i'' = F_i - a cos(th_i) x''
                     F_i    = -w_i^2 sin(th_i) - mu w0 ((th_i/th0)^2 - 1) th_i'      (pendulum + van der Pol escapement)
   Board:            (M - sum k_i m l a cos^2 th_i) x'' = sum k_i m l (-cos th_i F_i + sin th_i th_i'^2) - gamma x' + F_outside
   a = m l / I = w0^2 / g is the same for every pendulum; a heavier pendulum (k_i) pushes the board k_i times harder.
   Fixed-step RK4. Nothing is scripted: buttons only do things to the board or a metronome, the equations do the rest. */
(function (root) {
  'use strict';
  var G = 9.81, TAU = Math.PI * 2;

  function mulberry(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  // steady swing of one free metronome (independent of tempo in scaled time w0 t)
  var A0 = (function () {
    var th0 = 0.5, mu = 0.25, th = 0.05, om = 0, dt = 0.002, amp = 0;
    for (var k = 0; k < 60000; k++) {
      var acc = -Math.sin(th) - mu * ((th / th0) * (th / th0) - 1) * om;
      om += acc * dt; th += om * dt;
      if (k > 50000) amp = Math.max(amp, Math.abs(th));
    }
    return amp;
  })();

  var MAXN = 101;               // 100 small + 1 big one
  var BIG = 100;                // index of the big one
  var SMOOTH = 30;              // counter = mean of r over the last 0.5 s (30 samples at 60 Hz), as in every video

  function Sim(opt) {
    opt = opt || {};
    this.p = {
      th0: 0.5, mu: 0.25, spread: 0.0002, m_p: 0.060, l: 0.058, m_body: 0.040, M_board: 2.4, gamma: 0.3,
      bigK: 18,                 // big one: 18x the pendulum + case (as the 3-way tie video)
      weightKg: 48,             // 4 x 12 kg iron weights (weights-off video)
      motorRatio: 1.1,          // 1.1 x 208 = 229 ticks a minute
      motorMM: 12,              // motor force = M (2 pi f)^2 x 12 mm (it alone would shake a free board +-12 mm)
      pushD: 0.06               // a zero-impulse shove: the board ends ~6 cm over
    };
    this.th = new Float64Array(MAXN); this.om = new Float64Array(MAXN);
    this.d = new Float64Array(MAXN); this.kb = new Float64Array(MAXN);
    this.active = new Uint8Array(MAXN); this.flip = new Uint8Array(MAXN); this.team = new Uint8Array(MAXN);
    this.flipT = new Float64Array(MAXN);
    // RK4 scratch
    var n = MAXN;
    this.k1a = new Float64Array(n); this.k1b = new Float64Array(n); this.k2a = new Float64Array(n); this.k2b = new Float64Array(n);
    this.k3a = new Float64Array(n); this.k3b = new Float64Array(n); this.k4a = new Float64Array(n); this.k4b = new Float64Array(n);
    this.tth = new Float64Array(n); this.tom = new Float64Array(n); this.cs = new Float64Array(n);
    this.q = new Float64Array(8);
    this.rhist = new Float64Array(SMOOTH);
    this.ticks = [];          // {i, dir, t} since last drain (for sound)
    this.reset(opt);
  }

  Sim.prototype.setBpm = function (bpm) {
    this.bpm = bpm;
    this.w0 = TAU * bpm / 120;          // a "tick" is half a swing: 208 ticks/min -> 1.733 Hz
    this.a = this.w0 * this.w0 / G;
  };

  Sim.prototype.mass = function () {
    var p = this.p, M = p.M_board + (this.weights ? p.weightKg : 0);
    for (var i = 0; i < MAXN; i++) if (this.active[i]) M += this.kb[i] * (p.m_body + p.m_p);
    return M;
  };

  Sim.prototype.zeroMomentum = function () {       // a hand steadies the board: total momentum 0
    var ml = this.p.m_p * this.p.l, s = 0;
    for (var i = 0; i < MAXN; i++) if (this.active[i]) s += this.kb[i] * ml * Math.cos(this.th[i]) * this.om[i];
    this.v = -s / this.M;
  };

  // start: 'random' | 'tie2' | 'tie3'; teams are by position (left/right or left/middle/right), xs = lattice x in [0,1]
  Sim.prototype.reset = function (opt) {
    opt = opt || {};
    this.N = Math.max(1, Math.min(100, opt.N || 100));
    this.start = opt.start || 'random';
    this.seed = opt.seed != null ? opt.seed : (Math.random() * 1e9) | 0;
    this.weights = !!opt.weights;
    this.setBpm(opt.bpm || 208);
    var rnd = mulberry(this.seed), N = this.N, i;
    var xs = opt.xs || null;
    this.t = 0; this.x = 0; this.v = 0;
    this.motor = false; this.motorT0 = 0; this.motorOffT = -1;
    this.pushT0 = -1e9;
    this.flips = 0; this.lifted = 0; this.bigOn = false;
    this.ticks.length = 0;
    var dm = 0;
    for (i = 0; i < MAXN; i++) {
      this.active[i] = i < N ? 1 : 0; this.kb[i] = 1; this.flip[i] = 0; this.flipT[i] = -1;
      this.d[i] = i < N ? gauss(rnd) * this.p.spread : 0; if (i < N) dm += this.d[i];
    }
    for (i = 0; i < N; i++) this.d[i] -= dm / N;
    // teams by position
    var order = [];
    for (i = 0; i < N; i++) order.push(i);
    if (xs) order.sort(function (A, B) { return xs[A] - xs[B] || A - B; });
    var nt = this.start === 'tie3' ? 3 : this.start === 'tie2' ? 2 : 1;
    for (var k = 0; k < N; k++) this.team[order[k]] = Math.min(nt - 1, Math.floor(k * nt / N));
    if (nt === 3 && N >= 3) {   // 33 / 34 / 33
      var a3 = Math.round(N / 3), b3 = N - 2 * a3;
      for (k = 0; k < N; k++) this.team[order[k]] = k < a3 ? 0 : k < a3 + b3 ? 1 : 2;
    }
    for (i = 0; i < N; i++) {
      var phi = nt === 1 ? rnd() * TAU : this.team[i] * TAU / nt + gauss(rnd) * 0.12;
      this.th[i] = A0 * Math.cos(phi); this.om[i] = -A0 * this.w0 * Math.sin(phi);
    }
    this.M = this.mass();
    this.zeroMomentum();
    this.rhist.fill(this.order()); this.rk = 0;
    this.rs = this.rhist[0];
  };

  Sim.prototype.order = function () {                // r = |mean e^(i psi)| over the small metronomes on the board
    var zr = 0, zi = 0, n = 0, w0 = this.w0;
    for (var i = 0; i < 100; i++) {
      if (!this.active[i]) continue;
      var p = Math.atan2(-this.om[i] / w0, this.th[i]);
      zr += Math.cos(p); zi += Math.sin(p); n++;
    }
    return n ? Math.sqrt(zr * zr + zi * zi) / n : 0;
  };

  Sim.prototype.deriv = function (th, om, x, v, t, dth, dom) {
    var p = this.p, ml = p.m_p * p.l, w0 = this.w0, a = this.a, mu = p.mu, th0 = p.th0, w02 = w0 * w0;
    var S1 = 0, S3 = 0, cs = this.cs;
    for (var i = 0; i < MAXN; i++) {
      if (!this.active[i]) { dth[i] = 0; dom[i] = 0; continue; }
      var s = Math.sin(th[i]), c = Math.cos(th[i]); cs[i] = c;
      var q = th[i] / th0, w = 1 + this.d[i];
      var F = -w02 * w * w * s - mu * w0 * (q * q - 1) * om[i];
      dom[i] = F; dth[i] = om[i];
      var m = this.kb[i] * ml;
      S1 += m * (-c * F + s * om[i] * om[i]);
      S3 += m * a * c * c;
    }
    var f = S1 - p.gamma * v;
    var u = t - this.pushT0, T = 0.35;
    if (u >= 0 && u <= T) f += this.M * (TAU * p.pushD / (T * T)) * Math.sin(TAU * u / T);
    if (this.motor || (this.motorOffT >= 0 && t - this.motorOffT < 0.4)) {
      var e = Math.min(1, (t - this.motorT0) / 0.5);
      if (!this.motor) e *= 1 - (t - this.motorOffT) / 0.4;
      var fm = this.motorRatioNow * w0 / TAU;
      var A = TAU * fm * TAU * fm * p.motorMM / 1000;
      f += this.M * A * e * Math.sin(TAU * fm * (t - this.motorT0));
    }
    var acc = f / (this.M - S3);
    for (i = 0; i < MAXN; i++) if (this.active[i]) dom[i] -= a * cs[i] * acc;
    this.q[0] = v; this.q[1] = acc;
  };

  // advance by n RK4 steps of h seconds
  Sim.prototype.step = function (h, n) {
    var th = this.th, om = this.om, tth = this.tth, tom = this.tom, q = this.q, i;
    var k1a = this.k1a, k1b = this.k1b, k2a = this.k2a, k2b = this.k2b, k3a = this.k3a, k3b = this.k3b, k4a = this.k4a, k4b = this.k4b;
    var ml = this.p.m_p * this.p.l;
    for (var s = 0; s < n; s++) {
      var t = this.t, x = this.x, v = this.v;
      this.deriv(th, om, x, v, t, k1a, k1b); var x1 = q[0], v1 = q[1];
      for (i = 0; i < MAXN; i++) { tth[i] = th[i] + h / 2 * k1a[i]; tom[i] = om[i] + h / 2 * k1b[i]; }
      this.deriv(tth, tom, x + h / 2 * x1, v + h / 2 * v1, t + h / 2, k2a, k2b); var x2 = q[0], v2 = q[1];
      for (i = 0; i < MAXN; i++) { tth[i] = th[i] + h / 2 * k2a[i]; tom[i] = om[i] + h / 2 * k2b[i]; }
      this.deriv(tth, tom, x + h / 2 * x2, v + h / 2 * v2, t + h / 2, k3a, k3b); var x3 = q[0], v3 = q[1];
      for (i = 0; i < MAXN; i++) { tth[i] = th[i] + h * k3a[i]; tom[i] = om[i] + h * k3b[i]; }
      this.deriv(tth, tom, x + h * x3, v + h * v3, t + h, k4a, k4b); var x4 = q[0], v4 = q[1];
      this.x = x + h / 6 * (x1 + 2 * x2 + 2 * x3 + x4);
      this.v = v + h / 6 * (v1 + 2 * v2 + 2 * v3 + v4);
      for (i = 0; i < MAXN; i++) {
        if (!this.active[i]) continue;
        var nth = th[i] + h / 6 * (k1a[i] + 2 * k2a[i] + 2 * k3a[i] + k4a[i]);
        var nom = om[i] + h / 6 * (k1b[i] + 2 * k2b[i] + 2 * k3b[i] + k4b[i]);
        if ((th[i] < 0) !== (nth < 0)) {              // escapement release at the centre = one tick
          var fr = th[i] / (th[i] - nth);
          if (this.flip[i]) {                         // a finger at the centre reverses the swing; the impulse goes into the board
            this.flip[i] = 0; this.flipT[i] = t + fr * h;
            this.v += 2 * this.kb[i] * ml / this.M * Math.cos(nth) * nom;
            nth = -nth; nom = -nom;
          }
          if (this.ticks.length < 4000) this.ticks.push({ i: i, dir: om[i] > 0 ? 1 : -1, t: t + fr * h });
        }
        th[i] = nth; om[i] = nom;
      }
      this.t = t + h;
    }
  };

  // call once per 1/60 s of sim time (after step) to update the smoothed counter
  Sim.prototype.sample = function () {
    this.rhist[this.rk] = this.order(); this.rk = (this.rk + 1) % SMOOTH;
    var s = 0; for (var i = 0; i < SMOOTH; i++) s += this.rhist[i];
    this.rs = s / SMOOTH;
    return this.rs;
  };
  Sim.prototype.pct = function () { return Math.round(100 * this.rs); };

  // ---- things a hand can do ----
  Sim.prototype.flipOne = function (i) {
    if (i < 0 || i >= MAXN || !this.active[i] || this.flip[i]) return false;
    this.flip[i] = 1; this.flips++; return true;
  };
  Sim.prototype.nudge = function () { if (this.t - this.pushT0 > 0.4) this.pushT0 = this.t; };
  Sim.prototype.setMotor = function (on) {
    if (on === this.motor) return;
    if (on) { this.motor = true; this.motorRatioNow = this.p.motorRatio; this.motorT0 = this.t; this.motorOffT = -1; }
    else { this.motor = false; this.motorOffT = this.t; }
  };
  Sim.prototype.motorBpm = function () { return Math.round(this.bpm * this.p.motorRatio); };
  Sim.prototype.setWeights = function (on) {       // lifted straight up: board velocity unchanged, only M drops
    this.weights = !!on; this.M = this.mass(); this.zeroMomentum();
  };
  Sim.prototype.lift = function (idx) {            // lift metronomes off the board; the hand steadies the board
    for (var k = 0; k < idx.length; k++) { var i = idx[k]; if (this.active[i] && i !== BIG) { this.active[i] = 0; this.lifted++; } }
    this.M = this.mass(); this.zeroMomentum();
  };
  Sim.prototype.addBig = function () {             // set down a big one (same tempo) and let go from rest at +A0
    if (this.bigOn) return false;
    var Mold = this.M;
    this.active[BIG] = 1; this.kb[BIG] = this.p.bigK; this.d[BIG] = 0;
    this.th[BIG] = A0; this.om[BIG] = 0; this.flip[BIG] = 0;
    this.M = this.mass(); this.v *= Mold / this.M; this.bigOn = true;
    return true;
  };
  Sim.prototype.removeBig = function () {
    if (!this.bigOn) return; this.active[BIG] = 0; this.bigOn = false; this.M = this.mass(); this.zeroMomentum();
  };
  // shared beat now, ticks per minute, from the mean swing (NaN until it has 2 periods)
  Sim.prototype.beatEstimator = function () {
    var last = [], prev = 0, self = this;
    return function (t) {
      var m = 0, n = 0;
      for (var i = 0; i < MAXN; i++) if (self.active[i]) { m += self.th[i] * self.kb[i]; n += self.kb[i]; }
      m /= n || 1;
      if (prev !== 0 && (prev < 0) !== (m < 0)) { last.push(t); if (last.length > 5) last.shift(); }
      prev = m;
      if (last.length < 5) return NaN;
      return 60 * 4 / (last[4] - last[0]);
    };
  };

  var api = { Sim: Sim, A0: A0, BIG: BIG, MAXN: MAXN, mulberry: mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MetroEngine = api;
})(this);
