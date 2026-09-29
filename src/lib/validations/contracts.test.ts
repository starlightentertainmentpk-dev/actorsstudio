import { describe, it, expect } from 'vitest'
import {
  generateContractFromBookingSchema,
  createContractTemplateSchema,
  submitDigitalSignatureSchema,
  createCustomContractSchema,
  uploadDocumentSchema,
} from './contracts'

describe('Contracts & E-Signature Validations', () => {
  describe('generateContractFromBookingSchema', () => {
    it('validates proper booking generation parameters', () => {
      const valid = {
        orgId: 'org-123',
        templateId: 'tmpl-456',
        bookingId: 'book-789',
      }
      const res = generateContractFromBookingSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects empty IDs', () => {
      const invalid = {
        orgId: '',
        templateId: 'tmpl-456',
        bookingId: '',
      }
      const res = generateContractFromBookingSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('createContractTemplateSchema', () => {
    it('validates a valid template payload', () => {
      const valid = {
        orgId: 'org-123',
        templateName: 'Commercial Appearance Release',
        contractType: 'booking' as const,
        bodyMarkdown: '# Agreement\nBetween {{client_name}} and {{talent_name}}',
        isDefault: true,
      }
      const res = createContractTemplateSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects invalid contract type', () => {
      const invalid = {
        orgId: 'org-123',
        templateName: 'Invalid',
        contractType: 'unknown_type' as any,
        bodyMarkdown: 'Some short',
      }
      const res = createContractTemplateSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('submitDigitalSignatureSchema', () => {
    it('accepts valid signature submission with consent', () => {
      const valid = {
        contractId: 'contract-abc',
        signerType: 'talent' as const,
        signerName: 'Fawad Khan',
        signatureImageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        legalConsent: true,
        ipAddress: '192.168.1.1',
      }
      const res = submitDigitalSignatureSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('rejects submission if legal consent is false', () => {
      const invalid = {
        contractId: 'contract-abc',
        signerType: 'talent' as const,
        signerName: 'Fawad Khan',
        signatureImageData: 'data:image/png;base64,validstringcontentlongerthan20chars',
        legalConsent: false,
      }
      const res = submitDigitalSignatureSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].path).toContain('legalConsent')
      }
    })
  })

  describe('uploadDocumentSchema', () => {
    it('validates correct document vault metadata', () => {
      const valid = {
        orgId: 'org-123',
        title: 'Talent Passport Copy',
        category: 'talent_doc' as const,
        isPrivate: true,
      }
      const res = uploadDocumentSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })
  })
})
