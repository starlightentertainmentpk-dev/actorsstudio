"use client"

import React, { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PipelineCandidate } from "@/types/pipeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  GripVertical,
  CheckCircle2,
  Calendar,
  XCircle,
  Clock,
  MessageSquare,
  Send,
  MoreVertical,
  Eye,
  Trash2,
  MapPin,
  Sparkles,
  Phone,
  Video,
  Film,
} from "lucide-react"
import { SelfTapeRequest } from "@/types/self-tape"

interface PipelineCandidateCardProps {
  candidate: PipelineCandidate
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  onSubmitToClient: (candidate: PipelineCandidate) => void
  onViewCompCard: (candidate: PipelineCandidate) => void
  onRemove: (id: string) => void
  onMoveToStage?: (id: string, newStage: string) => void
  onRequestSelfTape?: (candidate: PipelineCandidate) => void
  onReviewSelfTape?: (candidate: PipelineCandidate) => void
  selfTapeRequest?: SelfTapeRequest | null
  isOverlay?: boolean
}

export function PipelineCandidateCard({
  candidate,
  isSelected = false,
  onToggleSelect,
  onSubmitToClient,
  onViewCompCard,
  onRemove,
  onMoveToStage,
  onRequestSelfTape,
  onReviewSelfTape,
  selfTapeRequest,
  isOverlay = false,
}: PipelineCandidateCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id,
    data: {
      candidate,
      stage: candidate.stage,
    },
    disabled: isOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const { talent, role } = candidate

  // Client decision indicators
  const renderClientDecision = () => {
    if (!candidate.client_decision || candidate.client_decision === "pending") {
      if (candidate.client_id || candidate.stage === "submitted" || candidate.stage === "client_review") {
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
            title="Awaiting client review"
          >
            <Clock className="h-2.5 w-2.5" />
            Client Reviewing
          </span>
        )
      }
      return null
    }

    if (candidate.client_decision === "shortlist") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (candidate.client_feedback) setShowFeedbackModal(true)
          }}
          title={candidate.client_feedback || "Client Shortlisted"}
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          Client Approved
          {candidate.client_feedback && <MessageSquare className="h-2.5 w-2.5 ml-0.5 text-emerald-300" />}
        </span>
      )
    }

    if (candidate.client_decision === "audition_request") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            if (candidate.client_feedback) setShowFeedbackModal(true)
          }}
          title={candidate.client_feedback || "Audition Requested"}
        >
          <Calendar className="h-2.5 w-2.5" />
          Audition Req
          {candidate.client_feedback && <MessageSquare className="h-2.5 w-2.5 ml-0.5 text-purple-300" />}
        </span>
      )
    }

    if (candidate.client_decision === "reject") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20"
          title={candidate.client_feedback || "Client Declined"}
        >
          <XCircle className="h-2.5 w-2.5" />
          Declined
        </span>
      )
    }

    return null
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-xl border bg-card/90 hover:bg-card p-3 shadow-xs hover:shadow-md transition-all select-none ${
          isDragging
            ? "border-primary shadow-lg ring-2 ring-primary/20 cursor-grabbing"
            : "border-border/70 hover:border-border"
        } ${isSelected ? "ring-2 ring-brand-500 border-brand-500 bg-brand-500/5" : ""}`}
      >
        {/* Top bar with drag handle and checkbox */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(candidate.id)}
                className="h-3.5 w-3.5 rounded border-border text-brand-500 focus:ring-brand-500/20 bg-background/80 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              {...attributes}
              {...listeners}
              className="touch-none p-1 -ml-1 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing rounded transition-colors"
              title="Drag candidate to another stage"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Availability status dot */}
            <span
              className={`h-2 w-2 rounded-full ring-2 ring-background ${
                talent.is_available ? "bg-emerald-500" : "bg-amber-500"
              }`}
              title={talent.is_available ? "Available" : "On Hold / Limited"}
            />

            {/* Quick action menu button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-7 z-50 w-44 rounded-lg border border-border/80 bg-popover p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left text-foreground"
                      onClick={() => {
                        setShowMenu(false)
                        onSubmitToClient(candidate)
                      }}
                    >
                      <Send className="h-3.5 w-3.5 text-indigo-400" />
                      Submit to Client
                    </button>
                    {selfTapeRequest?.submission ? (
                      <button
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-purple-500/10 text-left text-purple-300 hover:text-purple-200"
                        onClick={() => {
                          setShowMenu(false)
                          onReviewSelfTape?.(candidate)
                        }}
                      >
                        <Film className="h-3.5 w-3.5 text-purple-400" />
                        Review Self-Tape
                      </button>
                    ) : null}
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left text-foreground"
                      onClick={() => {
                        setShowMenu(false)
                        onRequestSelfTape?.(candidate)
                      }}
                    >
                      <Video className="h-3.5 w-3.5 text-purple-400" />
                      Request Self-Tape
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left text-foreground"
                      onClick={() => {
                        setShowMenu(false)
                        onViewCompCard(candidate)
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 text-sky-400" />
                      View Comp Card
                    </button>
                    {candidate.talent.showreel_url && (
                      <a
                        href={candidate.talent.showreel_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left text-foreground"
                        onClick={() => setShowMenu(false)}
                      >
                        <Video className="h-3.5 w-3.5 text-purple-400" />
                        Watch Showreel
                      </a>
                    )}
                    <div className="h-px bg-border/60 my-1" />
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-destructive/15 text-left text-destructive"
                      onClick={() => {
                        setShowMenu(false)
                        onRemove(candidate.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove from Board
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Talent Details & Avatar */}
        <div
          className="flex items-start gap-2.5 cursor-pointer"
          onClick={() => onViewCompCard(candidate)}
        >
          <div className="relative shrink-0">
            {talent.avatar_url ? (
              <img
                src={talent.avatar_url}
                alt={talent.full_name}
                className="h-11 w-11 rounded-lg object-cover border border-border/80 shadow-xs"
              />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {talent.full_name.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-1">
              <h4 className="text-xs font-semibold text-foreground truncate hover:text-brand-400 transition-colors">
                {talent.stage_name || talent.full_name}
              </h4>
            </div>

            {/* Role Badge */}
            {role ? (
              <div className="mt-0.5">
                <span className="inline-block text-[10px] font-medium text-brand-300 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20 truncate max-w-[170px]">
                  {role.role_name}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground italic">General pool</span>
            )}

            {/* City & Physical stats */}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              {talent.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {talent.city}
                </span>
              )}
              {talent.height_cm && <span>{talent.height_cm} cm</span>}
            </div>
          </div>
        </div>

        {/* Pitch Note snippet if exists */}
        {candidate.agent_pitch_note && (
          <div className="mt-2 text-[10px] text-muted-foreground/90 line-clamp-1 italic bg-background/50 px-1.5 py-0.5 rounded border border-border/40">
            &ldquo;{candidate.agent_pitch_note}&rdquo;
          </div>
        )}

        {/* Self-Tape Status Indicator Pill */}
        {selfTapeRequest && (
          <div className="mt-2 text-[10px]">
            {selfTapeRequest.submission ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReviewSelfTape?.(candidate)
                }}
                className="w-full inline-flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors group/tape"
                title="Click to launch interactive Video Review Suite"
              >
                <span className="flex items-center gap-1 font-semibold truncate">
                  <Film className="h-3 w-3 text-purple-400 shrink-0" />
                  Self-Tape: Submitted
                </span>
                <span className="text-[9px] underline font-mono text-purple-400 group-hover/tape:text-purple-200 shrink-0">
                  Review Tape →
                </span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-full justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-amber-400" />
                  Tape Requested
                </span>
                <span className="text-[9px] font-mono text-amber-400/80">Pending</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: Proposed Fee & Client Decision Status */}
        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-1 text-[10px]">
          {/* Proposed Fee Badge */}
          {candidate.proposed_fee ? (
            <span className="font-mono font-medium text-foreground bg-accent/70 px-1.5 py-0.5 rounded border border-border/60">
              {candidate.currency} {candidate.proposed_fee.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-[9px]">Fee unset</span>
          )}

          {/* Client Decision Indicator */}
          {renderClientDecision()}
        </div>
      </div>

      {/* Client Feedback Preview Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-brand-400" />
                Client Feedback — {talent.full_name}
              </div>
              <button
                className="text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setShowFeedbackModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-3 rounded-lg bg-accent/40 border border-border/60 text-xs text-foreground/90 italic">
              &ldquo;{candidate.client_feedback}&rdquo;
            </div>
            {candidate.client_reviewed_at && (
              <p className="text-[10px] text-muted-foreground">
                Reviewed on {new Date(candidate.client_reviewed_at).toLocaleDateString()}
              </p>
            )}
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowFeedbackModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
