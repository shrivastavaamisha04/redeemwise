import { useViewMode } from '../context/ViewModeContext.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import {
  EQUITY_LTCG_RATE,
  LTCG_EXEMPTION_LIMIT,
} from '../engine/taxCalculator.js';

function TipCard({ tone = 'info', icon = '💡', title, body }) {
  const toneClass = {
    info: 'bg-accent-blue-lightest border-brand-blue/20',
    positive: 'bg-primary-green/10 border-primary-green/30',
    warning: 'bg-warning/10 border-warning/30',
    neutral: 'bg-bg-surface border-bg-surface-dark',
  }[tone];

  return (
    <article className={`rounded-card border p-3.5 flex items-start gap-3 ${toneClass}`}>
      <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="text-xs text-text-secondary mt-1 leading-relaxed">{body}</div>
      </div>
    </article>
  );
}

export default function SmartSuggestions({
  activePlan,
  baselineCost,
  bestWaitedCost,
  bestWaitedMonths,
  funds,
}) {
  const { isExpert } = useViewMode();
  const tips = [];

  const equityLtcgGains = (activePlan?.funds ?? [])
    .filter((l) => l.taxType === 'LTCG_EQUITY')
    .reduce((sum, l) => sum + l.gainsRedeemed, 0);

  if (equityLtcgGains > LTCG_EXEMPTION_LIMIT) {
    const excess = equityLtcgGains - LTCG_EXEMPTION_LIMIT;
    const splitSavings = Math.round(Math.min(excess, LTCG_EXEMPTION_LIMIT) * EQUITY_LTCG_RATE);
    tips.push({
      key: 'cross_fy',
      tone: 'positive',
      icon: '🗓️',
      title: isExpert
        ? 'Split across FY 2025-26 and FY 2026-27'
        : 'Split your withdrawal across two financial years',
      body: isExpert ? (
        <>
          Total equity LTCG of <span className="font-semibold text-text-primary">{formatCurrency(equityLtcgGains)}</span>{' '}
          exceeds the ₹1,25,000 §112A exemption by {formatCurrency(excess)}. Redeem half before
          31 Mar 2026 and half after 1 Apr 2026 to claim two separate ₹1.25L exemptions —
          estimated saving <span className="font-semibold text-positive">{formatCurrency(splitSavings)}</span>.
        </>
      ) : (
        <>
          Withdraw part before March 31 and the rest after April 1 to use two years of the ₹1.25L
          tax-free LTCG limit. Estimated saving:{' '}
          <span className="font-semibold text-positive">{formatCurrency(splitSavings)}</span>.
        </>
      ),
    });
  }

  if (bestWaitedCost != null && baselineCost - bestWaitedCost > 0 && bestWaitedMonths > 0) {
    const waitSavings = baselineCost - bestWaitedCost;
    tips.push({
      key: 'wait',
      tone: 'positive',
      icon: '⏳',
      title: isExpert
        ? `Wait ${bestWaitedMonths} months — crosses a tax threshold`
        : `Waiting ${bestWaitedMonths} months saves you ${formatCurrency(waitSavings)}`,
      body: isExpert ? (
        <>
          At +{bestWaitedMonths} months one or more of your funds crosses an LTCG/STCG threshold or
          its exit-load window. Total cost drops from {formatCurrency(baselineCost)} to{' '}
          <span className="font-semibold text-text-primary">{formatCurrency(bestWaitedCost)}</span>{' '}
          — saving <span className="font-semibold text-positive">{formatCurrency(waitSavings)}</span>.
          Use the slider above to explore other windows.
        </>
      ) : (
        <>
          Your tax bill drops because a fund crosses into a more favourable tax category. Drag the
          slider above to see exactly which fund and when.
        </>
      ),
    });
  }

  const losingFunds = (funds ?? []).filter((f) => f.totalGains < 0);
  if (losingFunds.length > 0) {
    tips.push({
      key: 'tax_loss',
      tone: 'info',
      icon: '🛡️',
      title: isExpert
        ? 'Tax-loss harvesting opportunity'
        : 'Use your losing fund to reduce tax',
      body: isExpert
        ? 'Short-term capital losses can offset both STCG and LTCG; long-term losses can only offset LTCG. Consider booking the loss in the same FY to reduce taxable gains.'
        : `${losingFunds[0].name.split(' - ')[0]} is in the red — selling it can offset gains from other funds and lower your tax.`,
    });
  }

  tips.push({
    key: 'sip',
    tone: 'neutral',
    icon: 'ℹ️',
    title: isExpert ? 'FIFO applies per SIP installment' : 'Bought via SIP?',
    body: isExpert
      ? 'Per SEBI, each SIP installment carries its own holding-period clock and units are redeemed FIFO. This prototype assumes lump-sum investments — actual numbers for SIP investors may differ slightly.'
      : 'If you invested monthly, each instalment has its own tax clock — your real tax may be slightly different from the estimate above.',
  });

  if (tips.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-bold text-text-primary">Smart tips</h3>
        <span className="text-[11px] text-text-secondary">{tips.length} insights</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tips.map((t) => (
          <TipCard key={t.key} tone={t.tone} icon={t.icon} title={t.title} body={t.body} />
        ))}
      </div>
    </section>
  );
}
