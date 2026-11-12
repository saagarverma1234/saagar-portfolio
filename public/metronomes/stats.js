/* Anonymous play stats for the Metronome Sync Game. No cookies, no personal data. Never allowed to break the game. */
(function () {
  'use strict';
  var noop = { track: function () {} };
  window.c2oStats = noop;
  try {
    var params = new URLSearchParams(location.search);
    if (params.has('og') || !/^https?:$/.test(location.protocol)) return;
    var END = '/metronomes-api/event';
    var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
    var rid = function () { var s = ''; for (var i = 0; i < 4; i++) s += Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'); return s; };
    var cid = ls('c2o-vid'), ret = 0;
    if (cid && /^[0-9a-f]{16}$/.test(cid)) ret = 1; else { cid = rid(); ls('c2o-vid', cid); if (ls('c2o-vid') !== cid) cid = ''; }
    var sid = rid();
    var test = ls('c2o-stats-test') === '1' || params.has('statstest') ? 1 : 0;
    var last = {}, sent = 0;

    function send(name, data) {
      try {
        if (sent >= 400) return;
        var now = Date.now();
        var key = name + ':' + ((data && data.c) || '');
        if (name !== 'heartbeat' && name !== 'pageview' && last[key] && now - last[key] < 1000) return;   // a burst of taps counts once a second
        last[key] = now; sent++;
        var body = JSON.stringify({ e: name, cid: cid, sid: sid, test: test, d: data || {} });
        if (navigator.sendBeacon && navigator.sendBeacon(END, new Blob([body], { type: 'text/plain' }))) return;
        if (window.fetch) fetch(END, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
      } catch (e) {}
    }

    var refHost = '';
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    send('pageview', {
      ref: refHost, ret: ret, c: params.get('c') || '',
      us: params.get('utm_source') || '', um: params.get('utm_medium') || '', uc: params.get('utm_campaign') || '',
      tp: navigator.maxTouchPoints || 0, sw: (screen && screen.width) || 0
    });

    // visible time: a beat every 15 s while the tab is visible, plus the remainder when it hides
    var visSince = document.visibilityState === 'visible' ? Date.now() : 0;
    function flush() {
      if (!visSince) return;
      var s = Math.round((Date.now() - visSince) / 1000); visSince = document.visibilityState === 'visible' ? Date.now() : 0;
      if (s > 0) send('heartbeat', { s: Math.min(s, 60) });
    }
    setInterval(function () { if (document.visibilityState === 'visible') flush(); }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') visSince = Date.now(); else flush();
    });
    window.addEventListener('pagehide', flush);

    var played = false;
    window.c2oStats = {
      track: function (name, data) {
        try {
          if (name === 'play') { if (played) return; played = true; }
          send(name, data);
        } catch (e) {}
      }
    };
  } catch (e) { window.c2oStats = noop; }
})();
