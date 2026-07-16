import { z } from 'zod'

export const producerStep1Schema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_type: z.enum([
    'production_house', 'brand', 'ad_agency',
    'independent_producer', 'casting_director'
  ]),
  website: z.string().url('Enter a valid website URL').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().or(z.literal('')),
  instagram_url: z.string().url('Enter a valid Instagram URL').optional().or(z.literal('')),
  linkedin_url:  z.string().url('Enter a valid LinkedIn URL').optional().or(z.literal('')),
})

export const producerStep2Schema = z.object({
  verification_docs_url: z.string().min(1, 'Upload at least one verification document'),
  representative_note: z.string().max(300, 'Note must be under 300 characters').optional().or(z.literal('')),
})
