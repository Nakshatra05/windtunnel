import evidence from '../data/lifecycle.json';
import { Check, ExternalLink } from 'lucide-react';
import VerifyEvidence from './verify-evidence';
export default function Evidence() {
  const fills = evidence.steps.filter((s) => s.action === 'take-liquidity');
  return (
    <section className="panel prose">
      <div className="eyebrow lime">RECORDED ON SOMNIA SHANNON</div>
      <h2>Verified transaction trail</h2>
      <p>
        A controlled two-wallet fixture, captured{' '}
        {new Date(evidence.createdAt).toUTCString()}. These are real testnet
        transactions, separate from the synthetic replay scenarios.
      </p>
      <div className="live-stats">
        <div>
          <small>NETWORK</small>
          <b>50312</b>
        </div>
        <div>
          <small>SUCCESSFUL TRANSACTIONS</small>
          <b>{evidence.steps.filter((s) => s.status === 'success').length}</b>
        </div>
        <div>
          <small>LIFECYCLE STATUS</small>
          <span>{evidence.state.replaceAll('-', ' ')}</span>
        </div>
      </div>
      <div
        className="reconciliation"
        aria-label="Redemption balance reconciliation"
      >
        {evidence.reconciliation.map((r, i) => (
          <div key={r.wallet}>
            <span className="eyebrow">
              {i === 0 ? 'OWNER' : 'FIXTURE MAKER'} · REDEMPTION
            </span>
            <h3>
              {r.expected === r.actual
                ? 'Balance reconciled'
                : 'Balance mismatch'}
            </h3>
            <dl>
              <div>
                <dt>Expected change</dt>
                <dd>{Number(r.expected) / 1e6} tUSDC</dd>
              </div>
              <div>
                <dt>Observed change</dt>
                <dd>{Number(r.actual) / 1e6} tUSDC</dd>
              </div>
              <div>
                <dt>Difference</dt>
                <dd>{(Number(r.actual) - Number(r.expected)) / 1e6} tUSDC</dd>
              </div>
            </dl>
            <a
              href={`https://shannon-explorer.somnia.network/address/${r.wallet}`}
              target="_blank"
              rel="noreferrer"
            >
              {r.wallet.slice(0, 8)}…{r.wallet.slice(-6)}{' '}
              <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>
      <VerifyEvidence />
      <div className="receipt-list">
        {evidence.steps.map((s) => (
          <a
            className="receipt-row"
            key={s.hash}
            href={`https://shannon-explorer.somnia.network/tx/${s.hash}`}
            target="_blank"
            rel="noreferrer"
          >
            <Check size={15} />
            <span>{s.action.replaceAll('-', ' ')}</span>
            <code>
              {s.hash.slice(0, 12)}…{s.hash.slice(-6)}
            </code>
            <small>Block {s.block}</small>
            <ExternalLink size={14} />
          </a>
        ))}
      </div>
      <p>
        {fills.length} filled-order transaction recorded. Every fill quantity is
        available in the evidence JSON. This fixture demonstrates integration
        correctness; it is not organic trading activity or a performance
        benchmark. The take order matched public orderbook liquidity; using
        controlled wallets does not imply both sides of that fill belonged to
        the fixture.
      </p>
      <a href="/evidence/lifecycle.json" download>
        Download complete evidence <ExternalLink size={14} />
      </a>
    </section>
  );
}
