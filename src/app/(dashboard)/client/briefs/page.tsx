"use client"

import { useState } from "react"
import Link from "next/link"
import { useClientPortal } from "@/hooks/useClientPortal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClientBrief, ClientBriefStatus } from "@/types/client-portal"
import {
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  DollarSign,
  ChevronRight,
  FileText,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react"

const STATUS_CONFIG: Record<
  ClientBriefStatus,
  { label: string; badgeClass: string; icon: any }
> = {
  submitted: {
    label: "Submitted",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  under_review: {
    label: "Under Agency Review",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  converted: {
    label: "Converted to Project",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  declined: {
    label: "Declined",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: X,
  },
}

export default function ClientBriefsPage() {
  const { briefs, clientInfo } = useClientPortal()
  const [selectedBrief, setSelectedBrief] = useState<ClientBrief | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-xs font-semibold"
            >
              Intake History
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mt-1">
            My Casting Briefs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track external brief intake, character breakdowns, and agency review statuses.
          </p>
        </div>

        <Link href="/client/briefs/new">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-2 font-medium shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Submit New Brief</span>
          </Button>
        </Link>
      </div>

      {/* Briefs List */}
      {briefs.length === 0 ? (
        <Card className="rounded-2xl border-border/60 bg-card/40 p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No Briefs Submitted Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Submit your first casting brief to begin receiving curated talent options from the agency.
            </p>
          </div>
          <Link href="/client/briefs/new">
            <Button className="bg-brand-600 text-white rounded-xl gap-2 text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Create First Brief</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => {
            const statusConfig = STATUS_CONFIG[brief.status] || STATUS_CONFIG.submitted
            const StatusIcon = statusConfig.icon

            return (
              <Card
                key={brief.id}
                className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xs p-6 hover:border-brand-500/40 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`${statusConfig.badgeClass} text-xs font-semibold gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Submitted on {new Date(brief.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-foreground">
                    {brief.project_title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {brief.raw_brief_text}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-1">
                    {brief.location && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3 text-brand-500" />
                        {brief.location}
                      </span>
                    )}
                    {brief.shoot_dates && (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3 text-brand-500" />
                        {brief.shoot_dates}
                      </span>
                    )}
                    {brief.budget_range && (
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        {brief.budget_range}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Button
                    onClick={() => setSelectedBrief(brief)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/70 text-xs font-medium gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Full Brief</span>
                  </Button>

                  {brief.status === "converted" && (
                    <Link href="/client/projects">
                      <Button
                        size="sm"
                        className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium gap-1.5 shadow-xs"
                      >
                        <span>View Project</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Brief Details Modal */}
      {selectedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-2xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className={`${STATUS_CONFIG[selectedBrief.status].badgeClass} text-xs font-semibold`}
                >
                  {STATUS_CONFIG[selectedBrief.status].label}
                </Badge>
                <h3 className="text-xl font-heading font-bold text-foreground">
                  {selectedBrief.project_title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedBrief(null)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Gender Preference
                </span>
                <span className="font-semibold text-foreground capitalize mt-0.5 block">
                  {selectedBrief.gender_preference || "Open"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Age Range
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedBrief.age_range_min || selectedBrief.age_range_max
                    ? `${selectedBrief.age_range_min || 0} - ${selectedBrief.age_range_max || "Open"} yrs`
                    : "Open"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Budget
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedBrief.budget_range || "Negotiable"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Shoot Window
                </span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedBrief.shoot_dates || "TBD"}
                </span>
              </div>
            </div>

            {/* Full Brief Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Creative Brief & Character Requirements
              </h4>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {selectedBrief.raw_brief_text}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                onClick={() => setSelectedBrief(null)}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
