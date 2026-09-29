import { describe, it, expect } from 'vitest'
import {
  calculateCommissionSplit,
  calculateInvoiceTotals,
  formatCurrency,
  calculateAgingDays,
  generateInvoiceNumber,
} from './commission'

describe('Commission & Invoicing Calculation Engine', () => {
  describe('calculateCommissionSplit', () => {
    it('calculates standard 20% agency and 10% agent cut correctly for PKR 500,000 gross', () => {
      const result = calculateCommissionSplit({
        grossAmount: 500000,
        agencyRatePct: 20,
        agentRatePctOfAgency: 10,
      })

      expect(result.grossAmount).toBe(500000)
      expect(result.agencyCommissionAmount).toBe(100000) // 20% of 500k
      expect(result.agentCutAmount).toBe(10000) // 10% of 100k
      expect(result.talentGrossAmount).toBe(400000) // 80%
      expect(result.talentNetAmount).toBe(400000)
      expect(result.effectiveTalentPct).toBe(80)
    })

    it('correctly deducts shoot expenses from talent net payout', () => {
      const result = calculateCommissionSplit({
        grossAmount: 1000000,
        agencyRatePct: 15,
        expensesDeducted: 50000, // travel / wardrobe deduction
      })

      expect(result.agencyCommissionAmount).toBe(150000) // 15%
      expect(result.talentGrossAmount).toBe(850000)
      expect(result.talentNetAmount).toBe(800000) // 850k - 50k
      expect(result.effectiveTalentPct).toBe(80)
    })

    it('handles zero or negative gross safely', () => {
      const result = calculateCommissionSplit({
        grossAmount: 0,
      })

      expect(result.grossAmount).toBe(0)
      expect(result.agencyCommissionAmount).toBe(0)
      expect(result.talentNetAmount).toBe(0)
      expect(result.effectiveTalentPct).toBe(0)
    })
  })

  describe('calculateInvoiceTotals', () => {
    it('calculates subtotal, tax and discounts accurately', () => {
      const items = [
        { quantity: 2, unitPrice: 150000 }, // 300,000
        { quantity: 1, unitPrice: 50000 },  // 50,000
      ]

      const totals = calculateInvoiceTotals({
        items,
        taxRatePct: 13, // 13% GST
        discountAmount: 20000,
      })

      expect(totals.subtotal).toBe(350000)
      expect(totals.taxAmount).toBe(45500) // 13% of 350k
      expect(totals.discountAmount).toBe(20000)
      expect(totals.totalAmount).toBe(375500) // 350k + 45.5k - 20k
    })
  })

  describe('formatCurrency', () => {
    it('formats PKR, USD, AED, GBP properly', () => {
      expect(formatCurrency(500000, 'PKR')).toContain('PKR')
      expect(formatCurrency(500000, 'PKR')).toContain('500,000')
      expect(formatCurrency(2500, 'USD')).toBe('$2,500')
      expect(formatCurrency(10000, 'AED')).toContain('AED')
      expect(formatCurrency(1500, 'GBP')).toBe('£1,500')
    })
  })

  describe('calculateAgingDays', () => {
    it('detects current and overdue invoices', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString()
      const futureRes = calculateAgingDays(future)
      expect(futureRes.isOverdue).toBe(false)
      expect(futureRes.agingCategory).toBe('current')

      const past15 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
      const past15Res = calculateAgingDays(past15)
      expect(past15Res.isOverdue).toBe(true)
      expect(past15Res.agingCategory).toBe('<30d')

      const past45 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString()
      const past45Res = calculateAgingDays(past45)
      expect(past45Res.isOverdue).toBe(true)
      expect(past45Res.agingCategory).toBe('30-60d')

      const past75 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 75).toISOString()
      const past75Res = calculateAgingDays(past75)
      expect(past75Res.isOverdue).toBe(true)
      expect(past75Res.agingCategory).toBe('60d+')
    })
  })

  describe('generateInvoiceNumber', () => {
    it('formats sequential INV numbers correctly', () => {
      const invNum = generateInvoiceNumber('INV', 2026, 4512)
      expect(invNum).toBe('INV-2026-4512')
    })
  })
})
