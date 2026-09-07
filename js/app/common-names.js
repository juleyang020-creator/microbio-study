(function () {
  'use strict';
  var Common = window.CommonNames;
  var NS = window.AppNS = window.AppNS || {};
  var el = NS.el;
  var refreshList = null, announce = null, catalog = null, importing = false, importMessage = null;
  function finishImport(text, error) {
    importing = false;
    if (isCommonNamesRoute() && refreshList && announce) {
      if (refreshList() !== false) { announce(text, error); }
    } else { importMessage = { text: text, error: error }; }
  }
  function commonNameCatalog() {
    if (!catalog) { catalog = Common.buildCatalog((window.DB || {}).microbeNames, (window.DB || {}).microbes); }
    return catalog;
  }
  function commonNameStore() {
    var storage = null;
    try { storage = window.localStorage; } catch (e) { /* store reports unavailable storage */ }
    return Common.createStore(storage);
  }
  function isCommonNamesRoute() { return NS.routeKey() === 'common-names'; }
  function commonNameButton(item, compact) {
    var feedback = el('span', { cls: 'common-add-feedback', role: 'status' });
    var button = el('button', { cls: 'common-add-btn', type: 'button', text: compact ? '＋ 常用' : '加入常用菌名',
      'aria-label': '将 ' + item.name + ' 加入常用菌名单', title: '加入个人名单，仪器简写可稍后填写',
      onClick: function () {
        var result = commonNameStore().save({ name: item.name, latin: item.latin || '', abbr: '', microbeId: item.microbeId || '' });
        if (result.ok || result.duplicateId) {
          button.textContent = result.ok ? '已加入常用' : '已在常用'; button.disabled = true;
          NS.fill(feedback, [ el('a', { href: '#/common-names', text: '查看名单' }) ]);
        } else { feedback.textContent = result.error; }
      }
    });
    return el('span', { cls: 'common-add-control' }, [ button, feedback ]);
  }
  function commonInput(id, placeholder, maxLength) {
    var input = el('input', { cls: 'common-input', id: id, type: 'text', placeholder: placeholder });
    input.setAttribute('maxlength', String(maxLength));
    input.setAttribute('autocomplete', 'off');
    return input;
  }
  function renderCommonNames() {
    NS.setActiveTool('common-names');
    var store = commonNameStore();
    var initial = store.load();
    var main = document.getElementById('main');
    main.scrollTop = 0;
    NS.fill(document.getElementById('sidebar'), [ el('section', { cls: 'search-guide' }, [
      el('p', { cls: 'eyebrow', text: '个人工作清单' }),
      el('h2', { text: '常见菌菌名速查' }),
      el('p', { text: '把工作中常用的菌名和本机简写集中保存，方便人工录入仪器。' }),
      el('p', { text: '名单仅保存在当前浏览器，不会自动同步到其他设备，也不会写入公共菌种库。请定期导出备份。' }),
      el('a', { cls: 'action-btn', href: '#/microbe-names', text: '打开完整菌名库 →' })
    ]) ]);
    var status = el('p', { cls: 'common-status', id: 'common-status', role: 'status', 'aria-live': 'polite' });
    function notify(text, error) { status.textContent = text; status.classList.toggle('is-error', !!error); }
    var copyPanel = el('div', { cls: 'common-copy-panel' });
    function showCopyText(text, cls) {
      var area = el('textarea', { cls: 'common-input ' + cls, 'aria-label': '待手工复制的内容', value: text });
      area.readOnly = true;
      NS.fill(copyPanel, [ area ]);
      area.focus();
      if (area.select) { area.select(); }
    }
    function copyValue(value, label) {
      function fallback() { showCopyText(value, 'common-copy-fallback'); notify('自动复制不可用，请复制下方已选中的' + label + '。', true); }
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
        navigator.clipboard.writeText(value).then(function () { copyPanel.replaceChildren(); notify('已复制' + label + '。'); }, fallback);
      } catch (e) { fallback(); }
    }
    function copyButton(item, key, label) {
      return el('button', { cls: 'action-btn common-copy-' + key, type: 'button', text: '复制' + label, disabled: !item[key],
        'aria-label': '复制 ' + item.name + ' 的' + label, onClick: function () { if (item[key]) { copyValue(item[key], label); } }
      });
    }
    var name = commonInput('common-name', '输入中文名或拉丁名', 200);
    var latin = commonInput('common-latin', '拉丁名，可手工填写', 200);
    var abbr = commonInput('common-abbr', '按本机词库填写，不自动生成', 80);
    name.setAttribute('required', '');
    var editId = '', sourceId = '', lastChoice = null, autoLatin = false, editSnapshot = null, codeAnchor = null;
    var keepCode = el('input', { id: 'common-keep-code', type: 'checkbox' });
    var codeWarningText = el('span');
    var codeWarning = el('label', { cls: 'common-code-confirm', 'for': keepCode.id }, [ keepCode, codeWarningText ]);
    codeWarning.hidden = true;
    function needsCodeConfirmation() {
      return !!(codeAnchor && abbr.value && abbr.value === codeAnchor.abbr && (name.value !== codeAnchor.name || latin.value !== codeAnchor.latin));
    }
    function updateCodeWarning(reset) {
      codeWarning.hidden = !needsCodeConfirmation();
      codeWarningText.textContent = '名称已变化。已核对拉丁名，确认仍保留原简写“' + abbr.value + '”。';
      if (reset) { keepCode.checked = false; }
    }
    var composing = false, candidates = [], activeCandidate = -1;
    var suggestions = el('ul', { cls: 'common-suggestions', id: 'common-suggestions', role: 'listbox', 'aria-label': '菌名补全候选' });
    suggestions.hidden = true;
    name.setAttribute('role', 'combobox');
    name.setAttribute('aria-autocomplete', 'list');
    name.setAttribute('aria-controls', 'common-suggestions');
    name.setAttribute('aria-expanded', 'false');
    name.setAttribute('aria-describedby', 'common-completion-help');
    var save = el('button', { cls: 'action-btn action-primary common-save', type: 'submit', text: '添加到名单' });
    var summary = el('summary', { text: '录入菌名' });
    var form = el('form', { cls: 'common-form', id: 'common-form' });
    var editor = el('details', { cls: 'common-editor', id: 'common-editor' }, [ summary, form ]);
    editor.open = initial.ok && !initial.items.length;
    function field(label, input) { return el('label', { cls: 'common-field', 'for': input.id }, [ el('span', { text: label }), input ]); }
    function resetForm(item) {
      item = item || {};
      editId = item.id || ''; sourceId = item.microbeId || '';
      editSnapshot = item.id ? item : null;
      lastChoice = null; autoLatin = false;
      codeAnchor = item.name ? { name: item.name, latin: item.latin || '', abbr: item.abbr || '' } : null;
      clearSuggestions();
      name.value = item.name || ''; latin.value = item.latin || ''; abbr.value = item.abbr || '';
      updateCodeWarning(true);
      summary.textContent = editId ? '编辑菌名与简写' : '录入菌名';
      save.textContent = editId ? '保存修改' : '添加到名单';
    }
    function edit(item) {
      resetForm(item); editor.open = true;
      editor.scrollIntoView({ block: 'start' }); name.focus({ preventScroll: true });
    }
    function clearSuggestions() {
      suggestions.replaceChildren(); suggestions.hidden = true; candidates = []; activeCandidate = -1;
      name.setAttribute('aria-expanded', 'false'); name.removeAttribute('aria-activedescendant');
    }
    function choose(candidate) {
      if (abbr.value && !codeAnchor) { codeAnchor = { name: name.value, latin: latin.value, abbr: abbr.value }; }
      name.value = candidate.name; latin.value = candidate.latin; sourceId = candidate.microbeId;
      lastChoice = { name: candidate.name, latin: candidate.latin }; autoLatin = true;
      if (!abbr.value) { codeAnchor = { name: name.value, latin: latin.value, abbr: '' }; }
      updateCodeWarning(true);
      clearSuggestions(); abbr.focus();
      notify(needsCodeConfirmation() ? '已补齐名称；原简写已保留，请核对后确认或重新填写。' : '已补齐中文名和拉丁名；简写请按本机词库填写。');
    }
    function completeName() {
      if (composing) { return; }
      sourceId = '';
      if (lastChoice && name.value !== lastChoice.name && autoLatin && latin.value === lastChoice.latin) { latin.value = ''; autoLatin = false; }
      updateCodeWarning(true);
      clearSuggestions();
      if (!name.value.trim()) { return; }
      candidates = Common.suggest(commonNameCatalog(), name.value, 8);
      candidates.forEach(function (candidate, index) {
        var option = el('li', { cls: 'common-option', id: 'common-option-' + index, role: 'option', 'aria-selected': 'false', onClick: function () { choose(candidate); } }, [
          el('strong', { text: candidate.name }), el('span', { text: candidate.latin || '库中未提供拉丁名' })
        ]);
        option.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        suggestions.appendChild(option);
      });
      suggestions.hidden = !candidates.length; name.setAttribute('aria-expanded', String(!!candidates.length));
    }
    name.addEventListener('input', completeName);
    name.addEventListener('compositionstart', function () { composing = true; clearSuggestions(); });
    name.addEventListener('compositionend', function () { composing = false; completeName(); });
    name.addEventListener('keydown', function (ev) {
      if (ev.isComposing || composing) { return; }
      if (ev.key === 'Escape') { ev.preventDefault(); clearSuggestions(); return; }
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && candidates.length) {
        ev.preventDefault();
        activeCandidate = ev.key === 'ArrowDown' ? Math.min(activeCandidate + 1, candidates.length - 1) : Math.max(activeCandidate - 1, 0);
        Array.prototype.forEach.call(suggestions.children, function (option, index) { option.setAttribute('aria-selected', String(index === activeCandidate)); });
        name.setAttribute('aria-activedescendant', 'common-option-' + activeCandidate);
        suggestions.children[activeCandidate].scrollIntoView({ block: 'nearest' });
      }
      if (ev.key === 'Enter' && candidates.length) {
        ev.preventDefault();
        if (activeCandidate >= 0 || candidates.length === 1) { choose(candidates[Math.max(activeCandidate, 0)]); }
        else { notify('有多个匹配项，请用方向键或点击选择；也可继续手工填写后点击保存。'); }
      }
    });
    name.addEventListener('blur', clearSuggestions);
    latin.addEventListener('input', function () { sourceId = ''; autoLatin = false; updateCodeWarning(true); });
    abbr.addEventListener('input', function () { codeAnchor = { name: name.value, latin: latin.value, abbr: abbr.value }; updateCodeWarning(true); });
    NS.fill(form, [
      el('div', { cls: 'common-field common-name-field' }, [
        el('label', { 'for': name.id, text: '菌名（必填，输入后可选择补全）' }), el('div', { cls: 'common-completion-box' }, [ name, suggestions ]),
        el('p', { cls: 'common-help', id: 'common-completion-help', text: '选择候选后补齐名称；库中没有的名称可手工填写并保存。' })
      ]), field('拉丁名', latin), field('自定义简写 / 仪器编码', abbr), codeWarning,
      el('p', { cls: 'common-help', text: '简写区分大小写并按原样保存。名称与编码仍需按本机词库核对，不代表仪器支持该菌名。' }),
      el('div', { cls: 'common-actions' }, [ save, el('button', { cls: 'action-btn', type: 'button', text: '取消', onClick: function () { resetForm(); editor.open = false; } }) ])
    ]);
    var filter = commonInput('common-filter', '菌名、拉丁名、简写', 200);
    filter.setAttribute('type', 'search');
    filter.setAttribute('aria-label', '筛选常用菌名单');
    var count = el('span', { cls: 'common-count', id: 'common-count' });
    var list = el('div', { cls: 'common-list', id: 'common-list' });
    function removePrompt(item, row) {
      if (row.querySelector('.common-remove-ask')) { return; }
      var ask = el('div', { cls: 'common-remove-ask' }, [
        el('span', { text: '从个人名单移除“' + item.name + '”？' }),
        el('button', { cls: 'action-btn common-remove-confirm', type: 'button', text: '确认移除', onClick: function () {
          var result = store.remove(item.id);
          if (!result.ok) { notify(result.error, true); return; }
          if (editId === item.id) { resetForm(); editor.open = false; }
          renderList(); notify('已从个人名单移除。');
        } }),
        el('button', { cls: 'action-btn', type: 'button', text: '取消', onClick: function () { row.removeChild(ask); } })
      ]);
      row.appendChild(ask);
    }
    function renderList() {
      var loaded = store.load();
      save.disabled = !loaded.ok;
      if (importButton) { importButton.disabled = importing; }
      if (!loaded.ok) { notify(loaded.error, true); count.textContent = '本机数据暂不可用'; list.replaceChildren(); return false; }
      var matches = Common.filter(loaded.items, filter.value);
      count.textContent = filter.value.trim() ? matches.length + ' / ' + loaded.items.length + ' 条' : loaded.items.length + ' 条常用菌名';
      NS.fill(list, matches.map(function (item) {
        var row = el('article', { cls: 'common-row', 'data-id': item.id });
        row.appendChild(el('div', { cls: 'common-row-name' }, [
          el('h2', { text: item.name }), el('p', { cls: 'common-latin', text: item.latin || '未填写拉丁名' })
        ]));
        row.appendChild(el('div', { cls: 'common-row-code' }, [
          el('span', { cls: 'common-label', text: '简写 / 仪器编码' }),
          el('code', { cls: item.abbr ? 'common-abbr' : 'common-missing', text: item.abbr || '未填写' }),
          copyButton(item, 'abbr', '简写')
        ]));
        row.appendChild(el('div', { cls: 'common-row-actions' }, [
          copyButton(item, 'name', '菌名'), copyButton(item, 'latin', '拉丁名'),
          el('button', { cls: 'action-btn common-edit', type: 'button', text: '编辑', 'aria-label': '编辑 ' + item.name, onClick: function () { edit(item); } }),
          el('button', { cls: 'action-btn common-remove', type: 'button', text: '移除', 'aria-label': '移除 ' + item.name, onClick: function () { removePrompt(item, row); } })
        ]));
        return row;
      }));
      if (!matches.length) {
        list.appendChild(el('div', { cls: 'common-empty' }, [
          el('h2', { text: loaded.items.length ? '名单中没有匹配项' : '建立自己的常用菌名单' }),
          el('p', { text: loaded.items.length ? '试试名称的一部分或自定义简写，也可以清空筛选。' : '在上方添加菌名；也可以在菌种详情或完整菌名库中点击“加入常用”。' })
        ]));
      }
      return true;
    }
    filter.addEventListener('input', renderList);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (composing) { return; }
      updateCodeWarning(false);
      if (needsCodeConfirmation() && !keepCode.checked) { notify('名称已变化，请重新填写简写，或核对后确认保留原简写。', true); return; }
      var result = store.save({ id: editId, name: name.value, latin: latin.value, abbr: abbr.value, microbeId: sourceId }, editSnapshot || undefined);
      if (!result.ok) { renderList(); notify(result.error, true); return; }
      resetForm(); editor.open = false; filter.value = '';
      renderList(); notify('已保存到本机常用菌名单。');
    });
    var exportButton = el('button', { cls: 'action-btn common-export', type: 'button', text: '导出备份', onClick: function () {
      var result = store.exportBackup();
      if (!result.ok) { notify(result.error, true); return; }
      if (!window.Blob || !window.URL || !window.URL.createObjectURL) {
        showCopyText(result.text, 'common-backup-text'); notify('浏览器不支持直接下载，请复制备份内容保存为 JSON 文件。'); return;
      }
      try {
        var url = window.URL.createObjectURL(new window.Blob([result.text], { type: 'application/json;charset=utf-8' }));
        var link = el('a', { href: url });
        link.setAttribute('download', '知微-常见菌名单.json'); link.hidden = true;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);
        notify('已发起备份下载，请确认文件已保存。');
      } catch (e) { showCopyText(result.text, 'common-backup-text'); notify('无法下载，请复制备份内容保存为 JSON 文件。', true); }
    } });
    var importInput = el('input', { id: 'common-import', type: 'file' });
    importInput.setAttribute('accept', '.json,application/json'); importInput.hidden = true;
    var importButton = el('button', { cls: 'action-btn common-import-button', type: 'button', text: '导入备份', onClick: function () { importInput.click(); } });
    importInput.addEventListener('change', function () {
      var file = importInput.files && importInput.files[0];
      if (!file || importing) { return; }
      if (file.size > 2 * 1024 * 1024) { notify('备份文件超过 2 MB，未导入。', true); importInput.value = ''; return; }
      importing = true; importButton.disabled = true; notify('正在读取备份，完成后会合并保存。');
      var reading;
      try {
        reading = file.text ? file.text() : new Promise(function (resolve, reject) {
          if (!window.FileReader) { reject(new Error('unsupported')); return; }
          var reader = new window.FileReader();
          reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsText(file);
        });
      } catch (e) { reading = Promise.reject(e); }
      Promise.resolve(reading).then(function (text) {
        var result = store.importBackup(text);
        if (!result.ok) { finishImport(result.error, true); return; }
        finishImport('导入完成：新增 ' + result.added + ' 条，跳过 ' + result.skipped + ' 条重复记录；已有简写未被覆盖。');
      }).catch(function () { finishImport('读取或导入备份失败，请检查当前名单。', true); }).then(function () {
        importButton.disabled = false; importInput.value = '';
      });
    });
    NS.fill(main, [ el('div', { cls: 'common-workspace' }, [
      el('header', { cls: 'common-head' }, [
        el('div', {}, [ el('p', { cls: 'eyebrow', text: '常用名单 · 本机保存' }), el('h1', { cls: 'detail-title', text: '常见菌菌名速查' }) ]),
        el('button', { cls: 'action-btn action-primary common-new', type: 'button', text: '＋ 添加菌名', onClick: function () { edit(null); } })
      ]),
      el('p', { cls: 'common-help', text: '用于人工录名；名单仅保存在当前浏览器，不自动同步。' }),
      el('details', { cls: 'common-backup' }, [
        el('summary', { text: '备份与迁移' }),
        el('div', { cls: 'common-backup-tools' }, [ exportButton, importButton, importInput, el('span', { cls: 'common-help', text: '合并导入，不覆盖已有简写；最多保存 500 条。请定期导出，以便换机或清理浏览器后恢复。' }) ])
      ]),
      status, copyPanel, editor,
      el('div', { cls: 'common-list-toolbar' }, [ el('div', { cls: 'common-filter-field' }, [ el('label', { 'for': filter.id, text: '名单内搜索' }), filter ]), count ]), list
    ]) ]);
    refreshList = renderList; announce = notify;
    if (renderList()) {
      if (importing) { notify('正在读取备份，完成后会合并保存。'); }
      else if (importMessage) { notify(importMessage.text, importMessage.error); importMessage = null; }
    }
  }
  window.addEventListener('storage', function (ev) {
    if ((ev.key === Common.STORAGE_KEY || ev.key === null) && isCommonNamesRoute() && refreshList) { refreshList(); }
  });
  Object.assign(NS, { commonNameStore, commonNameButton, isCommonNamesRoute, renderCommonNames });
})();
