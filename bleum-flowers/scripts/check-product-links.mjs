import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/script.js', import.meta.url), 'utf8');
function load(hash = '') {
  const nodes = new Map();
  const events = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      innerHTML: '', value: '', open: false, isConnected: true,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {}, removeAttribute() {}, focus() {}, scrollIntoView() {},
      querySelectorAll() { return []; }, querySelector() { return node('trigger'); },
      getBoundingClientRect() { return { top: 1000 }; },
      addEventListener(type, handler) { events.set(`${id}:${type}`, handler); },
      showModal() { this.open = true; },
      close() { this.open = false; events.get(`${id}:close`)?.(); },
    });
    return nodes.get(id);
  }
  const location = { hash, pathname: '/', search: '' };
  const context = vm.createContext({
    URLSearchParams, URL, encodeURIComponent, console, location,
    history: { replaceState(_, __, url) { location.hash = new URL(url, 'https://example.test').hash; } },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame() {},
    window: { matchMedia: () => ({ addEventListener() {} }), addEventListener(type, fn) { events.set(`window:${type}`, fn); } },
    document: {
      body: node('body'), hidden: false,
      getElementById: node, querySelectorAll: () => [],
      querySelector: selector => selector === '.hero-video' ? null : node(selector),
      addEventListener() {},
    },
  });
  vm.runInContext(source, context);
  return { context, node, events, location };
}

const app = load();
const products = vm.runInContext('products', app.context);
for (const product of products) {
  const href = vm.runInContext(`waUrl(products.find(p => p.id === ${JSON.stringify(product.id)}))`, app.context);
  const url = new URL(href);
  const message = url.searchParams.get('text');
  assert.equal(url.hostname, 'wa.me');
  assert.ok(message.includes(`Produk: ${product.name}\nKategori: ${product.category}`));
  assert.ok(!message.includes('xxx.xxx'));
  const link = message.match(/Link produk: (\S+)/)[1];
  assert.equal(new URL(link).origin, 'https://bleumflorist.vercel.app');
  assert.ok(app.node('product-grid').innerHTML.includes(href), 'Card CTA must use the same message');
  const linked = load(new URL(link).hash);
  assert.equal(linked.node('product-dialog').open, true);
  assert.ok(linked.node('detail-content').innerHTML.includes(`<h2 id="detail-title">${product.name}</h2>`));
  assert.ok(linked.node('detail-content').innerHTML.includes(href), 'Detail CTA must use the same message');
  linked.node('product-dialog').close();
  assert.equal(linked.location.hash, '#produk');
}
assert.equal(load('#product=unknown').node('product-dialog').open, false);
assert.equal(load('#product=%3Cscript%3E').node('product-dialog').open, false);
assert.ok(!new URL(vm.runInContext('waUrl()', app.context)).searchParams.get('text').includes('Link produk:'));
app.location.hash = '#product=money-01';
app.events.get('window:hashchange')();
assert.ok(app.node('detail-content').innerHTML.includes('A Little Surprise'));
console.log('PASS: six product messages, card/detail CTAs, direct links, hash navigation, closing, invalid IDs, and general CTA.');
