import { z } from 'zod'

export const castingCallSchema = z.object({
  title:               z.string().min(5, 'Title must be at least 5 characters').max(120),
  description:         z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category_id:         z.string().uuid('Select a category'),
  location:            z.string().min(2, 'Location is required'),
  shoot_date:          z.string().optional().or(z.literal('')),  // YYYY-MM-DD
  application_deadline: z.string().optional().or(z.literal('')), // ISO datetime
  compensation:        z.string().max(200).optional().or(z.literal('')),
  requirements_json:   z.any().optional(),
  status: z.enum(['draft', 'open', 'closed', 'cancelled']),
}).refine(
  (data) => {
    if (!data.application_deadline) return true
    const deadline = new Date(data.application_deadline)
    if (isNaN(deadline.getTime())) return false
    return deadline.getTime() > Date.now()
  },
  {
    message: 'Application deadline must be in the future',
    path: ['application_deadline'],
  }
)

export type CastingCallFormData = z.infer<typeof castingCallSchema>
