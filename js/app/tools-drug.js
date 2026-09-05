(function () {
  'use strict';
  var Core = window.Core, View = window.View;
  var NS = window.AppNS = window.AppNS || {};
  var buildBpTable = NS.buildBpTable, db = NS.db, el = NS.el, eucastBadgeNodes = NS.eucastBadgeNodes, eucastNoteNode = NS.eucastNoteNode, fill = NS.fill, richInline = NS.richInline, routeKey = NS.routeKey, setActiveTool = NS.setActiveTool;
  // ===== 工具 1：天然耐药速查 =====
  var intrinsicFilter = '';
  function isIntrinsicRoute() { return routeKey() === 'intrinsic'; }
  function renderIntrinsic() {
    setActiveTool('intrinsic');
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选菌名/拉丁名/药名…', value: intrinsicFilter });
    search.addEventListener('input', function () { intrinsicFilter = search.value; renderIntrinsicMain(); });
    var sb = [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '天然耐药速查' }),
      el('div', { cls: 'cmp-hint', text: '左侧筛选；右侧按菌属列出全部天然耐药条目。点菌名可跳转详情。' }),
      search
    ]) ];
    fill(document.getElementById('sidebar'), sb);
    renderIntrinsicMain();
  }
  function intrinsicResistanceCard(r) {
    var nameEl = r.id
      ? el('a', { cls: 'intrinsic-link', text: r.名称, href: '#/microbes/' + r.id })
      : el('strong', { text: r.名称 });
    var children = [el('div', { cls: 'ir-card-head' }, [nameEl, el('span', { cls: 'latin', text: r.拉丁 })])];
    if ((r.耐药 || []).length) {
      children.push(el('div', { cls: 'ir-card-drugs' }, r.耐药.map(function (d) {
        return el('span', { cls: 'ir-drug-chip', text: d });
      })));
      if (r.备注) { children.push(el('div', { cls: 'ir-card-note', text: r.备注 })); }
    } else {
      children.push(el('div', { cls: 'ir-card-none', text: r.备注 || '对所列药物无固有耐药' }));
    }
    return el('article', { cls: 'ir-card' }, children);
  }
  function intrinsicMatrixNodes(filter) {
    var data = (window.DB && window.DB.intrinsicResistance) || null;
    if (!data) { return []; }
    var q = (filter || '').trim().toLowerCase();
    var out = [];
    (data.分组 || []).forEach(function (grp) {
      var rows = (grp.行 || []).filter(function (r) {
        if (!q) { return true; }
        var hay = [r.名称, r.拉丁, r.备注].concat(r.耐药 || []).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      if (rows.length === 0) { return; }
      // 桌面：药名×菌种矩阵；手机：按菌列出「只显示其耐药药物」的卡片（见 CSS 断点切换）
      var head = el('tr', {}, [el('th', { text: '菌种' })]
        .concat((grp.药物列 || []).map(function (d) { return el('th', { cls: 'ir-drug-col', text: d }); }))
        .concat([el('th', { text: '备注' })]));
      var body = rows.map(function (r) {
        var nameCell = r.id
          ? el('td', {}, [el('a', { cls: 'intrinsic-link', text: r.名称, href: '#/microbes/' + r.id }), el('span', { cls: 'latin', text: r.拉丁 })])
          : el('td', {}, [el('strong', { text: r.名称 }), el('span', { cls: 'latin', text: r.拉丁 })]);
        var cells = [nameCell].concat((grp.药物列 || []).map(function (d) {
          var isR = (r.耐药 || []).indexOf(d) !== -1;
          return el('td', { cls: 'ir-cell' }, [isR ? el('span', { cls: 'ir-chip', title: '固有耐药', text: '耐' }) : el('span', { cls: 'ir-dash', text: '—' })]);
        }));
        cells.push(el('td', { cls: 'ir-note', text: r.备注 || '' }));
        return el('tr', {}, cells);
      });
      var block = [el('div', { cls: 'ir-block-title', text: grp.界 })];
      if (grp.备注) { block.push(el('div', { cls: 'ir-block-note', text: grp.备注 })); }
      block.push(el('div', { cls: 'ir-matrix-view' }, [
        el('div', { cls: 'ir-table-wrap' }, [el('table', { cls: 'ir-table' }, [el('thead', {}, [head]), el('tbody', {}, body)])])
      ]));
      block.push(el('div', { cls: 'ir-card-view' }, rows.map(intrinsicResistanceCard)));
      out.push(el('div', { cls: 'ir-block' }, block));
    });
    if (out.length === 0) { return []; }
    return [el('div', { cls: 'ir-section' }, [
      el('div', { cls: 'ir-section-head' }, [
        el('span', { cls: 'ir-section-title', text: '固有耐药速查（CLSI 结构化 · 细菌 + 真菌）' }),
        el('span', { cls: 'ir-section-src', text: data.来源 })
      ]),
      el('div', { cls: 'ir-legend', text: data.说明 })
    ].concat(out))];
  }

  function renderIntrinsicMain() {
    var vm = View.intrinsicVM(db(), intrinsicFilter);
    var nodes = [ el('h2', { cls: 'detail-title', text: '天然耐药速查' }) ];
    nodes = nodes.concat(intrinsicMatrixNodes(intrinsicFilter));
    nodes.push(el('div', { cls: 'cmp-hint', text: '按菌属列出的文字条目：共 ' + vm.count + ' 条' + (intrinsicFilter ? '（已筛选）' : '') }));
    if (vm.groups.length === 0) {
      nodes.push(el('div', { cls: 'empty', text: '没有匹配的条目。' }));
    } else {
      vm.groups.forEach(function (g) {
        var items = g.items.map(function (it) {
          return el('div', { cls: 'intrinsic-card' }, [
            el('div', { cls: 'intrinsic-card-head' }, [
              el('a', { cls: 'intrinsic-link', text: it.名称, href: '#/microbes/' + it.id }),
              it.拉丁名 ? el('span', { cls: 'latin', text: it.拉丁名 }) : null
            ]),
            el('div', { cls: 'intrinsic-body', text: it.天然耐药 })
          ]);
        });
        nodes.push(el('div', { cls: 'intrinsic-group' }, [
          el('div', { cls: 'intrinsic-group-title', text: g.类别 + ' · ' + g.items.length }),
          el('div', { cls: 'intrinsic-list' }, items)
        ]));
      });
    }
    fill(document.getElementById('main'), nodes);
  }

  // ===== 工具 3：折点独立查询 + MIC 判读 =====
  var bpMode = 'lookup'; // 'lookup' | 'judge'
  var bpGroupFilter = '';
  var bpDrugFilter = '';
  var bpJudgeGroup = '';
  var bpJudgeDrug = '';
  var bpJudgeMIC = '';
  var bpJudgeMethod = 'mic'; // 'mic' | 'zone'
  var bpJudgeStd = 'clsi';   // 'clsi' | 'eucast'（EUCAST 仅 MIC）
  // 当前菌组+药物的 EUCAST MIC 折点（有则可切到 EUCAST 判读），无则 null
  function eucastDrugFor(菌组名, 药物名) {
    var eu = View.eucastVM(菌组名, (window.DB || {}).eucastBreakpoints);
    return eu ? (eu.drug[药物名] || null) : null;
  }
  // 某折点药物是否有可判读的纸片抑菌圈折点
  function drugHasZone(d) { return !!(d && (View.parseBP(d.抑菌圈_S) || View.parseBP(d.抑菌圈_R))); }
  function isBreakpointsRoute() { return routeKey() === 'breakpoints'; }
  function bpGroups() { return (window.DB && window.DB.breakpoints) || []; }
  function judgeableBpGroups() { return View.judgeableBreakpointGroups(bpGroups()); }
  function bpGroupByName(name) {
    return bpGroups().filter(function (g) { return g.菌组名 === name; })[0] || null;
  }
  function judgeableBpGroupByName(name) {
    return judgeableBpGroups().filter(function (g) { return g.菌组名 === name; })[0] || null;
  }
  function renderBreakpoints() {
    setActiveTool('breakpoints');
    // 侧栏：模式切换 +（judge 模式下）菌组列表
    var modeToggle = el('div', { cls: 'tool-controls' }, [
      el('button', { cls: 'cmp-add' + (bpMode === 'lookup' ? ' sel' : ''), text: '折点查询', onClick: function () { bpMode = 'lookup'; renderBreakpoints(); } }),
      el('button', { cls: 'cmp-add' + (bpMode === 'judge' ? ' sel' : ''), text: 'MIC 判读', onClick: function () { bpMode = 'judge'; renderBreakpoints(); } })
    ]);
    var sbNodes = [ el('div', { cls: 'cat-group' }, [
      el('div', { cls: 'cat-group-name', text: '折点工具' }),
      modeToggle
    ]) ];
    if (bpMode === 'judge') {
      var groupItems = judgeableBpGroups().map(function (g) {
        return el('button', {
          cls: 'cmp-pick' + (bpJudgeGroup === g.菌组名 ? ' sel' : ''),
          type: 'button',
          text: g.菌组名,
          'aria-pressed': String(bpJudgeGroup === g.菌组名),
          onClick: function () {
            bpJudgeGroup = g.菌组名;
            bpJudgeDrug = (g.药物 && g.药物[0]) ? g.药物[0].药物 : '';
            bpJudgeMIC = '';
            renderBreakpoints();
          }
        });
      });
      sbNodes.push(el('div', { cls: 'cat-group' }, [
        el('div', { cls: 'cat-group-name', text: '可判读菌组 (' + judgeableBpGroups().length + ')' }),
        el('div', { cls: 'cmp-hint', text: '已撤销或仅作历史参考的折点不进入 MIC 自动判读。' }),
        el('div', { cls: 'bp-group-list' }, groupItems)
      ]));
    } else {
      sbNodes.push(el('div', { cls: 'cmp-hint', text: '在右侧按菌组名 / 药物名筛选，查看 CLSI 折点表。切到「MIC 判读」可输入数值自动判读 S/I/R。' }));
    }
    fill(document.getElementById('sidebar'), sbNodes);
    renderBreakpointsMain();
  }
  // 念珠菌标本部位报告限制（M27M44S App A）——仅当查询结果含抗真菌(念珠菌)组时展示
  function bpSiteReportingNodes(shownGroups) {
    var data = (window.DB && window.DB.siteReporting) || null;
    if (!data) { return []; }
    var hasAntifungal = (shownGroups || []).some(function (g) {
      return /M27M44S/.test(g.来源 || '') || /M27M44S/.test(g.CLSI表 || '') || /念珠菌|隐球菌/.test(g.菌组名 || '');
    });
    if (!hasAntifungal) { return []; }
    var blocks = (data.分组 || []).map(function (grp) {
      var rows = (grp.规则 || []).map(function (r) {
        return el('tr', {}, [
          el('td', { cls: 'sr-site', text: r.部位 }),
          el('td', { cls: 'sr-report', text: r.报告 }),
          el('td', { cls: 'sr-note', text: r.说明 || '' })
        ]);
      });
      return el('div', { cls: 'sr-block' }, [
        el('div', { cls: 'sr-block-title', text: grp.药类 }),
        el('div', { cls: 'sr-table-wrap' }, [el('table', { cls: 'sr-table' }, [
          el('thead', {}, [el('tr', {}, [el('th', { text: '标本部位' }), el('th', { text: '报告规则' }), el('th', { text: '说明' })])]),
          el('tbody', {}, rows)
        ])])
      ]);
    });
    return [el('div', { cls: 'sr-section' }, [
      el('div', { cls: 'sr-section-head' }, [
        el('span', { cls: 'sr-section-title', text: '念珠菌标本部位报告限制' }),
        el('span', { cls: 'sr-section-src', text: data.来源 })
      ]),
      el('div', { cls: 'sr-legend', text: data.说明 })
    ].concat(blocks))];
  }
  function renderBreakpointsMain() {
    var nodes = [ el('h2', { cls: 'detail-title', text: bpMode === 'lookup' ? '折点查询' : 'MIC 判读' }) ];
    if (bpMode === 'lookup') {
      // 顶部筛选
      var gf = el('input', { cls: 'cmp-search', type: 'search', placeholder: '按菌组名筛选…', value: bpGroupFilter, style: 'display:inline-block;width:auto;margin-right:8px;' });
      gf.addEventListener('input', function () { bpGroupFilter = gf.value; renderBreakpointsMain(); });
      var df = el('input', { cls: 'cmp-search', type: 'search', placeholder: '按药物名/简写筛选…', value: bpDrugFilter, style: 'display:inline-block;width:auto;' });
      df.addEventListener('input', function () { bpDrugFilter = df.value; renderBreakpointsMain(); });
      nodes.push(el('div', { cls: 'bp-filters' }, [ gf, df ]));
      nodes.push(el('div', { cls: 'bp-eucast-bar' }, eucastBadgeNodes().concat([ eucastNoteNode() ])));
      var groups = View.breakpointLookupVM(bpGroups(), bpGroupFilter, bpDrugFilter);
      if (groups.length === 0) {
        nodes.push(el('div', { cls: 'empty', text: '没有匹配的折点。' }));
      } else {
        groups.forEach(function (g) {
          var euG = View.eucastVM(g.菌组名, (window.DB || {}).eucastBreakpoints);
          nodes.push(el('div', { cls: 'bp-group' }, [
            el('div', { cls: 'bp-group-head' }, [
              el('span', { cls: 'bp-title', text: g.菌组名 }),
              el('span', { cls: 'bp-source', text: (g.来源 || 'CLSI M100 Ed36 (2026)') + '  |  ' + g.CLSI表 + '  |  ' + g.菌种.length + ' 菌种' })
            ].concat(euG ? eucastBadgeNodes() : [])),
            buildBpTable(g.药物, euG)
          ]));
        });
        bpSiteReportingNodes(groups).forEach(function (n) { nodes.push(n); });
      }
    } else {
      // MIC 判读表单
      var judgeGroups = judgeableBpGroups();
      var group = bpJudgeGroup ? judgeableBpGroupByName(bpJudgeGroup) : null;
      if (bpJudgeGroup && !group) {
        bpJudgeGroup = '';
        bpJudgeDrug = '';
        group = null;
      }
      var groupSelect = el('select', { cls: 'bp-select' });
      groupSelect.id = 'bp-judge-group';
      groupSelect.appendChild(el('option', { value: '', text: '— 选择菌组 —' }));
      judgeGroups.forEach(function (g) {
        var opt = el('option', { value: g.菌组名, text: g.菌组名 });
        if (g.菌组名 === bpJudgeGroup) { opt.selected = true; }
        groupSelect.appendChild(opt);
      });
      groupSelect.addEventListener('change', function () {
        bpJudgeGroup = groupSelect.value;
        var gg = bpJudgeGroup ? judgeableBpGroupByName(bpJudgeGroup) : null;
        bpJudgeDrug = (gg && gg.药物 && gg.药物[0]) ? gg.药物[0].药物 : '';
        bpJudgeMIC = '';
        renderBreakpointsMain();
      });

      var drugSelect = el('select', { cls: 'bp-select' });
      drugSelect.id = 'bp-judge-drug';
      drugSelect.appendChild(el('option', { value: '', text: '— 选择药物 —' }));
      if (group) {
        group.药物.forEach(function (d) {
          var opt = el('option', { value: d.药物, text: d.药物 + ' (' + d.简写 + ')' });
          if (d.药物 === bpJudgeDrug) { opt.selected = true; }
          drugSelect.appendChild(opt);
        });
      }
      drugSelect.addEventListener('change', function () { bpJudgeDrug = drugSelect.value; bpJudgeMIC = ''; bpJudgeMethod = 'mic'; renderBreakpointsMain(); });

      // 当前所选药物是否支持纸片抑菌圈判读
      var curDrug = (group && group.药物 || []).filter(function (d) { return d.药物 === bpJudgeDrug; })[0];
      var zoneAvail = drugHasZone(curDrug);
      if (bpJudgeMethod === 'zone' && !zoneAvail) { bpJudgeMethod = 'mic'; }
      var isZone = bpJudgeMethod === 'zone';

      // 方法切换：MIC / 抑菌圈（仅当该药有纸片折点时可选）
      var methodBtns = el('div', { cls: 'bp-method-toggle' }, [
        el('button', { cls: 'cmp-add' + (!isZone ? ' sel' : ''), text: 'MIC (μg/mL)', onClick: function () { bpJudgeMethod = 'mic'; bpJudgeMIC = ''; renderBreakpointsMain(); } }),
        el('button', {
          cls: 'cmp-add' + (isZone ? ' sel' : '') + (zoneAvail ? '' : ' disabled'),
          title: zoneAvail ? '按纸片扩散法抑菌圈判读' : '该药物无纸片抑菌圈折点',
          text: '抑菌圈 (mm)',
          onClick: function () { if (zoneAvail) { bpJudgeMethod = 'zone'; bpJudgeMIC = ''; renderBreakpointsMain(); } }
        })
      ]);

      // 标准切换：CLSI / EUCAST（EUCAST 仅 MIC，且该药有 EUCAST 折点时才出现）
      var euDrug = eucastDrugFor(bpJudgeGroup, bpJudgeDrug);
      if (bpJudgeStd === 'eucast' && (!euDrug || isZone)) { bpJudgeStd = 'clsi'; }
      var stdBtns = (euDrug && !isZone) ? el('div', { cls: 'bp-method-toggle' }, [
        el('button', { cls: 'cmp-add' + (bpJudgeStd === 'clsi' ? ' sel' : ''), text: 'CLSI', onClick: function () { bpJudgeStd = 'clsi'; renderBreakpointsMain(); } }),
        el('button', { cls: 'cmp-add' + (bpJudgeStd === 'eucast' ? ' sel' : ''), title: 'EUCAST v16.1 折点判读', text: 'EUCAST', onClick: function () { bpJudgeStd = 'eucast'; renderBreakpointsMain(); } })
      ]) : null;

      var valInput = el('input', {
        cls: 'cmp-search', type: 'number', value: bpJudgeMIC, min: '0', style: 'width:200px;',
        placeholder: isZone ? '输入抑菌圈直径 (mm)' : '输入 MIC 值 (μg/mL)',
        step: isZone ? '1' : '0.01'
      });
      valInput.id = 'bp-judge-mic';
      valInput.addEventListener('input', function () { bpJudgeMIC = valInput.value; renderJudgeResult(); });

      nodes.push(el('div', { cls: 'bp-judge-form' }, [
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '菌组', 'for': 'bp-judge-group' }), groupSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '药物', 'for': 'bp-judge-drug' }), drugSelect ]),
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '方法' }), methodBtns ]),
        stdBtns ? el('div', { cls: 'bp-judge-row' }, [ el('label', { text: '标准' }), stdBtns ]) : null,
        el('div', { cls: 'bp-judge-row' }, [ el('label', { text: isZone ? '抑菌圈' : 'MIC', 'for': 'bp-judge-mic' }), valInput ])
      ]));

      var resultBox = el('div', { cls: 'bp-judge-result', id: 'bp-judge-result' });
      nodes.push(resultBox);
      fill(document.getElementById('main'), nodes);
      // fill 是同步的，DOM 已就位，直接渲染判读结果
      renderJudgeResult();
      return;
    }
    fill(document.getElementById('main'), nodes);
  }
  // 复方制剂（β-内酰胺/酶抑制剂等）是单一药物、单一折点：CLSI 记法「活性成分/固定抑制剂浓度」中，
  // 斜线后的数字是固定不变的抑制剂浓度，并非第二个折点。判读只看活性成分（斜线前）的值。
  function renderJudgeResult() {
    var box = document.getElementById('bp-judge-result');
    if (!box) { return; }
    var isZone = bpJudgeMethod === 'zone';
    if (!bpJudgeGroup || !bpJudgeDrug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '请选择菌组与药物，并输入' + (isZone ? '抑菌圈直径' : ' MIC 值') + '。' }));
      return;
    }
    var group = judgeableBpGroupByName(bpJudgeGroup);
    var drug = (group && group.药物 || []).filter(function (d) { return d.药物 === bpJudgeDrug; })[0];
    if (!drug) {
      box.replaceChildren(el('div', { cls: 'empty-sm', text: '该菌组未找到此药物。' }));
      return;
    }
    // 显示该药折点（按当前方法与标准）。EUCAST 仅 MIC：S≤X / R>Y，I=（X,Y]“增加暴露”
    var isEu = (bpJudgeStd === 'eucast') && !isZone;
    var euD = isEu ? eucastDrugFor(bpJudgeGroup, bpJudgeDrug) : null;
    if (isEu && !euD) { isEu = false; }
    var bpS, bpMid, bpR;
    if (isEu) {
      bpS = euD.MIC_S; bpR = euD.MIC_R;
      var _x = (String(bpS).match(/-?\d+(\.\d+)?/) || [])[0], _y = (String(bpR).match(/-?\d+(\.\d+)?/) || [])[0];
      var _X = _x != null ? parseFloat(_x) : null, _Y = _y != null ? parseFloat(_y) : null;
      bpMid = (_X != null && _Y != null && _X < _Y) ? (_X + '–' + _Y) : ''; // EUCAST I 区间（增加暴露）
    } else {
      bpS = isZone ? drug.抑菌圈_S : drug.MIC_S;
      bpMid = isZone ? drug.抑菌圈_I : drug.MIC_I;
      bpR = isZone ? drug.抑菌圈_R : drug.MIC_R;
    }
    var unit = isZone ? 'mm' : 'μg/mL';
    var bpInfoKids = [
      el('span', { text: (isEu ? 'EUCAST 折点：S ' + (bpS || '—') + ' / R ' + (bpR || '—') + (bpMid ? '（I：' + bpMid + '，增加暴露）' : '') + ' (' + unit + ')'
        : ((isZone ? '抑菌圈折点：S ' : 'CLSI 折点：S ') + (bpS || '—') + ' / I ' + (bpMid || '—') + ' / R ' + (bpR || '—') + ' (' + unit + ')')) })
    ];
    if (!isZone && !isEu && /\//.test(String(drug.MIC_S || '') + String(drug.MIC_I || '') + String(drug.MIC_R || ''))) {
      bpInfoKids.push(el('div', { cls: 'bp-judge-note', text: '复方制剂：单一药物、单一折点；斜线后为固定配比的另一成分浓度（非第二折点）。请输入活性成分（斜线前）的 MIC。' }));
    }
    if (isEu) { bpInfoKids.push(el('div', { cls: 'bp-judge-note', text: 'EUCAST v16.1 判读。“I” 为“增加暴露仍可敏感”（需加大剂量/优化给药），与 CLSI 的“中介”定义不同；判读仅供教学，正式报告以实验室现行 EUCAST 版本与 SOP 为准。' })); }
    var bpInfo = el('div', { cls: 'bp-judge-bp' }, bpInfoKids);
    if (!bpJudgeMIC || bpJudgeMIC === '') {
      box.replaceChildren(bpInfo, el('div', { cls: 'empty-sm', text: '输入' + (isZone ? '抑菌圈直径' : ' MIC 值') + '后自动判读。' }));
      return;
    }
    // EUCAST 的 I 不是 CLSI 的「中介」，而是「增加暴露仍可敏感」，结论行须用各自标准的措辞
    var judgeOpts = isEu ? { midLabel: '增加暴露 I' } : null;
    var verdict = isZone ? View.judgeZone(bpJudgeMIC, bpS, bpMid, bpR, judgeOpts) : View.judgeMIC(bpJudgeMIC, bpS, bpMid, bpR, judgeOpts);
    var clsMap = { S: 'v-s', R: 'v-r', SDD: 'v-sdd', I: 'v-i', NS: 'v-ns' };
    var cls = 'bp-verdict ' + (clsMap[verdict.result] || 'v-unknown');
    box.replaceChildren(bpInfo, el('div', { cls: cls }, [
      el('span', { cls: 'bp-verdict-tag', text: verdict.result === 'invalid' ? '无效' : verdict.result }),
      el('span', { cls: 'bp-verdict-reason', text: verdict.reason })
    ]));
    if (verdict.adjusted) {
      box.appendChild(el('div', { cls: 'bp-judge-note', text: '⚠️ 输入值非标准二倍稀释点，已向上归入 ' + verdict.interpretedValue + ' μg/mL 判读（未静默修正原始输入）。' }));
    }
    if (drug.备注) {
      box.appendChild(el('div', { cls: 'bp-judge-note', text: '备注：' + drug.备注 }));
    }
  }

  // ===== 工具 4：异常药敏 / 修正规则 =====
  var astFilter = '';
  var astLevel = 'all';
  function isAstAlertsRoute() { return routeKey() === 'ast-alerts'; }
  function astAlerts() { return (window.DB && window.DB.astAlerts) || []; }
  function astSources() { return (window.DB && window.DB.astAlertSources) || []; }
  function levelLabel(level) { return level === 'all' ? '全部' : level; }
  function astLevelClass(level) {
    if (level === '必须修正') { return 'ast-level ast-critical'; }
    if (level === '需复核') { return 'ast-level ast-review'; }
    if (level === '限制报告') { return 'ast-level ast-limit'; }
    return 'ast-level';
  }
  function renderAstAlerts() {
    setActiveTool('ast-alerts');
    var vm = View.astAlertsVM(astAlerts(), { filter: astFilter, level: astLevel });
    var levelBtns = vm.levels.map(function (lv) {
      return el('button', {
        cls: 'cmp-add' + (astLevel === lv ? ' sel' : ''),
        text: levelLabel(lv),
        onClick: function () { astLevel = lv; renderAstAlerts(); }
      });
    });
    var search = el('input', { cls: 'cmp-search', type: 'search', placeholder: '筛选菌名/药物/机制…', value: astFilter });
    search.addEventListener('input', function () { astFilter = search.value; renderAstAlertsMain(); });
    fill(document.getElementById('sidebar'), [
      el('div', { cls: 'cat-group' }, [
        el('div', { cls: 'cat-group-name', text: '异常药敏' }),
        el('div', { cls: 'cmp-hint', text: '用于发现“看起来敏感但不应直接报告”的组合。正式报告以本院 SOP 和当前标准为准。' }),
        el('div', { cls: 'tool-controls ast-filter-controls' }, levelBtns),
        search
      ])
    ]);
    renderAstAlertsMain();
  }
  function astLevelIcon(level) {
    if (level === '必须修正') { return '⚠'; }
    if (level === '需复核') { return '⟳'; }
    if (level === '限制报告') { return '⊘'; }
    return '•';
  }
  function astLevelDesc(level) {
    if (level === '必须修正') { return '结果达修正条件，须按规则改判 / 加注后报告'; }
    if (level === '需复核') { return '先核实鉴定 / 方法 / 重测，再决定发报'; }
    if (level === '限制报告') { return '结果不宜直接报告，需限制或补充试验'; }
    return '';
  }
  function astLevelChip(level) {
    return el('span', { cls: astLevelClass(level) }, [
      el('span', { cls: 'ast-level-ic', 'aria-hidden': 'true', text: astLevelIcon(level) }),
      el('span', { text: level })
    ]);
  }
  function astLegend() {
    return el('div', { cls: 'ast-legend' }, ['必须修正', '需复核', '限制报告'].map(function (lv) {
      return el('div', { cls: 'ast-legend-item' }, [
        astLevelChip(lv),
        el('span', { cls: 'ast-legend-desc', text: astLevelDesc(lv) })
      ]);
    }));
  }
  function renderAstAlertsMain() {
    var vm = View.astAlertsVM(astAlerts(), { filter: astFilter, level: astLevel });
    var nodes = [
      el('div', { cls: 'detail-head' }, [
        el('h2', { cls: 'detail-title', text: '异常药敏 / 修正规则' }),
        el('span', { cls: 'badge', text: vm.count + ' 条' })
      ]),
      el('div', { cls: 'cmp-hint ast-disclaimer', text: '定位常见矛盾结果、固有耐药、限制报告和需要补充试验的场景；点行展开详情。不替代最终审核。' }),
      astLegend()
    ];
    if (!vm.list.length) {
      nodes.push(el('div', { cls: 'empty', text: '没有匹配的异常药敏规则。' }));
    } else {
      nodes.push(buildAstTable(vm.list));
    }
    var refs = astSources().map(function (src) {
      return el('a', { cls: 'ref-link', text: src.名称, href: src.链接, target: '_blank', rel: 'noopener noreferrer' });
    });
    if (refs.length) {
      nodes.push(el('div', { cls: 'refs' }, [
        el('div', { cls: 'refs-label', text: '参考口径' }),
        el('div', { cls: 'chips' }, refs)
      ]));
    }
    fill(document.getElementById('main'), nodes);
  }
  function astLine(label, text) {
    return el('div', { cls: 'ast-line' }, [
      el('span', { cls: 'ast-line-label', text: label }),
      el('span', { cls: 'ast-line-text' }, richInline(text || '—'))
    ]);
  }
  function toggleAstRow(sumRow, detailRow, caret, btn) {
    var open = detailRow.style.display !== 'none';
    detailRow.style.display = open ? 'none' : '';
    sumRow.classList.toggle('open', !open);
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    caret.textContent = open ? '▸' : '▾';
  }
  function buildAstTable(list) {
    var head = el('tr', {}, [
      el('th', { cls: 'ast-th-level', text: '等级' }),
      el('th', { cls: 'ast-th-cat', text: '类别' }),
      el('th', { text: '异常药敏情形' }),
      el('th', { cls: 'ast-th-toggle', 'aria-label': '展开' })
    ]);
    var body = [];
    list.forEach(function (item) {
      var tags = (item.关键词 || []).slice(0, 8).map(function (tag) {
        return el('span', { cls: 'morph-tag', text: tag });
      });
      var detailInner = [
        astLine('触发', item.触发),
        astLine('异常', item.异常结果),
        astLine('处理', item.处理),
        astLine('依据', item.依据)
      ];
      if (tags.length) { detailInner.push(el('div', { cls: 'chips ast-tags' }, tags)); }
      var detailId = 'ast-d-' + item.id;
      var detailRow = el('tr', { cls: 'ast-detail-row', id: detailId }, [
        el('td', { colspan: '4' }, [el('div', { cls: 'ast-detail' }, detailInner)])
      ]);
      detailRow.style.display = 'none';
      // 真实 <button> 承载可访问的展开控件（保留 tr 的行语义，避免 role=button 破坏表格结构）
      var caret = el('span', { cls: 'ast-caret', 'aria-hidden': 'true', text: '▸' });
      var btn = el('button', { cls: 'ast-toggle-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': detailId, 'aria-label': item.标题 + '：展开/收起详情' }, [caret]);
      var sumRow = el('tr', { cls: 'ast-row' }, [
        el('td', { cls: 'ast-cell-level' }, [astLevelChip(item.等级)]),
        el('td', { cls: 'ast-cell-cat', text: item.类别 }),
        el('td', { cls: 'ast-cell-title' }, [
          el('span', { cls: 'ast-row-cat-inline', text: item.类别 }),
          el('span', { cls: 'ast-row-title', text: item.标题 })
        ]),
        el('td', { cls: 'ast-cell-toggle' }, [btn])
      ]);
      // 整行可点（鼠标便利）；键盘/读屏经内部 button（其 click 冒泡到本行，单次切换）
      sumRow.addEventListener('click', function () { toggleAstRow(sumRow, detailRow, caret, btn); });
      body.push(sumRow);
      body.push(detailRow);
    });
    return el('div', { cls: 'ast-table-wrap' }, [
      el('table', { cls: 'ast-table' }, [el('thead', {}, [head]), el('tbody', {}, body)])
    ]);
  }

  Object.assign(NS, { astAlerts, astFilter, astLegend, astLevel, astLevelChip, astLevelClass, astLevelDesc, astLevelIcon, astLine, astSources, bpDrugFilter, bpGroupByName, bpGroupFilter, bpGroups, bpJudgeDrug, bpJudgeGroup, bpJudgeMIC, bpJudgeMethod, bpJudgeStd, bpMode, bpSiteReportingNodes, buildAstTable, drugHasZone, eucastDrugFor, intrinsicFilter, intrinsicMatrixNodes, intrinsicResistanceCard, isAstAlertsRoute, isBreakpointsRoute, isIntrinsicRoute, judgeableBpGroupByName, judgeableBpGroups, levelLabel, renderAstAlerts, renderAstAlertsMain, renderBreakpoints, renderBreakpointsMain, renderIntrinsic, renderIntrinsicMain, renderJudgeResult, toggleAstRow });
})();
