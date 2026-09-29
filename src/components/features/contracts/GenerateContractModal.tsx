"use client"

import React, { useState, useEffect } from "react"
import { useContracts } from "@/hooks/useContracts"
import { useDeals } from "@/hooks/useDeals"
import { compileContractTemplate } from "@/lib/contracts/merge-engine"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  DollarSign,
  FileCheck,
} from "lucide-react"

interface GenerateContractModalProps {
  isOpen: boolean
  onClose: () => void
  initialBookingId?: string
}

export function GenerateContractModal({
  isOpen,
  onClose,
  initialBookingId,
}: GenerateContractModalProps) {
  const { toast } = useToast()
  const { templates, generateContract, sendForSignature, isGenerating } = useContracts()
  const { bookings } = useDeals()

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    initialBookingId || (bookings[0]?.id ?? "")
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates.find((t) => t.is_default)?.id || templates[0]?.id || ""
  )
  const [previewBody, setPreviewBody] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)

  // Sync selected booking / template
  useEffect(() => {
    if (initialBookingId) {
      setSelectedBookingId(initialBookingId)
    } else if (!selectedBookingId && bookings.length > 0) {
      setSelectedBookingId(bookings[0].id)
    }
  }, [initialBookingId, bookings, selectedBookingId])

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      const def = templates.find((t) => t.is_default) || templates[0]
      setSelectedTemplateId(def.id)
    }
  }, [templates, selectedTemplateId])

  // Update compiled preview text whenever selection changes
  useEffect(() => {
    const booking = bookings.find((b) => b.id === selectedBookingId)
    const template = templates.find((t) => t.id === selectedTemplateId)

    if (!template || !booking) {
      setPreviewBody("")
      return
    }

    const compiled = compileContractTemplate(template.body_markdown, {
      talent_name: booking.talent_name || "Talent Name",
      client_name: booking.client_name || "Client Name",
      agency_name: "Actor's Studio",
      project_name: booking.project_name,
      fee: `${booking.currency || "PKR"} ${Number(booking.fee_amount || 0).toLocaleString()}`,
      shoot_dates: `${booking.shoot_date_start} to ${booking.shoot_date_end}`,
      location: booking.location_address || "To be confirmed on call sheet",
      usage_rights: booking.usage_rights || "Standard Digital & Broadcast",
      territory: booking.territory || "Pakistan",
      media: booking.media || "Social Media & TVC",
      start_date: booking.shoot_date_start,
      end_date: booking.shoot_date_end,
    })

    setPreviewBody(compiled)
  }, [selectedBookingId, selectedTemplateId, bookings, templates])

  if (!isOpen) return null

  const currentBooking = bookings.find((b) => b.id === selectedBookingId)
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleGenerate = async (sendImmediately: boolean = false) => {
    if (!selectedBookingId || !selectedTemplateId) {
      toast({
        title: "Selection Required",
        description: "Please select both a booking and a contract template.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await generateContract({
        bookingId: selectedBookingId,
        templateId: selectedTemplateId,
      })

      if (sendImmediately && res.contractId) {
        await sendForSignature(res.contractId)
        toast({
          title: "Contract Sent for E-Signature",
          description: "Digital agreement created and sent to talent and client signing queues.",
        })
      } else {
        toast({
          title: "Contract Draft Generated",
          description: "Contract generated from booking and saved in draft status.",
        })
      }

      onClose()
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate contract.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Generate Contract from Booking
              </h2>
              <p className="text-xs text-muted-foreground">
                Compile dynamic variables into an enforceable legal agreement with e-signature.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Booking Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                Select Confirmed Shoot Booking
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full text-xs h-10 px-3 rounded-lg border border-border/80 bg-background text-foreground focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                {bookings.length === 0 ? (
                  <option value="">No active bookings found</option>
                ) : (
                  bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.project_name} — {b.talent_name} ({b.currency}{" "}
                      {Number(b.fee_amount).toLocaleString()})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                Select Contract Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs h-10 px-3 rounded-lg border border-border/80 bg-background text-foreground focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.template_name} ({t.contract_type.toUpperCase()})
                    {t.is_default ? " — Default" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Booking Summary Card */}
          {currentBooking && (
            <div className="p-3.5 bg-muted/20 border border-border/60 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">Talent</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {currentBooking.talent_name}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Client</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  {currentBooking.client_name}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Agreed Fee</span>
                <span className="font-semibold text-purple-400 flex items-center gap-1 mt-0.5">
                  <DollarSign className="h-3 w-3" />
                  {currentBooking.currency} {Number(currentBooking.fee_amount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Shoot Dates</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {currentBooking.shoot_date_start}
                </span>
              </div>
            </div>
          )}

          {/* Live Preview Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Live Dynamic Token Compilation Preview
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium underline"
              >
                {isEditing ? "Switch to Preview" : "Edit Compiled Text"}
              </button>
            </div>

            {isEditing ? (
              <Textarea
                value={previewBody}
                onChange={(e) => setPreviewBody(e.target.value)}
                rows={14}
                className="font-mono text-xs bg-background/80 border-border"
              />
            ) : (
              <div className="p-4 bg-muted/10 border border-border/60 rounded-xl max-h-[300px] overflow-y-auto text-xs whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed shadow-inner">
                {previewBody || (
                  <p className="text-muted-foreground italic">
                    Select a booking and template above to preview the compiled legal agreement.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isGenerating || !previewBody}
              onClick={() => handleGenerate(false)}
              className="text-xs h-9"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              disabled={isGenerating || !previewBody}
              onClick={() => handleGenerate(true)}
              className="h-9 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              {isGenerating ? (
                "Compiling Contract..."
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Generate & Send for E-Signature
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
