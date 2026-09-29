# Sub-Prompt 07 — Unified Smart Agency Calendar & Dynamic Talent Availability Management

**Phase:** Scheduling & Operations — Sub-Prompt 7 of 10  
**Depends on:** `06-deals-and-hold-system.md` (Bookings & Holds), existing `auditions`  
**Delivers:** Unified agency calendar aggregating shoot bookings, auditions, and active holds across Month/Week/Day/Agenda views, with a talent availability and blackout dates manager.

---

## 🎯 Architectural Context & Additive Strategy

Sections 11, 26, and 69 of `masterprompt1.md` require a **Smart Agency Calendar**:
1. **Unified Event Aggregation:** The calendar must dynamically aggregate three distinct database sources:
   - **Confirmed Bookings:** Shoot days and call times.
   - **Auditions:** Scheduled in-person or video auditions.
   - **Holds:** 1st and 2nd priority hold windows.
   - **Talent Blackouts:** Personal unavailability periods marked by talent.
2. **Multi-Entity Filtering:** Agents can filter the entire studio schedule by specific talent, client, agent, or event type.
3. **Talent Availability Self-Service:** Talent can access `/talent/availability` to block out dates (vacation, filming on external projects, medical) to avoid receiving conflicting booking offers.
4. **Timezone Integrity:** All timestamps stored in canonical UTC and displayed in the organization's or user's local timezone.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0011_talent_availability.sql`

```sql
-- ============================================================
-- TALENT AVAILABILITY & UNIFIED CALENDAR SCHEMA
-- ============================================================

CREATE TYPE availability_status_enum AS ENUM ('available', 'unavailable', 'blackout', 'tentative');

-- Talent Availability / Blackout Dates Table
CREATE TABLE IF NOT EXISTS public.talent_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id       UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          availability_status_enum NOT NULL DEFAULT 'unavailable',
  reason          TEXT, -- e.g. "Out of city", "Filming drama serial", "Personal"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.talent_availability ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_talent_avail_dates ON public.talent_availability(talent_id, start_date, end_date);

-- RLS: Talent can manage their own availability
CREATE POLICY "talent_availability_manage_own" ON public.talent_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = talent_availability.talent_id AND tp.user_id = auth.uid())
  );

-- RLS: Agency members can view all talent availability in their agency
CREATE POLICY "agency_talent_availability_view" ON public.talent_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp
      WHERE tp.id = talent_availability.talent_id
        AND tp.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- Helper View / Function to Aggregate Calendar Events
CREATE OR REPLACE FUNCTION public.get_agency_calendar_events(
  p_org_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_talent_id UUID DEFAULT NULL
)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  talent_id UUID,
  talent_name TEXT,
  client_name TEXT,
  color_code TEXT,
  details_json JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  -- 1. Bookings
  SELECT
    b.id AS event_id,
    'booking'::TEXT AS event_type,
    ('Shoot: ' || b.project_name)::TEXT AS title,
    (b.shoot_date_start::TEXT || ' ' || COALESCE(b.call_time::TEXT, '08:00:00'))::TIMESTAMPTZ AS start_time,
    (b.shoot_date_end::TEXT || ' ' || COALESCE(b.wrap_time::TEXT, '20:00:00'))::TIMESTAMPTZ AS end_time,
    b.talent_id,
    tp.full_name AS talent_name,
    c.company_name AS client_name,
    '#10b981'::TEXT AS color_code, -- Emerald Green
    jsonb_build_object('location', b.location_address, 'status', b.status) AS details_json
  FROM public.bookings b
  JOIN public.talent_profiles tp ON tp.id = b.talent_id
  JOIN public.clients c ON c.id = b.client_id
  WHERE b.organization_id = p_org_id
    AND b.shoot_date_start <= p_end_date
    AND b.shoot_date_end >= p_start_date
    AND (p_talent_id IS NULL OR b.talent_id = p_talent_id)
    AND b.status != 'cancelled'

  UNION ALL

  -- 2. Auditions
  SELECT
    a.id AS event_id,
    'audition'::TEXT AS event_type,
    ('Audition: ' || cc.title)::TEXT AS title,
    a.scheduled_at AS start_time,
    (a.scheduled_at + INTERVAL '45 minutes') AS end_time,
    a.talent_id,
    tp.full_name AS talent_name,
    pp.company_name AS client_name,
    '#3b82f6'::TEXT AS color_code, -- Blue
    jsonb_build_object('mode', a.mode, 'location', a.location_or_link) AS details_json
  FROM public.auditions a
  JOIN public.casting_calls cc ON cc.id = a.casting_call_id
  JOIN public.producer_profiles pp ON pp.id = cc.producer_id
  JOIN public.talent_profiles tp ON tp.id = a.talent_id
  WHERE a.scheduled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_talent_id IS NULL OR a.talent_id = p_talent_id)

  UNION ALL

  -- 3. Active Holds
  SELECT
    h.id AS event_id,
    'hold'::TEXT AS event_type,
    (CASE WHEN h.priority_level = 1 THEN '1st Hold: ' ELSE '2nd Hold: ' END || h.project_title)::TEXT AS title,
    h.hold_date_start::TIMESTAMPTZ AS start_time,
    (h.hold_date_end::TEXT || ' 23:59:59')::TIMESTAMPTZ AS end_time,
    h.talent_id,
    tp.full_name AS talent_name,
    c.company_name AS client_name,
    (CASE WHEN h.priority_level = 1 THEN '#f59e0b' ELSE '#f97316' END)::TEXT AS color_code, -- Amber / Orange
    jsonb_build_object('priority', h.priority_level, 'status', h.status) AS details_json
  FROM public.holds h
  JOIN public.talent_profiles tp ON tp.id = h.talent_id
  JOIN public.clients c ON c.id = h.client_id
  WHERE h.organization_id = p_org_id
    AND h.hold_date_start <= p_end_date
    AND h.hold_date_end >= p_start_date
    AND (p_talent_id IS NULL OR h.talent_id = p_talent_id)
    AND h.status = 'active';
END;
$$;
```

---

### 2. TypeScript Interfaces & Types

Create `src/types/calendar.ts`:
```ts
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
  start_date: string
  end_date: string
  status: 'unavailable' | 'blackout'
  reason?: string | null
}
```

---

### 3. Server Actions & Service Layer

Create `src/lib/services/calendar.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { CalendarEvent } from '@/types/calendar'

export async function getAgencyCalendarEvents(
  orgId: string,
  startDate: string,
  endDate: string,
  talentId?: string
): Promise<CalendarEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_agency_calendar_events', {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_talent_id: talentId || null,
  })

  if (error) throw new Error(error.message)
  return data || []
}
```

Create `src/app/(dashboard)/talent/availability/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBlackoutPeriodAction(startDate: string, endDate: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found')

  const { error } = await supabase
    .from('talent_availability')
    .insert({
      talent_id: talent.id,
      start_date: startDate,
      end_date: endDate,
      status: 'unavailable',
      reason,
    })

  if (error) throw new Error(error.message)

  revalidatePath('/talent/availability')
  return { success: true }
}

export async function deleteBlackoutPeriodAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('talent_availability')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/talent/availability')
  return { success: true }
}
```

---

### 4. Calendar User Interface

1. **Smart Agency Calendar Screen (`src/app/(dashboard)/agency/calendar/page.tsx`):**
   - Header Controls:
     - View mode toggle: `Month`, `Week`, `Day`, `Agenda`.
     - Month navigation (`< Today >`).
     - Talent Filter Dropdown (Searchable list of agency talent).
     - Event Type Checkbox Filter: Shoots (Green), Auditions (Blue), 1st Holds (Amber), 2nd Holds (Orange).
   - Grid View:
     - Day cells with event pills showing talent name and project title.
     - Badge indicators showing number of overlapping shoots.
   - Interactive Event Drawer:
     - Clicking any event displays a slide-out drawer with:
       - Full project & client info.
       - Talent contact details & comp-card link.
       - Shoot location / Map link / Meeting URL.
       - Actions: "Edit Booking", "View Call Sheet", "Challenge Hold".
2. **Talent Availability Portal (`src/app/(dashboard)/talent/availability/page.tsx`):**
   - Monthly calendar displaying confirmed shoots and blackout days.
   - "Add Blackout Dates" button opening a date-range picker.
   - Legend explaining statuses: Green (Confirmed Shoot), Gray (Marked Unavailable by You), Yellow (Tentative Hold).

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0011_talent_availability.sql` successfully.
- [ ] Log in as talent on `/talent/availability` and mark `2026-11-10` to `2026-11-12` as unavailable with reason "Family Event".
- [ ] Log in as an agency agent and navigate to `/agency/calendar`.
- [ ] Verify confirmed bookings, auditions, and holds appear color-coded in Month and Week views.
- [ ] Test the talent filter dropdown to isolate events for a single talent.
- [ ] Click an event card and ensure the detailed slide-out drawer displays all relevant parameters.
