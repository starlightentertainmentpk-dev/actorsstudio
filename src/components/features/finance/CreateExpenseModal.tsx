'use client'

import React, { useState } from 'react'
import { useDeals } from '@/hooks/useDeals'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DollarSign,
  Briefcase,
  Calendar,
  X,
  Tag,
  Link as LinkIcon,
} from 'lucide-react'

interface CreateExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => Promise<any>
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const { toast } = useToast()
  const { bookings } = useDeals()

  const [bookingId, setBookingId] = useState('')
  const [category, setCategory] = useState('travel')
  const [amount, setAmount] = useState<number>(25000)
  const [currency, setCurrency] = useState('PKR')
  const [description, setDescription] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const selectedBooking = bookings.find((b) => b.id === bookingId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount must be greater than zero.',
        type: 'error',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onSuccess({
        orgId: 'default-org',
        bookingId: bookingId || null,
        projectName: selectedBooking?.project_name,
        category,
        amount: Number(amount),
        currency,
        description: description.trim() || null,
        receiptUrl: receiptUrl.trim() || null,
        expenseDate,
      })

      toast({
        title: 'Expense Logged',
        description: `Recorded ${currency} ${amount.toLocaleString()} for ${category}.`,
        type: 'success',
      })
      onClose()
    } catch (err: any) {
      toast({
        title: 'Expense Error',
        description: err.message || 'Failed to log expense.',
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Log Operational Expense</h2>
              <p className="text-xs text-muted-foreground">
                Track shoot travel, wardrobe, accommodation, or agency costs
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-400" /> Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="travel">Travel & Flights</option>
                <option value="wardrobe">Wardrobe & Styling</option>
                <option value="accommodation">Hotel & Accommodation</option>
                <option value="production">Studio & Production</option>
                <option value="marketing">Comp Cards & Marketing</option>
                <option value="other">Other Operational</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Amount ({currency}) *</label>
              <Input
                type="number"
                min="100"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="text-xs h-9 font-mono"
                required
              />
            </div>
          </div>

          {/* Linked Booking & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Link to Booking (Optional)
              </label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">General Agency Overhead</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.project_name} ({b.talent_name || 'Talent'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Expense Date *
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Return flights Karachi - Lahore for 2 shoot days"
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Receipt URL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> Receipt / Voucher Link (Optional)
            </label>
            <Input
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              className="text-xs h-9 font-mono"
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
              className="text-xs h-9 bg-amber-600 hover:bg-amber-500 text-white font-medium px-5 shadow-sm"
            >
              {isSubmitting ? 'Logging...' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
