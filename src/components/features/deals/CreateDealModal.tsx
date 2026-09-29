"use client"

import React, { useState } from "react"
import { useDeals } from "@/hooks/useDeals"
import { useClients } from "@/hooks/useClients"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Handshake,
  DollarSign,
  User,
  Building2,
  Calendar,
  Percent,
  X,
  Sparkles,
} from "lucide-react"

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
  initialTalentId?: string
  initialClientId?: string
}

export function CreateDealModal({
  isOpen,
  onClose,
  initialTalentId,
  initialClientId,
}: CreateDealModalProps) {
  const { toast } = useToast()
  const { talentRoster, createDeal, isCreatingDeal } = useDeals()
  const { clients } = useClients()

  const [talentId, setTalentId] = useState(initialTalentId || talentRoster[0]?.id || "")
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || "")
  const [dealName, setDealName] = useState("")
  const [dealValue, setDealValue] = useState<number>(1000000)
  const [commissionRate, setCommissionRate] = useState<number>(20)
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [startDate, setStartDate] = useState("2026-11-01")
  const [endDate, setEndDate] = useState("2026-11-03")
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  const agencyCommissionAmount = Math.round((dealValue * commissionRate) / 100)
  const talentPayoutAmount = dealValue - agencyCommissionAmount

  const selectedClient = clients.find((c) => c.id === clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dealName.trim()) {
      toast({ title: "Validation Error", description: "Deal name is required.", type: "error" })
      return
    }

    if (dealValue <= 0) {
      toast({ title: "Validation Error", description: "Deal value must be positive.", type: "error" })
      return
    }

    try {
      await createDeal({
        orgId: "default-org",
        clientId,
        clientName: selectedClient?.company_name || "Client Account",
        talentId,
        dealName,
        dealValue,
        agencyCommissionAmount,
        talentPayoutAmount,
        currency: "PKR",
        paymentTerms,
        startDate,
        endDate,
        notes,
      })

      toast({
        title: "Commercial Deal Created",
        description: `Deal '${dealName}' added to the pipeline in Proposal stage.`,
        type: "success",
      })

      onClose()
    } catch (err: any) {
      toast({ title: "Deal Creation Error", description: err.message, type: "error" })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Create Commercial Deal</h2>
              <p className="text-xs text-muted-foreground">
                Set contract value, commission split, and commercial terms
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
          {/* Deal Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Deal / Campaign Title</label>
            <Input
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              placeholder="e.g. Shan Foods Ramadan TVC & Digital Campaign"
              className="text-xs h-9"
              required
            />
          </div>

          {/* Client & Talent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Client Production House</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Represented Talent</label>
              <select
                value={talentId}
                onChange={(e) => setTalentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden"
              >
                {talentRoster.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <h4 className="font-semibold text-foreground text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Financial Structure & Split
              </span>
              <span className="text-[11px] text-muted-foreground">Currency: PKR</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Total Deal Value (PKR)</span>
                <Input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="text-xs h-9 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Agency Commission (%)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="text-xs h-9 font-mono w-24"
                    required
                  />
                  <span className="text-muted-foreground text-xs">% cut</span>
                </div>
              </div>
            </div>

            {/* Live split pill */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
              <div>
                <p className="text-[10px] text-muted-foreground">Agency Commission ({commissionRate}%)</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">
                  PKR {agencyCommissionAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-6 w-px bg-border/60" />
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Talent Net Payout ({100 - commissionRate}%)</p>
                <p className="text-xs font-bold text-foreground font-mono">
                  PKR {talentPayoutAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Dates & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Start Date</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">End Date</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Payment Terms</span>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30"
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Commercial Notes & Terms</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Exclusivity requirements, wardrobe provision, travel allowance details..."
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isCreatingDeal}
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              {isCreatingDeal ? "Creating Deal..." : "Save Deal to Pipeline"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
