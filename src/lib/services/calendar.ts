import { createClient } from '@/lib/supabase/server'
import { CalendarEvent, TalentBlackout } from '@/types/calendar'

export async function getAgencyCalendarEvents(
  orgId: string,
  startDate: string,
  endDate: string,
  talentId?: string
): Promise<CalendarEvent[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any).rpc('get_agency_calendar_events', {
      p_org_id: orgId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_talent_id: talentId || null,
    })

    if (error) {
      console.warn('RPC get_agency_calendar_events failed, falling back:', error.message)
      return []
    }

    return (data || []) as CalendarEvent[]
  } catch (err: any) {
    console.warn('Error fetching agency calendar events:', err?.message)
    return []
  }
}

export async function getTalentBlackouts(talentId: string): Promise<TalentBlackout[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('talent_availability')
      .select('*')
      .eq('talent_id', talentId)
      .order('start_date', { ascending: true })

    if (error) {
      console.warn('DB error fetching talent_availability:', error.message)
      return []
    }

    return (data || []) as TalentBlackout[]
  } catch (err: any) {
    console.warn('Error fetching talent blackouts:', err?.message)
    return []
  }
}
