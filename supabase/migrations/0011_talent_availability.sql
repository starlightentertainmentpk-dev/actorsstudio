-- ============================================================
-- TALENT AVAILABILITY & UNIFIED CALENDAR SCHEMA
-- Migration: 0011_talent_availability.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE availability_status_enum AS ENUM ('available', 'unavailable', 'blackout', 'tentative');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_talent_avail_dates ON public.talent_availability(talent_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_talent_avail_status ON public.talent_availability(status);

-- RLS: Talent can manage their own availability
DROP POLICY IF EXISTS "talent_availability_manage_own" ON public.talent_availability;
CREATE POLICY "talent_availability_manage_own" ON public.talent_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = talent_availability.talent_id AND tp.user_id = auth.uid())
  );

-- RLS: Agency members can view all talent availability in their agency
DROP POLICY IF EXISTS "agency_talent_availability_view" ON public.talent_availability;
CREATE POLICY "agency_talent_availability_view" ON public.talent_availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp
      WHERE tp.id = talent_availability.talent_id
        AND tp.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- RLS: Agency members can also manage talent availability
DROP POLICY IF EXISTS "agency_talent_availability_manage" ON public.talent_availability;
CREATE POLICY "agency_talent_availability_manage" ON public.talent_availability
  FOR ALL USING (
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
  -- 1. Bookings (Confirmed shoot days)
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
    jsonb_build_object(
      'location', b.location_address,
      'status', b.status,
      'call_time', b.call_time,
      'wrap_time', b.wrap_time,
      'fee_amount', b.fee_amount,
      'currency', b.currency,
      'usage_rights', b.usage_rights
    ) AS details_json
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
    COALESCE(pp.company_name, 'Studio Casting')::TEXT AS client_name,
    '#3b82f6'::TEXT AS color_code, -- Blue
    jsonb_build_object(
      'mode', a.mode,
      'location', a.location_or_link,
      'score', a.score,
      'feedback', a.feedback,
      'result', a.result
    ) AS details_json
  FROM public.auditions a
  JOIN public.casting_calls cc ON cc.id = a.casting_call_id
  LEFT JOIN public.producer_profiles pp ON pp.id = cc.producer_id
  JOIN public.talent_profiles tp ON tp.id = a.talent_id
  WHERE a.scheduled_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_talent_id IS NULL OR a.talent_id = p_talent_id)
    AND (cc.organization_id = p_org_id OR tp.organization_id = p_org_id)

  UNION ALL

  -- 3. Active Holds (1st and 2nd priority)
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
    jsonb_build_object(
      'priority', h.priority_level,
      'status', h.status,
      'challenged_at', h.challenged_at,
      'challenge_expires_at', h.challenge_expires_at,
      'notes', h.notes
    ) AS details_json
  FROM public.holds h
  JOIN public.talent_profiles tp ON tp.id = h.talent_id
  JOIN public.clients c ON c.id = h.client_id
  WHERE h.organization_id = p_org_id
    AND h.hold_date_start <= p_end_date
    AND h.hold_date_end >= p_start_date
    AND (p_talent_id IS NULL OR h.talent_id = p_talent_id)
    AND h.status IN ('active', 'challenged')

  UNION ALL

  -- 4. Talent Blackouts & Unavailability
  SELECT
    ta.id AS event_id,
    'blackout'::TEXT AS event_type,
    ('Unavailable: ' || COALESCE(ta.reason, 'Personal Blackout'))::TEXT AS title,
    ta.start_date::TIMESTAMPTZ AS start_time,
    (ta.end_date::TEXT || ' 23:59:59')::TIMESTAMPTZ AS end_time,
    ta.talent_id,
    tp.full_name AS talent_name,
    NULL::TEXT AS client_name,
    '#6b7280'::TEXT AS color_code, -- Gray
    jsonb_build_object(
      'status', ta.status,
      'reason', ta.reason
    ) AS details_json
  FROM public.talent_availability ta
  JOIN public.talent_profiles tp ON tp.id = ta.talent_id
  WHERE tp.organization_id = p_org_id
    AND ta.start_date <= p_end_date
    AND ta.end_date >= p_start_date
    AND (p_talent_id IS NULL OR ta.talent_id = p_talent_id);
END;
$$;
