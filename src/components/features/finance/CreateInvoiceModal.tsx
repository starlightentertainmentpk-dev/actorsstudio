'use client'

import React, { useState } from 'react'
import { useClients } from '@/hooks/useClients'
import { useDeals } from '@/hooks/useDeals'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Plus,
  Trash2,
  X,
  Receipt,
  Building2,
  Calendar,
  Percent,
} from 'lucide-react'
import {
  calculateInvoiceTotals,
  formatCurrency,
} from '@/lib/finance/commission'

interface LineItemForm {
  description: string
  quantity: number
  unitPrice: number
}

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => Promise<any>
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
  const { toast } = useToast()
  const { clients } = useClients()
  const { deals } = useDeals()

  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [dealId, setDealId] = useState('')
  const [currency, setCurrency] = useState('PKR')
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0]
  )
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [taxRate, setTaxRate] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [items, setItems] = useState<LineItemForm[]>([
    {
      description: 'Talent Performance & Principal Shoot Fee',
      quantity: 1,
      unitPrice: 300000,
    },
  ])

  if (!isOpen) return null

  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedDeal = deals.find((d) => d.id === dealId)

  // Real-time calculation
  const totals = calculateInvoiceTotals({
    items,
    taxRatePct: taxRate,
    discountAmount,
  })

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unitPrice: 0 },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast({
        title: 'Requirement',
        description: 'Invoice must contain at least one line item.',
        type: 'error',
      })
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (
    index: number,
    field: keyof LineItemForm,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: field === 'description' ? value : Number(value) || 0,
          }
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client account.',
        type: 'error',
      })
      return
    }

    const invalidItems = items.some(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
    )
    if (invalidItems) {
      toast({
        title: 'Invalid Line Items',
        description: 'Please ensure all items have a description, positive quantity and valid rate.',
        type: 'error',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSuccess({
        orgId: 'default-org',
        clientId,
        clientName: selectedClient?.company_name || 'Client',
        dealId: dealId || null,
        dealName: selectedDeal?.deal_name || undefined,
        currency,
        dueDate,
        paymentTerms,
        items,
        taxRate,
        discountAmount,
        notes: notes.trim() || null,
      })

      toast({
        title: 'Invoice Issued',
        description: `Commercial invoice successfully created for ${selectedClient?.company_name}.`,
        type: 'success',
      })
      onClose()
    } catch (err: any) {
      toast({
        title: 'Error Creating Invoice',
        description: err.message || 'Something went wrong.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Create Commercial Invoice</h2>
              <p className="text-xs text-muted-foreground">
                Itemized billing, tax calculation, and payment terms
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs">
          {/* Client & Linked Deal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-400" /> Client Account *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Select Client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.city || 'Pakistan'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Link to Deal (Optional)
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None / Standalone Invoice</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_name} ({d.currency} {d.deal_value.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency, Due Date & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="50% Advance, 50% on Wrap">50% Advance, 50% on Wrap</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Immediate Wire">Immediate Wire Transfer</option>
              </select>
            </div>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-2 border border-border/70 rounded-xl p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground tracking-wide uppercase">
                Invoice Line Items
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 border-border/80"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-lg border border-border/60 shadow-xs"
                >
                  <div className="col-span-6">
                    <Input
                      placeholder="Service or performance description"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                      className="text-xs h-8 text-center"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Rate"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                      className="text-xs h-8 text-right font-mono"
                      required
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      className="text-muted-foreground hover:text-red-400 p-1 disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax, Discount & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                  <Percent className="h-3 w-3 text-muted-foreground" /> Tax / Sales Tax Rate (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  placeholder="e.g. 13 for GST"
                  className="text-xs h-8 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground">Discount Amount</label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 25000"
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-mono text-foreground">+{formatCurrency(totals.taxAmount, currency)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 text-[11px]">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(totals.discountAmount, currency)}</span>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex justify-between items-center text-sm font-semibold">
                <span className="text-foreground">Total Invoiced:</span>
                <span className="font-mono text-indigo-400 text-base">
                  {formatCurrency(totals.totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Invoice Notes & Wire Instructions</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please quote INV-XXXX on wire transfer. Standard Chartered account details apply."
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
              disabled={isSubmitting}
              className="text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 shadow-sm"
            >
              {isSubmitting ? 'Creating Invoice...' : 'Generate Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
