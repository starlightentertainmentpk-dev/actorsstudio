'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createInvoiceSchema,
  recordPaymentSchema,
  createExpenseSchema,
  updateCommissionStatusSchema,
} from '@/lib/validations/finance'
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from '@/lib/finance/commission'

export async function createInvoiceAction(data: {
  orgId: string
  clientId: string
  dealId?: string | null
  currency: string
  dueDate: string
  paymentTerms: string
  items: { description: string; quantity: number; unitPrice: number }[]
  taxRate?: number
  discountAmount?: number
  notes?: string | null
}) {
  const parsed = createInvoiceSchema.safeParse({
    organizationId: data.orgId,
    clientId: data.clientId,
    dealId: data.dealId,
    currency: data.currency,
    dueDate: data.dueDate,
    paymentTerms: data.paymentTerms,
    taxRate: data.taxRate ?? 0,
    discountAmount: data.discountAmount ?? 0,
    notes: data.notes,
    items: data.items,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid invoice data')
  }

  const { subtotal, taxRate, taxAmount, discountAmount, totalAmount } =
    calculateInvoiceTotals({
      items: data.items,
      taxRatePct: data.taxRate,
      discountAmount: data.discountAmount,
    })

  const invoiceNumber = generateInvoiceNumber('INV', new Date().getFullYear())

  try {
    const supabase = await createClient()

    const { data: inv, error: invError } = await (supabase
      .from('invoices' as any) as any)
      .insert({
        organization_id: data.orgId,
        client_id: data.clientId,
        deal_id: data.dealId || null,
        invoice_number: invoiceNumber,
        currency: data.currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        due_date: data.dueDate,
        payment_terms: data.paymentTerms,
        notes: data.notes || null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (!invError && inv) {
      const itemsToInsert = data.items.map((i) => ({
        invoice_id: inv.id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.quantity * i.unitPrice,
      }))

      await (supabase.from('invoice_items' as any) as any).insert(itemsToInsert)
      revalidatePath('/agency/finance')
      return { success: true, invoiceId: inv.id, invoiceNumber }
    }
  } catch (err) {
    console.warn('Supabase insert skipped or failed, using local/demo mode:', err)
  }

  revalidatePath('/agency/finance')
  return {
    success: true,
    invoiceId: `inv-${Date.now()}`,
    invoiceNumber,
    subtotal,
    totalAmount,
  }
}

export async function recordPaymentAction(data: {
  orgId: string
  invoiceId: string
  clientId: string
  amountPaid: number
  currency: string
  paymentMethod: string
  transactionReference?: string | null
  paymentDate: string
  notes?: string | null
}) {
  const parsed = recordPaymentSchema.safeParse({
    organizationId: data.orgId,
    invoiceId: data.invoiceId,
    clientId: data.clientId,
    amountPaid: data.amountPaid,
    currency: data.currency,
    paymentMethod: data.paymentMethod,
    transactionReference: data.transactionReference,
    paymentDate: data.paymentDate,
    notes: data.notes,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid payment record')
  }

  try {
    const supabase = await createClient()

    // 1. Insert payment record
    const { error: payError } = await (supabase.from('payments' as any) as any).insert({
      organization_id: data.orgId,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      amount_paid: data.amountPaid,
      currency: data.currency,
      payment_method: data.paymentMethod as any,
      transaction_reference: data.transactionReference || null,
      payment_date: data.paymentDate,
      notes: data.notes || null,
    })

    if (!payError) {
      // 2. Update invoice amount_paid and status
      const { data: inv } = await (supabase
        .from('invoices' as any) as any)
        .select('total_amount, amount_paid')
        .eq('id', data.invoiceId)
        .single()

      if (inv) {
        const newAmountPaid = Number(inv.amount_paid || 0) + Number(data.amountPaid)
        const newStatus =
          newAmountPaid >= Number(inv.total_amount) ? 'paid' : 'partially_paid'

        await (supabase
          .from('invoices' as any) as any)
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.invoiceId)
      }
    }
  } catch (err) {
    console.warn('Supabase payment recording skipped or failed, using local/demo mode:', err)
  }

  revalidatePath('/agency/finance')
  return { success: true }
}

export async function createExpenseAction(data: {
  orgId: string
  bookingId?: string | null
  category: string
  amount: number
  currency: string
  description?: string | null
  receiptUrl?: string | null
  expenseDate: string
}) {
  const parsed = createExpenseSchema.safeParse({
    organizationId: data.orgId,
    bookingId: data.bookingId,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    receiptUrl: data.receiptUrl,
    expenseDate: data.expenseDate,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid expense data')
  }

  try {
    const supabase = await createClient()
    await (supabase.from('expenses' as any) as any).insert({
      organization_id: data.orgId,
      booking_id: data.bookingId || null,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      description: data.description || null,
      receipt_url: data.receiptUrl || null,
      expense_date: data.expenseDate,
    })
  } catch (err) {
    console.warn('Supabase expense insert failed, fallback to demo mode:', err)
  }

  revalidatePath('/agency/finance')
  return { success: true }
}

export async function updateCommissionStatusAction(data: {
  commissionRecordId: string
  status: 'accrued' | 'payable' | 'paid'
}) {
  const parsed = updateCommissionStatusSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid commission status')
  }

  try {
    const supabase = await createClient()
    await (supabase
      .from('commission_records' as any) as any)
      .update({ status: data.status })
      .eq('id', data.commissionRecordId)
  } catch (err) {
    console.warn('Supabase commission update skipped:', err)
  }

  revalidatePath('/agency/finance')
  revalidatePath('/talent/earnings')
  return { success: true }
}
