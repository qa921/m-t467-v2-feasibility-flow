/**
 * The single shared display convention. Every screen and report must source
 * labels, period and rounding from here; currency and unit come from the
 * project record; the source timestamp (sourceAsOf) travels with every
 * evaluation payload.
 */
export const DISPLAY_CONVENTIONS = {
  periodUnit: 'month',
  // Matches fixtures/projects.json rounding block:
  // money/NPV -> nearest whole currency unit; rates/IRR -> 2 decimal places.
  rounding: { moneyDecimals: 0, rateDecimals: 2 },
  labels: {
    revenue: 'Revenue',
    landCost: 'Land cost',
    buildCost: 'Build cost',
    softCost: 'Soft cost',
    financingCost: 'Financing cost',
    totalCost: 'Total cost',
    netCashflow: 'Net cashflow',
    marginPct: 'Margin',
    npv: 'NPV',
    irrAnnualPct: 'IRR (annualised)',
  },
} as const;

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: DISPLAY_CONVENTIONS.rounding.moneyDecimals,
  }).format(value);
}

export function formatPct(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(DISPLAY_CONVENTIONS.rounding.rateDecimals)}%`;
}
