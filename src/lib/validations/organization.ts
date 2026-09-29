import { z } from 'zod'

export const agencyTypes = [
  'talent_agency',
  'modeling_agency',
  'casting_agency',
  'entertainment_agency',
  'influencer_agency',
  'creator_management',
  'sports_talent',
  'other',
] as const

export const organizationRoles = [
  'super_admin',
  'agency_owner',
  'agency_admin',
  'agent',
  'casting_manager',
  'talent_manager',
  'finance_manager',
  'viewer',
] as const

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
  agency_type: z.enum(agencyTypes),
  country: z.string().default('Pakistan'),
  currency: z.string().default('PKR'),
  timezone: z.string().default('Asia/Karachi'),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  brand_color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color')
    .default('#4f46e5'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional().or(z.literal('')),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const teamInviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum([
    'agency_admin',
    'agent',
    'casting_manager',
    'talent_manager',
    'finance_manager',
    'viewer',
  ]),
})

export type TeamInviteMember = z.infer<typeof teamInviteMemberSchema>

export const agencyOnboardingSchema = createOrganizationSchema.extend({
  default_commission_rate: z.coerce.number().min(0).max(100).default(20),
  team_invites: z.array(teamInviteMemberSchema).optional().default([]),
})

export type AgencyOnboardingInput = z.infer<typeof agencyOnboardingSchema>
