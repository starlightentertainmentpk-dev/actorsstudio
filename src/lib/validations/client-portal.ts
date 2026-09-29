import { z } from 'zod'

export const clientBriefSchema = z.object({
  project_title: z.string().min(3, 'Project title must be at least 3 characters'),
  target_category_id: z.string().uuid().optional().or(z.literal('')),
  gender_preference: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  age_range_min: z.coerce.number().min(0).max(100).optional(),
  age_range_max: z.coerce.number().min(0).max(100).optional(),
  shoot_dates: z.string().optional(),
  budget_range: z.string().optional(),
  location: z.string().optional(),
  raw_brief_text: z.string().min(10, 'Please provide details about the project requirements (minimum 10 characters)'),
}).refine((data) => {
  if (data.age_range_min !== undefined && data.age_range_max !== undefined && data.age_range_min > 0 && data.age_range_max > 0) {
    return data.age_range_min <= data.age_range_max
  }
  return true
}, {
  message: 'Minimum age cannot be greater than maximum age',
  path: ['age_range_max'],
})

export type ClientBriefFormData = z.infer<typeof clientBriefSchema>

export const candidateReviewSchema = z.object({
  submission_id: z.string().min(1, 'Submission ID is required'),
  decision: z.enum(['shortlist', 'reject', 'audition_request']),
  feedback: z.string().max(1000, 'Feedback must be under 1000 characters').optional(),
})

export type CandidateReviewFormData = z.infer<typeof candidateReviewSchema>
