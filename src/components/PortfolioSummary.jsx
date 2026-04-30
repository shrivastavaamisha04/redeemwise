import DonutChart from './DonutChart.jsx';
import Badge from './Badge.jsx';
import { formatCurrency, formatCurrencyShort, formatPercent } from '../utils/formatCurrency.js';

const TYPE_COLORS = {
  equity: '#00D09C',
  debt: '#5367F5',
  gold: '#EF9F27',
  hybrid: '#F5A623',
};

const TYPE_LABELS = {
  equity: 'Equity',
  debt: 'Debt',
  gold: 'Gold',
  hybrid: 'Hybrid',
};

function buildSegments(funds) {
  const totals = funds.reduce((acc, fund) => {
    let bucket;
    if (fund.type === 'equity' || fund.type === 'elss') bucket = 'equity';
    else if (fund.type === 'gold_mf' || fund.type === 'gold_etf' || fund.type === 'gold') bucket = 'gold';
    else bucket = fund.type;
    acc[bucket] = (acc[bucket] || 0) + fund.currentValue;
    return acc;
  }, {});
  const order = ['equity', 'debt', 'gold', 'hybrid'];
  return order
    .filter((key) => totals[key])
    .map((key) => ({
      label: TYPE_LABELS[key] ?? key,
      value: totals[key],
      color: TYPE_COLORS[key],
    }));
}

export default function PortfolioSummary({ funds, profile }) {
  const totalInvested = funds.reduce((s, f) => s + f.amountInvested, 0);
  const currentValue = funds.reduce((s, f) => s + f.currentValue, 0);
  const totalGains = currentValue - totalInvested;
  const gainPct = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;
  const segments = buildSegments(funds);

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Portfolio value
          </div>
          <div className="mt-1 text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            {formatCurrency(currentValue)}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant={totalGains >= 0 ? 'positive' : 'negative'}>
              {totalGains >= 0 ? '▲' : '▼'} {formatCurrency(totalGains)}
            </Badge>
            <Badge variant={totalGains >= 0 ? 'positive' : 'negative'}>
              {totalGains >= 0 ? '+' : ''}
              {formatPercent(gainPct)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-card bg-bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Invested
          </div>
          <div className="mt-1 text-lg font-bold text-text-primary">
            {formatCurrency(totalInvested)}
          </div>
        </div>
        <div className="rounded-card bg-bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Total gains
          </div>
          <div className="mt-1 text-lg font-bold text-positive">
            {formatCurrency(totalGains)}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-bg-surface-dark/60">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
          Asset allocation
        </div>
        <DonutChart
          segments={segments}
          centerLabel="Total"
          centerValue={formatCurrencyShort(currentValue)}
        />
      </div>

      {profile?.name && (
        <p className="mt-5 text-sm text-text-secondary">
          Hi <span className="font-semibold text-text-primary">{profile.name}</span>, here's
          your portfolio across {funds.length} mutual funds.
        </p>
      )}
    </section>
  );
}
