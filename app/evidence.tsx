import evidence from '../data/lifecycle.json';
import { Check, ExternalLink } from 'lucide-react';
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
        benchmark.
      </p>
      <a href="/evidence/lifecycle.json" download>
        Download complete evidence <ExternalLink size={14} />
      </a>
    </section>
  );
}
