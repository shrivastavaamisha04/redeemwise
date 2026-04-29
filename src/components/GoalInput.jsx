import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOAL_PURPOSES, TAX_SLABS } from '../data/shanaya.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { useViewMode } from '../context/ViewModeContext.jsx';

export default function GoalInput({
  open,
  onClose,
  initial,
  redirectTo = '/shanaya/recommend',
  highlightSlab = false,
}) {
  const navigate = useNavigate();
  const { isExpert } = useViewMode();
  const [amount, setAmount] = useState(initial?.goal ?? 0);
  const [purpose, setPurpose] = useState(initial?.goalPurpose ?? 'Other');
  const [slab, setSlab] = useState(initial?.taxSlab ?? 0.3);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      setAmount(initial?.goal ?? 0);
      setPurpose(initial?.goalPurpose ?? 'Other');
      setSlab(initial?.taxSlab ?? 0.3);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount <= 0) return;
    onClose();
    navigate(redirectTo, {
      state: { goal: amount, taxSlab: slab, goalPurpose: purpose },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-input-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-text-primary/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-lg bg-bg-white rounded-t-3xl sm:rounded-card shadow-card-hover max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-bg-white px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-bg-surface">
          <div>
            <h2 id="goal-input-title" className="text-lg font-bold text-text-primary">
              How much do you need?
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              We'll find the smartest way to redeem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-bg-surface"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 pt-4 pb-6 space-y-5">
          <div>
            <label htmlFor="goal-amount" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Amount needed
            </label>
            <div className="flex items-center gap-2 bg-bg-surface rounded-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary-green">
              <span className="text-2xl font-bold text-text-secondary">₹</span>
              <input
                id="goal-amount"
                type="number"
                inputMode="numeric"
                min="0"
                step="1000"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="flex-1 bg-transparent text-2xl font-bold text-text-primary outline-none placeholder:text-text-secondary/60"
                placeholder="10,00,000"
              />
            </div>
            {amount > 0 && (
              <div className="text-xs text-text-secondary mt-1.5">
                {formatCurrency(amount)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              What's it for?
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    purpose === p
                      ? 'bg-primary-green text-white'
                      : 'bg-bg-surface text-text-primary hover:bg-bg-surface-dark',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className={highlightSlab ? 'rounded-card bg-accent-blue-lightest p-3 -m-1' : ''}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Your income tax slab
            </label>
            <div className="flex flex-wrap gap-2">
              {TAX_SLABS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSlab(s.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    slab === s.value
                      ? 'bg-primary-green text-white'
                      : 'bg-bg-surface text-text-primary hover:bg-bg-surface-dark',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {highlightSlab && (
              <p className="text-[11px] text-text-secondary mt-2">
                {isExpert
                  ? 'Applicable slab rate for debt and gold STCG computation.'
                  : 'Choose your income tax bracket.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 text-base"
            disabled={amount <= 0}
          >
            Show me the best way to redeem
          </button>
        </form>
      </div>
    </div>
  );
}
