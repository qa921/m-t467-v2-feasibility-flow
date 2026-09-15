/**
 * Pure financial metric helpers. No I/O, no dependencies.
 * Rate conventions are PROVISIONAL (see assumptions.ts).
 */

/** PROVISIONAL (RATE-ANNUAL-TO-MONTHLY): annual pct -> effective monthly rate. */
export function annualPctToMonthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

/** NPV of a net cashflow series, periods 1..n discounted at the given per-period rate. */
export function npv(nets: number[], periodRate: number): number {
  return nets.reduce((acc, net, i) => acc + net / Math.pow(1 + periodRate, i + 1), 0);
}

/**
 * PROVISIONAL (IRR-MONTHLY-CASHFLOW): solves the per-period IRR of the net
 * series by bisection. Returns null when there is no sign change (no IRR).
 */
export function irrMonthly(nets: number[], maxIterations = 200): number | null {
  const hasPos = nets.some((v) => v > 0);
  const hasNeg = nets.some((v) => v < 0);
  if (!hasPos || !hasNeg) return null;

  const f = (r: number) => npv(nets, r);
  let lo = -0.99;
  let hi = 1.0;
  let fLo = f(lo);
  let fHi = f(hi);
  while (fLo * fHi > 0 && hi < 100) {
    hi *= 2;
    fHi = f(hi);
  }
  if (fLo * fHi > 0) return null;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    if (Math.abs(fMid) < 1e-10) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** PROVISIONAL (IRR-MONTHLY-CASHFLOW): annualises a monthly rate. */
export function annualiseMonthlyRate(monthly: number): number {
  return Math.pow(1 + monthly, 12) - 1;
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
