'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Invoice,
  Payment,
  CommissionRecord,
  Expense,
  FinanceOverviewStats,
  InvoiceStatus,
  TalentEarningItem,
} from '@/types/finance'
import {
  calculateAgingDays,
  calculateCommissionSplit,
} from '@/lib/finance/commission'
import {
  createInvoiceAction,
  recordPaymentAction,
  createExpenseAction,
  updateCommissionStatusAction,
} from '@/app/(dashboard)/agency/finance/actions'

export const INITIAL_DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv-shan-2026-01',
    organization_id: 'default-org',
    client_id: 'c4-shan-foods',
    deal_id: 'deal-shan-ramadan',
    invoice_number: 'INV-2026-1042',
    currency: 'PKR',
    subtotal: 1200000,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 1200000,
    amount_paid: 600000,
    status: 'partially_paid',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString().split('T')[0],
    payment_terms: '50% Advance, 50% on Wrap',
    notes: 'Ramadan 2026 Commercial Hero Lead Performance & Usage License',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    client: {
      id: 'c4-shan-foods',
      company_name: 'Shan Foods Global',
      billing_email: 'accounts@shanfoods.com',
      address: 'Plot 29, Sector 23, Korangi Industrial Area',
      city: 'Karachi',
      country: 'Pakistan',
      phone: '+92 21 3505 3000',
    },
    deal: {
      id: 'deal-shan-ramadan',
      deal_name: 'Shan Foods Festive Ramadan TVC & Digital Campaign',
    },
    items: [
      {
        id: 'item-shan-1',
        invoice_id: 'inv-shan-2026-01',
        description: 'Lead Performance Fee (Zara Noor) — 3 Shoot Days',
        quantity: 1,
        unit_price: 1000000,
        line_total: 1000000,
      },
      {
        id: 'item-shan-2',
        invoice_id: 'inv-shan-2026-01',
        description: 'Broadcast & OTT Digital Usage License (1 Year)',
        quantity: 1,
        unit_price: 200000,
        line_total: 200000,
      },
    ],
  },
  {
    id: 'inv-pepsi-2026-02',
    organization_id: 'default-org',
    client_id: 'c3-multiverse',
    deal_id: 'deal-pepsi-series',
    invoice_number: 'INV-2026-1038',
    currency: 'PKR',
    subtotal: 2500000,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 2500000,
    amount_paid: 2500000,
    status: 'paid',
    due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    payment_terms: 'Net 30',
    notes: 'Pepsi Youth Anthem Shoot & Global Digital Rights',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    client: {
      id: 'c3-multiverse',
      company_name: 'Multiverse Productions',
      billing_email: 'finance@multiversepk.com',
      address: 'Gulberg III, Main Boulevard',
      city: 'Lahore',
      country: 'Pakistan',
      phone: '+92 42 3577 8890',
    },
    deal: {
      id: 'deal-pepsi-series',
      deal_name: 'Pepsi Youth Music & Sports Anthem Series',
    },
    items: [
      {
        id: 'item-pepsi-1',
        invoice_id: 'inv-pepsi-2026-02',
        description: 'Lead Performance & Stunts (Bilal Khan) — 4 Shoot Days',
        quantity: 1,
        unit_price: 2000000,
        line_total: 2000000,
      },
      {
        id: 'item-pepsi-2',
        invoice_id: 'inv-pepsi-2026-02',
        description: 'Exclusivity & Pan-Asian Digital Rights',
        quantity: 1,
        unit_price: 500000,
        line_total: 500000,
      },
    ],
  },
  {
    id: 'inv-khaadi-2026-03',
    organization_id: 'default-org',
    client_id: 'c2-khaadi',
    deal_id: 'deal-khaadi-lawn',
    invoice_number: 'INV-2026-1029',
    currency: 'PKR',
    subtotal: 800000,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 50000,
    total_amount: 750000,
    amount_paid: 0,
    status: 'overdue',
    due_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString().split('T')[0],
    payment_terms: 'Net 15',
    notes: 'Fashion Lookbook & Catalog Shoot in Islamabad',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 38).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 38).toISOString(),
    client: {
      id: 'c2-khaadi',
      company_name: 'Khaadi Fashion Brand',
      billing_email: 'accounts.payable@khaadi.com',
      address: 'Clifton Block 2',
      city: 'Karachi',
      country: 'Pakistan',
      phone: '+92 21 111 542 234',
    },
    deal: {
      id: 'deal-khaadi-lawn',
      deal_name: 'Khaadi Festive Lawn 2026 Campaign',
    },
    items: [
      {
        id: 'item-kh-1',
        invoice_id: 'inv-khaadi-2026-03',
        description: 'Fashion Editorial Shoot (Mahnoor Sheikh) — 2 Days',
        quantity: 1,
        unit_price: 800000,
        line_total: 800000,
      },
    ],
  },
  {
    id: 'inv-dawn-2026-04',
    organization_id: 'default-org',
    client_id: 'c1-dawn-films',
    deal_id: 'deal-dawn-feature',
    invoice_number: 'INV-2026-1051',
    currency: 'PKR',
    subtotal: 1800000,
    tax_rate: 5,
    tax_amount: 90000,
    discount_amount: 0,
    total_amount: 1890000,
    amount_paid: 0,
    status: 'sent',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString().split('T')[0],
    payment_terms: 'Net 30',
    notes: 'Feature Film Principal Photography (10-day block retainer)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    client: {
      id: 'c1-dawn-films',
      company_name: 'Dawn Films & Media',
      billing_email: 'accounts@dawnfilms.pk',
      address: 'Phase 6, DHA',
      city: 'Karachi',
      country: 'Pakistan',
      phone: '+92 21 3584 9200',
    },
    deal: {
      id: 'deal-dawn-feature',
      deal_name: 'Karachi Confidential Cinema Feature',
    },
    items: [
      {
        id: 'item-dawn-1',
        invoice_id: 'inv-dawn-2026-04',
        description: 'Principal Actor Feature Contract (Zara Noor) — 10 Days',
        quantity: 1,
        unit_price: 1800000,
        line_total: 1800000,
      },
    ],
  },
]

export const INITIAL_DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-01',
    organization_id: 'default-org',
    invoice_id: 'inv-pepsi-2026-02',
    client_id: 'c3-multiverse',
    amount_paid: 1250000,
    currency: 'PKR',
    payment_method: 'bank_transfer',
    transaction_reference: 'HBL-PKR-4891028',
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString().split('T')[0],
    notes: 'Advance 50% retainer received',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    client: { id: 'c3-multiverse', company_name: 'Multiverse Productions' },
    invoice: { id: 'inv-pepsi-2026-02', invoice_number: 'INV-2026-1038', total_amount: 2500000 },
  },
  {
    id: 'pay-02',
    organization_id: 'default-org',
    invoice_id: 'inv-pepsi-2026-02',
    client_id: 'c3-multiverse',
    amount_paid: 1250000,
    currency: 'PKR',
    payment_method: 'bank_transfer',
    transaction_reference: 'HBL-PKR-5109283',
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    notes: 'Final settlement on project wrap',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    client: { id: 'c3-multiverse', company_name: 'Multiverse Productions' },
    invoice: { id: 'inv-pepsi-2026-02', invoice_number: 'INV-2026-1038', total_amount: 2500000 },
  },
  {
    id: 'pay-03',
    organization_id: 'default-org',
    invoice_id: 'inv-shan-2026-01',
    client_id: 'c4-shan-foods',
    amount_paid: 600000,
    currency: 'PKR',
    payment_method: 'bank_transfer',
    transaction_reference: 'SCB-PKR-9847120',
    payment_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0],
    notes: '50% Advance shoot commencement',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    client: { id: 'c4-shan-foods', company_name: 'Shan Foods Global' },
    invoice: { id: 'inv-shan-2026-01', invoice_number: 'INV-2026-1042', total_amount: 1200000 },
  },
]

export const INITIAL_DEMO_COMMISSIONS: CommissionRecord[] = [
  {
    id: 'comm-01',
    organization_id: 'default-org',
    deal_id: 'deal-shan-ramadan',
    booking_id: 'b-shan-01',
    talent_id: 't-zara-noor',
    gross_amount: 1200000,
    agency_commission_pct: 20,
    agency_commission_amount: 240000,
    agent_commission_amount: 24000,
    talent_net_amount: 960000,
    currency: 'PKR',
    status: 'payable',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    talent: {
      id: 't-zara-noor',
      full_name: 'Zara Noor',
      stage_name: 'Zara Noor',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    deal: { id: 'deal-shan-ramadan', deal_name: 'Shan Foods Festive Ramadan TVC' },
    booking: {
      id: 'b-shan-01',
      project_name: 'Shan Foods Ramadan 2026 Campaign',
      shoot_date_start: '2026-11-01',
      shoot_date_end: '2026-11-03',
    },
  },
  {
    id: 'comm-02',
    organization_id: 'default-org',
    deal_id: 'deal-pepsi-series',
    booking_id: 'b-pepsi-01',
    talent_id: 't-bilal-khan',
    gross_amount: 2500000,
    agency_commission_pct: 20,
    agency_commission_amount: 500000,
    agent_commission_amount: 50000,
    talent_net_amount: 2000000,
    currency: 'PKR',
    status: 'paid',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    talent: {
      id: 't-bilal-khan',
      full_name: 'Bilal Khan',
      stage_name: 'Bilal Khan',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    deal: { id: 'deal-pepsi-series', deal_name: 'Pepsi Youth Music Anthem' },
    booking: {
      id: 'b-pepsi-01',
      project_name: 'Pepsi Youth Anthem Series',
      shoot_date_start: '2026-11-15',
      shoot_date_end: '2026-11-18',
    },
  },
  {
    id: 'comm-03',
    organization_id: 'default-org',
    deal_id: 'deal-khaadi-lawn',
    booking_id: 'b-kh-01',
    talent_id: 't-mahnoor-s',
    gross_amount: 800000,
    agency_commission_pct: 20,
    agency_commission_amount: 160000,
    agent_commission_amount: 16000,
    talent_net_amount: 640000,
    currency: 'PKR',
    status: 'accrued',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 38).toISOString(),
    talent: {
      id: 't-mahnoor-s',
      full_name: 'Mahnoor Sheikh',
      stage_name: 'Mahnoor Sheikh',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    },
    deal: { id: 'deal-khaadi-lawn', deal_name: 'Khaadi Festive Lawn 2026' },
    booking: {
      id: 'b-kh-01',
      project_name: 'Khaadi Summer Editorial',
      shoot_date_start: '2026-10-15',
      shoot_date_end: '2026-10-16',
    },
  },
]

export const INITIAL_DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-01',
    organization_id: 'default-org',
    booking_id: 'b-shan-01',
    category: 'travel',
    amount: 45000,
    currency: 'PKR',
    description: 'Roundtrip Flights KHI-LHE for Wardrobe fittings (Zara Noor)',
    receipt_url: 'https://example.com/receipts/flight-45k.pdf',
    expense_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    booking: { id: 'b-shan-01', project_name: 'Shan Foods Ramadan 2026 Campaign' },
  },
  {
    id: 'exp-02',
    organization_id: 'default-org',
    booking_id: 'b-pepsi-01',
    category: 'wardrobe',
    amount: 75000,
    currency: 'PKR',
    description: 'Custom sports styling kit & leather jackets (Bilal Khan)',
    receipt_url: 'https://example.com/receipts/wardrobe-75k.pdf',
    expense_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    booking: { id: 'b-pepsi-01', project_name: 'Pepsi Youth Anthem Series' },
  },
  {
    id: 'exp-03',
    organization_id: 'default-org',
    category: 'production',
    amount: 30000,
    currency: 'PKR',
    description: 'High-res studio comp card printing and portfolio distribution',
    receipt_url: null,
    expense_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
]

export function useFinance() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('actors_studio_invoices')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DEMO_INVOICES
  })

  const [payments, setPayments] = useState<Payment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('actors_studio_payments')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DEMO_PAYMENTS
  })

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('actors_studio_commissions')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DEMO_COMMISSIONS
  })

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('actors_studio_expenses')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_DEMO_EXPENSES
  })

  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('actors_studio_invoices', JSON.stringify(invoices))
    }
  }, [invoices])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('actors_studio_payments', JSON.stringify(payments))
    }
  }, [payments])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('actors_studio_commissions', JSON.stringify(commissions))
    }
  }, [commissions])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('actors_studio_expenses', JSON.stringify(expenses))
    }
  }, [expenses])

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesCurrency =
        currencyFilter === 'ALL' || inv.currency.toUpperCase() === currencyFilter.toUpperCase()
      const matchesStatus =
        statusFilter === 'all' || inv.status === statusFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.client?.company_name.toLowerCase().includes(q) ||
        inv.deal?.deal_name.toLowerCase().includes(q) ||
        inv.notes?.toLowerCase().includes(q)

      return matchesCurrency && matchesStatus && matchesQuery
    })
  }, [invoices, currencyFilter, statusFilter, searchQuery])

  // Aggregated Financial KPIs
  const stats: FinanceOverviewStats = useMemo(() => {
    let totalInvoiced = 0
    let paymentsCollected = 0
    let aging30 = 0
    let aging60 = 0
    let aging60Plus = 0
    let overdueTotal = 0

    invoices.forEach((inv) => {
      totalInvoiced += inv.total_amount
      paymentsCollected += inv.amount_paid || 0
      const balance = Math.max(0, inv.total_amount - (inv.amount_paid || 0))

      if (balance > 0) {
        const { isOverdue, agingCategory } = calculateAgingDays(inv.due_date)
        if (isOverdue) {
          overdueTotal += balance
          if (agingCategory === '<30d') aging30 += balance
          else if (agingCategory === '30-60d') aging60 += balance
          else if (agingCategory === '60d+') aging60Plus += balance
        }
      }
    })

    const outstandingBalance = Math.max(0, totalInvoiced - paymentsCollected)
    const collectionRatePct = totalInvoiced > 0 ? (paymentsCollected / totalInvoiced) * 100 : 0

    // Agency revenue from commissions
    const agencyRevenueEarned = commissions.reduce(
      (sum, c) => sum + (c.agency_commission_amount || 0),
      0
    )

    // Talent payouts pending
    const talentPayoutsPending = commissions
      .filter((c) => c.status !== 'paid')
      .reduce((sum, c) => sum + (c.talent_net_amount || 0), 0)

    // Total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const netProfit = agencyRevenueEarned - totalExpenses

    return {
      totalInvoiced: Math.round(totalInvoiced),
      paymentsCollected: Math.round(paymentsCollected),
      outstandingBalance: Math.round(outstandingBalance),
      collectionRatePct: Math.round(collectionRatePct * 10) / 10,
      agencyRevenueEarned: Math.round(agencyRevenueEarned),
      talentPayoutsPending: Math.round(talentPayoutsPending),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      aging: {
        current30Days: Math.round(aging30),
        days31To60: Math.round(aging60),
        days61Plus: Math.round(aging60Plus),
        overdueTotal: Math.round(overdueTotal),
      },
    }
  }, [invoices, commissions, expenses])

  // Actions
  const handleCreateInvoice = async (data: {
    orgId: string
    clientId: string
    clientName?: string
    dealId?: string | null
    dealName?: string
    currency: string
    dueDate: string
    paymentTerms: string
    items: { description: string; quantity: number; unitPrice: number }[]
    taxRate?: number
    discountAmount?: number
    notes?: string | null
  }) => {
    // 1. Call server action
    const res = await createInvoiceAction(data)

    // 2. Optimistic local state update
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const taxRate = data.taxRate || 0
    const taxAmount = (subtotal * taxRate) / 100
    const discount = data.discountAmount || 0
    const totalAmount = Math.max(0, subtotal + taxAmount - discount)

    const newInvoice: Invoice = {
      id: res.invoiceId || `inv-${Date.now()}`,
      organization_id: data.orgId,
      client_id: data.clientId,
      deal_id: data.dealId || null,
      invoice_number: res.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      currency: data.currency,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_amount: discount,
      total_amount: totalAmount,
      amount_paid: 0,
      status: 'draft',
      due_date: data.dueDate,
      payment_terms: data.paymentTerms,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: {
        id: data.clientId,
        company_name: data.clientName || 'Selected Client',
        billing_email: 'accounts@client.com',
      },
      deal: data.dealName ? { id: data.dealId || '', deal_name: data.dealName } : undefined,
      items: data.items.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.quantity * i.unitPrice,
      })),
      payments: [],
    }

    setInvoices((prev) => [newInvoice, ...prev])
    return newInvoice
  }

  const handleRecordPayment = async (data: {
    orgId: string
    invoiceId: string
    clientId: string
    clientName?: string
    amountPaid: number
    currency: string
    paymentMethod: any
    transactionReference?: string | null
    paymentDate: string
    notes?: string | null
  }) => {
    await recordPaymentAction(data)

    // Update invoices
    let updatedInvNumber = ''
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === data.invoiceId) {
          updatedInvNumber = inv.invoice_number
          const currentPaid = Number(inv.amount_paid || 0)
          const newPaid = currentPaid + Number(data.amountPaid)
          const newStatus: InvoiceStatus =
            newPaid >= Number(inv.total_amount) ? 'paid' : 'partially_paid'

          return {
            ...inv,
            amount_paid: newPaid,
            status: newStatus,
            updated_at: new Date().toISOString(),
          }
        }
        return inv
      })
    )

    // Add payment entry
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      organization_id: data.orgId,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      amount_paid: Number(data.amountPaid),
      currency: data.currency,
      payment_method: data.paymentMethod,
      transaction_reference: data.transactionReference || null,
      payment_date: data.paymentDate,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      client: { id: data.clientId, company_name: data.clientName || 'Client' },
      invoice: {
        id: data.invoiceId,
        invoice_number: updatedInvNumber || 'INV-REF',
        total_amount: data.amountPaid,
      },
    }

    setPayments((prev) => [newPayment, ...prev])
    return newPayment
  }

  const handleCreateExpense = async (data: {
    orgId: string
    bookingId?: string | null
    projectName?: string
    category: string
    amount: number
    currency: string
    description?: string | null
    receiptUrl?: string | null
    expenseDate: string
  }) => {
    await createExpenseAction(data)

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      organization_id: data.orgId,
      booking_id: data.bookingId || null,
      category: data.category,
      amount: Number(data.amount),
      currency: data.currency,
      description: data.description || null,
      receipt_url: data.receiptUrl || null,
      expense_date: data.expenseDate,
      created_at: new Date().toISOString(),
      booking: data.projectName ? { id: data.bookingId || '', project_name: data.projectName } : undefined,
    }

    setExpenses((prev) => [newExpense, ...prev])
    return newExpense
  }

  const handleUpdateCommissionStatus = async (
    commissionRecordId: string,
    status: 'accrued' | 'payable' | 'paid'
  ) => {
    await updateCommissionStatusAction({ commissionRecordId, status })

    setCommissions((prev) =>
      prev.map((c) => (c.id === commissionRecordId ? { ...c, status } : c))
    )
  }

  // Talent-filtered earnings (for talent view)
  const getTalentEarnings = (talentId: string = 't-zara-noor') => {
    const talentCommissions = commissions.filter(
      (c) => c.talent_id === talentId || c.talent?.id === talentId
    )

    const items: TalentEarningItem[] = talentCommissions.map((c) => ({
      id: c.id,
      commission_record_id: c.id,
      booking_id: c.booking_id,
      deal_id: c.deal_id,
      project_name: c.booking?.project_name || c.deal?.deal_name || 'Production Shoot',
      client_name: 'Studio Client Production',
      shoot_dates: c.booking ? `${c.booking.shoot_date_start} to ${c.booking.shoot_date_end}` : 'Completed',
      gross_fee: c.gross_amount,
      agency_commission_pct: c.agency_commission_pct,
      agency_commission_deducted: c.agency_commission_amount,
      talent_net_payout: c.talent_net_amount,
      currency: c.currency,
      status: c.status,
      created_at: c.created_at,
      paid_at: c.status === 'paid' ? c.created_at : null,
    }))

    const totalEarnedGross = items.reduce((s, i) => s + i.gross_fee, 0)
    const totalAgencyCommission = items.reduce((s, i) => s + i.agency_commission_deducted, 0)
    const totalNetPayouts = items.reduce((s, i) => s + i.talent_net_payout, 0)
    const paidToDate = items
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.talent_net_payout, 0)
    const pendingBalance = totalNetPayouts - paidToDate

    return {
      items,
      summary: {
        totalEarnedGross,
        totalAgencyCommission,
        totalNetPayouts,
        paidToDate,
        pendingBalance,
      },
    }
  }

  return {
    invoices,
    filteredInvoices,
    payments,
    commissions,
    expenses,
    stats,
    currencyFilter,
    setCurrencyFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    createInvoice: handleCreateInvoice,
    recordPayment: handleRecordPayment,
    createExpense: handleCreateExpense,
    updateCommissionStatus: handleUpdateCommissionStatus,
    getTalentEarnings,
  }
}
