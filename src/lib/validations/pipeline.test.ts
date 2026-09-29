import { describe, it, expect } from 'vitest'
import {
  moveCandidateStageSchema,
  submitToClientSchema,
  castingRoleSchema,
  addTalentToPipelineSchema,
  bulkUpdateStageSchema,
} from './pipeline'

describe('Pipeline Validations', () => {
  describe('moveCandidateStageSchema', () => {
    it('validates a valid stage transition', () => {
      const valid = {
        submissionId: 'sub-101',
        newStage: 'audition',
      }
      const result = moveCandidateStageSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects an invalid stage value', () => {
      const invalid = {
        submissionId: 'sub-101',
        newStage: 'non_existent_stage',
      }
      const result = moveCandidateStageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects empty submissionId', () => {
      const invalid = {
        submissionId: '',
        newStage: 'shortlisted',
      }
      const result = moveCandidateStageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('submitToClientSchema', () => {
    it('validates full client submission payload', () => {
      const valid = {
        submissionId: 'sub-101',
        clientId: 'c1-dawn-films',
        proposedFee: 350000,
        currency: 'PKR',
        agentPitchNote: 'Perfect fit for the protagonist role.',
      }
      const result = submitToClientSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.proposedFee).toBe(350000)
        expect(result.data.currency).toBe('PKR')
      }
    })

    it('rejects negative fee', () => {
      const invalid = {
        submissionId: 'sub-101',
        clientId: 'c1-dawn-films',
        proposedFee: -500,
      }
      const result = submitToClientSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('castingRoleSchema', () => {
    it('validates casting role definition', () => {
      const valid = {
        casting_call_id: 'call-1',
        role_name: 'Main Lead — Hamza',
        role_type: 'lead',
        gender_requirement: 'male',
        age_min: 24,
        age_max: 32,
        pay_rate: 'PKR 600,000 per project',
        description: 'Charismatic protagonist in high-stakes corporate drama',
      }
      const result = castingRoleSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects role name shorter than 2 chars', () => {
      const invalid = {
        casting_call_id: 'call-1',
        role_name: 'A',
      }
      const result = castingRoleSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('bulkUpdateStageSchema', () => {
    it('validates bulk candidate stage update', () => {
      const valid = {
        submissionIds: ['sub-1', 'sub-2', 'sub-3'],
        newStage: 'client_review',
      }
      const result = bulkUpdateStageSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('rejects empty submissionIds array', () => {
      const invalid = {
        submissionIds: [],
        newStage: 'client_review',
      }
      const result = bulkUpdateStageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })
})
