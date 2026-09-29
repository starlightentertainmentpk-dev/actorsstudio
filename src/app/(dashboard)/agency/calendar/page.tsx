"use client"

import React from "react"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { EventDrawer } from "@/components/features/calendar/EventDrawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAgencyCalendar } from "@/hooks/useAgencyCalendar"
import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/types/calendar"
import {
  getMonthGrid,
  getWeekDays,
  formatMonthYear,
  formatDateToISO,
  formatTimeRange,
  isDateWithinRange,
} from "@/lib/calendar-utils"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Loader2,
  Layers,
  Clock,
  AlignLeft,
  LayoutGrid,
} from "lucide-react"

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Event Pill ───────────────────────────────────────────────────────────────
function EventPill({
  event,
  onClick,
  compact = false,
}: {
  event: CalendarEvent
  onClick: () => void
  compact?: boolean
}) {
  const holdPriority = event.details_json?.priority || 1
  const typeKey =
    event.event_type === "hold" && holdPriority === 2
      ? "hold2nd"
      : event.event_type === "hold"
      ? "hold1st"
      : event.event_type
  const config = EVENT_TYPE_CONFIG[typeKey as keyof typeof EVENT_TYPE_CONFIG]

  return (
    <button
      onClick={onClick}
      style={{ borderLeftColor: config.color }}
      className={`w-full text-left rounded-md border border-border/40 border-l-2 bg-muted/40 hover:bg-muted/80 transition-colors ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      }`}
    >
      <div
        className="truncate font-medium leading-tight"
        style={{
          color: config.color,
          fontSize: compact ? "10px" : "11px",
        }}
      >
        {event.title}
      </div>
      {!compact && (
        <div className="truncate text-muted-foreground" style={{ fontSize: "10px" }}>
          {event.talent_name}
        </div>
      )}
    </button>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────
function MonthView({
  currentDate,
  getEventsForDate,
  openEventDrawer,
}: {
  currentDate: Date
  getEventsForDate: (dateStr: string) => CalendarEvent[]
  openEventDrawer: (event: CalendarEvent) => void
}) {
  const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
  const todayStr = formatDateToISO(new Date())

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {grid.map((day) => {
          const dayEvents = getEventsForDate(day.dateStr)
          const isToday = day.dateStr === todayStr
          const maxVisible = 3

          return (
            <div
              key={day.dateStr}
              className={`relative min-h-[100px] border-b border-r border-border/30 p-1.5 transition-colors ${
                !day.isCurrentMonth ? "bg-muted/20" : "bg-background hover:bg-muted/10"
              }`}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isToday
                      ? "bg-brand-600 text-white shadow"
                      : day.isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {day.dayNumber}
                </span>
                {dayEvents.filter((e) => e.event_type === "booking").length > 1 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 font-mono border-emerald-500/30 text-emerald-500"
                  >
                    {dayEvents.filter((e) => e.event_type === "booking").length} shoots
                  </Badge>
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((evt) => (
                  <EventPill
                    key={evt.event_id}
                    event={evt}
                    compact
                    onClick={() => openEventDrawer(evt)}
                  />
                ))}
                {dayEvents.length > maxVisible && (
                  <div className="text-[9px] text-muted-foreground pl-1 font-medium">
                    +{dayEvents.length - maxVisible} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({
  currentDate,
  getEventsForDate,
  openEventDrawer,
}: {
  currentDate: Date
  getEventsForDate: (dateStr: string) => CalendarEvent[]
  openEventDrawer: (event: CalendarEvent) => void
}) {
  const days = getWeekDays(currentDate)
  const todayStr = formatDateToISO(new Date())

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-border/50">
        {days.map((day) => (
          <div
            key={day.dateStr}
            className="py-2 text-center border-r border-border/30 last:border-r-0"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {DAY_LABELS[day.date.getDay()]}
            </div>
            <div
              className={`inline-flex mt-1 h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                day.dateStr === todayStr
                  ? "bg-brand-600 text-white"
                  : "text-foreground"
              }`}
            >
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = getEventsForDate(day.dateStr)
          return (
            <div
              key={day.dateStr}
              className="min-h-[200px] border-r border-b border-border/30 last:border-r-0 p-2 space-y-1"
            >
              {dayEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-1 h-8 rounded-full bg-border/40" />
                </div>
              ) : (
                dayEvents.map((evt) => (
                  <EventPill
                    key={evt.event_id}
                    event={evt}
                    onClick={() => openEventDrawer(evt)}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({
  currentDate,
  getEventsForDate,
  openEventDrawer,
}: {
  currentDate: Date
  getEventsForDate: (dateStr: string) => CalendarEvent[]
  openEventDrawer: (event: CalendarEvent) => void
}) {
  const dateStr = formatDateToISO(currentDate)
  const dayEvents = getEventsForDate(dateStr)
  const dayLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="text-sm font-semibold text-muted-foreground border-b border-border/50 pb-2">
        {dayLabel}
      </div>
      {dayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-border text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
        </div>
      ) : (
        dayEvents.map((evt) => {
          const holdPriority = evt.details_json?.priority || 1
          const typeKey =
            evt.event_type === "hold" && holdPriority === 2
              ? "hold2nd"
              : evt.event_type === "hold"
              ? "hold1st"
              : evt.event_type
          const config = EVENT_TYPE_CONFIG[typeKey as keyof typeof EVENT_TYPE_CONFIG]

          return (
            <button
              key={evt.event_id}
              onClick={() => openEventDrawer(evt)}
              className="w-full text-left rounded-xl border border-border/60 bg-card hover:border-brand-500/50 hover:shadow-md transition-all p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border mb-1.5 ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                  <div className="font-semibold text-sm text-foreground">{evt.title}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {evt.talent_name}
                </span>
                {evt.client_name && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {evt.client_name}
                  </span>
                )}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {formatTimeRange(evt.start_time, evt.end_time)}
                </span>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}

// ─── Agenda View ──────────────────────────────────────────────────────────────
function AgendaView({
  filteredEvents,
  openEventDrawer,
}: {
  filteredEvents: CalendarEvent[]
  openEventDrawer: (event: CalendarEvent) => void
}) {
  const sorted = [...filteredEvents].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  // Group by date
  const grouped: Record<string, CalendarEvent[]> = {}
  for (const evt of sorted) {
    const dateKey = evt.start_time.split("T")[0]
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(evt)
  }

  const dateKeys = Object.keys(grouped).sort()

  if (dateKeys.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <Calendar className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No events match current filters</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {dateKeys.map((dateKey) => {
        const dateLabel = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })

        return (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dateLabel}
              </div>
              <div className="flex-1 h-px bg-border/50" />
              <Badge variant="outline" className="text-[10px] font-mono">
                {grouped[dateKey].length}
              </Badge>
            </div>
            <div className="space-y-2">
              {grouped[dateKey].map((evt) => {
                const holdPriority = evt.details_json?.priority || 1
                const typeKey =
                  evt.event_type === "hold" && holdPriority === 2
                    ? "hold2nd"
                    : evt.event_type === "hold"
                    ? "hold1st"
                    : evt.event_type
                const config = EVENT_TYPE_CONFIG[typeKey as keyof typeof EVENT_TYPE_CONFIG]

                return (
                  <button
                    key={evt.event_id}
                    onClick={() => openEventDrawer(evt)}
                    className="w-full text-left flex items-center gap-3 rounded-xl border border-border/60 bg-card hover:border-brand-500/40 hover:bg-muted/20 transition-all p-3 group"
                  >
                    <div
                      className="h-8 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {evt.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{evt.talent_name}</span>
                        {evt.client_name && (
                          <>
                            <span>·</span>
                            <span>{evt.client_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {formatTimeRange(evt.start_time, evt.end_time)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgencyCalendarPage() {
  const {
    viewMode,
    setViewMode,
    currentDate,
    searchQuery,
    setSearchQuery,
    selectedTalentId,
    setSelectedTalentId,
    eventTypes,
    toggleEventType,
    filteredEvents,
    isLoading,
    goToToday,
    nextPeriod,
    prevPeriod,
    getEventsForDate,
    selectedEvent,
    isDrawerOpen,
    openEventDrawer,
    closeEventDrawer,
    talentRoster,
  } = useAgencyCalendar()

  const periodLabel =
    viewMode === "month"
      ? formatMonthYear(currentDate)
      : viewMode === "week"
      ? (() => {
          const days = getWeekDays(currentDate)
          const first = days[0]
          const last = days[6]
          if (first.date.getMonth() === last.date.getMonth()) {
            return `${MONTH_NAMES[first.date.getMonth()]} ${first.dayNumber}–${last.dayNumber}, ${first.date.getFullYear()}`
          }
          return `${MONTH_NAMES[first.date.getMonth()]} ${first.dayNumber} – ${MONTH_NAMES[last.date.getMonth()]} ${last.dayNumber}`
        })()
      : currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })

  const VIEW_MODES = [
    { id: "month", label: "Month", icon: LayoutGrid },
    { id: "week", label: "Week", icon: Layers },
    { id: "day", label: "Day", icon: Calendar },
    { id: "agenda", label: "Agenda", icon: AlignLeft },
  ] as const

  const EVENT_FILTER_KEYS = [
    { key: "booking", label: "Shoots" },
    { key: "audition", label: "Auditions" },
    { key: "hold1st", label: "1st Holds" },
    { key: "hold2nd", label: "2nd Holds" },
    { key: "blackout", label: "Blackouts" },
  ] as const

  return (
    <DashboardShell role="agency">
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden space-y-0">
        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/60 space-y-3 bg-card">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Smart Agency Calendar
                </h1>
                <p className="text-xs text-muted-foreground">
                  Shoots, auditions &amp; holds for your entire talent roster
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/60">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === id
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={prevPeriod} aria-label="Previous period">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">
                {periodLabel}
              </span>
              <Button variant="outline" size="icon-sm" onClick={nextPeriod} aria-label="Next period">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-8 ml-1">
                Today
              </Button>
            </div>

            {/* Talent filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedTalentId}
                onChange={(e) => setSelectedTalentId(e.target.value)}
                className="h-8 rounded-md border border-border bg-card text-xs px-2 pr-6 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Filter by talent"
              >
                <option value="all">All Talent</option>
                {talentRoster.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events…"
                  className="pl-7 h-8 text-xs w-44 bg-card"
                  aria-label="Search events"
                />
              </div>
            </div>
          </div>

          {/* Event type filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">Show:</span>
            {EVENT_FILTER_KEYS.map(({ key, label }) => {
              const isOn = eventTypes[key]
              const typeKey = key as keyof typeof EVENT_TYPE_CONFIG
              const config = EVENT_TYPE_CONFIG[typeKey]
              return (
                <button
                  key={key}
                  onClick={() => toggleEventType(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    isOn
                      ? `${config.badgeClass}`
                      : "text-muted-foreground border-border/50 opacity-50"
                  }`}
                  aria-pressed={isOn}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: isOn ? config.color : "#6b7280" }}
                  />
                  {label}
                </button>
              )
            })}
            <span className="ml-auto text-[11px] text-muted-foreground font-mono">
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
              ) : (
                `${filteredEvents.length} events`
              )}
            </span>
          </div>
        </div>

        {/* ── Calendar Body ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "month" ? (
            <MonthView
              currentDate={currentDate}
              getEventsForDate={getEventsForDate}
              openEventDrawer={openEventDrawer}
            />
          ) : viewMode === "week" ? (
            <WeekView
              currentDate={currentDate}
              getEventsForDate={getEventsForDate}
              openEventDrawer={openEventDrawer}
            />
          ) : viewMode === "day" ? (
            <DayView
              currentDate={currentDate}
              getEventsForDate={getEventsForDate}
              openEventDrawer={openEventDrawer}
            />
          ) : (
            <AgendaView
              filteredEvents={filteredEvents}
              openEventDrawer={openEventDrawer}
            />
          )}
        </div>
      </div>

      {/* ── Event Detail Drawer ── */}
      <EventDrawer
        isOpen={isDrawerOpen}
        onClose={closeEventDrawer}
        event={selectedEvent}
      />
    </DashboardShell>
  )
}
