"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  Users,
  ShieldCheck,
  Layers,
  Tv,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from "lucide-react"

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useRequireAuth(["super_admin", "studio_admin"])
  const supabase = createClient()

  // Query pending talent count
  const { data: pendingTalentCount = 0, isLoading: talentCountLoading } = useQuery({
    queryKey: ["admin-pending-talent-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("talent_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending")

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })

  // Query pending producer count
  const { data: pendingProducerCount = 0, isLoading: producerCountLoading } = useQuery({
    queryKey: ["admin-pending-producer-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("producer_profiles")
        .select("id", { count: "exact", head: true })
        .eq("verified", false)
        .not("verification_docs_url", "is", null)

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Pending Talent Queue",
      description: "Review identity and credential documents for registered artists",
      count: pendingTalentCount,
      loading: talentCountLoading,
      href: "/admin/talent",
      icon: Users,
      badgeText: pendingTalentCount > 0 ? `${pendingTalentCount} Pending` : "All Clear",
      badgeVariant: pendingTalentCount > 0 ? ("warning" as const) : ("success" as const),
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      cta: "Review Talent",
    },
    {
      title: "Producer Verifications",
      description: "Validate enterprise production entities and business licenses",
      count: pendingProducerCount,
      loading: producerCountLoading,
      href: "/admin/producers",
      icon: ShieldCheck,
      badgeText: pendingProducerCount > 0 ? `${pendingProducerCount} Pending` : "All Clear",
      badgeVariant: pendingProducerCount > 0 ? ("warning" as const) : ("success" as const),
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      cta: "Verify Producers",
    },
    {
      title: "Category Taxonomy",
      description: "Manage acting, modeling, voice-over, and craft classifications",
      href: "/admin/categories",
      icon: Layers,
      badgeText: "Taxonomy",
      badgeVariant: "purple" as const,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      cta: "Manage Categories",
    },
    {
      title: "Casting Calls Directory",
      description: "Audit public projects, roles, and compliance requirements",
      href: "/admin/casting",
      icon: Tv,
      badgeText: "Moderation",
      badgeVariant: "cyan" as const,
      color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      cta: "Moderate Casting",
    },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Administration Hub
              </h1>
              <Badge variant="purple" size="sm" className="font-semibold uppercase tracking-wider">
                {user.role?.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Platform governance, identity verifications, and marketplace compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Operational • Logged in as <strong>{user.email}</strong></span>
          </div>
        </div>

        {/* Informational Guidelines Card */}
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-foreground">
                Marketplace Trust & Safety Policy
              </p>
              <p className="text-muted-foreground leading-relaxed">
                All talent portfolios and production houses must pass document authentication before gaining public discovery and contact privileges.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Navigation Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group block cursor-pointer"
              >
                <Card hover className="h-full flex flex-col justify-between p-5 border-border/70 group-hover:border-brand-500/40">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant={item.badgeVariant} size="sm">
                        {item.badgeText}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-foreground text-base tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                    {item.loading ? (
                      <Skeleton className="h-7 w-12" />
                    ) : item.count !== undefined ? (
                      <div className="font-heading text-2xl font-black text-foreground">
                        {item.count}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Sliders className="h-3.5 w-3.5" /> Configure
                      </span>
                    )}

                    <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {item.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
