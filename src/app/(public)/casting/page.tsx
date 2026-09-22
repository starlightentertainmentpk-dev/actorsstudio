import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import { CastingFilterSidebar } from "./_components/CastingFilterSidebar"
import Link from "next/link"
import {
  Tv,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

// ISR configuration
export const revalidate = 300 // 5 minutes

type SearchParams = Promise<{
  location?: string
  category?: string
  gender?: string
  compensation?: string
  deadline?: string
  page?: string
}>

type PageProps = {
  searchParams: SearchParams
}

export const metadata = {
  title: "Casting Calls Directory | Actor's Studio Pakistan",
  description: "Browse audition lists, TV commercials, dramas, films, and theatre casting calls across Pakistan.",
}

export default async function PublicCastingCallsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const currentPage = parseInt(resolvedSearchParams.page || "1", 10)
  const limit = 12
  const fromIndex = (currentPage - 1) * limit
  const toIndex = fromIndex + limit - 1

  const supabase = await createClient()

  // 1. Fetch root categories for filtering
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .is("parent_id", null)
    .order("sort_order", { ascending: true })

  // 2. Fetch all open casting calls (we will filter & paginate in JS/query)
  // To allow search param filtering, we fetch open calls.
  // Note: For typical production volumes, memory filtering is extremely fast, 
  // but let's build a query builder for scalability.
  let query = supabase
    .from("casting_calls")
    .select(`
      *,
      producer_profiles (
        company_name,
        verified
      ),
      categories (
        name,
        slug
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  const { data: rawCalls, error } = await query

  if (error) {
    console.error("Error fetching casting calls:", error)
  }

  // 3. Filter calls in JS (handles complex requirements_json logic & admin_flagged)
  let filteredCalls = (rawCalls || []).filter((call) => {
    // Exclude flagged calls
    const reqJson = call.requirements_json as any
    if (reqJson?.admin_flagged === true) return false

    // Location filter
    if (resolvedSearchParams.location) {
      const locQuery = resolvedSearchParams.location.toLowerCase()
      if (!call.location || !call.location.toLowerCase().includes(locQuery)) {
        return false
      }
    }

    // Category / Discipline filter
    if (resolvedSearchParams.category) {
      const catQuery = resolvedSearchParams.category.toLowerCase()
      const callSlug = (call.categories?.slug || "").toLowerCase()
      const callName = (call.categories?.name || "").toLowerCase()
      const callTitle = (call.title || "").toLowerCase()

      const matchesActor = (catQuery === "actor" || catQuery === "actors") &&
        (callSlug.includes("actor") || callName.includes("actor") || callTitle.includes("actor") || callTitle.includes("actress") || callTitle.includes("acting"))

      const matchesModel = (catQuery === "model" || catQuery === "models") &&
        (callSlug.includes("model") || callName.includes("model") || callTitle.includes("model") || callTitle.includes("modeling"))

      const matchesSinger = (catQuery === "singer" || catQuery === "singers" || catQuery === "musician") &&
        (callSlug.includes("music") || callSlug.includes("sing") || callName.includes("music") || callName.includes("sing") || callTitle.includes("sing") || callTitle.includes("vocal") || callTitle.includes("music"))

      const matchesVoice = (catQuery === "voice" || catQuery === "voice-artist" || catQuery === "voice-artists") &&
        (callSlug.includes("voice") || callName.includes("voice") || callSlug.includes("dubbing") || callTitle.includes("voice") || callTitle.includes("dubbing"))

      const matchesDancer = (catQuery === "dancer" || catQuery === "dancers") &&
        (callSlug.includes("danc") || callName.includes("danc") || callTitle.includes("danc"))

      const isDisciplineMatch = matchesActor || matchesModel || matchesSinger || matchesVoice || matchesDancer
      const isExactSlugMatch = callSlug === catQuery || callSlug.startsWith(catQuery)

      if (!isDisciplineMatch && !isExactSlugMatch) {
        return false
      }
    }

    // Gender filter
    if (resolvedSearchParams.gender) {
      const genderReq = reqJson?.gender || "any"
      if (resolvedSearchParams.gender !== "any" && genderReq !== "any" && genderReq !== resolvedSearchParams.gender) {
        return false
      }
    }

    // Compensation filter
    if (resolvedSearchParams.compensation) {
      const comp = call.compensation?.toLowerCase() || ""
      const isContra = comp.includes("contra") || comp.includes("volunteer") || comp.includes("free")
      if (resolvedSearchParams.compensation === "paid" && isContra) {
        return false
      }
      if (resolvedSearchParams.compensation === "contra" && !isContra) {
        return false
      }
    }

    // Deadline filter
    if (resolvedSearchParams.deadline && call.application_deadline) {
      const deadlineDate = new Date(call.application_deadline)
      const now = new Date()
      const diffMs = deadlineDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24))

      if (diffDays < 0) return false // Already expired

      if (resolvedSearchParams.deadline === "today" && diffDays > 1) {
        return false
      }
      if (resolvedSearchParams.deadline === "week" && diffDays > 7) {
        return false
      }
      if (resolvedSearchParams.deadline === "month" && diffDays > 30) {
        return false
      }
    }

    return true
  })

  // 4. Fetch application counts for the filtered calls
  const callIds = filteredCalls.map((c) => c.id)
  let appCounts: Record<string, number> = {}

  if (callIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("casting_call_id")
      .in("casting_call_id", callIds)
      .neq("status", "withdrawn")

    apps?.forEach((app) => {
      appCounts[app.casting_call_id] = (appCounts[app.casting_call_id] || 0) + 1
    })
  }

  // 5. Paginate filtered calls
  const totalItems = filteredCalls.length
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const paginatedCalls = filteredCalls.slice(fromIndex, toIndex + 1)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 space-y-10">
          {/* Header Hero Section */}
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Public Audition Board
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-foreground tracking-tight leading-tight">
              Casting Calls & Auditions
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Find verified casting updates for dramas, commercials, films, fashion, and music videos. Open for everyone to browse — register as talent to apply.
            </p>
          </div>

          {/* Quick Discipline Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: "All Castings", slug: "", icon: "🌟" },
              { label: "Actors", slug: "actor", icon: "🎭" },
              { label: "Models", slug: "model", icon: "✨" },
              { label: "Singers", slug: "singer", icon: "🎤" },
              { label: "Voice Artists", slug: "voice-artist", icon: "🎙️" },
              { label: "Dancers", slug: "dancer", icon: "💃" },
            ].map((tab) => {
              const currentCategory = (resolvedSearchParams.category || "").toLowerCase()
              const isActive = (!tab.slug && !currentCategory) || (tab.slug && currentCategory === tab.slug)
              
              const params = new URLSearchParams()
              if (resolvedSearchParams.location) params.set("location", resolvedSearchParams.location)
              if (tab.slug) params.set("category", tab.slug)
              if (resolvedSearchParams.gender) params.set("gender", resolvedSearchParams.gender)
              if (resolvedSearchParams.compensation) params.set("compensation", resolvedSearchParams.compensation)
              if (resolvedSearchParams.deadline) params.set("deadline", resolvedSearchParams.deadline)

              const queryStr = params.toString()
              const href = `/casting${queryStr ? `?${queryStr}` : ""}`

              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                      : "bg-card/70 text-muted-foreground border-border/50 hover:border-brand-500/30 hover:text-foreground hover:bg-card"
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <CastingFilterSidebar categories={categories || []} />
            </div>

            {/* List Results */}
            <div className="lg:col-span-3 space-y-6">
              {paginatedCalls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedCalls.map((call) => {
                    const reqJson = call.requirements_json as any
                    const genderPref = reqJson?.gender || "any"
                    const ageMinVal = reqJson?.age_min || 18
                    const ageMaxVal = reqJson?.age_max || 60
                    const langs = reqJson?.languages || []
                    const count = appCounts[call.id] || 0

                    const deadlineDate = call.application_deadline
                      ? new Date(call.application_deadline)
                      : null
                    const daysLeft = deadlineDate
                      ? Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 3600 * 24)))
                      : null

                    return (
                      <div
                        key={call.id}
                        className="bg-card/45 backdrop-blur-md border border-border/40 p-5 rounded-2xl flex flex-col justify-between hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/[0.02] group"
                      >
                        <div>
                          {/* Card Header: Category & Verified Title */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">
                              {call.categories?.name || "Talent"}
                            </span>
                            {daysLeft !== null && daysLeft <= 3 && daysLeft > 0 && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wide animate-pulse">
                                Urgent
                              </span>
                            )}
                          </div>

                          <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-brand-500 transition-colors leading-snug line-clamp-1">
                            {call.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="font-semibold text-foreground/80">
                              {call.producer_profiles?.company_name}
                            </span>
                            {call.producer_profiles?.verified && (
                              <span title="Verified Producer">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              </span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 shrink-0" /> {call.location || "On-location"}
                            </span>
                          </div>

                          <hr className="border-border/30 my-3.5" />

                          {/* Requirements Brief */}
                          <div className="space-y-1.5 text-xs text-foreground/85">
                            <p className="font-semibold capitalize">
                              Gender: <span className="font-medium text-muted-foreground">{genderPref}</span>
                            </p>
                            <p className="font-semibold">
                              Age: <span className="font-medium text-muted-foreground">{ageMinVal}–{ageMaxVal} years</span>
                            </p>
                            {langs.length > 0 && (
                              <p className="font-semibold">
                                Languages: <span className="font-medium text-muted-foreground">{langs.join(", ")}</span>
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

                        {/* Card Footer: Deadline & Action */}
                        <div className="flex items-center justify-between border-t border-border/30 pt-3.5 mt-5">
                          <div className="flex flex-col text-[10px] text-muted-foreground gap-0.5">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {count} applied
                            </span>
                            {daysLeft !== null ? (
                              <span className="flex items-center gap-1 font-semibold">
                                <Calendar className="h-3 w-3" />
                                {daysLeft === 0 ? "Expires today" : `${daysLeft} days remaining`}
                              </span>
                            ) : (
                              <span>No deadline</span>
                            )}
                          </div>

                          <Link href={`/casting/${call.id}`}>
                            <Button
                              size="sm"
                              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-brand-500/10 cursor-pointer"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card border border-border/80 rounded-3xl shadow-sm">
                  <div className="p-4 bg-brand-500/10 rounded-full text-brand-500">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">No Open Casting Calls</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      We couldn't find any casting calls matching your active filters. Try clearing them.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/40 pt-6">
                  <span className="text-xs text-muted-foreground">
                    Showing page <strong className="font-semibold text-foreground">{currentPage}</strong> of{" "}
                    <strong className="font-semibold text-foreground">{totalPages}</strong> ({totalItems} total calls)
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/casting?page=${currentPage - 1}`}
                      className={!hasPrev ? "pointer-events-none opacity-50" : ""}
                    >
                      <Button variant="outline" size="sm" disabled={!hasPrev} className="cursor-pointer">
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                    </Link>
                    <Link
                      href={`/casting?page=${currentPage + 1}`}
                      className={!hasNext ? "pointer-events-none opacity-50" : ""}
                    >
                      <Button variant="outline" size="sm" disabled={!hasNext} className="cursor-pointer">
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
