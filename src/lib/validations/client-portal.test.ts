import { describe, it, expect } from 'vitest'
import { clientBriefSchema, candidateReviewSchema } from './client-portal'

describe('clientBriefSchema', () => {
  it('validates a valid client brief', () => {
    const validData = {
      project_title: 'Summer Fashion Commercial',
      raw_brief_text: 'Looking for 3 dynamic fashion models for our upcoming TVC shoot in Karachi.',
      budget_range: 'PKR 150,000 - 300,000',
      shoot_dates: 'Nov 10 - Nov 15',
      location: 'Karachi',
      age_range_min: 20,
      age_range_max: 28,
      gender_preference: 'female',
    }

    const result = clientBriefSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails when project title is too short', () => {
    const invalidData = {
      project_title: 'AB',
      raw_brief_text: 'Valid description with more than ten characters.',
    }

    const result = clientBriefSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 3 characters')
    }
  })

  it('fails when raw brief text is too short', () => {
    const invalidData = {
      project_title: 'Valid Title',
      raw_brief_text: 'Short',
    }

    const result = clientBriefSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('minimum 10 characters')
    }
  })

  it('fails when age_range_min is greater than age_range_max', () => {
    const invalidData = {
      project_title: 'Valid Project',
      raw_brief_text: 'This is a comprehensive description of the casting call requirements.',
      age_range_min: 35,
      age_range_max: 25,
    }

    const result = clientBriefSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Minimum age cannot be greater than maximum age')
    }
  })
})

describe('candidateReviewSchema', () => {
  it('validates valid candidate review decisions', () => {
    const validShortlist = {
      submission_id: 'sub-123',
      decision: 'shortlist',
      feedback: 'Great headshot and expressive showreel.',
    }
    expect(candidateReviewSchema.safeParse(validShortlist).success).toBe(true)

    const validAudition = {
      submission_id: 'sub-456',
      decision: 'audition_request',
      feedback: 'Invite for callback on Thursday.',
    }
    expect(candidateReviewSchema.safeParse(validAudition).success).toBe(true)

    const validReject = {
      submission_id: 'sub-789',
      decision: 'reject',
    }
    expect(candidateReviewSchema.safeParse(validReject).success).toBe(true)
  })

  it('rejects invalid decision enum values', () => {
    const invalid = {
      submission_id: 'sub-123',
      decision: 'maybe',
    }
    expect(candidateReviewSchema.safeParse(invalid).success).toBe(false)
  })
})
