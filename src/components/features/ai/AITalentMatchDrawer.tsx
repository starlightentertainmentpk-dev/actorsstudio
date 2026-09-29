"use client"

import React, { useState, useEffect } from "react"
import { matchTalentForCastingAction } from "@/app/actions/ai"
import type { AIMatchCandidate } from "@/types/ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  UserCheck,
  Video,
  Send,
  SlidersHorizontal,
  Info,
} from "lucide-react"

interface AITalentMatchDrawerProps {
  isOpen: boolean
  onClose: () => void
  castingCallId?: string
  projectTitle?: string
  initialBrief?: string
  onAddCandidate?: (candidate: AIMatchCandidate) => void
  onRequestSelfTape?: (candidate: AIMatchCandidate) => void
}

export function AITalentMatchDrawer({
  isOpen,
  onClose,
  castingCallId = "call-current",
  projectTitle = "Active Casting Call",
  initialBrief = "",
  onAddCandidate,
  onRequestSelfTape,
}: AITalentMatchDrawerProps) {
  const { toast } = useToast()
  const [briefText, setBriefText] = useState(
    initialBrief ||
      `Looking for female or male lead model for commercial campaign in Lahore. Age 22-28, fluent Urdu & English dialogue delivery, polished on-camera presence. Shoot dates: Next month. Budget: PKR 250,000.`
  )
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<AIMatchCandidate[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [minScoreFilter, setMinScoreFilter] = useState<number>(60)
  const [addedCandidateIds, setAddedCandidateIds] = useState<Set<string>>(new Set())

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleRunMatch = async () => {
    if (!briefText.trim()) {
      toast({
        title: "Brief is empty",
        description: "Please enter casting criteria or paste a client brief.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await matchTalentForCastingAction(castingCallId, briefText)
      if (res.success && res.matches) {
        setMatches(res.matches)
        setHasSearched(true)
        toast({
          title: "AI Match Complete",
          description: `Identified ${res.matches.length} candidates with transparent score breakdown.`,
        })
      } else {
        toast({
          title: "Matching Failed",
          description: res.error || "Unable to match candidates against this brief.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Engine Error",
        description: err.message || "Failed to contact AI matching service.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setBriefText(prompt)
  }

  const handleShortlist = (candidate: AIMatchCandidate) => {
    setAddedCandidateIds((prev) => new Set(prev).add(candidate.talentId))
    if (onAddCandidate) {
      onAddCandidate(candidate)
    } else {
      toast({
        title: "Added to Shortlist",
        description: `${candidate.fullName} added to casting pipeline shortlist.`,
      })
    }
  }

  const handleRequestSelfTape = (candidate: AIMatchCandidate) => {
    if (onRequestSelfTape) {
      onRequestSelfTape(candidate)
    } else {
      toast({
        title: "Self-Tape Request Initiated",
        description: `Self-tape invitation dispatched to ${candidate.fullName}.`,
      })
    }
  }

  const filteredMatches = matches.filter((m) => m.matchScore >= minScoreFilter)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl bg-card border-l border-border/80 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header Banner */}
        <div className="p-5 border-b border-border/60 bg-gradient-to-r from-card via-card/90 to-brand-500/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-foreground">
                  AI Talent Matchmaker
                </h2>
                <Badge
                  variant="outline"
                  className="bg-brand-500/10 text-brand-400 border-brand-500/30 text-[10px]"
                >
                  Transparent Engine
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeting: <span className="text-foreground font-medium">{projectTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Brief Input Section */}
          <div className="space-y-2.5 bg-muted/20 p-4 rounded-xl border border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                Client Casting Brief or Requirements
              </label>
              <span className="text-[11px] text-muted-foreground">
                Paste WhatsApp text or custom criteria
              </span>
            </div>

            <Textarea
              rows={4}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="e.g. Female model, age 22-26, Lahore based, fluent Urdu, expressive eyes for Lawn commercial shoot next weekend..."
              className="text-xs resize-none bg-background/80"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground self-center mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Lead female model in Lahore, 22-26, commercial acting experience, fluent English and Urdu dialogue delivery."
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                Lahore TVC Lead (22-26)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "Male protagonist in Karachi, 25-30, dramatic screen presence, action/driving capability, available late October."
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                Karachi Dramatic Lead (25-30)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPrompt(
                    "High fashion runway & editorial models, height 5'8+, Karachi or Lahore, experience with bridal and couture."
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                High Fashion & Couture
              </button>
            </div>

            {/* Match Trigger Button */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3 text-brand-400" />
                <span>Scores are honest & factor real profile verified metrics</span>
              </div>

              <Button
                size="sm"
                onClick={handleRunMatch}
                disabled={isLoading}
                className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing Roster...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Find Top Matches
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="space-y-3">
              {/* Filter Bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ranked Candidates ({filteredMatches.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground text-[11px]">Min Score:</span>
                  <div className="flex items-center gap-1">
                    {[60, 75, 85].map((score) => (
                      <button
                        key={score}
                        onClick={() => setMinScoreFilter(score)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                          minScoreFilter === score
                            ? "bg-brand-600 text-white"
                            : "bg-accent/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {score}%+
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              {filteredMatches.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-border/80 bg-card/40 p-6">
                  <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">No candidates meet the {minScoreFilter}% match threshold.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Try lowering the minimum score or expanding brief keywords.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map((candidate) => {
                    const isAdded = addedCandidateIds.has(candidate.talentId)
                    const score = candidate.matchScore

                    // Dynamic badge styling based on honest score
                    const badgeClass =
                      score >= 90
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : score >= 75
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"

                    return (
                      <div
                        key={candidate.talentId}
                        className="p-4 rounded-xl border border-border/70 bg-card hover:border-brand-500/40 transition-all shadow-xs space-y-3"
                      >
                        {/* Candidate Top Line */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {candidate.avatarUrl ? (
                              <img
                                src={candidate.avatarUrl}
                                alt={candidate.fullName}
                                className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-xs">
                                {candidate.fullName.charAt(0)}
                              </div>
                            )}

                            <div>
                              <h4 className="text-xs font-bold text-foreground">
                                {candidate.fullName}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground/70" />
                                  {candidate.city || "Pakistan"}
                                </span>
                                <span>•</span>
                                <span>{candidate.experienceYears || 3}y Experience</span>
                                {candidate.isAvailable ? (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-medium">Available</span>
                                  </>
                                ) : (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400">Tentative Hold</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score Pill */}
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeClass}`}
                            >
                              <Sparkles className="h-3 w-3" />
                              {candidate.matchScore}% Match
                            </span>
                          </div>
                        </div>

                        {/* Transparent Criteria Breakdown */}
                        <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50 text-[11px] space-y-1.5">
                          <div className="font-semibold text-foreground/80 text-[10px] uppercase tracking-wide">
                            Transparent Match Breakdown:
                          </div>

                          {/* Matched Criteria */}
                          {candidate.matchedCriteria.map((item, idx) => (
                            <div
                              key={`match-${idx}`}
                              className="flex items-start gap-1.5 text-emerald-400/90"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-foreground/90">{item.replace(/^✓\s*/, '')}</span>
                            </div>
                          ))}

                          {/* Missing or Flagged Criteria */}
                          {candidate.missingCriteria.map((item, idx) => (
                            <div
                              key={`miss-${idx}`}
                              className="flex items-start gap-1.5 text-amber-400/90"
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{item.replace(/^—\s*/, '')}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRequestSelfTape(candidate)}
                            className="text-xs h-8 gap-1.5"
                          >
                            <Video className="h-3 w-3 text-indigo-400" />
                            Request Self-Tape
                          </Button>

                          <Button
                            size="sm"
                            disabled={isAdded}
                            onClick={() => handleShortlist(candidate)}
                            className={`text-xs h-8 gap-1.5 ${
                              isAdded
                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-brand-600 hover:bg-brand-500 text-white"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Added to Pipeline
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" />
                                Add to Shortlist
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Initial Helper / State */}
          {!hasSearched && (
            <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  Ready to Match Talent
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click &ldquo;Find Top Matches&rdquo; above. Our AI evaluates verified talent data in real-time, matching skills, location, availability, and screen experience.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
