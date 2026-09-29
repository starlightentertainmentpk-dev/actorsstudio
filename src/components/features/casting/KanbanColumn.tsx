"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { PipelineCandidate, PipelineStage, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from "@/types/pipeline"
import { SelfTapeRequest } from "@/types/self-tape"
import { PipelineCandidateCard } from "./PipelineCandidateCard"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface KanbanColumnProps {
  stage: PipelineStage
  candidates: PipelineCandidate[]
  selectedCandidateIds: string[]
  onToggleSelect: (id: string) => void
  onSubmitToClient: (candidate: PipelineCandidate) => void
  onViewCompCard: (candidate: PipelineCandidate) => void
  onRemove: (id: string) => void
  onAddCandidateClick?: (stage: PipelineStage) => void
  onRequestSelfTape?: (candidate: PipelineCandidate) => void
  onReviewSelfTape?: (candidate: PipelineCandidate) => void
  getSelfTapeForCandidate?: (candidate: PipelineCandidate) => SelfTapeRequest | null | undefined
}

export function KanbanColumn({
  stage,
  candidates,
  selectedCandidateIds,
  onToggleSelect,
  onSubmitToClient,
  onViewCompCard,
  onRemove,
  onAddCandidateClick,
  onRequestSelfTape,
  onReviewSelfTape,
  getSelfTapeForCandidate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: "column",
      stage,
    },
  })

  const label = PIPELINE_STAGE_LABELS[stage] || stage
  const color = PIPELINE_STAGE_COLORS[stage] || {
    bg: "bg-muted",
    text: "text-foreground",
    border: "border-border",
  }

  const candidateIds = candidates.map((c) => c.id)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xs transition-colors w-[290px] shrink-0 max-h-[calc(100vh-210px)] select-none ${
        isOver
          ? "border-primary/80 ring-2 ring-primary/20 bg-primary/5"
          : "border-border/70"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.bg.replace("/10", "")} ring-1 ring-border`} />
          <h3 className="text-xs font-bold text-foreground truncate">
            {label}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}
          >
            {candidates.length}
          </span>
          {onAddCandidateClick && (
            <button
              onClick={() => onAddCandidateClick(stage)}
              className="h-6 w-6 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title={`Add candidate to ${label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate List / Sortable Context */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[160px]">
        <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
          {candidates.map((candidate) => (
            <PipelineCandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selectedCandidateIds.includes(candidate.id)}
              onToggleSelect={onToggleSelect}
              onSubmitToClient={onSubmitToClient}
              onViewCompCard={onViewCompCard}
              onRemove={onRemove}
              onRequestSelfTape={onRequestSelfTape}
              onReviewSelfTape={onReviewSelfTape}
              selfTapeRequest={getSelfTapeForCandidate ? getSelfTapeForCandidate(candidate) : null}
            />
          ))}
        </SortableContext>

        {candidates.length === 0 && (
          <div
            className={`h-28 border border-dashed rounded-xl flex flex-col items-center justify-center p-3 text-center transition-colors ${
              isOver
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-accent/20 text-muted-foreground/70"
            }`}
          >
            <p className="text-[11px] font-medium">Drop candidates here</p>
            <p className="text-[9px] mt-0.5 opacity-80">Drag from any stage to move</p>
          </div>
        )}
      </div>
    </div>
  )
}
