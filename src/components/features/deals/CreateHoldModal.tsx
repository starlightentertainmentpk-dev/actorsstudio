"use client"

import React, { useState, useEffect } from "react"
import { useDeals } from "@/hooks/useDeals"
import { useClients } from "@/hooks/useClients"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Bookmark,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  Building2,
  User,
} from "lucide-react"

interface CreateHoldModalProps {
  isOpen: boolean
  onClose: () => void
  initialTalentId?: string
  initialClientId?: string
  initialStartDate?: string
  initialEndDate?: string
  initialProjectTitle?: string
  initialPriority?: number
}

export function CreateHoldModal({
  isOpen,
  onClose,
  initialTalentId,
  initialClientId,
  initialStartDate,
  initialEndDate,
  initialProjectTitle,
  initialPriority,
}: CreateHoldModalProps) {
  const { toast } = useToast()
  const { talentRoster, createHold, checkConflict, isCreatingHold } = useDeals()
  const { clients } = useClients()

  const [talentId, setTalentId] = useState(initialTalentId || talentRoster[0]?.id || "")
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || "")
  const [projectTitle, setProjectTitle] = useState(initialProjectTitle || "")
  const [holdDateStart, setHoldDateStart] = useState(initialStartDate || "2026-11-01")
  const [holdDateEnd, setHoldDateEnd] = useState(initialEndDate || "2026-11-03")
  const [priorityLevel, setPriorityLevel] = useState<number>(initialPriority || 1)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (initialTalentId) setTalentId(initialTalentId)
    if (initialClientId) setClientId(initialClientId)
    if (initialStartDate) setHoldDateStart(initialStartDate)
    if (initialEndDate) setHoldDateEnd(initialEndDate)
    if (initialProjectTitle) setProjectTitle(initialProjectTitle)
    if (initialPriority) setPriorityLevel(initialPriority)
  }, [
    initialTalentId,
    initialClientId,
    initialStartDate,
    initialEndDate,
    initialProjectTitle,
    initialPriority,
  ])

  // Conflict evaluation for active holds
  const conflictResult = checkConflict(talentId, holdDateStart, holdDateEnd)
  const hasExisting1stHold = conflictResult.conflicts.some(
    (c) => c.type === "hold" && c.priorityLevel === 1
  )

  // Auto-suggest 2nd hold if 1st hold already exists on those dates
  useEffect(() => {
    if (hasExisting1stHold && priorityLevel === 1 && !initialPriority) {
      setPriorityLevel(2)
    }
  }, [hasExisting1stHold, priorityLevel, initialPriority])

  if (!isOpen) return null

  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedTalent = talentRoster.find((t) => t.id === talentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectTitle.trim()) {
      toast({ title: "Validation Error", description: "Project title is required.", type: "error" })
      return
    }

    if (new Date(holdDateEnd) < new Date(holdDateStart)) {
      toast({
        title: "Invalid Dates",
        description: "Hold end date cannot be earlier than start date.",
        type: "error",
      })
      return
    }

    try {
      await createHold({
        orgId: "default-org",
        clientId,
        clientName: selectedClient?.company_name || "Client Account",
        talentId,
        holdDateStart,
        holdDateEnd,
        priorityLevel,
        projectTitle,
        notes,
      })

      const priorityLabel = priorityLevel === 1 ? "1st Hold" : priorityLevel === 2 ? "2nd Hold" : "3rd Hold"

      toast({
        title: `${priorityLabel} Placed`,
        description: `Successfully placed ${selectedTalent?.full_name} on ${priorityLabel} for '${projectTitle}'.`,
        type: "success",
      })

      onClose()
    } catch (err: any) {
      toast({ title: "Hold Creation Error", description: err.message, type: "error" })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Place Talent on Hold</h2>
              <p className="text-xs text-muted-foreground">
                Set hold priority queue (1st Hold, 2nd Hold) and lock dates
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
          {/* Active Conflict Warning */}
          {hasExisting1stHold && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Talent already has an active 1st Hold
              </div>
              <p className="text-muted-foreground">
                Placing this client on <strong>2nd Hold</strong>. If this client is ready to contract,
                you can issue a 24-hour challenge to force the 1st hold holder to confirm or release.
              </p>
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Project / Commercial Title</label>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Olper's Dairy TVC Shoot"
              className="text-xs h-9"
              required
            />
          </div>

          {/* Talent & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Hold Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Hold Date Start</label>
              <Input
                type="date"
                value={holdDateStart}
                onChange={(e) => setHoldDateStart(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">Hold Date End</label>
              <Input
                type="date"
                value={holdDateEnd}
                onChange={(e) => setHoldDateEnd(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>
          </div>

          {/* Priority Level Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Hold Priority Position</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 1, label: "1st Hold", desc: "Highest Priority" },
                { level: 2, label: "2nd Hold", desc: "Can Challenge 1st" },
                { level: 3, label: "3rd Hold", desc: "Queue Backup" },
              ].map((p) => {
                const isSelected = priorityLevel === p.level
                return (
                  <button
                    type="button"
                    key={p.level}
                    onClick={() => setPriorityLevel(p.level)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300 font-semibold shadow-xs"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Internal Hold Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Agency contact person, shoot director, tentative call times..."
              className="text-xs resize-none"
              rows={2}
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
              disabled={isCreatingHold}
              className="h-9 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {isCreatingHold ? "Saving Hold..." : "Confirm Hold Position"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
