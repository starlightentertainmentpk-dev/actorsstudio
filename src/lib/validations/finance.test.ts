import { describe, it, expect } from 'vitest'
import {
  createInvoiceSchema,
  recordPaymentSchema,
  createExpenseSchema,
  updateCommissionStatusSchema,
} from './finance'

describe('Finance & Invoicing Validations', () => {
  describe('createInvoiceSchema', () => {
    it('validates a complete invoice with items', () => {
      const valid = {
        organizationId: 'org-123',
        clientId: 'client-dawn',
        currency: 'PKR',
        dueDate: '2026-11-30',
        paymentTerms: 'Net 30',
        taxRate: 5,
        discountAmount: 10000,
        notes: 'Commercial shoot invoice',
        items: [
          { description: 'Actor Day Fee', quantity: 2, unitPrice: 150000 },
          { description: 'Wardrobe Allowance', quantity: 1, unitPrice: 25000 },
        ],
      }
      const res = createInvoiceSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects invoice without items', () => {
      const invalid = {
        organizationId: 'org-123',
        clientId: 'client-dawn',
        dueDate: '2026-11-30',
        items: [],
      }
      const res = createInvoiceSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('At least one line item is required')
      }
    })

    it('rejects invalid quantity or negative unit price', () => {
      const invalid = {
        organizationId: 'org-123',
        clientId: 'client-dawn',
        dueDate: '2026-11-30',
        items: [
          { description: 'Invalid', quantity: 0, unitPrice: -500 },
        ],
      }
      const res = createInvoiceSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('recordPaymentSchema', () => {
    it('validates valid partial payment', () => {
      const valid = {
        organizationId: 'org-123',
        invoiceId: 'inv-456',
        clientId: 'client-dawn',
        amountPaid: 150000,
        currency: 'PKR',
        paymentMethod: 'bank_transfer' as const,
        transactionReference: 'WIRE-PK-98213',
        paymentDate: '2026-10-15',
        notes: '50% advance',
      }
      const res = recordPaymentSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects zero or negative amount paid', () => {
      const invalid = {
        organizationId: 'org-123',
        invoiceId: 'inv-456',
        clientId: 'client-dawn',
        amountPaid: -100,
        paymentMethod: 'cash' as const,
        paymentDate: '2026-10-15',
      }
      const res = recordPaymentSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('createExpenseSchema', () => {
    it('validates valid operational expense', () => {
      const valid = {
        organizationId: 'org-123',
        category: 'travel' as const,
        amount: 35000,
        currency: 'PKR',
        description: 'Karachi to Lahore roundtrip flights for shoot',
        expenseDate: '2026-10-20',
      }
      const res = createExpenseSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })
  })

  describe('updateCommissionStatusSchema', () => {
    it('validates valid commission status change', () => {
      const valid = {
        commissionRecordId: 'comm-123',
        status: 'paid' as const,
      }
      const res = updateCommissionStatusSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })
  })
})
