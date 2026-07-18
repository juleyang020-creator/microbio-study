/* 离线缓存：核心文件与图片预缓存，入口页网络优先以便更新能及时到达。 */
var CACHE_PREFIX = 'microbio-';
var APP_VERSION = '20260702-54';
// 缓存名直接由版本号派生，只需改 APP_VERSION 一处；旧缓存在 activate 时按前缀清理
var CACHE = CACHE_PREFIX + APP_VERSION;
function versioned(path) {
  return path + '?v=' + APP_VERSION;
}
var CORE = [
  './', './index.html', versioned('./css/styles.css'),
  versioned('./js/core.js'), versioned('./js/view.js'), versioned('./js/validate.js'), versioned('./js/app.js'),
  versioned('./data/source-metadata.js'),
  versioned('./data/categories.js'), versioned('./data/microbes.js'), versioned('./data/antibiotics.js'), versioned('./data/resistance.js'),
  versioned('./data/biochem.js'), versioned('./data/differential.js'), versioned('./data/morphology.js'), versioned('./data/photos.js'), versioned('./data/treatment.js'),
  versioned('./data/cards.js'), versioned('./data/tests.js'), versioned('./data/media.js'), versioned('./data/staining.js'),
  versioned('./data/breakpoints.js'), versioned('./data/eucast-breakpoints.js'), versioned('./data/biochem-tests.js'), versioned('./data/ast-alerts.js'), versioned('./data/qc-strains.js'), versioned('./data/ecv.js'), versioned('./data/intrinsic-resistance.js'), versioned('./data/site-reporting.js'), versioned('./data/lab-workflow.js'), versioned('./data/drug-cn.js'), versioned('./data/microbe-names.js'),
  versioned('./manifest.json'), './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
var IMAGE_ASSETS = [
  './img/biochem-adh.svg',
  './img/biochem-citrate.svg',
  './img/biochem-decarboxylase.svg',
  './img/biochem-disk.svg',
  './img/biochem-dnase.svg',
  './img/biochem-esculin.svg',
  './img/biochem-gelatin.svg',
  './img/biochem-germtube.svg',
  './img/biochem-h2s.svg',
  './img/biochem-hemolysis.svg',
  './img/biochem-hippurate.svg',
  './img/biochem-indole.svg',
  './img/biochem-lancefield.svg',
  './img/biochem-motility.svg',
  './img/biochem-mr.svg',
  './img/biochem-nacl.svg',
  './img/biochem-nitrate.svg',
  './img/biochem-onpg.svg',
  './img/biochem-pda.svg',
  './img/biochem-pigment.svg',
  './img/biochem-pyr.svg',
  './img/biochem-sugar.svg',
  './img/biochem-tsi.svg',
  './img/biochem-urease.svg',
  './img/biochem-vp.svg',
  './img/biochem-xv.svg',
  './img/landing-antibiotics.svg',
  './img/landing-biochem.svg',
  './img/landing-cards.svg',
  './img/landing-idcards.svg',
  './img/landing-media.svg',
  './img/landing-qc-strains.svg',
  './img/landing-resistance.svg',
  './img/landing-staining.svg',
  './img/landing-tests.svg',
  './img/mechanism-azole.svg',
  './img/mechanism-cellwall.svg',
  './img/mechanism-echinocandin.svg',
  './img/mechanism-flucytosine.svg',
  './img/mechanism-folate.svg',
  './img/mechanism-membrane.svg',
  './img/mechanism-nucleic.svg',
  './img/mechanism-polyene.svg',
  './img/mechanism-protein.svg',
  './img/media-anaerobic-blood-agar.svg',
  './img/media-ashdown.svg',
  './img/media-bcye.svg',
  './img/media-blood-agar.svg',
  './img/media-bordet-gengou.svg',
  './img/media-chocolate-agar.svg',
  './img/media-chromagar-candida.svg',
  './img/media-cin-agar.svg',
  './img/media-emb.svg',
  './img/media-lj-medium.svg',
  './img/media-macconkey.svg',
  './img/media-mannitol-salt.svg',
  './img/media-mh-agar.svg',
  './img/media-nutrient-agar.svg',
  './img/media-sda.svg',
  './img/media-ss-agar.svg',
  './img/media-tcbs.svg',
  './img/media-thayer-martin.svg',
  './img/media-xld.svg',
  './img/morphology-fungi.svg',
  './img/morphology-overview.svg',
  './img/morphology-virus.svg',
  './img/resistance-biofilm.svg',
  './img/resistance-bypass.svg',
  './img/resistance-efflux.svg',
  './img/resistance-enzyme.svg',
  './img/resistance-permeability.svg',
  './img/resistance-target.svg',
  './img/stain-acidfast.svg',
  './img/stain-auramine.svg',
  './img/stain-capsule.svg',
  './img/stain-flagella.svg',
  './img/stain-giemsa.svg',
  './img/stain-gms.svg',
  './img/stain-gram.svg',
  './img/stain-granule.svg',
  './img/stain-indiaink.svg',
  './img/stain-koh.svg',
  './img/stain-lpcb.svg',
  './img/stain-methyleneblue.svg',
  './img/stain-modified-acidfast.svg',
  './img/stain-silver.svg',
  './img/stain-spore.svg',
  './img/test-betalactamase.svg',
  './img/test-bile.svg',
  './img/test-bmd.svg',
  './img/test-camp.svg',
  './img/test-catalase.svg',
  './img/test-cefiderocol.svg',
  './img/test-cefoxitin.svg',
  './img/test-coagulase.svg',
  './img/test-colistin.svg',
  './img/test-d.svg',
  './img/test-ecim.svg',
  './img/test-esbl.svg',
  './img/test-etest.svg',
  './img/test-hlar.svg',
  './img/test-kb.svg',
  './img/test-maldi.svg',
  './img/test-mcim.svg',
  './img/test-optochin.svg',
  './img/test-oxidase.svg',
  './img/test-satellitism.svg'
];
// 图片也带版本号预缓存，与页面里 <img src=...?v=> 一致，避免版本更新后手机端命中旧图
var PRECACHE = CORE.concat(IMAGE_ASSETS.map(versioned));

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) {
        return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function putIfCacheable(request, response) {
  if (response && response.ok && response.type === 'basic') {
    var copy = response.clone();
    caches.open(CACHE).then(function (c) { c.put(request, copy); });
  }
  return response;
}

// 形态学照片（img/photo-*.webp，共约 10 MB）不进预缓存：安装快、不浪费流量；
// 下方 fetch 处理器为「缓存优先 + 运行时回填」，用户看过的菌其图片会自动入缓存，此后离线可看。
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        return putIfCacheable(e.request, res);
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        return putIfCacheable(e.request, res);
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
