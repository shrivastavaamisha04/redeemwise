import { formatCurrency, formatCurrencyShort } from '../utils/formatCurrency.js';

const STEP = 50000;

export default function GoalAdjuster({ value, min, max, onChange }) {
  const safeMin = Math.max(STEP, min);
  const safeMax = Math.max(safeMin, max);
  const clamp = (n) => Math.min(safeMax, Math.max(safeMin, Math.round(n / STEP) * STEP));

  const dec = () => onChange(clamp(value - STEP));
  const inc = () => onChange(clamp(value + STEP));
  const onSlider = (e) => onChange(clamp(Number(e.target.value)));

  const pct = ((value - safeMin) / (safeMax - safeMin)) * 100;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Goal amount
          </div>
          <div className="text-lg sm:text-xl font-bold text-text-primary mt-0.5 tabular-nums">
            {formatCurrency(value)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dec}
            disabled={value <= safeMin}
            aria-label="Decrease goal"
            className="w-9 h-9 rounded-full bg-bg-surface text-text-primary font-bold text-lg flex items-center justify-center hover:bg-bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            −
          </button>
          <button
            type="button"
            onClick={inc}
            disabled={value >= safeMax}
            aria-label="Increase goal"
            className="w-9 h-9 rounded-full bg-bg-surface text-text-primary font-bold text-lg flex items-center justify-center hover:bg-bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            +
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={STEP}
          value={value}
          onChange={onSlider}
          aria-label="Goal amount"
          className="goal-slider w-full"
          style={{ '--fill': `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-text-secondary mt-1.5 tabular-nums">
        <span>{formatCurrencyShort(safeMin)}</span>
        <span>{formatCurrencyShort(safeMax)}</span>
      </div>
    </section>
  );
}
