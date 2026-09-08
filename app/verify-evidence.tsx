'use client';
import { useState } from 'react';
import { ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';
interface Verification {
  observedAt: string;
  verified: number;
  total: number;
  scope: string;
  receipts: {
    hash: string;
    action: string;
    status: string;
    block: string | null;
    matched: boolean;
  }[];
}
export default function VerifyEvidence() {
  const [result, setResult] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function verify() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/verify', {
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok)
        throw new Error(
          'The public RPC is unavailable. Retry or inspect the explorer links.',
        );
      setResult(await response.json());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Verification unavailable. Please retry.',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="live-verification">
      <div>
        <h3>Check the receipts yourself.</h3>
        <p>
          Re-read their status and block numbers directly from the public
          Shannon RPC.
        </p>
      </div>
      <button className="button primary" onClick={verify} disabled={loading}>
        {loading ? <RefreshCw size={16} /> : <ShieldCheck size={16} />}{' '}
        {loading ? 'Checking chain…' : 'Verify receipts live'}
      </button>
      <div className="verification-result" aria-live="polite">
        {error && (
          <p role="alert" className="fail">
            {error}
          </p>
        )}
        {result && (
          <>
            <strong
              className={result.verified === result.total ? 'pass' : 'fail'}
            >
              {result.verified}/{result.total} receipts match the recorded
              evidence
            </strong>
            <small>
              Checked {new Date(result.observedAt).toLocaleString()}
            </small>
            <p>{result.scope}</p>
            {result.receipts
              .filter((r) => !r.matched)
              .map((r) => (
                <a
                  href={`https://shannon-explorer.somnia.network/tx/${r.hash}`}
                  key={r.hash}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.action}:{' '}
                  {r.status === 'unavailable'
                    ? 'RPC read unavailable'
                    : 'record does not match'}{' '}
                  <ExternalLink size={13} />
                </a>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
