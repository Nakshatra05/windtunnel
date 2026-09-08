import {
  DEFAULT_PARAMETERS,
  SCENARIOS,
  type Parameters,
  type ScenarioId,
} from './engine';

export function parseReplayLink(query: string) {
  const q = new URLSearchParams(query);
  const scenario =
    SCENARIOS.find((s) => s.id === q.get('scenario'))?.id ?? 'partial-fill';
  function integer(key: string, fallback: number, min: number, max: number) {
    const raw = q.get(key);
    if (raw === null || !/^\d+$/.test(raw)) return fallback;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n >= min && n <= max ? n : fallback;
  }
  return {
    scenario,
    parameters: {
      requested: integer('requested', DEFAULT_PARAMETERS.requested, 1, 30),
      liquidity: integer('liquidity', DEFAULT_PARAMETERS.liquidity, 0, 30),
      seed: integer('seed', DEFAULT_PARAMETERS.seed, 0, 2147483647),
      fault: q.get('fault') !== '0',
    },
    frame: integer('frame', 3, 0, 100),
    tour: q.get('tour') === '1',
    tab:
      q.get('tab') === 'testnet'
        ? 'testnet'
        : q.get('tab') === 'guide'
          ? 'guide'
          : 'lab',
  };
}

export function replayPath(scenario: ScenarioId, p: Parameters, frame: number) {
  return (
    '/lab?' +
    new URLSearchParams({
      scenario,
      requested: String(p.requested),
      liquidity: String(p.liquidity),
      seed: String(p.seed),
      fault: p.fault ? '1' : '0',
      frame: String(frame),
    })
  );
}
