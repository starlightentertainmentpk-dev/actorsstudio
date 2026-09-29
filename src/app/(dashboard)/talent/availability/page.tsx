"use client"

import React, { useState } from "react"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTalentAvailability } from "@/hooks/useTalentAvailability"
import { TalentBlackout } from "@/types/calendar"
import {
  getMonthGrid,
  formatMonthYear,
  formatDateToISO,
} from "@/lib/calendar-utils"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  User,
} from "lucide-react"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Add Blackout Modal ───────────────────────────────────────────────────────
function AddBlackoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (startDate: string, endDate: string, reason?: string) => void
  isLoading: boolean
}) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    onConfirm(startDate, endDate, reason || undefined)
  }

  const handleClose = () => {
    setStartDate("")
    setEndDate("")
    setReason("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 mx-4">
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">
            Mark Unavailability
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Block dates to prevent conflicting casting offers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="blackout-start">
                Start Date
              </label>
              <Input
                id="blackout-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="blackout-end">
                End Date
              </label>
              <Input
                id="blackout-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="blackout-reason">
              Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              id="blackout-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Out of city, Filming drama serial, Medical…"
              className="text-xs h-9"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex-1 text-xs"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!startDate || !endDate || isLoading}
              className="flex-1 text-xs bg-gray-600 hover:bg-gray-500 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              {isLoading ? "Saving…" : "Block Dates"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Day Cell Status Config ───────────────────────────────────────────────────
const STATUS_STYLES = {
  booking: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/40",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blackout: {
    bg: "bg-gray-500/15",
    border: "border-gray-500/30",
    dot: "bg-gray-500",
    text: "text-gray-500",
  },
  hold: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  audition: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    text: "text-blue-500",
  },
  available: {
    bg: "",
    border: "",
    dot: "bg-emerald-400",
    text: "text-muted-foreground",
  },
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────
function AvailabilityCalendar({
  currentMonthDate,
  getDayAvailabilityStatus,
  blackouts,
  onDeleteBlackout,
  isDeletingBlackout,
}: {
  currentMonthDate: Date
  getDayAvailabilityStatus: ReturnType<typeof useTalentAvailability>["getDayAvailabilityStatus"]
  blackouts: TalentBlackout[]
  onDeleteBlackout: (id: string) => void
  isDeletingBlackout: boolean
}) {
  const grid = getMonthGrid(currentMonthDate.getFullYear(), currentMonthDate.getMonth())
  const todayStr = formatDateToISO(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const dayInfo = getDayAvailabilityStatus(day.dateStr)
          const isToday = day.dateStr === todayStr
          const styles = STATUS_STYLES[dayInfo.status]
          const isHovered = hoveredDate === day.dateStr
          const isPast = day.dateStr < todayStr

          // Find matching blackout to allow deletion
          const matchingBlackout =
            dayInfo.status === "blackout"
              ? blackouts.find(
                  (b) => b.start_date <= day.dateStr && b.end_date >= day.dateStr
                )
              : null

          return (
            <div
              key={day.dateStr}
              onMouseEnter={() => setHoveredDate(day.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              className={`relative min-h-[72px] border-b border-r border-border/20 p-1.5 transition-colors ${
                !day.isCurrentMonth
                  ? "opacity-30"
                  : dayInfo.status !== "available"
                  ? `${styles.bg} border ${styles.border}`
                  : "hover:bg-muted/20"
              } ${isPast && day.isCurrentMonth ? "opacity-60" : ""}`}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isToday
                      ? "bg-brand-600 text-white"
                      : dayInfo.status !== "available"
                      ? styles.text
                      : "text-foreground"
                  }`}
                >
                  {day.dayNumber}
                </span>
                {dayInfo.status !== "available" && (
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${styles.dot}`}
                  />
                )}
              </div>

              {/* Status label */}
              {dayInfo.status !== "available" && (
                <div
                  className={`text-[9px] font-medium leading-tight truncate ${styles.text}`}
                >
                  {dayInfo.status === "booking"
                    ? "Shoot Day"
                    : dayInfo.status === "blackout"
                    ? dayInfo.title || "Unavailable"
                    : dayInfo.status === "hold"
                    ? dayInfo.label
                    : dayInfo.status === "audition"
                    ? "Audition"
                    : ""}
                </div>
              )}

              {/* Delete blackout button on hover */}
              {matchingBlackout && isHovered && (
                <button
                  onClick={() => onDeleteBlackout(matchingBlackout.id)}
                  disabled={isDeletingBlackout}
                  className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-500 transition-colors"
                  title="Remove blackout"
                >
                  {isDeletingBlackout ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TalentAvailabilityPage() {
  const {
    selectedTalentId,
    setSelectedTalentId,
    activeTalent,
    talentRoster,
    blackouts,
    talentEvents,
    currentMonthDate,
    setCurrentMonthDate,
    isLoading,
    addBlackout,
    isAddingBlackout,
    deleteBlackout,
    isDeletingBlackout,
    getDayAvailabilityStatus,
  } = useTalentAvailability()

  const [isAddBlackoutOpen, setIsAddBlackoutOpen] = useState(false)

  const confirmedBookings = talentEvents.filter((e) => e.event_type === "booking")
  const activeHolds = talentEvents.filter((e) => e.event_type === "hold")

  const handleAddBlackout = (startDate: string, endDate: string, reason?: string) => {
    addBlackout({ startDate, endDate, reason })
    setIsAddBlackoutOpen(false)
  }

  const nextMonth = () =>
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  const prevMonth = () =>
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )

  return (
    <DashboardShell role="talent">
      <div className="space-y-6 max-w-5xl">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400 border border-gray-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                My Availability
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Block personal dates to avoid conflicting booking offers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Talent selector (for agency-side view or demo) */}
            <select
              value={selectedTalentId}
              onChange={(e) => setSelectedTalentId(e.target.value)}
              className="h-9 rounded-md border border-border bg-card text-xs px-2 pr-6 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Switch talent"
            >
              {talentRoster.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={() => setIsAddBlackoutOpen(true)}
              className="text-xs h-9 bg-gray-600 hover:bg-gray-500 text-white font-semibold shadow-xs"
              id="add-blackout-btn"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Blackout Dates
            </Button>
          </div>
        </div>

        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Confirmed Shoots</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-foreground">{confirmedBookings.length}</div>
            <div className="text-[11px] text-emerald-500 font-medium">
              Upcoming bookings this season
            </div>
          </div>

          <div className="rounded-xl border border-gray-500/20 bg-gray-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Blackout Periods</span>
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-foreground">{blackouts.length}</div>
            <div className="text-[11px] text-muted-foreground font-medium">
              Personal unavailability windows
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active Holds</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-foreground">{activeHolds.length}</div>
            <div className="text-[11px] text-amber-400 font-medium">
              Pending client decisions
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Legend:
          </span>
          {[
            { dot: "bg-emerald-500", label: "Confirmed Shoot", desc: "Locked booking" },
            { dot: "bg-gray-500", label: "Blackout (You)", desc: "Marked unavailable by you" },
            { dot: "bg-amber-500", label: "Hold Window", desc: "Pending client decision" },
            { dot: "bg-blue-500", label: "Audition Slot", desc: "Scheduled audition" },
          ].map(({ dot, label, desc }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              <span className="text-[11px] text-foreground font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground">({desc})</span>
            </div>
          ))}
        </div>

        {/* ── Calendar ── */}
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-bold text-foreground w-44 text-center">
                {formatMonthYear(currentMonthDate)}
              </span>
              <Button variant="outline" size="icon-sm" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Talent name badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{activeTalent?.full_name}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-border">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AvailabilityCalendar
              currentMonthDate={currentMonthDate}
              getDayAvailabilityStatus={getDayAvailabilityStatus}
              blackouts={blackouts}
              onDeleteBlackout={deleteBlackout}
              isDeletingBlackout={isDeletingBlackout}
            />
          )}
        </div>

        {/* ── Blackout Periods List ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">My Blackout Periods</h2>
            <Badge variant="outline" className="font-mono text-[10px]">
              {blackouts.length}
            </Badge>
          </div>

          {blackouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-border text-center space-y-2">
              <Calendar className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                No blackout dates set. Add dates when you&apos;re unavailable.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {blackouts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-gray-500/20 bg-gray-500/5 p-3.5 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-1 rounded-full bg-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground">
                        {b.start_date === b.end_date
                          ? b.start_date
                          : `${b.start_date} → ${b.end_date}`}
                      </div>
                      {b.reason && (
                        <div className="text-xs text-muted-foreground truncate">
                          {b.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteBlackout(b.id)}
                    disabled={isDeletingBlackout}
                    className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    aria-label="Remove blackout"
                  >
                    {isDeletingBlackout ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Blackout Modal ── */}
      <AddBlackoutModal
        isOpen={isAddBlackoutOpen}
        onClose={() => setIsAddBlackoutOpen(false)}
        onConfirm={handleAddBlackout}
        isLoading={isAddingBlackout}
      />
    </DashboardShell>
  )
}
