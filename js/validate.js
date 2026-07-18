(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.Core) { return; }
  var DB = window.DB || {};
  var db = {
    microbes: DB.microbes || [],
    antibiotics: DB.antibiotics || [],
    resistance: DB.resistance || [],
    cards: DB.cards || [],
    tests: DB.tests || [],
    media: DB.media || [],
    staining: DB.staining || [],
    'biochem-tests': DB.biochemTests || [],
    'qc-strains': DB['qc-strains'] || []
  };
  var problems = window.Core.validateData(db, DB.categories || {});
  if (problems.length) {
    console.warn('[数据自检] 发现 ' + problems.length + ' 个问题：');
    problems.forEach(function (p) { console.warn('  • ' + p); });
  } else {
    console.info('[数据自检] 数据正常，未发现问题。');
  }
})();
