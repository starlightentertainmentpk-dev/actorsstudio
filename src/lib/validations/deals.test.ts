import { describe, it, expect } from 'vitest'
import {
  createDealSchema,
  updateDealStatusSchema,
  createBookingSchema,
  createHoldSchema,
  challengeHoldSchema,
} from './deals'

describe('Deals & Booking Validations', () => {
  describe('createDealSchema', () => {
    it('validates a correct commercial deal with 20% commission math', () => {
      const valid = {
        organizationId: 'org-test',
        clientId: 'client-dawn',
        talentId: 'talent-zara',
        dealName: 'Ramadan 2026 Commercial',
        dealValue: 500000,
        agencyCommissionAmount: 100000,
        talentPayoutAmount: 400000,
        currency: 'PKR',
        paymentTerms: 'Net 30',
        status: 'proposal' as const,
      }
      const res = createDealSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects when deal value does not equal commission + talent payout', () => {
      const invalid = {
        organizationId: 'org-test',
        clientId: 'client-dawn',
        talentId: 'talent-zara',
        dealName: 'Imbalanced Deal',
        dealValue: 500000,
        agencyCommissionAmount: 100000,
        talentPayoutAmount: 300000, // missing 100k
        currency: 'PKR',
        status: 'proposal' as const,
      }
      const res = createDealSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Deal value must equal commission')
      }
    })

    it('rejects negative deal values', () => {
      const invalid = {
        organizationId: 'org-test',
        clientId: 'client-dawn',
        talentId: 'talent-zara',
        dealName: 'Negative Deal',
        dealValue: -1000,
        agencyCommissionAmount: 0,
        talentPayoutAmount: -1000,
        currency: 'PKR',
      }
      const res = createDealSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('createBookingSchema', () => {
    it('validates a complete shoot booking with usage rights', () => {
      const valid = {
        organizationId: 'org-test',
        clientId: 'client-dawn',
        talentId: 'talent-zara',
        projectName: 'National Tea TVC',
        shootDateStart: '2026-11-01',
        shootDateEnd: '2026-11-03',
        feeAmount: 350000,
        currency: 'PKR',
        usageRights: '1 Year Digital + TVC',
        territory: 'Pakistan',
        media: 'TV, Digital, Social',
        conflictOverride: false,
      }
      const res = createBookingSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects when shoot end date is before start date', () => {
      const invalid = {
        organizationId: 'org-test',
        clientId: 'client-dawn',
        talentId: 'talent-zara',
        projectName: 'Backwards Dates',
        shootDateStart: '2026-11-05',
        shootDateEnd: '2026-11-01',
        feeAmount: 350000,
        currency: 'PKR',
        usageRights: '1 Year Digital',
      }
      const res = createBookingSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('createHoldSchema', () => {
    it('validates 1st hold placement', () => {
      const valid = {
        organizationId: 'org-test',
        clientId: 'client-hum',
        talentId: 'talent-bilal',
        holdDateStart: '2026-11-15',
        holdDateEnd: '2026-11-18',
        priorityLevel: 1,
        projectTitle: 'Prime Time Drama',
      }
      const res = createHoldSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('validates 2nd hold placement', () => {
      const valid = {
        organizationId: 'org-test',
        clientId: 'client-shan',
        talentId: 'talent-bilal',
        holdDateStart: '2026-11-15',
        holdDateEnd: '2026-11-18',
        priorityLevel: 2,
        projectTitle: 'Shan Festive TVC',
      }
      const res = createHoldSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects priority level outside 1-3', () => {
      const invalid = {
        organizationId: 'org-test',
        clientId: 'client-shan',
        talentId: 'talent-bilal',
        holdDateStart: '2026-11-15',
        holdDateEnd: '2026-11-18',
        priorityLevel: 5,
        projectTitle: 'Shan Festive TVC',
      }
      const res = createHoldSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('challengeHoldSchema', () => {
    it('validates 24-hour challenge invocation', () => {
      const valid = { holdId: 'hold-123' }
      const res = challengeHoldSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects empty holdId', () => {
      const invalid = { holdId: '' }
      const res = challengeHoldSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })
})
