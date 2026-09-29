'use client'

import React, { useState } from 'react'
import { Invoice } from '@/types/finance'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Printer,
  ExternalLink,
  X,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  CreditCard,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance/commission'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onRecordPaymentClick?: (invoice: Invoice) => void
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  invoice,
  onRecordPaymentClick,
}: InvoicePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  if (!isOpen || !invoice) return null

  const currency = invoice.currency || 'PKR'
  const balanceDue = Math.max(0, invoice.total_amount - (invoice.amount_paid || 0))

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const url = `/api/invoices/${invoice.id}/pdf?download=true`
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoice.invoice_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setTimeout(() => setIsDownloading(false), 800)
    }
  }

  const handleOpenPDFWindow = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Paid in Full
          </span>
        )
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> Partially Paid
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="h-3 w-3" /> Overdue
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="h-3 w-3" /> Sent to Client
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            Draft
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-3.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-foreground">
              {invoice.invoice_number}
            </span>
            {getStatusBadge(invoice.status)}
          </div>

          <div className="flex items-center gap-2">
            {balanceDue > 0 && onRecordPaymentClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onRecordPaymentClick(invoice)
                }}
                className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <CreditCard className="h-3.5 w-3.5" /> Record Payment
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPDFWindow}
              className="h-8 text-xs gap-1.5 border-border"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Preview PDF
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Invoice Preview Sheet */}
        <div className="overflow-y-auto p-8 bg-zinc-950 text-foreground font-sans space-y-6 text-xs border-t border-border/40">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border/60 pb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                ACTORS STUDIO HQ
              </h1>
              <p className="text-[11px] font-semibold text-indigo-400 tracking-wider uppercase mt-0.5">
                Enterprise Talent Agency & Production Management
              </p>
              <p className="text-muted-foreground text-[11px] mt-2">
                Suite 402, Executive Tower, Clifton Block 4, Karachi, Pakistan
              </p>
              <p className="text-muted-foreground text-[11px]">
                NTN: PK-NTN-984218-7 • finance@actorsstudio.pk
              </p>
            </div>

            <div className="sm:text-right">
              <h2 className="text-2xl font-bold font-mono tracking-tight text-white">
                INVOICE
              </h2>
              <p className="text-sm font-mono text-indigo-400 font-semibold mt-0.5">
                {invoice.invoice_number}
              </p>
              <div className="mt-2 space-y-0.5 text-muted-foreground text-[11px]">
                <p>
                  Date:{' '}
                  <span className="text-foreground font-medium">
                    {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                  </span>
                </p>
                <p>
                  Due Date:{' '}
                  <span className="text-foreground font-medium">
                    {new Date(invoice.due_date).toLocaleDateString('en-GB')}
                  </span>
                </p>
                <p>
                  Terms:{' '}
                  <span className="text-foreground font-medium">
                    {invoice.payment_terms || 'Net 30'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client & Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 border border-border/60 p-4 rounded-xl">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                Billed To Client
              </span>
              <p className="text-sm font-semibold text-white">
                {invoice.client?.company_name || 'Valued Client'}
              </p>
              {invoice.client?.address && (
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {invoice.client.address}
                </p>
              )}
              {invoice.client?.city && (
                <p className="text-muted-foreground text-[11px]">
                  {invoice.client.city}, {invoice.client.country || 'Pakistan'}
                </p>
              )}
              {invoice.client?.billing_email && (
                <p className="text-muted-foreground text-[11px] mt-1">
                  Email: {invoice.client.billing_email}
                </p>
              )}
            </div>

            <div className="sm:border-l sm:border-border/60 sm:pl-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
                Booking Reference
              </span>
              <p className="text-sm font-semibold text-white">
                {invoice.deal?.deal_name || 'Commercial Appearance & Performance Engagement'}
              </p>
              <p className="text-muted-foreground text-[11px] mt-1">
                Currency: <span className="font-mono text-foreground font-medium">{currency}</span>
              </p>
              <p className="text-muted-foreground text-[11px]">
                Remittance Method: Bank Wire / Swift IBFT
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-10">#</th>
                  <th className="py-2.5 px-4 font-semibold">Description / Services</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-16">Qty</th>
                  <th className="py-2.5 px-4 font-semibold text-right w-28">Rate</th>
                  <th className="py-2.5 px-4 font-semibold text-right w-28">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-card/60">
                {(invoice.items && invoice.items.length > 0
                  ? invoice.items
                  : [
                      {
                        description: 'Talent Performance & Appearance Fee',
                        quantity: 1,
                        unit_price: invoice.subtotal,
                        line_total: invoice.subtotal,
                      },
                    ]
                ).map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{item.description}</td>
                    <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      {formatCurrency(item.unit_price, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                      {formatCurrency(item.line_total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Remittance & Summary Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="bg-muted/20 border border-border/60 p-4 rounded-xl space-y-2 text-[11px]">
              <span className="font-semibold text-foreground uppercase tracking-wide block mb-1">
                Remittance Advice (Bank Wire)
              </span>
              <div className="flex justify-between py-0.5 border-b border-border/40">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-medium text-foreground">Standard Chartered Bank</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-border/40">
                <span className="text-muted-foreground">Account Title:</span>
                <span className="font-medium text-foreground">Actors Studio Management (Pvt) Ltd</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-border/40">
                <span className="text-muted-foreground">IBAN:</span>
                <span className="font-mono font-medium text-foreground">PK36 SCBL 0000 0011 2345 6789</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Payment Ref:</span>
                <span className="font-mono font-semibold text-indigo-400">{invoice.invoice_number}</span>
              </div>
            </div>

            <div className="bg-muted/30 border border-border/70 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">{formatCurrency(invoice.subtotal, currency)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Sales Tax / GST ({invoice.tax_rate}%):</span>
                  <span className="font-mono text-foreground">+{formatCurrency(invoice.tax_amount, currency)}</span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discount_amount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="font-mono text-indigo-400">{formatCurrency(invoice.total_amount, currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 text-xs pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatCurrency(invoice.amount_paid || 0, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-red-400 text-sm">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground uppercase tracking-wide block mb-1">
                Notes & Instructions
              </span>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
