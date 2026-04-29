import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'redeemwise.playground.portfolio.v1';
export const MAX_FUNDS = 15;

export function monthsBetween(fromDate, toDate = new Date()) {
  if (!fromDate) return 0;
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (Number.isNaN(from.getTime())) return 0;
  const years = toDate.getFullYear() - from.getFullYear();
  const months = toDate.getMonth() - from.getMonth();
  let total = years * 12 + months;
  if (toDate.getDate() < from.getDate()) total -= 1;
  return Math.max(0, total);
}

export function annualizedReturnPercent(invested, current, holdingMonths) {
  if (!invested || invested <= 0 || !holdingMonths || holdingMonths <= 0) return 0;
  const years = holdingMonths / 12;
  const r = Math.pow(current / invested, 1 / Math.max(years, 1 / 12)) - 1;
  return r * 100;
}

function deriveFund(input) {
  const amountInvested = Number(input.amountInvested) || 0;
  const currentValue = Number(input.currentValue) || 0;
  const totalGains = currentValue - amountInvested;
  const holdingMonths = monthsBetween(input.investmentDate);
  const annualizedReturn = annualizedReturnPercent(
    amountInvested,
    currentValue,
    holdingMonths
  );
  return {
    ...input,
    amountInvested,
    currentValue,
    totalGains,
    holdingMonths,
    annualizedReturn,
  };
}

function loadFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => deriveFund(f));
  } catch {
    return [];
  }
}

function saveToStorage(funds) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(funds));
  } catch {
    /* quota or disabled storage — silently ignore */
  }
}

export function usePortfolio() {
  const [funds, setFunds] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(funds);
  }, [funds]);

  const addFund = useCallback((fundInput) => {
    setFunds((prev) => {
      if (prev.length >= MAX_FUNDS) return prev;
      const id =
        (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
        `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return [...prev, deriveFund({ ...fundInput, id })];
    });
  }, []);

  const updateFund = useCallback((id, fundInput) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? deriveFund({ ...f, ...fundInput, id }) : f))
    );
  }, []);

  const removeFund = useCallback((id) => {
    setFunds((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFunds([]);
  }, []);

  return { funds, addFund, updateFund, removeFund, clearAll };
}
