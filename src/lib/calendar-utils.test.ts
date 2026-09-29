import { describe, it, expect } from 'vitest'
import {
  formatDateToISO,
  parseISODate,
  isDateWithinRange,
  getMonthGrid,
  getWeekDays,
  formatTimeRange,
} from './calendar-utils'
import { evaluateTalentConflicts } from './services/conflict-detector'

describe('calendar-utils', () => {
  it('formats Date to YYYY-MM-DD correctly', () => {
    const d = new Date(2026, 10, 15) // Nov 15, 2026
    expect(formatDateToISO(d)).toBe('2026-11-15')
  })

  it('parses YYYY-MM-DD correctly', () => {
    const d = parseISODate('2026-11-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(15)
  })

  it('evaluates whether a date is within an inclusive range', () => {
    expect(isDateWithinRange('2026-11-10', '2026-11-01', '2026-11-15')).toBe(true)
    expect(isDateWithinRange('2026-11-01', '2026-11-01', '2026-11-15')).toBe(true)
    expect(isDateWithinRange('2026-11-15', '2026-11-01', '2026-11-15')).toBe(true)
    expect(isDateWithinRange('2026-11-16', '2026-11-01', '2026-11-15')).toBe(false)
    expect(isDateWithinRange('2026-10-31', '2026-11-01', '2026-11-15')).toBe(false)
  })

  it('generates a full month grid with 35 or 42 cells', () => {
    const gridNov2026 = getMonthGrid(2026, 10) // Nov 2026
    expect(gridNov2026.length).toBeGreaterThanOrEqual(35)
    expect(gridNov2026.some((d) => d.dateStr === '2026-11-01' && d.isCurrentMonth)).toBe(true)
    expect(gridNov2026.some((d) => d.dateStr === '2026-11-30' && d.isCurrentMonth)).toBe(true)
  })

  it('generates 7 days for a week', () => {
    const ref = new Date(2026, 10, 10) // Nov 10, 2026 (Tuesday)
    const week = getWeekDays(ref)
    expect(week).toHaveLength(7)
  })

  it('formats time range into human readable 12-hour format', () => {
    const start = '2026-11-10T09:00:00.000Z'
    const end = '2026-11-10T17:00:00.000Z'
    const res = formatTimeRange(start, end)
    expect(res).toContain('–')
  })
})

describe('conflict-detector with blackouts', () => {
  it('detects conflict when booking overlaps with talent blackout', () => {
    const result = evaluateTalentConflicts({
      talentId: 't-zara-noor',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      bookings: [],
      holds: [],
      blackouts: [
        {
          id: 'bo-1',
          talent_id: 't-zara-noor',
          start_date: '2026-11-10',
          end_date: '2026-11-12',
          reason: 'Family Event',
        },
      ],
    })

    expect(result.hasConflict).toBe(true)
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].type).toBe('blackout')
    expect(result.conflicts[0].title).toContain('Family Event')
  })

  it('returns no conflict when blackout is for a different talent', () => {
    const result = evaluateTalentConflicts({
      talentId: 't-bilal-khan',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      bookings: [],
      holds: [],
      blackouts: [
        {
          id: 'bo-1',
          talent_id: 't-zara-noor',
          start_date: '2026-11-10',
          end_date: '2026-11-12',
          reason: 'Family Event',
        },
      ],
    })

    expect(result.hasConflict).toBe(false)
  })
})
