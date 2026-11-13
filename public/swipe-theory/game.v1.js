/* Protect Pumpkin! a Swipe Theory game. Drag the shield with your finger (or mouse) and keep Pumpkin safe.
   8 worlds x 3 levels (each world ends on a twist) + Endless. Progress lives only in this browser (localStorage, try/catch). */
(function () {
  'use strict';
  var A = window.PPArt, S = window.PPAudio, TAU = Math.PI * 2;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
  var qs = location.search;

  // ------------------------------------------------------------------ storage (never throws)
  var KEY = 'protect-pumpkin-v1', mem = {};
  function load() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return mem; } }
  function save() { mem = save.data; try { window.localStorage.setItem(KEY, JSON.stringify(save.data)); } catch (e) { /* private mode etc. */ } }
  save.data = load(); if (!save.data.stars) save.data.stars = {};
  var data = save.data;

  // ------------------------------------------------------------------ worlds + levels
  var WORLDS = [
    { id: 'rain', name: 'Rainy Day', shield: 'umbrella', sky: ['#7fa6d6', '#cfe0f2'], hill: '#8fcf7a', ground: '#79c25a', ground2: '#5fa646', flowers: 1, storm: '#9aa9c4', tempo: 92,
      giant: 'raindrop', pre: 'ONE GIANT RAINDROP!', twist: 'IT MADE A RAINBOW!', say: 'so pretty :3', reward: 'rainbow',
      levels: [
        { cap: "IT'S STARTING TO RAIN!", dur: 22, wind: .08, sp: [['rain', 5, 9, { aim: .35 }]] },
        { cap: 'HEAVY RAIN!', dur: 26, wind: .25, treat: .08, sp: [['rain', 9, 15, { aim: .4 }]] },
        { cap: 'THUNDERSTORM!', dur: 30, wind: .42, treat: .07, thunder: 1, sp: [['rain', 13, 22, { aim: .45, spd: 1.12 }]] }] },
    { id: 'hail', name: 'Hailstorm', shield: 'umbrella2', sky: ['#8a86c9', '#d6d0f2'], hill: '#a3d98c', ground: '#86c766', ground2: '#68a94d', storm: '#a49fc8', tempo: 96,
      giant: 'hail', pre: 'A GIANT HAILSTONE!', twist: 'IT WAS ICE CREAM?!', say: 'brain freeze :3', reward: 'icecream',
      levels: [
        { cap: 'HAIL IS COMING!', dur: 24, wind: .1, sp: [['hail', 1.2, 2.2, { aim: .6 }], ['rain', 3, 5, { aim: .2 }]] },
        { cap: 'BIGGER HAIL!', dur: 28, wind: .3, treat: .07, sp: [['hail', 1.8, 3.2, { aim: .65, big: 1 }]] },
        { cap: 'HAIL AND WIND!', dur: 32, wind: .5, treat: .07, sp: [['hail', 2.4, 4, { aim: .7, spd: 1.12, big: 1 }], ['rain', 4, 6, { aim: .2 }]] }] },
    { id: 'snow', name: 'Snowball Fight', shield: 'mitten', sky: ['#8ccaf5', '#e6f4ff'], hill: '#f4f8ff', ground: '#ffffff', ground2: '#dbe9f7', trees: '#3fa36b', flakes: 1, cushion: '#7fb7ff', tempo: 100,
      giant: 'snow', pre: 'THE BIGGEST SNOWBALL!', twist: 'IT WAS A SNOWMAN!', say: 'he wants a hug!', reward: 'snowman',
      levels: [
        { cap: 'SNOWBALL FIGHT!', dur: 24, sp: [['snowball', .8, 1.5, { aim: .8 }]] },
        { cap: 'FROM BOTH SIDES!', dur: 28, treat: .07, sp: [['snowball', 1.2, 2.2, { aim: .8 }]] },
        { cap: 'GIANT SNOWBALLS!', dur: 32, treat: .07, sp: [['snowball', 1.4, 2.4, { aim: .8, spd: 1.1 }], ['bigsnow', .2, .45, { aim: 1 }]] }] },
    { id: 'wind', name: 'Wild Wind', shield: 'wood', sky: ['#8fdcff', '#fff1c1'], hill: '#9ad66f', ground: '#86c95a', ground2: '#6aad43', sun: 1, flowers: 1, tempo: 104,
      giant: 'box', pre: 'A MYSTERY BOX!', twist: 'A LOST KITTEN!', say: 'new friend!!', reward: 'kitten',
      levels: [
        { cap: 'WINDY DAY!', dur: 24, sp: [['wind', .8, 1.6, { aim: .7 }]] },
        { cap: 'STRONGER WIND!', dur: 28, treat: .07, sp: [['wind', 1.3, 2.4, { aim: .75, spd: 1.12 }]] },
        { cap: 'TORNADO!', dur: 32, treat: .07, tornado: 1, sp: [['tornado', 1.2, 2.2, { aim: .85 }], ['wind', .4, .8, { aim: .6 }]] }] },
    { id: 'meteor', name: 'Meteor Shower', shield: 'pan', sky: ['#1d1b4a', '#5a3d8a'], hill: '#3c2f6b', ground: '#4a3a7a', ground2: '#5b4a8f', stars: 1, moon: 1, cushion: '#ff9f43', tempo: 104,
      giant: 'meteor', pre: 'THE BIGGEST METEOR!', twist: 'IT WAS A FISH?!', say: 'best day ever :3', reward: 'fish',
      levels: [
        { cap: 'SHOOTING STARS?!', dur: 24, sp: [['meteor', .6, 1.1, { aim: .75 }]] },
        { cap: 'METEOR SHOWER!', dur: 28, treat: .07, sp: [['meteor', .9, 1.6, { aim: .8 }], ['pebble', .6, 1.2, { aim: .6 }]] },
        { cap: 'METEOR STORM!', dur: 32, treat: .07, sp: [['meteor', 1.2, 2, { aim: .85, spd: 1.12 }], ['pebble', 1, 1.6, { aim: .6 }]] }] },
    { id: 'volcano', name: 'Volcano Island', shield: 'metal', sky: ['#ff9a5a', '#ffd88a'], hill: '#f0b866', ground: '#f3d27a', ground2: '#ddb55c', volcano: 1, palm: 1, sun: 1, tempo: 108,
      giant: 'lava', pre: 'ONE GIANT LAVA BALL!', twist: 'THE VOLCANO MADE POPCORN!', say: 'nom nom nom', reward: 'popcorn',
      levels: [
        { cap: 'THE VOLCANO IS AWAKE!', dur: 24, sp: [['lava', .8, 1.4, { aim: .8 }]] },
        { cap: 'LAVA RAIN!', dur: 28, treat: .07, sp: [['lava', 1.1, 1.9, { aim: .8 }], ['rock', .3, .6, { aim: .8 }]] },
        { cap: 'BIG ERUPTION!', dur: 32, treat: .07, sp: [['lava', 1.6, 2.6, { aim: .85, spd: 1.1 }], ['rock', .5, .9, { aim: .8 }]] }] },
    { id: 'aliens', name: 'Alien Attack', shield: 'star', sky: ['#0f3b52', '#2f8a8f'], hill: '#1f5f66', ground: '#2c7a6e', ground2: '#3a9180', stars: 1, cushion: '#ffcc33', tempo: 112,
      giant: 'crate', pre: 'THE ALIENS SENT A BOX!', twist: 'THEY CAME FOR HIS BIRTHDAY!', say: 'aww thank u!', reward: 'cake',
      levels: [
        { cap: 'UFO SPOTTED!', dur: 24, ufo: 1, sp: [['bolt', .8, 1.4, { aim: .85 }]] },
        { cap: 'ALIEN GOO!', dur: 28, ufo: 1, treat: .07, sp: [['bolt', 1, 1.7, { aim: .85 }], ['goo', .5, 1, { aim: .5 }]] },
        { cap: 'TWO UFOS!', dur: 32, ufo: 2, treat: .07, sp: [['bolt', 1.4, 2.4, { aim: .9, spd: 1.12 }], ['goo', .7, 1.2, { aim: .5 }]] }] },
    { id: 'dragon', name: 'Impossible', shield: 'gold', sky: ['#3a1a4a', '#c2456a'], hill: '#5a2350', ground: '#6b2d5a', ground2: '#82396b', castle: 1, stars: 1, cushion: '#ffcc33', tempo: 116,
      giant: 'fireball', pre: "THE DRAGON'S BIGGEST FIREBALL!", twist: 'IT WAS LOVE ALL ALONG!', say: 'this is for you :3', reward: 'heart',
      levels: [
        { cap: 'A DRAGON?!', dur: 30, dragon: 1, sp: [['fireball', .8, 1.4, { aim: .85 }], ['meteor', .4, .8, { aim: .7 }]] },
        { cap: 'EVERYTHING AT ONCE!', dur: 34, dragon: 1, treat: .08, sp: [['fireball', .7, 1.2, { aim: .8 }], ['lava', .5, .9, { aim: .8 }], ['snowball', .5, .9, { aim: .8 }], ['hail', 1, 2, { aim: .6 }]] },
        { cap: 'IMPOSSIBLE!', dur: 38, dragon: 1, treat: .08, sp: [['fireball', 1, 1.8, { aim: .85, spd: 1.15 }], ['bolt', .5, .9, { aim: .85 }], ['meteor', .6, 1.1, { aim: .8 }], ['wind', .4, .9, { aim: .7 }], ['rain', 5, 9, { aim: .4 }]] }] }
  ];
  var NLEV = WORLDS.length * 3;
  function lvWorld(i) { return WORLDS[Math.floor(i / 3)]; }
  function lvDef(i) { return lvWorld(i).levels[i % 3]; }
  function lvName(i) { return (Math.floor(i / 3) + 1) + '-' + (i % 3 + 1); }
  function unlocked(i) { return i === 0 || (data.stars[i - 1] || 0) > 0 || qs.indexOf('unlockall') >= 0; }
  function endlessUnlocked() { return (data.stars[2] || 0) > 0 || qs.indexOf('unlockall') >= 0; }

  // ------------------------------------------------------------------ layout
  var W = 390, H = 700, GY = 630, scale = 1, dpr = 1, cssW = 390, cssH = 700;
  var bgCv = document.createElement('canvas'), bgCtx = bgCv.getContext('2d'), bgWorld = null;
  var CAT_S = .3;
  var cat = { x: 195, y: 620 };
  function resize() {
    var r = stage.getBoundingClientRect();
    cssW = Math.max(200, r.width); cssH = Math.max(300, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    scale = Math.min(cssW / 390, cssH / 700);
    W = cssW / scale; H = cssH / scale; GY = H - Math.min(90, H * .12);
    cat.x = W / 2; cat.y = GY - 4;
    bgWorld = null;
  }
  function renderBg(world) {
    bgCv.width = cv.width; bgCv.height = cv.height;
    bgCtx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    A.drawBg(bgCtx, W, H, GY, world, 0);
    bgWorld = world;
  }
  function headY() { return cat.y - 292 * CAT_S; }
  var hitC = function () { return [{ x: cat.x, y: cat.y - 292 * CAT_S, r: 122 * CAT_S }, { x: cat.x, y: cat.y - 130 * CAT_S, r: 104 * CAT_S }]; };

  // ------------------------------------------------------------------ state
  var G = {
    mode: 'menu', li: 0, endless: false, world: WORLDS[0], def: null, t: 0, hearts: 5, score: 0, blocked: 0, combo: 0, best: 0,
    objs: [], parts: [], acc: [], wind: 0, finaleOn: false, giantOut: false, twistT: 0, outT: 0, won: false, cap: null, capT: 0,
    say: null, sayT: 0, sayCd: 0, flash: 0, shake: 0, treatTold: false, ents: { tornado: null, ufos: [], dragon: null }, treatAcc: 0,
    thunderT: 3, endWorld: 0
  };
  var shield = { x: 195, y: 420, tx: 195, ty: 420, vx: 0, vy: 0, tilt: 0, hit: 0, show: false };
  var ptr = { down: false, type: 'mouse', x: 0, y: 0, id: null, inside: false, kb: false };
  var face = { blinkT: 2, blink: 0, scared: 0, hurt: 0, happy: 0, wet: 0, snow: 0, look: [0, 0], bounce: 0 };
  var keys = {};
  var timeScale = 1;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ------------------------------------------------------------------ HUD + overlays
  var hud = $('hud'), heartsEl = $('hearts'), scoreEl = $('score'), barEl = $('bar'), ttl = $('ttl');
  function heartSvg(fill) {
    return '<i class="ht"><svg viewBox="0 0 24 22"><defs><clipPath id="hc' + fill.id + '"><rect x="0" y="0" width="' + (24 * fill.f) + '" height="22"/></clipPath></defs>' +
      '<path d="M12 20.5C5 15 1.5 11.5 1.5 7A5 5 0 0112 4.6 5 5 0 0122.5 7c0 4.5-3.5 8-10.5 13.5z" fill="#3b3f52" stroke="#0b0d14" stroke-width="1.6"/>' +
      '<path clip-path="url(#hc' + fill.id + ')" d="M12 20.5C5 15 1.5 11.5 1.5 7A5 5 0 0112 4.6 5 5 0 0122.5 7c0 4.5-3.5 8-10.5 13.5z" fill="#ff4d6d" stroke="#0b0d14" stroke-width="1.6"/></svg></i>';
  }
  var lastHud = '';
  function drawHud() {
    var h = '', i;
    for (i = 0; i < 5; i++) h += heartSvg({ id: i, f: clamp(G.hearts - i, 0, 1) });
    var key = h + '|' + G.score;
    if (key !== lastHud) { heartsEl.innerHTML = h; scoreEl.textContent = G.score.toLocaleString('en-US'); lastHud = key; }
    var p = G.endless ? ((G.t % 25) / 25) : clamp(G.t / G.def.dur, 0, 1);
    barEl.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  function show(id, on) { $(id).hidden = !on; }
  function setTitle(s) { ttl.textContent = s; }
  // header: "< Games" link on the menu; in a level the "<" goes back to the menu (pauses first while playing), plus a Levels button
  function setNav(inGame) {
    var b = $('bBack');
    b.classList.toggle('icon', inGame); b.setAttribute('aria-label', inGame ? 'Back to menu' : 'All games');
    $('bLevels').hidden = !inGame;
  }

  // ------------------------------------------------------------------ level control
  function startLevel(i, endless) {
    G.endless = !!endless; G.li = i;
    G.world = endless ? WORLDS[0] : lvWorld(i);
    G.def = endless ? { cap: 'ENDLESS! HOW LONG CAN YOU LAST?', dur: 1e9, sp: [], treat: .1 } : lvDef(i);
    G.t = 0; G.hearts = 5; G.score = 0; G.blocked = 0; G.combo = 0; G.best = 0; G.objs = []; G.parts = []; G.acc = [];
    G.finaleOn = false; G.giantOut = false; G.twistT = 0; G.outT = 0; G.won = false; G.flash = 0; G.treatAcc = 0; G.thunderT = 4; G.endWorld = 0; G.rewardOn = false;
    G.ents = { tornado: null, ufos: [], dragon: null };
    face.hurt = 0; face.scared = 0; face.wet = 0; face.snow = 0; face.happy = 0;
    setupEnts();
    G.mode = 'ready';
    caption(G.def.cap, 2.6, 'y');
    say(G.endless ? "let's go!" : pick(['protect me pls!', 'help me!', 'u got this!', 'keep me safe?']), 2.2);
    setTitle(G.endless ? 'Endless' : lvName(i) + ' · ' + G.world.name);
    shield.x = shield.tx = cat.x; shield.y = shield.ty = Math.max(150, headY() - 215); shield.show = true;
    ['menu', 'levels', 'result', 'hold'].forEach(function (k) { show(k, false); });
    hud.hidden = false; $('bPause').hidden = false; setNav(true);
    drawHud();
  }
  function setupEnts() {
    var d = G.def, w = G.world;
    G.ents.tornado = d.tornado ? { x: W * .12, side: -1, sw: 0 } : null;
    G.ents.ufos = [];
    for (var k = 0; k < (d.ufo || 0); k++) G.ents.ufos.push({ ph: k * Math.PI, x: W / 2, y: 92 + k * 40 });
    G.ents.dragon = d.dragon ? { x: W / 2, y: 110, ph: 0 } : null;
  }
  function beginPlay() {
    if (G.mode !== 'ready') return;
    G.mode = 'play';
    S.startMusic(G.world.tempo);
  }
  function caption(text, dur, kind) { G.cap = { text: text, kind: kind || 'y' }; G.capT = dur; }
  function say(text, dur, force) {
    if (!force && G.sayCd > 0) return;
    G.say = text; G.sayT = dur || 1.6; G.sayCd = (dur || 1.6) + .6;
  }

  // ------------------------------------------------------------------ spawning
  function target(aim, spread) {
    if (Math.random() < aim) return [cat.x + rnd(-1, 1) * (spread || 26), headY() + rnd(-20, 50)];
    var side = Math.random() < .5 ? -1 : 1;
    return [cat.x + side * rnd(70, W * .5), GY];
  }
  function ballistic(x0, y0, tx, ty, T, g) { return [(tx - x0) / T, (ty - y0 - .5 * g * T * T) / T]; }
  function mk(kind, x, y, vx, vy, r, dmg, extra) {
    var o = { kind: kind, x: x, y: y, vx: vx, vy: vy, g: 0, r: r, dmg: dmg, rot: rnd(0, TAU), vr: rnd(-3, 3), blocked: false, fade: null, seed: Math.random() * 10,
      jag: [rnd(.8, 1.1), rnd(.8, 1.1), rnd(.8, 1.1), rnd(.8, 1.1), rnd(.8, 1.1), rnd(.8, 1.1)] };
    if (extra) for (var k in extra) o[k] = extra[k];
    G.objs.push(o); return o;
  }
  function spawn(type, o) {
    var aim = o.aim == null ? .6 : o.aim, spd = (o.spd || 1) * (G.endless ? Math.min(1.5, 1 + G.t / 240) : 1), tg, vx, vy, x0, y0, T, v, d;
    switch (type) {
      case 'rain': case 'hail': {
        var hail = type === 'hail';
        vy = (hail ? 300 : 400) * spd * rnd(.9, 1.1);
        vx = G.wind * vy + (hail ? rnd(-50, 50) : 0);
        y0 = -20; T = (headY() - y0) / vy;
        if (Math.random() < aim) x0 = cat.x + rnd(-30, 30) - vx * T;
        else x0 = rnd(-.15 * W, 1.15 * W) - vx * T;
        if (hail) { var big = o.big && Math.random() < .3; mk('hail', x0, y0, vx, vy, big ? rnd(10, 12) : rnd(6, 8.5), big ? .75 : .5); }
        else mk('drop', x0, y0, vx, vy, 3, .2);
        return;
      }
      case 'snowball': {
        var sd = Math.random() < .5 ? -1 : 1; x0 = sd < 0 ? -20 : W + 20; y0 = GY - rnd(90, 300);
        tg = target(aim, 22); T = rnd(1.0, 1.45) / spd;
        v = ballistic(x0, y0, tg[0], tg[1], T, 420); mk('snow', x0, y0, v[0], v[1], rnd(9, 11), .5, { g: 420 });
        return;
      }
      case 'bigsnow': {
        tg = target(aim, 20); x0 = rnd(.1, .9) * W; y0 = -30; T = (tg[1] - y0) / (200 * spd);
        mk('bigsnow', x0, y0, (tg[0] - x0) / T, 200 * spd, 17, 1); return;
      }
      case 'wind': {
        var ws = Math.random() < .5 ? -1 : 1; x0 = ws < 0 ? -30 : W + 30;
        y0 = Math.random() < aim ? rnd(headY() - 25, cat.y - 30) : rnd(H * .15, GY - 170);
        var kinds = [['leaf', 10, .25], ['sock', 11, .5], ['duck', 11, .5], ['boot', 12, 1], ['pot', 12, 1]], kd = pick(kinds);
        mk(kd[0], x0, y0, -ws * rnd(150, 220) * spd, 0, kd[1], kd[2], { bob: rnd(20, 50), bobF: rnd(2, 4), y0: y0, age: 0, vr: rnd(-5, 5) });
        return;
      }
      case 'tornado': {
        var tor = G.ents.tornado; if (!tor) return;
        x0 = tor.x; y0 = GY - rnd(60, 200);
        tg = target(aim, 22); T = rnd(.9, 1.25) / spd;
        var k2 = pick([['leaf', 10, .25], ['sock', 11, .5], ['duck', 11, .5], ['boot', 12, 1], ['pot', 12, 1]]);
        v = ballistic(x0, y0, tg[0], tg[1], T, 300); mk(k2[0], x0, y0, v[0], v[1], k2[1], k2[2], { g: 300, vr: rnd(-8, 8) });
        return;
      }
      case 'meteor': case 'pebble': case 'fireball': case 'rock': {
        var r = type === 'meteor' ? rnd(11, 15) : type === 'pebble' ? 5.5 : type === 'rock' ? rnd(9, 12) : 13;
        var sp = (type === 'pebble' ? 340 : type === 'fireball' ? 320 : type === 'rock' ? 240 : 250) * spd * rnd(.9, 1.1);
        tg = target(aim, 24);
        if (type === 'fireball' && G.ents.dragon) { x0 = G.ents.dragon.x; y0 = G.ents.dragon.y + 10; }
        else { x0 = rnd(-.3, 1.3) * W; y0 = -30; }
        d = Math.hypot(tg[0] - x0, tg[1] - y0);
        mk(type, x0, y0, (tg[0] - x0) / d * sp, (tg[1] - y0) / d * sp, r, type === 'pebble' ? .34 : 1);
        return;
      }
      case 'lava': {
        if (G.world.volcano) { x0 = W * .2 + rnd(-12, 12); y0 = GY - 190; }
        else { x0 = Math.random() < .5 ? -10 : W + 10; y0 = GY - 40; }
        tg = target(aim, 24); T = rnd(1.35, 1.85) / spd;
        v = ballistic(x0, y0, tg[0], tg[1], T, 380); mk('lava', x0, y0, v[0], v[1], rnd(9, 12.5), 1, { g: 380 });
        return;
      }
      case 'bolt': case 'goo': {
        var u = G.ents.ufos.length ? pick(G.ents.ufos) : null;
        x0 = u ? u.x : rnd(.1, .9) * W; y0 = u ? u.y + 16 : -20;
        if (type === 'bolt') { tg = target(aim, 20); d = Math.hypot(tg[0] - x0, tg[1] - y0); sp = 290 * spd; mk('bolt', x0, y0, (tg[0] - x0) / d * sp, (tg[1] - y0) / d * sp, 5.5, .5); }
        else { mk('goo', x0, y0, rnd(-30, 30), 60, 9, .5, { g: 260 }); }
        return;
      }
    }
  }
  function spawnTreat() {
    var x0 = cat.x + rnd(-14, 14);
    mk('treat', x0, -24, 0, 130, 12, 0, { treat: true });
    if (!G.treatTold) { G.treatTold = true; caption("A FISH! LET IT THROUGH!", 2.4, 'p'); }
  }
  function spawnGiant() {
    var w = G.world;
    G.giantOut = true;
    var o = mk('giant', cat.x, -50, 0, 70, 34, 0, { giant: w.giant });
    caption(w.pre, 3, 'p');
    say(pick(['uh oh...', 'oh no...', 'w-what is that?!']), 2.2, true);
    return o;
  }

  // endless: cycle worlds every 25 s, mixing in earlier threats
  var ENDLESS_SP = {
    rain: [['rain', 12, 0, { aim: .42 }]], hail: [['hail', 2.6, 0, { aim: .65, big: 1 }]], snow: [['snowball', 1.8, 0, { aim: .8 }], ['bigsnow', .3, 0, { aim: 1 }]],
    wind: [['wind', 1.4, 0, { aim: .75 }], ['tornado', 1, 0, { aim: .8 }]], meteor: [['meteor', 1.3, 0, { aim: .8 }], ['pebble', 1, 0, { aim: .6 }]],
    volcano: [['lava', 1.8, 0, { aim: .82 }], ['rock', .5, 0, { aim: .8 }]], aliens: [['bolt', 1.6, 0, { aim: .85 }], ['goo', .8, 0, { aim: .5 }]],
    dragon: [['fireball', 1.3, 0, { aim: .85 }], ['meteor', .6, 0, { aim: .8 }]]
  };
  function endlessUpdate() {
    var wi = Math.floor(G.t / 25) % WORLDS.length, loop = Math.floor(G.t / (25 * WORLDS.length));
    if (wi !== G.endWorld || G.world !== WORLDS[wi]) {
      G.endWorld = wi; G.world = WORLDS[wi];
      var d = G.def; d.tornado = G.world.id === 'wind'; d.ufo = G.world.id === 'aliens' ? 1 + (loop > 0 ? 1 : 0) : 0; d.dragon = G.world.id === 'dragon';
      d.thunder = G.world.id === 'rain';
      setupEnts();
      var sp = ENDLESS_SP[G.world.id].slice();
      if (G.t > 25) { var prev = ENDLESS_SP[WORLDS[(wi + WORLDS.length - 1) % WORLDS.length].id][0]; sp.push([prev[0], prev[1] * .4, 0, prev[3]]); }
      d.sp = sp; G.acc = [];
      G.wind = 0;
      if (G.t > 1) { caption(G.world.name.toUpperCase() + '!', 2.2, 'y'); S.stopMusic(); S.startMusic(G.world.tempo); }
    }
  }

  // ------------------------------------------------------------------ particles
  function burst(x, y, n, cols, sp, life, g, size) {
    for (var i = 0; i < n && G.parts.length < 500; i++) {
      var a = rnd(0, TAU), v = rnd(.3, 1) * sp;
      G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, g: g == null ? 500 : g, life: life * rnd(.6, 1), max: life, col: pick(cols), r: (size || 3) * rnd(.6, 1.2), type: 'dot' });
    }
  }
  function popText(txt, x, y, col) { G.parts.push({ x: x, y: y, vx: 0, vy: -50, g: 0, life: .9, max: .9, txt: txt, col: col || '#ffe14d', type: 'text' }); }
  function rainParts(kind, n) {
    for (var i = 0; i < n; i++) {
      G.parts.push({ x: rnd(0, W), y: rnd(-H * .6, -10), vx: rnd(-20, 20), vy: rnd(90, 160), g: 30, life: 6, max: 6, col: kind === 'heart' ? pick(['#ff5c9a', '#ff8fae', '#ff4d6d']) : kind === 'popcorn' ? '#fff3c4' : pick(['#ff5a6e', '#ffe14d', '#3fb3ff', '#5cd65c', '#9e73ff']),
        r: kind === 'conf' ? 5 : 9, type: kind, rot: rnd(0, TAU), vr: rnd(-4, 4) });
    }
  }

  // ------------------------------------------------------------------ update
  function step(dt) {
    var d = G.def, w = G.world, i, o;
    var playing = G.mode === 'play';
    if (playing) {
      G.t += dt;
      if (G.endless) endlessUpdate();
      var p = clamp(G.t / d.dur, 0, 1), spawning = G.t < d.dur;
      // wind (rain/hail slant)
      var wa = d.wind || 0;
      G.wind = wa * Math.sin(G.t * .45 + .6) + wa * .45 * Math.sin(G.t * 1.3);
      if (G.endless && (w.id === 'rain' || w.id === 'hail')) G.wind = .3 * Math.sin(G.t * .5);
      if (spawning) {
        for (i = 0; i < d.sp.length; i++) {
          var s = d.sp[i], rate = G.endless ? s[1] * Math.min(2.2, 1 + G.t / 200) * (.8 + .4 * Math.sin(G.t * .7 + i)) : s[1] + (s[2] - s[1]) * p;
          if (d.thunder && !G.endless) rate *= 1 + .5 * Math.max(0, Math.sin(G.t * .8));   // gusts
          G.acc[i] = (G.acc[i] || 0) + rate * dt;
          while (G.acc[i] >= 1) { G.acc[i] -= 1; spawn(s[0], s[3] || {}); }
        }
        if (d.treat && G.t > 4) { G.treatAcc += d.treat * dt; if (G.treatAcc >= 1) { G.treatAcc = 0; spawnTreat(); } }
        if (d.thunder) { G.thunderT -= dt; if (G.thunderT <= 0) { G.thunderT = rnd(5, 9); G.flash = .28; S.thunder(); } }
      } else if (!G.endless) {
        var live = 0; for (i = 0; i < G.objs.length; i++) if (!G.objs[i].blocked && !G.objs[i].treat) live++;
        if (G.li % 3 === 2) { if (!G.giantOut && live === 0) spawnGiant(); }
        else if (live === 0) endLevel(true);
      }
    }
    // entities
    var tor = G.ents.tornado;
    if (tor) { tor.sw += dt; if (Math.floor(tor.sw / 6) % 2) { tor.x += (W * .88 - tor.x) * Math.min(1, dt * 1.5); } else { tor.x += (W * .12 - tor.x) * Math.min(1, dt * 1.5); } }
    G.ents.ufos.forEach(function (u) { u.ph += dt * .8; u.x = W / 2 + Math.sin(u.ph) * W * .36; });
    var dr = G.ents.dragon; if (dr) { dr.ph += dt * .6; dr.x = W / 2 + Math.sin(dr.ph) * W * .34; dr.y = 105 + Math.sin(dr.ph * 2.3) * 14; }

    // shield follows the finger (smoothed, frame-rate independent)
    if (ptr.kb) {
      var kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0), ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
      shield.tx = clamp(shield.tx + kx * 380 * dt, 10, W - 10); shield.ty = clamp(shield.ty + ky * 380 * dt, 30, GY - 20);
    }
    var k = 1 - Math.exp(-dt * 38), ox = shield.x, oy = shield.y;
    shield.x += (shield.tx - shield.x) * k; shield.y += (shield.ty - shield.y) * k;
    shield.vx = (shield.x - ox) / dt; shield.vy = (shield.y - oy) / dt;
    shield.tilt += (clamp(shield.vx * .0009, -.45, .45) - G.wind * .5 - shield.tilt) * Math.min(1, dt * 10);
    shield.hit = Math.max(0, shield.hit - dt * 6);

    // objects
    var SH = A.SHIELDS[w.shield], R = SH.R, circles = hitC(), near = 1e9;
    for (i = G.objs.length - 1; i >= 0; i--) {
      o = G.objs[i];
      if (o.bob) { o.age += dt; o.vy = Math.cos(o.age * o.bobF) * o.bob; }
      o.vy += o.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
      if (o.blocked) {
        o.fade -= dt * 1.6;
        if (o.fade <= 0 || o.y > H + 40) G.objs.splice(i, 1);
        continue;
      }
      if (G.mode === 'twist' || G.mode === 'out') { if (o.kind !== 'giant') { o.blocked = true; o.fade = .6; } continue; }
      // shield
      if (shield.show && G.mode !== 'ready') {
        var dx = o.x - shield.x, dy = o.y - shield.y, rr = R + o.r, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && (!SH.dome || dy < R * .3)) {
          var dd = Math.sqrt(d2) || 1, nx = dx / dd, ny = dy / dd, rvx = o.vx - shield.vx * .5, rvy = o.vy - shield.vy * .5, vn = rvx * nx + rvy * ny;
          if (vn < 40) { onBlock(o, nx, ny, vn); if (o.kind === 'drop') { G.objs.splice(i, 1); } continue; }
        }
      }
      // Pumpkin
      var hitCat = false;
      for (var c = 0; c < circles.length; c++) {
        var cx = o.x - circles[c].x, cy = o.y - circles[c].y, cr = circles[c].r + o.r;
        if (cx * cx + cy * cy < cr * cr) { hitCat = true; break; }
        if (!o.treat) { var dist = Math.sqrt(cx * cx + cy * cy); if (dist < near && (o.vx * cx + o.vy * cy) < 0) near = dist; }
      }
      if (hitCat) { onCatHit(o); G.objs.splice(i, 1); continue; }
      if (o.y > GY + 2 && o.vy > 0) {
        if (o.kind === 'drop') { if (Math.random() < .3) burst(o.x, GY, 2, ['#9fd3ff'], 60, .25, 400, 1.6); }
        else if (o.kind === 'lava') burst(o.x, GY, 6, ['#ff6a1a', '#ffd34d'], 120, .4, 500, 2.5);
        else burst(o.x, GY, 4, ['rgba(255,255,255,.8)'], 80, .3, 300, 2.5);
        G.objs.splice(i, 1); continue;
      }
      if (o.x < -90 || o.x > W + 90 || o.y > H + 60) G.objs.splice(i, 1);
    }
    // face
    face.scared += ((near < 120 && G.mode === 'play' ? 1 : 0) - face.scared) * Math.min(1, dt * 8);
    face.hurt = Math.max(0, face.hurt - dt);
    face.happy = Math.max(0, face.happy - dt);
    face.bounce = Math.max(0, face.bounce - dt * 3);
    face.blinkT -= dt; if (face.blinkT <= 0) { face.blink = .14; face.blinkT = rnd(2.2, 4.2); }
    face.blink = Math.max(0, face.blink - dt);
    // particles
    for (i = G.parts.length - 1; i >= 0; i--) {
      var q = G.parts[i]; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.rot != null) q.rot += q.vr * dt;
      if (q.life <= 0 || q.y > H + 20) G.parts.splice(i, 1);
    }
    if (w.flakes && Math.random() < dt * 8 && G.parts.length < 480) G.parts.push({ x: rnd(0, W), y: -6, vx: rnd(-10, 10), vy: rnd(25, 50), g: 0, life: 20, max: 20, col: 'rgba(255,255,255,.95)', r: rnd(1.5, 3), type: 'dot' });
    G.capT -= dt; G.sayT -= dt; G.sayCd -= dt; G.flash = Math.max(0, G.flash - dt * 1.6); G.shake = Math.max(0, G.shake - dt * 4);
    if (G.rewardOn) G.twistT += dt;
    if (G.mode === 'twist') { if (G.twistT > 4.2) endLevel(true); }
    if (G.mode === 'out') { G.outT -= dt; if (G.outT <= 0) showResult(); }
  }

  function onBlock(o, nx, ny, vn) {
    var w = G.world;
    shield.hit = 1;
    if (o.kind === 'giant') { reveal(o); return; }
    if (o.treat) {
      o.blocked = true; o.fade = 1; o.g = 500; o.vx = nx * 160 + rnd(-40, 40); o.vy = -180;
      say(pick(['my fish!!', 'noo my snack!', 'hey! that was mine']), 1.6, true); S.bonk();
      return;
    }
    G.blocked++; G.combo++; G.best = Math.max(G.best, G.combo);
    G.score += 10 * (1 + Math.floor(G.combo / 10));
    if (o.kind === 'drop') {
      burst(o.x, o.y, 3, ['#bfe6ff', '#ffffff'], 90, .3, 500, 1.8); S.block(G.combo, true); return;
    }
    o.blocked = true; o.fade = 1;
    var e = .55;
    var px = nx * (shield.x + nx * 0), vxr = o.vx - (1 + e) * vn * nx + shield.vx * .4, vyr = o.vy - (1 + e) * vn * ny + shield.vy * .3;
    o.vx = vxr; o.vy = Math.min(vyr, -60); o.g = Math.max(o.g, 600); o.vr = rnd(-10, 10); o.bob = 0;
    var cols = o.kind === 'lava' ? ['#ff6a1a', '#ffd34d'] : o.kind === 'bolt' || o.kind === 'goo' ? ['#7ee04f', '#eaffd0'] : o.kind === 'meteor' || o.kind === 'fireball' || o.kind === 'pebble' ? ['#ffb13d', '#ff6a1a', '#fff3b0'] : ['#ffffff', '#cfe8ff'];
    burst(o.x, o.y, o.kind === 'meteor' || o.kind === 'fireball' ? 12 : 6, cols, 160, .45, 500, 2.6);
    if (o.kind === 'hail' || o.kind === 'meteor' || o.kind === 'rock' || o.kind === 'fireball' || o.kind === 'bigsnow') { o.fade = .5; }
    if (w.shield === 'pan' || o.kind === 'meteor' || o.kind === 'boot' || o.kind === 'pot') {
      S.bonk(); if (Math.random() < .35) popText(pick(['BONK!', 'CLANG!', 'BOINK!']), o.x, o.y - 14);
    } else S.block(G.combo);
    if (G.combo === 10) { say('purr~', 1.4, true); S.purr(); face.happy = 1.4; }
    else if (G.combo === 25) { say('my hero!!', 1.6, true); face.happy = 1.6; }
    else if (G.combo > 0 && G.combo % 40 === 0) { say(pick(['ur the best :3', 'thank u :3', 'wow!!']), 1.6, true); face.happy = 1.5; S.purr(); }
  }
  function onCatHit(o) {
    if (o.kind === 'giant') { reveal(o); return; }
    if (o.treat) {
      G.hearts = Math.min(5, G.hearts + .5); G.score += 50; face.happy = 1.2; face.bounce = 1;
      burst(o.x, o.y, 10, ['#ffe14d', '#ffb347', '#ffffff'], 140, .5, 200, 2.6);
      popText('+50', cat.x, headY() - 50, '#ffe14d');
      say(pick(['yum!', 'fishy!! :3', 'nom nom']), 1.4, true); S.yum();
      return;
    }
    G.hearts = Math.max(0, G.hearts - o.dmg); G.combo = 0;
    var big = o.dmg >= .5;
    if (o.kind === 'drop') { face.wet = Math.min(1, face.wet + .06); burst(o.x, o.y, 3, ['#9fd3ff'], 80, .3, 400, 1.8); if (Math.random() < .25) S.meow(820, .2, .25, true); }
    else {
      face.hurt = .7; G.shake = big ? 1 : .5;
      if (o.kind === 'snow' || o.kind === 'bigsnow') face.snow = 1;
      burst(o.x, o.y, 10, o.kind === 'lava' ? ['#ff6a1a', '#ffd34d'] : ['#ffffff', '#ffd1e1'], 150, .45, 500, 2.6);
      S.hit();
      say(pick(['MEOW!', 'ow!!', 'hey!!', 'not the face!', 'mrrp!']), 1.2, true);
    }
    if (G.hearts <= 0.001) lose();
  }
  function reveal(o) {
    var w = G.world;
    o.blocked = true; o.fade = 0; G.objs.splice(G.objs.indexOf(o), 1);
    G.mode = 'twist'; G.twistT = 0; G.rewardOn = true;
    burst(o.x, o.y, 30, ['#ffffff', '#ffe14d', '#ff8fae', '#9fd3ff'], 260, .8, 300, 3.5);
    S.crack(); setTimeout(S.sparkle, 200);
    caption(w.twist, 4.2, 'p');
    say(w.say, 3.6, true); face.happy = 4; face.bounce = 1;
    if (w.reward === 'popcorn') rainParts('popcorn', 50);
    else if (w.reward === 'heart') rainParts('heart', 40);
    else rainParts('conf', 46);
    G.objs.forEach(function (x) { x.blocked = true; x.fade = .5; });
  }
  function endLevel(win) {
    if (G.mode === 'out') return;
    G.won = win; G.mode = 'out'; G.outT = win ? .9 : 1.6;
    if (win && G.li % 3 !== 2) { caption('PUMPKIN IS SAFE!', 2, 'y'); say('thank u :3', 1.6, true); face.happy = 2; }
    S.stopMusic(); S.jingle(win);
  }
  function lose() {
    if (G.endless) { G.won = false; G.mode = 'out'; G.outT = 1.6; caption('OUCH! GAME OVER', 2, 'p'); S.stopMusic(); S.jingle(false); return; }
    G.won = false; G.mode = 'out'; G.outT = 1.6; caption('OH NO! TRY AGAIN!', 2, 'p'); say('ow...', 1.6, true); S.stopMusic(); S.jingle(false);
  }
  function starsFor(h) { return h >= 3.999 ? 3 : h >= 1.999 ? 2 : 1; }
  function showResult() {
    G.mode = 'result'; shield.show = false; hud.hidden = true; $('bPause').hidden = true;
    var card = $('rcard'), st = G.won ? starsFor(G.hearts) : 0, i;
    card.className = 'card' + (G.won ? ' win' : '');
    var rs = $('rstars').children; for (i = 0; i < 3; i++) rs[i].className = '';
    $('rstars').hidden = G.endless;
    if (G.endless) {
      var secs = Math.floor(G.t), best = data.endless || 0, nb = G.score > best;
      if (nb) { data.endless = G.score; save(); }
      $('rtitle').textContent = nb ? 'New best!' : 'Game over';
      $('rline').textContent = 'You lasted ' + secs + ' s, blocked ' + G.blocked + ' and scored ' + G.score.toLocaleString('en-US') + '.';
      $('rbest').textContent = 'Best: ' + Math.max(best, G.score).toLocaleString('en-US');
      $('rquote').textContent = '"' + pick(['again? :3', 'u did so good!', 'one more round?']) + '" - Pumpkin';
      $('bNext').hidden = true; $('bRetry').textContent = 'Play again'; $('bRetry').classList.add('hot');
    } else {
      var prev = data.stars[G.li] || 0;
      if (G.won && st > prev) { data.stars[G.li] = st; save(); }
      var w = G.world, last = G.li === NLEV - 1;
      $('rtitle').textContent = G.won ? (G.li % 3 === 2 ? (last ? 'You beat Protect Pumpkin!' : w.name + ' complete!') : 'Pumpkin is safe!') : 'Pumpkin got bonked!';
      $('rline').textContent = G.won ? ('Blocked ' + G.blocked + ' · Best combo ' + G.best + ' · Hearts ' + (Math.round(G.hearts * 2) / 2) + '/5') : ('You blocked ' + G.blocked + '. Keep the shield between Pumpkin and the danger!');
      $('rbest').textContent = G.won && G.li % 3 === 2 ? (last ? 'Now try Endless mode!' : 'Next world: ' + WORLDS[Math.floor(G.li / 3) + 1].name) : (G.won && st < 3 ? 'Lose at most 1 heart for 3 stars.' : '');
      $('rquote').textContent = G.won ? '"' + (G.li % 3 === 2 ? w.say : pick(['thank u :3', 'my hero!', 'purr~', 'ur the best :3'])) + '" - Pumpkin' : '"' + pick(['ow... try again?', 'u can do it!', 'one more time pls!']) + '" - Pumpkin';
      $('bNext').hidden = !(G.won && G.li < NLEV - 1);
      $('bNext').textContent = 'Next';
      $('bRetry').textContent = G.won ? 'Retry' : 'Try again'; $('bRetry').classList.toggle('hot', !G.won);
      if (G.won && last) { $('bNext').hidden = false; $('bNext').textContent = 'Endless'; }
      setTimeout(function () { for (var j = 0; j < 3; j++) if (j < st) rs[j].className = 'on'; }, 150);
    }
    show('result', true);
  }

  // ------------------------------------------------------------------ render
  function catPose() {
    var P = A.catState(), sc = face.scared, hu = face.hurt > 0;
    var tx = shield.x - cat.x, ty = shield.y - headY(), dl = Math.hypot(tx, ty) || 1;
    P.pup = [clamp(tx / dl, -1, 1) * .9, clamp(ty / dl, -1, 1) * .8];
    P.sway = Math.sin(now * 1.8); P.tail = .2 + .3 * Math.sin(now * .9);
    P.wet = face.wet; P.snow = face.snow;
    if (hu) { P.eye = 0; P.closed = 'squeeze'; P.mouth = 'scream'; P.mo = .7; P.ear = -.9; P.paws = Math.min(1, face.hurt * 2); P.htilt = Math.sin(now * 40) * .06; }
    else if (G.mode === 'out' && !G.won) { P.eye = 0; P.closed = 'x'; P.mouth = 'open'; P.mo = .2; P.ear = -.7; P.htilt = .15; }
    else if (face.happy > 0 || G.mode === 'twist' || G.mode === 'result' && G.won) { P.eye = 0; P.closed = 'happy'; P.mouth = 'smile'; P.blush = 1; P.ear = .4; P.tail = .8; }
    else if (sc > .3) { P.eye = 1; P.pupR = .12; P.brow = sc; P.mouth = 'open'; P.mo = .25 + .2 * sc; P.ear = -.7 * sc; P.sweat = sc; P.paws = 0; }
    else if (G.mode === 'menu' || G.mode === 'ready') { P.mouth = 'w'; P.blush = .4; P.pupR = .5; }
    if (face.blink > 0 && P.eye > .5) P.eye = .05, P.closed = 'sleep';
    P.sq = 1 + .07 * Math.sin(face.bounce * Math.PI * 2) * face.bounce;
    return P;
  }
  var now = 0;
  function drawEnts(c) {
    var w = G.world, i;
    if (w.storm || G.def && G.def.thunder) {  // storm clouds along the top
      for (i = 0; i < 6; i++) A.cloud(c, ((i * 92 + now * 8) % (W + 120)) - 60, 18 + (i % 2) * 22, 1.25, w.storm || '#9aa9c4');
    } else if (!w.stars) {
      for (i = 0; i < 3; i++) A.cloud(c, ((i * 170 + now * 6) % (W + 140)) - 70, 70 + i * 34, .8, '#ffffff');
    }
    if (w.volcano) {
      var vx = W * .2, vt = GY - 190;
      c.drawImage(A.glow('rgba(255,140,40,.6)'), vx - 50, vt - 50, 100, 100);
      for (i = 0; i < 3; i++) { var ph = (now * .4 + i / 3) % 1; c.globalAlpha = .55 * (1 - ph); c.beginPath(); c.arc(vx + Math.sin(i * 2 + now) * 10, vt - 20 - ph * 90, 12 + ph * 22, 0, TAU); c.fillStyle = '#7d7480'; c.fill(); }
      c.globalAlpha = 1;
    }
    var tor = G.ents.tornado;
    if (tor) {
      for (i = 0; i < 9; i++) {
        var yy = GY - i * 26, rw = 10 + i * 9, off = Math.sin(now * 6 + i * .7) * (6 + i * 1.5);
        c.beginPath(); c.ellipse(tor.x + off, yy, rw, 7 + i * .8, 0, 0, TAU); c.fillStyle = 'rgba(120,130,150,.55)'; c.fill();
        c.strokeStyle = 'rgba(11,13,20,.35)'; c.lineWidth = 2; c.stroke();
      }
    }
    G.ents.ufos.forEach(function (u) {
      c.save(); c.translate(u.x, u.y);
      c.beginPath(); c.moveTo(-14, 6); c.lineTo(14, 6); c.lineTo(30, 60); c.lineTo(-30, 60); c.closePath(); c.fillStyle = 'rgba(160,255,190,.16)'; c.fill();
      c.beginPath(); c.ellipse(0, -6, 18, 16, 0, Math.PI, 0); A.fs(c, '#bdf0ff', 3);
      c.beginPath(); c.ellipse(0, 2, 40, 12, 0, 0, TAU); A.fs(c, '#9e73ff', 3);
      for (var j = -2; j <= 2; j++) { c.beginPath(); c.arc(j * 14, 4, 3, 0, TAU); c.fillStyle = (Math.floor(now * 6) + j) % 2 ? '#ffe14d' : '#7ee04f'; c.fill(); }
      c.beginPath(); c.arc(0, -10, 5, 0, TAU); c.fillStyle = '#7ee04f'; c.fill();
      c.restore();
    });
    var dr = G.ents.dragon;
    if (dr) {
      c.save(); c.translate(dr.x, dr.y); var fl = Math.sin(now * 9) * .5;
      var dir = Math.cos(dr.ph) >= 0 ? 1 : -1; c.scale(dir, 1);
      for (var s = -1; s <= 1; s += 2) { c.save(); c.rotate(s * (.3 + fl * .5) - (s > 0 ? 0 : 0)); c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(s * 30, -40, s * 52, -26); c.quadraticCurveTo(s * 34, -14, s * 40, 0); c.quadraticCurveTo(s * 20, -6, 0, 4); c.closePath(); A.fs(c, '#a78bfa', 3); c.restore(); }
      c.beginPath(); c.ellipse(0, 6, 26, 16, 0, 0, TAU); A.fs(c, '#7dd87d', 3);
      c.beginPath(); c.ellipse(26, -6, 16, 12, 0, 0, TAU); A.fs(c, '#7dd87d', 3);
      c.beginPath(); c.arc(30, -9, 3.5, 0, TAU); c.fillStyle = A.INK; c.fill();
      c.beginPath(); c.moveTo(-24, 8); c.quadraticCurveTo(-46, 20, -50, 4); c.strokeStyle = A.INK; c.lineWidth = 7; c.stroke(); c.strokeStyle = '#7dd87d'; c.lineWidth = 4; c.stroke();
      c.beginPath(); c.moveTo(20, -16); c.lineTo(22, -26); c.lineTo(27, -17); c.closePath(); A.fs(c, '#ffe14d', 2);
      c.restore();
    }
  }
  function render() {
    var w = G.world;
    if (bgWorld !== w) renderBg(w);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgCv, 0, 0);
    var sx = G.shake > 0 ? Math.sin(now * 70) * 4 * G.shake : 0;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, sx * dpr, 0);
    var c = ctx, i, o;
    if (G.rewardOn && w.reward === 'rainbow') A.rainbow(c, W / 2, GY + 10, Math.min(W * .48, 230), Math.min(1, G.twistT * 1.5));
    drawEnts(c);
    // Pumpkin
    var P = catPose(), hop = face.bounce > 0 ? -Math.sin(face.bounce * Math.PI) * 10 : 0;
    A.drawCat(c, cat.x + (face.hurt > 0 ? Math.sin(now * 50) * 3 : 0), cat.y + hop, CAT_S, P);
    if (G.rewardOn && w.reward !== 'rainbow') {
      var k = Math.min(1, G.twistT * 2.2), bob = Math.sin(now * 3) * 3;
      A.drawReward(c, w.reward, cat.x + 70, cat.y - 34 - (1 - k) * 120 + bob, .9 * (.4 + .6 * k), now);
    }
    // rain drops batched
    c.beginPath();
    for (i = 0; i < G.objs.length; i++) { o = G.objs[i]; if (o.kind !== 'drop') continue; c.moveTo(o.x, o.y); c.lineTo(o.x - o.vx * .035, o.y - o.vy * .035); }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(11,13,20,.35)'; c.lineWidth = 4.6; c.stroke(); c.strokeStyle = '#7cc6ff'; c.lineWidth = 2.6; c.stroke();
    for (i = 0; i < G.objs.length; i++) { o = G.objs[i]; if (o.kind !== 'drop') A.drawObj(c, o, now); }
    // shield + finger marker
    if (shield.show && (G.mode === 'play' || G.mode === 'ready' || G.mode === 'hold' || G.mode === 'twist' || G.mode === 'out')) {
      if (ptr.type !== 'mouse' && ptr.down && !ptr.kb) {
        c.setLineDash([3, 6]); c.beginPath(); c.moveTo(ptr.x, ptr.y); c.lineTo(shield.x, shield.y + 30); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(ptr.x, ptr.y, 20, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.stroke();
      }
      A.drawShield(c, w.shield, shield.x, shield.y, shield.tilt, shield.hit);
    }
    // particles
    for (i = 0; i < G.parts.length; i++) {
      var q = G.parts[i], a = clamp(q.life / q.max * 1.6, 0, 1);
      c.globalAlpha = a;
      if (q.type === 'dot') { c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill(); }
      else if (q.type === 'conf') { c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.col; c.fillRect(-q.r, -q.r * .5, q.r * 2, q.r); c.restore(); }
      else if (q.type === 'popcorn') { c.beginPath(); c.arc(q.x, q.y, 6, 0, TAU); c.arc(q.x + 5, q.y - 3, 5, 0, TAU); A.fs(c, q.col, 1.5); }
      else if (q.type === 'heart') { A.heart(c, q.x, q.y, 8, q.col, 1.5); }
      else if (q.type === 'text') {
        c.font = '700 20px ' + A.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = A.INK; c.lineJoin = 'round';
        c.strokeText(q.txt, q.x, q.y); c.fillStyle = q.col; c.fillText(q.txt, q.x, q.y);
      }
    }
    c.globalAlpha = 1;
    // speech bubble
    if (G.say && G.sayT > 0 && G.mode !== 'menu' && G.mode !== 'result') {
      var bx = cat.x + 34, by = cat.y - 470 * CAT_S + hop;
      c.globalAlpha = clamp(G.sayT * 4, 0, 1); A.bubble(c, G.say, bx, by, 15, 1); c.globalAlpha = 1;
    }
    // caption
    if (G.cap && G.capT > 0 && G.mode !== 'menu' && G.mode !== 'result') {
      var ca = clamp(G.capT * 3, 0, 1), pop = 1 + Math.max(0, .15 - (2.6 - G.capT)) ;
      c.globalAlpha = ca;
      A.pill(c, G.cap.text, W / 2, 84, 19, G.cap.kind === 'p' ? '#ff5c9a' : '#ffe14d', G.cap.kind === 'p' ? '#ffffff' : A.INK, W - 24);
      c.globalAlpha = 1;
    }
    // tutorial / ready hint
    if (G.mode === 'ready') {
      var fy = shield.y + 64 + Math.sin(now * 4) * 6, coarse = ptr.type !== 'mouse' || !finePointer;
      if (coarse) A.finger(c, shield.x + 4, fy, .75, .95);
      A.pill(c, coarse ? 'PUT YOUR FINGER ON THE SCREEN!' : 'CLICK TO START, THEN MOVE THE MOUSE', W / 2, Math.max(130, Math.min(GY - 230, H * .32)), 15, '#ffffff', A.INK, W - 24);
    }
    if (G.flash > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(255,255,255,' + G.flash + ')'; c.fillRect(0, 0, cv.width, cv.height); }
    if (G.mode === 'play' || G.mode === 'hold') drawHud();
  }

  // ------------------------------------------------------------------ loop
  var last = 0, acc = 0, fpsEma = 60, fpsEl = $('fps'), showFps = qs.indexOf('fps') >= 0, frames = 0;
  var STEP = 1 / 120;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dtr = last ? (ts - last) / 1000 : 1 / 60; last = ts;
    if (dtr > 0 && dtr < .5) fpsEma += (1 / dtr - fpsEma) * .05;
    frames++;
    if (showFps && frames % 15 === 0) fpsEl.textContent = Math.round(fpsEma) + ' fps';
    var dt = Math.min(.05, dtr) * timeScale;
    now += dt;
    if (G.mode === 'hold' || G.mode === 'paused' || document.hidden) { render(); return; }
    acc += dt; var n = 0;
    while (acc >= STEP && n < 12) { step(STEP); acc -= STEP; n++; }
    if (n === 12) acc = 0;
    render();
  }

  // ------------------------------------------------------------------ input
  var finePointer = false;
  try { finePointer = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
  function toLocal(e) { var r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }
  function aimAt(x, y) {
    ptr.x = x; ptr.y = y;
    var off = ptr.type === 'mouse' ? 0 : 74 / scale;
    shield.tx = clamp(x, 0, W); shield.ty = clamp(y - off, 24, GY - 16);
  }
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('button, a, .card, .lvwrap')) return;
    if (G.mode !== 'ready' && G.mode !== 'play' && G.mode !== 'hold' && G.mode !== 'paused') { S.unlock(); return; }
    S.unlock();
    ptr.type = e.pointerType || 'mouse'; ptr.down = true; ptr.id = e.pointerId; ptr.kb = false;
    try { stage.setPointerCapture(e.pointerId); } catch (er) {}
    var p = toLocal(e); aimAt(p[0], p[1]);
    if (G.mode === 'ready') { shield.x = shield.tx; shield.y = shield.ty; beginPlay(); }
    else if (G.mode === 'hold' || G.mode === 'paused') resume();
    e.preventDefault();
  });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' && e.pointerId !== ptr.id) return;
    if (e.pointerType === 'mouse') { ptr.type = 'mouse'; ptr.inside = true; ptr.kb = false; }
    var p = toLocal(e); aimAt(p[0], p[1]);
  });
  function lift(e) {
    if (e.pointerId !== ptr.id) return;
    ptr.down = false; ptr.id = null;
    if (e.pointerType !== 'mouse' && (G.mode === 'play')) hold();
  }
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !ptr.down && G.mode === 'play' && !ptr.kb) hold(); });
  stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  function hold() {
    G.mode = 'hold'; S.suspend();
    var touch = ptr.type !== 'mouse';
    $('holdT').textContent = touch ? 'Put your finger back on the screen!' : 'Paused';
    $('holdS').textContent = touch ? 'Pumpkin needs you. Touch anywhere to keep protecting him.' : 'Click the game to keep protecting Pumpkin.';
    show('hold', true);
  }
  function pause() { if (G.mode === 'play') { G.mode = 'paused'; S.suspend(); $('holdT').textContent = 'Paused'; $('holdS').textContent = 'Tap the game to keep playing.'; show('hold', true); } }
  function resume() { if (G.mode === 'hold' || G.mode === 'paused') { G.mode = 'play'; S.resume(); show('hold', false); } }
  window.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    var gameKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].indexOf(k) >= 0;
    if (gameKey && (G.mode === 'play' || G.mode === 'ready')) {
      S.unlock(); keys[k] = true; ptr.kb = true; e.preventDefault();
      if (G.mode === 'ready') beginPlay();
    } else if ((k === ' ' || k === 'Enter') && (G.mode === 'ready' || G.mode === 'hold' || G.mode === 'paused')) {
      S.unlock(); ptr.kb = true; e.preventDefault(); if (G.mode === 'ready') beginPlay(); else resume();
    } else if ((k === 'p' || k === 'Escape') && G.mode === 'play') { pause(); }
  });
  window.addEventListener('keyup', function (e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (G.mode === 'play') pause(); S.suspend(); } else if (G.mode !== 'paused' && G.mode !== 'hold') S.resume(); });

  // ------------------------------------------------------------------ menus
  function goMenu() {
    G.mode = 'menu'; S.stopMusic(); G.objs = []; G.parts = []; G.cap = null; G.say = null;
    G.world = WORLDS[0]; G.def = WORLDS[0].levels[0]; G.ents = { tornado: null, ufos: [], dragon: null };
    hud.hidden = true; $('bPause').hidden = true; shield.show = false; setNav(false);
    setTitle('Protect Pumpkin!');
    var nextLv = 0; for (var i = 0; i < NLEV; i++) if (unlocked(i)) nextLv = i;
    $('playLab').textContent = Object.keys(data.stars).length ? 'Play ' + lvName(nextLv) : 'Play';
    $('bMenuEndless').classList.toggle('locked', !endlessUnlocked());
    ['levels', 'result', 'hold'].forEach(function (k) { show(k, false); });
    show('menu', true);
  }
  function openLevels() {
    var h = '', total = 0;
    for (var wi = 0; wi < WORLDS.length; wi++) {
      var w = WORLDS[wi];
      h += '<div class="wrow"><div class="wname"><span class="wdot" style="background:' + w.sky[0] + '"></span>' + (wi + 1) + '. ' + w.name + '</div><div class="wlv">';
      for (var j = 0; j < 3; j++) {
        var i = wi * 3 + j, st = data.stars[i] || 0, un = unlocked(i); total += st;
        h += '<button class="tile' + (un ? '' : ' locked') + '" data-lv="' + i + '"' + (un ? '' : ' disabled aria-disabled="true"') + ' aria-label="Level ' + lvName(i) + (un ? ', ' + st + ' stars' : ', locked') + '"><b>' + lvName(i) + '</b><span class="st">' +
          '<i class="' + (st > 0 ? 'on' : '') + '"></i><i class="' + (st > 1 ? 'on' : '') + '"></i><i class="' + (st > 2 ? 'on' : '') + '"></i></span>' + (j === 2 ? '<small>twist!</small>' : '') + '</button>';
      }
      h += '</div></div>';
    }
    var eu = endlessUnlocked();
    h += '<button class="tile endless' + (eu ? '' : ' locked') + '" data-lv="endless"' + (eu ? '' : ' disabled') + '>' + (eu ? 'Endless mode · best ' + (data.endless || 0).toLocaleString('en-US') : 'Endless mode: beat level 1-3 to unlock') + '</button>';
    $('grid').innerHTML = h;
    $('tot').textContent = total + ' / ' + (NLEV * 3) + ' stars';
    show('levels', true);
  }
  $('grid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lv]'); if (!b || b.disabled) return;
    S.unlock(); S.click();
    var v = b.getAttribute('data-lv');
    if (v === 'endless') startLevel(0, true); else startLevel(+v, false);
  });
  $('bPlay').addEventListener('click', function () {
    S.unlock(); S.click();
    var n = 0; for (var i = 0; i < NLEV; i++) if (unlocked(i) && !(data.stars[i] > 0)) { n = i; break; } else if (unlocked(i)) n = i;
    startLevel(n, false);
  });
  $('bMenuLevels').addEventListener('click', function () { S.unlock(); S.click(); openLevels(); });
  $('bMenuEndless').addEventListener('click', function () {
    S.unlock(); S.click();
    if (!endlessUnlocked()) { toast('Beat level 1-3 to unlock Endless mode'); return; }
    startLevel(0, true);
  });
  $('bBack').addEventListener('click', function (e) {
    if (G.mode === 'menu' && $('levels').hidden) return; // plain link to /games
    if (G.mode === 'menu') { e.preventDefault(); show('levels', false); show('menu', true); return; }
    e.preventDefault(); S.unlock();
    if (G.mode === 'play') { pause(); return; } // never lose a run by accident: pause, then "Main menu" is one tap away
    goMenu();
  });
  $('bLevels').addEventListener('click', function () { S.unlock(); if (G.mode === 'play') pause(); openLevels(); });
  $('bLvClose').addEventListener('click', function () { show('levels', false); if (G.mode === 'menu') show('menu', true); });
  $('bRetry').addEventListener('click', function () { S.click(); startLevel(G.li, G.endless); });
  $('bNext').addEventListener('click', function () { S.click(); if (G.li >= NLEV - 1) startLevel(0, true); else startLevel(G.li + 1, false); });
  $('bResLevels').addEventListener('click', function () { S.click(); show('result', false); openLevels(); });
  $('bQuit').addEventListener('click', function () { goMenu(); });
  $('bPause').addEventListener('click', function () { S.unlock(); if (G.mode === 'play') pause(); else if (G.mode === 'paused' || G.mode === 'hold') resume(); });
  var muted = !!data.muted;
  function setMute(m) { muted = m; data.muted = m; save(); S.setMuted(m); $('sndOn').style.display = m ? 'none' : ''; $('sndOff').style.display = m ? '' : 'none'; $('bMute').setAttribute('aria-pressed', m ? 'true' : 'false'); }
  $('bMute').addEventListener('click', function () { S.unlock(); setMute(!muted); });
  var toastT = 0;
  function toast(s) { var t = $('toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  // menu art: Pumpkin under his umbrella
  function drawMenuArt() {
    var mc = $('menuCat'); if (!mc) return;
    var r = mc.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    mc.width = Math.round(r.width * d); mc.height = Math.round(r.height * d);
    var c = mc.getContext('2d'); c.setTransform(d * r.width / 200, 0, 0, d * r.width / 200, 0, 0);
    c.clearRect(0, 0, 200, 200);
    c.beginPath(); c.moveTo(20, 186); c.lineTo(180, 186); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 4; c.stroke();
    var drops = [[24, 30], [52, 70], [150, 26], [176, 80], [36, 120], [168, 136], [96, 14]];
    c.strokeStyle = '#7cc6ff'; c.lineWidth = 3;
    drops.forEach(function (p) { c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - 3, p[1] + 12); c.stroke(); });
    A.drawCat(c, 100, 184, .235, A.catState({ eye: 0, closed: 'happy', mouth: 'smile', blush: 1, tail: .7, sway: .4 }));
    c.save(); c.translate(102, 36); c.scale(-.7, .7); A.drawShield(c, 'umbrella', 0, 0, .1, 0); c.restore(); // smaller + higher so the handle stays clear of Pumpkin's ears
  }

  // ------------------------------------------------------------------ boot
  resize();
  window.addEventListener('resize', function () { resize(); drawMenuArt(); });
  setMute(muted);
  goMenu();
  drawMenuArt();
  if (document.fonts && document.fonts.load) document.fonts.load('700 16px InterB').then(function () { drawMenuArt(); }).catch(function () {});
  requestAnimationFrame(frame);

  // small read-only hook for automated checks (no data leaves the page)
  window.__pp = {
    get mode() { return G.mode; }, get level() { return G.li; }, get t() { return G.t; }, get hearts() { return G.hearts; }, get blocked() { return G.blocked; },
    get fps() { return fpsEma; }, get objs() { return G.objs.length; }, get audio() { return S.state; }, get stars() { return JSON.parse(JSON.stringify(data.stars)); },
    setTimeScale: function (k) { timeScale = k; }, start: function (i, e) { startLevel(i, e); }
  };
})();
