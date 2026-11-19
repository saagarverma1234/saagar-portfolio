/* Quiet Worlds: the world fills the screen and the traveller lives in it. A full-screen portrait picture rendered from
   the episodes' own 3D scenes (img/full/*.webp, 1080x1920), a slow camera drift, a little ambient life, and a 2D canvas
   on top where the same traveller as the videos (sprite frames from the episodes' 3D model) walks, sweeps, digs, knocks,
   sits, sleeps... for each choice, and the world answers (sand, snow, light, a hole in the ground). No WebGL; if anything
   fails, the picture stays and the choices answer at once. */
(function () {
  'use strict';
  var STAGE = window.QW_STAGE || {}, AT = window.QW_ATLAS;
  var IW = 1080, IH = 1920, FIG = AT ? AT.fig || 146 : 146;   // picture size; traveller body height inside a sprite frame (px)
  var V_ = '3';
  var atlas = null, atlasOk = false, atlasWait = [];
  function loadAtlas(cb) {
    if (atlasOk) return cb(true);
    atlasWait.push(cb);
    if (atlas) return;
    atlas = new Image(); atlas.decoding = 'async';
    atlas.onload = function () { atlasOk = true; atlasWait.splice(0).forEach(function (f) { f(true); }); };
    atlas.onerror = function () { atlasWait.splice(0).forEach(function (f) { f(false); }); atlas = null; };
    atlas.src = 'traveller.webp?v=' + V_;
  }
  function canvasOk() { try { var c = document.createElement('canvas'); return !!(c.getContext && c.getContext('2d')); } catch (e) { return false; } }
  var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function bgSrc(slug, n) { return 'img/full/' + slug + (n ? '-' + n : '') + '.webp?v=' + V_; }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  /* ---------- actions (sprite sheet rows) ---------- */
  var ACT = { idle: [3, 1], walk: [11, 1], run: [15, 1], sweep: [8, 1], dig: [7, 1], knock: [9, 1], crouch: [7, 1], look: [4, 1], lookdown: [4, 1],
    sitdown: [0, 0], sit: [2, 1], sleep: [1, 1], wave: [8, 1], jump: [0, 0], clap: [9, 1], eat: [6, 1], reach: [0, 0], hold: [4, 1], hide: [3, 1], stumble: [0, 0] };

  /* ---------- reading a choice: what he does, where, and how the world answers ---------- */
  var HOME = /\b(house|home|door|doors|porch|inside|indoors|cottage|cabin|bed|bedroom|kitchen|window|windows|room|bunk|shop|bakery|store|tent|hut|igloo|shed|steps?|curtains?|roof|chimney|stove|fire|fireplace|hearth|hall|counter|desk|bench|attic|cellar|sofa|couch|blanket|lamp|lantern|candle|shutter|party)\b/;
  var FEAT = /\b(well|water|lake|pond|sea|ocean|river|stream|pool|spring|springs|hole|boat|dock|pier|jetty|balloon|tree|trees|garden|field|bear|bears|screen|truck|sheep|statue|bones?|ice|shore|beach|edge|cliff|fence|gate|path|road|tracks?|rails?|wheels?|engine|sinkhole|tv|tape|machine|crowd|kaiju|turtle|penguins?|seals?|ducks?|cats?|kittens?|dogs?|puppies|puppy|pandas?|rabbits?|bunnies|gnomes?|pumpkins?|scarecrow|swings?|slide|sandbox|stall|stalls|market)\b/;
  var FAR = /\b(back|behind|away|beyond|distance|far|explore|wander|follow|leave|edge|horizon|outside|deeper|further|farther|across|other side|the end)\b/;
  var RULES = [
    [/\b(brush(ing)? (your )?teeth|toothbrush|brush before|brush after|brush twice|floss)/, 'brush'],
    [/\b(kneel|crouch down|bend down|squat)/, 'kneel'],
    [/\b(keep walking|keep going|keep moving|pick up your pace|take the long way|walk on|turn back|turn and walk|walk the other way|back away)\b/, 'walk'],
    [/\b(keep reading|keep counting)\b/, 'lookdown'],
    [/\b(then bed|in bed)\b/, 'sleep'],
    [/\b(hold (your )?breath|(hold|stay|keep|sit) (very )?(still|down|quiet)|say nothing|silent|pretend|wedge yourself)/, 'hide'],
    [/\b(ears|nose|sneeze|groan|hanky|yawn)\b/, 'face'],
    [/\b(finish|have|eat|drink)\b.*\b(breakfast|milkshake|pie|cucumber|apples?|bamboo|cherries|salmon|tomato|chocolate|bath|tea|soup|meal|lunch|dinner)\b/, 'eat'],
    [/\b(shout|yell|call out|call thank|call every|call through|call it|call his|shoo)\b/, 'shout'],
    [/\b(ask|say|said|tell|whisper|murmur|thank|answer|bargain|reply|speak|sorry|goodbye|nod|chuckle|lullaby)\b/, 'talk'],
    [/\b(croak|sing|hum|whistle)\b/, 'clap'],
    [/\b(chop|split)\b/, 'dig'],
    [/\b(float|sunbathe|soak|lean on)\b/, 'sit'],
    [/\b(rise|pop up|stand up|stamp)\b/, 'jump'],
    [/\b(hope|trust|breathe|wonder|decide|choose|think)\b/, 'look'],
    [/\b(sleep|sleeping|nap|napping|doze|lie down|go to bed|bedtime|snooze|hibernate|rest your eyes|turn in)\b/, 'sleep'],
    [/\b(sweep|swept|scrub|tidy|wipe|dust off|mop|polish|rake|clean)\b/, 'sweep'],
    [/\b(dig|shovel|bury|plant|weed|till|hoe|unearth)\b/, 'dig'],
    [/\b(tap|knock|rap|bang|pound|ring|press|poke)\b.*\b(floor|ground|ice|glass floor|sand|earth|shell)\b/, 'tapfloor'],
    [/\b(knock|tap|rap|bang|ring the|ring a|press|push the button|doorbell|poke)\b/, 'knock'],
    [/\b(hide|duck|cower|crouch|take cover|shelter|curl up|huddle)\b/, 'hide'],
    [/\b(run|flee|hurry|sprint|race|rush|escape|dash|chase|bolt)\b/, 'run'],
    [/\b(wave|waving|greet|say hello|say hi|bow|salute|blow a kiss)\b/, 'wave'],
    [/\b(sing|hum|whistle|clap|cheer|applaud|play (a|the|some) (song|tune|music)|music|dance along)\b/, 'clap'],
    [/\b(jump|leap|hop|dance|swim|dive|skip|bounce|splash)\b/, 'jump'],
    [/\b(climb|reach up|high shelf|lift|hold up|raise|hug|stretch)\b/, 'hold'],
    [/\b(eat|drink|taste|sip|lick|bite|snack|feast|have one more|have a|tea|cocoa|soup|munch|nibble|gulp|swallow|chew)\b/, 'eat'],
    [/\b(feed|pet|stroke|pat|scratch|cuddle|tickle|offer|give|share|hand over)\b/, 'feed'],
    [/\b(pick|take|grab|collect|gather|carry|fetch|keep it|pocket|catch|fish|scoop|fill|bring|borrow|buy|rent|accept|save)\b/, 'pick'],
    [/\b(sit|rest|wait|relax|perch|settle|meditate|stay put|keep still|stand still|for now|later|do nothing|let it|let them|leave it|ignore|stay in|stay inside|stay home|wait it out)\b/, 'sit'],
    [/\b(read|write|draw|paint|carve|cut|count|study|sort|check the|knit|sew|note|journal|letter|map)\b/, 'lookdown'],
    [/\b(look|watch|peek|peer|stare|listen|search|investigate|inspect|admire|gaze|spy|observe|wonder|find out|see what|check)\b/, 'look'],
    [/\b(oil|fix|repair|mend|build|make|patch|tie|wind|feed the|stack|light|set up|tighten|fill up|pour|water the|tend)\b/, 'work'],
    [/\b(open|close|shut|draw the|pull|push|turn|switch|flip|unlock|lock|throw|toss|drop|put|return|use|try|pay|sign|post|send|mail|plug|unplug)\b/, 'reach'],
    [/\b(roll|drag|kick|tug|hook|lower|hang|latch|wedge|stuff|tuck|store|fit|chalk|mark|peg|rearrange|top up|change|tip|loosen|squeeze|swish|rub|shine|shield|fold|pack|sell|trade|set an|start a|add|signal|dry|tow|rebuild|ration|lead|let)\b/, 'work'],
    [/\b(go|walk|visit|tiptoe|pass|edge|leave|row|paddle|drive|skate|practise|shop|stay|stop|wear|test|head|step|cross|enter|wade|stroll|follow|sail|row|ride|move|join|approach)\b/, 'walk']
  ];
  var LOW = /\b(floor|ground|wheels?|seeds?|roots?|sand|snow|ice|hole|soil|dirt|grass|flowers?|plants?|garden|bucket|puddle|step|steps|crack|shoes?|boots?|rug|mat)\b/;
  var FX = [
    [/\b(sand|dust|dune|grit)\b/, 'sand'], [/\b(snow|frost|freez|ice-cold|frozen|chill|cold|blizzard|icicle)/, 'snow'],
    [/\b(rain|drip|drizzle|storm|wet|downpour|puddle)/, 'rain'], [/\b(wind|breeze|gust|blow|blew|blown)/, 'wind'],
    [/\b(sing|song|hum|music|melod|chime|bell|tune|choir|whistl|purr)/, 'notes'], [/\b(heart|love|happy|smile|hug|grateful|friend|thank|cuddl|delight)/, 'hearts'],
    [/\b(bubble|splash|swim|ripple)/, 'bubbles'], [/\b(smoke|steam|fog|mist|puff)/, 'smoke'],
    [/\b(warm|gold|golden|glow|light|lamp|lantern|candle|fire|bright|sunshine|sunlit|sunset|shine|shining)/, 'warm'],
    [/\b(sparkl|twinkl|glitter|gleam|shimmer|star|magic|clean)/, 'sparkle'],
    [/\b(dark|black|shadow|dim|gloom|night falls|blackout|goes out|went out)/, 'dark'],
    [/\b(shake|shook|trembl|rumbl|quake|crack|thud|boom|crash|collapse)/, 'shake']
  ];
  function classify(text) { for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(text)) return RULES[i][1]; return 'walk'; }
  function fxOf(text, max) { var out = []; for (var i = 0; i < FX.length && out.length < max; i++) if (FX[i][0].test(text) && out.indexOf(FX[i][1]) < 0) out.push(FX[i][1]); return out; }

  /* ---------- ambient life: a few CSS particles (compositor only), picked by the world's kind ---------- */
  var LIFE = { snow: 'snow', mountain: 'snow', sea: 'bubble', swamp: 'fly', night: 'fly', city: 'fly', cave: 'fly', forest: 'mote', meadow: 'mote', candy: 'mote', sky: 'mote', desert: 'sand', space: 'star', interior: 'dust' };
  function buildLife(box, kind, night, force) {
    var k = night ? 'fly' : (force || LIFE[kind] || 'mote'), wrap = el('div', 'wlife l-' + k), n = k === 'snow' ? 26 : k === 'sand' ? 16 : 14;
    var r = 9; function rnd() { r = (r * 9301 + 49297) % 233280; return r / 233280; }
    for (var i = 0; i < n; i++) {
      var p = el('i'); p.style.left = (rnd() * 100).toFixed(1) + '%'; p.style.top = (k === 'snow' || k === 'sand' ? -6 : 10 + rnd() * 80).toFixed(1) + '%';
      var s = k === 'snow' ? 2 + rnd() * 4 : k === 'fly' ? 3 + rnd() * 3 : k === 'bubble' ? 4 + rnd() * 8 : k === 'star' ? 1.5 + rnd() * 2 : 2 + rnd() * 3;
      p.style.width = p.style.height = s.toFixed(1) + 'px';
      p.style.animationDuration = ((k === 'snow' ? 9 : k === 'sand' ? 4 : 7) + rnd() * 8).toFixed(1) + 's';
      p.style.animationDelay = (-rnd() * 16).toFixed(1) + 's';
      wrap.appendChild(p);
    }
    box.appendChild(wrap); return wrap;
  }

  /* ---------- the stage ---------- */
  function Stage(host, w, opts) {
    this.host = host; this.w = w; this.opts = opts || {};
    var d = STAGE[w.slug];
    if (!d) d = { globe: 1, p: [.5, 0], h: .085, hz: -5, home: [.66, 0], r: [.25, .75] };
    this.d = d; this.dead = false; this.ready = false; this.parts = []; this.marks = []; this.ov = { dark: 0, cold: 0, warm: 0 }; this.ovT = { dark: 0, cold: 0, warm: 0 };
    this.pos = d.p.slice(); this.face = d.p[0] > .55 ? -1 : 1; this.act = 'idle'; this.rest = 'idle'; this.segs = null; this.t = 0; this.shake = 0; this.night = '';
    // DOM: blurred fill (desktop sides) + the portrait stage column: shake > drift > picture(s) + canvas, life on top
    this.blur = el('div', 'wblur'); host.appendChild(this.blur);
    this.box = el('div', 'wbox'); this.shk = el('div', 'wshake'); this.drift = el('div', 'wdrift' + (reduce ? '' : ' on'));
    this.cv = el('canvas', 'stage'); this.cv.setAttribute('aria-hidden', 'true'); this.g = this.cv.getContext('2d');
    this.shk.appendChild(this.drift); this.box.appendChild(this.shk); host.appendChild(this.box);
    this.tmp = document.createElement('canvas'); this.tg = this.tmp.getContext('2d');
    var self = this;
    this.onVis = function () { if (!document.hidden) self.kick(); };
    document.addEventListener('visibilitychange', this.onVis);
    this.onResize = function () { if (self.ready) { self.size(); self.draw(); } };
    window.addEventListener('resize', this.onResize);
    var bgDone = false, atDone = false, fail = false;
    function go() {
      if (fail || self.dead || !bgDone || !atDone) return;
      self.ready = true; self.size(); self.tint(); self.pos = self.spot(self.pos); host.classList.add('live'); self.draw(); self.kick();
      if (!reduce && !self.d.globe && self.d.life !== 'none') self.life = buildLife(self.box, w.kind, false, self.d.life);
      if (self.onReady) self.onReady();
    }
    if (d.globe) { this.bg = this.globeBg(opts.globe); this.bg.className = 'wbg'; this.drift.appendChild(this.bg); bgDone = true; this.blur.style.background = 'radial-gradient(circle at 50% 40%, #1d2350, #0a0b1a 70%)'; }
    else {
      var im = new Image(); im.decoding = 'async'; im.alt = ''; im.className = 'wbg';
      im.onload = function () { bgDone = true; go(); };
      im.onerror = function () { fail = true; if (self.onFail) self.onFail(); self.destroy(); };
      im.src = bgSrc(w.slug); this.bg = im; this.drift.appendChild(im);
      this.blur.style.backgroundImage = 'url("' + im.src + '")';
    }
    this.tone = el('div', 'wtone'); this.drift.appendChild(this.tone);
    this.drift.appendChild(this.cv);
    loadAtlas(function (ok) { if (!ok) { fail = true; if (self.onFail) self.onFail(); self.destroy(); return; } atDone = true; go(); });
  }
  var P = Stage.prototype;
  P.globeBg = function (gcv) {   // the code-drawn planet, huge, with its top as the ground
    var c = document.createElement('canvas'); c.width = IW / 2; c.height = IH / 2; var g = c.getContext('2d'), s2 = .5;
    var gr = g.createRadialGradient(IW * s2 / 2, IH * s2 * .3, 10, IW * s2 / 2, IH * s2 * .35, IH * s2 * .8); gr.addColorStop(0, '#1d2350'); gr.addColorStop(1, '#0a0b1a');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    var r = 7; for (var i = 0; i < 160; i++) { r = (r * 9301 + 49297) % 233280; var x = r / 233280 * c.width; r = (r * 9301 + 49297) % 233280; var y = r / 233280 * c.height * .5; g.fillStyle = 'rgba(255,255,240,' + (.3 + (i % 5) / 8) + ')'; var q = i % 7 ? 1.5 : 2.5; g.fillRect(x, y, q, q); }
    var R = 900, cx = IW / 2, cy = IH * .55 + R;
    this.d.gl = [cx / IW, cy / IH, R];
    if (gcv) { g.imageSmoothingEnabled = false; var k = R * s2 / (gcv.width * .34); g.drawImage(gcv, cx * s2 - gcv.width * k / 2, cy * s2 - gcv.height * k / 2, gcv.width * k, gcv.height * k); }
    this.pos = this.ground(this.d.p[0], 0);
    return c;
  };
  P.ground = function (u, v) {
    var gl = this.d.gl; if (!gl) return [u, v];
    var cx = gl[0] * IW, cy = gl[1] * IH, R = gl[2], x = u * IW, dx = Math.max(-R * .95, Math.min(R * .95, x - cx));
    return [u, (cy - Math.sqrt(R * R - dx * dx)) / IH];
  };
  /* Cover the stage column with the picture, centred on the world's focus (fx), and size the canvas to match. */
  P.size = function () {
    var r = this.box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(r.height));
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) { this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); }
    var kc = Math.max(W / IW, H / IH), dw = IW * kc, dh = IH * kc, d = this.d;
    var fx = d.fx != null ? d.fx : .5, ox = Math.max(W - dw, Math.min(0, W / 2 - fx * dw)), oy = Math.max(H - dh, Math.min(0, H * .5 - .5 * dh));
    var bgs = this.drift.querySelectorAll('.wbg');
    for (var i = 0; i < bgs.length; i++) { var s = bgs[i].style; s.width = dw + 'px'; s.height = dh + 'px'; s.left = ox + 'px'; s.top = oy + 'px'; }
    this.cssH = H; this.kc = kc;
    this.view = { sx: -ox / kc, sy: -oy / kc, sw: W / kc, sh: H / kc, k: this.cv.width / (W / kc) };
    var hp = d.h * IH * kc; this.boost = Math.max(1, Math.min(1.6, H * .085 / hp));   // tiny travellers get a little bigger, to stay readable
    this.topPad = (Math.max(64, (parseFloat(getComputedStyle(this.box).getPropertyValue('--top')) || 64))) / kc;   // keep his head under the top bar
  };
  P.tint = function () {   // light the traveller like the spot he stands on
    try {
      var c = document.createElement('canvas'); c.width = 24; c.height = 24; var g = c.getContext('2d'), d = this.d, hp = this.hAt(this.pos[1]) * IH;
      var bg = this.nightEl && this.night ? this.nightEl : this.bg, sc = (bg.naturalWidth || bg.width) / IW;
      g.drawImage(bg, (this.pos[0] * IW - hp) * sc, (this.pos[1] * IH - hp * 1.2) * sc, hp * 2 * sc, hp * 1.6 * sc, 0, 0, 24, 24);
      var px = g.getImageData(0, 0, 24, 24).data, r = 0, gg = 0, b = 0, n = px.length / 4;
      for (var i = 0; i < px.length; i += 4) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; }
      r /= n; gg /= n; b /= n; var L = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      this.tc = 'rgba(' + Math.round(r) + ',' + Math.round(gg) + ',' + Math.round(b) + ',' + (d.globe ? .12 : .2) + ')';
      this.dk = Math.max(0, Math.min(.45, (.38 - L) * 1.0));
    } catch (e) { this.tc = 'rgba(0,0,0,0)'; this.dk = 0; }
  };
  /* Night (or any alternative) picture for one beat; same geometry, cross-faded. */
  P.setBg = function (n) {
    n = n || ''; if (n === this.night || this.d.globe || this.dead) return;
    this.night = n; var self = this;
    if (n && !this.nightEl) {
      var im = new Image(); im.decoding = 'async'; im.alt = ''; im.className = 'wbg alt';
      im.onload = function () { if (self.dead) return; self.size(); im.classList.add('on'); self.tint(); self.draw(); };
      im.src = bgSrc(this.w.slug, n); this.nightEl = im; this.drift.insertBefore(im, this.tone);
    } else if (this.nightEl) { this.nightEl.classList.toggle('on', !!n); this.tint(); this.draw(); }
    if (this.life) { this.life.remove(); this.life = null; }
    if (!reduce && this.d.life !== 'none') this.life = buildLife(this.box, this.w.kind, !!n, this.d.life);
    this.blur.style.backgroundImage = 'url("' + bgSrc(this.w.slug, n) + '")';
  };
  P.setTone = function (a) { this.tone.style.background = 'rgba(10,8,30,' + (a || 0) + ')'; };
  P.hAt = function (v) { var d = this.d, b = this.boost || 1; if (d.hz < -1) return d.h * b; return b * d.h * Math.max(.35, Math.min(1.8, (v - d.hz) / (d.p[1] - d.hz))); };
  P.toC = function (u, v) { var V = this.view; return [(u * IW - V.sx) * V.k, (v * IH - V.sy) * V.k]; };
  P.clampU = function (u, v) {   // stay on the walkable strip and inside the visible part of the picture (with room for the drift)
    var d = this.d, V = this.view, h = this.hAt(v) * IH, m = V.sw * .05;
    if (d.r) u = Math.max(d.r[0], Math.min(d.r[1], u));
    var lo = (V.sx + m + h * .3) / IW, hi = (V.sx + V.sw - m - h * .3) / IW; if (lo < hi) u = Math.max(lo, Math.min(hi, u));
    return u;
  };
  P.clampV = function (v) { var V = this.view, h = this.hAt(v) * IH; return Math.max((V.sy + this.topPad + h * 1.05) / IH, Math.min((V.sy + V.sh * .95) / IH, v)); };
  P.spot = function (pt) { var u = this.clampU(pt[0], pt[1]); var v = this.d.gl ? this.ground(u, 0)[1] : this.clampV(pt[1]); return [u, v]; };
  /* Where he is on screen (CSS px inside the stage column), for the UI to keep clear of him. */
  P.screenBox = function () {
    if (!this.ready) return null;
    var c = this.toC(this.pos[0], this.pos[1]), k = this.cv.width / (this.box.clientWidth || 1), h = this.hAt(this.pos[1]) * IH * this.view.k;
    return { x: c[0] / k, foot: c[1] / k, head: (c[1] - h) / k, H: this.cssH };
  };

  /* ---------- plans ---------- */
  P.plan = function (o, beatText) {
    var d = this.d, t = (o.t || '').toLowerCase(), res = (o.r || '').toLowerCase(), kind = classify(t);
    var p0 = this.spot(d.p), home = d.home ? this.spot(d.home) : null, feat = d.x ? this.spot(d.x) : home;
    var tgt = null;
    if (HOME.test(t) && home) tgt = home; else if (FEAT.test(t) && feat) tgt = feat;
    if (FAR.test(t) && !tgt) {
      var fu = p0[0] + (p0[0] < .5 ? .22 : -.22), fv = d.hz > -1 ? p0[1] + (d.hz - p0[1]) * .3 : p0[1];
      tgt = this.spot([fu, fv]);
    }
    var segs = [], rest = 'idle', self = this;
    function walkTo(pt, run) {
      if (!pt) return;
      var a = self.pos, dx = (pt[0] - a[0]) * IW, dy = (pt[1] - a[1]) * IH, dist = Math.sqrt(dx * dx + dy * dy), h = self.hAt((a[1] + pt[1]) / 2) * IH;
      if (dist < h * .12) return;
      var sp = h * (run ? 3.2 : 1.5), dur = dist / sp, cap = run ? 1.25 : 1.3;
      if (dur > cap) { var k = cap / dur; pt = self.spot([a[0] + (pt[0] - a[0]) * k, a[1] + (pt[1] - a[1]) * k]); dur = cap; }
      segs.push({ a: run ? 'run' : 'walk', dur: Math.max(.45, dur), to: pt, fx: run ? 'puff' : null });
    }
    switch (kind) {
      case 'brush': walkTo(tgt); segs.push({ a: 'eat', dur: 1.6, fx: 'sparkle' }); break;
      case 'sleep': walkTo(tgt || home); segs.push({ a: 'sitdown', dur: .45 }); segs.push({ a: 'sleep', dur: 1.3, fx: 'zzz' }); rest = 'sleep'; break;
      case 'sweep': walkTo(tgt); segs.push({ a: 'sweep', dur: 1.6, fx: 'dust' }); break;
      case 'dig': walkTo(tgt); segs.push({ a: 'dig', dur: 1.7, fx: 'dirt', mark: 'hole' }); break;
      case 'tapfloor': walkTo(tgt); segs.push({ a: 'crouch', dur: 1.5, fx: 'ripple' }); break;
      case 'knock': walkTo(tgt || home); segs.push({ a: 'knock', dur: 1.3, fx: 'tap' }); break;
      case 'hide': walkTo(tgt || home, true); segs.push({ a: 'hide', dur: 1.5 }); rest = 'hide'; break;
      case 'run': walkTo(tgt || this.spot([p0[0] + (p0[0] < .5 ? .3 : -.3), p0[1]]), true); segs.push({ a: 'look', dur: .7 }); break;
      case 'wave': walkTo(tgt); segs.push({ a: 'wave', dur: 1.6 }); break;
      case 'shout': walkTo(tgt); segs.push({ a: 'wave', dur: 1.6, fx: 'shout' }); break;
      case 'talk': walkTo(tgt); segs.push({ a: 'knock', dur: .5 }); segs.push({ a: 'idle', dur: 1.2, fx: 'talk' }); break;
      case 'kneel': walkTo(tgt); segs.push({ a: 'crouch', dur: .4 }); segs.push({ a: 'lookdown', dur: .2 }); segs.push({ a: 'crouch', dur: 1.1 }); break;
      case 'face': walkTo(tgt); segs.push({ a: 'eat', dur: 1.6 }); break;
      case 'clap': walkTo(tgt); segs.push({ a: 'clap', dur: 1.6, fx: 'notes' }); break;
      case 'jump': walkTo(tgt); segs.push({ a: 'jump', dur: .9 }); segs.push({ a: 'jump', dur: .9, fx: /swim|dive|splash/.test(t) ? 'bubbles' : null }); break;
      case 'hold': walkTo(tgt); segs.push({ a: 'reach', dur: .5 }); segs.push({ a: 'hold', dur: 1.2, fx: 'sparkle' }); break;
      case 'eat': walkTo(tgt); segs.push({ a: 'eat', dur: 1.6, fx: 'crumbs' }); break;
      case 'feed': walkTo(tgt || feat); segs.push({ a: 'crouch', dur: 1.6, fx: 'hearts' }); break;
      case 'pick': walkTo(tgt); segs.push({ a: 'crouch', dur: .8 }); segs.push({ a: 'hold', dur: 1.0, fx: 'sparkle' }); break;
      case 'sit': walkTo(tgt); segs.push({ a: 'sitdown', dur: .45 }); segs.push({ a: 'sit', dur: 1.3 }); rest = 'sit'; break;
      case 'lookdown': walkTo(tgt); segs.push({ a: 'lookdown', dur: 1.6 }); break;
      case 'look': walkTo(tgt); segs.push({ a: 'look', dur: 1.7 }); break;
      case 'work': walkTo(tgt); segs.push(LOW.test(t) ? { a: 'crouch', dur: 1.6, fx: 'tap' } : { a: 'knock', dur: 1.5, fx: 'tap' }); break;
      case 'reach': walkTo(tgt); segs.push({ a: 'reach', dur: .7 }); segs.push({ a: LOW.test(t) ? 'crouch' : 'knock', dur: .9 }); break;
      default: walkTo(tgt || this.spot([p0[0] + (p0[0] < .5 ? .18 : -.18), p0[1]])); segs.push({ a: 'look', dur: 1.2 });
    }
    var tot = 0; segs.forEach(function (s) { tot += s.dur; });
    if (tot < 1.5) segs[segs.length - 1].dur += 1.5 - tot;
    var fx = fxOf(res + ' ' + (beatText && /sand/.test(t) ? 'sand' : ''), 2);
    return { segs: segs, rest: rest, fx: fx, kind: kind };
  };

  /* ---------- playing ---------- */
  P.reset = function () {
    this.stopPlay(); this.parts = []; this.marks = []; this.ov = { dark: 0, cold: 0, warm: 0 }; this.ovT = { dark: 0, cold: 0, warm: 0 };
    this.pos = this.ground(this.d.p[0], this.d.p[1]); if (this.ready) this.pos = this.spot(this.pos); this.face = this.d.p[0] > .55 ? -1 : 1; this.act = this.rest = 'idle'; this.draw(); this.kick();
  };
  P.arrive = function () {
    if (!this.ready) return;
    var end = this.spot(this.d.p), V = this.view, fromLeft = end[0] * IW - V.sx < V.sx + V.sw - end[0] * IW;
    var start = this.spot([fromLeft ? 0 : 1, end[1]]);
    if (Math.abs(start[0] - end[0]) * IW < this.hAt(end[1]) * IH * .3) return;
    this.pos = start; this.run({ segs: [{ a: 'walk', dur: 1.6, to: end }, { a: 'wave', dur: .9 }], rest: 'idle', fx: [] }, null, true);
  };
  P.run = function (plan, done, quiet) {
    this.stopPlay(); this.plan_ = plan; this.done = done; this.segs = plan.segs.slice(); this.si = 0; this.st = 0; this.from = this.pos.slice(); this.quiet = !!quiet;
    this.act = this.segs[0].a; this.playing = true; this.fxOn = plan.fx || []; this.last = 0; this.kick();
  };
  P.play = function (o, beatText, done) {
    if (!this.ready) { done(false); return null; }
    var plan = this.plan(o, beatText); this.run(plan, done); return plan;
  };
  P.endState = function (o, beatText) {   // after a reload: show where the choice left him, no animation
    if (!this.ready) return;
    var plan = this.plan(o, beatText); this.segs = plan.segs; this.plan_ = plan; this.finish(true);
  };
  P.skip = function () { if (this.playing) { this.finish(false); return true; } return false; };
  P.finish = function (silent) {
    var segs = (this.segs || []).slice(this.playing ? this.si || 0 : 0), self = this, cur = this.playing ? this.from || this.pos : this.pos;
    segs.forEach(function (s) {
      if (s.to) { if (Math.abs(s.to[0] - cur[0]) > .004) self.face = s.to[0] < cur[0] ? -1 : 1; cur = s.to; self.pos = s.to.slice(); }
      if (s.mark) self.addMark(s.mark);
    });
    var plan = this.plan_ || { rest: 'idle', fx: [] };
    (plan.fx || []).forEach(function (f) { if (f === 'dark') self.ov.dark = self.ovT.dark = .28; if (f === 'snow') self.ov.cold = self.ovT.cold = .16; if (f === 'warm') self.ov.warm = self.ovT.warm = .22; });
    this.parts = this.parts.filter(function (p) { return p.k === 'zzz'; });
    this.act = plan.rest; this.playing = false; this.segs = null; this.setShake(0);
    var d = this.done; this.done = null; this.draw(); this.kick();
    if (d && !silent) d(true);
  };
  P.stopPlay = function () { this.playing = false; this.segs = null; this.done = null; };
  P.addMark = function (m) { this.marks.push({ k: m, u: this.pos[0] + this.face * this.hAt(this.pos[1]) * IH * .32 / IW, v: this.pos[1] + .004 }); };
  P.setShake = function (px) { this.shk.style.transform = px ? 'translate3d(' + px.toFixed(1) + 'px,0,0)' : ''; };

  /* ---------- particles ---------- */
  function R(a, b) { return a + Math.random() * (b - a); }
  P.emit = function (k, dt) {
    var V = this.view, u = this.pos[0] * IW, v = this.pos[1] * IH, h = this.hAt(this.pos[1]) * IH, f = this.face, P2 = this.parts, n, i, sp = V.sh / 600;
    var rate = { sand: 60, snow: 40, rain: 90, wind: 14, notes: 3, hearts: 3, bubbles: 10, smoke: 6, sparkle: 9, dust: 14, dirt: 22, tap: 5, ripple: 2.2, puff: 10, crumbs: 6, zzz: 1.4, talk: 1.6, shout: 2.2 }[k];
    if (!rate) return; n = rate * dt; if (Math.random() < n % 1) n = Math.ceil(n); else n = Math.floor(n);
    for (i = 0; i < n && P2.length < 260; i++) {
      var p = { k: k, a: 0, life: 1.2 };
      switch (k) {
        case 'sand': p.x = V.sx - 10; p.y = R(V.sy, V.sy + V.sh); p.vx = R(120, 220) * sp; p.vy = R(-10, 25) * sp; p.life = R(1.2, 2.4); p.s = R(1, 2.4) * sp; p.c = '#e8c889'; break;
        case 'snow': p.x = R(V.sx, V.sx + V.sw); p.y = V.sy - 4; p.vx = R(-8, 8) * sp; p.vy = R(18, 40) * sp; p.life = 600 / 28; p.s = R(1.2, 2.6) * sp; p.c = '#fff'; break;
        case 'rain': p.x = R(V.sx, V.sx + V.sw + 40 * sp); p.y = V.sy - 10; p.vx = -40 * sp; p.vy = R(420, 520) * sp; p.life = 600 / 420; p.s = sp; p.c = 'rgba(200,220,255,.55)'; break;
        case 'wind': p.x = V.sx - 30 * sp; p.y = R(V.sy, V.sy + V.sh); p.vx = R(260, 360) * sp; p.vy = 0; p.life = 2; p.s = R(14, 34) * sp; p.c = 'rgba(255,255,255,.35)'; break;
        case 'notes': p.x = u + f * h * .1; p.y = v - h * .95; p.vx = R(-12, 12) * sp; p.vy = -R(18, 30) * sp; p.life = 1.6; p.s = h * .16; p.c = '#f4c86e'; p.ch = Math.random() < .5 ? '♪' : '♫'; break;
        case 'hearts': p.x = u + f * h * .3; p.y = v - h * .5; p.vx = R(-10, 10) * sp; p.vy = -R(14, 24) * sp; p.life = 1.5; p.s = h * .15; p.c = '#ff8fa8'; p.ch = '♥'; break;
        case 'talk': case 'shout': p.x = u + f * h * .32; p.y = v - h * 1.05; p.vx = f * 4 * sp; p.vy = -8 * sp; p.life = .9; p.s = h * (k === 'shout' ? .26 : .2); p.c = '#fff'; p.ch = k === 'shout' ? '!' : '…'; p.bub = 1; break;
        case 'zzz': p.x = u + f * h * .1; p.y = v - h * .3; p.vx = R(4, 10) * f * sp; p.vy = -R(10, 16) * sp; p.life = 2.2; p.s = h * .14; p.c = '#e9e4ff'; p.ch = 'z'; break;
        case 'bubbles': p.x = u + R(-h * .3, h * .3); p.y = v - R(0, h * .6); p.vx = R(-4, 4) * sp; p.vy = -R(20, 40) * sp; p.life = 1.4; p.s = R(1.5, 3.5) * h / 60; p.c = 'rgba(220,245,255,.8)'; break;
        case 'smoke': p.x = u + R(-h * .4, h * .4); p.y = v - R(0, h * .3); p.vx = R(-6, 6) * sp; p.vy = -R(8, 14) * sp; p.life = 2; p.s = R(.15, .3) * h; p.c = 'rgba(235,235,240,.22)'; break;
        case 'sparkle': p.x = u + R(-h * .45, h * .45); p.y = v - R(h * .1, h * 1.1); p.vx = 0; p.vy = -R(2, 8) * sp; p.life = R(.5, 1); p.s = R(.03, .06) * h; p.c = '#fff3c4'; break;
        case 'dust': p.x = u + f * h * R(.25, .5); p.y = v - R(0, h * .06); p.vx = f * R(10, 40) * sp; p.vy = -R(4, 16) * sp; p.life = R(.5, 1); p.s = R(.03, .07) * h; p.c = 'rgba(225,205,165,.75)'; break;
        case 'puff': p.x = u - f * h * .1; p.y = v; p.vx = -f * R(8, 20) * sp; p.vy = -R(3, 10) * sp; p.life = R(.4, .7); p.s = R(.04, .08) * h; p.c = 'rgba(220,210,190,.6)'; break;
        case 'dirt': p.x = u + f * h * .32; p.y = v - h * .05; p.vx = f * R(-10, 50) * h / 60; p.vy = -R(40, 90) * h / 60; p.g = 260 * h / 60; p.life = R(.5, .9); p.s = R(.025, .05) * h; p.c = Math.random() < .5 ? '#6b4a2e' : '#8a6440'; break;
        case 'crumbs': p.x = u + f * h * .12; p.y = v - h * .82; p.vx = f * R(-6, 14) * h / 60; p.vy = R(0, 10) * h / 60; p.g = 160 * h / 60; p.life = .6; p.s = R(.015, .03) * h; p.c = '#e8b86a'; break;
        case 'tap': p.x = u + f * h * .42; p.y = v - h * .7; p.vx = 0; p.vy = 0; p.life = .45; p.ring = h * .2; p.c = 'rgba(255,255,255,.8)'; break;
        case 'ripple': p.x = u + f * h * .35; p.y = v; p.vx = 0; p.vy = 0; p.life = .9; p.ring = h * .5; p.flat = 1; p.c = 'rgba(200,240,255,.9)'; break;
      }
      p.max = p.life; P2.push(p);
    }
  };

  /* ---------- loop ---------- */
  P.kick = function () {
    if (this.dead || !this.ready || this.raf || document.hidden) return;
    var self = this;
    this.raf = requestAnimationFrame(function (ts) { self.raf = 0; self.tick(ts); });
  };
  P.tick = function (ts) {
    if (this.dead || !this.cv.isConnected) return;
    var dt = this.last ? Math.min(.05, (ts - this.last) / 1000) : .016; this.last = ts; this.t += dt;
    if (this.playing) this.step(dt);
    var self = this;
    if (this.act === 'sleep' && !this.playing) this.emit('zzz', dt);
    this.parts = this.parts.filter(function (p) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; return p.life > 0; });
    ['dark', 'cold', 'warm'].forEach(function (k) { self.ov[k] += (self.ovT[k] - self.ov[k]) * Math.min(1, dt * 2.5); });
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); this.setShake(this.shake > 0 ? Math.sin(this.t * 60) * this.shake * 10 : 0); }
    this.draw();
    var busy = this.playing || this.parts.length || this.shake > 0 || Math.abs(this.ov.dark - this.ovT.dark) + Math.abs(this.ov.cold - this.ovT.cold) + Math.abs(this.ov.warm - this.ovT.warm) > .005;
    if (busy || this.act === 'sleep') this.kick();
    else { clearTimeout(this.idleT); this.idleT = setTimeout(function () { self.last = 0; self.kick(); }, 320); }   // calm idle: ~3 redraws a second
  };
  P.step = function (dt) {
    var s = this.segs[this.si]; if (!s) return;
    this.st += dt; var u = Math.min(1, this.st / s.dur);
    if (s.to) {
      var e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, k = s.a === 'walk' || s.a === 'run' ? (u * .7 + e * .3) : e;
      this.pos = [this.from[0] + (s.to[0] - this.from[0]) * k, this.from[1] + (s.to[1] - this.from[1]) * k];
      if (this.d.gl) this.pos = this.ground(this.pos[0], 0);
      if (Math.abs(s.to[0] - this.from[0]) > .004) this.face = s.to[0] < this.from[0] ? -1 : 1;
    }
    if (s.fx) this.emit(s.fx, dt);
    var main = !this.quiet && this.si === this.segs.length - 1;
    if (main) for (var i = 0; i < this.fxOn.length; i++) {
      var f = this.fxOn[i];
      if (f === 'dark') this.ovT.dark = .28; else if (f === 'warm') { this.ovT.warm = .22; this.emit('sparkle', dt * .5); }
      else if (f === 'snow') { this.ovT.cold = .16; this.emit('snow', dt); } else if (f === 'shake') { if (!this.shook) { this.shake = .5; this.shook = 1; } }
      else this.emit(f, dt);
    }
    if (u >= 1) {
      if (s.mark) this.addMark(s.mark);
      this.si++; this.st = 0; this.from = this.pos.slice();
      if (this.si >= this.segs.length) { this.shook = 0; var d = this.done, plan = this.plan_; this.playing = false; this.segs = null; this.done = null; this.act = plan.rest; this.draw(); if (d) d(false); return; }
      this.act = this.segs[this.si].a;
    }
  };
  P.frame = function () {
    var a = AT.a[this.act] || AT.a.idle, n = a[1], spec = ACT[this.act] || ACT.idle, i;
    if (spec[1]) i = Math.floor(this.t * spec[0]) % n;
    else { var s = this.playing && this.segs ? this.segs[this.si] : null; i = s && s.a === this.act ? Math.min(n - 1, Math.floor(this.st / s.dur * n)) : n - 1; }
    return a[0] + i;
  };
  P.draw = function () {
    if (!this.ready || this.dead) return;
    var g = this.g, V = this.view, W = this.cv.width, H = this.cv.height, k = V.k;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = true;
    if (this.d.globe) { /* the globe picture is the .wbg canvas itself */ }
    var self = this, hpx;
    this.marks.forEach(function (m) {   // a dug hole stays
      var c = self.toC(m.u, m.v), hh = self.hAt(m.v) * IH * k;
      g.fillStyle = 'rgba(40,24,12,.75)'; g.beginPath(); g.ellipse(c[0], c[1], hh * .2, hh * .06, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(120,86,52,.6)'; g.beginPath(); g.ellipse(c[0] + hh * .26, c[1] - hh * .01, hh * .09, hh * .04, 0, 0, Math.PI * 2); g.fill();
    });
    // the traveller
    var c = this.toC(this.pos[0], this.pos[1]); hpx = this.hAt(this.pos[1]) * IH * k;
    var sc = hpx / FIG, fw = AT.fw * sc, fh = AT.fh * sc, fi = this.frame(), fx = (fi % AT.cols) * AT.fw, fy = Math.floor(fi / AT.cols) * AT.fh, footY = AT.fh - (AT.foot || 16);
    if (this.act !== 'sleep') { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(c[0], c[1], hpx * .19, hpx * .05, 0, 0, Math.PI * 2); g.fill(); }
    var tw = Math.ceil(fw) + 2, th = Math.ceil(fh) + 2;
    if (this.tmp.width !== tw || this.tmp.height !== th) { this.tmp.width = tw; this.tmp.height = th; } else this.tg.clearRect(0, 0, tw, th);
    var tg = this.tg; tg.globalCompositeOperation = 'source-over'; tg.imageSmoothingEnabled = true; try { tg.imageSmoothingQuality = 'high'; } catch (e) {}
    tg.drawImage(atlas, fx, fy, AT.fw, AT.fh, 1, 1, fw, fh);
    tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = this.tc; tg.fillRect(0, 0, tw, th);
    if (this.dk) { tg.fillStyle = 'rgba(8,10,24,' + this.dk + ')'; tg.fillRect(0, 0, tw, th); }
    tg.globalCompositeOperation = 'source-over';
    var rot = 0;
    if (this.d.gl) { var gl = this.d.gl; rot = Math.atan2(this.pos[0] * IW - gl[0] * IW, gl[1] * IH - this.pos[1] * IH); }
    g.save(); g.translate(c[0], c[1]); if (rot) g.rotate(rot); g.scale(this.face, 1);
    g.drawImage(this.tmp, -fw / 2 - 1, -footY * sc - 1);
    if (this.d.mirror) { g.globalAlpha = .32; g.scale(1, -1); g.drawImage(this.tmp, -fw / 2 - 1, -footY * sc - 1); g.globalAlpha = 1; }
    g.restore();
    // particles (picture px -> canvas)
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i], x = (p.x - V.sx) * k, y = (p.y - V.sy) * k, al = Math.min(1, p.life / Math.min(.4, p.max), (p.max - p.life) / .15 + .2);
      g.globalAlpha = Math.max(0, al);
      if (p.bub) { var bs = p.s * k; g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(x, y - bs * .3, bs * .75, bs * .5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1b1c34'; g.font = 'bold ' + Math.max(10, bs * .8) + 'px sans-serif'; g.textAlign = 'center'; g.fillText(p.ch, x, y - bs * .05); continue; }
      if (p.ch) { g.fillStyle = p.c; g.font = 'bold ' + Math.max(10, p.s * k) + 'px sans-serif'; g.textAlign = 'center'; g.fillText(p.ch, x, y); }
      else if (p.ring) { var rr = p.ring * k * (1 - p.life / p.max) + 2; g.strokeStyle = p.c; g.lineWidth = Math.max(1, hpx * .012); g.beginPath(); if (p.flat) g.ellipse(x, y, rr, rr * .3, 0, 0, Math.PI * 2); else g.arc(x, y, rr * .5, 0, Math.PI * 2); g.stroke(); }
      else if (p.k === 'rain' || p.k === 'wind') { g.strokeStyle = p.c; g.lineWidth = Math.max(1, W / 500); g.beginPath(); g.moveTo(x, y); if (p.k === 'rain') g.lineTo(x - W / 130, y - W / 32); else g.lineTo(x - p.s * k, y); g.stroke(); }
      else if (p.k === 'bubbles') { g.strokeStyle = p.c; g.lineWidth = Math.max(1, W / 700); g.beginPath(); g.arc(x, y, p.s * k, 0, Math.PI * 2); g.stroke(); }
      else if (p.k === 'smoke' || p.k === 'puff' || p.k === 'dust') { g.fillStyle = p.c; g.beginPath(); g.arc(x, y, p.s * k * (1.4 - p.life / p.max * .4), 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = p.c; var ss = p.s * k; g.fillRect(x - ss / 2, y - ss / 2, ss, ss); }
    }
    g.globalAlpha = 1;
    // light changes
    if (this.ov.warm > .01) { var gr = g.createRadialGradient(c[0], c[1] - hpx * .6, hpx * .2, c[0], c[1] - hpx * .6, Math.max(W, H) * .8); gr.addColorStop(0, 'rgba(255,214,140,' + this.ov.warm + ')'); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (this.ov.cold > .01) { g.fillStyle = 'rgba(150,190,255,' + this.ov.cold + ')'; g.fillRect(0, 0, W, H); }
    if (this.ov.dark > .01) { var gd = g.createRadialGradient(c[0], c[1] - hpx * .5, hpx * .4, W / 2, H / 2, Math.max(W, H) * .75); gd.addColorStop(0, 'rgba(6,6,18,' + this.ov.dark * .4 + ')'); gd.addColorStop(1, 'rgba(6,6,18,' + Math.min(.7, this.ov.dark * 1.8) + ')'); g.fillStyle = gd; g.fillRect(0, 0, W, H); }
  };
  P.destroy = function () {
    this.dead = true; this.ready = false; this.playing = false; if (this.raf) cancelAnimationFrame(this.raf); clearTimeout(this.idleT);
    document.removeEventListener('visibilitychange', this.onVis); window.removeEventListener('resize', this.onResize);
    [this.box, this.blur].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    this.host.classList.remove('live');
    var d = this.done; this.done = null; if (d) d(true);
  };

  window.QWScene = {
    ok: canvasOk() && !!AT,
    preload: function () { if (this.ok) loadAtlas(function () {}); },
    preloadBg: function (slug) { if (STAGE[slug] && !STAGE[slug].globe) { var im = new Image(); im.decoding = 'async'; im.src = bgSrc(slug); } },
    mount: function (host, w, opts) { if (!this.ok) return null; try { return new Stage(host, w, opts); } catch (e) { return null; } },
    classify: classify, fxOf: fxOf
  };
})();
