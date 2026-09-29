"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { useDeals } from "@/hooks/useDeals"
import { CreateHoldModal } from "@/components/features/deals/CreateHoldModal"
import { CreateBookingModal } from "@/components/features/deals/CreateBookingModal"
import { Hold, HoldStatus, HOLD_STATUS_LABELS, HOLD_STATUS_COLORS } from "@/types/deals"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Bookmark,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building2,
  User,
  Search,
  Timer,
  Zap,
  Flame,
  ArrowLeft,
  Layers,
  Sparkles,
  Info,
} from "lucide-react"

export default function AgencyHoldsPage() {
  const { toast } = useToast()
  const {
    holds,
    talentRoster,
    challengeHold,
    isChallengingHold,
    releaseHold,
    isReleasingHold,
    confirmHold,
    isConfirmingHold,
  } = useDeals()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "1st" | "2nd" | "challenged" | "released">("all")
  const [selectedTalentFilter, setSelectedTalentFilter] = useState<string>("all")

  // Modals state
  const [isCreateHoldOpen, setIsCreateHoldOpen] = useState(false)
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false)
  const [selectedHoldForBooking, setSelectedHoldForBooking] = useState<Hold | null>(null)

  // Metrics
  const firstHolds = holds.filter((h) => h.priority_level === 1 && (h.status === "active" || h.status === "challenged"))
  const secondHolds = holds.filter((h) => h.priority_level === 2 && (h.status === "active" || h.status === "challenged"))
  const challengedHolds = holds.filter((h) => h.status === "challenged")
  const resolvedHolds = holds.filter((h) => h.status === "confirmed" || h.status === "released")

  // Filtered holds
  const filteredHolds = useMemo(() => {
    return holds.filter((h) => {
      const matchesSearch =
        h.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.talent_name && h.talent_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.client_name && h.client_name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      if (selectedTalentFilter !== "all" && h.talent_id !== selectedTalentFilter) {
        return false
      }

      if (selectedFilter === "1st") return h.priority_level === 1 && (h.status === "active" || h.status === "challenged")
      if (selectedFilter === "2nd") return h.priority_level >= 2 && (h.status === "active" || h.status === "challenged")
      if (selectedFilter === "challenged") return h.status === "challenged"
      if (selectedFilter === "released") return h.status === "released" || h.status === "confirmed"

      return true
    })
  }, [holds, searchQuery, selectedFilter, selectedTalentFilter])

  // Helper for challenge expiration display
  const getRemainingHours = (expiresAt?: string | null): number => {
    if (!expiresAt) return 24
    const diffMs = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)))
  }

  // Handle 24-Hour Challenge issuance
  const handleIssueChallenge = async (hold: Hold) => {
    try {
      await challengeHold(hold.id)
      toast({
        title: "24-Hour Challenge Issued!",
        description: `Official 24h challenge initiated for '${hold.project_title}'. 1st hold holder notified to confirm or release.`,
        type: "success",
      })
    } catch (err: any) {
      toast({ title: "Challenge Failed", description: err.message, type: "error" })
    }
  }

  // Handle Hold Confirmation
  const handleConfirmHold = async (hold: Hold) => {
    try {
      await confirmHold(hold)
      toast({
        title: "Hold Confirmed to Booking",
        description: `'${hold.project_title}' has been locked as a confirmed shoot booking.`,
        type: "success",
      })
    } catch (err: any) {
      toast({ title: "Confirmation Failed", description: err.message, type: "error" })
    }
  }

  // Handle Hold Release
  const handleReleaseHold = async (hold: Hold) => {
    try {
      await releaseHold({ holdId: hold.id, reason: "Released by Agency/Client request" })
      toast({
        title: "Hold Released",
        description: `Talent dates released for '${hold.project_title}'. Next hold in queue automatically promoted.`,
        type: "info",
      })
    } catch (err: any) {
      toast({ title: "Release Failed", description: err.message, type: "error" })
    }
  }

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        {/* Header & Quick Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Bookmark className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Talent Hold Priority Engine
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Industry-standard 1st & 2nd hold management, 24-hour challenge rule, and date conflict prevention
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/agency/deals">
              <Button variant="outline" size="sm" className="text-xs h-9">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Commercial Deals
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedHoldForBooking(null)
                setIsCreateBookingOpen(true)
              }}
              className="text-xs h-9"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
              Confirm Shoot Booking
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateHoldOpen(true)}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Place Talent on Hold
            </Button>
          </div>
        </div>

        {/* Priority Engine KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active 1st Holds</span>
              <Bookmark className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {firstHolds.length}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Primary reservation rights locked
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active 2nd Holds</span>
              <Layers className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {secondHolds.length}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Queue backups eligible to challenge
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Challenged Holds</span>
              <Timer className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 font-mono flex items-center gap-2">
              {challengedHolds.length}
              {challengedHolds.length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
              )}
            </div>
            <div className="text-[11px] text-rose-400/90 font-medium">
              24-hour resolution window active
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Resolved & Confirmed</span>
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-foreground font-mono">
              {resolvedHolds.length}
            </div>
            <div className="text-[11px] text-purple-400 font-medium">
              Shoot bookings confirmed or released
            </div>
          </div>
        </div>

        {/* 24-Hour Challenge Urgent Alert Banner */}
        {challengedHolds.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-card to-rose-950/20 p-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Flame className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-rose-300">
                      Active 24-Hour Hold Challenge in Progress
                    </h3>
                    <Badge variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]">
                      Immediate Action Required
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                    In accordance with advertising industry rules, a 2nd hold holder has issued a formal challenge. The 1st hold client must immediately contract and confirm the booking or release the dates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {challengedHolds.map((ch) => {
                const hoursLeft = getRemainingHours(ch.challenge_expires_at)
                return (
                  <div
                    key={ch.id}
                    className="p-3.5 rounded-xl border border-rose-500/30 bg-black/60 backdrop-blur-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-semibold">
                          Talent: {ch.talent_name}
                        </span>
                        <h4 className="text-xs font-bold text-foreground mt-0.5">
                          {ch.project_title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Held by: <span className="text-foreground">{ch.client_name}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold">
                          <Timer className="h-3.5 w-3.5 animate-spin" />
                          {hoursLeft}h Remaining
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {ch.hold_date_start} → {ch.hold_date_end}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-500/20">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isReleasingHold}
                        onClick={() => handleReleaseHold(ch)}
                        className="h-7 text-[11px] border-zinc-700 hover:bg-zinc-800 text-muted-foreground"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1 text-rose-400" />
                        Release Talent
                      </Button>

                      <Button
                        size="sm"
                        disabled={isConfirmingHold}
                        onClick={() => handleConfirmHold(ch)}
                        className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirm Booking (1st Hold Wins)
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border border-border/60">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search holds, talent, clients..."
                className="pl-8 text-xs h-8 bg-card"
              />
            </div>

            <select
              value={selectedTalentFilter}
              onChange={(e) => setSelectedTalentFilter(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden max-w-[200px]"
            >
              <option value="all">All Represented Talent</option>
              {talentRoster.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Records" },
              { id: "1st", label: "1st Holds" },
              { id: "2nd", label: "2nd Holds" },
              { id: "challenged", label: "Challenged" },
              { id: "released", label: "Resolved" },
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

        {/* Holds Timeline Grid */}
        <div className="space-y-3">
          {filteredHolds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 rounded-2xl border border-dashed border-border/80 bg-card/40 text-center p-6 space-y-2">
              <Bookmark className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs font-medium text-foreground">No talent holds found</p>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                There are no holds matching your current search or filter criteria. Place an actor on hold to reserve shoot dates.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateHoldOpen(true)}
                className="text-xs h-8 mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Place Talent on Hold
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHolds.map((hold) => {
                const isChallenged = hold.status === "challenged"
                const isFirstHold = hold.priority_level === 1
                const isSecondHold = hold.priority_level >= 2
                const isResolved = hold.status === "confirmed" || hold.status === "released" || hold.status === "expired"

                return (
                  <div
                    key={hold.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all duration-200 bg-card hover:shadow-md ${
                      isChallenged
                        ? "border-rose-500/50 shadow-rose-950/20"
                        : isFirstHold
                        ? "border-emerald-500/20 hover:border-emerald-500/40"
                        : "border-border/80 hover:border-amber-500/40"
                    }`}
                  >
                    {/* Top Row: Priority Badge & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold font-mono px-2 py-0.5 ${
                            isFirstHold
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {isFirstHold ? "1st Hold" : "2nd Hold"}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`text-[10px] ${HOLD_STATUS_COLORS[hold.status]}`}
                        >
                          {HOLD_STATUS_LABELS[hold.status]}
                        </Badge>
                      </div>

                      {isChallenged && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 font-bold">
                          <Timer className="h-3 w-3" />
                          {getRemainingHours(hold.challenge_expires_at)}h left
                        </span>
                      )}
                    </div>

                    {/* Talent & Project info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/50">
                        {hold.talent_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={hold.talent_avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">
                            {hold.talent_name?.substring(0, 1) || "T"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {hold.talent_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Represented Talent
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-xs text-foreground group-hover:text-blue-400 transition-colors">
                          {hold.project_title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3 text-blue-400/80 shrink-0" />
                          <span className="truncate">{hold.client_name || "Client Account"}</span>
                        </div>
                      </div>

                      {/* Date Range Box */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-border/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <span>
                            {hold.hold_date_start} → {hold.hold_date_end}
                          </span>
                        </div>
                      </div>

                      {hold.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                          &ldquo;{hold.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                      {isResolved ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                          {hold.status === "confirmed" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Shoot Confirmed</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-zinc-500" />
                              <span>Hold Released</span>
                            </>
                          )}
                        </span>
                      ) : isChallenged ? (
                        <div className="flex items-center justify-between w-full gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReleasingHold}
                            onClick={() => handleReleaseHold(hold)}
                            className="h-7 text-[10px] px-2 text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                          >
                            Release
                          </Button>

                          <Button
                            size="sm"
                            disabled={isConfirmingHold}
                            onClick={() => handleConfirmHold(hold)}
                            className="h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium ml-auto"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirm Booking
                          </Button>
                        </div>
                      ) : isSecondHold ? (
                        <div className="flex items-center justify-between w-full gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReleasingHold}
                            onClick={() => handleReleaseHold(hold)}
                            className="h-7 text-[10px] text-muted-foreground px-2"
                          >
                            Release
                          </Button>

                          <Button
                            size="sm"
                            disabled={isChallengingHold}
                            onClick={() => handleIssueChallenge(hold)}
                            className="h-7 text-[10px] px-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold ml-auto"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Issue 24h Challenge
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReleasingHold}
                            onClick={() => handleReleaseHold(hold)}
                            className="h-7 text-[10px] text-muted-foreground px-2"
                          >
                            Release
                          </Button>

                          <Button
                            size="sm"
                            disabled={isConfirmingHold}
                            onClick={() => handleConfirmHold(hold)}
                            className="h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium ml-auto"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirm to Booking
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateHoldModal
          isOpen={isCreateHoldOpen}
          onClose={() => setIsCreateHoldOpen(false)}
        />

        <CreateBookingModal
          isOpen={isCreateBookingOpen}
          onClose={() => {
            setIsCreateBookingOpen(false)
            setSelectedHoldForBooking(null)
          }}
          initialTalentId={selectedHoldForBooking?.talent_id}
          initialClientId={selectedHoldForBooking?.client_id}
          initialProjectName={selectedHoldForBooking?.project_title}
        />
      </div>
    </DashboardShell>
  )
}
