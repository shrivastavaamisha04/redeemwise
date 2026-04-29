import { useAnimatedNumber } from '../utils/useAnimatedNumber.js';
import { formatCurrency, formatPercent } from '../utils/formatCurrency.js';
import { useViewMode } from '../context/ViewModeContext.jsx';

function SimpleFundRow({ line }) {
  const fundShort = line.fund.name.split(' - ')[0];
  return (
    <div className="flex items-center justify-between py-2.5 border-t border-bg-surface first:border-t-0">
      <span className="text-sm font-semibold text-text-primary truncate mr-3" title={line.fund.name}>
        {fundShort}
      </span>
      <span className="text-sm font-bold text-text-primary tabular-nums shrink-0">
        {formatCurrency(line.amountToRedeem)}
      </span>
    </div>
  );
}

function ExpertFundRow({ line }) {
  const pct = Math.min(1, Math.max(0, line.percentOfFund));
  const fundShort = line.fund.name.split(' - ')[0];
  return (
    <div className="py-3 border-t border-bg-surface first:border-t-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary truncate" title={line.fund.name}>
          {fundShort}
        </span>
        <span className="text-sm font-bold text-text-primary tabular-nums shrink-0">
          {formatCurrency(line.amountToRedeem)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bg-surface-dark/50 overflow-hidden">
        <div
          className="h-full bg-primary-green rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct * 100, 2)}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-secondary">
          {line.taxTypeLabel} · {formatPercent(pct * 100, 0)} of fund
        </span>
        <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${line.tax > 0 ? 'text-negative' : 'text-text-secondary'}`}>
          {line.tax > 0 ? `−${formatCurrency(line.tax)}` : '₹0'} tax
          {line.exitLoad > 0 && ` · −${formatCurrency(line.exitLoad)} load`}
        </span>
      </div>
    </div>
  );
}

export default function StrategyAccordionItem({ plan, isExpanded, isCheapest, isWorst, actionLine, children, onClick }) {
  const { isExpert } = useViewMode();
  const animCost = useAnimatedNumber(plan.totalCost);
  const animNet = useAnimatedNumber(plan.netAmountReceived);
  const FundRow = isExpert ? ExpertFundRow : SimpleFundRow;

  return (
    <div className="card overflow-hidden animate-fade-in">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isExpanded}
        className={`w-full px-4 py-3.5 text-left transition-all flex items-center gap-3 ${isExpanded ? 'border-b border-bg-surface' : 'hover:bg-bg-surface'}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-text-primary">{plan.label}</span>
            {isCheapest && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-green text-white">
                Cheapest
              </span>
            )}
            {plan.isRecommended && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-blue text-white">
                Recommended
              </span>
            )}
          </div>
          {!isExpanded && (
            <div className="text-xs text-text-secondary tabular-nums">
              {formatCurrency(Math.round(animCost))} cost
            </div>
          )}
        </div>
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 text-text-secondary shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="animate-fade-in">
          {actionLine && (
            <div className="px-4 pt-4 pb-3 text-sm sm:text-base font-semibold text-text-primary leading-relaxed">
              {actionLine}
            </div>
          )}

          {isExpert ? (
            <div className="px-4 pt-2 pb-2 flex items-center justify-between gap-3 bg-bg-surface-dark/40 text-xs tabular-nums">
              <span className="font-semibold text-text-secondary">
                Tax <span className="font-bold text-text-primary">{formatCurrency(Math.round(plan.totalTax))}</span>
              </span>
              <span className="font-semibold text-text-secondary">
                + Load <span className="font-bold text-text-primary">{formatCurrency(Math.round(plan.totalExitLoad))}</span>
              </span>
              <span className="font-semibold text-text-secondary">
                = Cost <span className="font-bold text-negative">{formatCurrency(Math.round(animCost))}</span>
              </span>
            </div>
          ) : (
            <div className="px-4 pt-2 pb-2 flex items-center justify-between gap-3 bg-bg-surface-dark/40 text-xs tabular-nums">
              <span className="font-semibold text-text-secondary">
                Cost <span className="font-bold text-text-primary">{formatCurrency(Math.round(animCost))}</span>
              </span>
              <span className="font-semibold text-text-secondary">
                You receive <span className="font-bold text-primary-green">{formatCurrency(Math.round(animNet))}</span>
              </span>
            </div>
          )}

          <div className="px-4 py-1">
            {plan.funds.map((line) => (
              <FundRow key={line.fund.id} line={line} />
            ))}
          </div>

          {!plan.goalMet && (
            <div className="mx-4 mt-2 rounded-card bg-warning/10 text-warning text-xs p-3">
              Heads up: this strategy can only redeem {formatCurrency(plan.totalRedeemed)}. Shortfall {formatCurrency(plan.shortfall)}.
            </div>
          )}

          <p className="px-4 pb-3 pt-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
            {isExpert ? plan.explanation.expert : plan.explanation.simple}
          </p>

          {children && (
            <div className="border-t border-bg-surface">
              {children}
            </div>
          )}

          <div className="px-4 py-3 flex justify-center border-t border-bg-surface">
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Read less
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
