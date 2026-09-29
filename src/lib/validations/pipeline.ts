import { z } from 'zod'

export const pipelineStages = [
  'new_brief',
  'searching',
  'shortlisted',
  'submitted',
  'client_review',
  'audition',
  'callback',
  'selected',
  'offer',
  'booked',
  'completed',
] as const

export const moveCandidateStageSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  newStage: z.enum(pipelineStages),
})

export const submitToClientSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  clientId: z.string().min(1, 'Client selection is required'),
  proposedFee: z.coerce.number().min(0, 'Proposed fee must be positive'),
  currency: z.string().default('PKR'),
  agentPitchNote: z.string().optional(),
})

export const castingRoleSchema = z.object({
  casting_call_id: z.string().min(1, 'Casting project ID is required'),
  role_name: z.string().min(2, 'Role name is required'),
  role_type: z.enum(['lead', 'supporting', 'extra', 'voiceover']).default('lead'),
  gender_requirement: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  age_min: z.coerce.number().min(0).max(120).optional(),
  age_max: z.coerce.number().min(0).max(120).optional(),
  pay_rate: z.string().optional(),
  description: z.string().optional(),
})

export const addTalentToPipelineSchema = z.object({
  casting_call_id: z.string().min(1, 'Casting project ID is required'),
  talent_id: z.string().min(1, 'Talent is required'),
  casting_role_id: z.string().optional().nullable(),
  stage: z.enum(pipelineStages).default('shortlisted'),
  proposed_fee: z.coerce.number().optional().nullable(),
  currency: z.string().default('PKR'),
  agent_pitch_note: z.string().optional().nullable(),
})

export const bulkUpdateStageSchema = z.object({
  submissionIds: z.array(z.string().min(1)).min(1, 'At least one candidate must be selected'),
  newStage: z.enum(pipelineStages),
})

export type MoveCandidateStageInput = z.infer<typeof moveCandidateStageSchema>
export type SubmitToClientInput = z.infer<typeof submitToClientSchema>
export type CastingRoleInput = z.infer<typeof castingRoleSchema>
export type AddTalentToPipelineInput = z.infer<typeof addTalentToPipelineSchema>
export type BulkUpdateStageInput = z.infer<typeof bulkUpdateStageSchema>
