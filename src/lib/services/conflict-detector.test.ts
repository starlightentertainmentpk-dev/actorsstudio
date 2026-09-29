import { describe, it, expect } from 'vitest'
import {
  areDatesOverlapping,
  evaluateTalentConflicts,
} from './conflict-detector'
import { Booking, Hold } from '@/types/deals'

describe('Conflict Detection Engine', () => {
  describe('areDatesOverlapping', () => {
    it('detects exact matching date ranges', () => {
      expect(areDatesOverlapping('2026-11-01', '2026-11-03', '2026-11-01', '2026-11-03')).toBe(true)
    })

    it('detects single day inside a multi-day range', () => {
      expect(areDatesOverlapping('2026-11-01', '2026-11-05', '2026-11-02', '2026-11-02')).toBe(true)
    })

    it('detects partial overlap at the start', () => {
      expect(areDatesOverlapping('2026-11-01', '2026-11-05', '2026-10-28', '2026-11-02')).toBe(true)
    })

    it('detects partial overlap at the end', () => {
      expect(areDatesOverlapping('2026-11-01', '2026-11-05', '2026-11-04', '2026-11-10')).toBe(true)
    })

    it('returns false for non-overlapping preceding dates', () => {
      expect(areDatesOverlapping('2026-11-05', '2026-11-10', '2026-11-01', '2026-11-04')).toBe(false)
    })

    it('returns false for non-overlapping succeeding dates', () => {
      expect(areDatesOverlapping('2026-11-01', '2026-11-04', '2026-11-05', '2026-11-10')).toBe(false)
    })
  })

  describe('evaluateTalentConflicts', () => {
    const mockBookings: Partial<Booking>[] = [
      {
        id: 'b-coca-cola',
        talent_id: 't-zara-noor',
        project_name: 'Coca-Cola TVC Campaign',
        shoot_date_start: '2026-11-10',
        shoot_date_end: '2026-11-12',
        status: 'confirmed',
      },
      {
        id: 'b-cancelled-shoot',
        talent_id: 't-zara-noor',
        project_name: 'Cancelled Shoot',
        shoot_date_start: '2026-11-20',
        shoot_date_end: '2026-11-22',
        status: 'cancelled',
      },
    ]

    const mockHolds: Partial<Hold>[] = [
      {
        id: 'h-shan-foods',
        talent_id: 't-zara-noor',
        client_name: 'Shan Foods',
        project_title: 'Shan Foods Ramadan Commercial',
        hold_date_start: '2026-11-01',
        hold_date_end: '2026-11-03',
        priority_level: 1,
        status: 'active',
      },
      {
        id: 'h-khaadi-released',
        talent_id: 't-zara-noor',
        client_name: 'Khaadi',
        project_title: 'Khaadi Winter Campaign',
        hold_date_start: '2026-11-01',
        hold_date_end: '2026-11-03',
        priority_level: 2,
        status: 'released',
      },
    ]

    it('detects conflict when booking overlaps with an active First Hold', () => {
      const result = evaluateTalentConflicts({
        talentId: 't-zara-noor',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        bookings: mockBookings,
        holds: mockHolds,
      })

      expect(result.hasConflict).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('hold')
      expect(result.conflicts[0].priorityLevel).toBe(1)
      expect(result.conflicts[0].title).toContain('1st Hold')
      expect(result.conflicts[0].title).toContain('Shan Foods')
    })

    it('detects conflict when booking overlaps with a confirmed shoot', () => {
      const result = evaluateTalentConflicts({
        talentId: 't-zara-noor',
        startDate: '2026-11-11',
        endDate: '2026-11-14',
        bookings: mockBookings,
        holds: mockHolds,
      })

      expect(result.hasConflict).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('booking')
      expect(result.conflicts[0].title).toContain('Coca-Cola TVC Campaign')
    })

    it('ignores cancelled bookings and released holds', () => {
      const result = evaluateTalentConflicts({
        talentId: 't-zara-noor',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        bookings: mockBookings,
        holds: mockHolds,
      })

      expect(result.hasConflict).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('excludes specified excludeId during rescheduling/updates', () => {
      const result = evaluateTalentConflicts({
        talentId: 't-zara-noor',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        bookings: mockBookings,
        holds: mockHolds,
        excludeId: 'b-coca-cola',
      })

      expect(result.hasConflict).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('returns no conflict for a completely free date window', () => {
      const result = evaluateTalentConflicts({
        talentId: 't-zara-noor',
        startDate: '2026-11-15',
        endDate: '2026-11-18',
        bookings: mockBookings,
        holds: mockHolds,
      })

      expect(result.hasConflict).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })
  })
})
