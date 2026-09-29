"use client"

import { DashboardShell } from "@/components/shared/DashboardShell"
import { useOrganizations } from "@/hooks/useOrganizations"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Building2,
  Tv,
  Coins,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Plus,
  Settings,
  FileText,
  UserCheck,
  TrendingUp,
} from "lucide-react"

export default function AgencyDashboardPage() {
  const { activeOrg, isLoading } = useOrganizations()

  const orgName = activeOrg?.name || "Agency Workspace"
  const brandColor = activeOrg?.brand_color || "#4f46e5"
  const currency = activeOrg?.currency || "PKR"

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        {/* Agency Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-muted/30 backdrop-blur-xs shadow-xs">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              {activeOrg?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeOrg.logo_url}
                  alt={orgName}
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                orgName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  {orgName}
                </h1>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wider font-semibold border-brand-500/30 text-brand-600 dark:text-brand-400"
                >
                  {activeOrg?.agency_type?.replace("_", " ") || "Talent Agency"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeOrg?.country || "Pakistan"} • Operational Currency: {currency} • Timezone:{" "}
                {activeOrg?.timezone || "Asia/Karachi"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/agency/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-background/60 hover:bg-muted text-foreground text-xs font-semibold shadow-2xs transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <Link
              href="/agency/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Agency
            </Link>
          </div>
        </div>

        {/* Tenant RLS Security Banner */}
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">
              Tenant Isolation Active: All talent dossiers, casting pitches, and commission logs are securely isolated to{" "}
              <strong className="text-foreground">/{activeOrg?.slug || "agency"}</strong>.
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
            RLS Enforced
          </Badge>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Roster Artists
              </CardTitle>
              <Users className="h-4 w-4 text-brand-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>Represented talent & actors</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Client Accounts
              </CardTitle>
              <Building2 className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>Production houses & brands</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Casting Pipelines
              </CardTitle>
              <Tv className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">0</div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>Active submissions & calls</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Gross Deal Volume
              </CardTitle>
              <Coins className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {currency} 0
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>Ready for commercial deals</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch & Operational Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                Talent Operations
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your agency representation roster, talent media, and pitching assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/agency/talent"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-brand-600 transition-colors">
                      Agency Talent Roster
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Add, filter, and organize represented artists with internal notes.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/agency/casting"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Tv className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-brand-600 transition-colors">
                      Casting Submissions
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Track casting submissions and audition schedules across projects.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Client & Finance Workflows
              </CardTitle>
              <CardDescription className="text-xs">
                Build production company accounts and monitor agency commission splits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/agency/clients"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-brand-600 transition-colors">
                      Client Accounts & CRM
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Track casting directors, producers, and client interaction histories.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/agency/settings"
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground group-hover:text-brand-600 transition-colors">
                      Agency Configuration
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Commission rates, custom domain, and team member management.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
