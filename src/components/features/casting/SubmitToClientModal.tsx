"use client"

import React, { useState } from "react"
import { PipelineCandidate } from "@/types/pipeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useClients } from "@/hooks/useClients"
import {
  Send,
  Building2,
  DollarSign,
  FileText,
  User,
  MapPin,
  CheckCircle2,
  Sparkles,
  Loader2,
  X,
} from "lucide-react"

interface SubmitToClientModalProps {
  candidate: PipelineCandidate
  projectTitle: string
  defaultClientId?: string | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    submissionId: string
    clientId: string
    proposedFee: number
    currency: string
    agentPitchNote?: string
  }) => Promise<any>
}

export function SubmitToClientModal({
  candidate,
  projectTitle,
  defaultClientId,
  isOpen,
  onClose,
  onSubmit,
}: SubmitToClientModalProps) {
  const { clients } = useClients()
  const [selectedClientId, setSelectedClientId] = useState<string>(
    candidate.client_id || defaultClientId || clients[0]?.id || "c1-dawn-films"
  )
  const [fee, setFee] = useState<number>(
    candidate.proposed_fee || (candidate.role?.pay_rate ? 450000 : 350000)
  )
  const [currency, setCurrency] = useState<string>(candidate.currency || "PKR")
  const [pitchNote, setPitchNote] = useState<string>(
    candidate.agent_pitch_note ||
      `Ideal candidate for '${candidate.role?.role_name || "Featured Role"}'. Verified professional acting background and excellent camera readiness.`
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0]
  const primaryContact = selectedClient?.contacts?.find((c) => c.is_primary) || selectedClient?.contacts?.[0]
  const { talent, role } = candidate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      setErrorMsg("Please select a target client company.")
      return
    }
    if (fee <= 0) {
      setErrorMsg("Proposed talent fee must be greater than zero.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      await onSubmit({
        submissionId: candidate.id,
        clientId: selectedClientId,
        proposedFee: fee,
        currency,
        agentPitchNote: pitchNote,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit candidate to client.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Submit Candidate to Client Portal
              </h2>
              <p className="text-xs text-muted-foreground">
                Package talent proposal directly into the client&apos;s review deck for {projectTitle}.
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
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Talent Preview Card */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-accent/30 flex items-start gap-3.5">
          <div className="relative shrink-0">
            {talent.avatar_url ? (
              <img
                src={talent.avatar_url}
                alt={talent.full_name}
                className="h-14 w-14 rounded-xl object-cover border border-border shadow-xs"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {talent.full_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {talent.stage_name || talent.full_name}
              </h3>
              {role && (
                <Badge variant="outline" className="text-[10px] text-brand-300 border-brand-500/30 bg-brand-500/10">
                  Target: {role.role_name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              {talent.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {talent.city}
                </span>
              )}
              {talent.height_cm && <span>{talent.height_cm} cm</span>}
              <span className="text-emerald-400 font-medium">Verified Roster</span>
            </div>
            {talent.skills && talent.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {talent.skills.slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-background/80 text-foreground/80 px-1.5 py-0.2 rounded border border-border/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Client Company */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Target Client Company
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.city || "Pakistan"})
                </option>
              ))}
            </select>
            {primaryContact && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                Primary Contact: <span className="text-foreground font-medium">{primaryContact.full_name}</span> ({primaryContact.role_title})
              </p>
            )}
          </div>

          {/* Fee & Currency Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Proposed Talent Fee
              </label>
              <Input
                type="number"
                min="0"
                step="5000"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                placeholder="e.g. 450000"
                className="h-9 text-xs font-mono font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="PKR">PKR (₨)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Agent Pitch Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Agent Pitch Note
            </label>
            <Textarea
              rows={3}
              value={pitchNote}
              onChange={(e) => setPitchNote(e.target.value)}
              placeholder="Highlight candidate's specific look, range, reel timestamps, and suitability for the director..."
              className="text-xs resize-none"
            />
            <p className="text-[10px] text-muted-foreground">
              This note appears prominently on the candidate card inside the Client Portal review deck.
            </p>
          </div>

          {/* Action buttons */}
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
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting to Portal...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit to Client Portal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
