'use client'

import React, { useState } from 'react'
import { Invoice } from '@/types/finance'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  X,
  CheckCircle2,
  Receipt,
  FileCheck,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance/commission'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onSuccess: (data: any) => Promise<any>
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: RecordPaymentModalProps) {
  const { toast } = useToast()

  const currency = invoice?.currency || 'PKR'
  const totalAmount = invoice?.total_amount || 0
  const amountPaidSoFar = invoice?.amount_paid || 0
  const remainingBalance = Math.max(0, totalAmount - amountPaidSoFar)

  const [paymentAmount, setPaymentAmount] = useState<number>(remainingBalance)
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer')
  const [transactionRef, setTransactionRef] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset default amount when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setPaymentAmount(Math.max(0, invoice.total_amount - (invoice.amount_paid || 0)))
    }
  }, [invoice])

  if (!isOpen || !invoice) return null

  const newBalanceRemaining = Math.max(0, remainingBalance - paymentAmount)
  const willBeFullyPaid = paymentAmount >= remainingBalance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Payment amount must be greater than zero.',
        type: 'error',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSuccess({
        orgId: invoice.organization_id || 'default-org',
        invoiceId: invoice.id,
        clientId: invoice.client_id,
        clientName: invoice.client?.company_name || 'Client',
        amountPaid: Number(paymentAmount),
        currency,
        paymentMethod,
        transactionReference: transactionRef.trim() || null,
        paymentDate,
        notes: notes.trim() || null,
      })

      toast({
        title: willBeFullyPaid ? 'Invoice Fully Paid' : 'Partial Payment Recorded',
        description: `Successfully logged payment of ${formatCurrency(paymentAmount, currency)} for ${invoice.invoice_number}.`,
        type: 'success',
      })

      onClose()
    } catch (err: any) {
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to record payment.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Record Payment Settlement</h2>
              <p className="text-xs text-muted-foreground">
                Apply cash flow towards {invoice.invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invoice Summary Banner */}
        <div className="bg-muted/30 border-b border-border/60 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              {invoice.client?.company_name || 'Client Account'}
            </span>
            <span className="font-mono font-semibold text-foreground">{invoice.invoice_number}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="bg-background/80 p-2 rounded-lg border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Total Due</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
            <div className="bg-background/80 p-2 rounded-lg border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Paid to Date</span>
              <span className="font-mono font-semibold text-emerald-500">
                {formatCurrency(amountPaidSoFar, currency)}
              </span>
            </div>
            <div className="bg-background/80 p-2 rounded-lg border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Remaining</span>
              <span className="font-mono font-semibold text-red-400">
                {formatCurrency(remainingBalance, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {/* Amount Paid */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-foreground">Amount Paid ({currency}) *</label>
              <button
                type="button"
                onClick={() => setPaymentAmount(remainingBalance)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Pay Full Balance ({formatCurrency(remainingBalance, currency)})
              </button>
            </div>
            <Input
              type="number"
              min="1"
              max={remainingBalance * 1.5}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
              className="text-xs h-9 font-mono text-base font-semibold"
              required
            />
            {willBeFullyPaid ? (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                This payment will transition the invoice status to Paid.
              </p>
            ) : (
              <p className="text-[11px] text-amber-400 mt-1">
                Partial payment: {formatCurrency(newBalanceRemaining, currency)} will remain outstanding.
              </p>
            )}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="bank_transfer">Direct Bank Wire / IBFT</option>
                <option value="stripe">Stripe Online / Credit Card</option>
                <option value="jazzcash">JazzCash Mobile Wallet</option>
                <option value="easypaisa">EasyPaisa Mobile Wallet</option>
                <option value="cheque">Bank Crossed Cheque</option>
                <option value="cash">Petty Cash / Production Advance</option>
                <option value="other">Other Settlement Method</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Payment Date *
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" /> Transaction Reference / Bank Auth Code
            </label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. SCB-WIRE-98471203 or STRIPE-ch_3N..."
              className="text-xs h-9 font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Payment Memo / Internal Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance confirmed by accounts manager via bank statement verification."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 shadow-sm"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Payment Settlement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
