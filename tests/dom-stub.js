'use strict';
// app.js 是纯 DOM 渲染层，此前完全没有测试——#74 删关系图时留下的 GRAPH_COMMON 悬空引用
// 让 #/compare 整页崩溃，却一路通过了发布检查和一整轮人工审查。这里提供一个够用的
// DOM stub，让 app.js 能在 Node 里真正跑起来，从而把「某条路由渲染即抛异常」这类
// 回归挡在发布之前。刻意做得最小：只实现 app.js 实际用到的 API，不追求规范完整。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

class ClassList {
  constructor(node) { this.node = node; }
  _list() { return String(this.node.className || '').split(/\s+/).filter(Boolean); }
  _set(a) { this.node.className = a.join(' '); }
  add() { const a = this._list(); for (const c of arguments) { if (a.indexOf(c) === -1) { a.push(c); } } this._set(a); }
  remove() { const drop = Array.from(arguments); this._set(this._list().filter((c) => drop.indexOf(c) === -1)); }
  toggle(c, force) { const has = this.contains(c); const want = force === undefined ? !has : !!force; if (want) { this.add(c); } else { this.remove(c); } return want; }
  contains(c) { return this._list().indexOf(c) !== -1; }
}

// 把 ".entry-link.selected:not(.fav-item):not(.history-item)" 之类编译成判定函数。
// 只覆盖本仓库用到的子集：标签名、#id、.类（可多个）、:not(.类)。遇到不认识的写法
// 直接抛错——静默返回 false 会让测试假绿，正是这个 stub 犯过的错。
function compileSelector(sel) {
  // 选择器组（逗号分隔）：任一分支命中即算命中
  if (sel.indexOf(',') !== -1) {
    const parts = sel.split(',').map((s) => compileSelector(s.trim()));
    return (n) => parts.some((f) => f(n));
  }
  const nots = [];
  const base = sel.replace(/:not\(\.([\w-]+)\)/g, (_, c) => { nots.push(c); return ''; }).trim();
  if (/[:\[\s>~+]/.test(base)) {
    throw new Error('dom-stub 不支持的选择器：' + sel + '（如确需，请先在 compileSelector 里实现）');
  }
  const classes = (base.match(/\.[\w-]+/g) || []).map((c) => c.slice(1));
  const idm = base.match(/#([\w-]+)/);
  const tagm = base.match(/^([A-Za-z][\w-]*)/);
  return (n) => {
    if (tagm && n.tagName !== tagm[1].toUpperCase()) { return false; }
    if (idm && n.id !== idm[1]) { return false; }
    if (base === '*') { return true; }
    for (const c of classes) { if (!n.classList.contains(c)) { return false; } }
    for (const c of nots) { if (n.classList.contains(c)) { return false; } }
    return !!(tagm || idm || classes.length || base === '');
  };
}

class Node {
  constructor(tag) {
    this.tagName = String(tag || '').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.className = '';
    this.value = '';        // app.js 会读 input.value；非 input 元素读到空串也无害
    this.checked = false;
    this.disabled = false;
    this.id = '';
    this._text = '';
    this.classList = new ClassList(this);
  }
  get textContent() {
    if (this.children.length) { return this.children.map((c) => c.textContent).join(''); }
    return this._text;
  }
  set textContent(v) { this.children = []; this._text = String(v == null ? '' : v); }
  get innerText() { return this.textContent; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  replaceChildren() { this.children = []; this._text = ''; for (const c of arguments) { this.appendChild(c); } }
  setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'class') { this.className = String(v); } }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attributes, k); }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener(t, fn) { this.listeners[t] = (this.listeners[t] || []).filter((f) => f !== fn); }
  dispatch(t, ev) { (this.listeners[t] || []).forEach((fn) => fn(ev || { type: t, preventDefault() {}, stopPropagation() {} })); }
  click() { this.dispatch('click', { type: 'click', preventDefault() {}, stopPropagation() {} }); }
  focus() { this.ownerDocument_activeElement = true; }
  scrollIntoView() {}
  // 支持 app.js 实际用到的选择器形态：tag、#id、.a.b 复合类、以及 :not(.x)。
  // :not() 必须真的实现：曾经把它当成普通类名比较，导致选择器永远匹配不到，
  // 于是紧随其后的代码从未被执行，一个 ReferenceError 就这样通过了全部冒烟测试。
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    const out = [];
    const match = compileSelector(sel);
    const walk = (n) => { n.children.forEach((c) => { if (match(c)) { out.push(c); } walk(c); }); };
    walk(this);
    return out;
  }
}

function makeDocument() {
  const doc = new Node('#document');
  doc.body = new Node('body');
  doc.documentElement = new Node('html');
  doc.appendChild(doc.body);
  doc.createElement = (t) => new Node(t);
  doc.createElementNS = (ns, t) => new Node(t);
  doc.createTextNode = (t) => { const n = new Node('#text'); n._text = String(t); return n; };
  doc.createDocumentFragment = () => new Node('#fragment');
  doc.getElementById = (id) => doc.querySelectorAll('*').concat(allNodes(doc)).find((n) => n.id === id) || null;
  doc.addEventListener = Node.prototype.addEventListener.bind(doc);
  doc.dispatch = Node.prototype.dispatch.bind(doc);
  doc.activeElement = null;
  return doc;
}
function allNodes(root) {
  const out = [];
  const walk = (n) => { n.children.forEach((c) => { out.push(c); walk(c); }); };
  walk(root);
  return out;
}

// 按 index.html 里 <script src> 的真实顺序加载全部脚本到一个共享 context
function loadApp() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const srcs = (html.match(/src="([^"]*\.js[^"]*)"/g) || [])
    .map((s) => s.replace(/^src="/, '').replace(/"$/, '').replace(/\?v=.*$/, ''))
    .filter((s) => !/^https?:/.test(s));

  const doc = makeDocument();
  const win = {
    DB: {}, location: { hash: '', href: 'http://localhost/', pathname: '/', protocol: 'http:', host: 'localhost', origin: 'http://localhost' },
    localStorage: (function () {
      const m = {};
      return { getItem: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, clear: () => { Object.keys(m).forEach((k) => delete m[k]); } };
    })(),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
    addEventListener(t, fn) { (this._l = this._l || {}); (this._l[t] = this._l[t] || []).push(fn); },
    removeEventListener() {},
    dispatch(t, ev) { ((this._l || {})[t] || []).forEach((fn) => fn(ev || { type: t })); },
    scrollTo() {}, history: { replaceState() {}, pushState() {} },
    navigator: { userAgent: 'node', serviceWorker: { register: () => Promise.resolve(), addEventListener() {} } },
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    getComputedStyle: () => ({ getPropertyValue: () => '' })
  };
  win.window = win;
  win.document = doc;
  doc.defaultView = win;

  const ctx = vm.createContext(Object.assign(Object.create(null), {
    window: win, document: doc, localStorage: win.localStorage, location: win.location,
    navigator: win.navigator, console, setTimeout, clearTimeout, setInterval, clearInterval,
    Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, isNaN, parseFloat, parseInt,
    encodeURIComponent, decodeURIComponent, WeakMap, Map, Set, Promise, matchMedia: win.matchMedia,
    requestAnimationFrame: win.requestAnimationFrame, getComputedStyle: win.getComputedStyle,
    addEventListener: win.addEventListener.bind(win), removeEventListener() {}
  }));

  // 骨架：从 index.html 抽出 app.js 会去找的容器与按钮
  const mk = (id, cls) => { const n = new Node('div'); n.id = id; if (cls) { n.className = cls; } doc.body.appendChild(n); return n; };
  ['main', 'sidebar', 'search-input', 'menu-btn', 'nav-backdrop', 'search-results'].forEach((id) => mk(id));
  (html.match(/data-module="([^"]+)"/g) || []).forEach((m) => {
    const n = new Node('button'); n.className = 'tab';
    n.setAttribute('data-module', m.replace(/.*"([^"]+)"$/, '$1')); doc.body.appendChild(n);
  });
  (html.match(/data-tool="([^"]+)"/g) || []).forEach((m) => {
    const n = new Node('button'); n.className = 'tool-btn';
    n.setAttribute('data-tool', m.replace(/.*"([^"]+)"$/, '$1')); doc.body.appendChild(n);
  });

  for (const src of srcs) {
    const p = path.join(ROOT, src);
    if (!fs.existsSync(p)) { throw new Error('index.html 引用了不存在的脚本：' + src); }
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: src });
  }
  return { win, doc, ctx, scripts: srcs };
}

// 切到某条路由并渲染。抛出的异常原样上抛，由调用方断言。
function goto(app, hash) {
  app.win.location.hash = hash;
  app.win.dispatch('hashchange', { type: 'hashchange' });
}

module.exports = { loadApp, goto, Node };
