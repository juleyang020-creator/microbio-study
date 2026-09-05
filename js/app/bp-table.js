(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var abxIdByDrugText = NS.abxIdByDrugText, bpTierBadge = NS.bpTierBadge, bpTierLegend = NS.bpTierLegend, bpUrineChip = NS.bpUrineChip, el = NS.el;
  var COMBO_BP_NOTE = '复方制剂为单一药物、按单一折点判读：斜线后的数字是固定配比的另一成分浓度（如酶抑制剂或第二组分），并非第二个折点。';
  // EUCAST 阶段1：标注本表为 CLSI 标准 + 官方对照链接 + 差异提示（未收录 EUCAST 数值）
  var EUCAST_URL = 'https://www.eucast.org/clinical_breakpoints';
  function eucastBadgeNodes() {
    return [
      el('span', { cls: 'bp-standard-badge', title: '本表折点为 CLSI 标准', text: 'CLSI' }),
      el('a', { cls: 'bp-eucast-link', text: 'EUCAST 对照', href: EUCAST_URL, target: '_blank', rel: 'noopener noreferrer', title: '欧洲抗菌药敏试验委员会折点（与 CLSI 可能存在差异）' })
    ];
  }
  function eucastNoteNode() {
    return el('div', { cls: 'bp-eucast-note', text: '⚠️ CLSI 与 EUCAST 并列对照。EUCAST 列为 v16.1 折点（S≤ / R>；X<Y 时 X<MIC≤Y 为 “I=增加暴露”，与 CLSI 的 “I=中介” 定义不同）；与 CLSI 界值不同处已高亮，“⟨括⟩”为 EUCAST 括号折点、需按指南谨慎使用，空缺表示 EUCAST 未设该折点或本 App 未收录。欧洲报告以 EUCAST 现行版为准。' });
  }
  // EUCAST MIC 单元格（并排对照）：无数据显示 —；与 CLSI 界值不同则高亮
  function eucastCell(euD, clsiMIC) {
    if (!euD) { return el('td', { cls: 'bp-eu' }, [ el('span', { cls: 'bp-eu-na', text: '—' }) ]); }
    var txt = (euD.MIC_S || '—') + (euD.MIC_R ? ' / ' + euD.MIC_R : '');
    var kids = [ document.createTextNode(txt) ];
    if (euD.括注) { kids.push(el('span', { cls: 'bp-eu-bracket', title: 'EUCAST 括号折点，需按指南谨慎使用', text: ' ⟨括⟩' })); }
    return el('td', { cls: 'bp-eu' + (View.micDiffers(clsiMIC, euD.MIC_S, euD.MIC_R) ? ' bp-eu-diff' : '') }, kids);
  }
  // 本组是否含 EUCAST 抑菌圈（抗真菌无圈）
  function euHasZone(eu) { return !!(eu && Object.keys(eu.drug).some(function (k) { return eu.drug[k] && eu.drug[k].抑菌圈_S; })); }
  // EUCAST 抑菌圈单元格（≥S / <R）
  function eucastZoneCell(euD) {
    if (!euD || !euD.抑菌圈_S) { return el('td', { cls: 'bp-eu' }, [ el('span', { cls: 'bp-eu-na', text: '—' }) ]); }
    return el('td', { cls: 'bp-eu' }, [ document.createTextNode(euD.抑菌圈_S + ' / ' + euD.抑菌圈_R) ]);
  }
  // 折点表分组表头：无 EUCAST 时单行；有则两行（CLSI｜EUCAST 各跨其子列），统一风格
  // table-layout:fixed 只按**首行**定列宽，而首行是 thead。此前列宽写在 tbody 的
  // td.bp-drug / td.bp-comment 上，被完全忽略 → 6 列均分，药名与备注挤成 60px，
  // 移动端行高被撑到 200px+。故列宽类必须挂在 th 上。
  function bpThead(eu) {
    if (!eu) {
      return [ el('tr', {}, [ el('th', { cls: 'bp-drug', text: '抗菌药物' }), el('th', { text: 'MIC (μg/mL)' }), el('th', { text: '抑菌圈 (mm)' }), el('th', { cls: 'bp-comment', text: '备注' }) ]) ];
    }
    var hz = euHasZone(eu);
    var r1 = [ el('th', { rowspan: '2', cls: 'bp-drug', text: '抗菌药物' }), el('th', { colspan: '2', cls: 'bp-grp bp-grp-clsi', text: 'CLSI' }),
      el('th', { colspan: String(hz ? 2 : 1), cls: 'bp-grp bp-grp-eu', text: 'EUCAST' }), el('th', { rowspan: '2', cls: 'bp-comment', text: '备注' }) ];
    var r2 = [ el('th', { text: 'MIC (μg/mL)' }), el('th', { text: '抑菌圈 (mm)' }), el('th', { cls: 'bp-eu-col', text: 'MIC' }) ];
    if (hz) { r2.push(el('th', { cls: 'bp-eu-col', text: '抑菌圈' })); }
    return [ el('tr', {}, r1), el('tr', {}, r2) ];
  }
  // 仅"数字/数字"才算复方记法；详情页折点经 breakpointVM 合并为 "≤8/4 / 16/8 / ≥32/16"，
  // 用 \d/\d 可避开 " / " 分隔符的误判，同时兼容原始 MIC_S/I/R 字段。
  function bpHasCombo(drugs) {
    return (drugs || []).some(function (d) {
      var s = String(d.MIC_S || '') + ' ' + String(d.MIC_I || '') + ' ' + String(d.MIC_R || '') + ' ' + String(d.MIC || '');
      return /\d\/\d/.test(s); // 复方记法"数字/数字"无空格；VM 合并串的 " / " 分隔有空格，故不会误判
    });
  }
  function buildBpTable(drugs, eu) {
    var euZone = euHasZone(eu);
    var bodyRows = drugs.map(function (d) {
      var aid = abxIdByDrugText(d.药物);
      var drugCell = aid
        ? el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' '), el('a', { cls: 'bp-drug-link', text: d.药物, href: '#/antibiotics/' + aid }) ])
        : el('td', { cls: 'bp-drug' }, [ bpTierBadge(d.组别), bpUrineChip(d), el('strong', { text: d.简写 }), document.createTextNode(' ' + d.药物) ]);
      var clsiMic = [d.MIC_S, d.MIC_I, d.MIC_R].filter(Boolean).join(' / ');
      var cells = [ drugCell, el('td', { cls: 'bp-mic', text: clsiMic }), el('td', { cls: 'bp-disk', text: [d.抑菌圈_S, d.抑菌圈_I, d.抑菌圈_R].filter(Boolean).join(' / ') }) ];
      if (eu) {
        cells.push(eucastCell(eu.drug[d.药物], clsiMic)); // EUCAST MIC 置于抑菌圈之后
        if (euZone) { cells.push(eucastZoneCell(eu.drug[d.药物])); }
      }
      cells.push(el('td', { cls: 'bp-comment', text: d.备注 || '' }));
      return el('tr', {}, cells);
    });
    var tableWrap = el('div', { cls: 'table-scroll' }, [
      el('table', { cls: 'bp-table' }, [
        el('thead', {}, bpThead(eu)),
        el('tbody', {}, bodyRows)
      ])
    ]);
    var legend = bpTierLegend(drugs);
    if (!legend && !bpHasCombo(drugs)) { return tableWrap; }
    return el('div', {}, [ tableWrap, legend, bpHasCombo(drugs) ? el('div', { cls: 'bp-foot', text: COMBO_BP_NOTE }) : null ]);
  }
  Object.assign(NS, { COMBO_BP_NOTE, EUCAST_URL, bpHasCombo, bpThead, buildBpTable, euHasZone, eucastBadgeNodes, eucastCell, eucastNoteNode, eucastZoneCell });
})();
