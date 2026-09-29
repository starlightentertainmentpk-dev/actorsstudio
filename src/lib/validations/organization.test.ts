import { describe, it, expect } from 'vitest'
import {
  createOrganizationSchema,
  agencyOnboardingSchema,
  teamInviteMemberSchema,
} from './organization'
import { DEFAULT_BRAND, getActiveOrganizationBrand } from '../branding'

describe('Organization Validation Schemas', () => {
  describe('createOrganizationSchema', () => {
    it('accepts a valid agency profile', () => {
      const valid = {
        name: "Actor's Studio Lahore",
        slug: 'actors-studio-lahore',
        agency_type: 'talent_agency',
        country: 'Pakistan',
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        brand_color: '#4f46e5',
        website: 'https://actorsstudio.pk',
        bio: 'Leading talent agency in Pakistan representing screen and stage artists.',
      }

      const res = createOrganizationSchema.safeParse(valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.name).toBe("Actor's Studio Lahore")
        expect(res.data.slug).toBe('actors-studio-lahore')
      }
    })

    it('rejects an agency name with less than 2 characters', () => {
      const res = createOrganizationSchema.safeParse({
        name: 'A',
        slug: 'a-agency',
        agency_type: 'talent_agency',
      })
      expect(res.success).toBe(false)
    })

    it('rejects slugs with uppercase letters, spaces, or invalid characters', () => {
      const res1 = createOrganizationSchema.safeParse({
        name: 'My Agency',
        slug: 'My Agency',
        agency_type: 'talent_agency',
      })
      expect(res1.success).toBe(false)

      const res2 = createOrganizationSchema.safeParse({
        name: 'My Agency',
        slug: 'agency_with_underscore',
        agency_type: 'talent_agency',
      })
      expect(res2.success).toBe(false)

      const res3 = createOrganizationSchema.safeParse({
        name: 'My Agency',
        slug: 'valid-agency-slug-123',
        agency_type: 'talent_agency',
      })
      expect(res3.success).toBe(true)
    })

    it('validates supported agency types', () => {
      const resInvalid = createOrganizationSchema.safeParse({
        name: 'Valid Name',
        slug: 'valid-slug',
        agency_type: 'unsupported_type',
      })
      expect(resInvalid.success).toBe(false)

      const supported = [
        'talent_agency',
        'modeling_agency',
        'casting_agency',
        'entertainment_agency',
        'influencer_agency',
        'creator_management',
        'sports_talent',
        'other',
      ]
      supported.forEach((type) => {
        const res = createOrganizationSchema.safeParse({
          name: 'Valid Name',
          slug: 'valid-slug',
          agency_type: type,
        })
        expect(res.success).toBe(true)
      })
    })

    it('validates hex brand color formats', () => {
      const validHexes = ['#4f46e5', '#fff', '#000000', '#1E293B']
      validHexes.forEach((hex) => {
        const res = createOrganizationSchema.safeParse({
          name: 'Valid Name',
          slug: 'valid-slug',
          agency_type: 'talent_agency',
          brand_color: hex,
        })
        expect(res.success).toBe(true)
      })

      const invalidHexes = ['blue', 'rgb(0,0,0)', '4f46e5', '#12345', '#1234567']
      invalidHexes.forEach((hex) => {
        const res = createOrganizationSchema.safeParse({
          name: 'Valid Name',
          slug: 'valid-slug',
          agency_type: 'talent_agency',
          brand_color: hex,
        })
        expect(res.success).toBe(false)
      })
    })
  })

  describe('agencyOnboardingSchema', () => {
    it('accepts complete onboarding input including commission rate and team invites', () => {
      const payload = {
        name: 'Star Talent Management',
        slug: 'star-talent-mgmt',
        agency_type: 'creator_management',
        country: 'United Arab Emirates',
        currency: 'AED',
        timezone: 'Asia/Dubai',
        brand_color: '#7c3aed',
        default_commission_rate: 18.5,
        team_invites: [
          { email: 'agent1@startalent.com', role: 'agent' },
          { email: 'casting@startalent.com', role: 'casting_manager' },
        ],
      }

      const res = agencyOnboardingSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.default_commission_rate).toBe(18.5)
        expect(res.data.team_invites).toHaveLength(2)
      }
    })

    it('rejects negative commission rates or rates exceeding 100', () => {
      const resNeg = agencyOnboardingSchema.safeParse({
        name: 'Agency X',
        slug: 'agency-x',
        agency_type: 'talent_agency',
        default_commission_rate: -5,
      })
      expect(resNeg.success).toBe(false)

      const resOver = agencyOnboardingSchema.safeParse({
        name: 'Agency X',
        slug: 'agency-x',
        agency_type: 'talent_agency',
        default_commission_rate: 105,
      })
      expect(resOver.success).toBe(false)
    })

    it('rejects invalid team invite email addresses', () => {
      const res = teamInviteMemberSchema.safeParse({
        email: 'invalid-email-address',
        role: 'agent',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('Dynamic Branding Resolver', () => {
    it('returns DEFAULT_BRAND when no orgId is supplied', async () => {
      const brand = await getActiveOrganizationBrand(undefined)
      expect(brand).toEqual(DEFAULT_BRAND)
      expect(brand.name).toBe("Actor's Studio")
      expect(brand.currency).toBe('PKR')
    })
  })
})
