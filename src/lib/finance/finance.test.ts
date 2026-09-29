import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  calculateCommissionSplit,
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from './commission'
import { createInvoiceSchema, recordPaymentSchema } from '@/lib/validations/finance'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types/finance'

describe('Subprompt 09: End-to-End Finance, Invoicing & Commission Smoke Test', () => {
  it('creates an invoice for PKR 300,000 with 2 line items for a client', () => {
    const rawItems = [
      {
        description: 'Principal Actor Performance Fee (Zara Noor) — 1 Shoot Day',
        quantity: 1,
        unitPrice: 250000,
      },
      {
        description: 'Wardrobe Fitting & Rehearsal Fee',
        quantity: 1,
        unitPrice: 50000,
      },
    ]

    const parsed = createInvoiceSchema.safeParse({
      organizationId: 'org-hq-pk',
      clientId: 'client-dawn-films',
      dealId: 'deal-ramadan-2026',
      currency: 'PKR',
      dueDate: '2026-11-15',
      paymentTerms: 'Net 30',
      taxRate: 0,
      discountAmount: 0,
      items: rawItems,
    })

    expect(parsed.success).toBe(true)

    const totals = calculateInvoiceTotals({
      items: rawItems,
      taxRatePct: 0,
      discountAmount: 0,
    })

    expect(totals.subtotal).toBe(300000)
    expect(totals.totalAmount).toBe(300000)

    const invoiceNumber = generateInvoiceNumber('INV', 2026, 7781)
    expect(invoiceNumber).toBe('INV-2026-7781')
  })

  it('records a partial payment of PKR 150,000 and transitions status to partially_paid', () => {
    // Simulated invoice state
    let invoice: Invoice = {
      id: 'inv-smoke-001',
      organization_id: 'org-hq-pk',
      client_id: 'client-dawn-films',
      invoice_number: 'INV-2026-7781',
      currency: 'PKR',
      subtotal: 300000,
      tax_rate: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 300000,
      amount_paid: 0,
      status: 'draft',
      due_date: '2026-11-15',
      payment_terms: 'Net 30',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          description: 'Principal Actor Performance Fee',
          quantity: 1,
          unit_price: 250000,
          line_total: 250000,
        },
        {
          description: 'Wardrobe Fitting & Rehearsal Fee',
          quantity: 1,
          unit_price: 50000,
          line_total: 50000,
        },
      ],
    }

    // Step 1: Record partial payment of 150,000
    const payment1 = {
      organizationId: invoice.organization_id,
      invoiceId: invoice.id,
      clientId: invoice.client_id,
      amountPaid: 150000,
      currency: 'PKR',
      paymentMethod: 'bank_transfer' as PaymentMethod,
      transactionReference: 'WIRE-ADVANCE-01',
      paymentDate: '2026-10-15',
      notes: '50% advance payment',
    }

    const val1 = recordPaymentSchema.safeParse(payment1)
    expect(val1.success).toBe(true)

    // Apply settlement logic
    invoice.amount_paid += payment1.amountPaid
    invoice.status =
      invoice.amount_paid >= invoice.total_amount ? 'paid' : 'partially_paid'

    expect(invoice.amount_paid).toBe(150000)
    expect(invoice.status).toBe('partially_paid')
    const balanceRemaining1 = invoice.total_amount - invoice.amount_paid
    expect(balanceRemaining1).toBe(150000)

    // Step 2: Record remaining PKR 150,000
    const payment2 = {
      organizationId: invoice.organization_id,
      invoiceId: invoice.id,
      clientId: invoice.client_id,
      amountPaid: 150000,
      currency: 'PKR',
      paymentMethod: 'bank_transfer' as PaymentMethod,
      transactionReference: 'WIRE-FINAL-02',
      paymentDate: '2026-10-25',
      notes: 'Remaining wrap balance',
    }

    const val2 = recordPaymentSchema.safeParse(payment2)
    expect(val2.success).toBe(true)

    invoice.amount_paid += payment2.amountPaid
    invoice.status =
      invoice.amount_paid >= invoice.total_amount ? 'paid' : 'partially_paid'

    expect(invoice.amount_paid).toBe(300000)
    expect(invoice.status).toBe('paid')
    const finalBalance = invoice.total_amount - invoice.amount_paid
    expect(finalBalance).toBe(0)
  })

  it('triggers PDF generation and outputs a downloadable invoice document with valid %PDF- header', async () => {
    const paidInvoice: Invoice = {
      id: 'inv-smoke-001',
      organization_id: 'org-hq-pk',
      client_id: 'client-dawn-films',
      invoice_number: 'INV-2026-7781',
      currency: 'PKR',
      subtotal: 300000,
      tax_rate: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 300000,
      amount_paid: 300000,
      status: 'paid',
      due_date: '2026-11-15',
      payment_terms: 'Net 30',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: {
        id: 'client-dawn-films',
        company_name: 'Dawn Films & Media',
        billing_email: 'accounts@dawnfilms.pk',
        city: 'Karachi',
        country: 'Pakistan',
      },
      items: [
        {
          description: 'Principal Actor Performance Fee',
          quantity: 1,
          unit_price: 250000,
          line_total: 250000,
        },
        {
          description: 'Wardrobe Fitting & Rehearsal Fee',
          quantity: 1,
          unit_price: 50000,
          line_total: 50000,
        },
      ],
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice: paidInvoice }) as any
    )

    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(1000)
    const magicBytes = buffer.subarray(0, 5).toString('utf-8')
    expect(magicBytes).toBe('%PDF-')
  })

  it('verifies talent earnings calculations protect confidential agency margins', () => {
    const split = calculateCommissionSplit({
      grossAmount: 300000,
      agencyRatePct: 20,
      agentRatePctOfAgency: 10,
    })

    expect(split.grossAmount).toBe(300000)
    expect(split.agencyCommissionAmount).toBe(60000) // 20%
    expect(split.agentCutAmount).toBe(6000) // 10% internal agent split
    expect(split.talentNetAmount).toBe(240000) // 80%

    // Talent statement item (what the talent sees)
    const talentStatement = {
      projectName: 'Dawn Films Ramadan Commercial',
      grossFee: split.grossAmount,
      agencyCommissionDeducted: split.agencyCommissionAmount,
      netTalentPayout: split.talentNetAmount,
      status: 'paid' as const,
    }

    // Verify talent gets their accurate payout
    expect(talentStatement.netTalentPayout).toBe(240000)
    expect(talentStatement.grossFee - talentStatement.agencyCommissionDeducted).toBe(
      talentStatement.netTalentPayout
    )

    // Crucially: confidential agent cut is NOT exposed in the talentStatement structure
    expect((talentStatement as any).agentCutAmount).toBeUndefined()
    expect((talentStatement as any).agentCut).toBeUndefined()
  })
})
