const indianNumberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const indianDecimalFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount, { decimals = false } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '₹0';
  }
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = decimals
    ? indianDecimalFormatter.format(abs)
    : indianNumberFormatter.format(Math.round(abs));
  return `${negative ? '-' : ''}₹${formatted}`;
}

export function formatCurrencyShort(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '₹0';
  }
  const negative = amount < 0;
  const abs = Math.abs(amount);
  let value;
  let suffix = '';
  if (abs >= 10000000) {
    value = abs / 10000000;
    suffix = ' Cr';
  } else if (abs >= 100000) {
    value = abs / 100000;
    suffix = ' L';
  } else if (abs >= 1000) {
    value = abs / 1000;
    suffix = 'K';
  } else {
    value = abs;
  }
  const trimmed = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '');
  return `${negative ? '-' : ''}₹${trimmed}${suffix}`;
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatHoldingPeriod(months) {
  if (!months || months <= 0) return '0 months';
  const years = months / 12;
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  if (years === Math.floor(years)) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years.toFixed(1)} years`;
}
