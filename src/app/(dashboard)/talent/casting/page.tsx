"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { ApplyModal } from "@/components/features/applications/ApplyModal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Tv,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Users,
  Check
} from "lucide-react"

type Category = {
  id: string
  name: string
  slug: string
}

export default function TalentCastingPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()

  // ApplyModal states
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCallId, setSelectedCallId] = useState("")
  const [selectedCallTitle, setSelectedCallTitle] = useState("")

  // Filter states
  const [activeTab, setActiveTab] = useState<"all" | "applied">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterGender, setFilterGender] = useState("")
  const [filterCompensation, setFilterCompensation] = useState("")

  // 1. Fetch talent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // 2. Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return data || []
    }
  })

  // 3. Fetch open casting calls
  const { data: castingCalls = [], isLoading: callsLoading } = useQuery({
    queryKey: ["talent-open-casting-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casting_calls")
        .select(`
          *,
          categories:category_id (
            name,
            slug
          ),
          producer_profiles (
            company_name,
            verified
          )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // 4. Fetch user applications
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ["talent-applications-status", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from("applications")
        .select("id, casting_call_id, status, applied_at, updated_at")
        .eq("talent_id", profile.id)
      
      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  const isLoading = authLoading || profileLoading || callsLoading || appsLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading casting calls...</p>
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
          <p className="text-sm text-muted-foreground">Please complete onboarding to browse casting calls.</p>
        </div>
      </div>
    )
  }

  // Pre-process application maps for super fast lookups
  const appMap = new Map<string, typeof applications[number]>()
  applications.forEach((app) => {
    if (app.status !== "withdrawn") {
      appMap.set(app.casting_call_id, app)
    }
  })

  // Filter logic in JS
  const filteredCalls = castingCalls.filter((call) => {
    const app = appMap.get(call.id)
    const matchesTab = activeTab === "all" || !!app

    // Search query matches title or producer name
    const matchesSearch =
      call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.producer_profiles?.company_name &&
        call.producer_profiles.company_name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Location matches
    const matchesLocation =
      !filterLocation || (call.location && call.location.toLowerCase().includes(filterLocation.toLowerCase()))

    // Category matches
    const matchesCategory = !filterCategory || call.categories?.slug === filterCategory

    // Gender matches
    const reqJson = (call.requirements_json as any) || {}
    const genderReq = reqJson.gender || "any"
    const matchesGender =
      !filterGender || filterGender === "any" || genderReq === "any" || genderReq === filterGender

    // Compensation matches
    const comp = call.compensation?.toLowerCase() || ""
    const isContra = comp.includes("contra") || comp.includes("volunteer") || comp.includes("free")
    let matchesComp = true
    if (filterCompensation === "paid") {
      matchesComp = !isContra
    } else if (filterCompensation === "contra") {
      matchesComp = isContra
    }

    return matchesTab && matchesSearch && matchesLocation && matchesCategory && matchesGender && matchesComp
  })

  const handleOpenApplyModal = (id: string, title: string) => {
    setSelectedCallId(id)
    setSelectedCallTitle(title)
    setModalOpen(true)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setFilterLocation("")
    setFilterCategory("")
    setFilterGender("")
    setFilterCompensation("")
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Tv className="h-8 w-8 text-brand-500" /> Browse Casting Calls
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Apply to verified, active productions in Pakistan. Use filters to find roles that match your digital comp card.
        </p>
      </div>

      {/* Tab Controls: All Calls vs My Applications */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-card text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Casting Calls
        </button>
        <button
          onClick={() => setActiveTab("applied")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "applied"
              ? "bg-card text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>My Submissions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">
            {appMap.size}
          </span>
        </button>
      </div>

      {/* Main Grid: Filters & Grid Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border/50 p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-brand-500" /> Filters
              </h3>
              {(searchQuery || filterLocation || filterCategory || filterGender || filterCompensation) && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {/* Search Title */}
              <div>
                <label className="block font-semibold text-foreground uppercase tracking-wider mb-1">
                  Search
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roles or producers..."
                    className="w-full h-9 pl-8 pr-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-semibold text-foreground uppercase tracking-wider mb-1">
                  Location
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    placeholder="Karachi, Lahore..."
                    className="w-full h-9 pl-8 pr-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-foreground uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold text-foreground uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="transgender">Transgender</option>
                  <option value="any">Unspecified/Any</option>
                </select>
              </div>

              {/* Compensation */}
              <div>
                <label className="block font-semibold text-foreground uppercase tracking-wider mb-1">
                  Compensation
                </label>
                <select
                  value={filterCompensation}
                  onChange={(e) => setFilterCompensation(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
                >
                  <option value="">All</option>
                  <option value="paid">Paid Roles</option>
                  <option value="contra">Contra / Volunteer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Grid */}
        <div className="lg:col-span-3 space-y-4">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-border/50 bg-card/40 backdrop-blur-xs">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 ring-4 ring-brand-500/5">
                <Tv className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-foreground font-heading">No casting calls found</p>
              <p className="text-xs mt-1 text-muted-foreground max-w-xs leading-relaxed">
                We couldn&apos;t find any casting calls matching your active filters or tab selection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCalls.map((call) => {
                const app = appMap.get(call.id)
                const reqJson = (call.requirements_json as any) || {}
                const genderPref = reqJson.gender || "any"
                const ageMinVal = reqJson.age_min || 18
                const ageMaxVal = reqJson.age_max || 60
                const languages = reqJson.languages || []

                const deadlineDate = call.application_deadline ? new Date(call.application_deadline) : null
                const daysLeft = deadlineDate
                  ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 3600 * 24)))
                  : null

                // Small inline timeline state
                const getInlineTimeline = (status: string) => {
                  switch (status) {
                    case "applied":
                      return "Applied • Shortlist Pending"
                    case "shortlisted":
                      return "Shortlisted • Audition Pending"
                    case "audition":
                      return "Audition Scheduled"
                    case "selected":
                      return "Selected for Role"
                    case "rejected":
                      return "Application Closed"
                    default:
                      return ""
                  }
                }

                return (
                  <div
                    key={call.id}
                    className="bg-card border border-border/50 hover:border-border hover:shadow-md p-5 rounded-xl transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      {/* Header badges */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">
                          {call.categories?.name || "Talent"}
                        </span>

                        {app ? (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                            app.status === "selected"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : app.status === "shortlisted"
                              ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
                              : "bg-blue-500/15 text-blue-600 border-blue-500/20"
                          }`}>
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          daysLeft !== null && daysLeft <= 3 && daysLeft > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                              Urgent
                            </span>
                          )
                        )}
                      </div>

                      <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-brand-500 transition-colors leading-snug line-clamp-1">
                        {call.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="font-semibold text-foreground/80">
                          {call.producer_profiles?.company_name || "Paramount"}
                        </span>
                        {call.producer_profiles?.verified && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Verified Producer" />
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0" /> {call.location || "On-location"}
                        </span>
                      </div>

                      <hr className="border-border/30 my-3.5" />

                      {/* Requirements Brief */}
                      <div className="space-y-1 text-xs text-foreground/85">
                        <p className="font-semibold capitalize">
                          Gender: <span className="font-medium text-muted-foreground">{genderPref}</span>
                        </p>
                        <p className="font-semibold">
                          Age: <span className="font-medium text-muted-foreground">{ageMinVal}–{ageMaxVal} years</span>
                        </p>
                        {languages.length > 0 && (
                          <p className="font-semibold">
                            Languages: <span className="font-medium text-muted-foreground">{languages.join(", ")}</span>
                          </p>
                        )}
                        <p className="font-semibold mt-1">
                          Compensation:{" "}
                          <span className="font-medium text-brand-600 dark:text-brand-400">
                            {call.compensation || "To be discussed"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Inline application status timeline */}
                    {app && (
                      <div className="mt-3.5 p-2 bg-brand-500/5 rounded-xl border border-brand-500/10 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                        {getInlineTimeline(app.status)}
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="flex items-center justify-between border-t border-border/30 pt-3.5 mt-5">
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        {daysLeft !== null ? (
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="h-3 w-3" />
                            {daysLeft === 0 ? "Expires today" : `${daysLeft} days remaining`}
                          </span>
                        ) : (
                          <span>No deadline</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/casting/${call.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/50 hover:bg-muted text-foreground cursor-pointer"
                          >
                            Details
                          </Button>
                        </Link>

                        {app ? (
                          <Button
                            disabled
                            size="sm"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-xs px-3.5 py-1.5 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Applied</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenApplyModal(call.id, call.title)}
                            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-brand-500/10 cursor-pointer"
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal component wiring */}
      <ApplyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        castingCallId={selectedCallId}
        castingCallTitle={selectedCallTitle}
        onSuccess={() => {
          refetchApps()
        }}
      />
    </div>
  )
}
