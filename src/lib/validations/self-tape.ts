import { z } from 'zod'

export const requestSelfTapeSchema = z.object({
  casting_call_id: z.string().min(1, 'Casting project ID is required'),
  casting_role_id: z.string().optional().or(z.literal('')).nullable(),
  talent_id: z.string().min(1, 'Talent ID is required'),
  client_id: z.string().optional().or(z.literal('')).nullable(),
  instructions: z.string().min(10, 'Provide scene instructions and framing notes (e.g. Medium close-up, natural lighting)'),
  sides_script_url: z.string().optional().or(z.literal('')).nullable(),
  deadline_at: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid deadline timestamp'),
})

export const submitSelfTapeSchema = z.object({
  self_tape_request_id: z.string().min(1, 'Self tape request ID is required'),
  video_storage_path: z.string().min(1, 'Video file path is required'),
  talent_notes: z.string().optional(),
  video_duration_sec: z.coerce.number().optional(),
  file_size_bytes: z.coerce.number().optional(),
})

export const selfTapeReviewSchema = z.object({
  self_tape_submission_id: z.string().min(1, 'Submission ID is required'),
  timestamp_sec: z.coerce.number().optional(),
  comments: z.string().min(2, 'Comment cannot be blank'),
  score: z.coerce.number().min(0).max(10).optional(),
  decision: z.enum(['shortlist', 'pass', 're_tape', 'select']).optional(),
})

export type RequestSelfTapeInput = z.infer<typeof requestSelfTapeSchema>
export type SubmitSelfTapeInput = z.infer<typeof submitSelfTapeSchema>
export type SelfTapeReviewInput = z.infer<typeof selfTapeReviewSchema>
