/* 离线缓存：核心文件预缓存 + 其余(图片等)运行时缓存。改版本号即可强制更新缓存。 */
var CACHE = 'microbio-v7';
var CORE = [
  './', './index.html', './css/styles.css',
  './js/core.js', './js/view.js', './js/validate.js', './js/app.js',
  './data/categories.js', './data/microbes.js', './data/antibiotics.js', './data/resistance.js',
  './data/biochem.js', './data/differential.js', './data/morphology.js',
  './data/cards.js', './data/tests.js', './data/media.js', './data/staining.js', './data/structures.js',
  './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
