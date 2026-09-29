"use client"

import React, { useState } from "react"
import { PipelineCandidate } from "@/types/pipeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Play,
  Volume2,
  Download,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Send,
  Calendar,
  CheckCircle2,
} from "lucide-react"

interface CompCardModalProps {
  candidate: PipelineCandidate | null
  isOpen: boolean
  onClose: () => void
  onSubmitToClient?: (candidate: PipelineCandidate) => void
}

export function CompCardModal({
  candidate,
  isOpen,
  onClose,
  onSubmitToClient,
}: CompCardModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen || !candidate) return null

  const { talent, role } = candidate

  const handleExportCompCard = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      // Trigger download / notification
      const link = document.createElement("a")
      link.href = candidate.talent.avatar_url || "#"
      link.download = `${candidate.talent.full_name}_CompCard.png`
      link.target = "_blank"
      link.click()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-base font-bold text-foreground">
              Candidate Comp Card & Presentation Dossier
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comp Card layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Headshot Column */}
          <div className="space-y-3">
            <div className="relative aspect-3/4 rounded-xl overflow-hidden border border-border shadow-md bg-accent/20">
              <img
                src={
                  talent.avatar_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                }
                alt={talent.full_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-xs text-white text-xs font-semibold text-center">
                {talent.stage_name || talent.full_name}
              </div>
            </div>

            {/* Quick Reel preview link */}
            {talent.showreel_url && (
              <a
                href={talent.showreel_url}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                Play Showreel Video
              </a>
            )}
          </div>

          {/* Details & Specs Column */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  {talent.full_name}
                </h3>
                {role && (
                  <Badge variant="outline" className="text-xs text-brand-300 border-brand-500/30 bg-brand-500/10">
                    Role: {role.role_name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {talent.city || "Karachi, Pakistan"}
                <span>•</span>
                <span>{talent.height_cm ? `${talent.height_cm} cm` : "Height unlisted"}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Exclusively Represented</span>
              </p>
            </div>

            {/* Measurements & Specs Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-border/70 bg-accent/30 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Height</p>
                <p className="font-semibold text-foreground">{talent.height_cm || "170"} cm</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Stage</p>
                <p className="font-semibold text-foreground capitalize">{candidate.stage.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Proposed Fee</p>
                <p className="font-semibold text-foreground font-mono">
                  {candidate.proposed_fee ? `${candidate.currency} ${candidate.proposed_fee.toLocaleString()}` : "Unset"}
                </p>
              </div>
            </div>

            {/* Bio & Experience */}
            {talent.bio && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Artistic Bio & Background</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {talent.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {talent.skills && talent.skills.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-foreground">Verified Skills & Attributes</h4>
                <div className="flex flex-wrap gap-1.5">
                  {talent.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md border border-border/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Pitch Note */}
            {candidate.agent_pitch_note && (
              <div className="p-3 rounded-xl border border-brand-500/20 bg-brand-500/5 space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
                  Agent Pitch Note
                </p>
                <p className="text-xs text-foreground/90 italic">
                  &ldquo;{candidate.agent_pitch_note}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleExportCompCard}
            disabled={isExporting}
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting Comp Card..." : "Export Comp Card"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onClose}
            >
              Close
            </Button>
            {onSubmitToClient && (
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  onClose()
                  onSubmitToClient(candidate)
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Submit to Client Portal
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
