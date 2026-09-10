"use client"

import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { 
  Calendar, 
  MapPin, 
  Video, 
  FileVideo, 
  ExternalLink, 
  Clock, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  HelpCircle
} from "lucide-react"

export default function TalentAuditionsPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()

  // Fetch talent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile-auditions", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Fetch scheduled auditions
  const { data: auditions = [], isLoading: auditionsLoading } = useQuery({
    queryKey: ["talent-auditions-list", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from("auditions")
        .select(`
          *,
          casting_calls (
            title,
            location
          )
        `)
        .eq("talent_id", profile.id)
        .order("scheduled_at", { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id
  })

  const isLoading = authLoading || profileLoading || auditionsLoading

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "in_person":
        return {
          label: "In Person (Physical)",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          icon: MapPin,
        }
      case "video_call":
        return {
          label: "Video Call (Online)",
          style: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
          icon: Video,
        }
      case "self_tape":
        return {
          label: "Self Tape (Recorded)",
          style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          icon: FileVideo,
        }
      default:
        return {
          label: "Unknown Mode",
          style: "bg-muted text-muted-foreground border border-border",
          icon: HelpCircle,
        }
    }
  }

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case "pass":
        return {
          label: "Selected",
          style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold",
          icon: CheckCircle2,
        }
      case "fail":
        return {
          label: "Declined",
          style: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
          icon: XCircle,
        }
      case "pending":
      default:
        return {
          label: "Pending Outcome",
          style: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          icon: Clock,
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading auditions schedule...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Talent Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">Please complete onboarding first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-brand-500" /> Auditions Schedule
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View your upcoming and past auditions, location links, and final feedback outcomes.
        </p>
      </div>

      {auditions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center bg-card/25 border border-border/40 rounded-2xl">
          <Calendar className="h-12 w-12 text-muted-foreground/45 mb-3" />
          <p className="text-base font-bold text-foreground">No Auditions Scheduled Yet</p>
          <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">
            Producers will schedule auditions once they shortlist your application. Check back here later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {auditions.map((audition) => {
            const modeDetails = getModeBadge(audition.mode)
            const resultDetails = getResultBadge(audition.result)
            const ModeIcon = modeDetails.icon
            const ResultIcon = resultDetails.icon
            const call = audition.casting_calls

            const scheduledDate = audition.scheduled_at ? new Date(audition.scheduled_at) : null
            const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }) : "TBD"
            const formattedTime = scheduledDate ? scheduledDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }) : "TBD"

            return (
              <div
                key={audition.id}
                className="bg-card/25 border border-border/40 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${modeDetails.style}`}
                    >
                      <ModeIcon className="h-3 w-3" />
                      {modeDetails.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${resultDetails.style}`}
                    >
                      <ResultIcon className="h-3 w-3" />
                      {resultDetails.label}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-bold text-foreground text-lg">
                      {call?.title || "Untitled Casting Call"}
                    </h3>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                    <span>
                      {formattedDate} at {formattedTime}
                    </span>
                  </div>

                  {/* Location or joining link */}
                  {audition.location_or_link && (
                    <div className="bg-background/25 border border-border/30 rounded-xl p-3.5 space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Details & Instructions
                      </span>
                      {audition.mode === "video_call" ? (
                        <a
                          href={audition.location_or_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                        >
                          Join Meeting <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {audition.location_or_link}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Score & Feedback Area if evaluated */}
                {(audition.score !== null || audition.feedback) && (
                  <div className="border-t border-border/40 pt-4 mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">
                        Producer Review
                      </span>
                      {audition.score !== null && (
                        <span className="font-bold text-brand-500">
                          Score: {Number(audition.score).toFixed(2)}/10.00
                        </span>
                      )}
                    </div>
                    {audition.feedback && (
                      <p className="text-xs text-foreground italic bg-muted/40 p-3 rounded-xl border border-border/20 leading-relaxed">
                        "{audition.feedback}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
