"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart,
  Users,
  Building,
  Tv,
  TrendingUp,
  Award,
  Loader2,
  CalendarCheck,
  CheckCircle,
  FileCheck2,
  FolderOpen
} from "lucide-react"

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "studio_admin"])
  const supabase = createClient()

  // Fetch all analytics datasets concurrently
  const { data: statsData, isLoading: dataLoading } = useQuery({
    queryKey: ["admin-analytics-stats"],
    queryFn: async () => {
      // 1. Fetch talent profiles
      const { data: talents, error: talentsErr } = await supabase
        .from("talent_profiles")
        .select("id, verification_status, category_id")
      if (talentsErr) throw talentsErr

      // 2. Fetch producer profiles
      const { data: producers, error: producersErr } = await supabase
        .from("producer_profiles")
        .select("id, verified")
      if (producersErr) throw producersErr

      // 3. Fetch casting calls
      const { data: castings, error: castingsErr } = await supabase
        .from("casting_calls")
        .select("id, status")
      if (castingsErr) throw castingsErr

      // 4. Fetch applications
      const { data: applications, error: appsErr } = await supabase
        .from("applications")
        .select("id, status")
      if (appsErr) throw appsErr

      // 5. Fetch categories
      const { data: categories, error: catsErr } = await supabase
        .from("categories")
        .select("id, name")
      if (catsErr) throw catsErr

      // 6. Fetch auditions
      const { data: auditions, error: audsErr } = await supabase
        .from("auditions")
        .select("id")
      if (audsErr) throw audsErr

      return {
        talents: talents || [],
        producers: producers || [],
        castings: castings || [],
        applications: applications || [],
        categories: categories || [],
        auditions: auditions || []
      }
    },
    enabled: !!user
  })

  const pageLoading = authLoading || dataLoading

  if (pageLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Compiling statistics & analytics...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Calculate calculations once data is ready
  const {
    talents = [],
    producers = [],
    castings = [],
    applications = [],
    categories = [],
    auditions = []
  } = statsData || {}

  // 1. Talent grouping
  const talentTotal = talents.length
  const talentPending = talents.filter((t) => t.verification_status === "pending").length
  const talentReview = talents.filter((t) => t.verification_status === "under_review").length
  const talentApproved = talents.filter((t) => t.verification_status === "approved").length
  const talentRejected = talents.filter((t) => t.verification_status === "rejected").length

  // 2. Producer grouping
  const producerTotal = producers.length
  const producerVerified = producers.filter((p) => p.verified === true).length
  const producerUnverified = producers.filter((p) => p.verified === false).length

  // 3. Casting calls grouping
  const castingsTotal = castings.length
  const castingDraft = castings.filter((c) => c.status === "draft").length
  const castingOpen = castings.filter((c) => c.status === "open").length
  const castingClosed = castings.filter((c) => c.status === "closed").length
  const castingCancelled = castings.filter((c) => c.status === "cancelled").length

  // 4. Applications Success Rate
  const totalApps = applications.length
  const successfulApps = applications.filter(
    (a) => a.status === "shortlisted" || a.status === "selected" || a.status === "audition"
  ).length
  const successRate = totalApps > 0 ? Math.round((successfulApps / totalApps) * 100) : 0

  // 5. Category distribution count
  const categoryCounts = talents.reduce((acc: Record<string, number>, t) => {
    const catId = t.category_id
    if (catId) {
      acc[catId] = (acc[catId] || 0) + 1
    } else {
      acc["unassigned"] = (acc["unassigned"] || 0) + 1
    }
    return acc
  }, {})

  const categoryDistribution = categories.map((cat) => {
    const count = categoryCounts[cat.id] || 0
    return {
      name: cat.name,
      count
    }
  })

  // Add unassigned if any exist
  if (categoryCounts["unassigned"]) {
    categoryDistribution.push({
      name: "Uncategorized",
      count: categoryCounts["unassigned"]
    })
  }

  // Sort by count descending
  categoryDistribution.sort((a, b) => b.count - a.count)

  const maxCategoryCount = Math.max(...categoryDistribution.map((c) => c.count), 1)

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <BarChart className="h-8 w-8 text-brand-500" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Platform Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Live updates on platform expansion, verification pipelines, and engagement rates.
            </p>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Talent */}
          <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Talent</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground font-heading">{talentTotal}</p>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-2">
                <span>Approved: <strong className="text-emerald-500">{talentApproved}</strong></span>
                <span>Pending: <strong className="text-amber-500">{talentPending}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: Producers */}
          <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Producers</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Building className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground font-heading">{producerTotal}</p>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-2">
                <span>Verified: <strong className="text-emerald-500">{producerVerified}</strong></span>
                <span>Pending: <strong className="text-amber-500">{producerUnverified}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 3: Casting Calls */}
          <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Casting Calls</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Tv className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground font-heading">{castingsTotal}</p>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-2">
                <span>Open: <strong className="text-purple-500">{castingOpen}</strong></span>
                <span>Draft: <strong className="text-neutral-400">{castingDraft}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shortlist Rate</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground font-heading">{successRate}%</p>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/20 pt-2">
                <span>Submissions: <strong>{totalApps}</strong></span>
                <span>Auditions: <strong>{auditions.length}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed stats grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Category distribution bar chart */}
          <div className="lg:col-span-8 bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-brand-500" /> Talent Categories Distribution
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-6">
                Active talent profiles registered under each category.
              </p>
            </div>

            {categoryDistribution.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No category data available</div>
            ) : (
              <div className="space-y-4 flex-1">
                {categoryDistribution.map((item, idx) => {
                  const percent = Math.round((item.count / maxCategoryCount) * 100)
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-foreground capitalize">{item.name}</span>
                        <span className="text-muted-foreground">{item.count} {item.count === 1 ? "artist" : "artists"}</span>
                      </div>
                      <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden border border-border/10">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right panel: Subsystem break downs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Talent verifications */}
            <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-brand-500" /> Talent Verifications
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Approved / Active</span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{talentApproved}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Pending Approval</span>
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">{talentPending}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Under Review</span>
                  <span className="font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{talentReview}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">Rejected / Incomplete</span>
                  <span className="font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{talentRejected}</span>
                </div>
              </div>
            </div>

            {/* Casting call statuses */}
            <div className="bg-card/25 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="h-4.5 w-4.5 text-brand-500" /> Casting Call Statuses
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Open Roles</span>
                  <span className="font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md">{castingOpen}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Draft Calls</span>
                  <span className="font-bold text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded-md">{castingDraft}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-muted-foreground">Closed Positions</span>
                  <span className="font-bold text-foreground/75 bg-muted px-2 py-0.5 rounded-md">{castingClosed}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">Cancelled Calls</span>
                  <span className="font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{castingCancelled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
