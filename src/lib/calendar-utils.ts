/**
 * Pure date utility functions for calendar generation and interval checks
 */

export interface CalendarDay {
  date: Date
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const str1 = typeof d1 === 'string' ? d1.split('T')[0] : formatDateToISO(d1)
  const str2 = typeof d2 === 'string' ? d2.split('T')[0] : formatDateToISO(d2)
  return str1 === str2
}

export function isDateWithinRange(dateStr: string, startStr: string, endStr: string): boolean {
  const target = dateStr.split('T')[0]
  const start = startStr.split('T')[0]
  const end = endStr.split('T')[0]
  return target >= start && target <= end
}

export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const todayStr = formatDateToISO(new Date())
  
  // First day of target month (0-indexed month)
  const firstDay = new Date(year, month, 1)
  // Last day of target month
  const lastDay = new Date(year, month + 1, 0)

  // Day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDay.getDay()
  
  const days: CalendarDay[] = []

  // 1. Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    const dateStr = formatDateToISO(d)
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  // 2. Days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day)
    const dateStr = formatDateToISO(d)
    days.push({
      date: d,
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    })
  }

  // 3. Next month padding days to complete 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7
  const totalNeeded = days.length + remainingCells < 35 ? 35 - days.length : remainingCells
  for (let day = 1; day <= totalNeeded; day++) {
    const d = new Date(year, month + 1, day)
    const dateStr = formatDateToISO(d)
    days.push({
      date: d,
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  return days
}

export function getWeekDays(referenceDate: Date): CalendarDay[] {
  const todayStr = formatDateToISO(new Date())
  const dayOfWeek = referenceDate.getDay() // 0 = Sunday
  const sunday = new Date(referenceDate)
  sunday.setDate(referenceDate.getDate() - dayOfWeek)

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const dateStr = formatDateToISO(d)
    days.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === referenceDate.getMonth(),
      isToday: dateStr === todayStr,
    })
  }

  return days
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatTimeRange(startISO: string, endISO: string): string {
  try {
    const startDate = new Date(startISO)
    const endDate = new Date(endISO)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'All Day'
    }

    const start = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const end = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return `${start} – ${end}`
  } catch {
    return 'All Day'
  }
}
