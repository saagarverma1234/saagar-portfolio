/* Save codes for the saagarverma.com games: move progress to another phone or browser (same idea as Quiet Worlds).
   A code is PREFIX + format version + '-' + checksum + '-' + base64url(compact JSON), e.g. BT1-1x2y3z-eyJsIjoy...
   It holds ONLY game progress (stars, best scores, streaks): no IDs, nothing personal, and nothing is sent anywhere.
   Loading a code MERGES it (keeps the best of both), so it can never lose progress.

   var sc = GameSave.create({
     prefix: 'BT', title: 'Bump Theory', accent: '#ffcc33', ink: '#1a1406', intro: '...',
     get: function () { return {...progress...}; },           // compact, JSON-safe
     merge: function (data) { return 'Loaded ...'; },         // validate + merge; throw on bad data
     after: function () {}                                      // refresh the game's screens
   });
   sc.open(); sc.hintDue(); sc.hintShown();
   Must never break the game: every storage call is in try/catch. */
(function () {
  'use strict';
  var KNOWN = { BT: 'Bump Theory', PP: 'Swipe Theory (Protect Pumpkin)', MS: 'Metronome Sync', QW: 'Quiet Worlds' };
  var DAMAGED = 'That code is damaged. Copy it again, all of it, and paste it here.';

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }

  function encode(prefix, data) {
    var json = JSON.stringify(data);
    return prefix + '1-' + hash(json).toString(36) + '-' + b64e(json);
  }
  /* -> { data } or { err: friendly message } */
  function decode(prefix, str) {
    var s = String(str || '').replace(/\s+/g, '');
    var m = /([A-Z]{2})(\d{1,3})-([0-9a-z]{1,8})-([A-Za-z0-9_-]+)/.exec(s);
    if (!m) return { err: 'That does not look like a save code. Copy the whole code (it starts with ' + prefix + '1-) and try again.' };
    if (m[1] !== prefix) return { err: KNOWN[m[1]] ? 'That is a save code for ' + KNOWN[m[1]] + '. Load it in that game.' : 'That is not a save code for this game.' };
    if (+m[2] > 1) return { err: 'That code comes from a newer version of the game. Reload this page, then try again.' };
    if (+m[2] !== 1) return { err: DAMAGED };
    var json, data;
    try { json = b64d(m[4]); data = JSON.parse(json); } catch (e) { return { err: DAMAGED }; }
    if (hash(json).toString(36) !== m[3] || !data || typeof data !== 'object' || Array.isArray(data)) return { err: DAMAGED };
    return { data: data };
  }

  /* Two daily streaks (each a run of days ending on `last`) -> one. Runs that overlap or touch join up. */
  function mergeStreak(as, al, bs, bl) {
    as = as | 0; al = al | 0; bs = bs | 0; bl = bl | 0;
    if (!bs || !bl) return { streak: as, last: al };
    if (!as || !al) return { streak: bs, last: bl };
    var aStart = al - as + 1, bStart = bl - bs + 1, last = Math.max(al, bl);
    if (aStart <= bl + 1 && bStart <= al + 1) return { streak: last - Math.min(aStart, bStart) + 1, last: last };
    return al >= bl ? { streak: as, last: al } : { streak: bs, last: bl };
  }
  function isInt(v, lo, hi) { return typeof v === 'number' && v === Math.floor(v) && v >= lo && v <= hi; }
  function isNum(v, lo, hi) { return typeof v === 'number' && isFinite(v) && v >= lo && v <= hi; }

  var storageOk = (function () {
    try { var k = '__gs_test'; window.localStorage.setItem(k, '1'); var ok = window.localStorage.getItem(k) === '1'; window.localStorage.removeItem(k); return ok; } catch (e) { return false; }
  })();

  var cssDone = false;
  function addCss() {
    if (cssDone) return; cssDone = true;
    var st = document.createElement('style');
    st.textContent =
      '.gs-back{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;padding:0}' +
      '.gs-back[hidden]{display:none}' +
      '.gs-in{width:min(100%,460px);max-height:calc(100% - 24px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:#14151c;color:#f4f4f7;border:1px solid #2a2c38;border-bottom:0;border-radius:20px 20px 0 0;padding:18px 16px calc(16px + env(safe-area-inset-bottom));text-align:left;font-family:inherit;touch-action:pan-y;user-select:text;-webkit-user-select:text}' +
      '@media (min-width:700px){.gs-back{align-items:center}.gs-in{border-radius:20px;border-bottom:1px solid #2a2c38}}' +
      '.gs-in h2{margin:0 0 8px;font-size:22px;line-height:1.2;text-align:center}' +
      '.gs-in p{margin:0 0 10px;font-size:14px;line-height:1.45;color:#b8bac7;font-weight:500}' +
      '.gs-in label{display:block;margin:14px 0 6px;font-size:14px;color:#f4f4f7}' +
      '.gs-in textarea{display:block;width:100%;box-sizing:border-box;font:16px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#f4f4f7;background:#0b0c12;border:1px solid #2a2c38;border-radius:10px;padding:10px 12px;resize:none;word-break:break-all;user-select:text;-webkit-user-select:text}' +
      '.gs-in textarea:focus{outline:2px solid var(--gs-accent);outline-offset:1px}' +
      '.gs-in textarea[readonly]{color:#d6d7de}' +
      '.gs-btn{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;min-height:48px;margin-top:8px;padding:0 16px;border-radius:14px;border:1px solid #2a2c38;background:#1f2029;color:#f4f4f7;font:inherit;font-size:16px;cursor:pointer}' +
      '.gs-btn:active{transform:scale(.98)}' +
      '.gs-btn.gs-gold{background:var(--gs-accent);border-color:var(--gs-accent);color:var(--gs-ink)}' +
      '.gs-btn:focus-visible{outline:2px solid var(--gs-accent);outline-offset:2px}' +
      '.gs-btn.gs-close{margin-top:14px;background:none}' +
      '.gs-in .gs-msg{margin:10px 0 0;min-height:1px;color:#f4f4f7;font-weight:700}' +
      '.gs-in .gs-msg.gs-err{color:#ff8a8a}' +
      '.gs-in .gs-msg:empty{display:none}' +
      '.gs-in .gs-tip{margin:14px 0 0;padding:10px 12px;border-radius:12px;background:#1b1c25;border:1px solid #2a2c38;font-size:13px}' +
      '.gs-in .gs-tip b{color:#f4f4f7}' +
      '.gs-in .gs-tip:empty{display:none}';
    document.head.appendChild(st);
  }

  function tipText() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return '';
    } catch (e) {}
    var ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|YouTube|GSA\//i.test(ua);
    if (inApp) return '<b>In-app browsers can forget your progress.</b> Copy your code now, then open this page in ' + (ios ? 'Safari' : 'Chrome') + ' (menu, then Open in browser).';
    if (ios) return '<b>Tip:</b> Safari can clear game progress after a week away. Tap Share, then Add to Home Screen: the game is one tap away and keeps its progress.';
    if (/Android/i.test(ua)) return '<b>Tip:</b> keep the game one tap away: tap the menu (three dots), then Add to Home screen.';
    return '';
  }

  function create(o) {
    var root = null, opener = null, $ = function (id) { return document.getElementById(id); };
    var hintKey = 'gs-hint-' + o.prefix, hintMem = false;

    function code() { try { return encode(o.prefix, o.get()); } catch (e) { return ''; } }
    function msg(t, err) { var m = $('gsMsg'); m.textContent = t; m.classList.toggle('gs-err', !!err); }

    function build() {
      addCss();
      root = document.createElement('div');
      root.className = 'gs-back'; root.id = 'gsSheet'; root.hidden = true;
      root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'gsH');
      root.style.setProperty('--gs-accent', o.accent || '#ffcc33');
      root.style.setProperty('--gs-ink', o.ink || '#1a1406');
      root.innerHTML =
        '<div class="gs-in">' +
        '<h2 id="gsH">Save code</h2>' +
        '<p id="gsIntro"></p>' +
        '<textarea id="gsOut" rows="3" readonly aria-label="Your save code"></textarea>' +
        '<button type="button" class="gs-btn gs-gold" id="gsCopy">Copy my save code</button>' +
        '<label for="gsIn">Load a code</label>' +
        '<textarea id="gsIn" rows="2" placeholder="Paste a save code here" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>' +
        '<button type="button" class="gs-btn" id="gsLoad">Load code</button>' +
        '<p class="gs-msg" id="gsMsg" role="status" aria-live="polite"></p>' +
        '<p class="gs-tip" id="gsTip"></p>' +
        '<button type="button" class="gs-btn gs-close" id="gsClose">Close</button>' +
        '</div>';
      document.body.appendChild(root);
      $('gsIntro').textContent = o.intro || 'Your progress lives only in this browser. Copy this code and keep it somewhere safe. Load it on another phone or browser to get your progress back. It holds only game progress, nothing personal.';
      // keys typed here must never reach the game (space = drop, arrows = move...)
      root.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') close(); });
      root.addEventListener('keyup', function (e) { e.stopPropagation(); });
      root.addEventListener('click', function (e) { if (e.target === root) close(); });
      $('gsClose').addEventListener('click', close);
      $('gsOut').addEventListener('focus', function () { try { this.select(); } catch (e) {} });
      $('gsCopy').addEventListener('click', copy);
      $('gsLoad').addEventListener('click', load);
    }

    function copy() {
      var out = $('gsOut'), text = out.value;
      if (!text) { msg('Could not make a code right now. Try again.', true); return; }
      var done = function () { msg('Save code copied. Keep it somewhere safe, like your notes.'); };
      var fallback = function () {
        var ok = false;
        try { out.focus(); out.select(); out.setSelectionRange(0, text.length); ok = document.execCommand('copy'); } catch (e) { ok = false; }
        if (ok) done(); else msg('Copying is blocked here. The code is selected above: copy it yourself.', true);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) { navigator.clipboard.writeText(text).then(done, fallback); return; }
      } catch (e) {}
      fallback();
    }

    function load() {
      var v = $('gsIn').value.trim();
      if (!v) { msg('Paste a save code first.', true); return; }
      var r = decode(o.prefix, v);
      if (r.err) { msg(r.err, true); return; }
      var text;
      try { text = o.merge(r.data); } catch (e) { msg(DAMAGED, true); return; }
      msg((text || 'Code loaded.') + (storageOk ? '' : ' This browser is not saving right now, so it only lasts until you close the page. Keep your code.'));
      $('gsIn').value = '';
      $('gsOut').value = code();
      try { if (o.after) o.after(); } catch (e) {}
    }

    function open() {
      try {
        if (!root) build();
        opener = document.activeElement;
        $('gsOut').value = code(); $('gsIn').value = ''; msg('');
        $('gsTip').innerHTML = tipText();
        root.hidden = false;
        try { $('gsCopy').focus({ preventScroll: true }); } catch (e) {}
        hintShown();
      } catch (e) {}
    }
    function close() {
      if (!root || root.hidden) return;
      root.hidden = true;
      try { if (opener && opener.focus) opener.focus({ preventScroll: true }); } catch (e) {}
      opener = null;
    }
    function hintDue() {
      if (hintMem) return false;
      try { return window.localStorage.getItem(hintKey) !== '1'; } catch (e) { return true; }
    }
    function hintShown() { hintMem = true; try { window.localStorage.setItem(hintKey, '1'); } catch (e) {} }
    function isOpen() { return !!root && !root.hidden; }

    return { open: open, close: close, isOpen: isOpen, code: code, hintDue: hintDue, hintShown: hintShown, load: function (s) { open(); $('gsIn').value = s; load(); } };
  }

  window.GameSave = { create: create, encode: encode, decode: decode, mergeStreak: mergeStreak, isInt: isInt, isNum: isNum, storageOk: storageOk };
})();
