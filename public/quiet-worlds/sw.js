/* Quiet Worlds service worker, scoped to this folder. Keeps the game working offline after a visit.
   Pages: network first, cache as fallback. Game files and planet pictures: cache first (they are versioned).
   Never caches the stats beacon, the votes API, ads or other sites. No push notifications. */
var CACHE = 'qw-v6';
var CORE = ['index.html', 'game.js?v=6', 'worlds.js?v=6', 'story.js?v=6', 'keepsakes.js?v=6', 'stats.js?v=6', 'stage.js?v=6', 'scene.js?v=6', 'traveller.webp?v=3',
  'vt323.woff2', 'inter-700.woff2', 'favicon.svg', 'icon-192.png', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }).catch(function () {}));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('qw-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(quiet-worlds-api|metronomes-api|game-feedback|admin)/.test(url.pathname)) return;
  var inScope = url.pathname.indexOf(new URL(self.registration.scope).pathname) === 0;
  var isImg = url.pathname.indexOf('/quiet-worlds/img/') === 0;
  if (!inScope && !isImg) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); return res;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});
