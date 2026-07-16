"use client"

import { useUser } from "@/hooks/useUser"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { VerifiedBadge } from "@/components/features/producer/VerifiedBadge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Loader2,
  AlertTriangle,
  Plus,
  Search,
  Tv,
  Users,
  CheckSquare,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

export default function ProducerDashboardPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()

  // 1. Fetch producer profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["producer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // 2. Fetch stats and recent activity
  const { data: dashboardData, isLoading: dataLoading } = useQuery({
    queryKey: ["producer-dashboard-stats", profile?.id],
    queryFn: async () => {
      if (!profile) return null

      // Get all casting calls of the producer
      const { data: myCalls, error: callsError } = await supabase
        .from("casting_calls")
        .select("id, status")
        .eq("producer_id", profile.id)

      if (callsError) throw callsError

      const activeCallsCount = myCalls?.filter((c) => c.status === "open").length || 0
      const callIds = myCalls?.map((c) => c.id) || []

      interface ActivityItem {
        id: string
        status: string
        updated_at: string
        talent_profiles: {
          full_name: string
          stage_name: string | null
        } | null
        casting_calls: {
          title: string
        } | null
      }
      let recentActivity: ActivityItem[] = []

      let totalApplications = 0
      let shortlistedApplications = 0
      let auditionsScheduled = 0

      if (callIds.length > 0) {
        // Fetch total applications count
        const { count: totalApps, error: totalAppsError } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("casting_call_id", callIds)

        if (totalAppsError) throw totalAppsError
        totalApplications = totalApps || 0

        // Fetch shortlisted applications count
        const { count: shortlistedApps, error: shortlistedAppsError } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("casting_call_id", callIds)
          .eq("status", "shortlisted")

        if (shortlistedAppsError) throw shortlistedAppsError
        shortlistedApplications = shortlistedApps || 0

        // Fetch auditions count
        const { count: auditionsCount, error: auditionsError } = await supabase
          .from("auditions")
          .select("id", { count: "exact", head: true })
          .in("casting_call_id", callIds)

        if (auditionsError) throw auditionsError
        auditionsScheduled = auditionsCount || 0

        // Fetch recent activity: last 5 application updates
        const { data: recentApps, error: recentAppsError } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            updated_at,
            talent_profiles (
              full_name,
              stage_name
            ),
            casting_calls (
              title
            )
          `)
          .in("casting_call_id", callIds)
          .order("updated_at", { ascending: false })
          .limit(5)

        if (recentAppsError) throw recentAppsError
        recentActivity = recentApps || []
      }

      return {
        activeCallsCount,
        totalApplications,
        shortlistedApplications,
        auditionsScheduled,
        recentActivity,
      }
    },
    enabled: !!profile,
  })

  const isLoading = authLoading || profileLoading || dataLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading dashboard overview...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Profile details not found.</p>
      </div>
    )
  }

  const {
    activeCallsCount = 0,
    totalApplications = 0,
    shortlistedApplications = 0,
    auditionsScheduled = 0,
    recentActivity = [],
  } = dashboardData || {}

  const isVerified = profile.verified

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {profile.company_name}
            </h1>
            <VerifiedBadge verified={isVerified} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Dashboard overview of your casting activities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/producer/talent-search">
            <Button variant="outline" className="flex items-center gap-2 border-border/60 font-semibold cursor-pointer">
              <Search className="h-4 w-4" /> Search Talent
            </Button>
          </Link>

          {isVerified ? (
            <Link href="/producer/casting?create=true">
              <Button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-2 shadow-md shadow-brand-500/10 cursor-pointer">
                <Plus className="h-4 w-4" /> New Casting Call
              </Button>
            </Link>
          ) : (
            <div className="relative group">
              <Button
                disabled
                className="bg-brand-500/50 text-white/70 font-semibold flex items-center gap-2 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" /> New Casting Call
              </Button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded-lg border border-border/80 shadow-md max-w-[200px] z-50">
                You must be verified before you can post casting calls.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Banner */}
      {!isVerified && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Your company profile is under verification</p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              You can search and browse talent profiles, but you cannot post casting calls or contact talent directly until verified by the administration.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Calls */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Casting Calls
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{activeCallsCount}</p>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Applications Received
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{totalApplications}</p>
          </div>
        </div>

        {/* Shortlisted Talent */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 dark:text-brand-400">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Shortlisted Talent
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{shortlistedApplications}</p>
          </div>
        </div>

        {/* Auditions Scheduled */}
        <div className="bg-card/40 backdrop-blur-sm border border-border/40 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Auditions Scheduled
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{auditionsScheduled}</p>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card/20 border border-border/40 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-500" /> Recent Activity
              </h2>
            </div>

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm">No recent activity detected.</p>
                <p className="text-xs mt-0.5 text-muted-foreground/80">
                  Applications will appear here when talent applies to your calls.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const talentName =
                    activity.talent_profiles?.stage_name ||
                    activity.talent_profiles?.full_name ||
                    "Unknown Talent"
                  const callTitle = activity.casting_calls?.title || "Casting Call"
                  const formattedDate = new Date(activity.updated_at).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between p-3.5 bg-background/40 border border-border/30 rounded-xl hover:border-brand-500/30 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {talentName}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          applied to{" "}
                          <strong className="text-foreground/80 font-medium">
                            {callTitle}
                          </strong>
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formattedDate}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            activity.status === "shortlisted"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : activity.status === "rejected"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {recentActivity.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40 text-right">
              <Link href="/producer/applications" className="text-xs font-semibold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1">
                View All Applications <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Company Quick Summary */}
        <div className="bg-card/20 border border-border/40 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Company Profile</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Type
                </p>
                <p className="text-foreground capitalize mt-0.5">
                  {profile.company_type?.replace("_", " ") || "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Website
                </p>
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline mt-0.5 block truncate"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p className="text-muted-foreground mt-0.5">Not set</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Bio
                </p>
                <p className="text-foreground/90 mt-0.5 leading-relaxed line-clamp-4">
                  {profile.bio || "No company bio provided yet."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40">
            <Link href="/producer/profile">
              <Button variant="outline" className="w-full font-semibold border-border/60">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
