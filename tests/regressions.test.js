import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticate } from '../src/services/auth.js';
import { loadState } from '../src/lib/storage.js';
import { validateEvaluation } from '../src/lib/evaluation-result.js';
import { createProgressService } from '../src/services/progress.js';
import evaluateHandler from '../api/evaluate.js';
import { celebrateProof, stopCelebration } from '../src/lib/celebration.js';
import { guestLoginRequired } from '../src/lib/guest-access.js';
import { renderGuestGate } from '../src/views/dialogs/guestGate.js';
import { cleanSupabaseUrl, sanitizeSupabaseConfig } from '../src/lib/supabase-config.js';

test('sign-up without a session asks for email confirmation instead of signing in', async () => {
  const result = await authenticate({ auth: { signUp: async () => ({ data: { user: { id: 'unconfirmed' }, session: null } }) } },
    { mode: 'signup', email: 'learner@example.com', password: 'secret' });
  assert.equal(result.confirmationRequired, true);
  assert.equal(result.user, null);
});

test('submissions require a demo or authenticated user', () => {
  assert.equal(guestLoginRequired(null), true);
  assert.equal(guestLoginRequired({ isLocalFallback: true }), true);
  assert.equal(guestLoginRequired({ id: 'demo', isLocalFallback: true, isDemo: true }), false);
  assert.equal(guestLoginRequired({ id: 'authenticated' }), false);
  assert.ok(!renderGuestGate().includes('btn-gate-continue-guest'));
});

test('previous guest submissions do not bypass the login requirement', () => {
  let value = JSON.stringify({ guestSubmissions: 1, activity: [] });
  globalThis.localStorage = { getItem: () => value };
  try {
    assert.equal(guestLoginRequired(null), true);
    value = JSON.stringify({ activity: [{ t: Date.now(), ok: false }] });
    assert.equal(guestLoginRequired(null), true);
    assert.equal(loadState().guestSubmissions, 1);
  } finally { delete globalThis.localStorage; }
});

test('authentication preserves password whitespace and does not mask provider errors', async () => {
  let received;
  const client = { auth: { signInWithPassword: async input => {
    received = input;
    return { error: new Error('Email not confirmed') };
  } } };
  await assert.rejects(authenticate(client, { mode: 'signin', email: 'learner@example.com', password: ' secret ' }), /Email not confirmed/);
  assert.equal(received.password, ' secret ');
  await assert.rejects(authenticate(null, { mode: 'signin' }), /unavailable/);
});

test('Google sign-in passes provider and redirectTo to Supabase auth', async () => {
  let oauthConfig;
  const client = { auth: { signInWithOAuth: async params => {
    oauthConfig = params;
    return { data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/auth...' }, error: null };
  } } };
  const res = await authenticate(client, { mode: 'google', redirectTo: 'https://verity.app/callback' });
  assert.equal(oauthConfig.provider, 'google');
  assert.equal(oauthConfig.options.redirectTo, 'https://verity.app/callback');
  assert.equal(res.isOAuthRedirect, true);
  await assert.rejects(authenticate(null, { mode: 'google' }), /unavailable/);
});

test('valid JSON with malformed storage fields cannot break startup', () => {
  globalThis.localStorage = { getItem: () => JSON.stringify({ xp: -10, courses: null, favorites: [], activity: [null, 1], geminiModels: [42], geminiApiKey: {}, authUser: 'bad' }) };
  try {
    const state = loadState();
    assert.deepEqual(state.courses, {});
    assert.deepEqual(state.favorites, {});
    assert.deepEqual(state.activity, []);
    assert.equal(state.xp, 0);
    assert.equal(state.geminiApiKey, '');
    assert.equal(state.authUser, null);
  } finally { delete globalThis.localStorage; }
});

test('invalid AI completions are rejected and scores stay within bounds', () => {
  assert.throws(() => validateEvaluation({ status: 'complete' }), /explanation/);
  assert.throws(() => validateEvaluation({ status: 'anything' }), /invalid/);
  const result = validateEvaluation({ status: 'needs-work', done: 99, total: 2, established: ['reason', null] });
  assert.equal(result.done, 2);
  assert.deepEqual(result.established, ['reason']);
});

function progressFixture({ error = null, remote = [], localDemo = false } = {}) {
  const state = { xp: 10, courses: { parity: { parity_p0: 'reviewed' } }, favorites: {} };
  const writes = [];
  const signals = [];
  const client = { from(table) {
    let data = table === 'user_progress' ? remote : table === 'profiles' ? { total_xp: 20 } : [];
    const query = {
      select() { return query; }, eq() { return query; }, maybeSingle() { return query; },
      upsert(rows) { writes.push({ table, rows }); return query; },
      update(rows) { writes.push({ table, rows }); return query; },
      then(resolve, reject) { return Promise.resolve({ data, error }).then(resolve, reject); }
    };
    return query;
  } };
  const service = createProgressService({ getState: () => state, getClient: () => client,
    getUser: () => ({ id: 'learner', isLocalFallback: localDemo }), saveState() {}, updateXpDisplay() {}, renderProgress() {},
    onSync: () => signals.push('success'), onSyncError: () => signals.push('failure') });
  return { service, writes, signals, state };
}

test('cloud errors are reported instead of marking progress synced', async () => {
  const fixture = progressFixture({ error: new Error('RLS denied') });
  assert.equal(await fixture.service.fetchCloudState('learner'), false);
  assert.deepEqual(fixture.signals, ['failure']);
});

test('guest migration cannot downgrade a proved cloud problem', async () => {
  const fixture = progressFixture({ remote: [{ course_id: 'parity', problem_id: 'parity_p0', status: 'proved' }] });
  assert.equal(await fixture.service.migrateGuestProgressToCloud('learner'), true);
  assert.equal(fixture.writes.find(write => write.table === 'user_progress').rows[0].status, 'proved');
  assert.equal(fixture.state.xp, 20);
  assert.ok(!fixture.writes.some(write => write.table === 'profiles' && write.rows.id));
});

test('local demo accounts never write into Supabase', async () => {
  const fixture = progressFixture({ localDemo: true });
  assert.equal(await fixture.service.migrateGuestProgressToCloud('learner'), false);
  assert.equal(await fixture.service.fetchCloudState('learner'), false);
  assert.deepEqual(fixture.writes, []);
});

test('API rejects malformed payloads and unknown problems without calling Gemini', async () => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  try {
    for (const body of ['{broken', null, [], { userText: 'proof', problem: { id: 'invented' } },
      { userText: 'proof', problem: { id: 'parity_p0' }, model: {} }]) {
      const response = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json() {} };
      await evaluateHandler({ method: 'POST', body }, response);
      assert.equal(response.statusCode, 400);
    }
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('confetti respects reduced motion and removes its canvas after finishing or cancellation', () => {
  const names = ['document', 'window', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let appended = 0, removed = 0, reduced = true, callback;
  const context = new Proxy({}, { get: () => () => {} });
  globalThis.document = { hidden: false, createElement: () => ({ style: {}, setAttribute() {}, getContext: () => context, remove() { removed++; } }),
    body: { append() { appended++; } }, addEventListener() {}, removeEventListener() {} };
  globalThis.window = { innerWidth: 390, innerHeight: 844, devicePixelRatio: 2, addEventListener() {}, removeEventListener() {} };
  globalThis.matchMedia = () => ({ matches: reduced });
  globalThis.requestAnimationFrame = fn => { callback = fn; return 1; };
  globalThis.cancelAnimationFrame = () => {};
  const button = { getBoundingClientRect: () => ({ left: 100, top: 700, width: 190, height: 40 }) };
  try {
    celebrateProof(button);
    assert.equal(appended, 0);
    reduced = false;
    celebrateProof(button);
    callback(0); callback(2200);
    assert.equal(appended, 1);
    assert.equal(removed, 1);
    celebrateProof(button);
    stopCelebration();
    assert.equal(removed, 2);
  } finally {
    stopCelebration();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});

test('sanitizeSupabaseConfig fixes trailing slashes, auth/v1 paths, dashboard URLs, and swapped keys', () => {
  assert.equal(cleanSupabaseUrl('https://abc123xyz.supabase.co/'), 'https://abc123xyz.supabase.co');
  assert.equal(cleanSupabaseUrl('https://abc123xyz.supabase.co/auth/v1'), 'https://abc123xyz.supabase.co');
  assert.equal(cleanSupabaseUrl('https://abc123xyz.supabase.co/rest/v1/'), 'https://abc123xyz.supabase.co');
  assert.equal(cleanSupabaseUrl('"https://abc123xyz.supabase.co/"'), 'https://abc123xyz.supabase.co');
  assert.equal(cleanSupabaseUrl('https://supabase.com/dashboard/project/abc123xyz'), 'https://abc123xyz.supabase.co');

  const swapped = sanitizeSupabaseConfig('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'https://abc123xyz.supabase.co/auth/v1');
  assert.equal(swapped.url, 'https://abc123xyz.supabase.co');
  assert.equal(swapped.key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  assert.equal(swapped.isConfigured, true);
});
