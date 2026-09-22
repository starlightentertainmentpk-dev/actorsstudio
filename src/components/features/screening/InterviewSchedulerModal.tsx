"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { InterviewDetails } from "@/lib/screening"
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Film,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface InterviewSchedulerModalProps {
  isOpen: boolean
  onClose: () => void
  candidateName: string
  jobTitle: string
  initialData?: InterviewDetails
  onSchedule: (details: InterviewDetails) => Promise<void>
}

export function InterviewSchedulerModal({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  initialData,
  onSchedule,
}: InterviewSchedulerModalProps) {
  const [mode, setMode] = useState<"in_person" | "video_call" | "self_tape">(
    initialData?.mode || "video_call"
  )
  const [scheduledAt, setScheduledAt] = useState<string>(
    initialData?.scheduledAt
      ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
      : ""
  )
  const [locationOrLink, setLocationOrLink] = useState<string>(
    initialData?.locationOrLink || ""
  )
  const [instructions, setInstructions] = useState<string>(
    initialData?.instructions || ""
  )

  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!scheduledAt) {
      setErrorMsg("Please select a valid date and time for the interview/audition.")
      return
    }

    if (!locationOrLink.trim()) {
      setErrorMsg(
        mode === "video_call"
          ? "Please provide a meeting link (Zoom, Google Meet, etc.)."
          : mode === "in_person"
          ? "Please provide the studio or venue location address."
          : "Please specify where the candidate should submit their self-tape."
      )
      return
    }

    startTransition(async () => {
      try {
        await onSchedule({
          mode,
          scheduledAt: new Date(scheduledAt).toISOString(),
          locationOrLink: locationOrLink.trim(),
          instructions: instructions.trim() || undefined,
        })
        onClose()
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to schedule interview.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Call for Interview / Audition
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inviting <strong className="text-foreground">{candidateName}</strong> for <span className="text-brand-500">{jobTitle}</span>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Audition / Interview Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMode("video_call")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  mode === "video_call"
                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Video Call</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("in_person")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  mode === "in_person"
                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>In-Person</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("self_tape")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  mode === "self_tape"
                    ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Self-Tape</span>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Interview Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Location or Meeting Link */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {mode === "video_call" ? (
                <Video className="h-3.5 w-3.5 text-muted-foreground" />
              ) : mode === "in_person" ? (
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Film className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span>
                {mode === "video_call"
                  ? "Meeting URL (Zoom / Google Meet)"
                  : mode === "in_person"
                  ? "Studio / Venue Address"
                  : "Submission Upload URL / Drive Link"}
              </span>
            </label>
            <input
              type="text"
              placeholder={
                mode === "video_call"
                  ? "https://meet.google.com/xyz-abc"
                  : mode === "in_person"
                  ? "Studio 4, Actor's Studio Complex, Karachi"
                  : "https://dropbox.com/request/... or email"
              }
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Instructions / Audition Sides */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Candidate Preparation Notes & Instructions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please prepare a 2-minute dramatic monologue and wear solid dark clothing."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 rounded-xl border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl h-10 text-xs px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 text-xs px-5 font-semibold shadow-md shadow-purple-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Send Interview Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
