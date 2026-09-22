"use client"

import { useState } from "react"
import { ScreeningStage, STAGE_CONFIG } from "@/lib/screening"
import { ApplicantDossierData } from "./CandidateDossierDrawer"
import { Button } from "@/components/ui/button"
import {
  Star,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ChevronDown,
  Layers,
  ArrowUpDown,
} from "lucide-react"

interface ScreeningTableViewProps {
  applicants: ApplicantDossierData[]
  onSelectApplicant: (applicant: ApplicantDossierData) => void
  onStageChange: (applicantId: string, stage: ScreeningStage) => void
  onBulkStageChange: (applicantIds: string[], stage: ScreeningStage) => void
}

export function ScreeningTableView({
  applicants,
  onSelectApplicant,
  onStageChange,
  onBulkStageChange,
}: ScreeningTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})

  const allSelected =
    applicants.length > 0 &&
    applicants.every((a) => selectedIds[a.id])

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds({})
    } else {
      const next: Record<string, boolean> = {}
      applicants.forEach((a) => {
        next[a.id] = true
      })
      setSelectedIds(next)
    }
  }

  const handleToggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleBulkAction = (stage: ScreeningStage) => {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (ids.length === 0) return
    onBulkStageChange(ids, stage)
    setSelectedIds({})
  }

  return (
    <div className="space-y-3">
      {/* Bulk Actions Floating Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-brand-500/10 border border-brand-500/25 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-foreground">
              candidates selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkAction("shortlisted")}
              className="h-8 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Bulk Shortlist
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("deferred")}
              className="h-8 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
            >
              Bulk Defer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("rejected")}
              className="h-8 text-xs font-semibold rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              Bulk Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds({})}
              className="h-8 text-xs text-muted-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="rounded border-border/60 text-brand-500 focus:ring-brand-500/20"
                  />
                </th>
                <th className="py-3 px-4 font-bold">Candidate</th>
                <th className="py-3 px-4 font-bold">Casting Call</th>
                <th className="py-3 px-4 font-bold">Location & Exp</th>
                <th className="py-3 px-4 font-bold">Applied Date</th>
                <th className="py-3 px-4 font-bold">Rating</th>
                <th className="py-3 px-4 font-bold">Stage</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {applicants.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              ) : (
                applicants.map((applicant) => {
                  const talent = applicant.talent_profile
                  const displayName = talent.stage_name || talent.full_name
                  const primaryPhoto =
                    applicant.media_assets.find((m) => m.is_primary && m.type === "photo")?.url ||
                    applicant.media_assets.find((m) => m.type === "photo")?.url ||
                    null
                  const rating = applicant.screening.rating || 0
                  const isChecked = !!selectedIds[applicant.id]
                  const stageConfig = STAGE_CONFIG[applicant.effectiveStage] || STAGE_CONFIG.applied

                  return (
                    <tr
                      key={applicant.id}
                      onClick={() => onSelectApplicant(applicant)}
                      className={`hover:bg-muted/40 transition-colors cursor-pointer group ${
                        isChecked ? "bg-brand-500/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4"
                        onClick={(e) => handleToggleOne(applicant.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-border/60 text-brand-500 focus:ring-brand-500/20 cursor-pointer"
                        />
                      </td>

                      {/* Candidate Headshot + Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
                            {primaryPhoto ? (
                              <img
                                src={primaryPhoto}
                                alt={displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-bold text-muted-foreground text-xs">
                                {displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-foreground group-hover:text-brand-500 transition-colors block">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {talent.category_name || "Talent"}
                              {talent.sub_category_name ? ` • ${talent.sub_category_name}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground truncate max-w-[200px] block" title={applicant.casting_call.title}>
                          {applicant.casting_call.title}
                        </span>
                      </td>

                      {/* Location & Exp */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>
                          <span>{talent.city || "—"}</span>
                          {typeof talent.experience_years === "number" && (
                            <span className="block text-[10px]">
                              {talent.experience_years} yrs exp
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(applicant.applied_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        {rating > 0 ? (
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{rating}.0</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Stage Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stageConfig.badgeColor}`}
                        >
                          {stageConfig.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectApplicant(applicant)}
                            className="h-8 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 rounded-lg px-2.5"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Dossier
                          </Button>

                          {/* Quick Stage Dropdown */}
                          <select
                            value={applicant.effectiveStage}
                            onChange={(e) =>
                              onStageChange(
                                applicant.id,
                                e.target.value as ScreeningStage
                              )
                            }
                            className="h-8 px-2 rounded-lg border border-border/60 bg-background text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="deferred">Deferred / Maybe</option>
                            <option value="audition">Interview / Audition</option>
                            <option value="selected">Hired / Selected</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
