/* Protect Pumpkin! art: Pumpkin (a canvas port of the Swipe Theory cat rig), shields, threats, treats, backgrounds.
   All code-drawn, no image assets. Exposes window.PPArt. */
(function () {
  'use strict';
  var TAU = Math.PI * 2, INK = '#0b0d14', LW = 7;
  var FUR = [255, 162, 76], FUR_D = [217, 104, 42], CREAM = [255, 243, 224], NOSE = '#ff8fae';
  var WET = [208, 112, 44], WET_D = [156, 74, 26];
  var FONT = 'InterB, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
  function ell(c, x, y, rx, ry) { c.moveTo(x + rx, y); c.ellipse(x, y, Math.max(rx, .01), Math.max(ry, .01), 0, 0, TAU); }
  function fs(c, fill, lw) {
    c.fillStyle = fill; c.fill();
    c.lineWidth = lw == null ? LW : lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  }
  function seg(c, pts, col, w) {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // split a cubic bezier at t, return the second half [p0..p3]
  function bezTail(p, t) {
    function L(a, b) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    var a = L(p[0], p[1]), b = L(p[1], p[2]), cc = L(p[2], p[3]), d = L(a, b), e = L(b, cc), f = L(d, e);
    return [f, e, cc, p[3]];
  }
  function bez(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]); }

  // ---------------------------------------------------------------- Pumpkin
  function catState(o) {
    var P = { eye: 1, closed: 'happy', pupR: .35, pup: [0, 0], ear: 0, mouth: 'w', mo: .3, blush: 0, tail: 0, sway: 0,
      wet: 0, htilt: 0, sq: 1, paws: 0, snow: 0, brow: 0, sweat: 0 };
    if (o) for (var k in o) P[k] = o[k];
    return P;
  }
  function cols(P) {
    var w = Math.min(1, P.wet);
    if (P.grey) return { fur: '#b8bfcc', furd: '#7d8597', cream: '#f4f6fa' };
    var fur = mix(FUR, WET, w), furd = mix(FUR_D, WET_D, w), cream = mix(CREAM, [232, 201, 166], w);
    return { fur: rgb(fur), furd: rgb(furd), cream: rgb(cream) };
  }
  function catEar(c, s, P, K) {
    var fl = Math.max(0, -P.ear), pk = Math.max(0, P.ear);
    c.save(); c.translate(s * 74, -58); c.rotate(s * (.14 + .95 * fl - .1 * pk));
    var h = 106 * (1 - .3 * fl) * (1 + .06 * pk);
    c.beginPath(); c.moveTo(-46, 22); c.lineTo(s * 10, -h); c.lineTo(46, 22); c.closePath(); fs(c, K.fur);
    c.beginPath(); c.moveTo(-25, 10); c.lineTo(s * 8, -h * .64); c.lineTo(25, 10); c.closePath(); c.fillStyle = NOSE; c.fill();
    c.restore();
  }
  function catEye(c, x, y, P, side, K) {
    var rx = 33, ry = 37, op = P.eye;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (op < .12) {
      c.beginPath(); var cl = P.closed;
      if (cl === 'x') { c.moveTo(x - 20, y - 20); c.lineTo(x + 20, y + 20); c.moveTo(x + 20, y - 20); c.lineTo(x - 20, y + 20); }
      else if (cl === 'happy') { c.moveTo(x - 24, y + 8); c.bezierCurveTo(x - 10, y - 16, x + 10, y - 16, x + 24, y + 8); }
      else if (cl === 'squeeze') { var s = -side; c.moveTo(x - s * 20, y - 20); c.lineTo(x + s * 16, y); c.lineTo(x - s * 20, y + 20); }
      else { c.moveTo(x - 24, y - 2); c.bezierCurveTo(x - 10, y + 14, x + 10, y + 14, x + 24, y - 2); }
      c.strokeStyle = INK; c.lineWidth = 8; c.stroke();
      return;
    }
    c.beginPath(); ell(c, x, y, rx, ry); c.fillStyle = '#cdee4c'; c.fill();
    c.save(); c.beginPath(); ell(c, x, y, rx, ry); c.clip();
    c.beginPath(); ell(c, x, y + ry * .9, rx * 1.1, ry * .5); c.fillStyle = 'rgba(115,158,20,.25)'; c.fill();
    var pr = P.pupR, prx = rx * (.13 + .72 * pr), pry = ry * (.84 + .12 * pr);
    var px = x + P.pup[0] * rx * .42, py = y + P.pup[1] * ry * .35;
    c.beginPath(); ell(c, px, py, prx, pry); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(px - prx * .3 - 3, py - pry * .45, 5 + 6 * pr, 0, TAU); c.fillStyle = '#fff'; c.fill();
    if (op < 1) {
      var ly = y - ry + 2 * ry * (1 - op);
      c.fillStyle = K.fur; c.fillRect(x - rx - 2, y - ry - 2, 2 * rx + 4, ly - (y - ry) + 2);
      seg(c, [x - rx, ly + 2, x + rx, ly + 2], INK, 6);
    }
    c.restore();
    c.beginPath(); ell(c, x, y, rx, ry); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
  }
  function catMouth(c, x, y, P) {
    var k = P.mouth, mo = P.mo;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (k === 'w' || k === 'blep') {
      c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x, y + 8);
      c.moveTo(x - 30, y + 2); c.bezierCurveTo(x - 26, y + 18, x - 4, y + 20, x, y + 8);
      c.bezierCurveTo(x + 4, y + 20, x + 26, y + 18, x + 30, y + 2);
      c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
      if (k === 'blep') { c.beginPath(); rrect(c, x - 6, y + 13, 22, 26, 10); fs(c, '#ff7a9a', 4); }
    } else if (k === 'open' || k === 'scream') {
      var rx, ry;
      if (k === 'scream') { rx = 26 + 10 * mo; ry = 22 + 30 * mo; } else { rx = 14 + 12 * mo; ry = 9 + 28 * mo; }
      var cy = y + 6 + ry * .8;
      c.beginPath(); ell(c, x, cy, rx, ry); fs(c, '#5a1e2e', 6);
      c.save(); c.beginPath(); ell(c, x, cy, rx, ry); c.clip();
      c.beginPath(); ell(c, x, cy + ry * .85, rx * .8, ry * .5); c.fillStyle = '#ff7a9a'; c.fill();
      if (k === 'scream' || mo > .5) {
        for (var s = -1; s <= 1; s += 2) {
          var fx = x + s * rx * .5;
          c.beginPath(); c.moveTo(fx - 7, cy - ry - 2); c.lineTo(fx + 7, cy - ry - 2); c.lineTo(fx, cy - ry + 16); c.closePath(); c.fillStyle = '#fff'; c.fill();
        }
      }
      c.restore();
      c.beginPath(); ell(c, x, cy, rx, ry); c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
    } else if (k === 'smile') {
      c.beginPath(); c.moveTo(x - 34, y + 4); c.bezierCurveTo(x - 20, y + 44, x + 20, y + 44, x + 34, y + 4); c.closePath(); fs(c, '#5a1e2e', 6);
      c.save(); c.clip(); c.beginPath(); ell(c, x, y + 34, 20, 12); c.fillStyle = '#ff7a9a'; c.fill(); c.restore();
    } else if (k === 'flat') {
      seg(c, [x - 16, y + 12, x + 16, y + 12], INK, 6);
    }
  }
  function catHead(c, P, K) {
    var s;
    for (s = -1; s <= 1; s += 2) catEar(c, s, P, K);
    for (s = -1; s <= 1; s += 2) {
      c.beginPath(); c.moveTo(s * 96, -30); c.lineTo(s * 150, 4); c.lineTo(s * 118, 22); c.lineTo(s * 148, 52);
      c.lineTo(s * 106, 62); c.lineTo(s * 122, 86); c.lineTo(s * 70, 80); c.closePath(); fs(c, K.fur);
    }
    c.beginPath(); ell(c, 0, 0, 128, 108); fs(c, K.fur);
    c.save(); c.beginPath(); ell(c, 0, 0, 128, 108); c.clip();
    var st = [-38, -112, -28, -76, 0, -116, 0, -80, 38, -112, 28, -76, -132, -30, -102, -22, -132, 4, -106, 4, 132, -30, 102, -22, 132, 4, 106, 4];
    for (var i = 0; i < st.length; i += 4) seg(c, [st[i], st[i + 1], st[i + 2], st[i + 3]], K.furd, 13);
    c.beginPath(); ell(c, -30, 40, 40, 30); ell(c, 30, 40, 40, 30); ell(c, 0, 66, 28, 16); c.fillStyle = K.cream; c.fill();
    if (P.blush > 0) { c.beginPath(); ell(c, -82, 30, 22, 12); ell(c, 82, 30, 22, 12); c.fillStyle = 'rgba(255,115,140,' + (.55 * P.blush) + ')'; c.fill(); }
    c.restore();
    c.beginPath(); ell(c, 0, 0, 128, 108); c.strokeStyle = INK; c.lineWidth = LW; c.stroke();
    for (s = -1; s <= 1; s += 2) catEye(c, s * 50, -18, P, s, K);
    if (P.brow) {
      for (s = -1; s <= 1; s += 2) { var ex = s * 50, yb = -18 - 37 - 16; seg(c, [ex + s * 24, yb - P.brow * 4, ex - s * 20, yb + P.brow * 10 - 6], K.furd, 10); }
    }
    c.beginPath(); c.moveTo(-16, 12); c.lineTo(16, 12); c.lineTo(0, 28); c.closePath(); fs(c, NOSE, 5);
    catMouth(c, 0, 30, P);
    c.globalAlpha = .75;
    for (s = -1; s <= 1; s += 2) for (var j = 0; j < 3; j++) seg(c, [s * 64, 42 + j * 11, s * (178 + 6 * j), 26 + j * 22 + 4 * j * j], INK, 3.5);
    c.globalAlpha = 1;
    if (P.snow > 0) {   // snow cap
      c.beginPath(); c.moveTo(-90, -70); c.bezierCurveTo(-80, -120 - 30 * P.snow, 80, -120 - 30 * P.snow, 90, -70);
      c.bezierCurveTo(60, -86, 30, -64, 0, -82); c.bezierCurveTo(-30, -64, -60, -86, -90, -70); c.closePath(); fs(c, '#ffffff', 5);
    }
    if (P.sweat > 0) {
      c.globalAlpha = P.sweat; c.beginPath(); c.moveTo(150, -70); c.bezierCurveTo(170, -40, 172, -20, 156, -14); c.bezierCurveTo(138, -14, 136, -40, 150, -70);
      fs(c, '#8fd3ff', 4); c.globalAlpha = 1;
    }
  }
  function drawHead(c, P, K) {
    c.save(); c.translate(0, -292); c.rotate(P.htilt); catHead(c, P, K); c.restore();
  }
  // Pumpkin sitting, feet at (x, y), scale s (rig units: ~520 tall)
  function drawCat(c, x, y, s, P) {
    var K = cols(P), sq = P.sq;
    c.save(); c.translate(x, y); c.scale(s * (2 - sq), s * sq);
    // shadow
    c.beginPath(); ell(c, 0, 4, 150, 20); c.fillStyle = 'rgba(11,13,20,.18)'; c.fill();
    // tail
    var x0 = 64, y0 = -24, up = P.tail, sw = P.sway;
    var tp = [[x0, y0], [x0 + 100, y0 + 8], [x0 + 165, y0 - 70 - 50 * up], [x0 + 128 + 36 * sw, y0 - 178 - 70 * up]];
    bez(c, tp); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 30 + 2 * LW; c.stroke();
    c.strokeStyle = K.fur; c.lineWidth = 30; c.stroke();
    bez(c, bezTail(tp, .7)); c.strokeStyle = K.furd; c.stroke();
    var s2;
    for (s2 = -1; s2 <= 1; s2 += 2) { c.beginPath(); ell(c, s2 * 78, -50, 56, 50); fs(c, K.fur); }
    c.beginPath(); ell(c, 0, -130, 100, 128); fs(c, K.fur);
    c.save(); c.beginPath(); ell(c, 0, -130, 100, 128); c.clip();
    c.beginPath(); ell(c, 0, -112, 54, 94); c.fillStyle = K.cream; c.fill();
    for (s2 = -1; s2 <= 1; s2 += 2) for (var yy = -205; yy <= -115; yy += 45) seg(c, [s2 * 108, yy, s2 * 74, yy + 10], K.furd, 12);
    c.restore();
    c.beginPath(); ell(c, 0, -130, 100, 128); c.strokeStyle = INK; c.lineWidth = LW; c.stroke();
    var raised = P.paws > .5;
    if (raised) drawHead(c, P, K);
    for (s2 = -1; s2 <= 1; s2 += 2) {
      var k = P.paws, tx = s2 * (38 + 100 * k), ty = -16 - 300 * k;
      var Sx = s2 * 40, Sy = -178;
      seg(c, [Sx, Sy, tx, ty], INK, 34 + 2 * LW); seg(c, [Sx, Sy, tx, ty], K.fur, 34);
      c.beginPath(); ell(c, tx, ty - 2, 26, 16); fs(c, K.cream);
    }
    if (!raised) drawHead(c, P, K);
    if (P.wet > .2) {   // drips
      c.globalAlpha = Math.min(1, (P.wet - .2) * 2);
      for (var d = 0; d < 3; d++) { var dx = -110 + d * 110, dy = -190 + (d % 2) * 60; c.beginPath(); c.moveTo(dx, dy); c.bezierCurveTo(dx + 12, dy + 20, dx + 12, dy + 34, dx, dy + 34); c.bezierCurveTo(dx - 12, dy + 34, dx - 12, dy + 20, dx, dy); fs(c, '#8fd3ff', 4); }
      c.globalAlpha = 1;
    }
    c.restore();
  }

  // ---------------------------------------------------------------- shields (centre = dome centre, radius R)
  var SHIELDS = {
    umbrella: { R: 50, dome: true, a: '#ff5a6e', b: '#ffffff', handle: '#8a5a3c' },
    umbrella2: { R: 52, dome: true, a: '#3fb3ff', b: '#ffe14d', handle: '#5b47b8' },
    mitten: { R: 48, dome: true, a: '#ff4d6d', b: '#ffffff' },
    wood: { R: 46, dome: false, a: '#c98a4b', b: '#8a5a2c' },
    pan: { R: 48, dome: true, a: '#2b2f3a', b: '#5a6070' },
    metal: { R: 54, dome: true, a: '#b9c3d6', b: '#7d8aa3', handle: '#3b4252' },
    star: { R: 48, dome: false, a: '#3f7cff', b: '#ffe14d' },
    gold: { R: 52, dome: false, a: '#ffcc33', b: '#ff5c9a' }
  };
  function drawShield(c, kind, x, y, tilt, hitT) {
    var S = SHIELDS[kind], R = S.R;
    c.save(); c.translate(x, y); c.rotate(tilt || 0);
    var pop = hitT > 0 ? 1 + .08 * hitT : 1; c.scale(pop, 2 - pop);
    c.lineJoin = 'round'; c.lineCap = 'round';
    var i;
    if (kind === 'umbrella' || kind === 'umbrella2' || kind === 'metal') {
      var ry = R * .8, n = 6, xs = [];
      for (i = 0; i <= n; i++) xs.push(-R + i * 2 * R / n);
      // handle + hook
      seg(c, [0, -ry * .5, 0, R * 1.05], INK, 8); seg(c, [0, -ry * .5, 0, R * 1.05], S.handle || '#444', 4);
      c.beginPath(); c.arc(-9, R * 1.05, 9, 0, Math.PI); c.strokeStyle = INK; c.lineWidth = 8; c.stroke(); c.strokeStyle = S.handle; c.lineWidth = 4; c.stroke();
      // canopy: dome on top, scalloped hem
      var canopy = function () {
        c.beginPath(); c.moveTo(-R, 0); c.ellipse(0, 0, R, ry, 0, Math.PI, 0);
        for (var j = n; j > 0; j--) c.quadraticCurveTo((xs[j] + xs[j - 1]) / 2, -ry * .2, xs[j - 1], 0);
        c.closePath();
      };
      canopy(); c.fillStyle = S.a; c.fill();
      c.save(); canopy(); c.clip(); c.fillStyle = S.b;
      for (i = 1; i < n; i += 2) { c.beginPath(); c.moveTo(0, -ry * 1.3); c.lineTo(xs[i] * 1.05, 4); c.lineTo(xs[i + 1] * 1.05, 4); c.closePath(); c.fill(); }
      c.beginPath(); c.ellipse(-R * .3, -ry * .55, R * .3, ry * .14, -.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill();
      c.restore();
      c.strokeStyle = 'rgba(11,13,20,.4)'; c.lineWidth = 2;
      for (i = 1; i < n; i++) { c.beginPath(); c.moveTo(0, -ry); c.quadraticCurveTo(xs[i] * .8, -ry * .6, xs[i], 0); c.stroke(); }
      canopy(); c.strokeStyle = INK; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
      if (kind === 'metal') { c.fillStyle = INK; for (i = 1; i < n; i++) { c.beginPath(); c.arc(xs[i] * .7, -ry * .45 * (1 - Math.abs(xs[i]) / R * .6), 2.2, 0, TAU); c.fill(); } }
      c.beginPath(); c.arc(0, -ry - 4, 5, 0, TAU); fs(c, S.handle || '#444', 3);
    } else if (kind === 'mitten') {
      c.save(); c.translate(-R * .9, -R * .02); c.rotate(-.55); c.beginPath(); ell(c, 0, 0, R * .26, R * .42); fs(c, S.a, 3.5); c.restore();
      c.beginPath(); rrect(c, -R * .85, -R, R * 1.7, R * 1.4, R * .8); fs(c, S.a, 3.5);
      c.beginPath(); c.moveTo(-R * .62, -R * .12); c.quadraticCurveTo(-R * .5, R * .1, -R * .62, R * .3); c.strokeStyle = 'rgba(11,13,20,.35)'; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#fff'; for (i = 0; i < 5; i++) { c.beginPath(); c.arc(-R * .45 + i * R * .22, -R * .5 + (i % 2) * 12, 3.5, 0, TAU); c.fill(); }
      c.beginPath(); rrect(c, -R * .95, R * .28, R * 1.9, R * .4, R * .2); fs(c, '#ffffff', 3.5);
    } else if (kind === 'pan') {
      seg(c, [R * .7, R * .1, R * 1.6, R * .55], INK, 13); seg(c, [R * .7, R * .1, R * 1.6, R * .55], '#8a5a3c', 7);
      c.beginPath(); c.moveTo(-R, R * .12); c.arc(0, 0, R, Math.PI, 0); c.lineTo(R, R * .12); c.closePath(); fs(c, S.a, 3.5);
      c.beginPath(); ell(c, 0, R * .12, R, R * .2); fs(c, S.b, 3.5);
      c.beginPath(); c.arc(0, 0, R * .78, Math.PI * 1.15, Math.PI * 1.42); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 5; c.stroke();
    } else {  // round shields
      c.beginPath(); c.arc(0, 0, R, 0, TAU); fs(c, S.b, 4);
      c.beginPath(); c.arc(0, 0, R * .82, 0, TAU); c.fillStyle = S.a; c.fill();
      if (kind === 'wood') {
        c.strokeStyle = 'rgba(90,50,20,.45)'; c.lineWidth = 2.5;
        for (i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * R * .3, -Math.sqrt(1 - (i * .3 / .82) * (i * .3 / .82)) * R * .82); c.lineTo(i * R * .3, Math.sqrt(1 - (i * .3 / .82) * (i * .3 / .82)) * R * .82); c.stroke(); }
        c.beginPath(); c.arc(0, 0, R * .24, 0, TAU); fs(c, '#d9dee8', 3);
      } else if (kind === 'star') {
        star(c, 0, 0, R * .5, R * .22, S.b);
      } else {
        heart(c, 0, 2, R * .5, S.b, 3);
      }
      c.beginPath(); c.arc(0, 0, R * .9, Math.PI * 1.1, Math.PI * 1.45); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 5; c.stroke();
    }
    c.restore();
  }
  function star(c, x, y, r1, r2, col) {
    c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); fs(c, col, 3);
  }
  function heart(c, x, y, r, col, lw) {
    c.beginPath(); c.moveTo(x, y + r * .9);
    c.bezierCurveTo(x - r * 1.5, y - r * .1, x - r * .7, y - r * 1.25, x, y - r * .45);
    c.bezierCurveTo(x + r * .7, y - r * 1.25, x + r * 1.5, y - r * .1, x, y + r * .9);
    c.closePath(); fs(c, col, lw == null ? 3 : lw);
  }

  // ---------------------------------------------------------------- glow sprite cache
  var glowCache = {};
  function glow(col) {
    if (glowCache[col]) return glowCache[col];
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    glowCache[col] = cv; return cv;
  }

  // ---------------------------------------------------------------- threats + treats
  function fish(c, x, y, r, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(r * 1.1, 0); c.bezierCurveTo(r * .6, -r * .9, -r * .7, -r * .8, -r * .9, 0); c.bezierCurveTo(-r * .7, r * .8, r * .6, r * .9, r * 1.1, 0); c.closePath();
    fs(c, col || '#ffb347', 3);
    c.beginPath(); c.moveTo(-r * .8, 0); c.lineTo(-r * 1.6, -r * .6); c.lineTo(-r * 1.5, r * .6); c.closePath(); fs(c, col || '#ffb347', 3);
    c.beginPath(); c.arc(r * .5, -r * .15, r * .16, 0, TAU); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(-r * .05, 0, r * .45, -1, 1); c.strokeStyle = 'rgba(11,13,20,.45)'; c.lineWidth = 2; c.stroke();
    c.restore();
  }
  function drawObj(c, o, t) {
    var r = o.r, k = o.kind, i;
    c.save(); c.translate(o.x, o.y);
    if (o.fade != null) c.globalAlpha = Math.max(0, o.fade);
    switch (k) {
      case 'hail': {
        c.rotate(o.rot);
        c.beginPath(); for (i = 0; i < 6; i++) { var a = i * TAU / 6, rr = r * (o.jag[i]); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
        fs(c, '#e9f7ff', 2.5);
        c.beginPath(); c.arc(-r * .3, -r * .3, r * .25, 0, TAU); c.fillStyle = '#fff'; c.fill();
        break;
      }
      case 'snow': case 'bigsnow': {
        c.beginPath(); c.arc(0, 0, r, 0, TAU); fs(c, '#ffffff', 2.5);
        c.beginPath(); c.arc(r * .2, r * .25, r * .6, 0, TAU); c.fillStyle = 'rgba(150,190,230,.35)'; c.fill();
        break;
      }
      case 'leaf': {
        c.rotate(o.rot); c.beginPath(); c.moveTo(-r * 1.2, 0); c.quadraticCurveTo(0, -r * 1.1, r * 1.2, 0); c.quadraticCurveTo(0, r * 1.1, -r * 1.2, 0); c.closePath();
        fs(c, o.col || '#5cc85c', 2.5); seg(c, [-r, 0, r, 0], 'rgba(11,13,20,.5)', 1.5); break;
      }
      case 'sock': {
        c.rotate(o.rot); c.beginPath(); c.moveTo(-r * .4, -r * 1.1); c.lineTo(r * .4, -r * 1.1); c.lineTo(r * .4, r * .3); c.quadraticCurveTo(r * .4, r * .9, -r * .1, r * .9);
        c.lineTo(-r * 1.1, r * .9); c.quadraticCurveTo(-r * 1.4, r * .4, -r * .4, r * .2); c.closePath(); fs(c, '#ff7ab8', 2.5);
        seg(c, [-r * .4, -r * .6, r * .4, -r * .6], '#fff', 3); seg(c, [-r * .4, -r * .2, r * .4, -r * .2], '#fff', 3); break;
      }
      case 'boot': {
        c.rotate(o.rot); c.beginPath(); c.moveTo(-r * .5, -r); c.lineTo(r * .4, -r); c.lineTo(r * .4, r * .4); c.lineTo(r * 1.1, r * .5); c.lineTo(r * 1.1, r * .95);
        c.lineTo(-r * .5, r * .95); c.closePath(); fs(c, '#a86a3d', 2.5); seg(c, [-r * .5, r * .7, r * 1.1, r * .7], INK, 2); break;
      }
      case 'pot': {
        c.rotate(o.rot);
        c.beginPath(); ell(c, -r * .3, -r * 1.05, r * .35, r * .5); ell(c, r * .3, -r * 1.1, r * .3, r * .45); c.fillStyle = '#5cc85c'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
        c.beginPath(); c.moveTo(-r * .8, -r * .6); c.lineTo(r * .8, -r * .6); c.lineTo(r * .6, r * .8); c.lineTo(-r * .6, r * .8); c.closePath(); fs(c, '#e07a4a', 2.5); break;
      }
      case 'duck': {
        c.rotate(o.rot); c.beginPath(); ell(c, 0, r * .2, r, r * .7); fs(c, '#ffd23f', 2.5); c.beginPath(); c.arc(r * .4, -r * .5, r * .5, 0, TAU); fs(c, '#ffd23f', 2.5);
        c.beginPath(); c.moveTo(r * .85, -r * .5); c.lineTo(r * 1.3, -r * .4); c.lineTo(r * .85, -r * .25); c.closePath(); fs(c, '#ff8a3d', 2);
        c.beginPath(); c.arc(r * .5, -r * .6, r * .09, 0, TAU); c.fillStyle = INK; c.fill(); break;
      }
      case 'meteor': case 'pebble': case 'fireball': case 'rock': {
        if (k !== 'rock') {
          var sp = Math.hypot(o.vx, o.vy) || 1, ux = -o.vx / sp, uy = -o.vy / sp;
          var fire = k === 'fireball' ? 'rgba(255,90,40,.9)' : 'rgba(255,140,40,.85)';
          for (i = 5; i >= 1; i--) { var gs = r * (2.6 - i * .25); c.drawImage(glow(fire), ux * r * i * .9 - gs, uy * r * i * .9 - gs, gs * 2, gs * 2); }
          c.drawImage(glow('rgba(255,220,120,.9)'), -r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
        }
        if (k === 'fireball') { c.beginPath(); c.arc(0, 0, r * .85, 0, TAU); c.fillStyle = '#fff3b0'; c.fill(); c.beginPath(); c.arc(0, 0, r * .85, 0, TAU); c.strokeStyle = '#ff7a2a'; c.lineWidth = 4; c.stroke(); break; }
        c.rotate(o.rot);
        c.beginPath(); for (i = 0; i < 8; i++) { var a2 = i * TAU / 8, r2 = r * o.jag[i % 6]; c.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); } c.closePath();
        fs(c, k === 'rock' ? '#6b6f7d' : '#7a5240', 2.5);
        c.beginPath(); c.arc(r * .25, -r * .2, r * .22, 0, TAU); c.arc(-r * .35, r * .25, r * .16, 0, TAU); c.fillStyle = 'rgba(11,13,20,.3)'; c.fill();
        break;
      }
      case 'lava': {
        c.drawImage(glow('rgba(255,120,30,.8)'), -r * 2.6, -r * 2.6, r * 5.2, r * 5.2);
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#ff6a1a'; c.fill(); c.strokeStyle = '#7a1d0a'; c.lineWidth = 2.5; c.stroke();
        c.beginPath(); c.arc(-r * .25, -r * .25, r * .45, 0, TAU); c.fillStyle = '#ffd34d'; c.fill();
        break;
      }
      case 'bolt': {
        var a3 = Math.atan2(o.vy, o.vx); c.rotate(a3);
        c.drawImage(glow('rgba(120,255,120,.75)'), -r * 4, -r * 2.4, r * 8, r * 4.8);
        c.beginPath(); rrect(c, -r * 2.2, -r * .6, r * 4.4, r * 1.2, r * .6); c.fillStyle = '#eaffd0'; c.fill(); c.strokeStyle = '#39d353'; c.lineWidth = 2.5; c.stroke();
        break;
      }
      case 'goo': {
        c.beginPath(); c.moveTo(0, -r * 1.3); c.bezierCurveTo(r * 1.1, -r * .2, r, r, 0, r); c.bezierCurveTo(-r, r, -r * 1.1, -r * .2, 0, -r * 1.3); fs(c, '#7ee04f', 2.5);
        c.beginPath(); c.arc(-r * .3, -r * .1, r * .2, 0, TAU); c.fillStyle = '#d8ffc4'; c.fill(); break;
      }
      case 'treat': {
        c.drawImage(glow('rgba(255,236,140,.75)'), -r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
        fish(c, 0, 0, r, Math.sin(t * 6 + o.seed) * .35 - Math.PI / 2 + Math.PI, '#ffb347');
        var tw = .5 + .5 * Math.sin(t * 9 + o.seed);
        c.globalAlpha *= tw; star(c, r * 1.2, -r * 1.1, 5, 2, '#fff7b0'); c.globalAlpha = 1;
        break;
      }
      case 'giant': drawGiant(c, o, t); break;
    }
    c.restore();
  }
  function drawGiant(c, o, t) {
    var r = o.r, g = o.giant, i;
    c.rotate(Math.sin(t * 2) * .08);
    if (g === 'raindrop') {
      c.beginPath(); c.moveTo(0, -r * 1.5); c.bezierCurveTo(r * .9, -r * .2, r, r * .9, 0, r); c.bezierCurveTo(-r, r * .9, -r * .9, -r * .2, 0, -r * 1.5); fs(c, '#6cc6ff', 4);
      c.beginPath(); ell(c, -r * .35, 0, r * .16, r * .3); c.fillStyle = 'rgba(255,255,255,.8)'; c.fill();
    } else if (g === 'hail' || g === 'snow') {
      c.beginPath(); c.arc(0, 0, r, 0, TAU); fs(c, g === 'hail' ? '#e2f4ff' : '#ffffff', 4);
      if (g === 'hail') { seg(c, [-r * .5, -r * .2, -r * .1, r * .1, -r * .3, r * .5], 'rgba(90,150,200,.7)', 3); }
      c.beginPath(); c.arc(-r * .35, -r * .35, r * .2, 0, TAU); c.fillStyle = '#fff'; c.fill();
    } else if (g === 'box' || g === 'crate') {
      c.beginPath(); rrect(c, -r, -r * .85, r * 2, r * 1.7, 6); fs(c, g === 'box' ? '#d39552' : '#9e73ff', 4);
      seg(c, [-r, -r * .3, r, -r * .3], INK, 3); seg(c, [0, -r * .85, 0, -r * .3], INK, 3);
      if (g === 'crate') { c.drawImage(glow('rgba(160,255,200,.6)'), -r * 2, -r * 2, r * 4, r * 4); star(c, 0, r * .25, r * .35, r * .15, '#ffe14d'); }
      else { c.font = '700 ' + (r * .5) + 'px ' + FONT; c.textAlign = 'center'; c.fillStyle = INK; c.fillText('?', 0, r * .45); }
    } else if (g === 'meteor' || g === 'lava' || g === 'fireball') {
      var col = g === 'fireball' ? 'rgba(255,80,60,.8)' : 'rgba(255,140,40,.8)';
      c.drawImage(glow(col), -r * 2.4, -r * 3.2, r * 4.8, r * 4.8);
      c.beginPath(); for (i = 0; i < 9; i++) { var a = i * TAU / 9, rr = r * (.86 + .14 * Math.sin(i * 2.7)); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
      fs(c, g === 'lava' ? '#ff6a1a' : g === 'fireball' ? '#ff9a3d' : '#7a5240', 4);
      c.beginPath(); c.arc(-r * .3, -r * .25, r * .22, 0, TAU); c.arc(r * .35, r * .2, r * .16, 0, TAU); c.fillStyle = g === 'meteor' ? 'rgba(11,13,20,.3)' : 'rgba(255,230,120,.8)'; c.fill();
    }
  }

  // twist rewards, drawn near Pumpkin
  function drawReward(c, kind, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    var i;
    if (kind === 'icecream') {
      c.beginPath(); c.moveTo(-22, 0); c.lineTo(22, 0); c.lineTo(0, 56); c.closePath(); fs(c, '#e6a35c', 3);
      seg(c, [-14, 14, 8, 40], 'rgba(11,13,20,.4)', 2); seg(c, [14, 14, -8, 40], 'rgba(11,13,20,.4)', 2);
      c.beginPath(); c.arc(0, -10, 24, 0, TAU); fs(c, '#ffb3d1', 3); c.beginPath(); c.arc(0, -36, 18, 0, TAU); fs(c, '#bdf0ff', 3);
      c.beginPath(); c.arc(4, -56, 7, 0, TAU); fs(c, '#ff4d6d', 2.5);
    } else if (kind === 'snowman') {
      c.beginPath(); c.arc(0, 0, 30, 0, TAU); fs(c, '#fff', 3); c.beginPath(); c.arc(0, -44, 21, 0, TAU); fs(c, '#fff', 3);
      c.beginPath(); rrect(c, -22, -28, 44, 9, 4); fs(c, '#ff4d6d', 2.5); c.beginPath(); rrect(c, 8, -26, 9, 24, 4); fs(c, '#ff4d6d', 2.5);
      c.fillStyle = INK; c.beginPath(); c.arc(-7, -48, 3, 0, TAU); c.arc(7, -48, 3, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(0, -42); c.lineTo(16, -39); c.lineTo(0, -37); c.closePath(); fs(c, '#ff8a3d', 2);
      c.beginPath(); c.arc(0, -40, 9, .3, Math.PI - .3); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      seg(c, [-26, -10, -50, -30], '#8a5a3c', 4); seg(c, [26, -10, 50, -30], '#8a5a3c', 4);
    } else if (kind === 'kitten') {
      drawCat(c, 0, 30, .2, catState({ grey: true, closed: 'happy', eye: 0, blush: 1, mouth: 'open', mo: .4, sway: Math.sin(t * 4) }));
    } else if (kind === 'fish') {
      fish(c, 0, -10, 34, Math.sin(t * 5) * .2, '#ff9f43');
    } else if (kind === 'popcorn') {
      c.beginPath(); c.moveTo(-26, -20); c.lineTo(26, -20); c.lineTo(20, 34); c.lineTo(-20, 34); c.closePath(); fs(c, '#fff', 3);
      c.save(); c.clip(); for (i = -2; i <= 2; i++) { c.fillStyle = '#ff4d6d'; c.fillRect(i * 16 - 4, -20, 8, 60); } c.restore();
      c.beginPath(); c.moveTo(-26, -20); c.lineTo(26, -20); c.lineTo(20, 34); c.lineTo(-20, 34); c.closePath(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      for (i = 0; i < 7; i++) { c.beginPath(); c.arc(-20 + i * 7, -24 - (i % 2) * 8, 8, 0, TAU); fs(c, '#fff3c4', 2); }
    } else if (kind === 'cake') {
      c.beginPath(); rrect(c, -34, -10, 68, 40, 6); fs(c, '#ffb3d1', 3);
      c.beginPath(); rrect(c, -34, -10, 68, 12, 6); fs(c, '#fff', 3);
      c.beginPath(); rrect(c, -4, -36, 8, 26, 3); fs(c, '#8fd3ff', 2.5);
      c.drawImage(glow('rgba(255,200,80,.8)'), -14, -60, 28, 28);
      c.beginPath(); ell(c, 0, -42, 5, 8); c.fillStyle = '#ffcc33'; c.fill();
    } else if (kind === 'heart') {
      var b = 1 + .08 * Math.sin(t * 8); c.scale(b, b); heart(c, 0, -10, 34, '#ff5c9a', 4);
      c.beginPath(); ell(c, -14, -22, 6, 4); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- backgrounds (pre-rendered)
  function cloud(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.arc(-30, 6, 22, Math.PI * .5, Math.PI * 1.5); c.arc(-8, -12, 26, Math.PI, Math.PI * 1.9); c.arc(24, -4, 22, Math.PI * 1.2, Math.PI * .1 + TAU);
    c.arc(30, 14, 14, -Math.PI * .4, Math.PI * .5); c.lineTo(-30, 28); c.closePath();
    fs(c, col || '#fff', 3.5 / s);
    c.restore();
  }
  function drawBg(c, W, H, gy, world, t) {
    var w = world, g = c.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, w.sky[0]); g.addColorStop(1, w.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    var i, rnd = mulberry(w.seed || 7);
    if (w.stars) { c.fillStyle = 'rgba(255,255,255,.85)'; for (i = 0; i < 70; i++) { c.beginPath(); c.arc(rnd() * W, rnd() * gy * .8, rnd() * 1.6 + .4, 0, TAU); c.fill(); } }
    if (w.sun) { c.beginPath(); c.arc(W * .82, gy * .2, 26, 0, TAU); fs(c, '#ffe46b', 3.5); }
    if (w.moon) { c.beginPath(); c.arc(W * .8, gy * .18, 24, 0, TAU); fs(c, '#fff4c8', 3.5); c.beginPath(); c.arc(W * .8 + 7, gy * .18 - 5, 6, 0, TAU); c.fillStyle = 'rgba(11,13,20,.12)'; c.fill(); }
    // hills
    c.beginPath(); c.moveTo(0, gy);
    for (i = 0; i <= 8; i++) { var hx = i * W / 8; c.quadraticCurveTo(hx - W / 16, gy - 40 - rnd() * 50, hx, gy - 20 - rnd() * 20); }
    c.lineTo(W, gy); c.closePath(); c.fillStyle = w.hill; c.fill();
    if (w.volcano) {
      var vx = W * .2, vt = gy - 190;
      c.beginPath(); c.moveTo(vx - 130, gy); c.lineTo(vx - 26, vt); c.lineTo(vx + 26, vt); c.lineTo(vx + 130, gy); c.closePath(); fs(c, '#8a4b32', 4);
      c.beginPath(); c.moveTo(vx - 26, vt); c.lineTo(vx - 34, vt + 40); c.lineTo(vx - 18, vt + 30); c.lineTo(vx - 10, vt + 70); c.lineTo(vx, vt + 26); c.lineTo(vx + 12, vt + 56); c.lineTo(vx + 26, vt); c.closePath(); c.fillStyle = '#ff7a1a'; c.fill();
      c.beginPath(); ell(c, vx, vt, 27, 7); fs(c, '#ffb13d', 3);
    }
    if (w.castle) {
      c.fillStyle = 'rgba(40,10,40,.55)';
      c.fillRect(W * .62, gy - 150, 26, 150); c.fillRect(W * .74, gy - 110, 70, 110); c.fillRect(W * .9, gy - 170, 24, 170);
      for (i = 0; i < 5; i++) c.fillRect(W * .74 + i * 15, gy - 122, 9, 12);
    }
    if (w.trees) {
      for (i = 0; i < 5; i++) { var tx = (i + .5) * W / 5 + (rnd() - .5) * 30; if (Math.abs(tx - W / 2) < 70) continue; var th = 50 + rnd() * 30;
        c.beginPath(); c.moveTo(tx, gy - th - 20); c.lineTo(tx + 24, gy - 10); c.lineTo(tx - 24, gy - 10); c.closePath(); fs(c, w.trees, 3); }
    }
    if (w.palm) {
      var px = W * .86; seg(c, [px, gy, px - 10, gy - 120], INK, 13); seg(c, [px, gy, px - 10, gy - 120], '#a8743f', 8);
      for (i = 0; i < 5; i++) { var a = Math.PI * (1.05 + i * .22); c.beginPath(); c.moveTo(px - 10, gy - 120); c.quadraticCurveTo(px - 10 + Math.cos(a) * 40, gy - 150 + Math.sin(a) * 20, px - 10 + Math.cos(a) * 62, gy - 110 + Math.sin(a) * 30 + 30); c.strokeStyle = INK; c.lineWidth = 11; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#3bb85a'; c.lineWidth = 7; c.stroke(); }
    }
    // ground
    c.fillStyle = w.ground; c.fillRect(0, gy, W, H - gy);
    c.fillStyle = w.ground2; c.fillRect(0, gy, W, 9);
    c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    if (w.flowers) for (i = 0; i < 9; i++) { var fx = rnd() * W; if (Math.abs(fx - W / 2) < 60) continue; var fy = gy + 18 + rnd() * (H - gy - 30); c.beginPath(); c.arc(fx, fy, 4, 0, TAU); fs(c, ['#fff', '#ffe14d', '#ff8fae'][i % 3], 2); }
    // cushion
    if (!w.noCushion) c.beginPath(), rrect(c, W / 2 - 52, gy - 10, 104, 16, 8), fs(c, w.cushion || '#ff6fa5', 3);
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // captions + bubbles
  function pill(c, text, x, y, size, bg, fg, maxW) {
    c.font = '700 ' + size + 'px ' + FONT;
    var w = c.measureText(text).width;
    if (maxW && w + size * 1.4 > maxW) { size = size * (maxW - size * 1.4) / w; c.font = '700 ' + size + 'px ' + FONT; w = c.measureText(text).width; }
    var h = size * 1.6, pw = w + size * 1.3;
    c.beginPath(); rrect(c, x - pw / 2, y - h / 2, pw, h, h / 2); fs(c, bg, 3);
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + size * .04);
  }
  function bubble(c, text, x, y, size, side) {
    c.font = '700 ' + size + 'px ' + FONT;
    var w = c.measureText(text).width + size * 1.1, h = size * 1.7;
    var bx = x - w / 2 + side * w * .3;
    c.beginPath(); rrect(c, bx, y - h, w, h, h * .45);
    fs(c, '#ffffff', 2.5);
    c.beginPath(); c.moveTo(x - 7, y - 2); c.lineTo(x + 7, y - 2); c.lineTo(x - side * 4, y + 12); c.closePath(); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); c.moveTo(x - 7, y - 1); c.lineTo(x - side * 4, y + 12); c.lineTo(x + 7, y - 1); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, bx + w / 2, y - h / 2 + size * .05);
  }
  function rainbow(c, cx, cy, r, a) {
    var cs = ['#ff5a6e', '#ff9f43', '#ffe14d', '#5cd65c', '#3fb3ff', '#9e73ff'];
    c.save(); c.globalAlpha = a; c.lineCap = 'butt';
    for (var i = 0; i < cs.length; i++) { c.beginPath(); c.arc(cx, cy, r - i * 9, Math.PI, 0); c.strokeStyle = cs[i]; c.lineWidth = 9.5; c.stroke(); }
    c.restore();
  }
  // Floating finger hint (for the tutorial), tip at (x,y)
  function finger(c, x, y, s, a) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a;
    c.beginPath(); c.moveTo(-14, 0); c.arc(0, 0, 14, Math.PI, 0); c.lineTo(14, 70); c.quadraticCurveTo(26, 80, 34, 100); c.lineTo(-30, 100); c.quadraticCurveTo(-22, 80, -14, 66); c.closePath();
    fs(c, '#ffd9b8', 3);
    c.beginPath(); rrect(c, -8, -9, 16, 14, 6); c.fillStyle = '#fff1e6'; c.fill(); c.strokeStyle = 'rgba(11,13,20,.35)'; c.lineWidth = 1.5; c.stroke();
    c.restore();
  }

  window.PPArt = { INK: INK, FONT: FONT, catState: catState, drawCat: drawCat, drawShield: drawShield, SHIELDS: SHIELDS, drawObj: drawObj,
    drawReward: drawReward, drawBg: drawBg, cloud: cloud, pill: pill, bubble: bubble, rainbow: rainbow, finger: finger, heart: heart,
    star: star, fish: fish, glow: glow, rrect: rrect, fs: fs, ell: ell, seg: seg };
})();
