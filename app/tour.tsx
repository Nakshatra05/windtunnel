'use client';
import { ArrowRight, X, RotateCcw } from 'lucide-react';
export const TOUR = [
  {
    title: 'Find the phantom position.',
    body: 'Ten requested. Three filled. The reference records ten; the repaired bot records three. Compare the ledgers below.',
  },
  {
    title: 'Change the conditions.',
    body: 'Now all ten contracts fill. Both bots pass. This is a computed result: a different input can hide the same bug.',
  },
  {
    title: 'Catch a stale market.',
    body: 'The pool is reused, but the market identity changes. The reference keeps the old window; the repair refreshes the binding.',
  },
  {
    title: 'Recover without duplicate credit.',
    body: 'Premature and repeated credits inflate the reference payout to 30. The repaired bot waits for confirmation and records the receipt once: 10 units.',
  },
  {
    title: 'Inspect the real evidence.',
    body: 'The replay scenarios are synthetic. This separate testnet run has real receipts and reconciled redemption balances. Open any transaction to verify it.',
  },
];
export default function Tour({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (n: number) => void;
  onClose: () => void;
}) {
  const current = TOUR[step];
  return (
    <section className="judge-tour" aria-label="Guided demo">
      <div>
        <span className="eyebrow">
          GUIDED DEMO · {step + 1} / {TOUR.length}
        </span>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
      </div>
      <div className="tour-actions">
        <div className="tour-dots">
          {TOUR.map((s, i) => (
            <button
              key={s.title}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-pressed={i === step}
              onClick={() => onStep(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          className="button secondary"
          onClick={() => onStep(step === 4 ? 0 : step + 1)}
        >
          {step === 4 ? (
            <>
              <RotateCcw size={16} /> Restart tour
            </>
          ) : (
            <>
              Next step <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
      <button
        className="tour-close"
        aria-label="Close guided demo"
        onClick={onClose}
      >
        <X size={18} />
      </button>
    </section>
  );
}
