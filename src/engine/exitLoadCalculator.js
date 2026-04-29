export function calculateExitLoad(fund, redemptionAmount) {
  if (!fund.exitLoadPercent || fund.exitLoadPercent <= 0) return 0;
  if (!fund.exitLoadPeriodMonths || fund.exitLoadPeriodMonths <= 0) return 0;
  if (fund.holdingMonths >= fund.exitLoadPeriodMonths) return 0;
  return Math.round(redemptionAmount * (fund.exitLoadPercent / 100));
}

export function exitLoadRate(fund) {
  if (!fund.exitLoadPercent || fund.exitLoadPercent <= 0) return 0;
  if (!fund.exitLoadPeriodMonths || fund.exitLoadPeriodMonths <= 0) return 0;
  if (fund.holdingMonths >= fund.exitLoadPeriodMonths) return 0;
  return fund.exitLoadPercent / 100;
}
