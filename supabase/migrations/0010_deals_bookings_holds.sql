-- ============================================================
-- DEALS, BOOKINGS & HOLD PRIORITY SCHEMA
-- Migration: 0010_deals_bookings_holds.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE deal_status_enum AS ENUM (
    'lead', 'proposal', 'negotiation', 'approved', 'contract',
    'booked', 'completed', 'invoiced', 'paid', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE hold_status_enum AS ENUM ('active', 'challenged', 'confirmed', 'released', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Deals Table (Commercial agreements)
CREATE TABLE IF NOT EXISTS public.deals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id                 UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  casting_call_id           UUID REFERENCES public.casting_calls(id) ON DELETE SET NULL,
  talent_id                 UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  deal_name                 TEXT NOT NULL,
  deal_value                NUMERIC(12,2) NOT NULL,
  agency_commission_amount  NUMERIC(12,2) NOT NULL,
  talent_payout_amount      NUMERIC(12,2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'PKR',
  payment_terms             TEXT DEFAULT 'Net 30',
  status                    deal_status_enum NOT NULL DEFAULT 'proposal',
  start_date                DATE,
  end_date                  DATE,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings Table (Shoot schedule, call sheets, rights)
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id           UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  project_name      TEXT NOT NULL,
  shoot_date_start  DATE NOT NULL,
  shoot_date_end    DATE NOT NULL,
  call_time         TIME,
  wrap_time         TIME,
  location_address  TEXT,
  fee_amount        NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'PKR',
  usage_rights      TEXT NOT NULL, -- e.g. "1 Year Digital + TVC"
  territory         TEXT NOT NULL DEFAULT 'Pakistan', -- Pakistan | GCC | Worldwide
  media             TEXT NOT NULL DEFAULT 'TV, Digital, Social',
  status            booking_status_enum NOT NULL DEFAULT 'draft',
  conflict_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Holds Table (First / Second / Third Hold priority)
CREATE TABLE IF NOT EXISTS public.holds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  hold_date_start       DATE NOT NULL,
  hold_date_end         DATE NOT NULL,
  priority_level        INT NOT NULL DEFAULT 1, -- 1 = First Hold, 2 = Second Hold
  project_title         TEXT NOT NULL,
  status                hold_status_enum NOT NULL DEFAULT 'active',
  challenged_at         TIMESTAMPTZ,
  challenge_expires_at  TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holds ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_org ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_talent ON public.deals(talent_id);
CREATE INDEX IF NOT EXISTS idx_deals_client ON public.deals(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_org ON public.bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_talent_dates ON public.bookings(talent_id, shoot_date_start, shoot_date_end);
CREATE INDEX IF NOT EXISTS idx_holds_org ON public.holds(organization_id);
CREATE INDEX IF NOT EXISTS idx_holds_talent_dates ON public.holds(talent_id, hold_date_start, hold_date_end);

-- RLS: Agency members access
DROP POLICY IF EXISTS "deals_org_isolation" ON public.deals;
CREATE POLICY "deals_org_isolation" ON public.deals
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "bookings_org_isolation" ON public.bookings;
CREATE POLICY "bookings_org_isolation" ON public.bookings
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "holds_org_isolation" ON public.holds;
CREATE POLICY "holds_org_isolation" ON public.holds
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- Talent can view their confirmed bookings
DROP POLICY IF EXISTS "bookings_talent_view" ON public.bookings;
CREATE POLICY "bookings_talent_view" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = bookings.talent_id AND tp.user_id = auth.uid())
    AND status = 'confirmed'
  );

-- Talent can view active holds placed on them
DROP POLICY IF EXISTS "holds_talent_view" ON public.holds;
CREATE POLICY "holds_talent_view" ON public.holds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = holds.talent_id AND tp.user_id = auth.uid())
  );
