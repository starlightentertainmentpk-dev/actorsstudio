"use client"

import { useState, useTransition } from "react"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { submitAuditionResult } from "@/app/(dashboard)/producer/applications/actions"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  FileVideo,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PenSquare
} from "lucide-react"

type AuditionWithDetails = {
  id: string
  casting_call_id: string
  talent_id: string
  mode: "in_person" | "self_tape" | "video_call"
  scheduled_at: string
  location_or_link: string | null
  feedback: string | null
  score: number | null
  result: "pending" | "pass" | "fail"
  casting_calls: {
    title: string
    location: string | null
    producer_id: string
  }
  talent_profiles: {
    id: string
    full_name: string
    stage_name: string | null
    user_id: string
  }
  photo_url?: string
}

export default function ProducerAuditionsPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Modal / Drawer state for reviewing
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedAudition, setSelectedAudition] = useState<AuditionWithDetails | null>(null)
  const [score, setScore] = useState("5.00")
  const [feedback, setFeedback] = useState("")
  const [resultDecision, setResultDecision] = useState<"pass" | "fail">("pass")

  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState("")

  // 1. Fetch producer profile
  const { data: producerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["producer-profile-auditions", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // 2. Fetch auditions across all casting calls for this producer
  const { data: auditions = [], isLoading: auditionsLoading } = useQuery<AuditionWithDetails[]>({
    queryKey: ["producer-auditions-list", producerProfile?.id],
    queryFn: async () => {
      if (!producerProfile?.id) return []
      
      const { data, error } = await supabase
        .from("auditions")
        .select(`
          *,
          casting_calls!inner (
            title,
            location,
            producer_id
          ),
          talent_profiles (
            id,
            full_name,
            stage_name,
            user_id
          )
        `)
        .eq("casting_calls.producer_id", producerProfile.id)
        .order("scheduled_at", { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return []

      // Fetch primary photos for all talents in bulk
      const userIds = data.map((a: any) => a.talent_profiles?.user_id).filter(Boolean)
      const { data: photos } = await supabase
        .from("media_assets")
        .select("owner_id, url")
        .eq("type", "photo")
        .eq("is_primary", true)
        .in("owner_id", userIds)

      const photoMap = new Map<string, string>()
      photos?.forEach((photo) => {
        photoMap.set(photo.owner_id, photo.url)
      })

      return data.map((a: any) => ({
        ...a,
        photo_url: a.talent_profiles ? photoMap.get(a.talent_profiles.user_id) : undefined,
      })) as AuditionWithDetails[]
    },
    enabled: !!producerProfile?.id
  })

  const isLoading = authLoading || profileLoading || auditionsLoading

  const handleOpenReview = (audition: AuditionWithDetails) => {
    setSelectedAudition(audition)
    setScore(audition.score !== null ? audition.score.toFixed(2) : "5.00")
    setFeedback(audition.feedback || "")
    setResultDecision(audition.result === "fail" ? "fail" : "pass")
    setActionError("")
    setReviewModalOpen(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAudition) return
    const numericScore = parseFloat(score)

    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      setActionError("Please enter a valid score between 0.00 and 10.00.")
      return
    }

    setActionError("")
    startTransition(async () => {
      try {
        await submitAuditionResult(selectedAudition.id, numericScore, feedback, resultDecision)
        queryClient.invalidateQueries({ queryKey: ["producer-auditions-list"] })
        setReviewModalOpen(false)
      } catch (err: any) {
        setActionError(err.message || "Failed to submit feedback.")
      }
    })
  }

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "in_person":
        return {
          label: "In Person",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          icon: MapPin,
        }
      case "video_call":
        return {
          label: "Video Call",
          style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
          icon: Video,
        }
      case "self_tape":
        return {
          label: "Self Tape",
          style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          icon: FileVideo,
        }
      default:
        return {
          label: "Unknown",
          style: "bg-muted text-muted-foreground border border-border",
          icon: HelpCircle,
        }
    }
  }

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case "pass":
        return {
          label: "Passed",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold",
          icon: CheckCircle2,
        }
      case "fail":
        return {
          label: "Failed / Declined",
          style: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
          icon: XCircle,
        }
      case "pending":
      default:
        return {
          label: "Pending Review",
          style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse",
          icon: Clock,
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading audition schedules...</p>
        </div>
      </div>
    )
  }

  if (!producerProfile) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Producer Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">Please complete producer registration first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-brand-500" /> Auditions Manager
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor your casting call audition schedules, view applicant cards, and grade performance.
        </p>
      </div>

      {actionError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Review Error</p>
            <p className="text-xs mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {auditions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center bg-card/25 border border-border/40 rounded-2xl">
          <Calendar className="h-12 w-12 text-muted-foreground/45 mb-3" />
          <p className="text-base font-bold text-foreground">No Auditions Found</p>
          <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">
            Schedule auditions for shortlisted talent from your Casting Call Applicants Directory.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {auditions.map((audition) => {
            const modeDetails = getModeBadge(audition.mode)
            const resultDetails = getResultBadge(audition.result)
            const ModeIcon = modeDetails.icon
            const ResultIcon = resultDetails.icon
            const talent = audition.talent_profiles
            const displayName = talent?.stage_name || talent?.full_name || "Unknown Talent"

            const scheduledDate = audition.scheduled_at ? new Date(audition.scheduled_at) : null
            const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }) : "TBD"
            const formattedTime = scheduledDate ? scheduledDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }) : "TBD"

            return (
              <div
                key={audition.id}
                className="bg-card/25 border border-border/40 hover:border-brand-500/30 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Top Bar: Avatars & Badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border bg-background">
                        {audition.photo_url ? (
                          <img
                            src={audition.photo_url}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-base uppercase">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm leading-tight">
                          {displayName}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          For: {audition.casting_calls.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0 ${modeDetails.style}`}
                      >
                        <ModeIcon className="h-2.5 w-2.5" />
                        {modeDetails.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0 ${resultDetails.style}`}
                      >
                        <ResultIcon className="h-2.5 w-2.5" />
                        {resultDetails.label}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled date & time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                    <span>
                      {formattedDate} at {formattedTime}
                    </span>
                  </div>

                  {/* Location or Join Link details */}
                  {audition.location_or_link && (
                    <div className="bg-background/20 border border-border/30 rounded-xl p-3 text-xs leading-relaxed font-medium text-foreground">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Meeting Details
                      </span>
                      {audition.mode === "video_call" ? (
                        <a
                          href={audition.location_or_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-500 hover:text-brand-600 font-semibold underline flex items-center gap-1"
                        >
                          Join Meeting URL
                        </a>
                      ) : (
                        <span>{audition.location_or_link}</span>
                      )}
                    </div>
                  )}

                  {/* Feedback Details if evaluated */}
                  {(audition.score !== null || audition.feedback) && (
                    <div className="bg-muted/30 border border-border/20 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">
                          Audition Grade
                        </span>
                        {audition.score !== null && (
                          <span className="text-brand-500 font-bold">
                            Score: {Number(audition.score).toFixed(2)}/10
                          </span>
                        )}
                      </div>
                      {audition.feedback && (
                        <p className="italic text-foreground/80">
                          "{audition.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Feedback CTA Button */}
                {audition.result === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleOpenReview(audition)}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-brand-500/10"
                  >
                    <PenSquare className="h-4 w-4" /> Review Audition & Score
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Review Modal Form */}
      {reviewModalOpen && selectedAudition && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Submit Audition Review</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grading performance for{" "}
                  <strong className="text-foreground">
                    {selectedAudition.talent_profiles?.stage_name || selectedAudition.talent_profiles?.full_name}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {/* Score Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground block">
                    Score (0.00 - 10.00)
                  </label>
                  <span className="text-xs font-bold text-brand-500">{score}/10.00</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="10.00"
                  step="0.10"
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value).toFixed(2))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <input
                  type="number"
                  min="0.00"
                  max="10.00"
                  step="0.01"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all mt-1"
                  required
                />
              </div>

              {/* Feedback Comments */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Feedback Comments
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on acting ability, screen presence, and notes..."
                  className="w-full h-24 p-3 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all leading-relaxed"
                  required
                />
              </div>

              {/* Outcome Decision Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Outcome Decision
                </label>
                <select
                  value={resultDecision}
                  onChange={(e: any) => setResultDecision(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                  required
                >
                  <option value="pass">Approve / Select (Move to Selected)</option>
                  <option value="fail">Decline (Move to Rejected)</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReviewModalOpen(false)}
                  className="h-9 rounded-lg font-semibold cursor-pointer border border-border/50 text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/10 h-9 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Submit Grade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
