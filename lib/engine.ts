export type ScenarioId = 'partial-fill' | 'rollover' | 'recovery';
export type Mode = 'reference' | 'repaired';
export type Kind =
  | 'discover'
  | 'request'
  | 'fill'
  | 'cancel'
  | 'roll'
  | 'execute'
  | 'settle'
  | 'broadcast'
  | 'crash'
  | 'restart'
  | 'reconcile';
export interface Event {
  seq: number;
  time: number;
  kind: Kind;
  label: string;
  detail: string;
  injected: boolean;
  data: Record<string, string | number | boolean>;
}
export interface Ledger {
  position: number;
  open: number;
  cancelled: number;
  market: string;
  credits: number;
  pending: boolean;
  seen: string[];
}
export interface Frame {
  event: Event;
  ledger: Ledger;
  expected: Ledger;
  violations: string[];
}
export interface Parameters {
  requested: number;
  liquidity: number;
  seed: number;
  fault: boolean;
}
export interface Strategy {
  name: string;
  reduce: (state: Ledger, event: Event) => Ledger;
}
export interface Run {
  mode: string;
  frames: Frame[];
  passed: boolean;
  firstFailure: number | null;
  final: Ledger;
}
export const DEFAULT_PARAMETERS: Parameters = {
  requested: 10,
  liquidity: 3,
  seed: 42,
  fault: true,
};
export const SCENARIOS = [
  {
    id: 'partial-fill' as const,
    code: 'WT-001',
    name: 'Partial-fill accounting',
    short: 'The phantom position',
    description:
      'A request is not a fill. Expose a bot that records the whole order as an owned position.',
    invariant: 'Recorded position must equal confirmed fills.',
    fix: 'Credit actual fills. Track the unfilled remainder separately.',
    before: 'position += order.requested;\nopen = 0;',
    after: 'position += event.filled;\nopen -= event.filled;',
    tag: 'ACCOUNTING',
  },
  {
    id: 'rollover' as const,
    code: 'WT-002',
    name: 'Market rollover',
    short: 'Same pool. Different market.',
    description:
      'Reuse a pool for a successor window and expose a stale market identity.',
    invariant: 'Execution identity must match the current market binding.',
    fix: 'Refresh the market ID before execution. Never use a pool address as permanent identity.',
    before: 'market = cachedPool.market;\nexecute(market);',
    after: 'market = snapshot.marketId;\nassertBinding(market);',
    tag: 'IDENTITY',
  },
  {
    id: 'recovery' as const,
    code: 'WT-003',
    name: 'Redemption recovery',
    short: 'The receipt that arrived twice',
    description:
      'Interrupt confirmation and redeliver a receipt. Catch premature or duplicate credit.',
    invariant: 'Credit a successful receipt once, never at broadcast.',
    fix: 'Reconcile the pending transaction and persist the credited receipt identity.',
    before: 'credits += expectedPayout;\n// on restart: credit again',
    after:
      'if (!seen.has(receipt.id)) {\n  credits += receipt.payout;\n  seen.add(receipt.id);\n}',
    tag: 'RECOVERY',
  },
];
export const blank = (): Ledger => ({
  position: 0,
  open: 0,
  cancelled: 0,
  market: '',
  credits: 0,
  pending: false,
  seen: [],
});
const copy = (s: Ledger): Ledger => ({ ...s, seen: [...s.seen] });
export function validate(p: Parameters): Parameters {
  for (const k of ['requested', 'liquidity', 'seed'] as const)
    if (
      !Number.isInteger(p[k]) ||
      p[k] < (k === 'requested' ? 1 : 0) ||
      p[k] > (k === 'seed' ? 2147483647 : 1000)
    )
      throw Error(`Invalid ${k}. Use a supported integer.`);
  if (typeof p.fault !== 'boolean') throw Error('Fault must be boolean.');
  return { ...p };
}
export function createTape(id: ScenarioId, input: Parameters): Event[] {
  const p = validate(input),
    tape: Event[] = [];
  let time = 0,
    seed = p.seed >>> 0;
  const add = (
    kind: Kind,
    label: string,
    detail: string,
    data: Event['data'] = {},
    injected = false,
  ) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    time += 150 + Math.floor((seed / 4294967296) * 500);
    tape.push({ seq: tape.length, time, kind, label, detail, data, injected });
  };
  const market = 'fixture:BTC-window-A';
  add(
    'discover',
    'Window discovered',
    'Synthetic BTC window A · fixture pool 01',
    { market },
  );
  if (id === 'partial-fill') {
    const filled = p.fault ? Math.min(p.requested, p.liquidity) : p.requested;
    add(
      'request',
      'Limit order accepted',
      `${p.requested} Up contracts requested at 0.60 fixture units.`,
      { requested: p.requested },
    );
    add(
      'fill',
      filled < p.requested
        ? 'Limited liquidity injected'
        : 'Full fill received',
      `${filled} confirmed filled; ${p.requested - filled} remain open.`,
      { filled, requested: p.requested },
      p.fault && filled < p.requested,
    );
    add(
      'reconcile',
      'Position reconciled',
      'Compare the bot ledger against the independent fill tape.',
    );
    add(
      'cancel',
      'Remainder cancelled',
      `${p.requested - filled} unfilled contracts cancelled.`,
      { quantity: p.requested - filled },
    );
    add(
      'reconcile',
      'Final ledger checked',
      'No phantom position and no forgotten open orders.',
    );
  } else if (id === 'rollover') {
    const successor = p.fault ? 'fixture:BTC-window-B' : market;
    add(
      'request',
      'Intent prepared',
      'Prepare an intent with the observed market identity.',
      { requested: p.requested },
    );
    add(
      'roll',
      p.fault ? 'Pool binding changed' : 'Binding unchanged',
      p.fault
        ? 'The fixture pool now belongs to window B.'
        : 'Control run: window A is still current.',
      { market: successor },
      p.fault,
    );
    add(
      'execute',
      'Execution context checked',
      'Compare the intended identity with the current binding.',
      { market: successor },
    );
    add(
      'reconcile',
      'Identity reconciled',
      'The identity used for execution must match the fixture.',
    );
  } else if (id === 'recovery') {
    add(
      'settle',
      'Window resolved',
      `${p.requested} winning fixture contracts are redeemable.`,
      { quantity: p.requested },
    );
    add(
      'broadcast',
      'Redemption broadcast',
      'The transaction outcome is not yet confirmed.',
      { payout: p.requested },
    );
    if (p.fault) {
      add(
        'crash',
        'Confirmation interrupted',
        'Exit before recording the receipt.',
        {},
        true,
      );
      add(
        'restart',
        'Process restarted',
        'Restore the durable ledger and reconcile.',
      );
    }
    add(
      'reconcile',
      'Successful receipt observed',
      `Confirmed fixture payout: ${p.requested}.`,
      { receipt: 'fixture:receipt-01', payout: p.requested },
    );
    if (p.fault)
      add(
        'reconcile',
        'Receipt redelivered',
        'Deliver the same receipt after reconnect.',
        { receipt: 'fixture:receipt-01', payout: p.requested },
        true,
      );
    add(
      'reconcile',
      'Final ledger checked',
      'The payout must be credited exactly once.',
    );
  } else throw Error('Unknown scenario');
  return tape;
}
export function referenceStrategy(mode: Mode): Strategy {
  return {
    name: mode,
    reduce: (previous, e) => {
      const s = copy(previous),
        d = e.data;
      switch (e.kind) {
        case 'discover':
          s.market = String(d.market);
          break;
        case 'request':
          s.open = Number(d.requested);
          break;
        case 'fill':
          s.position +=
            mode === 'reference' ? Number(d.requested) : Number(d.filled);
          s.open = mode === 'reference' ? 0 : s.open - Number(d.filled);
          break;
        case 'cancel':
          s.cancelled += Number(d.quantity);
          s.open = 0;
          break;
        case 'execute':
          if (mode === 'repaired') s.market = String(d.market);
          break;
        case 'settle':
          s.position = Number(d.quantity);
          break;
        case 'broadcast':
          s.pending = true;
          if (mode === 'reference') s.credits += Number(d.payout);
          break;
        case 'reconcile':
          if (typeof d.receipt === 'string') {
            if (mode === 'reference' || !s.seen.includes(d.receipt)) {
              s.credits += Number(d.payout);
              s.seen.push(d.receipt);
            }
            s.pending = false;
            s.position = 0;
          }
          break;
      }
      return s;
    },
  };
}
// Independent oracle derives values from venue events, not the strategy reducer.
function truth(tape: Event[], end: number): Ledger {
  const s = blank();
  for (const e of tape.slice(0, end + 1)) {
    const d = e.data;
    if (e.kind === 'discover' || e.kind === 'execute')
      s.market = String(d.market);
    if (e.kind === 'request') s.open += Number(d.requested);
    if (e.kind === 'fill') {
      s.position += Number(d.filled);
      s.open -= Number(d.filled);
    }
    if (e.kind === 'cancel') {
      s.open -= Number(d.quantity);
      s.cancelled += Number(d.quantity);
    }
    if (e.kind === 'settle') s.position = Number(d.quantity);
    if (e.kind === 'broadcast') s.pending = true;
    if (e.kind === 'reconcile' && typeof d.receipt === 'string') {
      if (!s.seen.includes(d.receipt)) {
        s.credits += Number(d.payout);
        s.seen.push(d.receipt);
      }
      s.pending = false;
      s.position = 0;
    }
  }
  return s;
}
export function runStrategy(tape: Event[], strategy: Strategy): Run {
  let state = blank();
  const frames = tape.map((event, i) => {
    state = strategy.reduce(copy(state), structuredClone(event));
    const expected = truth(tape, i),
      violations: string[] = [];
    for (const field of [
      'position',
      'open',
      'cancelled',
      'market',
      'credits',
      'pending',
    ] as const)
      if (state[field] !== expected[field])
        violations.push(
          `${field}: expected ${expected[field]}, recorded ${state[field]}`,
        );
    return { event, ledger: copy(state), expected, violations };
  });
  const first = frames.findIndex((f) => f.violations.length);
  return {
    mode: strategy.name,
    frames,
    passed: first === -1,
    firstFailure: first === -1 ? null : first,
    final: copy(state),
  };
}
export function fingerprint(value: unknown) {
  let hash = 2166136261;
  for (const c of JSON.stringify(value))
    hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return `wt-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
export function runLab(id: ScenarioId, input: Parameters = DEFAULT_PARAMETERS) {
  const parameters = validate(input),
    tape = createTape(id, parameters);
  return {
    schema: 'windtunnel.report.v1',
    engine: '1.0.0',
    provenance: 'synthetic',
    scenario: id,
    parameters,
    fingerprint: fingerprint({ version: 1, id, parameters, tape }),
    reference: runStrategy(tape, referenceStrategy('reference')),
    repaired: runStrategy(tape, referenceStrategy('repaired')),
    limitations: [
      'Synthetic application fault fixtures, not a matching-engine simulation.',
      'Passing does not establish security, profitability, queue priority or mainnet readiness.',
      'Faulty references are WindTunnel examples, not claims about the DreamDEX SDK.',
    ],
  };
}
