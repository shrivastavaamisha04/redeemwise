import {
  calculateTax,
  classifyTax,
  effectiveTaxRate,
  gainsRatio,
  taxPerRupee,
  LTCG_EXEMPTION_LIMIT,
  TAX_TYPE_LABELS,
} from './taxCalculator.js';
import { calculateExitLoad, exitLoadRate } from './exitLoadCalculator.js';

export const STRATEGY_KEYS = {
  SAVE_TAX: 'save_tax',
  AVOID_PENALTIES: 'avoid_penalties',
  KEEP_WINNERS: 'keep_winners',
  SMART_BALANCE: 'smart_balance',
};

export const STRATEGY_LABELS = {
  [STRATEGY_KEYS.SAVE_TAX]: 'Save on Tax',
  [STRATEGY_KEYS.AVOID_PENALTIES]: 'Avoid Penalties',
  [STRATEGY_KEYS.KEEP_WINNERS]: 'Keep Winners',
  [STRATEGY_KEYS.SMART_BALANCE]: 'Smart Balance',
};

export const STRATEGY_SHORT = {
  [STRATEGY_KEYS.SAVE_TAX]: 'Tax Optimized',
  [STRATEGY_KEYS.AVOID_PENALTIES]: 'Penalty Free',
  [STRATEGY_KEYS.KEEP_WINNERS]: 'Preserve Winners',
  [STRATEGY_KEYS.SMART_BALANCE]: 'Recommended',
};

function isEquityLike(fund) {
  const t = classifyTax(fund);
  return t === 'LTCG_EQUITY';
}

function annualizedReturnDecimal(fund) {
  if (typeof fund.annualizedReturn === 'number') {
    return fund.annualizedReturn / 100;
  }
  if (!fund.amountInvested || fund.amountInvested <= 0) return 0;
  const yearsHeld = Math.max(fund.holdingMonths, 1) / 12;
  return Math.pow(fund.currentValue / fund.amountInvested, 1 / yearsHeld) - 1;
}

function executeOrderedRedemption(orderedFunds, goalAmount, userSlabRate, options = {}) {
  const { exemptionPriorityFundId = null } = options;
  let remaining = goalAmount;
  let exemption = LTCG_EXEMPTION_LIMIT;
  const lines = [];

  let order = orderedFunds.slice();

  if (exemptionPriorityFundId != null) {
    const priorityIdx = order.findIndex(
      (f) => f.id === exemptionPriorityFundId && isEquityLike(f)
    );
    if (priorityIdx > 0) {
      const [priority] = order.splice(priorityIdx, 1);
      order = [priority, ...order];
    }
  }

  for (const fund of order) {
    if (remaining <= 0) break;
    const availableValue = fund.currentValue;
    if (availableValue <= 0) continue;
    const amountToRedeem = Math.min(remaining, availableValue);

    const taxResult = calculateTax(fund, amountToRedeem, exemption, userSlabRate);
    const exitLoad = calculateExitLoad(fund, amountToRedeem);

    exemption = Math.max(0, exemption - taxResult.exemptionUsed);
    remaining -= amountToRedeem;

    lines.push({
      fund,
      amountToRedeem: Math.round(amountToRedeem),
      percentOfFund: amountToRedeem / availableValue,
      tax: taxResult.tax,
      taxType: taxResult.taxType,
      taxTypeLabel: TAX_TYPE_LABELS[taxResult.taxType] ?? taxResult.taxType,
      gainsRedeemed: Math.round(taxResult.gainsRedeemed),
      exemptionUsed: Math.round(taxResult.exemptionUsed),
      taxableGains: Math.round(taxResult.taxableGains),
      exitLoad,
    });
  }

  const totalTax = lines.reduce((s, l) => s + l.tax, 0);
  const totalExitLoad = lines.reduce((s, l) => s + l.exitLoad, 0);
  const totalCost = totalTax + totalExitLoad;
  const totalRedeemed = lines.reduce((s, l) => s + l.amountToRedeem, 0);
  const netAmountReceived = totalRedeemed - totalExitLoad;
  const goalMet = remaining <= 0.5;

  return {
    funds: lines,
    totalTax,
    totalExitLoad,
    totalCost,
    totalRedeemed,
    netAmountReceived,
    goalMet,
    shortfall: goalMet ? 0 : Math.round(remaining),
  };
}

function pickExemptionPriority(funds) {
  const equityCandidates = funds
    .filter(isEquityLike)
    .filter((f) => f.totalGains > 0);
  if (equityCandidates.length === 0) return null;
  equityCandidates.sort((a, b) => b.totalGains - a.totalGains);
  return equityCandidates[0].id;
}

function buildSimpleExplanation(strategyKey) {
  switch (strategyKey) {
    case STRATEGY_KEYS.SAVE_TAX:
      return 'This option minimises your tax bill by redeeming the most tax-efficient funds first.';
    case STRATEGY_KEYS.AVOID_PENALTIES:
      return 'This option avoids exit-load penalties by redeeming funds past their lock-in window first.';
    case STRATEGY_KEYS.KEEP_WINNERS:
      return 'This option redeems your weakest performers first, keeping your top-compounding funds intact.';
    case STRATEGY_KEYS.SMART_BALANCE:
      return 'This option balances tax, penalties, and lost future growth — the best overall trade-off.';
    default:
      return '';
  }
}

function buildExpertExplanation(strategyKey, plan) {
  if (!plan.funds.length) return 'No redemption needed.';
  const parts = plan.funds.map((line) => {
    const f = line.fund;
    switch (line.taxType) {
      case 'LTCG_EQUITY': {
        const exempted = line.exemptionUsed > 0
          ? `, ₹${line.exemptionUsed.toLocaleString('en-IN')} exempted under §112A`
          : '';
        return `${f.name.split(' - ')[0]}: LTCG ₹${line.gainsRedeemed.toLocaleString('en-IN')}${exempted}, taxable ₹${line.taxableGains.toLocaleString('en-IN')} @ 12.5% = ₹${line.tax.toLocaleString('en-IN')}`;
      }
      case 'STCG_EQUITY':
        return `${f.name.split(' - ')[0]}: STCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ 20% = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'DEBT_SLAB':
        return `${f.name.split(' - ')[0]}: debt gains ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ slab (§50AA) = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'LTCG_GOLD':
        return `${f.name.split(' - ')[0]}: gold MF LTCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ 12.5% (no exemption, §112) = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'STCG_GOLD':
        return `${f.name.split(' - ')[0]}: gold MF STCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ slab = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'LTCG_HYBRID':
        return `${f.name.split(' - ')[0]}: hybrid LTCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ 12.5% (no exemption, §112) = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'STCG_HYBRID':
        return `${f.name.split(' - ')[0]}: hybrid STCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ slab = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'LTCG_GOLD_ETF':
        return `${f.name.split(' - ')[0]}: gold ETF LTCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ 12.5% (no exemption, §112) = ₹${line.tax.toLocaleString('en-IN')}`;
      case 'STCG_GOLD_ETF':
        return `${f.name.split(' - ')[0]}: gold ETF STCG ₹${line.gainsRedeemed.toLocaleString('en-IN')} @ slab = ₹${line.tax.toLocaleString('en-IN')}`;
      default:
        return `${f.name.split(' - ')[0]}: ₹${line.tax.toLocaleString('en-IN')} tax`;
    }
  });
  const exitLoads = plan.funds.filter((l) => l.exitLoad > 0)
    .map((l) => `${l.fund.name.split(' - ')[0]} exit load ₹${l.exitLoad.toLocaleString('en-IN')}`);
  const exitLoadStr = exitLoads.length ? ` Exit loads: ${exitLoads.join('; ')}.` : ' No exit loads triggered.';
  return `${parts.join('. ')}.${exitLoadStr} Total cost ₹${plan.totalCost.toLocaleString('en-IN')}.`;
}

function strategySaveTax(funds, goalAmount, userSlabRate) {
  const priorityId = pickExemptionPriority(funds);
  const ordered = funds.slice().sort((a, b) => {
    const ta = taxPerRupee(a, userSlabRate);
    const tb = taxPerRupee(b, userSlabRate);
    if (ta !== tb) return ta - tb;
    return exitLoadRate(a) - exitLoadRate(b);
  });
  return executeOrderedRedemption(ordered, goalAmount, userSlabRate, {
    exemptionPriorityFundId: priorityId,
  });
}

function strategyAvoidPenalties(funds, goalAmount, userSlabRate) {
  const ordered = funds.slice().sort((a, b) => {
    const ea = exitLoadRate(a);
    const eb = exitLoadRate(b);
    if (ea !== eb) return ea - eb;
    return taxPerRupee(a, userSlabRate) - taxPerRupee(b, userSlabRate);
  });
  return executeOrderedRedemption(ordered, goalAmount, userSlabRate);
}

function strategyKeepWinners(funds, goalAmount, userSlabRate) {
  const ordered = funds.slice().sort((a, b) => {
    const ra = annualizedReturnDecimal(a);
    const rb = annualizedReturnDecimal(b);
    if (ra !== rb) return ra - rb;
    return taxPerRupee(a, userSlabRate) - taxPerRupee(b, userSlabRate);
  });
  return executeOrderedRedemption(ordered, goalAmount, userSlabRate);
}

function strategySmartBalance(funds, goalAmount, userSlabRate) {
  const scored = funds.map((f) => {
    const taxRate = effectiveTaxRate(f, userSlabRate);
    const gRatio = gainsRatio(f);
    const taxPerR = gRatio * taxRate;
    const exitR = exitLoadRate(f);
    const oppCostPerR = annualizedReturnDecimal(f);
    const score = taxPerR + exitR + 0.3 * oppCostPerR;
    return { fund: f, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return executeOrderedRedemption(scored.map((s) => s.fund), goalAmount, userSlabRate);
}

const STRATEGY_FNS = {
  [STRATEGY_KEYS.SAVE_TAX]: strategySaveTax,
  [STRATEGY_KEYS.AVOID_PENALTIES]: strategyAvoidPenalties,
  [STRATEGY_KEYS.KEEP_WINNERS]: strategyKeepWinners,
  [STRATEGY_KEYS.SMART_BALANCE]: strategySmartBalance,
};

export function runStrategy(strategyKey, funds, goalAmount, userSlabRate) {
  const fn = STRATEGY_FNS[strategyKey];
  if (!fn) throw new Error(`Unknown strategy: ${strategyKey}`);
  const plan = fn(funds, goalAmount, userSlabRate);
  return {
    key: strategyKey,
    label: STRATEGY_LABELS[strategyKey],
    shortLabel: STRATEGY_SHORT[strategyKey],
    isRecommended: strategyKey === STRATEGY_KEYS.SMART_BALANCE,
    explanation: {
      simple: buildSimpleExplanation(strategyKey),
      expert: buildExpertExplanation(strategyKey, plan),
    },
    ...plan,
  };
}

export function runAllStrategies(funds, goalAmount, userSlabRate) {
  return [
    runStrategy(STRATEGY_KEYS.SAVE_TAX, funds, goalAmount, userSlabRate),
    runStrategy(STRATEGY_KEYS.AVOID_PENALTIES, funds, goalAmount, userSlabRate),
    runStrategy(STRATEGY_KEYS.KEEP_WINNERS, funds, goalAmount, userSlabRate),
    runStrategy(STRATEGY_KEYS.SMART_BALANCE, funds, goalAmount, userSlabRate),
  ];
}

export function compareStrategies(plans) {
  if (!plans.length) return { bestKey: null, worstKey: null, savings: 0 };
  const sorted = plans.slice().sort((a, b) => a.totalCost - b.totalCost);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return {
    bestKey: best.key,
    bestLabel: best.label,
    worstKey: worst.key,
    worstLabel: worst.label,
    savings: Math.max(0, worst.totalCost - best.totalCost),
  };
}
