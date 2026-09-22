"use client"

import {
  ScreeningStage,
  STAGE_CONFIG,
} from "@/lib/screening"
import { ApplicantDossierData } from "./CandidateDossierDrawer"
import {
  Star,
  Clock,
  MapPin,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"

interface ScreeningKanbanBoardProps {
  applicants: ApplicantDossierData[]
  onSelectApplicant: (applicant: ApplicantDossierData) => void
  onQuickMove: (applicantId: string, stage: ScreeningStage) => void
}

const STAGES: ScreeningStage[] = [
  "applied",
  "shortlisted",
  "deferred",
  "audition",
  "selected",
  "rejected",
]

export function ScreeningKanbanBoard({
  applicants,
  onSelectApplicant,
  onQuickMove,
}: ScreeningKanbanBoardProps) {
  // Group applicants by effective stage
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = applicants.filter((a) => a.effectiveStage === stage)
    return acc
  }, {} as Record<ScreeningStage, ApplicantDossierData[]>)

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[580px]">
      {STAGES.map((stage) => {
        const config = STAGE_CONFIG[stage]
        const stageApplicants = grouped[stage] || []

        return (
          <div
            key={stage}
            className="flex flex-col w-72 sm:w-80 shrink-0 bg-muted/20 border border-border/50 rounded-2xl p-3.5 shadow-xs"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${config.columnHeaderColor}`}
                />
                <h3 className="text-xs font-bold text-foreground">
                  {config.label}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card border border-border/60 text-muted-foreground">
                {stageApplicants.length}
              </span>
            </div>

            {/* Candidates Cards Column */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {stageApplicants.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 text-muted-foreground/60 text-xs p-4 text-center">
                  <span>No candidates</span>
                </div>
              ) : (
                stageApplicants.map((applicant) => {
                  const talent = applicant.talent_profile
                  const displayName = talent.stage_name || talent.full_name
                  const primaryPhoto =
                    applicant.media_assets.find((m) => m.is_primary && m.type === "photo")?.url ||
                    applicant.media_assets.find((m) => m.type === "photo")?.url ||
                    null
                  const rating = applicant.screening.rating || 0

                  return (
                    <div
                      key={applicant.id}
                      onClick={() => onSelectApplicant(applicant)}
                      className={`group relative p-3.5 bg-card hover:bg-muted/40 border rounded-xl shadow-xs transition-all duration-150 cursor-pointer hover:border-brand-500/40 hover:shadow-md ${config.cardBorder}`}
                    >
                      {/* Top Row: Headshot + Info */}
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0 shadow-xs">
                          {primaryPhoto ? (
                            <img
                              src={primaryPhoto}
                              alt={displayName}
                              className="h-full w-full object-cover object-center"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {displayName.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate group-hover:text-brand-500 transition-colors">
                            {displayName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {talent.category_name || "Talent"}
                          </p>

                          {/* Star Rating Badge */}
                          {rating > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{rating}.0</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Job Title Tag (if multiple jobs viewed) */}
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[170px]" title={applicant.casting_call.title}>
                          {applicant.casting_call.title}
                        </span>
                        {talent.city && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            <MapPin className="h-2.5 w-2.5" />
                            {talent.city}
                          </span>
                        )}
                      </div>

                      {/* Hover Action Strip */}
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/30 opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Dossier
                        </span>

                        {/* Quick Action Button based on current stage */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {stage === "applied" && (
                            <button
                              onClick={() => onQuickMove(applicant.id, "shortlisted")}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold transition-colors"
                              title="Quick Shortlist"
                            >
                              Shortlist
                            </button>
                          )}
                          {stage === "shortlisted" && (
                            <button
                              onClick={() => onQuickMove(applicant.id, "audition")}
                              className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold transition-colors"
                              title="Interview"
                            >
                              Interview
                            </button>
                          )}
                          {stage !== "deferred" && stage !== "selected" && stage !== "rejected" && (
                            <button
                              onClick={() => onQuickMove(applicant.id, "deferred")}
                              className="px-1.5 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition-colors"
                              title="Defer / Maybe"
                            >
                              Defer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
