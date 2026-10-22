import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the actual embedded script with a small DOM/network adapter. No copied
// UI implementation or external browser/service is used by these tests.
const header = readFileSync(new URL('../firmware/include/CareWifiPage.h', import.meta.url), 'utf8');
const nonce = '0123456789abcdef0123456789abcdef';
const script = header.match(/<script nonce="%NONCE%">([\s\S]*?)<\/script>/)[1].replaceAll('%NONCE%', nonce);
class Element {
  value = ''; checked = false; disabled = false; hidden = false; textContent = '';
  dataset = {}; children = []; listeners = new Map();
  set innerHTML(_) { throw Error('Unescaped HTML insertion is forbidden'); }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  replaceChildren(...nodes) { this.children = nodes; }
  append(node) { this.children.push(node); }
  get selectedOptions() { return this.children.filter(node => node.value === this.value); }
}
function setup(overrides = {}) {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  get('slot').value = '0';
  const calls = [], timers = [];
  const state = { device: 'pulseira-test', portal: 'CarePlus-pulseira-test', connected: false,
    api_recent: false, trial: 'idle', remaining: 0, message: '',
    slots: [{ ssid: 'Casa', open: false }, { ssid: 'Celular', open: false }] };
  const context = vm.createContext({
    document: { getElementById: get }, AbortController,
    Option: class extends Element { constructor(label, value) { super(); this.textContent = label; this.value = value; } },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    async fetch(path, options) {
      calls.push({ path, options });
      const response = overrides[path];
      return { ok: response?.ok ?? true, async json() { return response?.body ?? state; } };
    },
  });
  vm.runInContext(script, context);
  return { get, calls, timers, state, context, async event(id, name) {
    await get(id).listeners.get(name)({ preventDefault() {} });
  } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('Save sends only selected slot with CSRF and clears the typed password', async () => {
  const ui = setup({ '/api/save': { body: { testing: true } } });
  await flush();
  ui.get('slot').value = '1';
  await ui.event('slot', 'change');
  assert.equal(ui.get('ssid').value, 'Celular');
  assert.equal(ui.get('password').value, '');
  ui.get('ssid').value = 'Feira ç';
  ui.get('password').value = 'feira-secret';
  await ui.event('form', 'submit');
  const call = ui.calls.find(call => call.path === '/api/save');
  assert.equal(call.options.headers['X-Care-CSRF'], nonce);
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(call.options.body), { slot: 1, ssid: 'Feira ç', password: 'feira-secret', open: false });
  assert.equal(ui.get('password').value, '');
  assert.equal(ui.get('message').textContent.includes('feira-secret'), false);
});

test('Server validation errors remain readable and allow correcting the form', async () => {
  const ui = setup({ '/api/save': { ok: false, body: { error: 'Senha inválida' } } });
  await flush();
  ui.get('password').value = 'short';
  await ui.event('form', 'submit');
  assert.equal(ui.get('message').textContent, 'Senha inválida');
  assert.equal(ui.get('password').value, 'short');
});

test('SSID containing HTML is rendered as text and scan requires CSRF', async () => {
  const dangerous = '<img src=x onerror=alert(1)>';
  const ui = setup({ '/api/scan': { body: { running: true } },
    '/api/networks': { body: { running: false, networks: [{ ssid: dangerous, rssi: -40, secured: true }] } } });
  await flush();
  await ui.event('scan', 'click');
  await flush();
  const option = ui.get('networks').children[1];
  assert.equal(option.value, dangerous);
  assert.equal(option.textContent, dangerous + ' · -40 dBm');
  assert.equal(ui.calls.find(call => call.path === '/api/scan').options.headers['X-Care-CSRF'], nonce);
  ui.get('networks').value = dangerous;
  await ui.event('networks', 'change');
  assert.equal(ui.get('ssid').value, dangerous);
});

test('Saved/error status has explicit feedback and no password is returned to the UI', async () => {
  const ui = setup();
  await flush();
  ui.state.trial = 'saved'; ui.state.connected = true; ui.state.api_recent = true; ui.state.ssid = 'Feira';
  await vm.runInContext('status()', ui.context);
  assert.match(ui.get('message').textContent, /Rede salva/);
  assert.match(ui.get('connection').textContent, /API confirmada/);
  assert.equal(ui.get('cancel').hidden, true);
  ui.state.trial = 'error'; ui.state.message = 'Redes anteriores preservadas';
  await vm.runInContext('status()', ui.context);
  assert.equal(ui.get('message').textContent, 'Redes anteriores preservadas');
  assert.equal(ui.get('save').disabled, false);
});
