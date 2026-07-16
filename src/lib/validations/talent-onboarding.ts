import { z } from 'zod'

export const step1Schema = z.object({
  full_name:   z.string().min(2, 'Full name is required'),
  stage_name:  z.string().optional().or(z.literal('')),
  dob:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date (YYYY-MM-DD)').optional().or(z.literal('')),
  gender:      z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  city:        z.string().min(2, 'City is required'),
  phone:       z.string().regex(/^(\+92|0)[0-9]{10}$/, 'Enter a valid Pakistani phone number').optional().or(z.literal('')),
})

export const step2Schema = z.object({
  category_id:     z.string().uuid('Select a category'),
  sub_category_id: z.string().uuid().optional().or(z.literal('')),
  experience_years: z.coerce.number().min(0).max(60),
  languages:       z.array(z.string()).min(1, 'Select at least one language'),
  skills:          z.array(z.string()),
  union_member:    z.boolean().default(false),
  is_available:    z.boolean().default(true),
  bio:             z.string().max(1000, 'Bio must be under 1000 characters').optional().or(z.literal('')),
  height_cm:       z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(100).max(250).optional()
  ),
  weight_kg:       z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(30).max(200).optional()
  ),
})

export const step3Schema = z.object({
  instagram_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  tiktok_url:    z.string().url('Enter a valid URL').optional().or(z.literal('')),
  youtube_url:   z.string().url('Enter a valid URL').optional().or(z.literal('')),
  facebook_url:  z.string().url('Enter a valid URL').optional().or(z.literal('')),
  website_url:   z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

export const step4Schema = z.object({
  profile_photo_url: z.string().url('Upload a profile photo'),
  reel_url:          z.string().url('Enter a valid URL').optional().or(z.literal('')),
})
