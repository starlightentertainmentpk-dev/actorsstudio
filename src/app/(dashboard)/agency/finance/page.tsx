'use client'

import React, { useState } from 'react'
import { useFinance } from '@/hooks/useFinance'
import { Invoice, Payment, CommissionRecord, Expense } from '@/types/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DollarSign,
  Receipt,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Eye,
  FileText,
  User,
  Tag,
  ArrowRight,
  TrendingUp,
  Wallet,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance/commission'
import { CreateInvoiceModal } from '@/components/features/finance/CreateInvoiceModal'
import { RecordPaymentModal } from '@/components/features/finance/RecordPaymentModal'
import { InvoicePreviewModal } from '@/components/features/finance/InvoicePreviewModal'
import { CreateExpenseModal } from '@/components/features/finance/CreateExpenseModal'

export default function AgencyFinancePage() {
  const {
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
    createInvoice,
    recordPayment,
    createExpense,
    updateCommissionStatus,
  } = useFinance()

  const [activeTab, setActiveTab] = useState<
    'invoices' | 'payments' | 'commissions' | 'expenses'
  >('invoices')

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  const handleOpenPaymentModal = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoiceForPayment(invoice)
    } else {
      // Find first invoice with remaining balance
      const unpaid = invoices.find(
        (i) => i.total_amount > (i.amount_paid || 0)
      )
      setSelectedInvoiceForPayment(unpaid || invoices[0] || null)
    }
    setIsRecordPaymentOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Paid
          </span>
        )
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Partial
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="h-3 w-3" /> Sent
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
            Draft
          </span>
        )
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Direct Wire / IBFT'
      case 'stripe':
        return 'Stripe Online'
      case 'jazzcash':
        return 'JazzCash'
      case 'easypaisa':
        return 'EasyPaisa'
      case 'cheque':
        return 'Bank Cheque'
      case 'cash':
        return 'Petty Cash'
      default:
        return method
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
            <Receipt className="h-4 w-4" /> Commercial Financial Operating Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-heading">
            Finance & Invoicing Suite
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Multi-currency billing, automated 20% agency commissions, and settlement tracking
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {['ALL', 'PKR', 'USD', 'AED'].map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrencyFilter(cur)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-colors ${
                  currencyFilter === cur
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenPaymentModal()}
            className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Record Payment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateExpenseOpen(true)}
            className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
          >
            <Tag className="h-3.5 w-3.5 text-amber-400" /> Log Expense
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Total Invoiced
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-foreground tracking-tight">
              {formatCurrency(stats.totalInvoiced, currencyFilter === 'ALL' ? 'PKR' : currencyFilter)}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-indigo-400 font-medium">{invoices.length}</span> commercial invoices issued
            </p>
          </div>
        </div>

        {/* Card 2: Payments Collected */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Collected Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatCurrency(stats.paymentsCollected, currencyFilter === 'ALL' ? 'PKR' : currencyFilter)}
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, stats.collectionRatePct)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                {stats.collectionRatePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Outstanding Aging */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Outstanding Balance
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-amber-400 tracking-tight">
              {formatCurrency(stats.outstandingBalance, currencyFilter === 'ALL' ? 'PKR' : currencyFilter)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              {stats.aging.overdueTotal > 0 ? (
                <span className="text-red-400 font-medium">
                  {formatCurrency(stats.aging.overdueTotal, 'PKR')} Overdue
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">All current terms</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Agency Revenue Earned */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Agency Margin (20%)
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-purple-400 tracking-tight">
              {formatCurrency(stats.agencyRevenueEarned, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              Net profit: <span className="text-foreground font-mono">{formatCurrency(stats.netProfit, 'PKR')}</span>
            </p>
          </div>
        </div>

        {/* Card 5: Talent Payouts Pending */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Talent Payouts Pending
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold font-mono text-blue-400 tracking-tight">
              {formatCurrency(stats.talentPayoutsPending, 'PKR')}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">
              Payable upon wrap verification
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border/60">
        <div className="flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-indigo-500 text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="h-4 w-4" /> Invoices
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono">
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-indigo-500 text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Payments Recorded
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono">
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'commissions'
                ? 'border-indigo-500 text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Commission Split Ledger
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono">
              {commissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'border-indigo-500 text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="h-4 w-4" /> Operational Expenses
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono">
              {expenses.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Sub-Filters: Status & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'All', value: 'all' },
                { label: 'Partially Paid', value: 'partially_paid' },
                { label: 'Paid', value: 'paid' },
                { label: 'Sent', value: 'sent' },
                { label: 'Overdue', value: 'overdue' },
                { label: 'Draft', value: 'draft' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === s.value
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, client, deal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-card"
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice #</th>
                    <th className="py-3 px-4 font-semibold">Client & Deal</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Paid</th>
                    <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No invoices match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const balance = Math.max(0, inv.total_amount - (inv.amount_paid || 0))
                      const cur = inv.currency || 'PKR'

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-muted/20 transition-colors group"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground">
                              {inv.client?.company_name || 'Client'}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                              {inv.deal?.deal_name || 'Commercial Appearance'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(inv.due_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                            {formatCurrency(inv.total_amount, cur)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                            {formatCurrency(inv.amount_paid || 0, cur)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-red-400">
                            {formatCurrency(balance, cur)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(inv.status)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {balance > 0 && (
                                <button
                                  onClick={() => handleOpenPaymentModal(inv)}
                                  title="Record Payment"
                                  className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setPreviewInvoice(inv)}
                                title="Preview Invoice"
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <a
                                href={`/api/invoices/${inv.id}/pdf?download=true`}
                                download={`${inv.invoice_number}.pdf`}
                                title="Download PDF"
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-indigo-400 transition-colors inline-flex items-center"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Payments Recorded */}
      {activeTab === 'payments' && (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment Date</th>
                  <th className="py-3 px-4 font-semibold">Reference / Auth Code</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Linked Invoice</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(p.payment_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {p.transaction_reference || 'DIRECT-WIRE'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {p.client?.company_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-400">
                        {p.invoice?.invoice_number || 'INV-REF'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground font-medium">
                          <CreditCard className="h-3 w-3" />
                          {getPaymentMethodBadge(p.payment_method)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400 text-sm">
                        +{formatCurrency(p.amount_paid, p.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Commission Split Ledger */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Automated Agency Commission Architecture
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Standard 20% agency cut with 10% agent commission split and 80% talent net payout.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">
                Total Agency Margin
              </span>
              <span className="font-mono font-bold text-indigo-400 text-base">
                {formatCurrency(stats.agencyRevenueEarned, 'PKR')}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Booking / Project</th>
                    <th className="py-3 px-4 font-semibold">Talent</th>
                    <th className="py-3 px-4 font-semibold text-right">Gross Client Fee</th>
                    <th className="py-3 px-4 font-semibold text-right">Agency (20%)</th>
                    <th className="py-3 px-4 font-semibold text-right">Agent Cut (10%)</th>
                    <th className="py-3 px-4 font-semibold text-right">Talent Net Payout</th>
                    <th className="py-3 px-4 font-semibold text-center">Payout Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">
                          {c.booking?.project_name || c.deal?.deal_name || 'Production Shoot'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.booking ? `${c.booking.shoot_date_start} to ${c.booking.shoot_date_end}` : 'Confirmed'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {c.talent?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.talent.avatar_url}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">
                            {c.talent?.full_name || 'Represented Talent'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(c.gross_amount, c.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-purple-400">
                        {formatCurrency(c.agency_commission_amount, c.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(c.agent_commission_amount, c.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(c.talent_net_amount, c.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            c.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.status === 'payable'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateCommissionStatus(
                                c.id,
                                c.status === 'accrued' ? 'payable' : 'paid'
                              )
                            }
                            className="h-7 text-[11px] border-border hover:bg-muted"
                          >
                            Mark {c.status === 'accrued' ? 'Payable' : 'Paid'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Operational Expenses */}
      {activeTab === 'expenses' && (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Linked Project</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No operational expenses logged.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(e.expense_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {e.booking?.project_name || 'Agency Overhead'}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-sm truncate">
                        {e.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(e.amount, e.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSuccess={createInvoice}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false)
          setSelectedInvoiceForPayment(null)
        }}
        invoice={selectedInvoiceForPayment}
        onSuccess={recordPayment}
      />

      <InvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        onRecordPaymentClick={(inv) => handleOpenPaymentModal(inv)}
      />

      <CreateExpenseModal
        isOpen={isCreateExpenseOpen}
        onClose={() => setIsCreateExpenseOpen(false)}
        onSuccess={createExpense}
      />
    </div>
  )
}
