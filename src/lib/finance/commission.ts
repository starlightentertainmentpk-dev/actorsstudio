export interface CommissionSplitInput {
  grossAmount: number
  agencyRatePct?: number // default 20%
  agentRatePctOfAgency?: number // default 10% of agency commission
  expensesDeducted?: number
}

export interface CommissionSplitResult {
  grossAmount: number
  agencyCommissionAmount: number
  agentCutAmount: number
  talentGrossAmount: number
  talentNetAmount: number
  effectiveTalentPct: number
}

/**
 * Calculates financial split for a talent booking:
 * - Agency Commission (default 20%)
 * - Internal Agent Split (e.g. 10% of agency cut)
 * - Talent Gross & Net Payout (after any direct shoot expenses deducted)
 */
export function calculateCommissionSplit(
  input: CommissionSplitInput
): CommissionSplitResult {
  const gross = Math.max(0, input.grossAmount || 0)
  const agencyPct = input.agencyRatePct !== undefined ? input.agencyRatePct : 20.0
  const agentPctOfAgency =
    input.agentRatePctOfAgency !== undefined ? input.agentRatePctOfAgency : 10.0
  const expenses = Math.max(0, input.expensesDeducted || 0)

  const agencyCommissionAmount = (gross * agencyPct) / 100
  const agentCutAmount = (agencyCommissionAmount * agentPctOfAgency) / 100
  const talentGrossAmount = Math.max(0, gross - agencyCommissionAmount)
  const talentNetAmount = Math.max(0, talentGrossAmount - expenses)
  const effectiveTalentPct = gross > 0 ? (talentNetAmount / gross) * 100 : 0

  return {
    grossAmount: gross,
    agencyCommissionAmount: Math.round(agencyCommissionAmount * 100) / 100,
    agentCutAmount: Math.round(agentCutAmount * 100) / 100,
    talentGrossAmount: Math.round(talentGrossAmount * 100) / 100,
    talentNetAmount: Math.round(talentNetAmount * 100) / 100,
    effectiveTalentPct: Math.round(effectiveTalentPct * 10) / 10,
  }
}

export interface InvoiceTotalsInput {
  items: Array<{ quantity: number; unitPrice: number }>
  taxRatePct?: number
  discountAmount?: number
}

export interface InvoiceTotalsResult {
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
}

export function calculateInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotalsResult {
  const subtotal = (input.items || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const taxRate = Math.max(0, Number(input.taxRatePct) || 0)
  const taxAmount = (subtotal * taxRate) / 100
  const discountAmount = Math.max(0, Number(input.discountAmount) || 0)
  const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount)

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: Math.round(taxRate * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

/**
 * Format currency with standardized country locale and symbols
 */
export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  const safeAmount = Number(amount) || 0
  const cur = (currency || 'PKR').toUpperCase()

  const currencySymbols: Record<string, string> = {
    PKR: 'PKR ',
    USD: '$',
    AED: 'AED ',
    GBP: '£',
    EUR: '€',
  }

  const symbol = currencySymbols[cur] || `${cur} `
  const formattedNumber = safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: safeAmount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formattedNumber}`
}

/**
 * Calculate invoice aging status based on due date
 */
export function calculateAgingDays(dueDate: string | Date): {
  daysPastDue: number
  isOverdue: boolean
  agingCategory: '<30d' | '30-60d' | '60d+' | 'current'
} {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - due.getTime()
  const daysPastDue = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (daysPastDue <= 0) {
    return { daysPastDue: 0, isOverdue: false, agingCategory: 'current' }
  } else if (daysPastDue <= 30) {
    return { daysPastDue, isOverdue: true, agingCategory: '<30d' }
  } else if (daysPastDue <= 60) {
    return { daysPastDue, isOverdue: true, agingCategory: '30-60d' }
  } else {
    return { daysPastDue, isOverdue: true, agingCategory: '60d+' }
  }
}

/**
 * Generates sequential formatted invoice number INV-YYYY-XXXX
 */
export function generateInvoiceNumber(
  prefix: string = 'INV',
  year: number = new Date().getFullYear(),
  randomSuffix?: number
): string {
  const suffix = randomSuffix ?? Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${suffix}`
}
