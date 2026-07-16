"use client"

import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { updateApplicationStatus, bulkUpdateApplicationStatus } from "@/app/(dashboard)/producer/applications/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronLeft,
  CalendarDays,
  FileText
} from "lucide-react"

type ApplicationWithTalent = {
  id: string
  status: "applied" | "shortlisted" | "audition" | "selected" | "rejected" | "withdrawn"
  cover_note: string | null
  applied_at: string
  talent_id: string
  talent_profiles: {
    id: string
    full_name: string
    stage_name: string | null
    city: string | null
    experience_years: number
    skills: string[]
    languages: string[]
    user_id: string
    slug: string | null
  } | null
  photo_url?: string
}

export default function CastingCallApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const castingCallId = params.id as string
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Local state
  const [activeTab, setActiveTab] = useState<"all" | "applied" | "shortlisted" | "audition" | "selected" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "experience">("newest")
  const [selectedAppIds, setSelectedAppIds] = useState<Record<string, boolean>>({})
  const [schedulerModalOpen, setSchedulerModalOpen] = useState(false)
  const [selectedApplicantName, setSelectedApplicantName] = useState("")

  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState("")

  // 1. Fetch casting call details
  const { data: castingCall, isLoading: callLoading } = useQuery({
    queryKey: ["producer-casting-call-details", castingCallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casting_calls")
        .select("id, title, status, location")
        .eq("id", castingCallId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!castingCallId,
  })

  // 2. Fetch applications with talent details
  const { data: applications = [], isLoading: appsLoading } = useQuery<ApplicationWithTalent[]>({
    queryKey: ["producer-applications-list", castingCallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          cover_note,
          applied_at,
          talent_id,
          talent_profiles (
            id,
            full_name,
            stage_name,
            city,
            experience_years,
            skills,
            languages,
            user_id,
            slug
          )
        `)
        .eq("casting_call_id", castingCallId)
        .neq("status", "withdrawn") // Hide withdrawn applications
        .order("applied_at", { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) return []

      // Fetch primary photos for all talents in bulk
      const userIds = data.map((app: any) => app.talent_profiles?.user_id).filter(Boolean)
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

      return data.map((app: any) => ({
        ...app,
        photo_url: app.talent_profiles ? photoMap.get(app.talent_profiles.user_id) : undefined,
      })) as ApplicationWithTalent[]
    },
    enabled: !!castingCallId,
  })

  const isLoading = callLoading || appsLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading applicants...</p>
        </div>
      </div>
    )
  }

  if (!castingCall) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Casting Call not found</h2>
          <p className="text-sm text-muted-foreground">The specified casting call details could not be retrieved.</p>
        </div>
        <Link href="/producer/casting">
          <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer">
            Back to Casting Calls
          </button>
        </Link>
      </div>
    )
  }

  // Derived Summary Counts
  const totalCount = applications.length
  const appliedCount = applications.filter((a) => a.status === "applied").length
  const shortlistedCount = applications.filter((a) => a.status === "shortlisted").length
  const auditionCount = applications.filter((a) => a.status === "audition").length
  const selectedCount = applications.filter((a) => a.status === "selected").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  // Filter application list based on controls
  let filteredApps = applications.filter((app) => {
    // Tab Filter
    const matchesTab = activeTab === "all" || app.status === activeTab

    // Search Name Filter
    const displayName = app.talent_profiles?.stage_name || app.talent_profiles?.full_name || ""
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  // Sort application list
  filteredApps.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
    }
    if (sortBy === "oldest") {
      return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
    }
    if (sortBy === "experience") {
      const expA = a.talent_profiles?.experience_years || 0
      const expB = b.talent_profiles?.experience_years || 0
      return expB - expA
    }
    return 0
  })

  // Checkbox interactions
  const handleToggleSelectAll = () => {
    const allSelected = filteredApps.every((app) => !!selectedAppIds[app.id])
    const newSelection: Record<string, boolean> = {}

    if (!allSelected) {
      filteredApps.forEach((app) => {
        newSelection[app.id] = true
      })
    }
    setSelectedAppIds(newSelection)
  }

  const handleToggleSelectCard = (id: string) => {
    setSelectedAppIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getSelectedIds = () => {
    return Object.keys(selectedAppIds).filter((id) => !!selectedAppIds[id])
  }

  const selectedCountNum = getSelectedIds().length

  // Status handlers
  const handleUpdateStatus = (appId: string, status: "shortlisted" | "audition" | "selected" | "rejected") => {
    setActionError("")
    startTransition(async () => {
      try {
        await updateApplicationStatus(appId, status)
        queryClient.invalidateQueries({ queryKey: ["producer-applications-list"] })
      } catch (err: any) {
        setActionError(err.message || "Failed to update application status.")
      }
    })
  }

  const handleBulkUpdateStatus = (status: "shortlisted" | "rejected") => {
    const ids = getSelectedIds()
    if (ids.length === 0) return
    if (!confirm(`Are you sure you want to bulk update ${ids.length} applications to "${status}"?`)) return

    setActionError("")
    startTransition(async () => {
      try {
        await bulkUpdateApplicationStatus(ids, status)
        setSelectedAppIds({})
        queryClient.invalidateQueries({ queryKey: ["producer-applications-list"] })
      } catch (err: any) {
        setActionError(err.message || "Failed to bulk update status.")
      }
    })
  }

  const triggerSchedulerStub = (name: string) => {
    setSelectedApplicantName(name)
    setSchedulerModalOpen(true)
  }

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
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/producer/casting"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Casting Calls
        </Link>
      </div>

      {/* Title Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-brand-500" /> Applicants Directory
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review talent cards and cover notes for: <strong className="text-foreground">{castingCall.title}</strong>
        </p>
      </div>

      {actionError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Action Blocked</p>
            <p className="text-xs mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Summary Counter Bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: totalCount, bg: "bg-muted/40 text-foreground" },
          { label: "Applied", value: appliedCount, bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "Shortlisted", value: shortlistedCount, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
          { label: "Auditions", value: auditionCount, bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
          { label: "Selected", value: selectedCount, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "Rejected", value: rejectedCount, bg: "bg-red-500/10 text-red-600 dark:text-red-400" },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border border-border/40 backdrop-blur-sm ${item.bg} flex flex-col justify-center text-center`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
              {item.label}
            </span>
            <span className="text-xl font-bold mt-0.5">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["all", "applied", "shortlisted", "audition", "selected", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setSelectedAppIds({})
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                activeTab === tab
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab === "audition" ? "Auditions" : tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="h-10 px-2 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="experience">Experience (High-Low)</option>
          </select>

          {/* Search bar */}
          <div className="relative flex items-center w-full md:max-w-xs">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Bulk actions bar if items are selected */}
      {selectedCountNum > 0 && (
        <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl flex items-center justify-between animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {selectedCountNum} applicant{selectedCountNum > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkUpdateStatus("shortlisted")}
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              Bulk Shortlist
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkUpdateStatus("rejected")}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              Bulk Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedAppIds({})}
              className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Application Cards List */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center bg-card/25 border border-border/40 rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground/45 mb-3" />
          <p className="text-base font-bold text-foreground">No applicants found</p>
          <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">
            {searchQuery
              ? "Try adjusting your search criteria or tabs."
              : "No active submissions found for this list filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select all checkbox block */}
          <div className="flex items-center gap-2 pl-4">
            <input
              type="checkbox"
              id="select-all"
              checked={filteredApps.length > 0 && filteredApps.every((app) => !!selectedAppIds[app.id])}
              onChange={handleToggleSelectAll}
              className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 bg-background cursor-pointer"
            />
            <label htmlFor="select-all" className="text-xs text-muted-foreground font-semibold cursor-pointer">
              Select All Current Results ({filteredApps.length})
            </label>
          </div>

          <div className="grid gap-4">
            {filteredApps.map((app) => {
              const talent = app.talent_profiles
              if (!talent) return null

              const displayName = talent.stage_name || talent.full_name
              const isSelected = !!selectedAppIds[app.id]

              return (
                <div
                  key={app.id}
                  className={`bg-card/25 border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-5 relative group ${
                    isSelected ? "border-brand-500/50 bg-brand-500/[0.01]" : "border-border/40 hover:border-brand-500/30"
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="absolute top-5 left-5 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectCard(app.id)}
                      className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 bg-background cursor-pointer"
                    />
                  </div>

                  {/* Left Side: Avatar / Basic details */}
                  <div className="flex items-start pl-6 md:pl-0 gap-4 shrink-0">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-border bg-background">
                      {app.photo_url ? (
                        <img
                          src={app.photo_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-lg uppercase">
                          {displayName[0]}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-base group-hover:text-brand-500 transition-colors">
                          {displayName}
                        </h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${getBadgeStyle(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" /> {talent.city || "Pakistan"}
                        </span>
                        <span>•</span>
                        <span>{talent.experience_years} yrs exp</span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Mid Section: Cover note & skills tags */}
                  <div className="flex-1 space-y-3.5 pl-6 md:pl-0 border-t border-border/10 md:border-t-0 pt-3 md:pt-0">
                    {/* Cover Note */}
                    {app.cover_note ? (
                      <div className="bg-background/20 p-3 rounded-xl border border-border/30 text-xs">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          <FileText className="h-3.5 w-3.5 text-brand-500" /> Cover Note
                        </span>
                        <p className="text-foreground/90 italic leading-relaxed">
                          "{app.cover_note}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic">
                        No cover note attached.
                      </p>
                    )}

                    {/* Skills & languages */}
                    <div className="space-y-1.5 text-xs">
                      {talent.skills && talent.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                            Skills:
                          </span>
                          {talent.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-muted border border-border text-foreground font-semibold text-[10px] capitalize"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {talent.languages && talent.languages.length > 0 && (
                        <p className="text-[11px] font-semibold text-foreground/80">
                          Languages: <span className="font-medium text-muted-foreground capitalize">{talent.languages.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Action Buttons */}
                  <div className="flex flex-row md:flex-col items-center justify-end gap-2 pl-6 md:pl-0 shrink-0 self-end md:self-center border-t border-border/10 md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                    {/* View Profile */}
                    <Link
                      href={talent.slug ? `/talent/${talent.slug}` : "#"}
                      target="_blank"
                      className="w-full md:w-auto"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center h-8 rounded-lg text-xs font-semibold border border-border/50 text-foreground cursor-pointer flex items-center gap-1"
                      >
                        View Profile <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>

                    {/* Shortlist Action */}
                    {app.status === "applied" && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                        className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs h-8 px-4 rounded-lg cursor-pointer"
                      >
                        Shortlist
                      </Button>
                    )}

                    {/* Audition Scheduler action */}
                    {app.status === "shortlisted" && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => triggerSchedulerStub(displayName)}
                        className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs h-8 px-4 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <CalendarDays className="h-3.5 w-3.5" /> Schedule Audition
                      </Button>
                    )}

                    {/* Selection Action */}
                    {app.status === "audition" && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(app.id, "selected")}
                        className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-8 px-4 rounded-lg cursor-pointer"
                      >
                        Select Talent
                      </Button>
                    )}

                    {/* Re-consider shortlisted (from rejected) */}
                    {app.status === "rejected" && (
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                        className="w-full md:w-auto bg-amber-500/10 hover:bg-amber-500/25 text-amber-500 font-semibold text-xs h-8 px-4 rounded-lg border border-amber-500/20 cursor-pointer"
                      >
                        Shortlist again
                      </Button>
                    )}

                    {/* Reject Button (Only visible if not already rejected, selected, or withdrawn) */}
                    {app.status !== "rejected" && app.status !== "selected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                        className="w-full md:w-auto text-destructive hover:bg-destructive/10 text-xs font-semibold h-8 px-4 rounded-lg border border-destructive/20 cursor-pointer"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scheduler Modal Placeholder for Prompt 13 */}
      {schedulerModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Schedule Audition</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pre-filled for {selectedApplicantName}</p>
              </div>
              <button
                onClick={() => setSchedulerModalOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-3 text-xs text-foreground/80">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400 font-semibold">
                This is a placeholder interface for Prompt 13: Auditions Booking & Scheduling.
              </div>
              <p className="leading-relaxed">
                In Tier 1 - Step 13, you will be able to schedule in-person, video call, or self-tape auditions with specific slots directly linked to {selectedApplicantName}'s schedule.
              </p>
              <p className="leading-relaxed">
                To continue testing the application flow, click "Simulate Scheduling" to transition this applicant to the Audition status.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <Button
                variant="ghost"
                onClick={() => setSchedulerModalOpen(false)}
                className="h-9 rounded-lg font-semibold cursor-pointer border border-border/50 text-foreground"
              >
                Close
              </Button>
              <Button
                onClick={async () => {
                  const targetApp = filteredApps.find((a) => (a.talent_profiles?.stage_name || a.talent_profiles?.full_name) === selectedApplicantName)
                  if (targetApp) {
                    await handleUpdateStatus(targetApp.id, "audition")
                  }
                  setSchedulerModalOpen(false)
                }}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/10 h-9 rounded-lg cursor-pointer"
              >
                Simulate Scheduling
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
