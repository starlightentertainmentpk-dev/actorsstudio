import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from './invoice-pdf'
import { Invoice } from '@/types/finance'

describe('Invoice PDF Generation Engine', () => {
  const sampleInvoice: Invoice = {
    id: 'inv-test-01',
    organization_id: 'org-test-pk',
    client_id: 'client-dawn-films',
    invoice_number: 'INV-2026-9812',
    currency: 'PKR',
    subtotal: 300000,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 300000,
    amount_paid: 150000,
    status: 'partially_paid',
    due_date: '2026-11-15',
    payment_terms: '50% Advance, 50% on Wrap',
    notes: 'Commercial shoot appearance fee for 2 talent days.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'client-dawn-films',
      company_name: 'Dawn Films & Media',
      billing_email: 'accounts@dawnfilms.pk',
      address: 'Phase 6, DHA',
      city: 'Karachi',
      country: 'Pakistan',
      phone: '+92 21 3584 9200',
    },
    deal: {
      id: 'deal-01',
      deal_name: 'Summer Campaign 2026',
    },
    items: [
      {
        id: 'item-1',
        invoice_id: 'inv-test-01',
        description: 'Principal Actor Performance Fee — 2 Shoot Days',
        quantity: 1,
        unit_price: 250000,
        line_total: 250000,
      },
      {
        id: 'item-2',
        invoice_id: 'inv-test-01',
        description: 'Wardrobe Fitting & Rehearsal Day',
        quantity: 1,
        unit_price: 50000,
        line_total: 50000,
      },
    ],
  }

  it('renders a valid binary PDF buffer with %PDF- header', async () => {
    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, { invoice: sampleInvoice }) as any
    )

    expect(buffer).toBeDefined()
    expect(buffer.length).toBeGreaterThan(1000)
    // Check standard PDF magic bytes
    const header = buffer.subarray(0, 5).toString('utf-8')
    expect(header).toBe('%PDF-')
  })
})
