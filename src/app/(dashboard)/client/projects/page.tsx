"use client"

import { useState } from "react"
import Link from "next/link"
import { useClientPortal } from "@/hooks/useClientPortal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tv,
  Users,
  Calendar,
  MapPin,
  Search,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Film,
} from "lucide-react"

export default function ClientProjectsPage() {
  const { projects, clientInfo } = useClientPortal()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.location && project.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      statusFilter === "all" ? true : project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-xs font-semibold"
            >
              Casting Packages
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mt-1">
            Talent Presentations & Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse presented actor and model decks curated exclusively for {clientInfo.company_name}.
          </p>
        </div>

        <Link href="/client/briefs/new">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-2 font-medium shadow-xs">
            <Sparkles className="h-4 w-4" />
            <span>Request New Casting</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 rounded-xl border-border/70 bg-card/60"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50 self-start sm:self-auto">
          {["all", "active", "in_review"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all"
                ? "All Presentations"
                : tab === "active"
                ? "Active Review"
                : "In Review"}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="rounded-2xl border-border/60 bg-card/40 p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Tv className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No Casting Presentations Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn't find any talent presentations matching your search.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const pendingCount = project.submissions.filter(
              (s) => s.client_decision === "pending"
            ).length

            return (
              <Card
                key={project.id}
                className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xs p-6 hover:border-brand-500/40 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold"
                    >
                      {project.status === "active" ? "Active Review" : "In Review"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {project.shoot_dates || "Dates TBA"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Location badge */}
                  {project.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <MapPin className="h-3.5 w-3.5 text-brand-500" />
                      <span>{project.location}</span>
                    </div>
                  )}

                  {/* Talent Headshot Stack Preview */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                      Presented Candidates ({project.submissions.length})
                    </span>
                    <div className="flex items-center -space-x-3 overflow-hidden">
                      {project.submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="relative inline-block h-10 w-10 rounded-full ring-2 ring-card overflow-hidden shadow-xs"
                          title={`${sub.talent_name} (${sub.role_name || "Talent"})`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sub.headshot_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                            alt={sub.talent_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Action Button */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {project.shortlisted_count} Shortlisted • {pendingCount} Pending
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {project.reviewed_count} of {project.submission_count} reviewed
                    </div>
                  </div>

                  <Link href={`/client/projects/${project.id}`}>
                    <Button
                      size="sm"
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      <span>Review Deck</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
