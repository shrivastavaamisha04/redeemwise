export const LTCG_EXEMPTION_LIMIT = 125000;
export const EQUITY_LTCG_RATE = 0.125;
export const EQUITY_STCG_RATE = 0.20;
export const GOLD_LTCG_RATE = 0.125;
export const EQUITY_LTCG_HOLDING_MONTHS = 12;
export const GOLD_LTCG_HOLDING_MONTHS = 24;
export const HYBRID_LTCG_HOLDING_MONTHS = 24;
export const GOLD_ETF_LTCG_HOLDING_MONTHS = 12;

export function getGainsInRedemption(fund, redemptionAmount) {
  if (!fund.currentValue || fund.currentValue <= 0) return 0;
  const ratio = redemptionAmount / fund.currentValue;
  return Math.max(0, fund.totalGains * ratio);
}

export function classifyTax(fund) {
  if (fund.type === 'equity') {
    return fund.holdingMonths > EQUITY_LTCG_HOLDING_MONTHS ? 'LTCG_EQUITY' : 'STCG_EQUITY';
  }
  if (fund.type === 'elss') {
    return 'LTCG_EQUITY';
  }
  if (fund.type === 'debt') {
    return 'DEBT_SLAB';
  }
  if (fund.type === 'hybrid') {
    return fund.holdingMonths > HYBRID_LTCG_HOLDING_MONTHS ? 'LTCG_HYBRID' : 'STCG_HYBRID';
  }
  if (fund.type === 'gold_etf') {
    return fund.holdingMonths > GOLD_ETF_LTCG_HOLDING_MONTHS ? 'LTCG_GOLD_ETF' : 'STCG_GOLD_ETF';
  }
  // gold_mf and legacy 'gold' both use 24-month threshold
  if (fund.type === 'gold_mf' || fund.type === 'gold') {
    return fund.holdingMonths > GOLD_LTCG_HOLDING_MONTHS ? 'LTCG_GOLD' : 'STCG_GOLD';
  }
  return 'UNKNOWN';
}

export const TAX_TYPE_LABELS = {
  LTCG_EQUITY: 'LTCG (Equity, 12.5%)',
  STCG_EQUITY: 'STCG (Equity, 20%)',
  DEBT_SLAB: 'Debt (slab rate, §50AA)',
  LTCG_GOLD: 'LTCG (Gold MF, 12.5%)',
  STCG_GOLD: 'STCG (Gold MF, slab)',
  LTCG_HYBRID: 'LTCG (Hybrid, 12.5%)',
  STCG_HYBRID: 'STCG (Hybrid, slab)',
  LTCG_GOLD_ETF: 'LTCG (Gold ETF, 12.5%)',
  STCG_GOLD_ETF: 'STCG (Gold ETF, slab)',
};

export function calculateTax(fund, redemptionAmount, remainingExemption, userSlabRate) {
  const gains = getGainsInRedemption(fund, redemptionAmount);
  const taxType = classifyTax(fund);

  if (gains <= 0) {
    return {
      tax: 0,
      taxType,
      gainsRedeemed: 0,
      exemptionUsed: 0,
      taxableGains: 0,
    };
  }

  switch (taxType) {
    case 'LTCG_EQUITY': {
      const exemptionUsed = Math.min(remainingExemption, gains);
      const taxableGains = Math.max(0, gains - exemptionUsed);
      return {
        tax: Math.round(taxableGains * EQUITY_LTCG_RATE),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed,
        taxableGains,
      };
    }
    case 'STCG_EQUITY': {
      return {
        tax: Math.round(gains * EQUITY_STCG_RATE),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    case 'DEBT_SLAB': {
      return {
        tax: Math.round(gains * userSlabRate),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    case 'LTCG_GOLD': {
      return {
        tax: Math.round(gains * GOLD_LTCG_RATE),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    case 'STCG_GOLD': {
      return {
        tax: Math.round(gains * userSlabRate),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    case 'LTCG_HYBRID':
    case 'LTCG_GOLD_ETF': {
      return {
        tax: Math.round(gains * GOLD_LTCG_RATE),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    case 'STCG_HYBRID':
    case 'STCG_GOLD_ETF': {
      return {
        tax: Math.round(gains * userSlabRate),
        taxType,
        gainsRedeemed: gains,
        exemptionUsed: 0,
        taxableGains: gains,
      };
    }
    default:
      return { tax: 0, taxType, gainsRedeemed: gains, exemptionUsed: 0, taxableGains: 0 };
  }
}

export function effectiveTaxRate(fund, userSlabRate) {
  const taxType = classifyTax(fund);
  switch (taxType) {
    case 'LTCG_EQUITY': return EQUITY_LTCG_RATE;
    case 'STCG_EQUITY': return EQUITY_STCG_RATE;
    case 'DEBT_SLAB': return userSlabRate;
    case 'LTCG_GOLD':
    case 'LTCG_HYBRID':
    case 'LTCG_GOLD_ETF': return GOLD_LTCG_RATE;
    case 'STCG_GOLD':
    case 'STCG_HYBRID':
    case 'STCG_GOLD_ETF': return userSlabRate;
    default: return 0;
  }
}

export function gainsRatio(fund) {
  if (!fund.currentValue || fund.currentValue <= 0) return 0;
  return fund.totalGains / fund.currentValue;
}

export function taxPerRupee(fund, userSlabRate) {
  return gainsRatio(fund) * effectiveTaxRate(fund, userSlabRate);
}
