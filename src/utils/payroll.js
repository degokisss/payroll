// ─── Formatting ───────────────────────────────────────────────
export const fmt = (n) => Math.round(n).toLocaleString('vi-VN')
export const fmtM = (n) => (n / 1e6).toFixed(2)

// ─── Constants ────────────────────────────────────────────────
export const SELF_DED = 11_000_000
export const DEP_DED  = 6_000_000
export const INS_CAP  = 36_000_000   // tối đa 20 × lương tối thiểu vùng (simplified)
export const EE_RATE  = 0.105        // 8% BHXH + 1.5% BHYT + 1% BHTN
export const ER_RATE  = 0.205        // 17.5% BHXH + 3% BHYT + 1% BHTN

// ─── PIT (biểu lũy tiến 7 bậc) ───────────────────────────────
const PIT_SLABS = [
  [5_000_000,  0.05],
  [5_000_000,  0.10],
  [8_000_000,  0.15],
  [14_000_000, 0.20],
  [20_000_000, 0.25],
  [28_000_000, 0.30],
  [Infinity,   0.35],
]

export function calcPIT(taxable) {
  if (taxable <= 0) return 0
  let tax = 0, rem = taxable
  for (const [lim, rate] of PIT_SLABS) {
    if (rem <= 0) break
    const chunk = Math.min(rem, lim)
    tax += chunk * rate
    rem -= chunk
  }
  return tax
}

export function getPITBracket(taxable) {
  if (taxable <= 0) return 'Không chịu thuế'
  const CUM = [5e6, 10e6, 18e6, 32e6, 52e6, 80e6, Infinity]
  const LABELS = ['Bậc 1 (5%)', 'Bậc 2 (10%)', 'Bậc 3 (15%)', 'Bậc 4 (20%)', 'Bậc 5 (25%)', 'Bậc 6 (30%)', 'Bậc 7 (35%)']
  for (let i = 0; i < CUM.length; i++) if (taxable <= CUM[i]) return LABELS[i]
}

// ─── Gross → Net ──────────────────────────────────────────────
export function grossToNet(gross, { deps = 0, exemptAllowances = 1_030_000 } = {}) {
  const insBase  = Math.min(gross, INS_CAP)
  const ins      = insBase * EE_RATE
  const totalDed = SELF_DED + deps * DEP_DED
  const taxable  = Math.max(0, gross - ins - totalDed - exemptAllowances)
  const pit      = calcPIT(taxable)
  const net      = gross - ins - pit
  const erIns    = insBase * ER_RATE
  return { net, ins, pit, taxable, insBase, erIns, totalCost: gross + erIns }
}

// ─── Net → Gross (binary search) ─────────────────────────────
export function netToGross(targetNet, opts = {}) {
  let lo = targetNet, hi = targetNet * 2.5
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const { net } = grossToNet(mid, opts)
    if (net < targetNet) lo = mid; else hi = mid
  }
  return (lo + hi) / 2
}
