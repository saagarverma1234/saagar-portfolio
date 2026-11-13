/* Bump Theory: 1 Ball -> 10,000. Physics core (no DOM; also runs in node).
   Fixed 120 Hz step, uniform grid over the static items, typed arrays for balls.
   Balls do not collide with each other (that is what keeps thousands at 60 fps).
   RULE (kept exact): a ball passing a xN gate becomes N balls, once per gate per
   ball lineage. Above the ball cap a ball carries a weight instead of spawning,
   so the counter is always exactly 1 x every multiply minus lava losses. */
(function (root) {
  'use strict';
  var W = 720, H = 1280, DT = 1 / 120, G = 820, R = 7, MAXV = 1400, TMAX = 32;
  var CELL = 80, GC = Math.ceil(W / CELL), GR = Math.ceil(H / CELL), PAD = 24;
  var WALL_T = 7;                      // half thickness of a wall
  var GATE_COL = { 2: 1, 3: 2, 4: 3, 5: 4, 10: 5, 20: 6 };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeItem(d, fixed) {
    return {
      t: d.t, x: d.x, y: d.y, a: d.a || 0, n: d.n || 0, fixed: !!fixed,
      w: d.w || (d.t === 'gate' ? 160 : 0), h: d.h || 0, len: d.len || 170,
      r: d.r || (d.t === 'bump' ? 30 : 10), move: d.move || null, spin: d.spin || 0,
      flash: 0, hits: 0, bit: 0, cx: d.x, cy: d.y, ux: 1, uy: 0, hl: 0
    };
  }

  function pose(it, t) {
    var x = it.x, y = it.y, a = it.a;
    if (it.move) {
      var m = it.move, ph = 2 * Math.PI * (m.f || 0.3) * t + (m.ph || 0);
      x += (m.ax || 0) * Math.sin(ph); y += (m.ay || 0) * Math.sin(ph);
    }
    if (it.spin) a += it.spin * t;
    var ar = a * Math.PI / 180;
    it.cx = x; it.cy = y; it.ux = Math.cos(ar); it.uy = Math.sin(ar);
    it.hl = it.t === 'gate' ? it.w / 2 : it.t === 'wall' ? it.len / 2 : 0;
  }

  function Sim(items, opts) {
    opts = opts || {};
    this.alloc = opts.alloc || 20000;
    this.cap = Math.min(opts.cap || this.alloc, this.alloc);
    var c = this.alloc + 64;
    this.x = new Float32Array(c); this.y = new Float32Array(c);
    this.px = new Float32Array(c); this.py = new Float32Array(c);
    this.vx = new Float32Array(c); this.vy = new Float32Array(c);
    this.still = new Float32Array(c); this.w = new Float64Array(c);
    this.mask = new Uint32Array(c); this.col = new Uint8Array(c); this.dead = new Uint8Array(c);
    this.n = 0; this.count = 0; this.exited = 0; this.destroyed = 0; this.drops = 0;
    this.mults = 0; this.t = 0; this.steps = 0; this.recycle = !!opts.recycle;
    this.tmax = opts.tmax || TMAX; this.rand = rng(opts.seed || 7);
    this.evN = 0; this.evK = new Uint8Array(64); this.evX = new Float32Array(64);
    this.evY = new Float32Array(64); this.evS = new Float32Array(64); this.evI = new Int16Array(64);
    this.cells = []; for (var i = 0; i < GC * GR; i++) this.cells.push([]);
    this.setItems(items);
  }

  Sim.prototype.setItems = function (items) {
    this.items = items;
    var b = 0;
    this.moving = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.t === 'gate') { it.bit = (1 << (b % 32)) >>> 0; b++; }
      if (it.move || it.spin) this.moving = true;
    }
    this.pose(this.t);
    this.grid();
  };

  Sim.prototype.pose = function (t) { for (var i = 0; i < this.items.length; i++) pose(this.items[i], t); };

  Sim.prototype.grid = function () {
    var cells = this.cells, items = this.items, i, k;
    for (i = 0; i < cells.length; i++) cells[i].length = 0;
    for (k = 0; k < items.length; k++) {
      var it = items[k], x0, x1, y0, y1;
      if (it.t === 'gate' || it.t === 'wall') {
        var ex = it.ux * it.hl, ey = it.uy * it.hl, p = PAD + WALL_T;
        x0 = it.cx - Math.abs(ex) - p; x1 = it.cx + Math.abs(ex) + p;
        y0 = it.cy - Math.abs(ey) - p; y1 = it.cy + Math.abs(ey) + p;
      } else if (it.t === 'lava') {
        x0 = it.cx - it.w / 2 - PAD; x1 = it.cx + it.w / 2 + PAD;
        y0 = it.cy - it.h / 2 - PAD; y1 = it.cy + it.h / 2 + PAD;
      } else {
        x0 = it.cx - it.r - PAD; x1 = it.cx + it.r + PAD; y0 = it.cy - it.r - PAD; y1 = it.cy + it.r + PAD;
      }
      var c0 = Math.max(0, Math.floor(x0 / CELL)), c1 = Math.min(GC - 1, Math.floor(x1 / CELL));
      var r0 = Math.max(0, Math.floor(y0 / CELL)), r1 = Math.min(GR - 1, Math.floor(y1 / CELL));
      for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) cells[r * GC + c].push(k);
    }
  };

  Sim.prototype.ev = function (k, x, y, s, i) {
    var n = this.evN; if (n >= 64) return;
    this.evK[n] = k; this.evX[n] = x; this.evY[n] = y; this.evS[n] = s; this.evI[n] = i; this.evN = n + 1;
  };

  Sim.prototype.add = function (x, y, vx, vy, w, mask, col) {
    var i = this.n++;
    this.x[i] = this.px[i] = x; this.y[i] = this.py[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.w[i] = w; this.mask[i] = mask; this.col[i] = col; this.dead[i] = 0; this.still[i] = 0;
    return i;
  };

  /* Drop one fresh ball (counts +1). */
  Sim.prototype.drop = function (x, y, vx, vy) {
    if (this.n >= this.cap) return false;
    this.add(x, y, vx || 0, vy || 0, 1, 0, 0);
    this.count += 1; this.drops += 1;
    return true;
  };

  Sim.prototype.step = function () {
    if (this.moving) { this.pose(this.t); this.grid(); }
    var X = this.x, Y = this.y, PX = this.px, PY = this.py, VX = this.vx, VY = this.vy, Wt = this.w,
      M = this.mask, D = this.dead, S = this.still, cells = this.cells, items = this.items;
    var n0 = this.n, anyDead = false, gdt = G * DT, maxv2 = MAXV * MAXV;
    for (var i = 0; i < n0; i++) {
      var vx = VX[i], vy = VY[i] + gdt;
      var s2 = vx * vx + vy * vy;
      if (s2 > maxv2) { var sc = MAXV / Math.sqrt(s2); vx *= sc; vy *= sc; }
      var ox = X[i], oy = Y[i], nx = ox + vx * DT, ny = oy + vy * DT, teleport = false;
      if (nx < R) { nx = R; if (vx < 0) { if (vx < -150) this.ev(0, nx, ny, -vx, -1); vx = -vx * 0.75; } }
      else if (nx > W - R) { nx = W - R; if (vx > 0) { if (vx > 150) this.ev(0, nx, ny, vx, -1); vx = -vx * 0.75; } }
      if (ny < R) { ny = R; if (vy < 0) vy = -vy * 0.75; }
      if (ny > H + 3 * R) {
        if (this.recycle && this.count < 1e15) {
          ny = R + 2; oy = ny; ox = nx; vy = 60; vx *= 0.6; M[i] = 0; teleport = true;
        } else {
          D[i] = 1; anyDead = true; this.exited += Wt[i]; continue;
        }
      }
      var cx = nx / CELL | 0, cy = ny / CELL | 0;
      if (cx < 0) cx = 0; else if (cx >= GC) cx = GC - 1;
      if (cy < 0) cy = 0; else if (cy >= GR) cy = GR - 1;
      var cell = cells[cy * GC + cx];
      for (var q = 0; q < cell.length; q++) {
        var k = cell[q], it = items[k], t = it.t;
        if (t === 'gate') {
          if (M[i] & it.bit) continue;
          var gx = it.cx, gy = it.cy, ux = it.ux, uy = it.uy;
          var d0 = (ox - gx) * -uy + (oy - gy) * ux, d1 = (nx - gx) * -uy + (ny - gy) * ux;
          if ((d0 <= 0) === (d1 <= 0) || teleport) continue;
          var sAl = (nx - gx) * ux + (ny - gy) * uy;
          if (sAl > it.hl + 2 || sAl < -it.hl - 2) continue;
          // ---- multiply ----
          var N = it.n, wt = Wt[i], col = GATE_COL[N] || 1;
          M[i] |= it.bit; this.count += wt * (N - 1); this.mults++;
          it.flash = 1; it.hits++;
          var room = this.cap - this.n, kk = N - 1 < room ? N - 1 : (room > 0 ? room : 0);
          var outs = kk + 1, spd = Math.sqrt(vx * vx + vy * vy);
          if (spd < 260) spd = 260;
          var base = Math.atan2(vy, vx), spread = Math.min(10 + 3 * N, 30) * Math.PI / 180;
          if (spd === 260 && vy < 0) base = Math.PI / 2;
          var pick = this.rand() * outs | 0, mk = M[i], rnd = this.rand, pc = col;
          for (var j = 0; j < outs; j++) {
            var ang = base + (outs > 1 ? spread * (2 * j / (outs - 1) - 1) : 0) + (rnd() - 0.5) * 0.07;
            var sp = spd * (0.9 + 0.2 * rnd());
            var cvx = Math.cos(ang) * sp, cvy = Math.sin(ang) * sp;
            var cj = 1 + ((col - 1 + j) % 6);
            if (j === pick) { vx = cvx; vy = cvy; pc = cj; }
            else this.add(nx, ny, cvx, cvy, wt, mk, cj);
          }
          Wt[i] = wt * (N - kk); this.col[i] = pc;
          this.ev(1, nx, ny, N, k);
        } else if (t === 'wall') {
          var ax = it.cx - it.ux * it.hl, ay = it.cy - it.uy * it.hl, L = it.hl * 2;
          var rx = nx - ax, ry = ny - ay, sp2 = rx * it.ux + ry * it.uy;
          var sc2 = sp2 < 0 ? 0 : sp2 > L ? L : sp2;
          var qx = ax + it.ux * sc2, qy = ay + it.uy * sc2, dx = nx - qx, dy = ny - qy, dd = dx * dx + dy * dy;
          var rr = R + WALL_T, hit = false, nnx = 0, nny = 0;
          var wnx = -it.uy, wny = it.ux;
          var e0 = (ox - ax) * wnx + (oy - ay) * wny, e1 = rx * wnx + ry * wny;
          if ((e0 > 0) !== (e1 > 0) && sp2 >= 0 && sp2 <= L && !teleport) {
            var sg = e0 > 0 ? 1 : -1; nnx = wnx * sg; nny = wny * sg;
            nx = nx - wnx * e1 + nnx * rr; ny = ny - wny * e1 + nny * rr; hit = true;
          } else if (dd < rr * rr) {
            var dist = Math.sqrt(dd);
            if (dist > 1e-4) { nnx = dx / dist; nny = dy / dist; }
            else { var sg2 = e0 > 0 ? 1 : -1; nnx = wnx * sg2; nny = wny * sg2; }
            nx = qx + nnx * rr; ny = qy + nny * rr; hit = true;
          }
          if (hit) {
            var vn = vx * nnx + vy * nny;
            if (vn < 0) {
              vx -= 1.55 * vn * nnx; vy -= 1.55 * vn * nny;
              vx *= 0.995; vy *= 0.995;
              if (vn < -120) this.ev(2, nx, ny, -vn, k);
            }
          }
        } else if (t === 'peg' || t === 'bump') {
          var ddx = nx - it.cx, ddy = ny - it.cy, rad = R + it.r, d2 = ddx * ddx + ddy * ddy;
          if (d2 < rad * rad) {
            var dl = Math.sqrt(d2), cnx = 0, cny = -1;
            if (dl > 1e-4) { cnx = ddx / dl; cny = ddy / dl; }
            nx = it.cx + cnx * rad; ny = it.cy + cny * rad;
            var vn2 = vx * cnx + vy * cny;
            if (vn2 < 0) {
              if (t === 'bump') {
                var out = -vn2 > 640 ? -vn2 : 640;
                vx += (out - vn2) * cnx; vy += (out - vn2) * cny;
                it.flash = 1; it.hits++;
                this.ev(3, nx, ny, out, k);
              } else {
                vx -= 1.55 * vn2 * cnx; vy -= 1.55 * vn2 * cny;
                if (vn2 < -120) this.ev(2, nx, ny, -vn2, k);
              }
            }
          }
        } else if (t === 'lava') {
          if (Math.abs(nx - it.cx) < it.w / 2 && Math.abs(ny - it.cy) < it.h / 2) {
            D[i] = 1; anyDead = true; this.destroyed += Wt[i]; this.count -= Wt[i];
            it.flash = 1; this.ev(4, nx, ny, Wt[i], k);
            break;
          }
        }
      }
      if (D[i]) continue;
      X[i] = nx; Y[i] = ny; PX[i] = teleport ? nx : ox; PY[i] = teleport ? ny : oy; VX[i] = vx; VY[i] = vy;
      if (vx * vx + vy * vy < 900) S[i] += DT; else S[i] = 0;
    }
    if (anyDead) this.compact();
    this.t += DT; this.steps++;
  };

  Sim.prototype.compact = function () {
    var D = this.dead, j = 0, n = this.n;
    for (var i = 0; i < n; i++) {
      if (D[i]) continue;
      if (i !== j) {
        this.x[j] = this.x[i]; this.y[j] = this.y[i]; this.px[j] = this.px[i]; this.py[j] = this.py[i];
        this.vx[j] = this.vx[i]; this.vy[j] = this.vy[i]; this.w[j] = this.w[i]; this.mask[j] = this.mask[i];
        this.col[j] = this.col[i]; this.still[j] = this.still[i];
      }
      D[j] = 0; j++;
    }
    for (var k = j; k < n; k++) D[k] = 0;
    this.n = j;
  };

  /* Round over: nothing moving (all gone, or all resting for 1 s) or time up. */
  Sim.prototype.done = function () {
    if (this.drops === 0) return false;
    if (this.n === 0 || this.t >= this.tmax) return true;
    if (this.steps % 30) return false;
    for (var i = 0; i < this.n; i++) if (this.still[i] < 1) return false;
    return true;
  };

  /* Exactness check: total == alive weights + exited (lava already subtracted). */
  Sim.prototype.audit = function () {
    var s = 0; for (var i = 0; i < this.n; i++) s += this.w[i];
    return { count: this.count, alive: s, exited: this.exited, ok: Math.abs(s + this.exited - this.count) < 1e-6 * Math.max(1, this.count) };
  };

  /* ---------- placement rules (shared by the game and the level checker) ---------- */
  var DEFAULT_ZONES = [{ x0: 24, y0: 270, x1: 696, y1: 1250 }];

  function capsule(it) {
    pose(it, 0);
    var hl = it.hl, r;
    if (it.t === 'gate') r = 16; else if (it.t === 'wall') r = WALL_T + 2;
    else if (it.t === 'lava') {
      if (it.w >= it.h) return { ax: it.cx - (it.w - it.h) / 2, ay: it.cy, bx: it.cx + (it.w - it.h) / 2, by: it.cy, r: it.h / 2 };
      return { ax: it.cx, ay: it.cy - (it.h - it.w) / 2, bx: it.cx, by: it.cy + (it.h - it.w) / 2, r: it.w / 2 };
    } else { hl = 0; r = it.r + 2; }
    if (it.spin) return { ax: it.cx, ay: it.cy, bx: it.cx, by: it.cy, r: hl + r };
    if (it.move) {
      var mx = it.move.ax || 0, my = it.move.ay || 0;
      return { ax: it.cx - mx - Math.abs(it.ux * hl), ay: it.cy - my - Math.abs(it.uy * hl), bx: it.cx + mx + Math.abs(it.ux * hl), by: it.cy + my + Math.abs(it.uy * hl), r: r };
    }
    return { ax: it.cx - it.ux * hl, ay: it.cy - it.uy * hl, bx: it.cx + it.ux * hl, by: it.cy + it.uy * hl, r: r };
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function segSeg2(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
    var d1x = q1x - p1x, d1y = q1y - p1y, d2x = q2x - p2x, d2y = q2y - p2y, rx = p1x - p2x, ry = p1y - p2y;
    var a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry, s, t;
    if (a < 1e-9 && e < 1e-9) return rx * rx + ry * ry;
    if (a < 1e-9) { s = 0; t = clamp01(f / e); }
    else {
      var c = d1x * rx + d1y * ry;
      if (e < 1e-9) { t = 0; s = clamp01(-c / a); }
      else {
        var b = d1x * d2x + d1y * d2y, den = a * e - b * b;
        s = den > 1e-9 ? clamp01((b * f - c * e) / den) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = clamp01(-c / a); } else if (t > 1) { t = 1; s = clamp01((b - c) / a); }
      }
    }
    var dx = p1x + d1x * s - (p2x + d2x * t), dy = p1y + d1y * s - (p2y + d2y * t);
    return dx * dx + dy * dy;
  }

  function overlaps(a, b) {
    var A = capsule(a), B = capsule(b), rr = A.r + B.r;
    return segSeg2(A.ax, A.ay, A.bx, A.by, B.ax, B.ay, B.bx, B.by) < rr * rr;
  }

  function zoneOk(z, t) { return !z.t || z.t === t || (Array.isArray(z.t) && z.t.indexOf(t) >= 0); }

  /* Snap a point into the nearest zone that takes this item type.
     Returns {x, y, d} (d = how far it had to move) or null. */
  function snap(t, x, y, zones) {
    zones = zones && zones.length ? zones : DEFAULT_ZONES;
    var best = null;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i]; if (!zoneOk(z, t)) continue;
      var sx = x < z.x0 ? z.x0 : x > z.x1 ? z.x1 : x, sy = y < z.y0 ? z.y0 : y > z.y1 ? z.y1 : y;
      var d = Math.hypot(sx - x, sy - y);
      if (!best || d < best.d) best = { x: sx, y: sy, d: d };
    }
    return best;
  }

  /* Can `it` sit where it is? (inside a zone for its type, not overlapping anything else) */
  function fits(it, others, zones, dropPt) {
    var s = snap(it.t, it.x, it.y, zones);
    if (!s || s.d > 0.5) return false;
    for (var i = 0; i < others.length; i++) if (others[i] !== it && overlaps(it, others[i])) return false;
    if (dropPt) {
      var c = capsule(it);
      if (segSeg2(c.ax, c.ay, c.bx, c.by, dropPt.x, dropPt.y, dropPt.x, dropPt.y) < Math.pow(c.r + 30, 2)) return false;
    }
    return true;
  }

  var api = { Sim: Sim, makeItem: makeItem, pose: pose, W: W, H: H, DT: DT, R: R, WALL_T: WALL_T, GATE_COL: GATE_COL,
    capsule: capsule, overlaps: overlaps, snap: snap, fits: fits, DEFAULT_ZONES: DEFAULT_ZONES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BTSim = api;
})(this);
