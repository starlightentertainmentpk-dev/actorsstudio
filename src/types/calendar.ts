export type CalendarEventType = 'booking' | 'audition' | 'hold' | 'blackout'
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda'

export interface CalendarEvent {
  event_id: string
  event_type: CalendarEventType
  title: string
  start_time: string
  end_time: string
  talent_id: string
  talent_name: string
  client_name?: string | null
  color_code: string
  details_json: Record<string, any>
}

export interface TalentBlackout {
  id: string
  talent_id: string
  talent_name?: string
  start_date: string
  end_date: string
  status: 'available' | 'unavailable' | 'blackout' | 'tentative'
  reason?: string | null
  created_at?: string
}

export interface CalendarFilterState {
  viewMode: CalendarViewMode
  currentDate: string // YYYY-MM-DD
  searchQuery: string
  selectedTalentId: string // 'all' or UUID
  eventTypes: {
    booking: boolean
    audition: boolean
    hold1st: boolean
    hold2nd: boolean
    blackout: boolean
  }
}

export const EVENT_TYPE_CONFIG = {
  booking: {
    label: 'Confirmed Shoot',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  audition: {
    label: 'Audition Slot',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-500',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  hold1st: {
    label: '1st Priority Hold',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  hold2nd: {
    label: '2nd Priority Hold',
    color: '#f97316',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-500',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  blackout: {
    label: 'Talent Blackout',
    color: '#6b7280',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-400',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
} as const
