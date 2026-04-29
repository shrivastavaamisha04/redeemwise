import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { useViewMode } from '../context/ViewModeContext.jsx';
import { useAnimatedNumber } from '../utils/useAnimatedNumber.js';
import {
  EQUITY_LTCG_HOLDING_MONTHS,
  GOLD_LTCG_HOLDING_MONTHS,
  classifyTax,
} from '../engine/taxCalculator.js';

const MAX_WAIT = 12;

function shiftFunds(funds, monthsToWait) {
  return funds.map((f) => {
    const shiftedHolding = f.holdingMonths + monthsToWait;
    const wasInLoad = f.holdingMonths < f.exitLoadPeriodMonths;
    const stillInLoad = shiftedHolding < f.exitLoadPeriodMonths;
    return {
      ...f,
      holdingMonths: shiftedHolding,
      _crossedExitLoad: wasInLoad && !stillInLoad,
    };
  });
}

function detectThresholdCrossings(originalFunds, monthsToWait) {
  const crossings = [];
  for (const f of originalFunds) {
    const before = f.holdingMonths;
    const after = f.holdingMonths + monthsToWait;
    const beforeClass = classifyTax(f);
    const afterClass = classifyTax({ ...f, holdingMonths: after });
    if (beforeClass !== afterClass) {
      crossings.push({
        fundId: f.id,
        fundName: f.name.split(' - ')[0],
        from: beforeClass,
        to: afterClass,
        threshold: f.type === 'gold' ? GOLD_LTCG_HOLDING_MONTHS : EQUITY_LTCG_HOLDING_MONTHS,
        monthsToCross: (f.type === 'gold' ? GOLD_LTCG_HOLDING_MONTHS : EQUITY_LTCG_HOLDING_MONTHS) - before + 1,
      });
    }
    const wasInLoad = before < f.exitLoadPeriodMonths;
    const stillInLoad = after < f.exitLoadPeriodMonths;
    if (wasInLoad && !stillInLoad) {
      crossings.push({
        fundId: f.id,
        fundName: f.name.split(' - ')[0],
        kind: 'exit_load_clear',
        threshold: f.exitLoadPeriodMonths,
        monthsToCross: f.exitLoadPeriodMonths - before,
      });
    }
  }
  return crossings;
}

const CLASS_LABELS = {
  LTCG_EQUITY: 'LTCG 12.5%',
  STCG_EQUITY: 'STCG 20%',
  DEBT_SLAB: 'Slab',
  LTCG_GOLD: 'LTCG 12.5%',
  STCG_GOLD: 'STCG (slab)',
};

export default function WhatIfSlider({
  monthsToWait,
  onChange,
  baselineCost,
  waitedCost,
  originalFunds,
}) {
  const { isExpert } = useViewMode();
  const savings = baselineCost - waitedCost;
  const hasSavings = savings > 0;

  const animatedSavings = useAnimatedNumber(Math.abs(savings));
  const animatedCost = useAnimatedNumber(waitedCost);

  const crossings = useMemo(
    () => detectThresholdCrossings(originalFunds, monthsToWait),
    [originalFunds, monthsToWait]
  );

  const fillPct = (monthsToWait / MAX_WAIT) * 100;

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-base font-bold text-text-primary">
          {isExpert ? 'Holding Period Sensitivity' : 'What if you wait?'}
        </h3>
        <span className="text-xs text-text-secondary tabular-nums">
          {monthsToWait === 0 ? 'Today' : `+${monthsToWait} mo`}
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-4">
        Drag to see how waiting changes your tax bill.
      </p>

      <input
        type="range"
        min={0}
        max={MAX_WAIT}
        step={1}
        value={monthsToWait}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Months to wait"
        className="whatif-slider w-full"
        style={{ '--fill': `${fillPct}%` }}
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-text-secondary tabular-nums">
        {[0, 3, 6, 9, 12].map((m) => (
          <span key={m}>{m === 0 ? 'Now' : `${m}mo`}</span>
        ))}
      </div>

      <div
        className={[
          'mt-4 rounded-card p-4',
          monthsToWait === 0
            ? 'bg-bg-surface'
            : hasSavings
            ? 'bg-primary-green/10 border border-primary-green/30'
            : savings < 0
            ? 'bg-warning/10 border border-warning/30'
            : 'bg-bg-surface',
        ].join(' ')}
      >
        {monthsToWait === 0 ? (
          <div className="text-sm text-text-secondary">
            Move the slider to project your future tax bill.
          </div>
        ) : hasSavings || savings < 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary whitespace-nowrap">
                  {hasSavings ? 'You save' : 'Extra cost'}
                </div>
                <div
                  className={[
                    'text-xl sm:text-2xl font-bold mt-1 tabular-nums leading-none',
                    hasSavings ? 'text-positive' : 'text-warning',
                  ].join(' ')}
                >
                  {hasSavings ? '+' : '−'}
                  {formatCurrency(Math.round(animatedSavings))}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary whitespace-nowrap">
                  New total cost
                </div>
                <div className="text-xl sm:text-2xl font-bold text-text-primary mt-1 tabular-nums leading-none">
                  {formatCurrency(Math.round(animatedCost))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5" aria-hidden>ℹ️</span>
            <div className="text-sm text-text-primary">
              <div className="font-semibold">
                Same total cost ({formatCurrency(Math.round(animatedCost))}) for this strategy.
              </div>
              <div className="text-xs text-text-secondary mt-1 leading-relaxed">
                {crossings.length > 0
                  ? `The ${crossings.length === 1 ? 'fund' : 'funds'} listed below cross${crossings.length === 1 ? 'es' : ''} a tax/load threshold at +${monthsToWait}mo, but this strategy isn't redeeming ${crossings.length === 1 ? 'it' : 'them'} at your current goal. Try a higher goal or a different strategy to unlock the saving.`
                  : `Nothing crosses a threshold at +${monthsToWait}mo, so tax treatment is identical.`}
              </div>
            </div>
          </div>
        )}
      </div>

      {crossings.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
            What changes
          </div>
          <ul className="space-y-2">
            {crossings.map((c, idx) => (
              <li
                key={`${c.fundId}-${c.kind ?? 'tax'}-${idx}`}
                className="flex items-start gap-2 text-xs text-text-primary bg-bg-surface rounded-card px-3 py-2"
              >
                <span className="text-primary-green text-base leading-none mt-0.5" aria-hidden>✓</span>
                <span className="flex-1">
                  <span className="font-semibold">{c.fundName}</span>
                  {c.kind === 'exit_load_clear' ? (
                    <>
                      {' '}— exit-load window closes at {c.threshold} mo (
                      <span className="text-positive font-semibold">no penalty after +{c.monthsToCross} mo</span>)
                      {isExpert && '. Redeeming any time after this is fee-free.'}
                    </>
                  ) : (
                    <>
                      {': '}
                      <span className="text-text-secondary">{CLASS_LABELS[c.from]}</span>
                      {' → '}
                      <span className="text-positive font-semibold">{CLASS_LABELS[c.to]}</span>
                      {isExpert && (
                        <span className="text-text-secondary">
                          {' '}(crosses {c.threshold}-month threshold)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export { shiftFunds, detectThresholdCrossings, MAX_WAIT };
