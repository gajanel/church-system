import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/api/api.jsx', import.meta.url), 'utf8');
function harness(post) {
  const storage = new Map([['token', 'expired'], ['refresh_token', 'refresh'], ['user', '{}']]);
  let onError, retried = 0, redirected = 0;
  const api = async config => { retried++; return config; };
  api.interceptors = { request: { use() {} }, response: { use(_ok, error) { onError = error; } } };
  const ctx = {
    axios: { create: () => api, post },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, val) => storage.set(key, val), removeItem: key => storage.delete(key) },
    window: { location: { origin: 'https://church.example', protocol: 'https:', hostname: 'church.example', pathname: '/', assign() { redirected++; } } },
  };
  vm.createContext(ctx);
  vm.runInContext(source.replace('import axios from "axios";', '').replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined').replaceAll('import.meta.env.DEV', 'false').replaceAll('export const ', 'const ').replace('export default API;', 'globalThis.url = API_URL;'), ctx);
  return { ctx, storage, error: retry => onError({ response: { status: 401 }, config: { headers: {}, _retry: retry } }), retried: () => retried, redirected: () => redirected };
}
test('production uses the HTTPS origin', () => { assert.equal(harness().ctx.url, 'https://church.example'); });
test('concurrent expired requests share a refresh and both retry', async () => {
  let calls = 0, resolve;
  const h = harness(() => { calls++; return new Promise(r => { resolve = r; }); });
  const a = h.error(), b = h.error();
  resolve({ data: { access_token: 'new' } });
  await Promise.all([a,b]);
  assert.equal(calls, 1); assert.equal(h.retried(), 2); assert.equal(h.storage.get('token'), 'new');
});
test('invalid refresh clears the session', async () => {
  const h = harness(async () => { throw { response: { status: 401 } }; });
  await assert.rejects(h.error()); assert.equal(h.storage.size, 0); assert.equal(h.redirected(), 1);
});
test('temporary network failure preserves the session', async () => {
  const h = harness(async () => { throw new Error('offline'); });
  await assert.rejects(h.error()); assert.equal(h.storage.get('refresh_token'), 'refresh'); assert.equal(h.redirected(), 0);
});
test('logout while refreshing cannot restore the session', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; }));
  const pending = h.error(); h.storage.clear(); resolve({ data: { access_token: 'new' } });
  await assert.rejects(pending); assert.equal(h.storage.size, 0); assert.equal(h.retried(), 0);
});
test('a second unauthorized response terminates retrying', async () => {
  const h = harness(() => { throw new Error('must not refresh'); });
  await assert.rejects(h.error(true)); assert.equal(h.storage.size, 0);
});
