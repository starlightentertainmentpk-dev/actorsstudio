import { ConflictResult, ConflictItem, Booking, Hold } from '@/types/deals'

/**
 * Pure function to evaluate overlapping date ranges between two intervals [startA, endA] and [startB, endB].
 * Overlap exists if and only if startA <= endB AND endA >= startB.
 */
export function areDatesOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const dStartA = new Date(startA).getTime()
  const dEndA = new Date(endA).getTime()
  const dStartB = new Date(startB).getTime()
  const dEndB = new Date(endB).getTime()

  return dStartA <= dEndB && dEndA >= dStartB
}

/**
 * Pure conflict evaluator that works across in-memory data collections or DB query responses.
 */
export function evaluateTalentConflicts(params: {
  talentId: string
  startDate: string
  endDate: string
  bookings: Partial<Booking>[]
  holds: Partial<Hold>[]
  blackouts?: { id?: string; talent_id?: string; start_date?: string; end_date?: string; reason?: string | null }[]
  excludeId?: string
}): ConflictResult {
  const { talentId, startDate, endDate, bookings, holds, blackouts = [], excludeId } = params
  const conflicts: ConflictItem[] = []

  // 1. Check existing confirmed bookings
  bookings.forEach((b) => {
    if (b.talent_id !== talentId) return
    if (b.id && b.id === excludeId) return
    if (b.status === 'cancelled') return

    if (b.shoot_date_start && b.shoot_date_end) {
      if (areDatesOverlapping(b.shoot_date_start, b.shoot_date_end, startDate, endDate)) {
        conflicts.push({
          type: 'booking',
          id: b.id || 'booking-conflict',
          title: `Confirmed Shoot: ${b.project_name || 'Production'}`,
          startDate: b.shoot_date_start,
          endDate: b.shoot_date_end,
          details: `Talent has a confirmed booking for '${b.project_name}' from ${b.shoot_date_start} to ${b.shoot_date_end}.`,
        })
      }
    }
  })

  // 2. Check active or challenged holds
  holds.forEach((h) => {
    if (h.talent_id !== talentId) return
    if (h.id && h.id === excludeId) return
    if (h.status !== 'active' && h.status !== 'challenged') return

    if (h.hold_date_start && h.hold_date_end) {
      if (areDatesOverlapping(h.hold_date_start, h.hold_date_end, startDate, endDate)) {
        const priorityText =
          h.priority_level === 1 ? '1st Hold' : h.priority_level === 2 ? '2nd Hold' : '3rd Hold'
        const challengeNote = h.status === 'challenged' ? ' (24h Challenge Active)' : ''

        conflicts.push({
          type: 'hold',
          id: h.id || 'hold-conflict',
          priorityLevel: h.priority_level || 1,
          title: `${priorityText}: ${h.project_title || 'Project'}${challengeNote}`,
          startDate: h.hold_date_start,
          endDate: h.hold_date_end,
          details: `Talent is currently placed on ${priorityText} by ${h.client_name || 'Client'} for '${h.project_title}'.`,
        })
      }
    }
  })

  // 3. Check talent availability blackouts
  blackouts.forEach((bo) => {
    if (bo.talent_id && bo.talent_id !== talentId) return
    if (bo.id && bo.id === excludeId) return

    if (bo.start_date && bo.end_date) {
      if (areDatesOverlapping(bo.start_date, bo.end_date, startDate, endDate)) {
        conflicts.push({
          type: 'blackout',
          id: bo.id || 'blackout-conflict',
          title: `Talent Blackout: ${bo.reason || 'Personal Unavailability'}`,
          startDate: bo.start_date,
          endDate: bo.end_date,
          details: `Talent has marked themselves unavailable from ${bo.start_date} to ${bo.end_date}${bo.reason ? ` (${bo.reason})` : ''}.`,
        })
      }
    }
  })

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}

/**
 * Server-side scheduling conflict check against Supabase, with automatic fallback
 * to provided in-memory datasets if DB is offline or empty.
 */
export async function checkTalentSchedulingConflict(
  talentId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
  fallbackData?: {
    bookings?: Partial<Booking>[]
    holds?: Partial<Hold>[]
  },
  supabaseClient?: any
): Promise<ConflictResult> {
  try {
    const supabase = supabaseClient
    if (supabase) {
      const [bookingsRes, holdsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, project_name, shoot_date_start, shoot_date_end, status, talent_id')
        .eq('talent_id', talentId)
        .neq('status', 'cancelled')
        .lte('shoot_date_start', endDate)
        .gte('shoot_date_end', startDate),
      supabase
        .from('holds')
        .select('id, project_title, priority_level, hold_date_start, hold_date_end, status, talent_id, client_id')
        .eq('talent_id', talentId)
        .in('status', ['active', 'challenged'])
        .lte('hold_date_start', endDate)
        .gte('hold_date_end', startDate),
    ])

    const dbBookings = bookingsRes.data || []
    const dbHolds = holdsRes.data || []

      if (dbBookings.length > 0 || dbHolds.length > 0) {
        return evaluateTalentConflicts({
          talentId,
          startDate,
          endDate,
          bookings: dbBookings as any,
          holds: dbHolds as any,
          excludeId,
        })
      }
    }
  } catch (err) {
    // If Supabase server client fails or database table is not yet populated
    console.warn('Conflict detection Supabase lookup skipped, evaluating fallback:', err)
  }

  // Fallback to provided dataset
  return evaluateTalentConflicts({
    talentId,
    startDate,
    endDate,
    bookings: fallbackData?.bookings || [],
    holds: fallbackData?.holds || [],
    excludeId,
  })
}
