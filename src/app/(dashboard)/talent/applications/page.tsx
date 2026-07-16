"use client"

import { useState, useEffect, useTransition } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { withdrawApplication } from "@/app/(dashboard)/talent/casting/actions"
import Link from "next/link"
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  XCircle,
  Bell,
  ExternalLink
} from "lucide-react"

export default function TalentApplicationsPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "shortlisted" | "audition" | "selected" | "rejected_withdrawn">("all")
  const [expandedAppIds, setExpandedAppIds] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState("")

  // 1. Fetch talent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // 2. Fetch talent applications
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ["talent-applications", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          cover_note,
          applied_at,
          withdrawn_at,
          updated_at,
          casting_calls (
            id,
            title,
            location,
            application_deadline,
            compensation,
            producer_profiles (
              company_name,
              verified
            )
          )
        `)
        .eq("talent_id", profile.id)
        .order("applied_at", { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  // 3. Supabase Realtime Listener for status updates
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel("application-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `talent_id=eq.${profile.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["talent-applications"] })
          queryClient.invalidateQueries({ queryKey: ["applications-count"] })
          
          setNotification(`Your application status was updated to "${payload.new.status}"!`)
          setTimeout(() => setNotification(null), 7000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase, queryClient])

  const handleWithdraw = (appId: string) => {
    if (!confirm("Are you sure you want to withdraw your application? You can re-apply later, but the producer will not see you in the active shortlist.")) return

    setActionError("")
    startTransition(async () => {
      try {
        await withdrawApplication(appId)
        queryClient.invalidateQueries({ queryKey: ["talent-applications"] })
        queryClient.invalidateQueries({ queryKey: ["applications-count"] })
      } catch (err: any) {
        setActionError(err.message || "Failed to withdraw application.")
      }
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedAppIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const isLoading = authLoading || profileLoading || appsLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Profile not found</h2>
          <p className="text-sm text-muted-foreground">Please complete onboarding to access applications.</p>
        </div>
      </div>
    )
  }

  // Filter application list based on active tab
  const filteredApps = applications.filter((app) => {
    if (activeTab === "all") return true
    if (activeTab === "rejected_withdrawn") return app.status === "rejected" || app.status === "withdrawn"
    return app.status === activeTab
  })

  // Tab Badge Configuration
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
      case "shortlisted":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
      case "audition":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
      case "selected":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold"
      case "rejected":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
      case "withdrawn":
        return "bg-muted text-muted-foreground border border-border"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-brand-500" /> My Applications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track the status of your submitted roles, schedule details, and review comments.
        </p>
      </div>

      {/* Realtime Notification Banner */}
      {notification && (
        <div className="flex items-center gap-3 border border-brand-500/20 bg-brand-500/5 text-brand-600 dark:text-brand-400 rounded-xl p-4 transition-all shadow-md animate-in slide-in-from-top-4 duration-300">
          <Bell className="h-5 w-5 shrink-0 animate-bounce" />
          <p className="text-xs font-semibold">{notification}</p>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Action Failed</p>
            <p className="text-xs mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Tab controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/40 pb-3">
        {(
          [
            { id: "all", label: "All" },
            { id: "applied", label: "Applied" },
            { id: "shortlisted", label: "Shortlisted" },
            { id: "audition", label: "Auditions" },
            { id: "selected", label: "Selected" },
            { id: "rejected_withdrawn", label: "Closed / Withdrawn" },
          ] as const
        ).map((tab) => {
          const count = applications.filter((app) => {
            if (tab.id === "all") return true
            if (tab.id === "rejected_withdrawn") return app.status === "rejected" || app.status === "withdrawn"
            return app.status === tab.id
          }).length

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id 
                  ? "bg-white/20 text-white" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Applications Cards Grid */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center bg-card/25 border border-border/40 rounded-2xl">
          <Briefcase className="h-12 w-12 text-muted-foreground/45 mb-3" />
          <p className="text-base font-bold text-foreground">No applications found</p>
          <p className="text-xs mt-1 text-muted-foreground/80">
            {activeTab === "all"
              ? "You haven't submitted any casting applications yet."
              : `No applications match the filter "${activeTab}".`}
          </p>
          {activeTab === "all" && (
            <Link href="/talent/casting" className="mt-4">
              <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer">
                Browse Casting Calls
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isExpanded = !!expandedAppIds[app.id]
            const call = app.casting_calls as any
            const company = call?.producer_profiles?.company_name || "XYZ Productions"
            const isVerified = call?.producer_profiles?.verified

            const deadlineDate = call?.application_deadline ? new Date(call.application_deadline) : null
            const hasPassed = deadlineDate ? deadlineDate.getTime() < Date.now() : false

            // Render mini status updates logic
            const getTimelineSteps = () => {
              const appliedDateStr = new Date(app.applied_at).toLocaleDateString()
              const updatedDateStr = new Date(app.updated_at).toLocaleDateString()

              const steps = [
                { key: "applied", label: "Applied", date: appliedDateStr, done: true },
                { key: "shortlisted", label: "Shortlisted", date: null, done: false },
                { key: "audition", label: "Audition Scheduled", date: null, done: false },
                { key: "selected_rejected", label: "Selected / Rejected", date: null, done: false }
              ]

              if (app.status === "shortlisted") {
                steps[1].done = true
                steps[1].date = updatedDateStr
              } else if (app.status === "audition") {
                steps[1].done = true
                steps[2].done = true
                steps[2].date = updatedDateStr
              } else if (app.status === "selected") {
                steps[1].done = true
                steps[2].done = true
                steps[3].done = true
                steps[3].label = "🎉 Selected!"
                steps[3].date = updatedDateStr
              } else if (app.status === "rejected") {
                steps[3].done = true
                steps[3].label = "Rejected"
                steps[3].date = updatedDateStr
              } else if (app.status === "withdrawn") {
                steps[1].done = true
                steps[1].label = "Withdrawn"
                steps[1].date = new Date(app.withdrawn_at || app.updated_at).toLocaleDateString()
              }

              return steps
            }

            const steps = getTimelineSteps()

            return (
              <div
                key={app.id}
                className="bg-card/25 border border-border/40 rounded-2xl hover:border-brand-500/30 transition-all shadow-sm flex flex-col overflow-hidden"
              >
                {/* Header Information row */}
                <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-foreground hover:text-brand-500 transition-colors">
                        {call?.title || "Role Title"}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getBadgeStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80 flex items-center gap-0.5">
                        {company}
                        {isVerified && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Verified Producer" />}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {call?.location || "Karachi"}
                      </span>
                      <span>•</span>
                      <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {deadlineDate ? (
                        hasPassed ? (
                          <span className="text-destructive font-semibold">
                            Deadline was: {deadlineDate.toLocaleDateString()}
                          </span>
                        ) : (
                          <span>
                            Deadline: {deadlineDate.toLocaleDateString()}
                          </span>
                        )
                      ) : (
                        <span>No deadline specified</span>
                      )}
                    </div>
                  </div>

                  {/* Buttons Action Group */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => toggleExpand(app.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-border/50 rounded-xl hover:bg-muted text-foreground transition-all cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          Hide Timeline <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Show Timeline <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>

                    <Link href={`/casting/${call?.id}`}>
                      <button className="inline-flex items-center gap-1.5 bg-brand-500/10 hover:bg-brand-500/25 text-brand-500 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                        View Call <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </Link>

                    {["applied", "shortlisted"].includes(app.status) && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" /> Withdraw
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cover Note snippet if exists */}
                {app.cover_note && (
                  <div className="px-5 pb-4 border-t border-border/10 pt-3 bg-background/10">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Your Cover Note
                    </p>
                    <p className="text-xs text-foreground/80 mt-1 italic leading-relaxed">
                      "{app.cover_note}"
                    </p>
                  </div>
                )}

                {/* Timeline Widget Section */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t border-border/30 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">
                      Application Timeline
                    </h4>
                    
                    <div className="relative pl-6 border-l border-border/60 ml-2.5 space-y-4 py-1.5">
                      {steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot marker */}
                          <div className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center ${
                            step.done 
                              ? "border-brand-500 text-brand-500" 
                              : "border-border text-muted-foreground"
                          }`}>
                            {step.done && <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                          </div>

                          {/* Detail text */}
                          <div>
                            <p className={`text-xs font-bold ${
                              step.done ? "text-foreground" : "text-muted-foreground/60"
                            }`}>
                              {step.label}
                            </p>
                            {step.date ? (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Completed: {step.date}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground/45 mt-0.5">
                                Pending
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
