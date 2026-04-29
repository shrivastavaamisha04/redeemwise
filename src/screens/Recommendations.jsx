import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import StrategyAccordionItem from '../components/StrategyAccordionItem.jsx';
import GoalEditPopover from '../components/GoalEditPopover.jsx';
import WhatIfSlider, { shiftFunds, MAX_WAIT } from '../components/WhatIfSlider.jsx';
import SmartSuggestions from '../components/SmartSuggestions.jsx';
import { SHANAYA_PORTFOLIO, SHANAYA_PROFILE } from '../data/shanaya.js';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { formatCurrency, formatCurrencyShort } from '../utils/formatCurrency.js';
import { useViewMode } from '../context/ViewModeContext.jsx';
import {
  STRATEGY_KEYS,
  runAllStrategies,
  compareStrategies,
} from '../engine/strategies.js';

const STRATEGY_ORDER = [
  STRATEGY_KEYS.SMART_BALANCE,
  STRATEGY_KEYS.SAVE_TAX,
  STRATEGY_KEYS.AVOID_PENALTIES,
  STRATEGY_KEYS.KEEP_WINNERS,
];

const GOAL_MIN = 10000;

export default function Recommendations({ source = 'shanaya' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isExpert } = useViewMode();
  const { funds: playgroundFunds } = usePortfolio();

  const state = location.state ?? {};
  const initialGoal = Number(state.goal) || 0;
  const initialSlab = typeof state.taxSlab === 'number' ? state.taxSlab : SHANAYA_PROFILE.taxSlab;
  const purpose = state.goalPurpose ?? state.purpose ?? SHANAYA_PROFILE.goalPurpose;

  const portfolio = source === 'playground' ? playgroundFunds : SHANAYA_PORTFOLIO;
  const portfolioValue = useMemo(
    () => portfolio.reduce((s, f) => s + (f.currentValue || 0), 0),
    [portfolio]
  );
  const goalMax = Math.max(portfolioValue, GOAL_MIN);
  const backPath = source === 'playground' ? '/' : '/shanaya';
  const fallbackPath = source === 'playground' ? '/' : '/shanaya';

  const [goal, setGoal] = useState(initialGoal);
  const [taxSlab, setTaxSlab] = useState(initialSlab);
  const [monthsToWait, setMonthsToWait] = useState(0);
  const [activeKey, setActiveKey] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const handleStrategyClick = (key) => {
    setActiveKey((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    if (initialGoal > 0) setGoal(initialGoal);
  }, [initialGoal]);

  const baselinePlans = useMemo(() => {
    if (goal <= 0 || portfolio.length === 0) return [];
    return runAllStrategies(portfolio, goal, taxSlab);
  }, [goal, taxSlab, portfolio]);

  const shiftedFunds = useMemo(
    () => shiftFunds(portfolio, monthsToWait),
    [monthsToWait, portfolio]
  );

  const waitedPlans = useMemo(() => {
    if (goal <= 0 || portfolio.length === 0) return [];
    if (monthsToWait === 0) return baselinePlans;
    return runAllStrategies(shiftedFunds, goal, taxSlab);
  }, [shiftedFunds, goal, taxSlab, monthsToWait, baselinePlans, portfolio.length]);

  const waitedComparison = useMemo(() => compareStrategies(waitedPlans), [waitedPlans]);

  const baselineActive = baselinePlans.find((p) => p.key === activeKey) ?? baselinePlans[0];
  const activePlan = waitedPlans.find((p) => p.key === activeKey) ?? waitedPlans[0];

  const bestWait = useMemo(() => {
    if (goal <= 0 || portfolio.length === 0) return { months: 0, cost: null };
    const baselineSmart = baselinePlans.find((p) => p.key === STRATEGY_KEYS.SMART_BALANCE);
    if (!baselineSmart) return { months: 0, cost: null };
    let bestMonths = 0;
    let bestCost = baselineSmart.totalCost;
    for (let m = 1; m <= MAX_WAIT; m++) {
      const fundsAtM = shiftFunds(portfolio, m);
      const plans = runAllStrategies(fundsAtM, goal, taxSlab);
      const smart = plans.find((p) => p.key === STRATEGY_KEYS.SMART_BALANCE);
      if (smart && smart.totalCost < bestCost) {
        bestCost = smart.totalCost;
        bestMonths = m;
      }
    }
    return { months: bestMonths, cost: bestCost };
  }, [goal, taxSlab, baselinePlans, portfolio]);

  const insightCount = useMemo(() => {
    if (!activePlan) return 1;
    let count = 1;
    const equityLtcg = activePlan.funds
      .filter((l) => l.taxType === 'LTCG_EQUITY')
      .reduce((s, l) => s + l.gainsRedeemed, 0);
    if (equityLtcg > 125000) count += 1;
    if (bestWait.cost != null && bestWait.months > 0 && (baselineActive?.totalCost ?? 0) - bestWait.cost > 0) count += 1;
    if (portfolio.some((f) => f.totalGains < 0)) count += 1;
    count += 1;
    return count;
  }, [activePlan, baselineActive, bestWait, portfolio]);

  const actionLineFor = useMemo(() => {
    return (plan) => {
      if (!plan || !plan.funds.length) return '';
      const items = plan.funds.slice(0, 3).map((line) => {
        const name = line.fund.name.split(' - ')[0];
        return `${formatCurrency(line.amountToRedeem)} from ${name}`;
      });
      const suffix = plan.funds.length > 3
        ? ` + ${plan.funds.length - 3} more fund${plan.funds.length - 3 > 1 ? 's' : ''}`
        : '';
      return `Redeem ${items.join(' and ')}${suffix} to reach your ${formatCurrencyShort(goal)} ${purpose.toLowerCase()} goal.`;
    };
  }, [goal, purpose]);

  if (initialGoal <= 0 || portfolio.length === 0) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="sticky top-[57px] -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-bg-white/90 backdrop-blur z-20 border-b border-bg-surface flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary shrink-0"
          >
            <span aria-hidden>←</span> Portfolio
          </button>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 min-w-0 px-3 py-1.5 rounded-full hover:bg-bg-surface transition-all"
              aria-label="Edit goal"
            >
              <span className="text-sm font-bold text-text-primary truncate tabular-nums">
                {formatCurrency(goal)} for {purpose.toLowerCase()}
              </span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </button>
          </div>
        </div>

        <section className="space-y-3">
          {STRATEGY_ORDER.map((key) => {
            const plan = waitedPlans.find((p) => p.key === key);
            if (!plan) return null;
            const isActive = activeKey === key;
            const isWorst = waitedComparison.worstKey === key;
            return (
              <div
                key={key}
                className={`transition-opacity duration-300 ${activeKey && !isActive ? 'opacity-60' : ''}`}
              >
                <StrategyAccordionItem
                  plan={plan}
                  isExpanded={isActive}
                  isCheapest={waitedComparison.bestKey === key}
                  isWorst={isWorst}
                  actionLine={isActive ? actionLineFor(plan) : ''}
                  onClick={() => handleStrategyClick(key)}
                >
                  {isActive && (
                    <div className="pt-4 space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-text-secondary px-4">
                        💡 Tips & insights ({insightCount})
                      </div>
                      <div className="px-4">
                        <WhatIfSlider
                          monthsToWait={monthsToWait}
                          onChange={setMonthsToWait}
                          baselineCost={baselineActive?.totalCost ?? 0}
                          waitedCost={activePlan.totalCost ?? 0}
                          originalFunds={portfolio}
                        />
                      </div>
                      <div className="px-4">
                        <SmartSuggestions
                          activePlan={activePlan}
                          baselineCost={baselineActive?.totalCost ?? 0}
                          bestWaitedCost={bestWait.cost}
                          bestWaitedMonths={bestWait.months}
                          funds={portfolio}
                        />
                      </div>
                    </div>
                  )}
                </StrategyAccordionItem>
              </div>
            );
          })}
        </section>

        {!activeKey && (
          <div className="card p-6 text-center text-text-secondary">
            <div className="text-xl mb-2">👆</div>
            <div className="text-sm font-semibold">Choose a strategy</div>
            <div className="text-xs mt-1">Tap one above to see detailed redemption steps, tax breakdowns, and personalized insights.</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 text-[12px]">
          <span className="text-text-secondary">ℹ Tax estimates are approximate.</span>
          <Link to="/how-we-calculate" className="text-brand-blue hover:underline">What's included and excluded? →</Link>
        </div>
      </div>

      <GoalEditPopover
        open={editOpen}
        onClose={() => setEditOpen(false)}
        goal={goal}
        taxSlab={taxSlab}
        min={GOAL_MIN}
        max={goalMax}
        onApply={({ goal: g, taxSlab: t }) => {
          setGoal(g);
          setTaxSlab(t);
        }}
      />
    </Layout>
  );
}
