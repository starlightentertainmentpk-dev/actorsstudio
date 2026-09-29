"use client"

import React, { useState, useRef, useEffect } from "react"
import { SelfTapeRequest, SelfTapeSubmission, SelfTapeReview } from "@/types/self-tape"
import { PipelineCandidate } from "@/types/pipeline"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  X,
  Send,
  Star,
  Film,
  Download,
  FileText,
  UserCheck,
} from "lucide-react"

interface SelfTapeReviewSuiteProps {
  request: SelfTapeRequest
  candidate?: PipelineCandidate | null
  isOpen: boolean
  onClose: () => void
  onAddComment: (data: {
    submissionId: string
    timestampSec?: number
    comments: string
    score?: number
    decision?: "shortlist" | "pass" | "re_tape" | "select"
    reviewerType?: "agency" | "client"
  }) => Promise<any>
  onCandidateDecision?: (decision: "shortlist" | "pass" | "re_tape" | "select") => void
}

export function SelfTapeReviewSuite({
  request,
  candidate,
  isOpen,
  onClose,
  onAddComment,
  onCandidateDecision,
}: SelfTapeReviewSuiteProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const submission = request.submission

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(15) // default fallback duration
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Review & Commenting state
  const [newComment, setNewComment] = useState("")
  const [commentScore, setCommentScore] = useState<number>(8.0)
  const [useCurrentTimestamp, setUseCurrentTimestamp] = useState(true)
  const [customTimestamp, setCustomTimestamp] = useState("00:00")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [retapePromptOpen, setRetapePromptOpen] = useState(false)
  const [retapeNotes, setRetapeNotes] = useState("")

  // Local reviews state for instant optimistic updates
  const [localReviews, setLocalReviews] = useState<SelfTapeReview[]>(
    submission?.reviews || []
  )

  useEffect(() => {
    if (submission?.reviews) {
      setLocalReviews(submission.reviews)
    }
  }, [submission?.reviews])

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remSecs = Math.floor(secs % 60)
    return `${mins < 10 ? "0" : ""}${mins}:${remSecs < 10 ? "0" : ""}${remSecs}`
  }

  // Parse MM:SS to seconds
  const parseTimeToSeconds = (str: string) => {
    const parts = str.split(":")
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseFloat(parts[1])
    }
    return parseFloat(str) || 0
  }

  if (!isOpen) return null

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      if (useCurrentTimestamp) {
        setCustomTimestamp(formatTime(videoRef.current.currentTime))
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 15)
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime
      setCurrentTime(targetTime)
    }
  }

  const jumpToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      setCurrentTime(seconds)
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Handle adding timestamped comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submission?.id) {
      toast({
        title: "No Submission Found",
        description: "Cannot leave a review comment without a valid submission.",
        type: "error",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter feedback for this self-tape timestamp.",
        type: "error",
      })
      return
    }

    const stamp = useCurrentTimestamp ? currentTime : parseTimeToSeconds(customTimestamp)

    try {
      setIsSubmittingComment(true)
      const res = await onAddComment({
        submissionId: submission.id,
        timestampSec: Math.round(stamp * 10) / 10,
        comments: newComment.trim(),
        score: commentScore,
        reviewerType: "agency",
      })

      const optimisticReview: SelfTapeReview = {
        id: `rev-${Date.now()}`,
        self_tape_submission_id: submission.id,
        reviewer_user_id: "agent-current",
        reviewer_type: "agency",
        timestamp_sec: Math.round(stamp * 10) / 10,
        comments: newComment.trim(),
        score: commentScore,
        created_at: new Date().toISOString(),
        reviewer: {
          email: "agent@actorsstudio.pk",
          name: "Agency Casting Director",
        },
      }

      setLocalReviews((prev) => [...prev, optimisticReview])
      setNewComment("")

      toast({
        title: "Timestamped Note Added",
        description: `Feedback recorded at ${formatTime(stamp)}.`,
        type: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to Add Note",
        description: err.message || "Could not record comment.",
        type: "error",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Action decisions (Shortlist, Re-Tape, Pass)
  const handleDecision = async (
    decision: "shortlist" | "pass" | "re_tape" | "select",
    customNote?: string
  ) => {
    if (!submission?.id) return

    try {
      const decisionLabels = {
        shortlist: "Shortlisted Candidate",
        pass: "Candidate Passed",
        re_tape: "Re-Tape Requested",
        select: "Selected for Role",
      }

      await onAddComment({
        submissionId: submission.id,
        comments: customNote || `Marked as ${decisionLabels[decision]} during review suite session.`,
        decision,
        reviewerType: "agency",
      })

      toast({
        title: decisionLabels[decision],
        description: `Status updated successfully for ${request.talent?.full_name || "talent"}.`,
        type: decision === "pass" ? "warning" : "success",
      })

      if (onCandidateDecision) {
        onCandidateDecision(decision)
      }

      if (decision === "re_tape") {
        setRetapePromptOpen(false)
      }
    } catch (err: any) {
      toast({
        title: "Decision Failed",
        description: err.message || "Could not apply decision.",
        type: "error",
      })
    }
  }

  const talentDetails = request.talent || candidate?.talent
  const videoSrc =
    submission?.video_signed_url ||
    submission?.video_storage_path ||
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-6xl h-[95vh] rounded-2xl border border-border/80 bg-card text-foreground shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/70 bg-card/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  Audition Review Suite: {talentDetails?.full_name || "Talent Candidate"}
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30"
                >
                  {request.role?.role_name || "Audition Self-Tape"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {request.casting_call?.title} • Submitted{" "}
                {submission?.submitted_at
                  ? new Date(submission.submitted_at).toLocaleDateString()
                  : "Recently"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg border border-border/40 hover:bg-accent transition-colors"
            title="Close Review Suite"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Content: Split Player and Review Sidebar */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Side: Video Player Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-black/95 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border/60">
            {/* Video Container */}
            <div
              ref={videoContainerRef}
              className="flex-1 relative flex items-center justify-center bg-black overflow-hidden group select-none"
            >
              {submission ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="max-h-full max-w-full w-auto h-auto object-contain cursor-pointer"
                  onClick={togglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Film className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Self-tape requested. Awaiting video upload from candidate.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Talent can submit at <span className="font-mono text-brand-400">/talent/self-tapes</span>
                  </p>
                </div>
              )}

              {/* Big Play Overlay Button when paused */}
              {submission && !isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-purple-600/90 hover:bg-purple-600 text-white flex items-center justify-center shadow-xl backdrop-blur-xs transition-transform transform hover:scale-105 active:scale-95"
                >
                  <Play className="h-7 w-7 fill-white translate-x-0.5" />
                </button>
              )}

              {/* Timestamp Markers Overlay along timeline */}
              {localReviews.length > 0 && duration > 0 && (
                <div className="absolute bottom-16 left-4 right-4 h-1 pointer-events-none z-20">
                  {localReviews.map((rev) => {
                    if (rev.timestamp_sec === null || rev.timestamp_sec === undefined) return null
                    const pct = Math.min(100, Math.max(0, (rev.timestamp_sec / duration) * 100))
                    return (
                      <div
                        key={rev.id}
                        style={{ left: `${pct}%` }}
                        className="absolute -top-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black transform -translate-x-1/2 cursor-pointer pointer-events-auto hover:scale-150 transition-transform"
                        title={`Comment at ${formatTime(rev.timestamp_sec)}: "${rev.comments}"`}
                        onClick={(e) => {
                          e.stopPropagation()
                          jumpToTime(rev.timestamp_sec!)
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            {submission && (
              <div className="p-3 bg-zinc-950/95 border-t border-border/40 space-y-2 select-none">
                {/* Scrubber Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Bottom Row: Play, Jump, Volume, Speed, Fullscreen */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                      title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => jumpToTime(Math.max(0, currentTime - 5))}
                      className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                      title="Rewind 5 seconds"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                      >
                        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Speed Selector (0.75x, 1x, 1.25x, 1.5x) */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
                    {[0.75, 1.0, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                          playbackSpeed === spd
                            ? "bg-purple-600 text-white font-medium"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                    title="Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Talent Notes Snippet under video */}
            {submission?.talent_notes && (
              <div className="px-4 py-2.5 bg-zinc-900/80 border-t border-border/40 flex items-start gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-300">Talent Note: </span>
                  <span className="text-zinc-400 italic">&ldquo;{submission.talent_notes}&rdquo;</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Review & Timestamped Comments Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col bg-card overflow-y-auto">
            {/* Candidate Quick Comp-Card Header */}
            <div className="p-4 border-b border-border/70 space-y-3 bg-accent/20">
              <div className="flex items-start gap-3">
                {talentDetails?.avatar_url ? (
                  <img
                    src={talentDetails.avatar_url}
                    alt={talentDetails.full_name}
                    className="h-14 w-14 rounded-xl object-cover border border-border shadow-xs shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
                    {talentDetails?.full_name?.charAt(0) || "T"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {talentDetails?.stage_name || talentDetails?.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    {talentDetails?.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {talentDetails.city}
                      </span>
                    )}
                    {talentDetails?.height_cm && <span>{talentDetails.height_cm} cm</span>}
                  </div>
                  {candidate?.proposed_fee && (
                    <div className="mt-1 text-[11px] font-mono text-emerald-400">
                      Fee: {candidate.currency} {candidate.proposed_fee.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions summary button */}
              <div className="text-[11px] p-2.5 rounded-lg bg-background/80 border border-border/60 text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">Scene Instructions:</span>
                <p className="line-clamp-2 italic">{request.instructions}</p>
                {request.sides_script_url && (
                  <a
                    href={request.sides_script_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-[10px] font-medium pt-0.5"
                  >
                    <Download className="h-2.5 w-2.5" />
                    Download Sides Script (PDF)
                  </a>
                )}
              </div>
            </div>

            {/* Decision Action Buttons Toolbar */}
            <div className="p-3 border-b border-border/70 bg-card/80 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Audition Decision
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecision("shortlist")}
                  className="text-xs h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Shortlist
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRetapePromptOpen(true)}
                  className="text-xs h-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Re-Tape
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecision("pass")}
                  className="text-xs h-8 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 font-medium"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Pass
                </Button>
              </div>

              {/* Retape prompt popover if active */}
              {retapePromptOpen && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-in fade-in duration-100">
                  <span className="text-xs font-semibold text-amber-300 block">
                    Specify Re-Take Director Notes:
                  </span>
                  <textarea
                    rows={2}
                    value={retapeNotes}
                    onChange={(e) => setRetapeNotes(e.target.value)}
                    placeholder="e.g. Loved the energy, please try a take with tighter eye contact and less vocal projection."
                    className="w-full text-xs p-2 rounded-md border border-amber-500/30 bg-background text-foreground"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[11px]"
                      onClick={() => setRetapePromptOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-[11px] bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleDecision("re_tape", retapeNotes)}
                    >
                      Dispatch Re-Tape
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamped Comments Feed */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                  Timestamped Commentary ({localReviews.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Click note to seek video</span>
              </div>

              {localReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
                  <Clock className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1" />
                  <p>No feedback recorded yet.</p>
                  <p className="text-[11px]">Type below to attach notes anchored to video seconds.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {localReviews.map((rev) => (
                    <div
                      key={rev.id}
                      onClick={() => {
                        if (rev.timestamp_sec !== null && rev.timestamp_sec !== undefined) {
                          jumpToTime(rev.timestamp_sec)
                        }
                      }}
                      className="group p-2.5 rounded-xl border border-border/70 hover:border-purple-500/40 bg-card/90 hover:bg-accent/40 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {rev.timestamp_sec !== null && rev.timestamp_sec !== undefined && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(rev.timestamp_sec)}
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {rev.reviewer?.name || rev.reviewer_type}
                          </span>
                        </div>
                        {rev.score && (
                          <span className="text-[10px] font-mono font-semibold text-amber-400 flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-amber-400" />
                            {rev.score}/10
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed">{rev.comments}</p>

                      {rev.decision && (
                        <div className="pt-0.5">
                          <span className="inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                            Decision: {rev.decision}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Input Form */}
            {submission && (
              <form
                onSubmit={handlePostComment}
                className="p-3 border-t border-border/70 bg-accent/10 space-y-2 shrink-0"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">Anchor at:</span>
                    <button
                      type="button"
                      onClick={() => setUseCurrentTimestamp(!useCurrentTimestamp)}
                      className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30"
                      title="Toggle live timestamp vs custom"
                    >
                      {useCurrentTimestamp ? formatTime(currentTime) : customTimestamp}
                    </button>
                    {!useCurrentTimestamp && (
                      <Input
                        value={customTimestamp}
                        onChange={(e) => setCustomTimestamp(e.target.value)}
                        placeholder="MM:SS"
                        className="w-16 h-6 text-[10px] font-mono p-1"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Score:</span>
                    <select
                      value={commentScore}
                      onChange={(e) => setCommentScore(parseFloat(e.target.value))}
                      className="h-6 text-[10px] bg-background border border-border rounded px-1 text-foreground"
                    >
                      {[10, 9, 8.5, 8, 7.5, 7, 6, 5, 4].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add timestamped note (e.g. Great intensity at this beat)..."
                    className="text-xs h-8 bg-background flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
