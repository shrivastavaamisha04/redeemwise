import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { monthsBetween } from '../hooks/usePortfolio.js';
import {
  searchFunds,
  getFundNAV,
  detectFundType,
  defaultExitLoad,
} from '../services/mfapi.js';

const TYPE_OPTIONS = [
  { value: 'equity', label: 'Equity' },
  { value: 'elss', label: 'ELSS' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'debt', label: 'Debt' },
  { value: 'gold_etf', label: 'Gold ETF' },
  { value: 'gold_mf', label: 'Gold MF' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(initial) {
  if (initial) {
    return {
      name: initial.name ?? '',
      schemeCode: initial.schemeCode ?? '',
      type: initial.type === 'gold' ? 'gold_mf' : (initial.type ?? 'equity'),
      category: initial.category ?? '',
      amountInvested: initial.amountInvested ?? '',
      currentValue: initial.currentValue ?? '',
      investmentDate: initial.investmentDate ?? '',
      exitLoadPercent:
        initial.exitLoadPercent !== undefined ? initial.exitLoadPercent : 1,
      exitLoadPeriodMonths:
        initial.exitLoadPeriodMonths !== undefined
          ? initial.exitLoadPeriodMonths
          : 12,
      valueMode: 'value',
      units: '',
      currentNAV: null,
      navDate: null,
    };
  }
  return {
    name: '',
    schemeCode: '',
    type: 'equity',
    category: '',
    amountInvested: '',
    currentValue: '',
    investmentDate: '',
    exitLoadPercent: 1,
    exitLoadPeriodMonths: 12,
    valueMode: 'value',
    units: '',
    currentNAV: null,
    navDate: null,
  };
}

function formatDateShort(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AddFundForm({ open, onClose, onSubmit, initial, mode = 'add' }) {
  const [state, setState] = useState(() => defaultState(initial));
  const [errors, setErrors] = useState({});

  // Search state
  const [searchQuery, setSearchQuery] = useState(initial?.name ?? '');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const searchTimer = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (open) {
      setState(defaultState(initial));
      setSearchQuery(initial?.name ?? '');
      setSearchResults([]);
      setShowResults(false);
      setErrors({});
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

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    if (searchQuery.trim() === state.name && state.schemeCode) {
      // user has selected this fund already; don't keep searching
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchFunds(searchQuery);
      setSearchResults(results.slice(0, 12));
      setSearching(false);
      setShowResults(true);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, state.name, state.schemeCode]);

  // Click-outside to close results
  useEffect(() => {
    if (!showResults) return;
    const onClick = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [showResults]);

  const holdingMonths = useMemo(() => {
    if (!state.investmentDate) return 0;
    return monthsBetween(state.investmentDate);
  }, [state.investmentDate]);

  const computedCurrentValue = useMemo(() => {
    if (state.valueMode !== 'units') return Number(state.currentValue) || 0;
    const units = Number(state.units) || 0;
    const nav = Number(state.currentNAV) || 0;
    if (units > 0 && nav > 0) return units * nav;
    return Number(state.currentValue) || 0;
  }, [state.valueMode, state.units, state.currentNAV, state.currentValue]);

  const selectFund = async (result) => {
    const detectedType = detectFundType(result.schemeName);
    const exit = defaultExitLoad(detectedType);
    setState((s) => ({
      ...s,
      name: result.schemeName,
      schemeCode: result.schemeCode,
      type: detectedType,
      exitLoadPercent: exit.exitLoadPercent,
      exitLoadPeriodMonths: exit.exitLoadPeriodMonths,
      currentNAV: null,
      navDate: null,
    }));
    setSearchQuery(result.schemeName);
    setShowResults(false);

    setNavLoading(true);
    const nav = await getFundNAV(result.schemeCode);
    setNavLoading(false);
    if (nav && nav.currentNAV) {
      setState((s) => ({
        ...s,
        currentNAV: nav.currentNAV,
        navDate: nav.navDate,
      }));
    }
  };

  const setType = (type) => {
    setState((s) => {
      // Only override exit load if user hasn't customized
      const currentDefault = defaultExitLoad(s.type);
      const isUsingDefault =
        Number(s.exitLoadPercent) === currentDefault.exitLoadPercent &&
        Number(s.exitLoadPeriodMonths) === currentDefault.exitLoadPeriodMonths;
      const next = defaultExitLoad(type);
      return {
        ...s,
        type,
        ...(isUsingDefault
          ? {
              exitLoadPercent: next.exitLoadPercent,
              exitLoadPeriodMonths: next.exitLoadPeriodMonths,
            }
          : {}),
      };
    });
  };

  const validate = () => {
    const e = {};
    if (!state.name || !state.name.trim()) e.name = 'Fund name is required';
    const inv = Number(state.amountInvested);
    if (!inv || inv <= 0) e.amountInvested = 'Enter a positive amount';
    const cv = computedCurrentValue;
    if (!cv || cv <= 0) e.currentValue = 'Enter a positive current value';
    if (!state.investmentDate) {
      e.investmentDate = 'Investment date is required';
    } else {
      const d = new Date(state.investmentDate);
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        e.investmentDate = 'Date must be in the past';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const fund = {
      name: state.name.trim(),
      schemeCode: state.schemeCode || null,
      type: state.type,
      category: state.category?.trim() || '',
      amountInvested: Number(state.amountInvested),
      currentValue: computedCurrentValue,
      investmentDate: state.investmentDate,
      exitLoadPercent: Number(state.exitLoadPercent) || 0,
      exitLoadPeriodMonths: Number(state.exitLoadPeriodMonths) || 0,
    };
    onSubmit(fund);
  };

  if (!open) return null;

  const investedNum = Number(state.amountInvested) || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-fund-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-text-primary/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg bg-bg-white rounded-t-3xl sm:rounded-card shadow-card-hover max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-white px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-bg-surface z-10">
          <div>
            <h2 id="add-fund-title" className="text-lg font-bold text-text-primary">
              {mode === 'edit' ? 'Edit fund' : 'Add a mutual fund'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Search by name or enter details manually.
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
          {/* Fund search */}
          <div className="relative" ref={resultsRef}>
            <label htmlFor="fund-search" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Fund name
            </label>
            <div className="flex items-center gap-2 bg-bg-surface rounded-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary-green">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-text-secondary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                id="fund-search"
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setState((s) => ({ ...s, name: e.target.value, schemeCode: '' }));
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
                placeholder="Search for a mutual fund..."
                className="flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-secondary/60"
              />
              {searching && (
                <span className="inline-block w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {errors.name && (
              <p className="text-[11px] text-negative mt-1">{errors.name}</p>
            )}
            {showResults && searchQuery.trim().length >= 3 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-bg-white border border-bg-surface-dark rounded-card shadow-card-hover max-h-72 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((r) => (
                    <button
                      key={r.schemeCode}
                      type="button"
                      onClick={() => selectFund(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-bg-surface text-sm text-text-primary border-b border-bg-surface last:border-b-0"
                    >
                      {r.schemeName}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-text-secondary">
                    {searching ? 'Searching...' : 'No matches. You can enter the fund name manually above.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fund type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Fund type
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    state.type === opt.value
                      ? 'bg-primary-green text-white'
                      : 'bg-bg-surface text-text-primary hover:bg-bg-surface-dark',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="fund-category" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Category <span className="text-text-secondary/70 normal-case font-normal">(optional)</span>
            </label>
            <input
              id="fund-category"
              type="text"
              value={state.category}
              onChange={(e) => setState((s) => ({ ...s, category: e.target.value }))}
              placeholder="e.g., Large Cap, Flexi Cap"
              className="w-full bg-bg-surface rounded-card px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary-green placeholder:text-text-secondary/60"
            />
          </div>

          {/* Amount invested */}
          <div>
            <label htmlFor="amount-invested" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Amount invested
            </label>
            <div className="flex items-center gap-2 bg-bg-surface rounded-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary-green">
              <span className="text-lg font-bold text-text-secondary">₹</span>
              <input
                id="amount-invested"
                type="number"
                inputMode="numeric"
                min="0"
                step="100"
                value={state.amountInvested}
                onChange={(e) => setState((s) => ({ ...s, amountInvested: e.target.value }))}
                placeholder="5,00,000"
                className="flex-1 bg-transparent text-lg font-bold text-text-primary outline-none placeholder:text-text-secondary/60 tabular-nums"
              />
            </div>
            {investedNum > 0 && (
              <div className="text-xs text-text-secondary mt-1.5 tabular-nums">
                {formatCurrency(investedNum)}
              </div>
            )}
            {errors.amountInvested && (
              <p className="text-[11px] text-negative mt-1">{errors.amountInvested}</p>
            )}
          </div>

          {/* Current value with mode toggle */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Current value
              </label>
              <div className="inline-flex items-center bg-bg-surface rounded-full p-0.5 gap-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, valueMode: 'value' }))}
                  className={[
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    state.valueMode === 'value'
                      ? 'bg-white text-text-primary shadow-card'
                      : 'text-text-secondary',
                  ].join(' ')}
                >
                  Enter value
                </button>
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, valueMode: 'units' }))}
                  className={[
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    state.valueMode === 'units'
                      ? 'bg-white text-text-primary shadow-card'
                      : 'text-text-secondary',
                  ].join(' ')}
                >
                  From units
                </button>
              </div>
            </div>

            {state.valueMode === 'value' ? (
              <div className="flex items-center gap-2 bg-bg-surface rounded-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary-green">
                <span className="text-lg font-bold text-text-secondary">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="100"
                  value={state.currentValue}
                  onChange={(e) => setState((s) => ({ ...s, currentValue: e.target.value }))}
                  placeholder="7,20,000"
                  className="flex-1 bg-transparent text-lg font-bold text-text-primary outline-none placeholder:text-text-secondary/60 tabular-nums"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-bg-surface rounded-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary-green">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    value={state.units}
                    onChange={(e) => setState((s) => ({ ...s, units: e.target.value }))}
                    placeholder="Units held (e.g., 1234.567)"
                    className="flex-1 bg-transparent text-base font-semibold text-text-primary outline-none placeholder:text-text-secondary/60 tabular-nums"
                  />
                </div>
                {navLoading && (
                  <p className="text-[11px] text-text-secondary flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-primary-green border-t-transparent rounded-full animate-spin" />
                    Fetching latest NAV...
                  </p>
                )}
                {state.currentNAV ? (
                  <p className="text-[11px] text-text-secondary">
                    Current NAV: <span className="font-semibold text-text-primary tabular-nums">₹{state.currentNAV.toFixed(4)}</span>
                    {state.navDate && ` (as of ${formatDateShort(state.navDate)})`}
                  </p>
                ) : !navLoading && state.schemeCode ? (
                  <p className="text-[11px] text-warning">
                    Couldn't fetch NAV. Switch to "Enter value" or set a manual current value.
                  </p>
                ) : !state.schemeCode ? (
                  <p className="text-[11px] text-text-secondary">
                    Pick a fund from search above to auto-fetch the NAV, or switch to "Enter value".
                  </p>
                ) : null}
                {computedCurrentValue > 0 && (
                  <div className="rounded-card bg-primary-green/10 px-3 py-2 text-sm text-text-primary tabular-nums">
                    Current value: <span className="font-bold">{formatCurrency(computedCurrentValue)}</span>
                  </div>
                )}
              </div>
            )}
            {errors.currentValue && (
              <p className="text-[11px] text-negative mt-1">{errors.currentValue}</p>
            )}
          </div>

          {/* Investment date */}
          <div>
            <label htmlFor="investment-date" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Investment date
            </label>
            <input
              id="investment-date"
              type="date"
              max={todayISO()}
              value={state.investmentDate}
              onChange={(e) => setState((s) => ({ ...s, investmentDate: e.target.value }))}
              className="w-full bg-bg-surface rounded-card px-4 py-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-primary-green"
            />
            {state.investmentDate && holdingMonths > 0 && (
              <p className="text-[11px] text-text-secondary mt-1.5">
                Holding: <span className="font-semibold text-text-primary">{holdingMonths} months</span>
                {holdingMonths >= 12 && ` (${(holdingMonths / 12).toFixed(1)} years)`}
              </p>
            )}
            {errors.investmentDate && (
              <p className="text-[11px] text-negative mt-1">{errors.investmentDate}</p>
            )}
          </div>

          {/* Exit load */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Exit load <span className="text-text-secondary/70 normal-case font-normal">(auto-filled)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-bg-surface rounded-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary-green">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={state.exitLoadPercent}
                  onChange={(e) => setState((s) => ({ ...s, exitLoadPercent: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none w-full tabular-nums"
                />
                <span className="text-xs text-text-secondary">%</span>
              </div>
              <div className="flex items-center gap-2 bg-bg-surface rounded-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary-green">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={state.exitLoadPeriodMonths}
                  onChange={(e) => setState((s) => ({ ...s, exitLoadPeriodMonths: e.target.value }))}
                  className="flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none w-full tabular-nums"
                />
                <span className="text-xs text-text-secondary">months</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3 text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-[1.5] py-3 text-sm">
              {mode === 'edit' ? 'Save changes' : 'Add Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
