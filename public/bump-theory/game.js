/* Bump Theory: 1 Ball -> 10,000. Game: rendering, input, sound, levels, sharing. */
(function () {
  'use strict';
  var S = window.BTSim, LEVELS = window.BTLevels.levels;
  var W = S.W, H = S.H, DT = S.DT, R = S.R;
  var URL_BASE = 'https://saagarverma.com/bump-theory/';
  var PAL = ['#ffffff', '#33d9ff', '#9ef040', '#9e73ff', '#ff5494', '#ffcc33', '#ff8c2e', '#ff4d4d'];
  var PAL_RGB = PAL.map(function (h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; });
  var GATE_N = [2, 3, 4, 5, 10];
  var $ = function (id) { return document.getElementById(id); };
  var qs = new URLSearchParams(location.search);

  /* ---------------- storage (never required) ---------------- */
  var save = { stars: [], best: [], muted: false, sbest: 0 };
  try { var raw = window.localStorage.getItem('bt1'); if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') for (var k in save) if (o[k] !== undefined) save[k] = o[k]; } } catch (e) { /* private mode etc. */ }
  function persist() { try { window.localStorage.setItem('bt1', JSON.stringify(save)); } catch (e) { /* ignore */ } }
  function starsOf(i) { return save.stars[i] | 0; }
  function unlocked(i) { return i === 0 || starsOf(i - 1) > 0 || starsOf(i) > 0; }

  function fmt(n) {
    n = Math.round(n);
    if (n < 1e12) return n.toLocaleString('en-US');
    var u = [[1e15, ' quadrillion'], [1e12, ' trillion']];
    for (var i = 0; i < u.length; i++) if (n >= u[i][0]) return (n / u[i][0]).toFixed(2) + u[i][1];
    return String(n);
  }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 1800); }

  /* ---------------- sound (WebAudio, made only after a user tap) ---------------- */
  var Snd = {
    ctx: null, out: null, bufs: {}, last: {}, muted: !!save.muted,
    init: function () {
      if (this.ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      var ctx; try { ctx = new C(); } catch (e) { return; }
      this.ctx = ctx;
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6; comp.connect(ctx.destination);
      var master = ctx.createGain(); master.gain.value = this.muted ? 0 : 0.7; master.connect(comp); this.master = master;
      var verb = ctx.createConvolver(), len = ctx.sampleRate * 1.8 | 0, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      verb.buffer = ir; var wet = ctx.createGain(); wet.gain.value = 0.22; verb.connect(wet); wet.connect(master); this.verb = verb;
      // C major pentatonic, 3 octaves from C4
      var semis = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];
      var sr = ctx.sampleRate, self = this;
      function mk(dur, fn) { var n = sr * dur | 0, b = ctx.createBuffer(1, n, sr), x = b.getChannelData(0); for (var i = 0; i < n; i++) x[i] = fn(i / sr) * Math.min(1, i / (sr * 0.002)); return b; }
      this.bufs.mar = semis.map(function (s) {
        var f = 261.63 * Math.pow(2, s / 12), w = 2 * Math.PI * f;
        return mk(0.9, function (t) { return 0.6 * Math.sin(w * t) * Math.exp(-6 * t) + 0.22 * Math.sin(4 * w * t) * Math.exp(-24 * t) + 0.08 * Math.sin(10 * w * t) * Math.exp(-60 * t); });
      });
      this.bufs.bell = semis.map(function (s) {
        var f = 523.25 * Math.pow(2, s / 12), w = 2 * Math.PI * f;
        return mk(1.4, function (t) { return 0.45 * Math.sin(w * t) * Math.exp(-3 * t) + 0.22 * Math.sin(2.76 * w * t) * Math.exp(-6 * t) + 0.1 * Math.sin(5.4 * w * t) * Math.exp(-11 * t); });
      });
      this.bufs.thud = [mk(0.35, function (t) { return 0.8 * Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-14 * t)) * t) * Math.exp(-9 * t); })];
      self.ready = true;
    },
    play: function (kind, idx, vol, when) {
      if (!this.ready || this.muted || document.hidden) return;
      var ctx = this.ctx, set = this.bufs[kind]; if (!set) return;
      idx = Math.max(0, Math.min(set.length - 1, idx | 0));
      var src = ctx.createBufferSource(); src.buffer = set[idx];
      var g = ctx.createGain(); g.gain.value = vol;
      src.connect(g); g.connect(this.master); g.connect(this.verb);
      src.start(ctx.currentTime + (when || 0));
    },
    gate: function (key, minGap) {
      var now = performance.now(); if (now - (this.last[key] || 0) < minGap) return false; this.last[key] = now; return true;
    },
    setMuted: function (m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.7; }
  };

  /* ---------------- canvas + renderers ---------------- */
  var stage = $('stage'), cv = $('cv2d'), cg = $('cvgl'), ctx = cv.getContext('2d');
  var view = { w: 1, h: 1, dpr: 1, s: 1, ox: 0, oy: 0 }, quality = 2, qMax = 2;
  function layout() {
    var r = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, quality >= 2 ? 2 : quality === 1 ? 1.5 : 1);
    view.w = r.width; view.h = r.height; view.dpr = dpr;
    view.s = Math.min(r.width / W, r.height / H);
    view.ox = (r.width - W * view.s) / 2; view.oy = (r.height - H * view.s) / 2;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    cg.width = cv.width; cg.height = cv.height;
    if (gl) gl.viewport(0, 0, cg.width, cg.height);
  }

  var gl = null, glp = null, glbuf = null, gldata = null, glLoc = {};
  function initGL() {
    if (qs.has('nogl')) return;
    try { gl = cg.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) return;
    var vs = 'attribute vec4 a; uniform vec4 u_t; uniform float u_ps; uniform vec3 u_pal[8]; varying vec3 v_c;' +
      'void main(){ gl_Position = vec4(a.x*u_t.x+u_t.z, a.y*u_t.y+u_t.w, 0.0, 1.0); gl_PointSize = a.z*u_ps; v_c = u_pal[int(a.w+0.5)]; }';
    var fs = 'precision mediump float; varying vec3 v_c; uniform float u_core;' +
      'void main(){ vec2 d = gl_PointCoord*2.0-1.0; float r = length(d); if (r > 1.0) discard;' +
      ' float core = 1.0 - smoothstep(u_core*0.82, u_core, r); float gl2 = (1.0-r); gl2 = gl2*gl2*0.42;' +
      ' vec3 col = mix(v_c, vec3(1.0), core*0.45*max(0.0, 1.0 - r/(u_core*0.7)));' +
      ' float al = max(core, gl2); gl_FragColor = vec4(col*al, al); }';
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    try {
      glp = gl.createProgram(); gl.attachShader(glp, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(glp, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(glp);
      if (!gl.getProgramParameter(glp, gl.LINK_STATUS)) throw new Error('link');
    } catch (e) { gl = null; return; }
    gl.useProgram(glp);
    glLoc.a = gl.getAttribLocation(glp, 'a'); glLoc.t = gl.getUniformLocation(glp, 'u_t'); glLoc.ps = gl.getUniformLocation(glp, 'u_ps');
    glLoc.core = gl.getUniformLocation(glp, 'u_core'); glLoc.pal = gl.getUniformLocation(glp, 'u_pal');
    var pal = []; PAL_RGB.forEach(function (c) { pal.push(c[0], c[1], c[2]); }); gl.uniform3fv(glLoc.pal, new Float32Array(pal));
    glbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, glbuf);
    gl.enableVertexAttribArray(glLoc.a); gl.vertexAttribPointer(glLoc.a, 4, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    cg.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; }, false);
  }

  // 2D fallback sprites
  var sprites = null;
  function makeSprites() {
    sprites = PAL.map(function (c) {
      var s = 48, o = document.createElement('canvas'); o.width = o.height = s; var x = o.getContext('2d');
      var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, '#fff'); g.addColorStop(0.2, c); g.addColorStop(0.36, c); g.addColorStop(0.42, c + '66'); g.addColorStop(1, c + '00');
      x.fillStyle = g; x.fillRect(0, 0, s, s); return o;
    });
  }

  var glowMul = [1.25, 1.9, 2.6];
  function drawBalls(sim, alpha) {
    var n = sim ? sim.n : 0;
    if (gl) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!n) return;
      if (!gldata || gldata.length < n * 4) gldata = new Float32Array(Math.max(n, 2048) * 4 * 1.5 | 0);
      var X = sim.x, Y = sim.y, PX = sim.px, PY = sim.py, Wt = sim.w, Cl = sim.col, d = gldata, gm = glowMul[quality], base = 2 * R * gm;
      for (var i = 0, j = 0; i < n; i++, j += 4) {
        d[j] = PX[i] + (X[i] - PX[i]) * alpha; d[j + 1] = PY[i] + (Y[i] - PY[i]) * alpha;
        var w = Wt[i]; d[j + 2] = w > 1 ? base * (1 + Math.min(1.4, Math.log(w) * 0.16)) : base; d[j + 3] = Cl[i];
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, glbuf);
      gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, n * 4), gl.DYNAMIC_DRAW);
      gl.uniform4f(glLoc.t, 2 * view.s / view.w, -2 * view.s / view.h, 2 * view.ox / view.w - 1, 1 - 2 * view.oy / view.h);
      gl.uniform1f(glLoc.ps, view.s * view.dpr);
      gl.uniform1f(glLoc.core, 1 / gm);
      gl.drawArrays(gl.POINTS, 0, n);
    } else if (n) {
      if (!sprites) makeSprites();
      var gm2 = glowMul[quality], sz = 2 * R * gm2 * 1.15;
      for (var k = 0; k < n; k++) {
        var x = sim.px[k] + (sim.x[k] - sim.px[k]) * alpha, y = sim.py[k] + (sim.y[k] - sim.py[k]) * alpha;
        var s2 = sim.w[k] > 1 ? sz * (1 + Math.min(1.4, Math.log(sim.w[k]) * 0.16)) : sz;
        ctx.drawImage(sprites[sim.col[k]], x - s2 / 2, y - s2 / 2, s2, s2);
      }
    }
  }

  /* ---------------- game state ---------------- */
  var G = {
    mode: 'menu',          // menu | level | sandbox
    phase: 'edit',         // edit | run | result
    li: 0, L: null, fixed: [], placed: [], sim: null, acc: 0, previewT: 0,
    sel: null, hint: false, recycle: true, lastCount: 1, attract: null, bursts: []
  };
  function allItems() { return G.fixed.concat(G.placed); }
  function invKey(d) { return d.t === 'gate' ? 'gate' + d.n : d.t; }
  function invLeft(key) {
    if (G.mode === 'sandbox') return Infinity;
    var inv = G.L.inv, total = 0;
    for (var i = 0; i < inv.length; i++) if (invKey(inv[i]) === key) total += inv[i].c;
    for (var j = 0; j < G.placed.length; j++) if (invKey(G.placed[j]) === key) total--;
    return total;
  }
  function zones() { return G.mode === 'sandbox' ? null : G.L.zones; }
  function dropPt() { return G.mode === 'sandbox' ? { x: W / 2, y: 200 } : G.L.drop; }

  function loadLevel(i) {
    i = Math.max(0, Math.min(LEVELS.length - 1, i | 0));
    G.mode = 'level'; G.li = i; G.L = LEVELS[i]; G.phase = 'edit'; G.sim = null; G.hint = false; G.sel = null;
    G.fixed = G.L.fixed.map(function (d) { return S.makeItem(d, true); });
    G.placed = [];
    G.fixed.forEach(function (it) { S.pose(it, 0); });
    hideAll(); $('bHint').hidden = false; $('bHint').classList.remove('on');
    $('ttl').innerHTML = '<small>LEVEL ' + (i + 1) + '</small>' + esc(G.L.name);
    showTip(G.L.tip);
    buildTray(); updateHud(true);
    try { history.replaceState(null, '', '?level=' + (i + 1)); } catch (e) { /* file:// etc. */ }
  }
  function loadSandbox() {
    G.mode = 'sandbox'; G.L = null; G.phase = 'run'; G.hint = false; G.sel = null;
    G.fixed = []; G.placed = [];
    G.sim = new S.Sim(G.placed.slice(), { alloc: 14000, cap: 14000, recycle: G.recycle, seed: (Math.random() * 1e9) | 0, tmax: 1e9 });
    hideAll(); $('bHint').hidden = true;
    $('ttl').innerHTML = '<small>SANDBOX</small>No limits';
    showTip('Build anything. Recycle sends balls back to the top so they can split again.');
    buildTray(); updateHud(true);
    try { history.replaceState(null, '', '?sandbox=1'); } catch (e) { /* ignore */ }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hideAll() { $('menu').hidden = true; $('levels').hidden = true; $('result').hidden = true; G.attract = null; $('tray').style.visibility = ''; }
  function showTip(t) { var e = $('tip'); e.textContent = t; e.classList.toggle('hide', !t); }

  function syncSandboxItems() { if (G.mode === 'sandbox' && G.sim) G.sim.setItems(allItems()); }

  /* ---------------- tray ---------------- */
  function trayTypes() {
    if (G.mode === 'sandbox') return [{ t: 'gate', n: 2 }, { t: 'gate', n: 3 }, { t: 'gate', n: 5 }, { t: 'gate', n: 10 }, { t: 'wall' }, { t: 'bump' }, { t: 'peg' }];
    var seen = {}, out = [];
    G.L.inv.forEach(function (d) { var k = invKey(d); if (!seen[k]) { seen[k] = 1; out.push({ t: d.t, n: d.n }); } });
    return out;
  }
  function chipInner(d) {
    if (d.t === 'gate') return '<div class="gate" style="color:' + PAL[S.GATE_COL[d.n]] + '">x' + d.n + '</div>';
    return '<div class="' + d.t + '"></div>';
  }
  function buildTray() {
    var inv = $('inv'); inv.innerHTML = '';
    trayTypes().forEach(function (d) {
      var b = document.createElement('div'); b.className = 'chip'; b.dataset.t = d.t; if (d.n) b.dataset.n = d.n;
      b.setAttribute('role', 'button'); b.setAttribute('aria-label', d.t === 'gate' ? 'x' + d.n + ' gate' : d.t === 'bump' ? 'bumper' : d.t);
      b.innerHTML = chipInner(d) + '<span class="cnt"></span>';
      b.addEventListener('pointerdown', function (e) { trayDown(e, d); });
      inv.appendChild(b);
    });
    if (G.mode === 'sandbox') {
      var t = document.createElement('div'); t.className = 'chip toggle' + (G.recycle ? ' on' : ''); t.id = 'tRecycle'; t.setAttribute('role', 'button');
      t.textContent = 'Recycle'; t.addEventListener('click', function () { G.recycle = !G.recycle; if (G.sim) G.sim.recycle = G.recycle; t.classList.toggle('on', G.recycle); });
      inv.appendChild(t);
    }
    refreshTray();
  }
  function refreshTray() {
    if (G.placed.length && G.mode === 'level') showTip('');
    var chips = $('inv').querySelectorAll('.chip[data-t]');
    for (var i = 0; i < chips.length; i++) {
      var c = chips[i], key = c.dataset.t === 'gate' ? 'gate' + c.dataset.n : c.dataset.t, left = invLeft(key);
      c.querySelector('.cnt').textContent = left === Infinity ? '∞' : left;
      c.classList.toggle('empty', left <= 0);
    }
    var drop = $('bDrop');
    if (G.mode === 'sandbox') { drop.textContent = 'DROP'; drop.classList.remove('stop'); }
    else if (G.phase === 'edit') { drop.textContent = 'DROP'; drop.classList.remove('stop'); }
    else { drop.textContent = 'STOP'; drop.classList.add('stop'); }
  }

  /* ---------------- HUD ---------------- */
  var hudCount = -1;
  function curCount() { return G.sim ? G.sim.count : 1; }
  function updateHud(force) {
    var c = curCount();
    if (c === hudCount && !force) return;
    var prev = hudCount; hudCount = c;
    $('cnt').textContent = fmt(c);
    $('from').textContent = c > 1 ? (G.sim && G.sim.drops > 1 ? fmt(G.sim.drops) + ' →' : '1 →') : '';
    if (prev > 0 && Math.floor(Math.log10(Math.max(1, c))) > Math.floor(Math.log10(Math.max(1, prev))) && c >= 10) {
      var n = $('num'); n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
      if (G.attract === null && Snd.gate('mile', 250)) { var b = 7 + Math.min(5, Math.floor(Math.log10(c))); Snd.play('bell', b, 0.35); Snd.play('bell', b + 2, 0.3, 0.07); Snd.play('bell', b + 4, 0.3, 0.14); }
    }
    var sub = $('sub'), hud = $('hud');
    if (G.mode === 'level') {
      var st = G.L.stars, got = 0; for (var i = 0; i < 3; i++) if (c >= st[i]) got++;
      sub.innerHTML = 'TARGET ' + fmt(st[0]) + ' <span class="stars">' + [0, 1, 2].map(function (k) { return '<i class="' + (k < got ? 'on' : '') + '"></i>'; }).join('') + '</span>';
      hud.classList.toggle('win', got > 0 && G.phase !== 'edit');
    } else if (G.mode === 'sandbox') {
      sub.textContent = 'SANDBOX · ' + fmt(G.sim ? G.sim.n : 0) + ' ON SCREEN';
      hud.classList.remove('win');
    } else { sub.textContent = ''; hud.classList.remove('win'); }
  }

  /* ---------------- run / result ---------------- */
  function drop() {
    Snd.init();
    if (G.mode === 'sandbox') {
      if (!G.sim) return;
      if (!G.sim.drop(W / 2 + (Math.random() - 0.5) * 6, 200, 0, 0)) toast('Too many balls on screen');
      showTip(''); return;
    }
    if (G.phase !== 'edit') { stopRun(); return; }
    G.sim = new S.Sim(allItems(), { alloc: 20000, seed: G.L.seed || 7 });
    G.sim.drop(G.L.drop.x, G.L.drop.y, 0, 0);
    G.phase = 'run'; G.acc = 0; G.sel = null; G.hint = false; $('bHint').classList.remove('on');
    showTip(''); refreshTray(); updateHud(true);
    Snd.play('mar', 9, 0.25);
  }
  function stopRun() {
    G.sim = null; G.phase = 'edit'; $('result').hidden = true;
    G.allItemsReset();
    refreshTray(); updateHud(true);
  }
  G.allItemsReset = function () { allItems().forEach(function (it) { it.flash = 0; it.hits = 0; S.pose(it, 0); }); };

  function finish() {
    G.phase = 'result';
    var c = G.sim.count, st = G.L.stars, got = 0; for (var i = 0; i < 3; i++) if (c >= st[i]) got++;
    var i0 = G.li, prevStars = starsOf(i0), newBest = c > (save.best[i0] || 0);
    if (got > prevStars) save.stars[i0] = got;
    if (newBest) save.best[i0] = c;
    persist();
    G.lastResult = { count: c, stars: got, level: i0 };
    setTimeout(function () {
      if (G.phase !== 'result') return;
      var card = $('rcard'); card.classList.toggle('win', got > 0);
      var ss = $('rstars').children; for (var k = 0; k < 3; k++) ss[k].classList.remove('on');
      $('rnum').textContent = fmt(c);
      $('rlab').textContent = got > 0 ? (got === 3 ? 'Perfect! ' : '') + 'Balls from 1 ball' + (newBest && prevStars ? ' · new best' : '') + (got < 3 ? ' · 3 stars at ' + fmt(st[2]) : '') : 'Target ' + fmt(st[0]) + '. Move things and try again!';
      $('bNext').disabled = !(got > 0 || starsOf(i0) > 0) || i0 >= LEVELS.length - 1;
      $('bNext').textContent = i0 >= LEVELS.length - 1 ? 'Done!' : 'Next';
      $('result').hidden = false;
      for (var s2 = 0; s2 < got; s2++) (function (s3) {
        setTimeout(function () { ss[s3].classList.add('on'); Snd.play('bell', 7 + s3 * 2, 0.4); }, 250 + s3 * 260);
      })(s2);
      if (!got) Snd.play('mar', 2, 0.3);
    }, 450);
  }

  /* ---------------- input ---------------- */
  var drag = null;
  function toWorld(cx, cy) { var r = stage.getBoundingClientRect(); return { x: (cx - r.left - view.ox) / view.s, y: (cy - r.top - view.oy) / view.s }; }
  function editable() { return G.mode === 'sandbox' || (G.mode === 'level' && G.phase === 'edit'); }
  function hitItem(p) {
    var tol = 22 / view.s, best = null, bd = 1e9;
    for (var i = G.placed.length - 1; i >= 0; i--) {
      var it = G.placed[i], c = S.capsule(it);
      var d = Math.sqrt(segPt2(c.ax, c.ay, c.bx, c.by, p.x, p.y)) - c.r;
      if (d < tol && d < bd) { bd = d; best = it; }
    }
    return best;
  }
  function segPt2(ax, ay, bx, by, px, py) {
    var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t; var x = ax + dx * t - px, y = ay + dy * t - py; return x * x + y * y;
  }
  function overTray(cy) { var r = $('tray').getBoundingClientRect(); return cy >= r.top - 4; }
  function placeAt(it, x, y) {
    var s = S.snap(it.t, x, y, zones());
    if (s && s.d < 110) { it.x = s.x; it.y = s.y; } else { it.x = x; it.y = y; }
    it.ok = !!s && s.d < 110 && S.fits(it, allItems(), zones(), dropPt());
  }

  stage.addEventListener('pointerdown', function (e) {
    Snd.init();
    if (!editable() || !$('menu').hidden || !$('levels').hidden) return;
    var p = toWorld(e.clientX, e.clientY), it = hitItem(p);
    if (!it) { G.sel = null; return; }
    e.preventDefault();
    G.sel = it;
    drag = { it: it, isNew: false, ox: it.x - p.x, oy: it.y - p.y, sx: e.clientX, sy: e.clientY, t0: performance.now(), moved: false, px: it.x, py: it.y, pid: e.pointerId, touch: e.pointerType === 'touch' };
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  function trayDown(e, d) {
    Snd.init();
    if (!editable()) return;
    if (invLeft(invKey(d)) <= 0) { toast('None left'); return; }
    if (G.mode === 'sandbox' && G.placed.length >= 40) { toast('Sandbox is full (40 pieces)'); return; }
    if (G.mode === 'sandbox' && d.t === 'gate' && G.placed.filter(function (x) { return x.t === 'gate'; }).length >= 30) { toast('30 gates max'); return; }
    e.preventDefault();
    var it = S.makeItem({ t: d.t, n: d.n, x: -999, y: -999, a: 0 }, false);
    drag = { it: it, isNew: true, ox: 0, oy: e.pointerType === 'touch' ? -70 : 0, sx: e.clientX, sy: e.clientY, t0: performance.now(), moved: false, pid: e.pointerId, touch: e.pointerType === 'touch' };
    try { e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
    if (!drag.moved) return;
    e.preventDefault();
    var p = toWorld(e.clientX, e.clientY), it = drag.it;
    drag.over = overTray(e.clientY);
    if (drag.isNew && G.placed.indexOf(it) < 0) { drag.live = true; }
    placeAt(it, p.x + drag.ox, p.y + drag.oy);
  }, { passive: false });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    var d = drag; drag = null; var it = d.it;
    if (!d.moved) {
      if (d.isNew) autoPlace(it);
      else if (performance.now() - d.t0 < 450) rotate(it, 15);
      return;
    }
    var idx = G.placed.indexOf(it);
    if (d.over) {
      if (idx >= 0) { G.placed.splice(idx, 1); Snd.play('mar', 3, 0.2); }
      G.sel = null;
    } else if (!it.ok) {
      if (d.isNew) { toast("Can't go there"); }
      else { it.x = d.px; it.y = d.py; it.ok = true; toast("Can't go there"); }
    } else {
      if (idx < 0) G.placed.push(it);
      G.sel = it; Snd.play('mar', 8, 0.2);
    }
    syncSandboxItems(); refreshTray();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', function (e) { if (drag && drag.isNew) drag.over = true; endDrag(e); });

  function rotate(it, deg) {
    if (it.t !== 'gate' && it.t !== 'wall') return;
    var a0 = it.a;
    for (var k = 1; k <= 23; k++) {
      it.a = ((a0 + deg * k) % 180 + 180) % 180;
      if (S.fits(it, allItems(), zones(), dropPt())) { Snd.play('mar', 6, 0.15); syncSandboxItems(); return; }
    }
    it.a = a0; toast('No room to turn');
  }
  function autoPlace(it) {
    var dp = dropPt(), zs = zones() || S.DEFAULT_ZONES, cands = [];
    for (var y = 280; y <= 1240; y += 30) for (var x = 60; x <= 660; x += 30) cands.push([x, y]);
    zs.forEach(function (z) { if (z.y0 === z.y1) for (var x2 = z.x0; x2 <= z.x1; x2 += 15) cands.push([x2, z.y0]); });
    cands.sort(function (a, b) { return Math.hypot(a[0] - dp.x, (a[1] - 560) * 0.6) - Math.hypot(b[0] - dp.x, (b[1] - 560) * 0.6); });
    for (var i = 0; i < cands.length; i++) {
      it.x = cands[i][0]; it.y = cands[i][1];
      var s = S.snap(it.t, it.x, it.y, zones()); if (!s || s.d > 0.5) continue;
      if (S.fits(it, allItems(), zones(), dp)) { it.ok = true; G.placed.push(it); G.sel = it; Snd.play('mar', 8, 0.2); syncSandboxItems(); refreshTray(); return; }
    }
    toast('No room left');
  }
  stage.addEventListener('wheel', function (e) {
    if (!editable()) return;
    var it = hitItem(toWorld(e.clientX, e.clientY)); if (!it) return;
    e.preventDefault(); rotate(it, e.deltaY > 0 ? 15 : -15);
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === ' ' && G.mode !== 'menu' && $('levels').hidden && $('modal').hidden) { e.preventDefault(); if (G.phase === 'result') return; drop(); }
    if (!G.sel || !editable()) return;
    if (e.key === 'r' || e.key === 'R') rotate(G.sel, 15);
    if (e.key === 'Delete' || e.key === 'Backspace') { var i = G.placed.indexOf(G.sel); if (i >= 0) G.placed.splice(i, 1); G.sel = null; syncSandboxItems(); refreshTray(); }
  });

  /* ---------------- buttons ---------------- */
  $('bDrop').addEventListener('click', drop);
  $('bClear').addEventListener('click', function () {
    Snd.init();
    if (G.mode === 'sandbox') {
      if (G.sim && G.sim.n) { G.sim = new S.Sim(allItems(), { alloc: 14000, cap: G.sim.cap, recycle: G.recycle, seed: (Math.random() * 1e9) | 0, tmax: 1e9 }); toast('Balls cleared. Press again to clear pieces.'); }
      else { G.placed = []; syncSandboxItems(); toast('Pieces cleared'); }
      refreshTray(); updateHud(true); return;
    }
    if (G.phase !== 'edit') stopRun();
    G.placed = []; G.sel = null; refreshTray();
  });
  $('bHint').addEventListener('click', function () { G.hint = !G.hint; this.classList.toggle('on', G.hint); if (G.hint) toast('Ghosts show one good layout'); });
  $('bMute').addEventListener('click', function () {
    Snd.init(); Snd.setMuted(!Snd.muted); save.muted = Snd.muted; persist(); muteIcon();
  });
  function muteIcon() { $('sndOn').style.display = Snd.muted ? 'none' : ''; $('sndOff').style.display = Snd.muted ? '' : 'none'; $('bMute').setAttribute('aria-pressed', String(Snd.muted)); }
  function nextUnplayed() { for (var i = 0; i < LEVELS.length; i++) if (!starsOf(i)) return i; return LEVELS.length - 1; }
  $('bPlay').addEventListener('click', function () { Snd.init(); loadLevel(nextUnplayed()); });
  $('bMenuLevels').addEventListener('click', function () { Snd.init(); openLevels(); });
  $('bMenuSand').addEventListener('click', function () { Snd.init(); loadSandbox(); });
  $('bLevels').addEventListener('click', function () { Snd.init(); openLevels(); });
  $('bLvClose').addEventListener('click', function () { $('levels').hidden = true; if (G.mode === 'menu') $('menu').hidden = false; else if (G.mode === 'level' && G.phase === 'result') $('result').hidden = false; });
  $('bRetry').addEventListener('click', function () { stopRun(); });
  $('bNext').addEventListener('click', function () { if (G.li < LEVELS.length - 1) loadLevel(G.li + 1); });
  $('bShare').addEventListener('click', function () { openCard(); });

  function openLevels() {
    var grid = $('grid'); grid.innerHTML = '';
    var tot = 0;
    LEVELS.forEach(function (L, i) {
      tot += starsOf(i);
      var b = document.createElement('button'), un = unlocked(i), st = starsOf(i);
      b.className = 'tile' + (un ? '' : ' locked') + (G.mode === 'level' && G.li === i ? ' cur' : '');
      b.innerHTML = '<b>' + (i + 1) + '</b><span class="st">' + [0, 1, 2].map(function (k) { return '<i class="' + (k < st ? 'on' : '') + '"></i>'; }).join('') + '</span><small>' + (save.best[i] ? fmt(save.best[i]) : esc(L.name)) + '</small>';
      b.setAttribute('aria-label', 'Level ' + (i + 1) + ': ' + L.name + (un ? ', ' + st + ' stars' : ', locked'));
      b.addEventListener('click', function () { if (!un) { toast('Get a star on level ' + i + ' first'); return; } loadLevel(i); });
      grid.appendChild(b);
    });
    var sb = document.createElement('button'); sb.className = 'tile sand'; sb.textContent = 'Sandbox: build anything';
    sb.addEventListener('click', loadSandbox); grid.appendChild(sb);
    $('tot').textContent = tot + ' / ' + LEVELS.length * 3 + ' stars';
    $('levels').hidden = false; $('menu').hidden = true; $('result').hidden = true;
  }

  /* ---------------- share card ---------------- */
  function drawStar(c, x, y, r, on) {
    c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = on ? '#ffcc33' : '#2e3039'; c.fill();
  }
  function makeCard() {
    var r = G.lastResult || { count: curCount(), stars: 0, level: G.li };
    var sand = G.mode === 'sandbox';
    if (sand) r = { count: curCount(), drops: G.sim ? G.sim.drops : 1 };
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1350; var x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 1080, 1350);
    if (!sprites) makeSprites();
    var seed = 12345; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i < 520; i++) {
      var t = rnd(), ang = Math.PI / 2 + (rnd() - 0.5) * 1.6 * t, dist = 60 + t * 520;
      var bx = 540 + Math.cos(ang) * dist * 1.3, by = 120 + Math.sin(ang) * dist * 0.62, s = 26 + rnd() * 10;
      x.globalAlpha = 0.5 + 0.5 * rnd(); x.drawImage(sprites[1 + (rnd() * 6 | 0)], bx - s / 2, by - s / 2, s, s);
    }
    x.globalAlpha = 1;
    var grd = x.createLinearGradient(0, 300, 0, 700); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = grd; x.fillRect(0, 300, 1080, 400); x.fillStyle = '#000'; x.fillRect(0, 700, 1080, 650);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#b8bac7'; x.font = '700 34px InterB, system-ui, sans-serif';
    x.fillText('B U M P   T H E O R Y', 540, 90);
    x.fillStyle = '#f4f4f7'; x.font = '700 56px InterB, system-ui, sans-serif';
    x.fillText(sand ? 'I made' : 'I got', 540, 600);
    var num = fmt(r.count), fs = 230;
    x.font = '700 ' + fs + 'px InterB, system-ui, sans-serif';
    while (x.measureText(num).width > 980 && fs > 60) { fs -= 8; x.font = '700 ' + fs + 'px InterB, system-ui, sans-serif'; }
    x.shadowColor = 'rgba(255,190,60,.55)'; x.shadowBlur = 40; x.fillStyle = '#ffcc33'; x.fillText(num, 540, 600 + fs * 0.95); x.shadowBlur = 0;
    var yb = 600 + fs * 0.95 + 80;
    x.fillStyle = '#f4f4f7'; x.font = '700 56px InterB, system-ui, sans-serif';
    x.fillText(sand ? 'balls from ' + fmt(r.drops) + (r.drops === 1 ? ' ball!' : ' balls!') : 'balls from 1 ball!', 540, yb);
    if (!sand) {
      x.fillStyle = '#b8bac7'; x.font = '700 40px InterB, system-ui, sans-serif';
      x.fillText('Level ' + (r.level + 1) + ' · ' + LEVELS[r.level].name, 540, yb + 80);
      for (var s2 = 0; s2 < 3; s2++) drawStar(x, 540 + (s2 - 1) * 96, yb + 160, 40, s2 < r.stars);
    } else { x.fillStyle = '#b8bac7'; x.font = '700 40px InterB, system-ui, sans-serif'; x.fillText('Sandbox mode', 540, yb + 80); }
    x.fillStyle = '#f4f4f7'; x.font = '700 50px InterB, system-ui, sans-serif'; x.fillText('Can you beat it?', 540, 1200);
    x.fillStyle = '#33d9ff'; x.font = '700 40px InterB, system-ui, sans-serif'; x.fillText('saagarverma.com/bump-theory', 540, 1270);
    return { canvas: c, r: r, sand: sand };
  }
  var cardBlob = null, cardUrl = null;
  function shareText(m) {
    var u = shareUrl(m);
    return m.sand ? 'I made ' + fmt(m.r.count) + ' balls in the Bump Theory sandbox. ' + u : 'I got ' + fmt(m.r.count) + ' balls from 1 ball on Bump Theory level ' + (m.r.level + 1) + '! Can you beat it? ' + u;
  }
  function shareUrl(m) { return m.sand ? URL_BASE : URL_BASE + '?level=' + (m.r.level + 1); }
  var lastCard = null;
  function openCard() {
    var go = function () {
      lastCard = makeCard();
      if (cardUrl) { try { URL.revokeObjectURL(cardUrl); } catch (e) { /* ignore */ } cardUrl = null; }
      var img = $('cardImg');
      lastCard.canvas.toBlob(function (b) {
        cardBlob = b;
        if (b) { cardUrl = URL.createObjectURL(b); img.src = cardUrl; $('mSave').href = cardUrl; }
        else { img.src = lastCard.canvas.toDataURL('image/png'); $('mSave').href = img.src; }
        $('modal').hidden = false;
      }, 'image/png');
    };
    if (document.fonts && document.fonts.load) document.fonts.load('700 40px InterB').then(go, go); else go();
  }
  $('mClose').addEventListener('click', function () { $('modal').hidden = true; });
  $('mShare').addEventListener('click', function () {
    if (!lastCard) return;
    var text = shareText(lastCard), url = shareUrl(lastCard);
    try {
      if (cardBlob && window.File && navigator.canShare) {
        var f = new File([cardBlob], 'bump-theory.png', { type: 'image/png' });
        if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], text: text }).catch(function () {}); return; }
      }
      if (navigator.share) { navigator.share({ title: '1 Ball → 10,000', text: text, url: url }).catch(function () {}); return; }
    } catch (e) { /* fall through */ }
    copy(text);
  });
  $('mCopy').addEventListener('click', function () { if (lastCard) copy(shareText(lastCard)); });
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied'); }, function () { toast(t); });
    else toast(t);
  }

  /* ---------------- drawing the board ---------------- */
  function rgba(hex, a) { return 'rgba(' + parseInt(hex.substr(1, 2), 16) + ',' + parseInt(hex.substr(3, 2), 16) + ',' + parseInt(hex.substr(5, 2), 16) + ',' + a + ')'; }
  function drawItem(c, it, ghost) {
    var col, f = it.flash || 0;
    c.save();
    if (ghost) c.globalAlpha = 0.45;
    if (it.t === 'gate') {
      col = PAL[S.GATE_COL[it.n] || 1];
      c.translate(it.cx, it.cy); c.rotate(Math.atan2(it.uy, it.ux));
      var hl = it.hl, th = 22;
      c.fillStyle = rgba(col, 0.14 + f * 0.4);
      rr(c, -hl, -th / 2, hl * 2, th, th / 2); c.fill();
      c.lineWidth = 3; c.strokeStyle = col; if (it.fixed) c.setLineDash([10, 7]); if (ghost) c.setLineDash([6, 6]);
      c.shadowColor = col; c.shadowBlur = ghost ? 0 : 10 + f * 22; c.stroke(); c.setLineDash([]);
      c.shadowBlur = 0; c.fillStyle = col;
      c.beginPath(); c.arc(-hl, 0, 5, 0, 7); c.arc(hl, 0, 5, 0, 7); c.fill();
      c.setTransform(1, 0, 0, 1, 0, 0); c.restore(); c.save(); if (ghost) c.globalAlpha = 0.5; setWorld(c);
      var fs = 28 + f * 6;
      c.font = '700 ' + fs + 'px InterB, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText('x' + it.n, it.cx, it.cy + 1);
      c.fillStyle = f > 0.5 ? '#fff' : col; c.fillText('x' + it.n, it.cx, it.cy + 1);
    } else if (it.t === 'wall') {
      var ax = it.cx - it.ux * it.hl, ay = it.cy - it.uy * it.hl, bx = it.cx + it.ux * it.hl, by = it.cy + it.uy * it.hl;
      c.lineCap = 'round'; c.lineWidth = S.WALL_T * 2;
      c.strokeStyle = it.fixed ? '#8d90a0' : '#eef0f8'; if (ghost) { c.setLineDash([10, 10]); c.lineWidth = 6; c.strokeStyle = '#eef0f8'; }
      if (!it.fixed && !ghost) { c.shadowColor = 'rgba(200,220,255,.5)'; c.shadowBlur = 8; }
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
    } else if (it.t === 'peg') {
      c.fillStyle = it.fixed ? '#a9acbb' : '#e6e8f2'; c.beginPath(); c.arc(it.cx, it.cy, it.r, 0, 7); c.fill();
    } else if (it.t === 'bump') {
      col = '#ff8c2e';
      c.fillStyle = rgba(col, 0.12 + f * 0.5); c.beginPath(); c.arc(it.cx, it.cy, it.r * (1 + f * 0.12), 0, 7); c.fill();
      c.lineWidth = 5; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = ghost ? 0 : 12 + f * 20; if (ghost) c.setLineDash([6, 6]); c.stroke(); c.setLineDash([]);
      c.shadowBlur = 0; c.beginPath(); c.arc(it.cx, it.cy, it.r * 0.45, 0, 7); c.fillStyle = col; c.fill();
    } else if (it.t === 'lava') {
      var x0 = it.cx - it.w / 2, y0 = it.cy - it.h / 2;
      c.shadowColor = '#ff3b1f'; c.shadowBlur = 18 + f * 18; c.fillStyle = '#c4220f'; rr(c, x0, y0, it.w, it.h, Math.min(10, it.h / 2)); c.fill();
      c.shadowBlur = 0; c.save(); rr(c, x0, y0, it.w, it.h, Math.min(10, it.h / 2)); c.clip();
      c.strokeStyle = 'rgba(255,170,60,.55)'; c.lineWidth = 8; var off = (G.clock * 30) % 40;
      for (var sx = x0 - it.h - 40 + off; sx < x0 + it.w + 40; sx += 40) { c.beginPath(); c.moveTo(sx, y0 + it.h); c.lineTo(sx + it.h, y0); c.stroke(); }
      c.restore();
    }
    c.restore();
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function setWorld(c) { var k = view.dpr * view.s; c.setTransform(k, 0, 0, k, view.dpr * view.ox, view.dpr * view.oy); }

  function drawBoard() {
    var c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    setWorld(c);
    c.fillStyle = '#050508'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1b1c26'; c.lineWidth = 2; c.strokeRect(1, 1, W - 2, H - 2);
    var edit = editable() && G.mode === 'level' && G.phase === 'edit';
    // zones
    if ((edit || (drag && G.mode === 'level')) && G.L) {
      var zs = G.L.zones;
      if (zs) zs.forEach(function (z) {
        var hot = drag && (!z.t || z.t === drag.it.t || (Array.isArray(z.t) && z.t.indexOf(drag.it.t) >= 0));
        if (z.y0 === z.y1) {
          c.strokeStyle = hot ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.setLineDash([4, 10]);
          c.beginPath(); c.moveTo(z.x0 - 70, z.y0); c.lineTo(z.x1 + 70, z.y0); c.stroke(); c.setLineDash([]);
        } else {
          c.fillStyle = hot ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.025)'; c.fillRect(z.x0 - 10, z.y0 - 10, z.x1 - z.x0 + 20, z.y1 - z.y0 + 20);
          c.strokeStyle = hot ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.08)'; c.lineWidth = 2; c.setLineDash([6, 8]);
          c.strokeRect(z.x0 - 10, z.y0 - 10, z.x1 - z.x0 + 20, z.y1 - z.y0 + 20); c.setLineDash([]);
        }
      });
    }
    if (G.mode === 'level' ? G.phase === 'edit' : true) for (var pi = 0; pi < G.placed.length; pi++) S.pose(G.placed[pi], 0);
    var items = allItems();
    // moving paths
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.move) { c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(it.x - (it.move.ax || 0), it.y - (it.move.ay || 0)); c.lineTo(it.x + (it.move.ax || 0), it.y + (it.move.ay || 0)); c.stroke(); }
      if (it.spin) { c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2; c.beginPath(); c.arc(it.x, it.y, it.len / 2, 0, 7); c.stroke(); }
    }
    var order = ['lava', 'peg', 'wall', 'bump', 'gate'];
    for (var o = 0; o < order.length; o++) for (var j = 0; j < items.length; j++) if (items[j].t === order[o]) drawItem(c, items[j]);
    // selection
    if (G.sel && editable() && G.placed.indexOf(G.sel) >= 0) {
      var cs = S.capsule(G.sel); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.setLineDash([5, 6]);
      c.lineCap = 'round'; c.beginPath();
      if (cs.ax === cs.bx && cs.ay === cs.by) c.arc(cs.ax, cs.ay, cs.r + 10, 0, 7);
      else { c.lineWidth = (cs.r + 10) * 2; c.strokeStyle = 'rgba(255,255,255,.07)'; c.moveTo(cs.ax, cs.ay); c.lineTo(cs.bx, cs.by); }
      c.stroke(); c.setLineDash([]);
    }
    // hint ghosts
    if (G.hint && G.L && G.L.sol) G.L.sol.forEach(function (d) { var g = S.makeItem(d, false); S.pose(g, 0); drawItem(c, g, true); });
    // dragged piece
    if (drag && drag.moved && (drag.live || !drag.isNew)) {
      var dit = drag.it; S.pose(dit, 0);
      if (drag.isNew || G.placed.indexOf(dit) < 0) drawItem(c, dit);
      if (!dit.ok || drag.over) {
        var cc = S.capsule(dit); c.strokeStyle = drag.over ? 'rgba(255,255,255,.35)' : 'rgba(255,60,60,.8)'; c.lineWidth = 3; c.setLineDash([6, 6]);
        c.beginPath(); if (cc.ax === cc.bx && cc.ay === cc.by) c.arc(cc.ax, cc.ay, cc.r + 6, 0, 7); else { c.moveTo(cc.ax, cc.ay); c.lineTo(cc.bx, cc.by); c.lineWidth = (cc.r + 4) * 2; c.strokeStyle = drag.over ? 'rgba(255,255,255,.12)' : 'rgba(255,60,60,.28)'; }
        c.stroke(); c.setLineDash([]);
      }
    }
    // dropper
    var dp = dropPt();
    c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(dp.x - 26, dp.y - 34); c.lineTo(dp.x + 26, dp.y - 34); c.lineTo(dp.x + 9, dp.y - 12); c.lineTo(dp.x - 9, dp.y - 12); c.closePath(); c.fill();
    if ((G.mode === 'level' && G.phase === 'edit') || (G.mode === 'sandbox' && (!G.sim || !G.sim.n))) {
      var pulse = 1 + 0.12 * Math.sin(G.clock * 5);
      c.shadowColor = '#fff'; c.shadowBlur = 16; c.fillStyle = '#fff'; c.beginPath(); c.arc(dp.x, dp.y, R * pulse, 0, 7); c.fill(); c.shadowBlur = 0;
    }
    // bursts
    for (var b = G.bursts.length - 1; b >= 0; b--) {
      var u = G.bursts[b]; u.t += 1 / 60;
      if (u.t > 0.4) { G.bursts.splice(b, 1); continue; }
      c.strokeStyle = rgba(u.col, 1 - u.t / 0.4); c.lineWidth = 3; c.beginPath(); c.arc(u.x, u.y, 8 + u.t * 90, 0, 7); c.stroke();
    }
  }

  /* ---------------- events from the sim -> sound + flashes ---------------- */
  function drainEvents(sim, silent) {
    var n = sim.evN; sim.evN = 0;
    if (silent || !Snd.ready) { for (var q = 0; q < n; q++) if (sim.evK[q] === 1 && G.bursts.length < 24) G.bursts.push({ x: sim.evX[q], y: sim.evY[q], t: 0, col: PAL[S.GATE_COL[sim.evS[q]] || 1] }); return; }
    var bounces = 0;
    for (var i = 0; i < n; i++) {
      var k = sim.evK[i], x = sim.evX[i], s = sim.evS[i];
      if (k === 1) {
        if (G.bursts.length < 24) G.bursts.push({ x: x, y: sim.evY[i], t: 0, col: PAL[S.GATE_COL[s] || 1] });
        if (Snd.gate('mult', 55)) { var idx = { 2: 5, 3: 6, 4: 7, 5: 8, 10: 10 }[s] || 6; Snd.play('bell', idx, 0.24); if (Snd.gate('mult2', 140)) Snd.play('bell', idx + 2, 0.16, 0.06); }
      } else if (k === 0 || k === 2) {
        if (bounces < 2 && Snd.gate('b', 38)) { bounces++; Snd.play('mar', 3 + Math.floor(x / W * 10), Math.min(0.42, 0.08 + s / 2000)); }
      } else if (k === 3) {
        if (Snd.gate('bump', 70)) { Snd.play('bell', 4, 0.22); Snd.play('mar', 9, 0.18); }
      } else if (k === 4) {
        if (Snd.gate('lava', 120)) Snd.play('thud', 0, 0.5);
      }
    }
  }

  /* ---------------- attract mode behind the menu ---------------- */
  function startAttract() {
    var L = LEVELS[22] || LEVELS[LEVELS.length - 1];
    G.fixed = L.fixed.map(function (d) { return S.makeItem(d, true); });
    G.placed = L.sol.map(function (d) { return S.makeItem(d, false); });
    G.L = L;
    G.attract = new S.Sim(allItems(), { alloc: 20000, seed: 7 });
    G.attract.drop(L.drop.x, L.drop.y, 0, 0); G.attractWait = 0;
    G.sim = G.attract;
  }

  /* ---------------- main loop ---------------- */
  var last = 0, raf = 0, fpsT = 0, fpsN = 0, fps = 60, lowT = 0, highT = 0, frameMs = 16.7;
  G.clock = 0;
  var stats = { fps: 60, frames: 0, maxBalls: 0, samples: [] };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now;
    G.clock += dt;
    fpsN++; fpsT += dt;
    if (fpsT >= 0.5) {
      fps = fpsN / fpsT; fpsN = 0; fpsT = 0; stats.fps = fps; stats.samples.push({ fps: fps, n: G.sim ? G.sim.n : 0 }); if (stats.samples.length > 120) stats.samples.shift();
      adapt(0.5);
      if (showFps) $('fps').textContent = fps.toFixed(0) + ' fps · ' + (G.sim ? G.sim.n : 0) + ' balls · q' + quality;
    }
    var sim = G.sim, alpha = 1;
    var running = sim && ((G.mode === 'level' && G.phase === 'run') || G.mode === 'sandbox' || (G.attract && sim === G.attract));
    if (running) {
      G.acc += dt; var steps = 0;
      while (G.acc >= DT && steps < 5) { sim.step(); G.acc -= DT; steps++; }
      if (steps === 5) G.acc = 0;
      alpha = G.acc / DT;
      drainEvents(sim, !!G.attract);
      if (G.attract && sim === G.attract && sim.done()) { G.attractWait += dt; if (G.attractWait > 1.2) startAttract(); }
      if (G.mode === 'level' && G.phase === 'run' && sim.done()) finish();
      if (sim.n > stats.maxBalls) stats.maxBalls = sim.n;
    } else if (G.mode === 'level' && G.phase === 'edit') {
      G.previewT += dt; G.fixed.forEach(function (it) { if (it.move || it.spin) S.pose(it, G.previewT); });
    }
    var items = allItems();
    for (var i = 0; i < items.length; i++) if (items[i].flash) items[i].flash = Math.max(0, items[i].flash - dt * 4);
    drawBoard();
    drawBalls(sim, alpha);
    updateHud(false);
    stats.frames++;
  }
  function adapt(span) {
    if (fps < 46) { lowT += span; highT = 0; } else if (fps > 57) { highT += span; lowT = 0; } else { lowT = 0; highT = 0; }
    if (lowT >= 1.5 && quality > 0) { quality--; lowT = 0; layout(); }
    if (highT >= 5 && quality < qMax) { quality++; highT = 0; layout(); }
    if (G.mode === 'sandbox' && G.sim) {
      if (lowT >= 1 && G.sim.cap > 3000 && quality === 0) G.sim.cap = Math.max(3000, Math.floor(G.sim.cap * 0.8));
      else if (highT >= 3 && G.sim.cap < G.sim.alloc) G.sim.cap = Math.min(G.sim.alloc, G.sim.cap + 1000);
    }
  }
  var showFps = qs.has('fps');
  if (showFps) $('fps').style.display = 'block';

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; if (Snd.ctx && Snd.ctx.state === 'running') Snd.ctx.suspend(); }
    else { last = 0; if (!raf) raf = requestAnimationFrame(frame); if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume(); }
  });
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);

  /* ---------------- boot ---------------- */
  initGL(); layout(); muteIcon();
  if (save.stars.some(function (s) { return s > 0; })) $('playLab').textContent = 'Continue';
  var ql = parseInt(qs.get('level'), 10);
  if (ql >= 1 && ql <= LEVELS.length) loadLevel(ql - 1);
  else if (qs.has('sandbox')) loadSandbox();
  else { startAttract(); $('tray').style.visibility = 'hidden'; showTip(''); }
  raf = requestAnimationFrame(frame);

  /* test + debug hooks (used by the automated checks) */
  window.__bt = {
    G: G, stats: stats, levels: LEVELS, quality: function () { return quality; }, gl: function () { return !!gl; },
    audio: function () { return Snd.ctx ? Snd.ctx.state : 'none'; },
    loadLevel: loadLevel, loadSandbox: loadSandbox, drop: drop, openLevels: openLevels, openCard: openCard,
    placeSolution: function () { G.placed = G.L.sol.map(function (d) { var it = S.makeItem(d, false); it.ok = true; return it; }); refreshTray(); },
    stress: function (n) {
      loadSandbox(); G.recycle = true; G.sim.recycle = true;
      G.placed = [{ t: 'bump', x: 200, y: 700 }, { t: 'bump', x: 520, y: 700 }, { t: 'wall', x: 360, y: 950, a: 20 }, { t: 'peg', x: 360, y: 500 }].map(function (d) { return S.makeItem(d, false); });
      syncSandboxItems();
      for (var i = 0; i < n; i++) { G.sim.add(30 + Math.random() * 660, 30 + Math.random() * 1200, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600, 1, 0, 1 + (i % 6)); G.sim.count++; }
      G.sim.drops = 1;
    }
  };
})();
