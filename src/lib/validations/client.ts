import { z } from 'zod'

export const clientSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(2).default('Entertainment & Film'),
  website: z
    .string()
    .refine(
      (val) => !val || val === '' || /^https?:\/\/.+/i.test(val) || /^[\w.-]+\.[a-z]{2,}/i.test(val),
      'Please enter a valid website URL'
    )
    .optional()
    .or(z.literal('')),
  country: z.string().default('Pakistan'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional().or(z.literal('')),
  billing_email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.enum(['lead', 'prospect', 'active', 'inactive']).default('active'),
  internal_notes: z.string().optional().or(z.literal('')),
})

export const clientContactSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  full_name: z.string().min(2, 'Contact name is required'),
  role_title: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  whatsapp_number: z.string().optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
})

export const agencyTaskSchema = z.object({
  client_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(3, 'Task title is required'),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed']).default('todo'),
  due_date: z.string().optional().or(z.literal('')),
})

export type ClientInput = z.infer<typeof clientSchema>
export type ClientContactInput = z.infer<typeof clientContactSchema>
export type AgencyTaskInput = z.infer<typeof agencyTaskSchema>
