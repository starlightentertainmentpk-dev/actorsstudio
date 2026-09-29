import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/lib/pdf/invoice-pdf'
import { Invoice } from '@/types/finance'
import { INITIAL_DEMO_INVOICES } from '@/hooks/useFinance'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const searchParams = request.nextUrl.searchParams
  const download = searchParams.get('download') === 'true'
  const disposition = download ? 'attachment' : 'inline'

  let invoice: Invoice | null = null

  try {
    const supabase = await createClient()
    const { data: dbInvoice, error } = await (supabase
      .from('invoices' as any) as any)
      .select(`
        *,
        client:clients(id, company_name, billing_email, address, city, country, phone),
        deal:deals(id, deal_name),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .eq('id', id)
      .single()

    if (!error && dbInvoice) {
      invoice = dbInvoice as any
    }
  } catch (err) {
    console.warn('Could not fetch invoice from Supabase, checking demo repository:', err)
  }

  // Fallback to demo invoices if not found in db
  if (!invoice) {
    invoice = INITIAL_DEMO_INVOICES.find((inv) => inv.id === id || inv.invoice_number === id) || null
  }

  // If still not found, create a generic demo preview invoice
  if (!invoice) {
    invoice = {
      id: id || 'preview-inv',
      organization_id: 'default-org',
      client_id: 'client-preview',
      invoice_number: id.startsWith('INV-') ? id : `INV-2026-PREVIEW`,
      currency: 'PKR',
      subtotal: 500000,
      tax_rate: 0,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 500000,
      amount_paid: 250000,
      status: 'partially_paid',
      due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
      payment_terms: 'Net 30',
      notes: 'Commercial Talent Appearance & Performance Engagement',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: {
        id: 'client-preview',
        company_name: 'Premier Brand Production House',
        billing_email: 'accounts@production.pk',
        address: '45-C Commercial Avenue, Phase 5, DHA',
        city: 'Karachi',
        country: 'Pakistan',
        phone: '+92 21 3584 9200',
      },
      deal: {
        id: 'deal-preview',
        deal_name: 'Ramadan 2026 Festive TVC & Digital Campaign',
      },
      items: [
        {
          id: 'item-1',
          description: 'Lead Actor Performance Fee — 2 Shoot Days',
          quantity: 1,
          unit_price: 400000,
          line_total: 400000,
        },
        {
          id: 'item-2',
          description: 'Wardrobe Fitting & Rehearsal Day',
          quantity: 1,
          unit_price: 100000,
          line_total: 100000,
        },
      ],
    }
  }

  try {
    const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} /> as any)
    const filename = `${invoice.invoice_number || 'invoice'}.pdf`

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Error rendering invoice PDF:', error)
    return new Response(`Error rendering invoice PDF: ${error.message || error}`, {
      status: 500,
    })
  }
}
