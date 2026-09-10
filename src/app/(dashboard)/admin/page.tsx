"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Users,
  ShieldCheck,
  Layers,
  Tv,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle
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
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Pending Talent Queue",
      description: "Approve newly registered talent profiles",
      count: pendingTalentCount,
      loading: talentCountLoading,
      href: "/admin/talent",
      icon: Users,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      cta: "Review Talent",
    },
    {
      title: "Producer Queue",
      description: "Verify business credentials for producers",
      count: pendingProducerCount,
      loading: producerCountLoading,
      href: "/admin/producers",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      cta: "Verify Producers",
    },
    {
      title: "Categories",
      description: "Manage talent classification taxonomy",
      href: "/admin/categories",
      icon: Layers,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      cta: "Manage Categories",
    },
    {
      title: "Casting Calls",
      description: "Review platform casting submissions",
      href: "/admin/casting",
      icon: Tv,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      cta: "View Casting",
    },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Admin Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user.email.split("@")[0]} • Role: {user.role}
          </p>
        </div>

        {/* Informational Message */}
        <div className="border border-border/40 bg-card/20 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm text-foreground/80 leading-relaxed">
            This is the administration dashboard. Here you can configure user accounts, approve pending talent profiles, review platform submissions, and check analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative flex flex-col justify-between p-6 bg-card/25 hover:bg-card/45 border border-border/40 hover:border-brand-500/30 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4 relative z-10">
                  <div className={`p-2.5 rounded-xl border w-fit ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base tracking-tight">{item.title}</h3>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between relative z-10">
                  {item.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : item.count !== undefined ? (
                    <span className="text-2xl font-black text-foreground font-heading">
                      {item.count}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">Manage</span>
                  )}
                  <span className="text-xs text-brand-500 font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    {item.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
