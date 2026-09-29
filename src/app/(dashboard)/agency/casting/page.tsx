"use client"

import React, { useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { useOrganizations } from "@/hooks/useOrganizations"
import { useCastingProjects } from "@/hooks/useCastingPipeline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Tv,
  Plus,
  Layers,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
  Send,
  X,
} from "lucide-react"
import { BriefParserModal } from "@/components/features/casting/BriefParserModal"

export default function AgencyCastingPage() {
  const { activeOrg } = useOrganizations()
  const { projects, createProject } = useCastingProjects()
  const orgName = activeOrg?.name || "Agency"

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBriefParserOpen, setIsBriefParserOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState("Commercial TVC")
  const [newClient, setNewClient] = useState("Dawn Films & Media")
  const [newDates, setNewDates] = useState("")
  const [newBudget, setNewBudget] = useState("")
  const [newLocation, setNewLocation] = useState("Karachi")

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRoles = projects.reduce((acc, p) => acc + p.roles.length, 0)
  const totalCandidates = projects.reduce((acc, p) => acc + p.candidates.length, 0)
  const clientSubmissionsCount = projects.reduce(
    (acc, p) => acc + p.candidates.filter((c) => c.stage === "submitted" || c.stage === "client_review").length,
    0
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    createProject({
      title: newTitle.trim(),
      project_type: newType,
      client_name: newClient,
      shoot_dates: newDates || "TBD",
      location: newLocation,
      budget_range: newBudget || "PKR 1,000,000",
    })

    setNewTitle("")
    setNewDates("")
    setNewBudget("")
    setIsCreateModalOpen(false)
  }

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Casting Pipelines & Submissions
              </h1>
              <span className="text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                Interactive Kanban
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-role breakdowns, candidate matching, and client review submission workflows for {orgName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 shadow-xs"
              onClick={() => setIsBriefParserOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              AI Brief Parser
            </Button>

            <Button
              size="sm"
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Casting Project
            </Button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Active Projects</span>
              <Tv className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground mt-2">
              {projects.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Commercial, TV & film briefs</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Roles Defined</span>
              <Layers className="h-4 w-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground mt-2">
              {totalRoles}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Specific character breakdowns</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Candidates In Pipeline</span>
              <Users className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground mt-2">
              {totalCandidates}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Matched from agency roster</p>
          </Card>

          <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Client Reviews</span>
              <Send className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground mt-2">
              {clientSubmissionsCount}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active in client portals</p>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card/60">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, client, or location..."
              className="pl-8 h-8 text-xs bg-background/80"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Showing {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const shortlisted = project.candidates.filter((c) => c.stage === "shortlisted").length
            const submitted = project.candidates.filter(
              (c) => c.stage === "submitted" || c.stage === "client_review"
            ).length
            const audition = project.candidates.filter(
              (c) => c.stage === "audition" || c.stage === "callback"
            ).length
            const booked = project.candidates.filter((c) => c.stage === "booked").length

            return (
              <Card
                key={project.id}
                className="group border-border/70 hover:border-brand-500/50 bg-card/80 hover:bg-card transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] bg-brand-500/10 text-brand-300 border-brand-500/20">
                      {project.project_type || "Production"}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-brand-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    {project.client_name && (
                      <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {project.client_name}
                      </p>
                    )}
                  </div>

                  {/* Project metadata */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    {project.shoot_dates && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        <span className="truncate">Shoots: {project.shoot_dates}</span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                        <span>Location: {project.location}</span>
                      </div>
                    )}
                    {project.budget_range && (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <DollarSign className="h-3 w-3" />
                        <span>{project.budget_range}</span>
                      </div>
                    )}
                  </div>

                  {/* Roles & Candidate Breakdown Summary */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Defined Roles:</span>
                      <span className="font-semibold text-foreground">{project.roles.length} Roles</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {shortlisted} Shortlisted
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {submitted} In Review
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {audition} Audition
                      </span>
                      {booked > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {booked} Booked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="pt-4 mt-2">
                  <Link href={`/agency/casting/${project.id}/pipeline`}>
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium justify-between group-hover:pr-3"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Open Kanban Pipeline ({project.candidates.length})
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <Card className="border-dashed border-border/80 p-8 text-center bg-card/40">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                <Tv className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No Projects Found
              </h3>
              <p className="text-xs text-muted-foreground">
                Create a casting project to start defining roles and matching candidates through the visual Kanban board.
              </p>
              <div className="pt-2">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-brand-600 text-white"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create First Casting Project
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">New Casting Project</h2>
                <p className="text-[11px] text-muted-foreground">Setup casting call parameters and specifications</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AI Auto-Fill Banner */}
            <div className="p-2.5 rounded-xl border border-brand-500/30 bg-brand-500/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>Paste WhatsApp brief?</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[11px] h-7 gap-1 border-brand-500/40 text-brand-300 hover:bg-brand-500/20"
                onClick={() => setIsBriefParserOpen(true)}
              >
                <Sparkles className="h-3 w-3" />
                Magic Auto-Fill
              </Button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Project Title *</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Ramadan Prime-Time Drama Serial 'Khwaab Nagar'"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Project Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="Television Drama">Television Drama</option>
                    <option value="Commercial TVC">Commercial TVC</option>
                    <option value="Cinema Feature">Cinema Feature</option>
                    <option value="Digital Web Series">Digital Web Series</option>
                    <option value="Print / Lookbook">Print / Lookbook</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Client Partner</label>
                  <Input
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="e.g. Dawn Films & Media"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Shoot Dates</label>
                  <Input
                    value={newDates}
                    onChange={(e) => setNewDates(e.target.value)}
                    placeholder="e.g. Dec 15 - Jan 25"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Location</label>
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Karachi"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Casting Budget Range</label>
                <Input
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="e.g. PKR 12,000,000 Total"
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-brand-600 text-white">
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Brief Parser Modal */}
      <BriefParserModal
        isOpen={isBriefParserOpen}
        onClose={() => setIsBriefParserOpen(false)}
        onApplyParsed={(parsed) => {
          if (parsed.projectTitle) setNewTitle(parsed.projectTitle)
          if (parsed.location) setNewLocation(parsed.location)
          if (parsed.shootDates) setNewDates(parsed.shootDates)
          if (parsed.budget) setNewBudget(parsed.budget)
          if (parsed.projectTitle) {
            const isTVC = parsed.projectTitle.toLowerCase().includes("tvc") || parsed.projectTitle.toLowerCase().includes("commercial")
            setNewType(isTVC ? "Commercial TVC" : "Television Drama")
          }
          setIsCreateModalOpen(true)
        }}
      />
    </DashboardShell>
  )
}
