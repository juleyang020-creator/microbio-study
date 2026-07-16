/* 离线缓存：核心文件与图片预缓存，入口页网络优先以便更新能及时到达。 */
var CACHE_PREFIX = 'microbio-';
var APP_VERSION = '20260702-28';
var CACHE = CACHE_PREFIX + 'v74';
function versioned(path) {
  return path + '?v=' + APP_VERSION;
}
var CORE = [
  './', './index.html', versioned('./css/styles.css'),
  versioned('./js/core.js'), versioned('./js/view.js'), versioned('./js/validate.js'), versioned('./js/app.js'),
  versioned('./data/source-metadata.js'),
  versioned('./data/categories.js'), versioned('./data/microbes.js'), versioned('./data/antibiotics.js'), versioned('./data/resistance.js'),
  versioned('./data/biochem.js'), versioned('./data/differential.js'), versioned('./data/morphology.js'), versioned('./data/treatment.js'),
  versioned('./data/idcards.js'), versioned('./data/cards.js'), versioned('./data/tests.js'), versioned('./data/media.js'), versioned('./data/staining.js'), versioned('./data/structures.js'),
  versioned('./data/breakpoints.js'), versioned('./data/biochem-tests.js'), versioned('./data/ast-alerts.js'), versioned('./data/qc-strains.js'), versioned('./data/ecv.js'), versioned('./data/intrinsic-resistance.js'), versioned('./data/site-reporting.js'),
  versioned('./manifest.json'), './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
var IMAGE_ASSETS = [
  './img/biochem-citrate.svg',
  './img/biochem-decarboxylase.svg',
  './img/biochem-disk.svg',
  './img/biochem-dnase.svg',
  './img/biochem-esculin.svg',
  './img/biochem-gelatin.svg',
  './img/biochem-h2s.svg',
  './img/biochem-hemolysis.svg',
  './img/biochem-hippurate.svg',
  './img/biochem-indole.svg',
  './img/biochem-lancefield.svg',
  './img/biochem-motility.svg',
  './img/biochem-mr.svg',
  './img/biochem-nacl.svg',
  './img/biochem-nitrate.svg',
  './img/biochem-pda.svg',
  './img/biochem-pigment.svg',
  './img/biochem-pyr.svg',
  './img/biochem-sugar.svg',
  './img/biochem-urease.svg',
  './img/biochem-vp.svg',
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
  './img/stain-flagella.svg',
  './img/stain-giemsa.svg',
  './img/stain-gram.svg',
  './img/stain-granule.svg',
  './img/stain-indiaink.svg',
  './img/stain-lpcb.svg',
  './img/stain-spore.svg',
  './img/struct-amikacin.svg',
  './img/struct-amoxicillin.svg',
  './img/struct-amphotericin-b.svg',
  './img/struct-ampicillin.svg',
  './img/struct-azithromycin.svg',
  './img/struct-aztreonam.svg',
  './img/struct-caspofungin.svg',
  './img/struct-cefazolin.svg',
  './img/struct-cefepime.svg',
  './img/struct-cefotaxime.svg',
  './img/struct-cefotetan.svg',
  './img/struct-cefoxitin.svg',
  './img/struct-cefpodoxime.svg',
  './img/struct-ceftaroline.svg',
  './img/struct-ceftazidime.svg',
  './img/struct-ceftizoxime.svg',
  './img/struct-ceftriaxone.svg',
  './img/struct-cefuroxime.svg',
  './img/struct-cephalothin.svg',
  './img/struct-chloramphenicol.svg',
  './img/struct-ciprofloxacin.svg',
  './img/struct-clarithromycin.svg',
  './img/struct-clindamycin.svg',
  './img/struct-daptomycin.svg',
  './img/struct-doripenem.svg',
  './img/struct-doxycycline.svg',
  './img/struct-eravacycline.svg',
  './img/struct-ertapenem.svg',
  './img/struct-erythromycin.svg',
  './img/struct-fluconazole.svg',
  './img/struct-flucytosine.svg',
  './img/struct-fosfomycin.svg',
  './img/struct-imipenem.svg',
  './img/struct-levofloxacin.svg',
  './img/struct-linezolid.svg',
  './img/struct-meropenem.svg',
  './img/struct-metronidazole.svg',
  './img/struct-micafungin.svg',
  './img/struct-minocycline.svg',
  './img/struct-moxifloxacin.svg',
  './img/struct-nalidixic-acid.svg',
  './img/struct-nitrofurantoin.svg',
  './img/struct-norfloxacin.svg',
  './img/struct-omadacycline.svg',
  './img/struct-oxacillin.svg',
  './img/struct-penicillin-g.svg',
  './img/struct-piperacillin.svg',
  './img/struct-rifampicin.svg',
  './img/struct-streptomycin.svg',
  './img/struct-sulfadiazine.svg',
  './img/struct-sulfamethoxazole.svg',
  './img/struct-tetracycline.svg',
  './img/struct-ticarcillin.svg',
  './img/struct-tigecycline.svg',
  './img/struct-tobramycin.svg',
  './img/struct-trimethoprim.svg',
  './img/struct-vancomycin.svg',
  './img/struct-voriconazole.svg',
  './img/test-betalactamase.svg',
  './img/test-bile.svg',
  './img/test-camp.svg',
  './img/test-catalase.svg',
  './img/test-cefoxitin.svg',
  './img/test-coagulase.svg',
  './img/test-colistin.svg',
  './img/test-d.svg',
  './img/test-ecim.svg',
  './img/test-esbl.svg',
  './img/test-etest.svg',
  './img/test-hlar.svg',
  './img/test-kb.svg',
  './img/test-mcim.svg',
  './img/test-optochin.svg',
  './img/test-oxidase.svg',
  './img/test-bmd.svg',
  './img/test-maldi.svg',
  './img/test-cefiderocol.svg',
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
