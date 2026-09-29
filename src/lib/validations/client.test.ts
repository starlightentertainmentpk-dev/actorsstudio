import { describe, it, expect } from 'vitest'
import {
  clientSchema,
  clientContactSchema,
  agencyTaskSchema,
} from './client'

describe('Client CRM Validations', () => {
  describe('clientSchema', () => {
    it('validates a valid client object with defaults', () => {
      const parsed = clientSchema.parse({
        company_name: 'Dawn Films',
        city: 'Karachi',
      })

      expect(parsed.company_name).toBe('Dawn Films')
      expect(parsed.industry).toBe('Entertainment & Film')
      expect(parsed.country).toBe('Pakistan')
      expect(parsed.city).toBe('Karachi')
      expect(parsed.status).toBe('active')
    })

    it('rejects short company names', () => {
      expect(() =>
        clientSchema.parse({
          company_name: 'A',
          city: 'Karachi',
        })
      ).toThrow()
    })

    it('accepts valid status values and rejects invalid status', () => {
      const validStatuses = ['lead', 'prospect', 'active', 'inactive'] as const
      for (const status of validStatuses) {
        const parsed = clientSchema.parse({
          company_name: 'Nexus Studios',
          city: 'Lahore',
          status,
        })
        expect(parsed.status).toBe(status)
      }

      expect(() =>
        clientSchema.parse({
          company_name: 'Nexus Studios',
          city: 'Lahore',
          status: 'suspended',
        })
      ).toThrow()
    })

    it('accepts valid email and optional websites', () => {
      const parsed = clientSchema.parse({
        company_name: 'Hum Films',
        city: 'Karachi',
        billing_email: 'accounts@humfilms.pk',
        website: 'https://humfilms.pk',
      })
      expect(parsed.billing_email).toBe('accounts@humfilms.pk')
      expect(parsed.website).toBe('https://humfilms.pk')
    })

    it('rejects invalid billing emails', () => {
      expect(() =>
        clientSchema.parse({
          company_name: 'Hum Films',
          city: 'Karachi',
          billing_email: 'not-an-email',
        })
      ).toThrow()
    })
  })

  describe('clientContactSchema', () => {
    const validClientId = '123e4567-e89b-12d3-a456-426614174000'

    it('validates a correct client contact', () => {
      const parsed = clientContactSchema.parse({
        client_id: validClientId,
        full_name: 'Hamza Ali',
        role_title: 'Senior Producer',
        email: 'hamza@dawnfilms.pk',
        whatsapp_number: '+923001234567',
        is_primary: true,
      })

      expect(parsed.full_name).toBe('Hamza Ali')
      expect(parsed.is_primary).toBe(true)
      expect(parsed.whatsapp_number).toBe('+923001234567')
    })

    it('rejects missing or invalid client ID', () => {
      expect(() =>
        clientContactSchema.parse({
          client_id: 'invalid-uuid',
          full_name: 'Hamza Ali',
          email: 'hamza@dawnfilms.pk',
        })
      ).toThrow()
    })

    it('rejects invalid email address', () => {
      expect(() =>
        clientContactSchema.parse({
          client_id: validClientId,
          full_name: 'Hamza Ali',
          email: 'invalid-email',
        })
      ).toThrow()
    })
  })

  describe('agencyTaskSchema', () => {
    it('validates task with defaults', () => {
      const parsed = agencyTaskSchema.parse({
        title: 'Review contract proposal',
      })

      expect(parsed.title).toBe('Review contract proposal')
      expect(parsed.priority).toBe('medium')
      expect(parsed.status).toBe('todo')
    })

    it('accepts explicit priorities and statuses', () => {
      const parsed = agencyTaskSchema.parse({
        title: 'Urgent casting call review',
        priority: 'urgent',
        status: 'in_progress',
        due_date: '2026-10-15',
      })

      expect(parsed.priority).toBe('urgent')
      expect(parsed.status).toBe('in_progress')
      expect(parsed.due_date).toBe('2026-10-15')
    })
  })
})
