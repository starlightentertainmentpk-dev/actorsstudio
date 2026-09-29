"use client"

import Link from "next/link"
import { useClientPortal } from "@/hooks/useClientPortal"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tv,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Film,
  Building2,
  ChevronRight,
  TrendingUp,
  MapPin,
  FileText,
  AlertCircle,
} from "lucide-react"

export default function ClientDashboardPage() {
  const { clientInfo, stats, projects, briefs, recentActivity } = useClientPortal()

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 backdrop-blur-md shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Client Portal • {clientInfo.company_name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            Welcome back, {clientInfo.user_name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Review curated talent presentations submitted for your active productions, track audition requests, and submit new casting briefs directly to our agency team.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link href="/client/briefs/new">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md shadow-brand-500/20 rounded-xl gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Submit Casting Brief</span>
            </Button>
          </Link>
          <Link href="/client/projects">
            <Button variant="outline" className="border-border/80 rounded-xl gap-1.5 font-medium">
              <span>View Castings</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards: 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 hover:border-brand-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Projects
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Film className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-heading font-extrabold text-foreground">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">Active</span> presentations in review
            </p>
          </div>
        </Card>

        {/* Talent Candidates for Review */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 hover:border-brand-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Candidates
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-heading font-extrabold text-foreground">
              {stats.candidatesForReview}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Awaiting your approval or shortlist
            </p>
          </div>
        </Card>

        {/* Upcoming Auditions */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 hover:border-brand-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Audition Requests
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-heading font-extrabold text-foreground">
              {stats.upcomingAuditions}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Scheduled or requested
            </p>
          </div>
        </Card>

        {/* Briefs Under Review */}
        <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 hover:border-brand-500/30 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agency Intake Queue
            </span>
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-heading font-extrabold text-foreground">
              {stats.briefsUnderReview}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Briefs being processed by agency
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Action Banner */}
      <div className="p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-foreground">
              Have a new campaign or film shoot in the works?
            </h2>
            <p className="text-xs text-muted-foreground">
              Submit your creative brief directly to our talent booking team. We prepare curated options within 24–48 hours.
            </p>
          </div>
        </div>
        <Link href="/client/briefs/new" className="shrink-0">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl gap-2 text-xs h-9">
            <span>Submit New Brief</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Two Column Layout: Active Casting Presentations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Casting Presentations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-heading font-bold text-foreground">
                Casting Presentations For Review
              </h2>
            </div>
            <Link
              href="/client/projects"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {projects.map((project) => {
              const pendingCount = project.submissions.filter((s) => s.client_decision === "pending").length
              return (
                <Card
                  key={project.id}
                  className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-6 hover:border-brand-500/40 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold"
                        >
                          {project.status === "active" ? "Active Review" : "In Review"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-foreground">
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    <Link href={`/client/projects/${project.id}`}>
                      <Button
                        size="sm"
                        className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-1.5 shrink-0 shadow-xs text-xs font-medium"
                      >
                        <span>Review Talent</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Submission Progress Bar */}
                  <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>
                        Total Candidates: <strong className="text-foreground">{project.submission_count}</strong>
                      </span>
                      <span>
                        Shortlisted: <strong className="text-emerald-500">{project.shortlisted_count}</strong>
                      </span>
                      <span>
                        Pending: <strong className="text-amber-500">{pendingCount}</strong>
                      </span>
                    </div>

                    {/* Progress pill */}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{
                            width: `${(project.reviewed_count / project.submission_count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {Math.round((project.reviewed_count / project.submission_count) * 100)}% Reviewed
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-heading font-bold text-foreground">
              Recent Activity
            </h2>
          </div>

          <Card className="rounded-2xl border-border/60 bg-card/60 backdrop-blur-xs p-5 shadow-xs">
            <div className="divide-y divide-border/50 space-y-4">
              {recentActivity.map((act, idx) => (
                <div key={act.id} className={`flex items-start gap-3 ${idx !== 0 ? "pt-4" : ""}`}>
                  <div className="mt-0.5 p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                    {act.type === "audition" ? (
                      <Calendar className="h-4 w-4" />
                    ) : act.type === "shortlist" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : act.type === "deck" ? (
                      <Users className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {act.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {act.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 font-medium">
                      {act.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/50">
              <Link href="/client/briefs">
                <Button
                  variant="ghost"
                  className="w-full text-xs font-medium text-muted-foreground hover:text-foreground justify-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>View All Submitted Briefs</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
