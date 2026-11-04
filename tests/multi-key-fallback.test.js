import test from 'node:test';
import assert from 'node:assert/strict';
import { getGeminiApiKeys, hasFallbackAiKey, getFallbackAiProvider } from '../src/lib/ai-config.js';
import evaluateHandler from '../api/evaluate.js';
import configHandler from '../api/config.js';

function mockRes() {
  return {
    headers: {},
    code: 200,
    data: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(d) { this.data = d; return this; },
    end() { return this; }
  };
}

test('getGeminiApiKeys extracts keys from single, multiple, and indexed env variables', () => {
  const originalEnv = { ...process.env };
  try {
    delete process.env.GEMINI_API_KEYS;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GEMINI_API_KEY_3;
    delete process.env.GOOGLE_GEMINI_API_KEY;
    delete process.env.GOOGLE_GEMINI_API_KEY_2;

    assert.deepEqual(getGeminiApiKeys(), []);

    process.env.GEMINI_API_KEY = 'key-primary';
    assert.deepEqual(getGeminiApiKeys(), ['key-primary']);

    process.env.GEMINI_API_KEY_2 = 'key-secondary';
    process.env.GEMINI_API_KEY_3 = 'key-tertiary';
    assert.deepEqual(getGeminiApiKeys(), ['key-primary', 'key-secondary', 'key-tertiary']);

    // Comma-separated list with quotes & whitespace
    process.env.GEMINI_API_KEYS = '"key-list-1", key-list-2; key-list-3\nkey-list-4';
    assert.deepEqual(getGeminiApiKeys(), [
      'key-list-1',
      'key-list-2',
      'key-list-3',
      'key-list-4',
      'key-primary',
      'key-secondary',
      'key-tertiary'
    ]);
  } finally {
    process.env = originalEnv;
  }
});

test('fallback AI provider resolves Groq, OpenAI, and OpenRouter in priority order', () => {
  const originalEnv = { ...process.env };
  try {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    assert.equal(hasFallbackAiKey(), false);
    assert.equal(getFallbackAiProvider(), null);

    process.env.OPENROUTER_API_KEY = 'sk-or-123';
    assert.equal(hasFallbackAiKey(), true);
    assert.equal(getFallbackAiProvider().provider, 'openrouter');
    assert.equal(getFallbackAiProvider().model, 'meta-llama/llama-3.3-70b-instruct');

    process.env.OPENAI_API_KEY = 'sk-openai-123';
    assert.equal(getFallbackAiProvider().provider, 'openai');
    assert.equal(getFallbackAiProvider().model, 'gpt-4o-mini');

    process.env.GROQ_API_KEY = 'gsk_groq123';
    assert.equal(getFallbackAiProvider().provider, 'groq');
    assert.equal(getFallbackAiProvider().model, 'llama-3.3-70b-versatile');
  } finally {
    process.env = originalEnv;
  }
});

test('evaluator rotates to second Gemini key when first key hits 429 quota exhaustion', async (t) => {
  const originalEnv = { ...process.env };
  process.env.GEMINI_API_KEY = 'exhausted-key-1';
  process.env.GEMINI_API_KEY_2 = 'fresh-key-2';
  delete process.env.GROQ_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const attemptedKeys = [];

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const keyParam = new URL(url).searchParams.get('key');
    attemptedKeys.push(keyParam);

    if (keyParam === 'exhausted-key-1') {
      return Response.json({
        error: {
          code: 429,
          message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash. Please retry in 17h.',
          status: 'RESOURCE_EXHAUSTED'
        }
      }, { status: 429 });
    }

    if (keyParam === 'fresh-key-2') {
      return Response.json({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                status: 'complete',
                title: 'Flawless proof',
                established: ['Every domino covers exactly one black and one white square.'],
                success: 'The coloring invariant proves the impossibility completely.',
                done: 2,
                total: 2
              })
            }]
          }
        }]
      });
    }

    throw new Error('Unexpected key: ' + keyParam);
  });

  try {
    const req = {
      method: 'POST',
      body: {
        userText: 'Each domino must cover 1 black and 1 white square. Removing two opposite corners leaves 32 black and 30 white squares, so 31 dominoes cannot cover it.',
        problem: { id: 'parity_p0', title: 'Deficient Chessboard', text: 'Domino problem' }
      }
    };
    const res = mockRes();
    await evaluateHandler(req, res);

    assert.equal(res.code, 200);
    assert.equal(res.data.status, 'complete');
    assert.equal(res.data.isServerHosted, true);
    assert.ok(attemptedKeys.includes('exhausted-key-1'), 'attempted exhausted key first');
    assert.ok(attemptedKeys.includes('fresh-key-2'), 'rotated and succeeded with second key');
  } finally {
    process.env = originalEnv;
  }
});

test('evaluator falls back to alternative AI provider (Groq) when Gemini keys hit 429 quota', async (t) => {
  const originalEnv = { ...process.env };
  process.env.GEMINI_API_KEY = 'exhausted-gemini-key';
  delete process.env.GEMINI_API_KEY_2;
  process.env.GROQ_API_KEY = 'gsk_working_groq_key';

  let groqCalled = false;

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('generativelanguage.googleapis.com')) {
      return Response.json({
        error: {
          code: 429,
          message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20',
          status: 'RESOURCE_EXHAUSTED'
        }
      }, { status: 429 });
    }

    if (url.includes('api.groq.com')) {
      groqCalled = true;
      assert.equal(options.headers['Authorization'], 'Bearer gsk_working_groq_key');
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              status: 'complete',
              title: 'Rigorous Olympiad proof',
              established: ['Color invariant preserved.'],
              success: 'Sound deduction on opposite corner parity disparity.',
              done: 2,
              total: 2
            })
          }
        }]
      });
    }

    throw new Error('Unexpected URL: ' + url);
  });

  try {
    const req = {
      method: 'POST',
      body: {
        userText: 'Each domino covers 1 black and 1 white. Total 30 black, 32 white.',
        problem: { id: 'parity_p0', title: 'Deficient Chessboard', text: 'Domino problem' }
      }
    };
    const res = mockRes();
    await evaluateHandler(req, res);

    assert.equal(res.code, 200);
    assert.equal(res.data.status, 'complete');
    assert.equal(res.data.engine, 'ai');
    assert.equal(res.data.modelName, 'llama-3.3-70b-versatile');
    assert.equal(groqCalled, true);
  } finally {
    process.env = originalEnv;
  }
});

test('api/config reports active AI when only fallback provider (Groq) is configured', async () => {
  const originalEnv = { ...process.env };
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEYS;
  delete process.env.GEMINI_API_KEY_2;
  process.env.GROQ_API_KEY = 'gsk_fallback_only';

  try {
    const res = mockRes();
    await configHandler({ method: 'GET' }, res);
    assert.equal(res.code, 200);
    assert.equal(res.data.hasServerGemini, true);
    assert.equal(res.data.bestModel, 'llama-3.3-70b-versatile');
  } finally {
    process.env = originalEnv;
  }
});

test('custom env var names (GEMINI_API_KEY1, GROQ_KEY) and gsk_ keys in GEMINI vars are classified properly', () => {
  const originalEnv = { ...process.env };
  try {
    for (const k of Object.keys(process.env)) {
      if (/gemini|groq|openai|openrouter/i.test(k)) delete process.env[k];
    }
    process.env.GEMINI_API_KEY1 = 'AIzaSyKeyOne';
    process.env.GEMINI_KEY_2 = 'AIzaSyKeyTwo';
    process.env.GEMINI_API_KEY_3 = 'gsk_misplaced_groq_key';

    const geminiKeys = getGeminiApiKeys();
    assert.deepEqual(geminiKeys, ['AIzaSyKeyOne', 'AIzaSyKeyTwo']);
    assert.equal(hasFallbackAiKey(), true);
    assert.equal(getFallbackAiProvider().provider, 'groq');
    assert.equal(getFallbackAiProvider().key, 'gsk_misplaced_groq_key');
  } finally {
    process.env = originalEnv;
  }
});


