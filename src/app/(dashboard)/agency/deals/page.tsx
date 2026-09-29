"use client"

import React, { useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { useDeals } from "@/hooks/useDeals"
import { CreateDealModal } from "@/components/features/deals/CreateDealModal"
import { CreateBookingModal } from "@/components/features/deals/CreateBookingModal"
import { CreateHoldModal } from "@/components/features/deals/CreateHoldModal"
import { Deal, DealStatus, DEAL_STATUS_LABELS, DEAL_STATUS_COLORS } from "@/types/deals"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Handshake,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  ArrowUpRight,
  Bookmark,
  FileText,
  Percent,
} from "lucide-react"

// Core Pipeline Stages for Deal Flow
const KANBAN_STAGES: DealStatus[] = [
  "proposal",
  "negotiation",
  "approved",
  "contract",
  "booked",
  "invoiced",
  "paid",
]

const STAGE_ORDER: Record<DealStatus, number> = {
  lead: 0,
  proposal: 1,
  negotiation: 2,
  approved: 3,
  contract: 4,
  booked: 5,
  completed: 6,
  invoiced: 7,
  paid: 8,
  cancelled: -1,
}

export default function AgencyDealsPage() {
  const { toast } = useToast()
  const {
    deals,
    totalPipelineValue,
    projectedCommission,
    closedDealsThisMonth,
    activeHoldsCount,
    updateDealStatus,
    isUpdatingStatus,
  } = useDeals()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "booked" | "paid">("all")

  // Modals state
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false)
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false)
  const [isCreateHoldOpen, setIsCreateHoldOpen] = useState(false)
  const [selectedDealForBooking, setSelectedDealForBooking] = useState<Deal | null>(null)

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal.talent_name && deal.talent_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (deal.client_name && deal.client_name.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (selectedFilter === "active") {
      return (
        deal.status === "proposal" ||
        deal.status === "negotiation" ||
        deal.status === "approved" ||
        deal.status === "contract"
      )
    }
    if (selectedFilter === "booked") {
      return deal.status === "booked" || deal.status === "completed"
    }
    if (selectedFilter === "paid") {
      return deal.status === "invoiced" || deal.status === "paid"
    }

    return true
  })

  const getNextStage = (current: DealStatus): DealStatus | null => {
    const idx = KANBAN_STAGES.indexOf(current)
    if (idx !== -1 && idx < KANBAN_STAGES.length - 1) {
      return KANBAN_STAGES[idx + 1]
    }
    return null
  }

  const handleAdvanceStage = async (deal: Deal) => {
    const next = getNextStage(deal.status)
    if (!next) return

    try {
      await updateDealStatus({ dealId: deal.id, status: next })
      toast({
        title: "Deal Advanced",
        description: `'${deal.deal_name}' moved to ${DEAL_STATUS_LABELS[next]}.`,
        type: "success",
      })
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, type: "error" })
    }
  }

  const handleOpenBookingModalForDeal = (deal: Deal) => {
    setSelectedDealForBooking(deal)
    setIsCreateBookingOpen(true)
  }

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Handshake className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Commercial Deal Pipeline
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Track talent contracts, agency commission payouts, and verified shoot bookings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/agency/holds">
              <Button variant="outline" size="sm" className="text-xs h-9">
                <Bookmark className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Hold Priority ({activeHoldsCount})
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDealForBooking(null)
                setIsCreateBookingOpen(true)
              }}
              className="text-xs h-9"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
              Confirm Booking
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateDealOpen(true)}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Commercial Deal
            </Button>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Pipeline Value</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">
              PKR {totalPipelineValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{deals.length} active deal agreements</span>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Projected Commission</span>
              <Percent className="h-4 w-4 text-brand-400" />
            </div>
            <div className="text-xl font-bold text-brand-400 font-mono">
              PKR {projectedCommission.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Avg. ~{(totalPipelineValue ? Math.round((projectedCommission / totalPipelineValue) * 100) : 20)}% agency cut
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Closed & Booked</span>
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">
              {closedDealsThisMonth} <span className="text-xs font-normal text-muted-foreground">Deals</span>
            </div>
            <div className="text-[11px] text-purple-400 font-medium">
              Confirmed shoots & invoiced runs
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Talent Holds Active</span>
              <Bookmark className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">
              {activeHoldsCount} <span className="text-xs font-normal text-muted-foreground">Holds</span>
            </div>
            <Link
              href="/agency/holds"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>Manage 1st & 2nd Hold Queues</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-2 rounded-xl border border-border/60">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, clients, or talent..."
              className="pl-8 text-xs h-8 bg-card"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Deals" },
              { id: "active", label: "Active Pipeline" },
              { id: "booked", label: "Booked & Wrapped" },
              { id: "paid", label: "Invoiced & Paid" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedFilter === tab.id
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x">
          {KANBAN_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.status === stage)
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.deal_value, 0)
            const stageCommission = stageDeals.reduce((sum, d) => sum + d.agency_commission_amount, 0)

            return (
              <div
                key={stage}
                className="w-80 shrink-0 flex flex-col rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs overflow-hidden snap-start"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-border/60 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground">
                        {DEAL_STATUS_LABELS[stage]}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-mono">
                        {stageDeals.length}
                      </Badge>
                    </div>

                    <span className="text-[11px] font-mono font-semibold text-foreground/80">
                      PKR {(stageTotal / 1000).toFixed(0)}k
                    </span>
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>Comm: PKR {(stageCommission / 1000).toFixed(0)}k</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
                      {stage}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[420px] max-h-[calc(100vh-320px)]">
                  {stageDeals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-44 rounded-xl border border-dashed border-border/60 text-center p-4">
                      <p className="text-[11px] text-muted-foreground">No deals in {DEAL_STATUS_LABELS[stage]}</p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const nextStage = getNextStage(deal.status)

                      return (
                        <div
                          key={deal.id}
                          className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 hover:border-brand-500/50 hover:shadow-md transition-all group"
                        >
                          {/* Top: Deal Title & Client */}
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-xs text-foreground group-hover:text-brand-400 transition-colors leading-snug">
                                {deal.deal_name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                              <Building2 className="h-3 w-3 text-brand-400/80 shrink-0" />
                              <span className="truncate">{deal.client_name || "Client"}</span>
                            </div>
                          </div>

                          {/* Talent Bio Pill */}
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 border border-border/50">
                            {deal.talent_avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={deal.talent_avatar}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center text-[10px] font-bold">
                                {deal.talent_name?.substring(0, 1) || "T"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-foreground truncate">
                                {deal.talent_name}
                              </p>
                            </div>
                          </div>

                          {/* Financials Box */}
                          <div className="p-2 rounded-lg bg-black/40 border border-border/60 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">Deal Value:</span>
                              <span className="font-bold text-foreground font-mono">
                                PKR {deal.deal_value.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-emerald-400">
                                Agency Cut ({deal.agency_commission_rate || 20}%):
                              </span>
                              <span className="font-mono text-emerald-400">
                                PKR {deal.agency_commission_amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] border-t border-border/40 pt-1 text-muted-foreground">
                              <span>Talent Net Payout:</span>
                              <span className="font-mono font-semibold text-foreground/90">
                                PKR {deal.talent_payout_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Dates */}
                          {deal.start_date && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3 text-purple-400 shrink-0" />
                              <span>
                                {deal.start_date} {deal.end_date ? `→ ${deal.end_date}` : ""}
                              </span>
                            </div>
                          )}

                          {/* Card Action Footer */}
                          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/50">
                            {/* If approved/contract, offer booking button */}
                            {(deal.status === "approved" || deal.status === "contract") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenBookingModalForDeal(deal)}
                                className="h-7 text-[10px] px-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Shoot Booking
                              </Button>
                            )}

                            {nextStage ? (
                              <Button
                                size="sm"
                                onClick={() => handleAdvanceStage(deal)}
                                disabled={isUpdatingStatus}
                                className="h-7 text-[10px] ml-auto bg-brand-600 hover:bg-brand-500 text-white font-medium px-2.5"
                              >
                                <span>{DEAL_STATUS_LABELS[nextStage].split(" ")[0]}</span>
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 ml-auto">
                                ✓ Complete
                              </Badge>
                            )}
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

        {/* Modals */}
        <CreateDealModal
          isOpen={isCreateDealOpen}
          onClose={() => setIsCreateDealOpen(false)}
        />

        <CreateBookingModal
          isOpen={isCreateBookingOpen}
          onClose={() => {
            setIsCreateBookingOpen(false)
            setSelectedDealForBooking(null)
          }}
          initialDealId={selectedDealForBooking?.id}
          initialTalentId={selectedDealForBooking?.talent_id}
          initialClientId={selectedDealForBooking?.client_id}
          initialProjectName={selectedDealForBooking?.deal_name}
          initialFee={selectedDealForBooking?.deal_value}
          onConvertToHold={(holdData) => {
            setIsCreateHoldOpen(true)
          }}
        />

        <CreateHoldModal
          isOpen={isCreateHoldOpen}
          onClose={() => setIsCreateHoldOpen(false)}
        />
      </div>
    </DashboardShell>
  )
}
