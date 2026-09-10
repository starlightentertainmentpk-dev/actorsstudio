import { describe, it, expect } from 'vitest'
import { step1Schema, step2Schema } from './talent-onboarding'
import { producerStep1Schema } from './producer-onboarding'
import { castingCallSchema } from './casting-call'

describe('Talent Onboarding Validation', () => {
  describe('Step 1 (Personal Info)', () => {
    it('should accept a complete Step 1 profile', () => {
      const result = step1Schema.safeParse({
        full_name: 'Fawad Khan',
        city: 'Lahore',
        dob: '1981-11-29',
        gender: 'male',
      })
      expect(result.success).toBe(true)
    })

    it('should reject profiles with empty names', () => {
      const result = step1Schema.safeParse({
        full_name: '',
        city: 'Lahore',
        dob: '1981-11-29',
        gender: 'male',
      })
      expect(result.success).toBe(false)
    })

    it('should reject profiles with missing dob', () => {
      const result = step1Schema.safeParse({
        full_name: 'Fawad Khan',
        city: 'Lahore',
        gender: 'male',
      })
      expect(result.success).toBe(false)
    })

    it('should reject profiles with invalid dob format', () => {
      const result = step1Schema.safeParse({
        full_name: 'Fawad Khan',
        city: 'Lahore',
        dob: '29-11-1981',
        gender: 'male',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Step 2 (Professional/Physical Info)', () => {
    const validStep2Base = {
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      experience_years: 5,
      languages: ['Urdu', 'English'],
      skills: ['Acting', 'Dancing'],
    }

    it('should accept valid physical attributes', () => {
      const result = step2Schema.safeParse({
        ...validStep2Base,
        height_cm: 180,
        weight_kg: 75,
      })
      expect(result.success).toBe(true)
    })

    it('should reject height under 100cm', () => {
      const result = step2Schema.safeParse({
        ...validStep2Base,
        height_cm: 99,
      })
      expect(result.success).toBe(false)
    })

    it('should reject height over 250cm', () => {
      const result = step2Schema.safeParse({
        ...validStep2Base,
        height_cm: 251,
      })
      expect(result.success).toBe(false)
    })

    it('should reject weight under 30kg', () => {
      const result = step2Schema.safeParse({
        ...validStep2Base,
        weight_kg: 29,
      })
      expect(result.success).toBe(false)
    })

    it('should reject weight over 200kg', () => {
      const result = step2Schema.safeParse({
        ...validStep2Base,
        weight_kg: 201,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Producer Onboarding Validation', () => {
  it('should accept valid company types', () => {
    const validTypes = ['production_house', 'brand', 'ad_agency', 'independent_producer', 'casting_director']
    for (const type of validTypes) {
      const result = producerStep1Schema.safeParse({
        company_name: 'Studio X',
        company_type: type,
      })
      expect(result.success).toBe(true)
    }
  })

  it('should reject invalid company types', () => {
    const result = producerStep1Schema.safeParse({
      company_name: 'Studio X',
      company_type: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })
})

describe('Casting Call Validation', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const validCastingCallBase = {
    title: 'Casting for Lead Role',
    description: 'This is a description for a lead role in an upcoming short film.',
    category_id: '550e8400-e29b-41d4-a716-446655440000',
    location: 'Karachi',
    status: 'open',
  }

  it('should accept future application deadlines', () => {
    const result = castingCallSchema.safeParse({
      ...validCastingCallBase,
      application_deadline: tomorrow,
    })
    expect(result.success).toBe(true)
  })

  it('should reject past application deadlines', () => {
    const result = castingCallSchema.safeParse({
      ...validCastingCallBase,
      application_deadline: yesterday,
    })
    expect(result.success).toBe(false)
  })

  it('should accept empty application deadlines', () => {
    const result = castingCallSchema.safeParse({
      ...validCastingCallBase,
      application_deadline: '',
    })
    expect(result.success).toBe(true)
  })
})
