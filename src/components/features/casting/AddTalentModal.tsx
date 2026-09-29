"use client"

import React, { useState } from "react"
import { CastingRole, PipelineCandidate, PipelineStage, PIPELINE_STAGE_LABELS } from "@/types/pipeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  UserPlus,
  Search,
  Check,
  MapPin,
  X,
  Loader2,
  Sparkles,
} from "lucide-react"

interface AddTalentModalProps {
  roles: CastingRole[]
  talentRoster: PipelineCandidate["talent"][]
  existingCandidateTalentIds: string[]
  isOpen: boolean
  onClose: () => void
  onAddCandidate: (data: {
    talentId: string
    roleId?: string | null
    stage?: PipelineStage
    proposedFee?: number
    currency?: string
    pitchNote?: string
  }) => Promise<any>
}

export function AddTalentModal({
  roles,
  talentRoster,
  existingCandidateTalentIds,
  isOpen,
  onClose,
  onAddCandidate,
}: AddTalentModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTalentId, setSelectedTalentId] = useState<string>(
    talentRoster.find((t) => !existingCandidateTalentIds.includes(t.id))?.id || talentRoster[0]?.id || ""
  )
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "")
  const [stage, setStage] = useState<PipelineStage>("shortlisted")
  const [proposedFee, setProposedFee] = useState<number | "">(400000)
  const [pitchNote, setPitchNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const filteredTalent = talentRoster.filter(
    (t) =>
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedTalent = talentRoster.find((t) => t.id === selectedTalentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTalentId) {
      setErrorMsg("Please select a talent candidate.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      await onAddCandidate({
        talentId: selectedTalentId,
        roleId: selectedRoleId || null,
        stage,
        proposedFee: proposedFee ? Number(proposedFee) : undefined,
        currency: "PKR",
        pitchNote: pitchNote.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add talent to pipeline.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Add Candidate to Pipeline
              </h2>
              <p className="text-xs text-muted-foreground">
                Select represented talent to match against this casting project.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Talent Search & Selection List */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Select Represented Talent
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by talent name, city, or skills..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border/70 rounded-xl p-1.5 bg-background/50">
            {filteredTalent.map((t) => {
              const isSelected = t.id === selectedTalentId
              const isAlreadyAdded = existingCandidateTalentIds.includes(t.id)

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTalentId(t.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? "bg-brand-500/15 border border-brand-500/30"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={t.avatar_url || ""}
                      alt={t.full_name}
                      className="h-8 w-8 rounded-lg object-cover border border-border"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        {t.stage_name || t.full_name}
                        {isAlreadyAdded && (
                          <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.2 rounded">
                            Already in pipeline
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{t.city}</span>
                        {t.height_cm && <span>{t.height_cm} cm</span>}
                        {t.skills && t.skills[0] && <span>• {t.skills[0]}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {/* Target Role */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Assign to Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- General Project Pool --</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_name} ({r.role_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline Stage */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Starting Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="new_brief">New Brief</option>
                <option value="searching">Searching</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="audition">Audition / Self-Tape</option>
                <option value="callback">Callback</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Proposed Fee */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Proposed Fee (PKR)</label>
              <Input
                type="number"
                min="0"
                step="10000"
                value={proposedFee}
                onChange={(e) => setProposedFee(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 450000"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Pitch Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Agent Match Note</label>
              <Input
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
                placeholder="e.g. Look matches lead character reference"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
              disabled={isSubmitting || !selectedTalentId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding Candidate...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Add to Board
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
