"use client"

import { useUser } from "@/hooks/useUser"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { VerifiedBadge } from "@/components/features/producer/VerifiedBadge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
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
  Building2,
  Globe,
  ExternalLink,
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon={Building2}
        title="Producer profile not found"
        description="We couldn't retrieve your producer profile. Please complete your registration or contact support."
        actionLabel="Complete Onboarding"
        actionHref="/producer/onboarding"
      />
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

  const statCards = [
    {
      label: "Active Casting Calls",
      value: activeCallsCount,
      icon: Tv,
      subtext: "Published & accepting applications",
      iconColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Applications Received",
      value: totalApplications,
      icon: Users,
      subtext: "Across all active calls",
      iconColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Shortlisted Talent",
      value: shortlistedApplications,
      icon: CheckSquare,
      subtext: "Passed initial screening",
      iconColor: "text-brand-600 dark:text-brand-400 bg-brand-500/10 border-brand-500/20",
    },
    {
      label: "Auditions Scheduled",
      value: auditionsScheduled,
      icon: Calendar,
      subtext: "Live or video auditions",
      iconColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {profile.company_name}
            </h1>
            <VerifiedBadge verified={isVerified} />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time management for your casting calls, applicant reviews, and auditions.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/producer/talent-search">
            <Button variant="outline" className="flex items-center gap-2 border-border/70 font-semibold cursor-pointer">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>Search Talent</span>
            </Button>
          </Link>

          {isVerified ? (
            <Link href="/producer/casting?create=true">
              <Button className="bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-2 shadow-sm shadow-brand-500/20 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>New Casting Call</span>
              </Button>
            </Link>
          ) : (
            <div className="relative group">
              <Button
                disabled
                className="bg-brand-600/40 text-white/60 font-semibold flex items-center gap-2 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>New Casting Call</span>
              </Button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2.5 rounded-xl border border-border shadow-lg max-w-[220px] z-50">
                You must be verified by the admin team before you can post public casting calls.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Banner */}
      {!isVerified && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex items-start gap-3 text-xs sm:text-sm shadow-2xs">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Company verification pending
            </p>
            <p className="mt-0.5 text-muted-foreground leading-relaxed text-xs">
              You can browse and bookmark talent profiles freely. Direct casting call postings and messaging will be activated once your credentials are confirmed by our studio admin.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} hover className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg border ${stat.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="font-heading text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {stat.value}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {stat.subtext}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Real-time updates on talent submissions and audition progress
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No recent submissions yet"
                description="When talent applies to your casting calls, their real-time application events will appear here."
                actionLabel={isVerified ? "Post a Casting Call" : "Browse Talent"}
                actionHref={isVerified ? "/producer/casting?create=true" : "/producer/talent-search"}
                className="border-none bg-transparent py-8"
              />
            ) : (
              <div className="space-y-2.5">
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

                  const statusVariant =
                    activity.status === "shortlisted"
                      ? "success"
                      : activity.status === "rejected"
                      ? "destructive"
                      : "default"

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/60 border border-border/40 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {talentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {talentName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            applied to <span className="font-medium text-foreground/80">{callTitle}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                        <Badge variant={statusVariant} size="sm" className="capitalize">
                          {activity.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>

          {recentActivity.length > 0 && (
            <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
              <Link
                href="/producer/applications"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>View All Applications</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          )}
        </Card>

        {/* Company Quick Summary */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Your public production credentials
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Company Type
                </p>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize font-medium">
                    {profile.company_type?.replace("_", " ") || "Production House"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Official Website
                </p>
                {profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline mt-1 break-all"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span>{profile.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Not configured</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  About the Studio
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-4">
                  {profile.bio || "No company bio provided yet. Update your profile to present a professional impression to applicants."}
                </p>
              </div>
            </CardContent>
          </div>

          <CardFooter className="border-t border-border/40 pt-4">
            <Link href="/producer/profile" className="w-full">
              <Button variant="outline" className="w-full font-semibold border-border/70">
                Edit Company Profile
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
