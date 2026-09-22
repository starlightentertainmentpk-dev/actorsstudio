"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import {
  parseScreeningData,
  getEffectiveStage,
  ScreeningStage,
  STAGE_CONFIG,
} from "@/lib/screening"
import {
  updateCandidateStage,
  updateCandidateRating,
  updateCandidateNotes,
  scheduleCandidateInterview,
  bulkUpdateCandidateStages,
} from "./actions"
import { ScreeningKanbanBoard } from "@/components/features/screening/ScreeningKanbanBoard"
import { ScreeningTableView } from "@/components/features/screening/ScreeningTableView"
import {
  CandidateDossierDrawer,
  ApplicantDossierData,
} from "@/components/features/screening/CandidateDossierDrawer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  Columns3,
  List,
  Calendar,
  Briefcase,
  ChevronRight,
  Loader2,
  CheckCircle,
  Plus,
  RefreshCw,
} from "lucide-react"

export default function ProducerCandidateScreeningPage() {
  const searchParams = useSearchParams()
  const initialCallId = searchParams.get("callId") || "all"
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // View state
  const [selectedCallId, setSelectedCallId] = useState<string>(initialCallId)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all")
  const [activeDrawerApplicant, setActiveDrawerApplicant] = useState<ApplicantDossierData | null>(null)

  // 1. Fetch producer profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["producer-profile-screening", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("id, company_name")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // 2. Fetch all casting calls for dropdown filter
  const { data: castingCalls = [] } = useQuery({
    queryKey: ["producer-all-calls-screening", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from("casting_calls")
        .select("id, title, status, location")
        .eq("producer_id", profile.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  // 3. Fetch applications for the producer's casting calls
  const {
    data: rawApplications = [],
    isLoading: appsLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["producer-ats-applications", profile?.id, selectedCallId],
    queryFn: async () => {
      if (!profile?.id) return []

      let callsQuery = supabase
        .from("casting_calls")
        .select("id, title, location, requirements_json")
        .eq("producer_id", profile.id)

      if (selectedCallId && selectedCallId !== "all") {
        callsQuery = callsQuery.eq("id", selectedCallId)
      }

      const { data: calls, error: callsErr } = await callsQuery
      if (callsErr) throw callsErr
      if (!calls || calls.length === 0) return []

      const callIds = calls.map((c) => c.id)

      // Fetch applications for these casting calls
      const { data: apps, error: appsErr } = await supabase
        .from("applications")
        .select(`
          id,
          casting_call_id,
          talent_id,
          status,
          cover_note,
          applied_at,
          withdrawn_at,
          talent_profiles (
            id,
            user_id,
            slug,
            full_name,
            stage_name,
            category_id,
            sub_category_id,
            city,
            experience_years,
            dob,
            height_cm,
            weight_kg,
            skills,
            languages,
            users (
              email,
              phone
            )
          )
        `)
        .in("casting_call_id", callIds)
        .neq("status", "withdrawn")
        .order("applied_at", { ascending: false })

      if (appsErr) throw appsErr
      if (!apps || apps.length === 0) return []

      // Fetch media assets for all candidates
      const userIds = apps
        .map((a: any) => a.talent_profiles?.user_id)
        .filter(Boolean) as string[]

      const { data: media = [] } = await supabase
        .from("media_assets")
        .select("id, owner_id, type, url, thumbnail_url, is_primary, duration_sec")
        .in("owner_id", userIds)

      // Fetch category names
      const categoryIds = apps
        .map((a: any) => a.talent_profiles?.category_id)
        .filter(Boolean) as string[]

      const { data: categories = [] } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", categoryIds)

      // Consolidate into ApplicantDossierData
      return apps.map((app: any): ApplicantDossierData => {
        const matchingCall = calls.find((c) => c.id === app.casting_call_id)
        const talent = app.talent_profiles || {}
        const categoryName = (categories || []).find((c) => c.id === talent.category_id)?.name
        const talentMedia = (media || []).filter((m) => m.owner_id === talent.user_id)

        const { cleanCoverNote, screening } = parseScreeningData(app.cover_note)
        const effectiveStage = getEffectiveStage(app.status, screening)

        return {
          id: app.id,
          casting_call_id: app.casting_call_id,
          talent_id: app.talent_id,
          applied_at: app.applied_at,
          cleanCoverNote,
          effectiveStage,
          screening,
          casting_call: {
            id: matchingCall?.id || app.casting_call_id,
            title: matchingCall?.title || "Casting Call",
            location: matchingCall?.location,
            requirements_json: matchingCall?.requirements_json,
          },
          talent_profile: {
            ...talent,
            category_name: categoryName,
          },
          media_assets: talentMedia,
        }
      })
    },
    enabled: !!profile?.id,
  })

  // 4. Client-side Search & Discipline Filtering
  const filteredApplicants = useMemo(() => {
    return rawApplications.filter((app) => {
      // Search filter (name, city, skill)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (app.talent_profile.stage_name || app.talent_profile.full_name || "").toLowerCase()
        const city = (app.talent_profile.city || "").toLowerCase()
        const skills = (app.talent_profile.skills || []).join(" ").toLowerCase()
        const job = (app.casting_call.title || "").toLowerCase()

        if (!name.includes(q) && !city.includes(q) && !skills.includes(q) && !job.includes(q)) {
          return false
        }
      }

      // Discipline filter
      if (selectedDiscipline !== "all") {
        const cat = (app.talent_profile.category_name || "").toLowerCase()
        if (!cat.includes(selectedDiscipline.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [rawApplications, searchQuery, selectedDiscipline])

  // Count summaries
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: filteredApplicants.length,
      applied: 0,
      shortlisted: 0,
      deferred: 0,
      audition: 0,
      selected: 0,
      rejected: 0,
    }
    filteredApplicants.forEach((a) => {
      if (counts[a.effectiveStage] !== undefined) {
        counts[a.effectiveStage]++
      }
    })
    return counts
  }, [filteredApplicants])

  // Handlers for Stage changes
  const handleStageChange = async (applicationId: string, stage: ScreeningStage) => {
    await updateCandidateStage(applicationId, stage)
    queryClient.invalidateQueries({ queryKey: ["producer-ats-applications"] })

    // If active drawer is open, update its state
    if (activeDrawerApplicant && activeDrawerApplicant.id === applicationId) {
      setActiveDrawerApplicant((prev) =>
        prev
          ? {
              ...prev,
              effectiveStage: stage,
              screening: {
                ...prev.screening,
                isDeferred: stage === "deferred",
              },
            }
          : null
      )
    }
  }

  const handleRatingChange = async (applicationId: string, rating: number) => {
    await updateCandidateRating(applicationId, rating)
    queryClient.invalidateQueries({ queryKey: ["producer-ats-applications"] })

    if (activeDrawerApplicant && activeDrawerApplicant.id === applicationId) {
      setActiveDrawerApplicant((prev) =>
        prev ? { ...prev, screening: { ...prev.screening, rating } } : null
      )
    }
  }

  const handleNotesChange = async (applicationId: string, notes: string) => {
    await updateCandidateNotes(applicationId, notes)
    queryClient.invalidateQueries({ queryKey: ["producer-ats-applications"] })

    if (activeDrawerApplicant && activeDrawerApplicant.id === applicationId) {
      setActiveDrawerApplicant((prev) =>
        prev ? { ...prev, screening: { ...prev.screening, notes } } : null
      )
    }
  }

  const handleScheduleInterview = async (applicationId: string, details: any) => {
    await scheduleCandidateInterview(applicationId, details)
    queryClient.invalidateQueries({ queryKey: ["producer-ats-applications"] })

    if (activeDrawerApplicant && activeDrawerApplicant.id === applicationId) {
      setActiveDrawerApplicant((prev) =>
        prev
          ? {
              ...prev,
              effectiveStage: "audition",
              screening: {
                ...prev.screening,
                isDeferred: false,
                interview: details,
              },
            }
          : null
      )
    }
  }

  const handleBulkStageChange = async (applicationIds: string[], stage: ScreeningStage) => {
    await bulkUpdateCandidateStages(applicationIds, stage)
    queryClient.invalidateQueries({ queryKey: ["producer-ats-applications"] })
  }

  const loading = authLoading || profileLoading || appsLoading

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Candidate Screening & Hiring
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
              ATS Pipeline
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Indeed-style candidate screening workflow to review, shortlist, defer, interview, and hire talent.
          </p>
        </div>

        {/* Top Actions: Switch view & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl border border-border/60 bg-muted/40 shadow-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 w-9 rounded-xl border-border/60"
            title="Refresh candidates"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>

          <Link href="/producer/casting/create">
            <Button className="h-9 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" /> Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Context Control Bar: Job Selector, Discipline Filter, Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/50 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          {/* Job Selector */}
          <div className="sm:w-72 shrink-0">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Select Casting Call:
            </label>
            <select
              value={selectedCallId}
              onChange={(e) => setSelectedCallId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Active Casting Calls ({castingCalls.length})</option>
              {castingCalls.map((call) => (
                <option key={call.id} value={call.id}>
                  {call.title}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline Filter */}
          <div className="sm:w-48 shrink-0">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Discipline:
            </label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Creative Talents</option>
              <option value="actor">Actors</option>
              <option value="model">Models</option>
              <option value="singer">Singers / Vocalists</option>
              <option value="musician">Musicians</option>
              <option value="voice">Voice Artists</option>
              <option value="dancer">Dancers</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Search Applicants:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by candidate name, city, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Metric Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-xl bg-card border border-border/50 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Applicants
          </span>
          <span className="text-xl font-bold text-foreground mt-1">
            {stageCounts.all}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            1. New / Applied
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stageCounts.applied}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            2. Shortlisted
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stageCounts.shortlisted}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            3. Deferred (Maybe)
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stageCounts.deferred}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            4. Interviewing
          </span>
          <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stageCounts.audition}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            5. Hired / Booked
          </span>
          <span className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {stageCounts.selected}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            6. Rejected
          </span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stageCounts.rejected}
          </span>
        </div>
      </div>

      {/* Main Workspace Content */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3 bg-card border border-border/50 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground font-medium">
            Loading candidate pipeline...
          </p>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center p-6 text-center bg-card border border-border/50 rounded-2xl space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              No Candidates to Screen Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {castingCalls.length === 0
                ? "You haven't posted any casting calls yet. Create your first listing to start receiving applications."
                : "No talent has applied to this casting call yet, or no candidates match your active filters."}
            </p>
          </div>
          {castingCalls.length === 0 && (
            <Link href="/producer/casting/create">
              <Button className="h-10 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white">
                <Plus className="h-4 w-4 mr-1.5" /> Post First Casting Call
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        <ScreeningKanbanBoard
          applicants={filteredApplicants}
          onSelectApplicant={(app) => setActiveDrawerApplicant(app)}
          onQuickMove={(appId, stage) => handleStageChange(appId, stage)}
        />
      ) : (
        <ScreeningTableView
          applicants={filteredApplicants}
          onSelectApplicant={(app) => setActiveDrawerApplicant(app)}
          onStageChange={(appId, stage) => handleStageChange(appId, stage)}
          onBulkStageChange={(appIds, stage) => handleBulkStageChange(appIds, stage)}
        />
      )}

      {/* Slide-over Candidate Dossier Drawer */}
      <CandidateDossierDrawer
        isOpen={!!activeDrawerApplicant}
        onClose={() => setActiveDrawerApplicant(null)}
        applicant={activeDrawerApplicant}
        onStageChange={async (newStage) => {
          if (activeDrawerApplicant) {
            await handleStageChange(activeDrawerApplicant.id, newStage)
          }
        }}
        onRatingChange={async (newRating) => {
          if (activeDrawerApplicant) {
            await handleRatingChange(activeDrawerApplicant.id, newRating)
          }
        }}
        onNotesChange={async (newNotes) => {
          if (activeDrawerApplicant) {
            await handleNotesChange(activeDrawerApplicant.id, newNotes)
          }
        }}
        onScheduleInterview={async (details) => {
          if (activeDrawerApplicant) {
            await handleScheduleInterview(activeDrawerApplicant.id, details)
          }
        }}
      />
    </div>
  )
}
