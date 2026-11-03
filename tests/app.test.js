import test from 'node:test';
import assert from 'node:assert/strict';
import { coursesData } from '../src/data/courses.js';
import { stepMeta } from '../src/data/rubrics.js';
import { evaluateProof } from '../src/services/proof-evaluator.js';
import { loadState, persistState } from '../src/lib/storage.js';
import configHandler from '../api/config.js';
import evaluateHandler from '../api/evaluate.js';

test('every course problem has a unique ID, complete content, and a rubric', () => {
  const ids = new Set();
  assert.equal(Object.keys(coursesData).length, 4);
  for (const course of Object.values(coursesData)) {
    assert.ok(course.problems.length > 0);
    for (const problem of course.problems) {
      assert.ok(!ids.has(problem.id), problem.id);
      ids.add(problem.id);
      assert.ok(problem.title && problem.text && problem.curatedSolution, problem.id);
      assert.ok(stepMeta[problem.id]?.rubric, problem.id);
    }
  }
});

test('offline mentor rejects the wrong parity claim and accepts a connected proof', () => {
  const problem = coursesData.parity.problems.find(p => p.id === 'parity_p0');
  assert.equal(evaluateProof('Yes they can rotate', '', problem).status, 'reconsider');
  const proof = 'No. Adjacent gears turn in opposite directions, so their directions alternate. All odd numbered gears turn in the same direction. With eleven gears in a closed ring, the last and first gears are both odd and mesh together. They must turn in opposite directions, which is a contradiction. Therefore rotation is impossible.';
  assert.equal(evaluateProof(proof, proof, problem).status, 'complete');
});

test('storage preserves existing learner progress and recovers from invalid JSON', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  try {
    const state = loadState();
    state.xp = 42;
    state.courses.parity = { parity_p0: 'proved' };
    persistState(state);
    assert.equal(loadState().xp, 42);
    assert.equal(loadState().courses.parity.parity_p0, 'proved');
    values.set('verity-progress-v1', '{broken');
    assert.equal(loadState().xp, 0);
  } finally { delete globalThis.localStorage; }
});

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; }
  };
}

test('API routes reject unsupported methods', async () => {
  for (const handler of [configHandler, evaluateHandler]) {
    const res = response();
    await handler({ method: 'DELETE' }, res);
    assert.equal(res.statusCode, 405);
  }
});
