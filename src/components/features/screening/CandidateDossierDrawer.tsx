"use client"

import { useState, useTransition } from "react"
import {
  ScreeningStage,
  ScreeningMetadata,
  STAGE_CONFIG,
} from "@/lib/screening"
import { Button } from "@/components/ui/button"
import { InterviewSchedulerModal } from "./InterviewSchedulerModal"
import {
  X,
  Star,
  Printer,
  FileText,
  Video,
  Mic,
  MapPin,
  Calendar,
  Languages,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Play,
  UserCheck,
  PauseCircle,
  FileCheck,
  ChevronRight,
} from "lucide-react"

export interface ApplicantDossierData {
  id: string
  casting_call_id: string
  talent_id: string
  applied_at: string
  cleanCoverNote: string
  effectiveStage: ScreeningStage
  screening: ScreeningMetadata
  casting_call: {
    id: string
    title: string
    location?: string | null
    requirements_json?: any
  }
  talent_profile: {
    id: string
    user_id: string
    slug: string | null
    full_name: string
    stage_name: string | null
    category_name?: string
    sub_category_name?: string
    city?: string | null
    experience_years?: number | null
    dob?: string | null
    height_cm?: number | null
    weight_kg?: number | null
    skills?: string[] | null
    languages?: string[] | null
    users?: {
      email?: string
      phone?: string
    }
  }
  media_assets: Array<{
    id: string
    type: string
    url: string
    thumbnail_url?: string | null
    is_primary: boolean
    duration_sec?: number | null
  }>
}

interface CandidateDossierDrawerProps {
  isOpen: boolean
  onClose: () => void
  applicant: ApplicantDossierData | null
  onStageChange: (stage: ScreeningStage) => Promise<void>
  onRatingChange: (rating: number) => Promise<void>
  onNotesChange: (notes: string) => Promise<void>
  onScheduleInterview: (details: any) => Promise<void>
}

export function CandidateDossierDrawer({
  isOpen,
  onClose,
  applicant,
  onStageChange,
  onRatingChange,
  onNotesChange,
  onScheduleInterview,
}: CandidateDossierDrawerProps) {
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [notes, setNotes] = useState(applicant?.screening.notes || "")
  const [rating, setRating] = useState(applicant?.screening.rating || 0)
  const [notesSaved, setNotesSaved] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")

  if (!isOpen || !applicant) return null

  const talent = applicant.talent_profile
  const displayName = talent.stage_name || talent.full_name
  const primaryPhoto =
    applicant.media_assets.find((m) => m.is_primary && m.type === "photo")?.url ||
    applicant.media_assets.find((m) => m.type === "photo")?.url ||
    null

  const videoReels = applicant.media_assets.filter((m) => m.type === "video" || m.type === "reel")
  const voiceClips = applicant.media_assets.filter((m) => m.type === "voice_sample" || m.type === "audio")
  const photos = applicant.media_assets.filter((m) => m.type === "photo")

  const currentStage = applicant.effectiveStage
  const stageConfig = STAGE_CONFIG[currentStage] || STAGE_CONFIG.applied

  // Quick Action Handler
  const handleStageSelect = (newStage: ScreeningStage) => {
    if (newStage === "audition") {
      setSchedulerOpen(true)
      return
    }

    setErrorMsg("")
    startTransition(async () => {
      try {
        await onStageChange(newStage)
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update stage.")
      }
    })
  }

  const handleRatingClick = (newRating: number) => {
    setRating(newRating)
    startTransition(async () => {
      try {
        await onRatingChange(newRating)
      } catch (err: any) {
        console.error(err)
      }
    })
  }

  const handleNotesSave = () => {
    setErrorMsg("")
    startTransition(async () => {
      try {
        await onNotesChange(notes)
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to save recruiter notes.")
      }
    })
  }

  const pdfSlugOrId = talent.slug || talent.id

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-card border-l border-border/60 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${stageConfig.badgeColor}`}
            >
              {stageConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Applied on {new Date(applicant.applied_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Candidate Card Summary */}
          <div className="flex flex-col sm:flex-row gap-5 items-start p-5 rounded-2xl bg-muted/20 border border-border/50">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-muted border border-border/60 shrink-0 shadow-sm">
              {primaryPhoto ? (
                <img
                  src={primaryPhoto}
                  alt={displayName}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  No Photo
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {displayName}
                  </h2>
                  <p className="text-xs font-medium text-brand-500">
                    {talent.category_name || "Talent"}{" "}
                    {talent.sub_category_name ? `• ${talent.sub_category_name}` : ""}
                  </p>
                </div>
              </div>

              {/* Star Rating Widget */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                  Rating:
                </span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="p-0.5 text-muted-foreground/40 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        rating >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs font-bold text-amber-500 ml-1">
                    {rating}.0
                  </span>
                )}
              </div>

              {/* Quick Specs Tags */}
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                {talent.city && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border/50">
                    <MapPin className="h-3 w-3" /> {talent.city}
                  </span>
                )}
                {typeof talent.experience_years === "number" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border/50">
                    <Clock className="h-3 w-3" /> {talent.experience_years}{" "}
                    {talent.experience_years === 1 ? "yr exp" : "yrs exp"}
                  </span>
                )}
                {talent.height_cm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border/50">
                    {talent.height_cm} cm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick PDF Dossier Access Buttons */}
          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/15 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Printer className="h-4 w-4" />
                <span>One-Click Candidate PDF Downloads</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Ready to print / archive</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a
                href={`/api/talent/${pdfSlugOrId}/pdf?type=overview`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-card hover:bg-muted text-foreground border border-border/60 text-xs font-semibold shadow-xs transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-brand-500" />
                <span>1-Page Overview</span>
              </a>
              <a
                href={`/api/talent/${pdfSlugOrId}/pdf?type=full`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-card hover:bg-muted text-foreground border border-border/60 text-xs font-semibold shadow-xs transition-colors"
              >
                <FileCheck className="h-3.5 w-3.5 text-brand-500" />
                <span>Full Profile Dossier</span>
              </a>
              <a
                href={`/api/talent/${pdfSlugOrId}/pdf?type=comp_card`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-card hover:bg-muted text-foreground border border-border/60 text-xs font-semibold shadow-xs transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-brand-500" />
                <span>Comp Card</span>
              </a>
            </div>
          </div>

          {/* Cover Note Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Candidate Cover Note
            </h4>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-xs leading-relaxed text-foreground whitespace-pre-line">
              {applicant.cleanCoverNote || "No cover note provided."}
            </div>
          </div>

          {/* Media Showcase: Video Reels & Voice Samples */}
          {(videoReels.length > 0 || voiceClips.length > 0) && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reels & Audition Clips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videoReels.map((reel, idx) => (
                  <a
                    key={reel.id || idx}
                    href={reel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        Video Showreel {idx + 1}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span>Play Video Reel</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </p>
                    </div>
                  </a>
                ))}

                {voiceClips.map((clip, idx) => (
                  <div
                    key={clip.id || idx}
                    className="p-3 rounded-xl border border-border/60 bg-card space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-bold text-foreground truncate">
                        Voice Demo {idx + 1}
                      </span>
                    </div>
                    <audio
                      controls
                      src={clip.url}
                      className="w-full h-8"
                      preload="metadata"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery Showcase */}
          {photos.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Portfolio Headshots ({photos.length})
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(0, 4).map((p, idx) => (
                  <a
                    key={p.id || idx}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-3/4 rounded-lg overflow-hidden bg-muted border border-border/50 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={p.url}
                      alt="Headshot"
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Internal Recruiter Notes */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recruiter Notes & Hiring Assessment
              </h4>
              {notesSaved && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <textarea
              rows={3}
              placeholder="Add private evaluation notes visible only to your casting and production team..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleNotesSave}
                disabled={isPending}
                className="h-8 text-xs rounded-lg px-3 cursor-pointer"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Notes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer (Indeed-style 1-click stage progression) */}
        <div className="p-5 border-t border-border/50 bg-card shrink-0 space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Move Candidate Stage:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Button
              type="button"
              onClick={() => handleStageSelect("shortlisted")}
              disabled={isPending || currentStage === "shortlisted"}
              className={`h-10 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                currentStage === "shortlisted"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              Shortlist
            </Button>

            <Button
              type="button"
              onClick={() => handleStageSelect("deferred")}
              disabled={isPending || currentStage === "deferred"}
              className={`h-10 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                currentStage === "deferred"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                  : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              }`}
            >
              Defer / Maybe
            </Button>

            <Button
              type="button"
              onClick={() => handleStageSelect("audition")}
              disabled={isPending}
              className={`h-10 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                currentStage === "audition"
                  ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              }`}
            >
              Interview
            </Button>

            <Button
              type="button"
              onClick={() => handleStageSelect("selected")}
              disabled={isPending || currentStage === "selected"}
              className={`h-10 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                currentStage === "selected"
                  ? "bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/40"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
              }`}
            >
              Hire / Book
            </Button>

            <Button
              type="button"
              onClick={() => handleStageSelect("rejected")}
              disabled={isPending || currentStage === "rejected"}
              variant="outline"
              className={`h-10 text-xs font-semibold rounded-xl cursor-pointer border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all ${
                currentStage === "rejected" ? "opacity-50" : ""
              }`}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      <InterviewSchedulerModal
        isOpen={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        candidateName={displayName}
        jobTitle={applicant.casting_call.title}
        initialData={applicant.screening.interview}
        onSchedule={async (details) => {
          await onScheduleInterview(details)
        }}
      />
    </>
  )
}
