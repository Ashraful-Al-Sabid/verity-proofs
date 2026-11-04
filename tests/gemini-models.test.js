import test from 'node:test';
import assert from 'node:assert/strict';
import { filterGeminiModels, isSupportedGeminiModel } from '../src/lib/gemini-models.js';
import { loadState } from '../src/lib/storage.js';
import { createGeminiService } from '../src/services/gemini.js';

const modern = 'gemini-3-flash-preview';
const old = 'gemini-2.5-flash-lite';
const response = { candidates: [{ content: { parts: [{ text: JSON.stringify({ status: 'needs-work', established: [], question: 'Why?', done: 0, total: 2 }) }] } }] };
const listed = names => ({ models: names.map(name => ({ name: 'models/' + name, supportedGenerationMethods: ['generateContent'] })) });
function service(state) { return createGeminiService({ getState: () => state, saveState() {}, updateAiStatusBadge() {} }); }
function res() { return { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } }; }

test('policy excludes old versions, ambiguous aliases and specialized models', () => {
  assert.deepEqual(filterGeminiModels([old, 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-flash-latest', 'gemini-3-pro-image-preview', null, modern, 'models/' + modern]), [modern]);
  assert.deepEqual(filterGeminiModels([modern, 'gemini-3.1-pro-preview']), ['gemini-3.1-pro-preview', modern]);
  assert.deepEqual(filterGeminiModels(['gemini-3.8-flash', modern, 'gemini-2.5-flash']), ['gemini-3.8-flash', modern]);
});

test('stored old model selections and lists are migrated', t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('unexpected fetch'); });
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => JSON.stringify({ geminiModel: old, geminiModels: [old, modern] }) };
  try { const state = loadState(); assert.equal(state.geminiModel, modern); assert.deepEqual(state.geminiModels, [modern]); }
  finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});

test('personal-key discovery and failed probes never request old preferred models', async t => {
  const posts = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.method === 'GET') return Response.json(listed([old, modern, 'gemini-3-pro-preview']));
    posts.push(url);
    return posts.length === 1 ? Response.json({ error: { message: 'Unavailable' } }, { status: 503 }) : Response.json(response);
  });
  const result = await service({ geminiModels: [old], geminiModel: old }).testGeminiApiKey('test', old);
  assert.equal(result.workingModel, 'gemini-3-pro-preview');
  assert.equal(posts.length, 2);
  assert.ok(posts.every(url => !url.includes('gemini-2')));
});

test('personal evaluation with stale state and failed discovery uses only modern fallback', async t => {
  const posts = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.method === 'GET') throw new Error('offline discovery');
    posts.push(url); return Response.json(response);
  });
  const result = await service({ geminiModels: [old], geminiModel: old }).callGeminiEvaluation('proof', '', { id: 'parity_p0', title: 'Proof', text: 'Test' }, 'test', old);
  assert.ok(isSupportedGeminiModel(result.modelName));
  assert.equal(posts.length, 1);
  assert.ok(!posts[0].includes(old));
});

test('server config and evaluation filter old discovery, client hints and failed fallbacks', async t => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-model-policy';
  t.after(() => { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; });
  for (const discoveryFails of [false, true]) {
    const posts = [];
    const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
      if (options.method === 'GET') {
        if (discoveryFails) throw new Error('discovery unavailable');
        return Response.json(listed([old, modern, 'gemini-3-pro-preview']));
      }
      posts.push(url);
      return posts.length === 1 && !discoveryFails ? Response.json({ error: 'Unavailable' }, { status: 503 }) : Response.json(response);
    });
    const config = (await import('../api/config.js?scenario=' + discoveryFails)).default;
    const configRes = res(); await config({ method: 'GET' }, configRes);
    assert.ok(isSupportedGeminiModel(configRes.data.bestModel));
    assert.ok(configRes.data.availableModels.every(isSupportedGeminiModel));
    const evaluate = (await import('../api/evaluate.js?scenario=' + discoveryFails)).default;
    const evaluationRes = res();
    await evaluate({ method: 'POST', body: { userText: 'proof', problem: { id: 'parity_p0' }, model: old, availableModels: [old, 'gemini-1.5-flash'] } }, evaluationRes);
    assert.equal(evaluationRes.code, 200);
    assert.ok(isSupportedGeminiModel(evaluationRes.data.modelName));
    assert.ok(posts.length > 0 && posts.every(url => !/gemini-[12]\./.test(url)));
    mock.mock.restore();
  }
});
