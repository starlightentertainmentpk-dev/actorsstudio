import { z } from 'zod'

export const contractStatusEnum = z.enum([
  'draft',
  'sent',
  'viewed',
  'signed',
  'rejected',
  'expired',
])

export const contractTypeEnum = z.enum([
  'representation',
  'booking',
  'model_release',
  'nda',
  'usage_rights',
])

export const signerTypeEnum = z.enum(['talent', 'client', 'agency_witness'])

export const documentCategoryEnum = z.enum([
  'contract',
  'invoice',
  'talent_doc',
  'client_doc',
  'legal',
  'production',
])

export const generateContractFromBookingSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  templateId: z.string().min(1, 'Template ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
})

export const createContractTemplateSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  templateName: z.string().min(2, 'Template name must be at least 2 characters'),
  contractType: contractTypeEnum,
  bodyMarkdown: z.string().min(10, 'Template markdown body must be at least 10 characters'),
  isDefault: z.boolean().default(false),
})

export const updateContractTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  templateName: z.string().min(2).optional(),
  contractType: contractTypeEnum.optional(),
  bodyMarkdown: z.string().min(10).optional(),
  isDefault: z.boolean().optional(),
})

export const submitDigitalSignatureSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  signerType: signerTypeEnum,
  signerName: z.string().min(2, 'Full legal name must be at least 2 characters'),
  signatureImageData: z.string().min(20, 'Signature drawing is required'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  legalConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree that your electronic signature is legally binding',
  }),
})

export const createCustomContractSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  clientId: z.string().min(1, 'Client is required'),
  talentId: z.string().min(1, 'Talent is required'),
  dealId: z.string().optional().nullable(),
  bookingId: z.string().optional().nullable(),
  contractTitle: z.string().min(2, 'Contract title is required'),
  renderedBody: z.string().min(10, 'Contract body must be at least 10 characters'),
  expiresAt: z.string().optional().nullable(),
})

export const uploadDocumentSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  category: documentCategoryEnum,
  isPrivate: z.boolean().default(true),
})
