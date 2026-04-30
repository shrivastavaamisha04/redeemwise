import { useState } from 'react';
import Badge from './Badge.jsx';
import {
  formatCurrency,
  formatPercent,
  formatHoldingPeriod,
} from '../utils/formatCurrency.js';
import { useViewMode } from '../context/ViewModeContext.jsx';

function taxLine(fund) {
  const { type, holdingMonths } = fund;
  if (type === 'equity' || type === 'elss') {
    return holdingMonths > 12 ? 'LTCG 12.5% (Sec 112A)' : 'STCG 20% flat';
  }
  if (type === 'hybrid') {
    return holdingMonths > 24 ? 'LTCG 12.5% (Sec 112)' : 'STCG · slab rate';
  }
  if (type === 'debt') return 'Always slab rate · Section 50AA';
  if (type === 'gold_etf') {
    return holdingMonths > 12 ? 'LTCG 12.5%' : 'STCG · slab rate';
  }
  if (type === 'gold_mf' || type === 'gold') {
    return holdingMonths > 24 ? 'LTCG 12.5%' : 'STCG · slab rate';
  }
  return null;
}

const TYPE_LABEL = {
  equity: 'Equity',
  elss: 'ELSS',
  debt: 'Debt',
  gold: 'Gold MF',
  gold_mf: 'Gold MF',
  gold_etf: 'Gold ETF',
  hybrid: 'Hybrid',
};

const TYPE_ACCENT = {
  equity:   { border: '#00D09C', tint: 'rgba(0,208,156,0.04)' },
  elss:     { border: '#00D09C', tint: 'rgba(0,208,156,0.04)' },
  debt:     { border: '#5367F5', tint: 'rgba(83,103,245,0.04)' },
  hybrid:   { border: '#F5A623', tint: 'rgba(239,159,39,0.04)' },
  gold_etf: { border: '#EF9F27', tint: 'rgba(239,159,39,0.04)' },
  gold_mf:  { border: '#EF9F27', tint: 'rgba(239,159,39,0.04)' },
  gold:     { border: '#EF9F27', tint: 'rgba(239,159,39,0.04)' },
};

function exitLoadStatus(fund) {
  if (fund.exitLoadPercent === 0) {
    return { status: 'none', variant: 'positive' };
  }
  if (fund.holdingMonths >= fund.exitLoadPeriodMonths) {
    return { status: 'cleared', variant: 'positive' };
  }
  const period =
    fund.exitLoadPeriodMonths >= 12
      ? `${Math.round(fund.exitLoadPeriodMonths / 12)} yr`
      : `${fund.exitLoadPeriodMonths} mo`;
  return {
    status: 'active',
    variant: 'warning',
    activeLabel: `${fund.exitLoadPercent}% < ${period}`,
  };
}

function exitLoadTooltip(fund) {
  if (fund.exitLoadPercent === 0) {
    return fund.type === 'elss'
      ? 'This fund has no withdrawal penalty. 3-year lock-in is complete.'
      : 'This fund has no withdrawal penalty.';
  }
  if (fund.holdingMonths >= fund.exitLoadPeriodMonths) {
    return "You're past the early withdrawal window. No penalty applies.";
  }
  const penalty = Math.round(1000000 * fund.exitLoadPercent / 100);
  return `Early withdrawal penalty of ${fund.exitLoadPercent}% applies. Equivalent to ₹${penalty.toLocaleString('en-IN')} on a ₹10L redemption.`;
}

export default function FundCard({ fund, onEdit, onDelete }) {
  const { isExpert } = useViewMode();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const gainPct = fund.amountInvested > 0
    ? (fund.totalGains / fund.amountInvested) * 100 : 0;
  const positive = fund.totalGains >= 0;
  const exitLoad = exitLoadStatus(fund);
  const exitLoadLabel = !isExpert
    ? (exitLoad.status === 'active'
        ? `Early withdrawal penalty ${fund.exitLoadPercent}%`
        : 'No early withdrawal penalty')
    : (exitLoad.status === 'none'
        ? 'No exit load'
        : exitLoad.status === 'cleared'
        ? 'Exit load cleared'
        : exitLoad.activeLabel);
  const tooltip = exitLoadTooltip(fund);
  const typeLabel = TYPE_LABEL[fund.type] ?? fund.type;
  const tl = isExpert ? taxLine(fund) : null;
  const accent = TYPE_ACCENT[fund.type] ?? TYPE_ACCENT.equity;

  return (
    <article
      className="relative"
      style={{
        borderLeft: `3px solid ${accent.border}`,
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        background: `linear-gradient(to bottom, ${accent.tint}, transparent), #FAFAF9`,
        padding: '12px 14px',
      }}
    >
      {/* Delete confirm overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 rounded-xl bg-bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 animate-fade-in">
          <p className="text-sm font-semibold text-text-primary text-center">Remove this fund?</p>
          <p className="text-xs text-text-secondary text-center -mt-2 max-w-[14rem] line-clamp-2">{fund.name}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="btn-secondary px-4 py-2 text-xs"
            >
              No, keep it
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); onDelete?.(fund); }}
              className="px-4 py-2 text-xs font-semibold rounded-card bg-negative text-white hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Yes, remove
            </button>
          </div>
        </div>
      )}

      {/* Row 1: name + exit load badge + action buttons */}
      <div className="flex items-start gap-2">
        <h3
          className="flex-1 min-w-0 text-[14px] font-medium text-text-primary truncate leading-snug"
          title={fund.name}
        >
          {fund.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative group">
            <Badge variant={exitLoad.variant} className="px-2 py-0.5 text-[11px]">
              {exitLoadLabel}
            </Badge>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-[#1C1C1C] text-white text-[11px] leading-relaxed px-3 py-[6px] rounded-[8px] text-center" style={{ minWidth: '200px', whiteSpace: 'normal' }}>
                {tooltip}
              </div>
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1C1C1C' }}
              />
            </div>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(fund)}
              aria-label="Edit fund"
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-dark/60 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete fund"
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:text-negative hover:bg-negative/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: type + category badges (left) | holding period (right) */}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <Badge variant={fund.type} className="shrink-0 px-2 py-0.5 text-[11px]">{typeLabel}</Badge>
          {fund.category && (
            <Badge variant="neutral" className="shrink-0 px-2 py-0.5 text-[11px] truncate max-w-[120px]">
              {fund.category}
            </Badge>
          )}
        </div>
        <span className="text-[12px] text-text-secondary shrink-0 tabular-nums">
          {formatHoldingPeriod(fund.holdingMonths)}
        </span>
      </div>

      {/* Row 3: gains (left) | current value (right) */}
      <div className="flex items-baseline justify-between gap-2 mt-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[16px] font-bold tabular-nums ${positive ? 'text-positive' : 'text-negative'}`}>
            {positive ? '+' : ''}{formatCurrency(fund.totalGains)}
          </span>
          <span className={`text-[12px] font-semibold tabular-nums ${positive ? 'text-positive' : 'text-negative'}`}>
            ({positive ? '+' : ''}{formatPercent(gainPct)})
          </span>
        </div>
        <span className="text-[15px] font-bold text-text-primary tabular-nums shrink-0">
          {formatCurrency(fund.currentValue)}
        </span>
      </div>

      {/* Expert row: annualised return + tax classification */}
      {isExpert && (
        <div
          className="flex items-center justify-between gap-2 mt-2 pt-2"
          style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}
        >
          <span className="text-[12px] text-text-secondary tabular-nums">
            {formatPercent(fund.annualizedReturn)} p.a.
          </span>
          {tl && (
            <span className="text-[12px] text-text-secondary text-right">{tl}</span>
          )}
        </div>
      )}
    </article>
  );
}
