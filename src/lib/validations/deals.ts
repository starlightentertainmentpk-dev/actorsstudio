import { z } from 'zod'

export const dealStatusEnum = z.enum([
  'lead',
  'proposal',
  'negotiation',
  'approved',
  'contract',
  'booked',
  'completed',
  'invoiced',
  'paid',
  'cancelled',
])

export const bookingStatusEnum = z.enum(['draft', 'confirmed', 'completed', 'cancelled'])

export const holdStatusEnum = z.enum(['active', 'challenged', 'confirmed', 'released', 'expired'])

export const createDealSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  clientId: z.string().min(1, 'Client is required'),
  talentId: z.string().min(1, 'Talent is required'),
  castingCallId: z.string().optional().nullable(),
  dealName: z.string().min(2, 'Deal name must be at least 2 characters'),
  dealValue: z.number().positive('Deal value must be greater than 0'),
  agencyCommissionAmount: z.number().nonnegative('Commission must be non-negative'),
  talentPayoutAmount: z.number().nonnegative('Talent payout must be non-negative'),
  currency: z.string().default('PKR'),
  paymentTerms: z.string().default('Net 30'),
  status: dealStatusEnum.default('proposal'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  // Check that dealValue roughly equals agencyCommission + talentPayout
  // allowing a small rounding delta of 1.00
  const diff = Math.abs(data.dealValue - (data.agencyCommissionAmount + data.talentPayoutAmount))
  return diff <= 1.00
}, {
  message: 'Deal value must equal commission amount plus talent payout',
  path: ['dealValue'],
})

export const updateDealStatusSchema = z.object({
  dealId: z.string().min(1, 'Deal ID is required'),
  status: dealStatusEnum,
  notes: z.string().optional().nullable(),
})

export const createBookingSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  dealId: z.string().optional().nullable(),
  clientId: z.string().min(1, 'Client is required'),
  talentId: z.string().min(1, 'Talent is required'),
  projectName: z.string().min(2, 'Project name is required'),
  shootDateStart: z.string().min(10, 'Valid start date required (YYYY-MM-DD)'),
  shootDateEnd: z.string().min(10, 'Valid end date required (YYYY-MM-DD)'),
  callTime: z.string().optional().nullable(),
  wrapTime: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  feeAmount: z.number().positive('Fee amount must be greater than 0'),
  currency: z.string().default('PKR'),
  usageRights: z.string().min(2, 'Usage rights duration & terms required'),
  territory: z.string().default('Pakistan'),
  media: z.string().default('TV, Digital, Social'),
  conflictOverride: z.boolean().default(false),
}).refine((data) => {
  return new Date(data.shootDateEnd) >= new Date(data.shootDateStart)
}, {
  message: 'End date must be on or after start date',
  path: ['shootDateEnd'],
})

export const createHoldSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  clientId: z.string().min(1, 'Client is required'),
  talentId: z.string().min(1, 'Talent is required'),
  holdDateStart: z.string().min(10, 'Valid start date required (YYYY-MM-DD)'),
  holdDateEnd: z.string().min(10, 'Valid end date required (YYYY-MM-DD)'),
  priorityLevel: z.number().int().min(1).max(3).default(1),
  projectTitle: z.string().min(2, 'Project title is required'),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  return new Date(data.holdDateEnd) >= new Date(data.holdDateStart)
}, {
  message: 'End date must be on or after start date',
  path: ['holdDateEnd'],
})

export const challengeHoldSchema = z.object({
  holdId: z.string().min(1, 'Hold ID is required'),
})

export const resolveHoldSchema = z.object({
  holdId: z.string().min(1, 'Hold ID is required'),
  decision: z.enum(['confirm', 'release']),
  notes: z.string().optional(),
})

export type CreateDealInput = z.infer<typeof createDealSchema>
export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CreateHoldInput = z.infer<typeof createHoldSchema>
export type ChallengeHoldInput = z.infer<typeof challengeHoldSchema>
export type ResolveHoldInput = z.infer<typeof resolveHoldSchema>
