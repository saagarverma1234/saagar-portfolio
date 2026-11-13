/* Protect Pumpkin! sound: everything synthesised live with WebAudio. Nothing plays (no AudioContext exists) until the
   first tap / key press calls PPAudio.unlock(). Exposes window.PPAudio. */
(function () {
  'use strict';
  var ac = null, master = null, sfx = null, mus = null, muted = false, musicOn = false, nextBar = 0, bar = 0, timer = 0, bpm = 96;
  var lastTick = 0, noiseBuf = null;
  // C major pentatonic, notes as semitones from C4
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
  var CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];   // C, Am, F, G
  function hz(semi) { return 261.63 * Math.pow(2, semi / 12); }

  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 1;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = .55; sfx.connect(master);
    mus = ac.createGain(); mus.gain.value = .16; mus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, .03);
  }
  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(freq, t, dur, type, vol, dest) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    env(g, t, .006, vol, dur); o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dur + .05);
    return o;
  }
  function noise(t, dur, vol, fType, f, dest) {
    var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = fType; fl.frequency.value = f; env(g, t, .004, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(dest || sfx); s.start(t); s.stop(t + dur + .05);
  }
  // A code-made "meow": sawtooth through a band-pass whose centre sweeps (m-i-a-o-w), pitch rising then falling.
  function meow(pitch, len, vol, sad) {
    if (!ac) return;
    var t = ac.currentTime + .01, o = ac.createOscillator(), o2 = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
    var p = pitch || 620, L = len || .42;
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.setValueAtTime(p * .85, t); o.frequency.linearRampToValueAtTime(p * (sad ? 1.05 : 1.35), t + L * .35); o.frequency.linearRampToValueAtTime(p * (sad ? .62 : .8), t + L);
    o2.frequency.setValueAtTime(p * .425, t); o2.frequency.linearRampToValueAtTime(p * (sad ? .52 : .67), t + L * .35); o2.frequency.linearRampToValueAtTime(p * .4, t + L);
    bp.type = 'bandpass'; bp.Q.value = 3.5;
    bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(2200, t + L * .3); bp.frequency.linearRampToValueAtTime(900, t + L);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .5, t + .05); g.gain.setValueAtTime(vol || .5, t + L * .6); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(sfx);
    o.start(t); o2.start(t); o.stop(t + L + .05); o2.stop(t + L + .05);
  }
  function block(combo, soft) {
    if (!ac) return;
    var now = ac.currentTime;
    if (soft) { if (now - lastTick < .05) return; lastTick = now; tone(hz(PENTA[5 + (combo % 6)]) * 2, now, .08, 'sine', .07); return; }
    var n = PENTA[Math.min(PENTA.length - 1, 3 + (combo % 11))];
    tone(hz(n), now, .25, 'triangle', .3); tone(hz(n + 12), now, .12, 'sine', .12);
    noise(now, .05, .12, 'highpass', 3000);
  }
  function bonk() { if (!ac) return; var t = ac.currentTime; var o = tone(520, t, .22, 'square', .14); o.frequency.exponentialRampToValueAtTime(140, t + .2); noise(t, .08, .2, 'bandpass', 900); }
  function hit() {
    if (!ac) return;
    var t = ac.currentTime; noise(t, .18, .35, 'lowpass', 600);
    var o = tone(180, t, .2, 'sine', .4); o.frequency.exponentialRampToValueAtTime(60, t + .2);
    meow(760, .32, .45, true);
  }
  function yum() { if (!ac) return; var t = ac.currentTime; [0, 4, 7, 12].forEach(function (s, i) { tone(hz(s + 12), t + i * .06, .18, 'triangle', .22); }); meow(880, .25, .3); }
  function purr() {
    if (!ac) return;
    var t = ac.currentTime, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = 'lowpass'; fl.frequency.value = 220;
    g.gain.value = 0; lfo.frequency.value = 24; lg.gain.value = .25; lfo.connect(lg); lg.connect(g.gain);
    var ge = ac.createGain(); env(ge, t, .1, .9, .9);
    s.connect(fl); fl.connect(g); g.connect(ge); ge.connect(sfx); s.start(t); lfo.start(t); s.stop(t + 1.1); lfo.stop(t + 1.1);
  }
  function jingle(win) {
    if (!ac) return;
    var t = ac.currentTime + .02, seq = win ? [0, 4, 7, 12, 16, 19, 24] : [7, 4, 0, -5];
    seq.forEach(function (s, i) { tone(hz(s + 12), t + i * (win ? .08 : .16), win ? .3 : .35, 'triangle', .25); });
    if (win) setTimeout(function () { meow(700, .45, .4); }, 600); else setTimeout(function () { meow(560, .6, .35, true); }, 500);
  }
  function sparkle() { if (!ac) return; var t = ac.currentTime; for (var i = 0; i < 10; i++) tone(hz(PENTA[(i * 3) % PENTA.length] + 12), t + i * .045, .2, 'sine', .14); }
  function crack() { if (!ac) return; var t = ac.currentTime; noise(t, .25, .45, 'bandpass', 1800); tone(90, t, .3, 'sine', .4); }
  function thunder() { if (!ac) return; var t = ac.currentTime; noise(t, 1.2, .35, 'lowpass', 180); }
  function click() { if (!ac) return; tone(1200, ac.currentTime, .05, 'sine', .12); }

  // gentle background loop: pad + bass + music-box arpeggio, scheduled ahead
  function scheduleBar(t) {
    var ch = CHORDS[bar % 4], beat = 60 / bpm, i;
    for (i = 0; i < 3; i++) {
      var o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = hz(ch[i] - 12); f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .4); g.gain.setValueAtTime(.09, t + beat * 3.4); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 4);
      o.connect(f); f.connect(g); g.connect(mus); o.start(t); o.stop(t + beat * 4 + .05);
    }
    tone(hz(ch[0] - 24), t, beat * .9, 'sine', .35, mus); tone(hz(ch[0] - 24), t + beat * 2, beat * .9, 'sine', .3, mus);
    var arp = [0, 1, 2, 1, 2, 0, 1, 2];
    for (i = 0; i < 8; i++) {
      if (bar % 8 >= 6 && i % 2) continue;
      tone(hz(ch[arp[i]] + 12 + (i > 3 ? 12 : 0) * (bar % 2)), t + i * beat / 2, .35, 'sine', .07, mus);
    }
    for (i = 0; i < 4; i++) noise(t + i * beat + beat / 2, .03, .05, 'highpass', 7000, mus);
  }
  function pump() {
    if (!ac || !musicOn) return;
    while (nextBar < ac.currentTime + .6) { scheduleBar(nextBar); nextBar += 4 * 60 / bpm; bar++; }
  }
  function startMusic(tempo) {
    if (!ac) return;
    bpm = tempo || 96;
    if (musicOn) return;
    musicOn = true; nextBar = ac.currentTime + .1; bar = 0; pump();
    clearInterval(timer); timer = setInterval(pump, 150);
  }
  function stopMusic() { musicOn = false; clearInterval(timer); }
  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }

  window.PPAudio = { unlock: unlock, setMuted: setMuted, block: block, bonk: bonk, hit: hit, yum: yum, purr: purr, meow: meow, jingle: jingle,
    sparkle: sparkle, crack: crack, thunder: thunder, click: click, startMusic: startMusic, stopMusic: stopMusic, suspend: suspend, resume: resume,
    get ready() { return !!ac; }, get state() { return ac ? ac.state : 'none'; } };
})();
