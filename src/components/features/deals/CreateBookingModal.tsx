"use client"

import React, { useState, useEffect } from "react"
import {
  Booking,
  ConflictResult,
  USAGE_MEDIA_OPTIONS,
  USAGE_TERRITORY_OPTIONS,
  USAGE_DURATION_OPTIONS,
} from "@/types/deals"
import { useDeals } from "@/hooks/useDeals"
import { useClients } from "@/hooks/useClients"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  X,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
} from "lucide-react"

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialDealId?: string
  initialTalentId?: string
  initialClientId?: string
  initialProjectName?: string
  initialFee?: number
  onConvertToHold?: (data: {
    talentId: string
    clientId: string
    startDate: string
    endDate: string
    projectTitle: string
  }) => void
}

export function CreateBookingModal({
  isOpen,
  onClose,
  initialDealId,
  initialTalentId,
  initialClientId,
  initialProjectName,
  initialFee,
  onConvertToHold,
}: CreateBookingModalProps) {
  const { toast } = useToast()
  const { talentRoster, createBooking, checkConflict, isCreatingBooking } = useDeals()
  const { clients } = useClients()

  const [talentId, setTalentId] = useState(initialTalentId || talentRoster[0]?.id || "")
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || "c1-dawn-films")
  const [projectName, setProjectName] = useState(initialProjectName || "")
  const [shootDateStart, setShootDateStart] = useState("2026-11-15")
  const [shootDateEnd, setShootDateEnd] = useState("2026-11-16")
  const [callTime, setCallTime] = useState("07:00")
  const [wrapTime, setWrapTime] = useState("19:00")
  const [locationAddress, setLocationAddress] = useState("Karachi Studio / Outdoor Location")
  const [feeAmount, setFeeAmount] = useState(initialFee || 500000)
  const [currency] = useState("PKR")
  const [usageRights, setUsageRights] = useState("1 Year Digital + TVC")
  const [territory, setTerritory] = useState("Pakistan")
  const [selectedMedia, setSelectedMedia] = useState<string[]>([
    "TV Commercial (National)",
    "Digital & Social Media",
  ])
  const [conflictOverride, setConflictOverride] = useState(false)
  const [conflictResult, setConflictResult] = useState<ConflictResult>({
    hasConflict: false,
    conflicts: [],
  })

  // Synchronize when initial props change
  useEffect(() => {
    if (initialTalentId) setTalentId(initialTalentId)
    if (initialClientId) setClientId(initialClientId)
    if (initialProjectName) setProjectName(initialProjectName)
    if (initialFee) setFeeAmount(initialFee)
  }, [initialTalentId, initialClientId, initialProjectName, initialFee])

  // Run dynamic conflict detection when talent or dates change
  useEffect(() => {
    if (talentId && shootDateStart && shootDateEnd) {
      if (new Date(shootDateEnd) >= new Date(shootDateStart)) {
        const res = checkConflict(talentId, shootDateStart, shootDateEnd)
        setConflictResult(res)
      } else {
        setConflictResult({ hasConflict: false, conflicts: [] })
      }
    }
  }, [talentId, shootDateStart, shootDateEnd, checkConflict])

  if (!isOpen) return null

  const selectedTalent = talentRoster.find((t) => t.id === talentId)
  const selectedClient = clients.find((c) => c.id === clientId)

  const toggleMedia = (mediaItem: string) => {
    if (selectedMedia.includes(mediaItem)) {
      setSelectedMedia(selectedMedia.filter((m) => m !== mediaItem))
    } else {
      setSelectedMedia([...selectedMedia, mediaItem])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      toast({ title: "Validation Error", description: "Project name is required.", type: "error" })
      return
    }

    if (new Date(shootDateEnd) < new Date(shootDateStart)) {
      toast({
        title: "Invalid Dates",
        description: "Shoot end date cannot be earlier than start date.",
        type: "error",
      })
      return
    }

    if (conflictResult.hasConflict && !conflictOverride) {
      toast({
        title: "Booking Blocked by Conflict",
        description: "Please resolve the scheduling conflict or toggle Admin Approval Override.",
        type: "error",
      })
      return
    }

    try {
      await createBooking({
        orgId: "default-org",
        dealId: initialDealId || undefined,
        clientId,
        clientName: selectedClient?.company_name || "Client Account",
        talentId,
        projectName,
        shootDateStart,
        shootDateEnd,
        callTime,
        wrapTime,
        locationAddress,
        feeAmount: Number(feeAmount),
        currency,
        usageRights,
        territory,
        media: selectedMedia.join(", "),
        conflictOverride,
      })

      toast({
        title: "Booking Confirmed",
        description: `Shoot booking confirmed for ${selectedTalent?.full_name} on '${projectName}'.`,
        type: "success",
      })

      onClose()
    } catch (err: any) {
      toast({ title: "Booking Error", description: err.message, type: "error" })
    }
  }

  const handleSwitchTo2ndHold = () => {
    if (onConvertToHold) {
      onConvertToHold({
        talentId,
        clientId,
        startDate: shootDateStart,
        endDate: shootDateEnd,
        projectTitle: projectName || "Commercial Project",
      })
    } else {
      toast({
        title: "Hold Option",
        description: "Switch to Hold Priority manager to place talent on 2nd Hold.",
        type: "info",
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Confirm Shoot Booking & Call Sheet
              </h2>
              <p className="text-xs text-muted-foreground">
                Lock dates, verify usage rights, and trigger automated conflict validation
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
          {/* Conflict Detection Banner */}
          {conflictResult.hasConflict ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-300 text-xs">
                    ⚠️ Active Scheduling Conflict Detected
                  </h4>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Talent has an existing hold or confirmed booking overlapping these dates:
                  </p>
                  <div className="space-y-1 mt-2">
                    {conflictResult.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-amber-500/20 text-[11px]"
                      >
                        <span className="font-medium text-amber-200">{c.title}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {c.startDate} → {c.endDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conflict resolution actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchTo2ndHold}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 h-7 text-[11px]"
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  Place on 2nd Hold Instead
                </Button>

                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground text-[11px]">
                  <input
                    type="checkbox"
                    checked={conflictOverride}
                    onChange={(e) => setConflictOverride(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-amber-500/40 bg-card text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    Override with <strong className="text-amber-300">Admin Approval</strong>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-400 text-[11px]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Talent calendar is completely free. Zero scheduling conflicts for selected dates.</span>
            </div>
          )}

          {/* Talent & Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Represented Talent</label>
              <select
                value={talentId}
                onChange={(e) => setTalentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                {talentRoster.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Client Production House</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Commercial Project Title</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. National Tea TVC Campaign"
              className="text-xs h-9"
              required
            />
          </div>

          {/* Shoot Dates & Times */}
          <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
            <h4 className="font-semibold text-foreground text-xs flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-purple-400" />
              Shoot Schedule & Call Sheet Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Shoot Date Start</span>
                <Input
                  type="date"
                  value={shootDateStart}
                  onChange={(e) => setShootDateStart(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Shoot Date End</span>
                <Input
                  type="date"
                  value={shootDateEnd}
                  onChange={(e) => setShootDateEnd(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Call Time</span>
                <Input
                  type="time"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Estimated Wrap</span>
                <Input
                  type="time"
                  value={wrapTime}
                  onChange={(e) => setWrapTime(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Booking Fee ({currency})</span>
                <Input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="text-xs h-8 font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Studio Location Address</span>
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g. Studio 4, PAF Museum Road, Karachi"
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Usage Rights Builder */}
          <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
            <h4 className="font-semibold text-foreground text-xs flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
              Commercial Usage Rights & Territory
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Duration & Exclusivity</span>
                <select
                  value={usageRights}
                  onChange={(e) => setUsageRights(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  {USAGE_DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Territory Release</span>
                <select
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  {USAGE_TERRITORY_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Authorized Media Channels</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {USAGE_MEDIA_OPTIONS.map((media) => {
                  const isChecked = selectedMedia.includes(media)
                  return (
                    <button
                      type="button"
                      key={media}
                      onClick={() => toggleMedia(media)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition-colors ${
                        isChecked
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-300 font-medium"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isChecked ? "bg-purple-400" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="truncate">{media}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={isCreatingBooking || (conflictResult.hasConflict && !conflictOverride)}
              className="h-9 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              {isCreatingBooking ? (
                "Locking Booking..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Confirm Shoot Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
