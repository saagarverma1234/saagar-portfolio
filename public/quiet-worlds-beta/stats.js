/* Anonymous play stats for the Quiet Worlds preview (/quiet-worlds-beta/). Same beacon as /game-stats.v1.js,
   but the game calls track() itself, and every event is flagged test (TEST below) so the real numbers stay clean.
   No cookies, no personal data. Any error just turns it off. */
(function () {
  'use strict';
  var TEST = 1;   // preview build: set to 0 when this becomes /quiet-worlds/
  var noop = { track: function () {}, test: TEST };
  window.qwStats = noop;
  try {
    var params = new URLSearchParams(location.search);
    if (params.has('og') || !/^https?:$/.test(location.protocol)) return;
    var END = '/metronomes-api/event';
    var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
    var rid = function () { var s = ''; for (var i = 0; i < 4; i++) s += Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0'); return s; };
    // the same random browser ID as the other games (key c2o-vid), described in the privacy policy
    var cid = ls('c2o-vid'), ret = ls('qw2-save') !== null ? 1 : 0;
    if (!cid || !/^[0-9a-f]{16}$/.test(cid)) { cid = rid(); ls('c2o-vid', cid); if (ls('c2o-vid') !== cid) cid = ''; }
    var sid = rid();
    var test = TEST || ls('c2o-stats-test') === '1' || params.has('statstest') ? 1 : 0;
    var last = {}, sent = 0;

    function send(name, data) {
      try {
        if (sent >= 400) return;
        var now = Date.now(), key = name + ':' + JSON.stringify(data || {});
        if (name !== 'heartbeat' && name !== 'pageview' && last[key] && now - last[key] < 1000) return;
        last[key] = now; sent++;
        var body = { e: name, g: 'quiet-worlds', sid: sid, test: test, d: data || {} };
        if (cid) body.cid = cid;
        body = JSON.stringify(body);
        if (navigator.sendBeacon && navigator.sendBeacon(END, new Blob([body], { type: 'text/plain' }))) return;
        if (window.fetch) fetch(END, { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
      } catch (e) {}
    }

    var refHost = '';
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    send('pageview', {
      ref: refHost, ret: ret,
      us: params.get('utm_source') || '', um: params.get('utm_medium') || '', uc: params.get('utm_campaign') || '',
      tp: navigator.maxTouchPoints || 0, sw: (screen && screen.width) || 0
    });

    var visSince = document.visibilityState === 'visible' ? Date.now() : 0;
    function flush() {
      if (!visSince) return;
      var s = Math.round((Date.now() - visSince) / 1000); visSince = document.visibilityState === 'visible' ? Date.now() : 0;
      if (s > 0) send('heartbeat', { s: Math.min(s, 60) });
    }
    setInterval(function () { if (document.visibilityState === 'visible') flush(); }, 15000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') visSince = Date.now(); else flush(); });
    window.addEventListener('pagehide', flush);

    var played = false;
    window.qwStats = {
      test: test,
      track: function (name, data) {
        try {
          if (name === 'play') { if (played) return; played = true; }
          send(name, data);
        } catch (e) {}
      }
    };
  } catch (e) { window.qwStats = noop; }
})();
