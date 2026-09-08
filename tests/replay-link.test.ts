import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReplayLink, replayPath } from '../lib/replay-link';
import { DEFAULT_PARAMETERS, runLab } from '../lib/engine';

test('a shared replay restores the exact engine report and frame', () => {
  const p = { requested: 17, liquidity: 0, seed: 2147483647, fault: false };
  const parsed = parseReplayLink(replayPath('recovery', p, 6).split('?')[1]);
  assert.equal(parsed.frame, 6);
  assert.deepEqual(
    runLab(parsed.scenario, parsed.parameters),
    runLab('recovery', p),
  );
});
test('untrusted replay links cannot inject invalid engine parameters', () => {
  for (const invalid of [
    '-1',
    'NaN',
    'Infinity',
    '3.4',
    '1e9',
    '',
    '999999999999999999999',
  ]) {
    const r = parseReplayLink(
      `requested=${invalid}&liquidity=${invalid}&seed=${invalid}&scenario=unknown&frame=${invalid}`,
    );
    assert.deepEqual(r.parameters, DEFAULT_PARAMETERS);
    assert.equal(r.scenario, 'partial-fill');
    assert.equal(r.frame, 3);
    assert.doesNotThrow(() => runLab(r.scenario, r.parameters));
  }
});
test('share links retain valid zero liquidity and reject out-of-range values', () => {
  const r = parseReplayLink(
    'liquidity=0&requested=31&seed=2147483648&tour=1&tab=testnet',
  );
  assert.equal(r.parameters.liquidity, 0);
  assert.equal(r.parameters.requested, 10);
  assert.equal(r.parameters.seed, 42);
  assert.equal(r.tour, true);
  assert.equal(r.tab, 'testnet');
});
