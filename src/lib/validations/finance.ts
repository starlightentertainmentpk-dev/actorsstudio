import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
})

export const createInvoiceSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  clientId: z.string().min(1, 'Client selection is required'),
  dealId: z.string().optional().nullable(),
  currency: z.string().min(1, 'Currency is required').default('PKR'),
  dueDate: z.string().min(1, 'Due date is required'),
  paymentTerms: z.string().min(1, 'Payment terms are required').default('Net 30'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
})

export const recordPaymentSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  amountPaid: z.coerce.number().positive('Amount paid must be greater than 0'),
  currency: z.string().min(1).default('PKR'),
  paymentMethod: z.enum([
    'bank_transfer',
    'stripe',
    'jazzcash',
    'easypaisa',
    'cheque',
    'cash',
    'other',
  ]),
  transactionReference: z.string().optional().nullable(),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional().nullable(),
})

export const createExpenseSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  bookingId: z.string().optional().nullable(),
  category: z.enum([
    'travel',
    'wardrobe',
    'accommodation',
    'production',
    'marketing',
    'other',
  ]),
  amount: z.coerce.number().positive('Expense amount must be greater than 0'),
  currency: z.string().min(1).default('PKR'),
  description: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  expenseDate: z.string().min(1, 'Expense date is required'),
})

export const updateCommissionStatusSchema = z.object({
  commissionRecordId: z.string().min(1, 'Commission Record ID is required'),
  status: z.enum(['accrued', 'payable', 'paid']),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateCommissionStatusInput = z.infer<typeof updateCommissionStatusSchema>
