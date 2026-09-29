"use client"

import React, { useState, use } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
} from "@dnd-kit/core"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { useCastingPipeline } from "@/hooks/useCastingPipeline"
import { KanbanColumn } from "@/components/features/casting/KanbanColumn"
import { PipelineCandidateCard } from "@/components/features/casting/PipelineCandidateCard"
import { SubmitToClientModal } from "@/components/features/casting/SubmitToClientModal"
import { CreateRoleModal } from "@/components/features/casting/CreateRoleModal"
import { AddTalentModal } from "@/components/features/casting/AddTalentModal"
import { CompCardModal } from "@/components/features/casting/CompCardModal"
import { RequestSelfTapeModal } from "@/components/features/casting/RequestSelfTapeModal"
import { SelfTapeReviewSuite } from "@/components/features/casting/SelfTapeReviewSuite"
import { AITalentMatchDrawer } from "@/components/features/ai/AITalentMatchDrawer"
import { useSelfTapes } from "@/hooks/useSelfTapes"
import { SelfTapeRequest } from "@/types/self-tape"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  PipelineCandidate,
  PipelineStage,
  PIPELINE_STAGE_LABELS,
} from "@/types/pipeline"
import {
  ArrowLeft,
  Plus,
  Users,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  Download,
  Filter,
  Search,
  Layers,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react"

interface PipelinePageProps {
  params: Promise<{ id: string }>
}

// Default 7 operational casting stages specified in subprompt 04
const CORE_PIPELINE_STAGES: PipelineStage[] = [
  "shortlisted",
  "submitted",
  "client_review",
  "audition",
  "callback",
  "selected",
  "booked",
]

// All 11 stages available in the system
const ALL_11_PIPELINE_STAGES: PipelineStage[] = [
  "new_brief",
  "searching",
  "shortlisted",
  "submitted",
  "client_review",
  "audition",
  "callback",
  "selected",
  "offer",
  "booked",
  "completed",
]

export default function AgencyCastingPipelinePage({ params }: PipelinePageProps) {
  const { id } = use(params)
  const { toast } = useToast()

  const {
    project,
    roles,
    candidates,
    talentRoster,
    moveCandidate,
    submitToClient,
    addRole,
    addCandidate,
    removeCandidate,
    bulkMoveStage,
  } = useCastingPipeline(id)

  // Filtering & view state
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewAllStages, setViewAllStages] = useState(false)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [candidateForSubmit, setCandidateForSubmit] = useState<PipelineCandidate | null>(null)

  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false)
  const [isAddTalentModalOpen, setIsAddTalentModalOpen] = useState(false)

  const [isCompCardModalOpen, setIsCompCardModalOpen] = useState(false)
  const [activeCompCardCandidate, setActiveCompCardCandidate] = useState<PipelineCandidate | null>(null)

  // Self-Tape System Integration
  const {
    requests: selfTapeRequests,
    requestSelfTape,
    addReviewComment,
    getRequestForCandidate,
  } = useSelfTapes()

  const [isRequestSelfTapeModalOpen, setIsRequestSelfTapeModalOpen] = useState(false)
  const [candidateForSelfTape, setCandidateForSelfTape] = useState<PipelineCandidate | null>(null)
  const [isReviewSuiteOpen, setIsReviewSuiteOpen] = useState(false)
  const [activeSelfTapeRequest, setActiveSelfTapeRequest] = useState<SelfTapeRequest | null>(null)

  // AI Talent Matchmaker State
  const [isAIMatchOpen, setIsAIMatchOpen] = useState(false)

  const handleAIMatchAddCandidate = async (match: any) => {
    const existing = candidates.find((c) => c.talent_id === match.talentId)
    if (existing) {
      toast({
        title: "Already in Pipeline",
        description: `${match.fullName} is already shortlisted in this project.`,
      })
      return
    }
    await addCandidate({
      talentId: match.talentId,
      roleId: activeRoleFilter !== "all" ? activeRoleFilter : roles[0]?.id || null,
      stage: "shortlisted",
      proposedFee: 350000,
      currency: "PKR",
      pitchNote: `AI Match (${match.matchScore}%): ${match.matchedCriteria?.join(", ")}`,
    })
    toast({
      title: "Candidate Shortlisted",
      description: `${match.fullName} added to Shortlisted stage.`,
      type: "success",
    })
  }

  const handleOpenRequestSelfTape = (candidate: PipelineCandidate) => {
    setCandidateForSelfTape(candidate)
    setIsRequestSelfTapeModalOpen(true)
  }

  const handleOpenReviewSuite = (candidate: PipelineCandidate) => {
    const req = getRequestForCandidate(id, candidate.talent_id)
    if (req) {
      setActiveSelfTapeRequest(req)
      setIsReviewSuiteOpen(true)
    } else {
      toast({
        title: "Request Self-Tape First",
        description: `No self-tape submission exists for ${candidate.talent.full_name} yet. Send an audition brief now.`,
        type: "info",
      })
      handleOpenRequestSelfTape(candidate)
    }
  }

  // Drag and drop state
  const [activeCandidate, setActiveCandidate] = useState<PipelineCandidate | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Filter candidates based on role and search query
  const filteredCandidates = candidates.filter((c) => {
    // Role filter
    if (activeRoleFilter !== "all" && c.casting_role_id !== activeRoleFilter) {
      return false
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = c.talent.full_name.toLowerCase().includes(q)
      const stageNameMatch = c.talent.stage_name?.toLowerCase().includes(q)
      const skillMatch = c.talent.skills?.some((s) => s.toLowerCase().includes(q))
      const roleMatch = c.role?.role_name.toLowerCase().includes(q)
      return nameMatch || stageNameMatch || skillMatch || roleMatch
    }

    return true
  })

  // Columns to display
  const activeStages = viewAllStages ? ALL_11_PIPELINE_STAGES : CORE_PIPELINE_STAGES

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const candidateId = event.active.id as string
    const found = candidates.find((c) => c.id === candidateId) || null
    setActiveCandidate(found)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Optional intermediate visual updates
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    if (!over) return

    const candidateId = active.id as string
    const targetId = over.id as string

    // Determine target stage
    let targetStage: PipelineStage | null = null

    // If dropped directly onto a column container
    if (ALL_11_PIPELINE_STAGES.includes(targetId as PipelineStage)) {
      targetStage = targetId as PipelineStage
    } else {
      // Dropped onto another candidate card inside that column
      const targetCandidate = candidates.find((c) => c.id === targetId)
      if (targetCandidate) {
        targetStage = targetCandidate.stage
      }
    }

    const currentCandidate = candidates.find((c) => c.id === candidateId)
    if (!currentCandidate || !targetStage || currentCandidate.stage === targetStage) {
      return
    }

    try {
      await moveCandidate({
        submissionId: candidateId,
        newStage: targetStage,
      })

      toast({
        title: "Stage Updated",
        description: `${currentCandidate.talent.full_name} moved to '${PIPELINE_STAGE_LABELS[targetStage]}'.`,
        type: "success",
      })
    } catch {
      toast({
        title: "Move Failed",
        description: "Could not update candidate stage.",
        type: "error",
      })
    }
  }

  // Submit to Client action handler
  const handleOpenSubmitModal = (candidate: PipelineCandidate) => {
    setCandidateForSubmit(candidate)
    setIsSubmitModalOpen(true)
  }

  const handlePerformSubmit = async (data: {
    submissionId: string
    clientId: string
    proposedFee: number
    currency: string
    agentPitchNote?: string
  }) => {
    await submitToClient(data)
    toast({
      title: "Candidate Submitted to Client",
      description: `${candidateForSubmit?.talent.full_name || "Talent"} submitted to Client Portal with proposed fee of ${data.currency} ${data.proposedFee.toLocaleString()}.`,
      type: "success",
    })
  }

  // View Comp Card action handler
  const handleViewCompCard = (candidate: PipelineCandidate) => {
    setActiveCompCardCandidate(candidate)
    setIsCompCardModalOpen(true)
  }

  // Remove candidate action handler
  const handleRemoveCandidate = async (id: string) => {
    try {
      await removeCandidate(id)
      setSelectedCandidateIds((prev) => prev.filter((item) => item !== id))
      toast({
        title: "Candidate Removed",
        description: "Candidate removed from this casting project pipeline.",
        type: "success",
      })
    } catch {
      toast({
        title: "Removal Failed",
        description: "Could not remove candidate.",
        type: "error",
      })
    }
  }

  // Toggle selection
  const handleToggleSelect = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    )
  }

  // Bulk actions
  const handleBulkMove = async (newStage: PipelineStage) => {
    if (selectedCandidateIds.length === 0) return
    try {
      await bulkMoveStage({
        submissionIds: selectedCandidateIds,
        newStage,
      })
      toast({
        title: "Bulk Move Completed",
        description: `Moved ${selectedCandidateIds.length} candidate(s) to '${PIPELINE_STAGE_LABELS[newStage]}'.`,
        type: "success",
      })
      setSelectedCandidateIds([])
    } catch {
      toast({
        title: "Bulk Move Failed",
        description: "Failed to move selected candidates.",
        type: "error",
      })
    }
  }

  return (
    <DashboardShell role="agency">
      <div className="space-y-4">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/agency/casting"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Casting Projects
          </Link>
        </div>

        {/* Project Header Banner */}
        <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-accent/20 p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  {project.title}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-brand-500/10 text-brand-300 border-brand-500/30 text-xs font-medium"
                >
                  {project.project_type || "Production"}
                </Badge>
                {project.client_name && (
                  <Link
                    href={`/agency/clients/${project.client_id || "c1-dawn-films"}`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 transition-colors"
                  >
                    <Building2 className="h-3 w-3" />
                    Client: {project.client_name}
                  </Link>
                )}
              </div>

              {/* Project Metadata Specs */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {project.shoot_dates && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span>Shoots: {project.shoot_dates}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <span>Location: {project.location}</span>
                  </div>
                )}
                {project.budget_range && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-medium text-foreground">{project.budget_range}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-400" />
                  <span>
                    {roles.length} Role{roles.length === 1 ? "" : "s"} • {candidates.length} Candidate
                    {candidates.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 shadow-xs"
                onClick={() => setIsAIMatchOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                AI Match Talent
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsCreateRoleModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                New Role
              </Button>

              <Button
                size="sm"
                className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium"
                onClick={() => setIsAddTalentModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Candidate
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar: Role Filter Tabs, Search, and View Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-xl border border-border/70 bg-card/60">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeRoleFilter === "all"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "bg-accent/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              All Roles ({candidates.length})
            </button>
            {roles.map((r) => {
              const count = candidates.filter((c) => c.casting_role_id === r.id).length
              const isActive = activeRoleFilter === r.id

              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-accent/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{r.role_name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search & Stages Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates or skills..."
                className="pl-8 h-8 text-xs bg-background/80"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className={`h-8 text-xs gap-1.5 shrink-0 ${
                viewAllStages ? "border-brand-500 bg-brand-500/10 text-brand-300" : ""
              }`}
              onClick={() => setViewAllStages(!viewAllStages)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {viewAllStages ? "7 Main Stages" : "All 11 Stages"}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Banner (appears when candidates are selected) */}
        {selectedCandidateIds.length > 0 && (
          <div className="p-3 rounded-xl border border-brand-500/30 bg-brand-500/10 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span>
                {selectedCandidateIds.length} candidate{selectedCandidateIds.length === 1 ? "" : "s"} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Move to:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkMove(e.target.value as PipelineStage)
                    e.target.value = ""
                  }
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Stage...</option>
                {ALL_11_PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {PIPELINE_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelectedCandidateIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Kanban Board Container */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
            {activeStages.map((stage) => {
              const stageCandidates = filteredCandidates.filter((c) => c.stage === stage)

              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  candidates={stageCandidates}
                  selectedCandidateIds={selectedCandidateIds}
                  onToggleSelect={handleToggleSelect}
                  onSubmitToClient={handleOpenSubmitModal}
                  onViewCompCard={handleViewCompCard}
                  onRemove={handleRemoveCandidate}
                  onAddCandidateClick={() => setIsAddTalentModalOpen(true)}
                  onRequestSelfTape={handleOpenRequestSelfTape}
                  onReviewSelfTape={handleOpenReviewSuite}
                  getSelfTapeForCandidate={(c) => getRequestForCandidate(id, c.talent_id)}
                />
              )
            })}
          </div>

          {/* Drag Overlay for smooth card movement representation */}
          <DragOverlay>
            {activeCandidate ? (
              <div className="w-[280px]">
                <PipelineCandidateCard
                  candidate={activeCandidate}
                  onSubmitToClient={() => {}}
                  onViewCompCard={() => {}}
                  onRemove={() => {}}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {candidateForSubmit && (
        <SubmitToClientModal
          candidate={candidateForSubmit}
          projectTitle={project.title}
          defaultClientId={project.client_id}
          isOpen={isSubmitModalOpen}
          onClose={() => {
            setIsSubmitModalOpen(false)
            setCandidateForSubmit(null)
          }}
          onSubmit={handlePerformSubmit}
        />
      )}

      <CreateRoleModal
        projectId={id}
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        onAddRole={async (roleData) => {
          const res = await addRole(roleData)
          toast({
            title: "Role Created",
            description: `Role '${roleData.role_name}' added to this casting project.`,
            type: "success",
          })
          return res
        }}
      />

      <AddTalentModal
        roles={roles}
        talentRoster={talentRoster}
        existingCandidateTalentIds={candidates.map((c) => c.talent_id)}
        isOpen={isAddTalentModalOpen}
        onClose={() => setIsAddTalentModalOpen(false)}
        onAddCandidate={async (data) => {
          const res = await addCandidate(data)
          toast({
            title: "Candidate Added",
            description: "Talent candidate added to pipeline board.",
            type: "success",
          })
          return res
        }}
      />

      <CompCardModal
        candidate={activeCompCardCandidate}
        isOpen={isCompCardModalOpen}
        onClose={() => {
          setIsCompCardModalOpen(false)
          setActiveCompCardCandidate(null)
        }}
        onSubmitToClient={handleOpenSubmitModal}
      />

      {candidateForSelfTape && (
        <RequestSelfTapeModal
          candidate={candidateForSelfTape}
          projectTitle={project.title}
          isOpen={isRequestSelfTapeModalOpen}
          onClose={() => {
            setIsRequestSelfTapeModalOpen(false)
            setCandidateForSelfTape(null)
          }}
          onRequestSelfTape={async (data) => {
            const res = await requestSelfTape(data)
            return res
          }}
        />
      )}

      {activeSelfTapeRequest && (
        <SelfTapeReviewSuite
          request={activeSelfTapeRequest}
          candidate={candidates.find((c) => c.talent_id === activeSelfTapeRequest.talent_id)}
          isOpen={isReviewSuiteOpen}
          onClose={() => {
            setIsReviewSuiteOpen(false)
            setActiveSelfTapeRequest(null)
          }}
          onAddComment={async (commentData) => {
            return await addReviewComment(commentData)
          }}
          onCandidateDecision={(decision) => {
            if (decision === "shortlist") {
              const targetCand = candidates.find((c) => c.talent_id === activeSelfTapeRequest.talent_id)
              if (targetCand && (targetCand.stage === "audition" || targetCand.stage === "shortlisted")) {
                moveCandidate({ submissionId: targetCand.id, newStage: "callback" })
              }
            }
          }}
        />
      )}

      {/* AI Talent Matchmaker Drawer */}
      <AITalentMatchDrawer
        isOpen={isAIMatchOpen}
        onClose={() => setIsAIMatchOpen(false)}
        castingCallId={id}
        projectTitle={project.title}
        initialBrief={`Role: ${project.title}. Location: ${project.location || 'Lahore'}. Budget: ${project.budget_range || 'PKR 350,000'}. Dates: ${project.shoot_dates || 'Upcoming'}.`}
        onAddCandidate={handleAIMatchAddCandidate}
        onRequestSelfTape={(match) => {
          setIsAIMatchOpen(false)
          const existing = candidates.find((c) => c.talent_id === match.talentId)
          if (existing) {
            handleOpenRequestSelfTape(existing)
          } else {
            addCandidate({
              talentId: match.talentId,
              roleId: roles[0]?.id || null,
              stage: "audition",
              proposedFee: 350000,
              currency: "PKR",
            }).then((newCand: any) => {
              if (newCand) handleOpenRequestSelfTape(newCand)
            })
          }
        }}
      />
    </DashboardShell>
  )
}
