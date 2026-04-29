import { useState } from 'react';

export default function InsightsPanel({ insightCount, children }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-bg-surface transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl leading-none" aria-hidden>💡</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary">
              Insights & tips
            </div>
            <div className="text-[11px] text-text-secondary">
              {insightCount} {insightCount === 1 ? 'insight' : 'insights'} available
              {!open && ' · tap to explore'}
            </div>
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 text-text-secondary shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-bg-surface px-4 py-4 space-y-4 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  );
}
