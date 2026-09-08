'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Wind,
  FlaskConical,
  Radio,
  Code2,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
  X,
  ShieldCheck,
  Terminal,
  ExternalLink,
  ArrowRight,
  Layers3,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import Evidence from './evidence';
import Tour from './tour';
import { parseReplayLink, replayPath } from '@/lib/replay-link';
import {
  DEFAULT_PARAMETERS,
  SCENARIOS,
  runLab,
  type Parameters,
  type ScenarioId,
} from '@/lib/engine';
function save(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
interface Live {
  observedAt: string;
  chainId: number;
  block: string;
  source: string;
  markets: {
    marketId: string;
    pool: string;
    asset: string;
    expiry: string;
    status: number;
  }[];
  error?: string;
}
export default function Lab() {
  const [tour, setTour] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [suite, setSuite] = useState<ReturnType<typeof runLab>[] | null>(null);
  const [scenario, setScenario] = useState<ScenarioId>('partial-fill'),
    [params, setParams] = useState<Parameters>(DEFAULT_PARAMETERS),
    [active, setActive] = useState<Parameters>(DEFAULT_PARAMETERS),
    [cursor, setCursor] = useState(3),
    [playing, setPlaying] = useState(false),
    [tab, setTab] = useState('lab'),
    [notice, setNotice] = useState('');
  const [live, setLive] = useState<Live | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const report = useMemo(() => runLab(scenario, active), [scenario, active]),
    def = SCENARIOS.find((s) => s.id === scenario)!;
  const index = Math.min(cursor, report.reference.frames.length - 1),
    before = report.reference.frames[index],
    after = report.repaired.frames[index];
  useEffect(() => {
    const initial = parseReplayLink(window.location.search);
    if (initial.tour) {
      tourStep(0);
      return;
    }
    setScenario(initial.scenario);
    setParams(initial.parameters);
    setActive(initial.parameters);
    setCursor(initial.frame);
    setTab(initial.tab);
  }, []);
  function tourStep(step: number) {
    setSuite(null);
    setShareUrl('');
    const id: ScenarioId =
      step === 2 ? 'rollover' : step === 3 ? 'recovery' : 'partial-fill';
    const p = {
      ...DEFAULT_PARAMETERS,
      ...(step === 1 ? { liquidity: 10 } : {}),
    };
    const r = runLab(id, p);
    const target =
      step === 0
        ? r.reference.frames.findIndex((f) => f.event.kind === 'fill')
        : step === 2
          ? (r.reference.firstFailure ?? 0)
          : r.reference.frames.length - 1;
    setScenario(id);
    setParams(p);
    setActive(p);
    setCursor(target);
    setPlaying(false);
    setTour(step);
    setTab(step === 4 ? 'testnet' : 'lab');
  }
  async function shareReplay() {
    const url = window.location.origin + replayPath(scenario, active, index);
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Replay link copied. It restores these inputs and this event.');
    } catch {
      setNotice('Select and copy the replay link below.');
    }
  }
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setCursor((c) => {
          if (c >= report.reference.frames.length - 1) {
            setPlaying(false);
            return c;
          }
          return c + 1;
        }),
      850,
    );
    return () => clearInterval(timer);
  }, [playing, report]);
  function select(id: ScenarioId) {
    setShareUrl('');
    setTour(null);
    setScenario(id);
    setCursor(0);
    setPlaying(false);
    setTab('lab');
  }
  function run() {
    setShareUrl('');
    setTour(null);
    setActive({ ...params });
    setCursor(0);
    setPlaying(true);
    setNotice(
      'Comparison started. Both implementations receive identical events.',
    );
  }
  async function exportReport() {
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify(report)),
    );
    save(`${report.fingerprint}.json`, {
      report,
      sha256: [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      hashScope: 'UTF-8 JSON.stringify(report)',
    });
    setNotice('Report downloaded with SHA-256 integrity hash.');
  }
  async function readLive() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/testnet');
      const d = (await r.json()) as Live;
      if (!r.ok) throw Error(d.error || 'Testnet unavailable');
      setLive(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <Wind size={27} />
          <span>
            WindTunnel<span className="lime">.</span>
          </span>
        </a>
        <span className="top-separator" />
        <span className="workspace-name">Event Contract Lab</span>
        <div className="top-right">
          <span>
            <i /> Somnia Shannon
          </span>
          <a
            href="https://app.dreamdex.io/docs/developers/event-contracts"
            target="_blank"
            rel="noreferrer"
          >
            DreamDEX docs <ExternalLink size={14} />
          </a>
          <code>v1.0</code>
        </div>
      </header>
      <Tabs
        className="workspace"
        value={tab}
        onValueChange={(v) => {
          setTab(String(v));
          setTour(null);
        }}
      >
        <aside className="sidebar">
          <div className="eyebrow">WORKSPACE</div>
          <TabsList className="nav-tabs">
            <TabsTrigger value="lab">
              <FlaskConical size={18} />
              Replay lab
            </TabsTrigger>
            <TabsTrigger value="testnet">
              <Radio size={18} />
              Testnet evidence
            </TabsTrigger>
            <TabsTrigger value="guide">
              <Code2 size={18} />
              Integration guide
            </TabsTrigger>
          </TabsList>
          <div className="sidebar-library">
            <div className="eyebrow">
              SCENARIO LIBRARY <span>03</span>
            </div>
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                className={`scenario-nav ${s.id === scenario && tab === 'lab' ? 'selected' : ''}`}
                onClick={() => select(s.id)}
              >
                <code>0{i + 1}</code>
                <span>
                  {s.name}
                  <small>{s.code}</small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="sidebar-bottom">
            <span>
              <Layers3 size={19} /> Built for DreamDEX
            </span>
            <p>
              Test the execution.
              <br />
              Understand the failure.
            </p>
            <a href="/submission">
              Project brief <ArrowRight size={14} />
            </a>
            <small>OPEN SOURCE · TESTNET ONLY</small>
          </div>
        </aside>
        <main className="main">
          {tour !== null && (
            <Tour step={tour} onStep={tourStep} onClose={() => setTour(null)} />
          )}
          <TabsContent value="lab">
            <div className="breadcrumb">
              Workspace <ChevronRight size={13} /> Replay lab{' '}
              <ChevronRight size={13} />
              {def.code}
            </div>
            <div className="page-heading">
              <div>
                <div className="eyebrow lime">
                  DETERMINISTIC EXECUTION TESTING
                </div>
                <h1>Break it here. Fix it before live.</h1>
                <p>
                  Same failure. Two implementations. See exactly what changes.
                </p>
              </div>
              <div className="lab-actions">
                <button className="button secondary" onClick={shareReplay}>
                  Share replay
                </button>
                <button className="button secondary" onClick={exportReport}>
                  <Download size={16} />
                  Export report
                </button>
              </div>
            </div>
            {shareUrl && (
              <div className="share-result">
                <label htmlFor="replay-link">Reproduce this exact replay</label>
                <input
                  id="replay-link"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => setShareUrl('')}
                  aria-label="Hide replay link"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="lab-quick-actions">
              <button onClick={() => tourStep(0)}>
                <Play size={15} /> Take the guided demo
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setTour(null);
                  setCursor(
                    report.reference.firstFailure ??
                      report.reference.frames.length - 1,
                  );
                  setNotice(
                    report.reference.firstFailure === null
                      ? 'No reference failure for these inputs.'
                      : 'Jumped to the first ledger mismatch.',
                  );
                }}
              >
                <ArrowRight size={15} />{' '}
                {report.reference.firstFailure === null
                  ? 'View final result'
                  : 'Jump to first failure'}
              </button>
              <button
                onClick={() => {
                  setSuite(SCENARIOS.map((s) => runLab(s.id, active)));
                  setNotice(
                    'All three scenarios evaluated with the active parameters.',
                  );
                }}
              >
                <ShieldCheck size={15} /> Run all scenarios
              </button>
            </div>
            {suite && (
              <section
                className="suite-results"
                aria-label="Scenario suite results"
              >
                <div className="suite-heading">
                  <div>
                    <h2>Three scenarios. One reproducible suite.</h2>
                    <p>
                      Snapshot: {suite[0].parameters.requested} requested ·{' '}
                      {suite[0].parameters.liquidity} available · seed{' '}
                      {suite[0].parameters.seed} · faults{' '}
                      {suite[0].parameters.fault ? 'on' : 'off'}
                    </p>
                  </div>
                  <button
                    aria-label="Close suite results"
                    onClick={() => setSuite(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="suite-cards">
                  {suite.map((r) => (
                    <button
                      key={r.scenario}
                      onClick={() => {
                        setScenario(r.scenario);
                        setActive(r.parameters);
                        setParams(r.parameters);
                        setCursor(
                          r.reference.firstFailure ??
                            r.reference.frames.length - 1,
                        );
                        setPlaying(false);
                        setTour(null);
                      }}
                    >
                      <strong>
                        {SCENARIOS.find((s) => s.id === r.scenario)!.name}
                      </strong>
                      <span className={r.reference.passed ? 'pass' : 'fail'}>
                        Reference: {r.reference.passed ? 'PASS' : 'FAIL'}
                      </span>
                      <span className={r.repaired.passed ? 'pass' : 'fail'}>
                        Repaired: {r.repaired.passed ? 'PASS' : 'FAIL'}
                      </span>
                      <small>
                        {
                          r.repaired.frames.filter((f) => !f.violations.length)
                            .length
                        }
                        /{r.repaired.frames.length} repaired events consistent{' '}
                        <ArrowRight size={12} />
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <div className="summary">
              <span>
                <i /> Engine ready
              </span>
              <span>3 failure scenarios</span>
              <span>Seed {active.seed}</span>
              <code>{report.fingerprint}</code>
              <span className="badge">SYNTHETIC FIXTURE</span>
            </div>
            <div className="lab-grid">
              <section className="panel setup">
                <div className="eyebrow">01 / CONFIGURE</div>
                <h2>{def.short}</h2>
                <p>{def.description}</p>
                <label className="field-label" htmlFor="requested">
                  Requested contracts <b>{params.requested}</b>
                </label>
                <Slider
                  id="requested"
                  aria-label="Requested contracts"
                  min={1}
                  max={30}
                  value={[params.requested]}
                  onValueChange={(v) =>
                    setParams((p) => ({
                      ...p,
                      requested: Array.isArray(v) ? v[0] : v,
                    }))
                  }
                />
                {scenario === 'partial-fill' && (
                  <>
                    <label className="field-label" htmlFor="liquidity">
                      Available liquidity <b>{params.liquidity}</b>
                    </label>
                    <Slider
                      id="liquidity"
                      aria-label="Available liquidity"
                      min={0}
                      max={30}
                      value={[params.liquidity]}
                      onValueChange={(v) =>
                        setParams((p) => ({
                          ...p,
                          liquidity: Array.isArray(v) ? v[0] : v,
                        }))
                      }
                    />
                  </>
                )}
                <div className="seed">
                  <label htmlFor="seed">Replay seed</label>
                  <input
                    type="number"
                    id="seed"
                    value={params.seed}
                    min="0"
                    max="2147483647"
                    onChange={(e) =>
                      setParams((p) => ({
                        ...p,
                        seed: Math.max(
                          0,
                          Math.min(
                            2147483647,
                            Math.floor(Number(e.target.value) || 0),
                          ),
                        ),
                      }))
                    }
                  />
                </div>
                <div className="fault">
                  <div>
                    <label htmlFor="fault">Inject failure</label>
                    <small>
                      {params.fault
                        ? 'Fault sequence enabled'
                        : 'Normal event sequence'}
                    </small>
                  </div>
                  <Switch
                    id="fault"
                    checked={params.fault}
                    onCheckedChange={(fault) =>
                      setParams((p) => ({ ...p, fault }))
                    }
                  />
                </div>
                <button className="button primary run" onClick={run}>
                  <Play size={16} fill="currentColor" />
                  Run comparison <ArrowRight size={15} />
                </button>
                {JSON.stringify(params) !== JSON.stringify(active) && (
                  <small className="pending">
                    Parameters changed. Run to apply.
                  </small>
                )}
                <p className="note">
                  Both bots receive identical inputs. Only their execution logic
                  differs.
                </p>
                <div className="mobile-scenarios">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => select(s.id)}
                      aria-pressed={s.id === scenario}
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel comparison">
                <div className="panel-top">
                  <span className="eyebrow">02 / OBSERVE</span>
                  <span>
                    Event {index + 1} / {report.reference.frames.length}
                  </span>
                </div>
                <div className="comparison-title">
                  <h2>One event. Two outcomes.</h2>
                  <span className="eyebrow">{def.tag}</span>
                </div>
                <div className="bots">
                  {[
                    { frame: before, fixed: false },
                    { frame: after, fixed: true },
                  ].map(({ frame, fixed }) => (
                    <div
                      key={String(fixed)}
                      className={`bot ${fixed ? 'repaired-bot' : 'broken'}`}
                    >
                      <div className="bot-heading">
                        {fixed ? (
                          <ShieldCheck size={19} />
                        ) : (
                          <Terminal size={19} />
                        )}
                        <div>
                          <h3>{fixed ? 'Repaired bot' : 'Reference bot'}</h3>
                          <small>
                            {fixed ? 'Invariant-aware' : 'Intentionally faulty'}
                          </small>
                        </div>
                        <span
                          className={frame.violations.length ? 'fail' : 'pass'}
                        >
                          {frame.violations.length ? (
                            <X size={13} />
                          ) : (
                            <Check size={13} />
                          )}{' '}
                          {frame.violations.length ? 'FAIL' : 'PASS'}
                        </span>
                      </div>
                      <div className="readout">
                        <span>
                          {scenario === 'recovery'
                            ? 'RECORDED PAYOUT'
                            : scenario === 'rollover'
                              ? 'EXECUTION WINDOW'
                              : 'RECORDED POSITION'}
                        </span>
                        <strong>
                          {scenario === 'recovery'
                            ? frame.ledger.credits
                            : scenario === 'rollover'
                              ? frame.ledger.market.split('-').at(-1)
                              : frame.ledger.position}
                          <small>
                            {scenario === 'recovery'
                              ? 'units'
                              : scenario === 'rollover'
                                ? 'window'
                                : 'contracts'}
                          </small>
                        </strong>
                      </div>
                      <div className="metrics">
                        <span>
                          {scenario === 'recovery'
                            ? 'Confirmed payout'
                            : scenario === 'rollover'
                              ? 'Current window'
                              : 'Confirmed fills'}
                          <b>
                            {scenario === 'recovery'
                              ? frame.expected.credits
                              : scenario === 'rollover'
                                ? frame.expected.market.split('-').at(-1)
                                : frame.expected.position}
                          </b>
                        </span>
                        <span>
                          {scenario === 'recovery'
                            ? 'Receipt pending'
                            : 'Open quantity'}
                          <b>
                            {scenario === 'recovery'
                              ? frame.ledger.pending
                                ? 'Yes'
                                : 'No'
                              : frame.ledger.open}
                          </b>
                        </span>
                      </div>
                      <div
                        className={`verdict ${frame.violations.length ? 'bad' : 'good'}`}
                      >
                        {frame.violations.length ? (
                          <X size={15} />
                        ) : (
                          <Check size={15} />
                        )}
                        <span>
                          {frame.violations[0] ||
                            'Ledger matches observed events'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="invariant">
                  <ShieldCheck size={19} />
                  <div>
                    <span className="eyebrow">THE INVARIANT</span>
                    <p>{def.invariant}</p>
                  </div>
                </div>
                <div className="timeline-heading">
                  <span>Event timeline</span>
                  <code>T + {(before.event.time / 1000).toFixed(3)}s</code>
                </div>
                <div className="timeline">
                  {report.reference.frames.map((f, i) => (
                    <button
                      key={i}
                      aria-label={`Event ${i + 1}: ${f.event.label}`}
                      aria-pressed={i === index}
                      className={`${i <= index ? 'visited' : ''} ${f.event.injected ? 'injected' : ''} ${i === index ? 'current' : ''}`}
                      onClick={() => {
                        setTour(null);
                        setShareUrl('');
                        setCursor(i);
                        setPlaying(false);
                      }}
                    >
                      <i />
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>
                <div className="playback">
                  <button
                    aria-label={playing ? 'Pause' : 'Play'}
                    onClick={() => {
                      setTour(null);
                      setShareUrl('');
                      if (index === report.reference.frames.length - 1)
                        setCursor(0);
                      setPlaying((p) => !p);
                    }}
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    aria-label="Reset replay"
                    onClick={() => {
                      setTour(null);
                      setShareUrl('');
                      setCursor(0);
                      setPlaying(false);
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <div>
                    <b>{before.event.label}</b>
                    <span>{before.event.detail}</span>
                  </div>
                  {before.event.injected && (
                    <span className="injected-label">INJECTED</span>
                  )}
                </div>
              </section>
            </div>
            <section className="panel repair">
              <div>
                <div className="eyebrow">03 / UNDERSTAND THE REPAIR</div>
                <h2>
                  A small change.
                  <br />A correct ledger.
                </h2>
                <p>{def.fix}</p>
                <span className="pass">
                  <Check size={15} />
                  Repaired run: {report.repaired.frames.length}/
                  {report.repaired.frames.length} events consistent
                </span>
              </div>
              <div className="code-pair">
                <div>
                  <span className="code-label">Faulty reference</span>
                  <pre>{def.before}</pre>
                </div>
                <div>
                  <span className="code-label lime">Corrected logic</span>
                  <pre>{def.after}</pre>
                </div>
              </div>
            </section>
            <footer>
              Passing these scenarios does not certify security or
              profitability.<span>Replay fingerprint · non-cryptographic</span>
            </footer>
            <span role="status" className="lab-notice">
              {notice}
            </span>
          </TabsContent>
          <TabsContent value="testnet">
            <Evidence />
            <div className="breadcrumb">
              Workspace <ChevronRight size={13} /> Testnet evidence
            </div>
            <div className="page-heading">
              <div>
                <div className="eyebrow lime">LIVE READS · CHAIN 50312</div>
                <h1>From simulation to chain evidence.</h1>
                <p>
                  Public observations with a source, timestamp and block number.
                </p>
              </div>
              <button
                className="button primary"
                disabled={loading}
                onClick={readLive}
              >
                <Radio size={16} />
                {loading ? 'Reading…' : 'Read testnet'}
              </button>
            </div>
            <section className="panel prose">
              <h2>Somnia Shannon connection</h2>
              <p>
                This only reads public data. It does not connect a wallet or
                place an order.
              </p>
              {error && (
                <div className="error" role="alert">
                  {error}
                  <p>
                    The replay lab remains available. Retry or use the local
                    recorder.
                  </p>
                </div>
              )}
              {!live && !loading && !error && (
                <div className="read-prompt">
                  <Radio size={28} />
                  <p>
                    Read the testnet to capture the current block and live
                    market identities.
                  </p>
                </div>
              )}
              {loading && (
                <p role="status">
                  Discovering windows and checking on-chain status…
                </p>
              )}
              {live && (
                <>
                  <div className="live-stats">
                    <div>
                      <small>BLOCK</small>
                      <b>{live.block}</b>
                    </div>
                    <div>
                      <small>LIVE WINDOWS</small>
                      <b>{live.markets.length}</b>
                    </div>
                    <div>
                      <small>OBSERVED AT</small>
                      <span>{new Date(live.observedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p>
                    Source: <code>{live.source}</code>
                  </p>
                  {live.markets.length === 0 ? (
                    <p>
                      No current markets found in this bounded scan. This does
                      not prove no markets exist.
                    </p>
                  ) : (
                    <div className="market-list">
                      {live.markets.map((m) => (
                        <div key={m.marketId}>
                          <b>{m.asset}</b>
                          <span>
                            Expires {new Date(m.expiry).toLocaleTimeString()}
                          </span>
                          <code>{m.marketId.slice(0, 14)}…</code>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://shannon-explorer.somnia.network/address/${m.pool}`}
                          >
                            Pool <ExternalLink size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="button secondary"
                    onClick={() => save('testnet-observation.json', live)}
                  >
                    <Download size={15} />
                    Export observation
                  </button>
                </>
              )}
            </section>
            <section className="panel prose">
              <div className="eyebrow">TRANSACTION VERIFICATION</div>
              <h2>Run a funded lifecycle locally</h2>
              <p>
                The app never stores a signing key. A local adapter mints,
                places, cancels and redeems testnet positions, saving
                transaction evidence.
              </p>
              <pre>
                npm run testnet:discover{'\n'}npm run testnet:verify{'\n'}npm
                run testnet:redeem
              </pre>
              <p>
                A live transaction run requires STT and tUSDC. Simulation
                results are never presented as transaction evidence.
              </p>
              <a
                href="https://t.me/+XHq0F0JXMyhmMzM0"
                target="_blank"
                rel="noreferrer"
              >
                Somnia developer faucet group <ExternalLink size={14} />
              </a>
            </section>
          </TabsContent>
          <TabsContent value="guide">
            <div className="breadcrumb">
              Workspace <ChevronRight size={13} /> Integration guide
            </div>
            <div className="page-heading">
              <div>
                <div className="eyebrow lime">REPRODUCIBLE BY DESIGN</div>
                <h1>Make failures part of your test suite.</h1>
                <p>
                  The browser and local runner use the same deterministic
                  engine.
                </p>
              </div>
            </div>
            <div className="guide-grid">
              <section className="panel prose">
                <h2>1. Run the bundled suite</h2>
                <pre>
                  npm install{'\n'}npm test{'\n'}npm run lab -- --scenario
                  partial-fill --seed 42{'\n'}npm run lab -- --all --out
                  reports/suite.json
                </pre>
                <p>
                  Reports contain every observed event, ledger mismatch and
                  input parameter, plus a SHA-256 integrity hash.
                </p>
                <h2>2. Change the inputs</h2>
                <pre>
                  npm run lab -- --scenario partial-fill \{'\n'} --requested 10
                  --liquidity 10
                </pre>
                <p>
                  A fully filled order will not expose the phantom-position bug.
                  Test boundary conditions, not just the default fixture.
                </p>
              </section>
              <section className="panel prose">
                <h2>3. Bring your own reducer</h2>
                <pre>
                  export default {'{'}
                  {'\n'} name: 'my-strategy',{'\n'} reduce(state, event) {'{'}
                  {'\n'} return applyEvent(state, event);{'\n'} {'}'}
                  {'\n'}
                  {'}'};
                </pre>
                <p>
                  Pass trusted local code with{' '}
                  <code>--strategy ./my-strategy.ts</code>. Your ledger is
                  compared with an independent event oracle.
                </p>
                <h2>Know the boundary</h2>
                <p>
                  WindTunnel tests application bookkeeping, identity and
                  recovery. It does not reproduce order-book queue priority or
                  forecast investment returns.
                </p>
                <a
                  href="https://app.dreamdex.io/docs/developers/event-contracts/gotchas"
                  target="_blank"
                  rel="noreferrer"
                >
                  Integration gotchas <ExternalLink size={14} />
                </a>
              </section>
            </div>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
