/* Page glue for the Metronome Sync Game: "pick a challenge" link, How it works deep links, More games list. Never touches the game itself. */
(function () {
  'use strict';
  try {
    var $ = function (id) { return document.getElementById(id); };

    // "or pick a challenge" on the start screen: scroll to the challenge list and highlight it
    var to = $('toChallenges'), pCh = $('pCh');
    if (to && pCh) to.addEventListener('click', function () {
      pCh.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pCh.classList.add('flash'); setTimeout(function () { pCh.classList.remove('flash'); }, 1600);
    });

    // links to #how-it-works or #suggestions open the folded box
    function openHash() {
      var el = location.hash && document.getElementById(location.hash.slice(1));
      if (el && el.tagName === 'DETAILS') { el.open = true; setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 30); }
    }
    openHash(); window.addEventListener('hashchange', openHash);

    // More games: built from /games.json (config/games.php), so new games show up here automatically
    var list = $('mgList');
    if (list && window.fetch) {
      fetch('/games.json', { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (games) {
          if (!games || !games.length) return;
          var here = location.pathname.replace(/\/+$/, '/');
          var others = games.filter(function (g) { return g.url !== here; });
          if (!others.length) return;
          var chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
          list.innerHTML = '';
          others.forEach(function (g) {
            var a = document.createElement('a'); a.className = 'mg'; a.href = g.url;
            if (g.accent) a.style.setProperty('--accent', g.accent);
            var img = document.createElement('img'); img.src = g.thumb; img.alt = ''; img.width = 640; img.height = 360; img.loading = 'lazy'; img.decoding = 'async';
            img.onerror = function () { var ph = document.createElement('span'); ph.className = 'ph'; ph.setAttribute('aria-hidden', 'true'); ph.textContent = (g.title || '?').charAt(0); img.replaceWith(ph); };
            var sp = document.createElement('span'), b = document.createElement('b'), sm = document.createElement('small');
            b.textContent = g.title; sm.textContent = g.channel + (g.tags && g.tags[0] ? ' · ' + g.tags[0] : '');
            sp.appendChild(b); sp.appendChild(sm);
            a.appendChild(img); a.appendChild(sp); a.insertAdjacentHTML('beforeend', chev);
            list.appendChild(a);
          });
        })
        .catch(function () {});
    }
  } catch (e) { /* never break the page */ }
})();
