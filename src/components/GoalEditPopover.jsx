import { useEffect, useState } from 'react';
import GoalAdjuster from './GoalAdjuster.jsx';
import { TAX_SLABS } from '../data/shanaya.js';

export default function GoalEditPopover({
  open,
  onClose,
  goal,
  taxSlab,
  min,
  max,
  onApply,
}) {
  const [draftGoal, setDraftGoal] = useState(goal);
  const [draftSlab, setDraftSlab] = useState(taxSlab);

  useEffect(() => {
    if (open) {
      setDraftGoal(goal);
      setDraftSlab(taxSlab);
    }
  }, [open, goal, taxSlab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleApply = () => {
    onApply({ goal: draftGoal, taxSlab: draftSlab });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-edit-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-text-primary/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg bg-bg-white rounded-t-3xl sm:rounded-card shadow-card-hover max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-white px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-bg-surface">
          <div>
            <h2 id="goal-edit-title" className="text-lg font-bold text-text-primary">
              Adjust your goal
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Recommendations update live as you change values.
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

        <div className="px-5 sm:px-6 pt-4 pb-6 space-y-5">
          <GoalAdjuster value={draftGoal} min={min} max={max} onChange={setDraftGoal} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Your income tax slab
            </label>
            <div className="flex flex-wrap gap-2">
              {TAX_SLABS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setDraftSlab(s.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    draftSlab === s.value
                      ? 'bg-primary-green text-white'
                      : 'bg-bg-surface text-text-primary hover:bg-bg-surface-dark',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="btn-primary w-full py-3.5 text-base"
          >
            Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}
