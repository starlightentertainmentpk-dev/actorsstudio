"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { CalendarEvent, CalendarViewMode, TalentBlackout } from "@/types/calendar"
import { REPRESENTED_TALENT_ROSTER } from "@/hooks/useCastingPipeline"
import { formatDateToISO, isDateWithinRange, getMonthGrid, getWeekDays } from "@/lib/calendar-utils"
import { addBlackoutPeriodAction, deleteBlackoutPeriodAction } from "@/app/(dashboard)/talent/availability/actions"

export const INITIAL_DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  // 1. Confirmed Shoot Bookings
  {
    event_id: "evt-booking-khaadi",
    event_type: "booking",
    title: "Shoot: Khaadi Festive Lawn Commercial",
    start_time: "2026-10-20T07:00:00.000Z",
    end_time: "2026-10-22T19:00:00.000Z",
    talent_id: "t-sarah-khan",
    talent_name: "Sarah Tariq",
    client_name: "Hum Network Studios",
    color_code: "#10b981",
    details_json: {
      location: "Eastern Studios, Studio 3, Korangi, Karachi",
      status: "confirmed",
      call_time: "07:00",
      wrap_time: "19:00",
      fee_amount: 1500000,
      currency: "PKR",
      usage_rights: "1 Year Digital + TVC",
      director: "Asim Abbasi",
      contact_person: "Farhan Ali (Production Mgr)",
      contact_phone: "+92 300 1234567",
    },
  },
  {
    event_id: "evt-booking-jazz",
    event_type: "booking",
    title: "Shoot: Jazz 4G National Commercial",
    start_time: "2026-11-10T06:30:00.000Z",
    end_time: "2026-11-12T18:00:00.000Z",
    talent_id: "t-alizeh-r",
    talent_name: "Alizeh Rehman",
    client_name: "Multiverse Productions",
    color_code: "#10b981",
    details_json: {
      location: "DHA Phase 8 Outdoor Sets, Karachi",
      status: "confirmed",
      call_time: "06:30",
      wrap_time: "18:00",
      fee_amount: 3200000,
      currency: "PKR",
      usage_rights: "2 Years Full Media (Pakistan + GCC)",
      director: "Jami Mahmood",
      contact_person: "Sana Mir (1st AD)",
      contact_phone: "+92 321 9876543",
    },
  },
  {
    event_id: "evt-booking-sunsilk",
    event_type: "booking",
    title: "Shoot: Sunsilk Hair Care Commercial",
    start_time: "2026-11-24T08:00:00.000Z",
    end_time: "2026-11-26T20:00:00.000Z",
    talent_id: "t-mahnoor-s",
    talent_name: "Mahnoor Sheikh",
    client_name: "Dawn Films & Media",
    color_code: "#10b981",
    details_json: {
      location: "Oasis Country Club Studio, Lahore",
      status: "confirmed",
      call_time: "08:00",
      wrap_time: "20:00",
      fee_amount: 1800000,
      currency: "PKR",
      usage_rights: "1 Year Digital",
      director: "Bilal Lashari",
      contact_person: "Tariq Shah (Producer)",
      contact_phone: "+92 333 4455667",
    },
  },
  {
    event_id: "evt-booking-pepsi",
    event_type: "booking",
    title: "Shoot: Pepsi Youth Anthem Video",
    start_time: "2026-11-18T09:00:00.000Z",
    end_time: "2026-11-20T21:00:00.000Z",
    talent_id: "t-fawad-m",
    talent_name: "Fawad Malik",
    client_name: "Multiverse Productions",
    color_code: "#10b981",
    details_json: {
      location: "Sound & Stage Studios, Sector 15, Korangi, Karachi",
      status: "confirmed",
      call_time: "09:00",
      wrap_time: "21:00",
      fee_amount: 2500000,
      currency: "PKR",
      usage_rights: "TV, Digital, Social, Cinema",
      director: "Saqib Malik",
      contact_person: "Danish Raza",
      contact_phone: "+92 312 3344556",
    },
  },

  // 2. Auditions
  {
    event_id: "evt-audition-geo",
    event_type: "audition",
    title: "Audition: Geo Ramadan Mega Serial",
    start_time: "2026-11-05T14:00:00.000Z",
    end_time: "2026-11-05T14:45:00.000Z",
    talent_id: "t-hamza-ali",
    talent_name: "Hamza Ali",
    client_name: "Geo Entertainment",
    color_code: "#3b82f6",
    details_json: {
      mode: "in_person",
      location: "Geo TV Production House, I.I. Chundrigar Rd, Karachi",
      score: 9.2,
      feedback: "Strong dialogue delivery. Callback scheduled for chemistry read.",
      result: "callback",
    },
  },
  {
    event_id: "evt-audition-khaadi-film",
    event_type: "audition",
    title: "Audition: Khaadi International Fashion Film",
    start_time: "2026-11-08T11:30:00.000Z",
    end_time: "2026-11-08T12:15:00.000Z",
    talent_id: "t-mahnoor-s",
    talent_name: "Mahnoor Sheikh",
    client_name: "Hum Network Studios",
    color_code: "#3b82f6",
    details_json: {
      mode: "virtual",
      location: "https://zoom.us/j/9876543210?pwd=actorsstudio",
      score: 8.8,
      feedback: "Excellent on-camera poise, graceful movement.",
      result: "pending",
    },
  },
  {
    event_id: "evt-audition-shan-web",
    event_type: "audition",
    title: "Audition: Shan Foods Ramadan Digital Series",
    start_time: "2026-10-28T15:00:00.000Z",
    end_time: "2026-10-28T15:45:00.000Z",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    client_name: "Shan Foods Global",
    color_code: "#3b82f6",
    details_json: {
      mode: "in_person",
      location: "Shan HQ Media Lab, Clifton Block 4, Karachi",
      score: 9.5,
      feedback: "Outstanding natural emotional beats. Highly recommended.",
      result: "selected",
    },
  },

  // 3. Active Holds (1st and 2nd priority)
  {
    event_id: "evt-hold-shan-zara",
    event_type: "hold",
    title: "1st Hold: Shan Foods Ramadan Commercial",
    start_time: "2026-11-01T00:00:00.000Z",
    end_time: "2026-11-03T23:59:59.000Z",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    client_name: "Shan Foods Global",
    color_code: "#f59e0b",
    details_json: {
      priority: 1,
      status: "active",
      notes: "First priority hold for 3-day TVC shoot in Lahore.",
    },
  },
  {
    event_id: "evt-hold-hum-bilal",
    event_type: "hold",
    title: "1st Hold: Hum Network Action Series Pilot",
    start_time: "2026-11-15T00:00:00.000Z",
    end_time: "2026-11-18T23:59:59.000Z",
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    client_name: "Hum Network Studios",
    color_code: "#f59e0b",
    details_json: {
      priority: 1,
      status: "active",
      notes: "First hold placed for outdoor stunt sequences.",
    },
  },
  {
    event_id: "evt-hold-olpers-bilal-2nd",
    event_type: "hold",
    title: "2nd Hold: Olper's Dairy National Commercial",
    start_time: "2026-11-15T00:00:00.000Z",
    end_time: "2026-11-17T23:59:59.000Z",
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    client_name: "Multiverse Productions",
    color_code: "#f97316",
    details_json: {
      priority: 2,
      status: "active",
      notes: "2nd hold waiting for resolution from 1st hold client.",
    },
  },

  // 4. Talent Blackout Dates
  {
    event_id: "evt-blackout-zara-family",
    event_type: "blackout",
    title: "Unavailable: Family Event",
    start_time: "2026-11-10T00:00:00.000Z",
    end_time: "2026-11-12T23:59:59.000Z",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    client_name: null,
    color_code: "#6b7280",
    details_json: {
      status: "unavailable",
      reason: "Family Event",
    },
  },
  {
    event_id: "evt-blackout-fawad-dubai",
    event_type: "blackout",
    title: "Unavailable: Dubai Film Festival",
    start_time: "2026-11-04T00:00:00.000Z",
    end_time: "2026-11-06T23:59:59.000Z",
    talent_id: "t-fawad-m",
    talent_name: "Fawad Malik",
    client_name: null,
    color_code: "#6b7280",
    details_json: {
      status: "unavailable",
      reason: "Dubai Film Festival Attendance",
    },
  },
]

export const INITIAL_DEMO_BLACKOUTS: TalentBlackout[] = [
  {
    id: "evt-blackout-zara-family",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    start_date: "2026-11-10",
    end_date: "2026-11-12",
    status: "unavailable",
    reason: "Family Event",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-blackout-fawad-dubai",
    talent_id: "t-fawad-m",
    talent_name: "Fawad Malik",
    start_date: "2026-11-04",
    end_date: "2026-11-06",
    status: "unavailable",
    reason: "Dubai Film Festival Attendance",
    created_at: new Date().toISOString(),
  },
  {
    id: "evt-blackout-bilal-medical",
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    start_date: "2026-11-28",
    end_date: "2026-11-29",
    status: "unavailable",
    reason: "Physiotherapy & Recovery",
    created_at: new Date().toISOString(),
  },
]

export function useAgencyCalendar(initialDate: Date = new Date(2026, 10, 1)) {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month")
  const [currentDate, setCurrentDate] = useState<Date>(initialDate)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTalentId, setSelectedTalentId] = useState<string>("all")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Event type toggles
  const [eventTypes, setEventTypes] = useState({
    booking: true,
    audition: true,
    hold1st: true,
    hold2nd: true,
    blackout: true,
  })

  // Load events
  const { data: events = INITIAL_DEMO_CALENDAR_EVENTS, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["agency-calendar-events", currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
        
        const { data, error } = await (supabase as any).rpc("get_agency_calendar_events", {
          p_org_id: "default-org",
          p_start_date: formatDateToISO(start),
          p_end_date: formatDateToISO(end),
          p_talent_id: selectedTalentId === "all" ? null : selectedTalentId,
        })

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_CALENDAR_EVENTS
        }
        return data as CalendarEvent[]
      } catch {
        return INITIAL_DEMO_CALENDAR_EVENTS
      }
    },
  })

  // Navigation handlers
  const goToToday = () => {
    // Center around November 2026 where project demo dates reside
    setCurrentDate(new Date(2026, 10, 10))
  }

  const nextPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === "month") {
        next.setMonth(prev.getMonth() + 1)
      } else if (viewMode === "week") {
        next.setDate(prev.getDate() + 7)
      } else {
        next.setDate(prev.getDate() + 1)
      }
      return next
    })
  }

  const prevPeriod = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === "month") {
        next.setMonth(prev.getMonth() - 1)
      } else if (viewMode === "week") {
        next.setDate(prev.getDate() - 7)
      } else {
        next.setDate(prev.getDate() - 1)
      }
      return next
    })
  }

  const toggleEventType = (key: keyof typeof eventTypes) => {
    setEventTypes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Talent Filter
      if (selectedTalentId !== "all" && evt.talent_id !== selectedTalentId) {
        return false
      }

      // 2. Event Type Filter
      if (evt.event_type === "booking" && !eventTypes.booking) return false
      if (evt.event_type === "audition" && !eventTypes.audition) return false
      if (evt.event_type === "blackout" && !eventTypes.blackout) return false
      if (evt.event_type === "hold") {
        const priority = evt.details_json?.priority || 1
        if (priority === 1 && !eventTypes.hold1st) return false
        if (priority === 2 && !eventTypes.hold2nd) return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = evt.title.toLowerCase().includes(query)
        const matchesTalent = evt.talent_name.toLowerCase().includes(query)
        const matchesClient = evt.client_name ? evt.client_name.toLowerCase().includes(query) : false
        const matchesLocation = evt.details_json?.location ? String(evt.details_json.location).toLowerCase().includes(query) : false
        if (!matchesTitle && !matchesTalent && !matchesClient && !matchesLocation) {
          return false
        }
      }

      return true
    })
  }, [events, selectedTalentId, eventTypes, searchQuery])

  // Get events on a specific date string (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string): CalendarEvent[] => {
    return filteredEvents.filter((evt) => {
      const start = evt.start_time.split("T")[0]
      const end = evt.end_time.split("T")[0]
      return isDateWithinRange(dateStr, start, end)
    })
  }

  // Count overlapping shoots on each date
  const getOverlappingShootsCount = (dateStr: string): number => {
    const dayBookings = getEventsForDate(dateStr).filter((e) => e.event_type === "booking")
    return dayBookings.length
  }

  const openEventDrawer = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const closeEventDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedEvent(null)
  }

  return {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    searchQuery,
    setSearchQuery,
    selectedTalentId,
    setSelectedTalentId,
    eventTypes,
    toggleEventType,
    events,
    filteredEvents,
    isLoading,
    goToToday,
    nextPeriod,
    prevPeriod,
    getEventsForDate,
    getOverlappingShootsCount,
    selectedEvent,
    isDrawerOpen,
    openEventDrawer,
    closeEventDrawer,
    talentRoster: REPRESENTED_TALENT_ROSTER,
  }
}
