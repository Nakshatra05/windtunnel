import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENARIOS,
  runLab,
  createTape,
  runStrategy,
  referenceStrategy,
  DEFAULT_PARAMETERS,
} from '../lib/engine';
for (const s of SCENARIOS)
  test(`${s.id}: faulty bot fails; repaired bot passes`, () => {
    const r = runLab(s.id);
    assert.equal(r.reference.passed, false);
    assert.equal(r.repaired.passed, true);
    assert.notEqual(r.reference.firstFailure, null);
  });
test('same inputs produce identical complete reports', () =>
  assert.deepEqual(runLab('partial-fill'), runLab('partial-fill')));
test('seed changes scheduling, not economic quantities', () => {
  const a = runLab('partial-fill'),
    b = runLab('partial-fill', { ...DEFAULT_PARAMETERS, seed: 84 });
  assert.notEqual(a.fingerprint, b.fingerprint);
  assert.deepEqual(a.repaired.final, b.repaired.final);
  assert.notDeepEqual(
    a.repaired.frames.map((f) => f.event.time),
    b.repaired.frames.map((f) => f.event.time),
  );
});
test('full liquidity removes the partial-fill failure', () => {
  const r = runLab('partial-fill', { ...DEFAULT_PARAMETERS, liquidity: 10 });
  assert.equal(r.reference.passed, true);
  assert.equal(r.repaired.final.position, 10);
});
test('zero liquidity does not create a position', () => {
  const r = runLab('partial-fill', { ...DEFAULT_PARAMETERS, liquidity: 0 });
  assert.equal(r.repaired.final.position, 0);
  assert.equal(r.repaired.final.cancelled, 10);
  assert.equal(r.repaired.final.open, 0);
});
test('excess liquidity cannot overfill', () =>
  assert.equal(
    runLab('partial-fill', { ...DEFAULT_PARAMETERS, liquidity: 100 }).repaired
      .final.position,
    10,
  ));
test('no rollover means both identities remain correct', () =>
  assert.equal(
    runLab('rollover', { ...DEFAULT_PARAMETERS, fault: false }).reference
      .passed,
    true,
  ));
test('duplicate receipt credits once', () => {
  const r = runLab('recovery');
  assert.equal(r.repaired.final.credits, 10);
  assert.equal(r.repaired.final.seen.length, 1);
  assert.equal(r.reference.final.credits, 30);
  assert.equal(
    r.repaired.frames.find((f) => f.event.kind === 'broadcast')?.ledger.credits,
    0,
  );
});
test('repaired reducer tolerates repeated receipts and process recreation', () => {
  const tape = createTape('recovery', DEFAULT_PARAMETERS),
    receipt = tape.find((e) => e.data.receipt)!;
  tape.push({ ...receipt, seq: 99 });
  const r = runStrategy(tape, {
    name: 'restart-each-event',
    reduce: (state, event) =>
      referenceStrategy('repaired').reduce(
        JSON.parse(JSON.stringify(state)),
        event,
      ),
  });
  assert.equal(r.passed, true);
  assert.equal(r.final.credits, 10);
});
test('negative, fractional, NaN and oversized inputs reject', () => {
  for (const v of [-1, NaN, 1.5, 1001])
    assert.throws(() =>
      runLab('partial-fill', { ...DEFAULT_PARAMETERS, requested: v }),
    );
});
test('custom reducer cannot mutate the oracle input', () => {
  const tape = createTape('partial-fill', DEFAULT_PARAMETERS),
    original = structuredClone(tape);
  const strategy = referenceStrategy('repaired');
  runStrategy(tape, {
    name: 'mutating',
    reduce: (s, e) => {
      e.data.filled = 99;
      return strategy.reduce(s, e);
    },
  });
  assert.deepEqual(tape, original);
});
test('all requested/liquidity boundary pairs conserve quantity', () => {
  for (let requested = 1; requested <= 30; requested++)
    for (let liquidity = 0; liquidity <= 30; liquidity++) {
      const r = runLab('partial-fill', {
        ...DEFAULT_PARAMETERS,
        requested,
        liquidity,
      });
      assert.equal(r.repaired.passed, true);
      assert.equal(
        r.repaired.final.position + r.repaired.final.cancelled,
        requested,
      );
    }
});
