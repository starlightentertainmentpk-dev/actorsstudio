-- ============================================================
-- MULTI-TENANT ORGANIZATIONS SCHEMA
-- ============================================================

-- Agency Types Enum
DO $$ BEGIN
  CREATE TYPE agency_type_enum AS ENUM (
    'talent_agency', 'modeling_agency', 'casting_agency',
    'entertainment_agency', 'influencer_agency', 'creator_management',
    'sports_talent', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization Roles Enum
DO $$ BEGIN
  CREATE TYPE organization_role_enum AS ENUM (
    'super_admin', 'agency_owner', 'agency_admin', 'agent',
    'casting_manager', 'talent_manager', 'finance_manager', 'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  agency_type     agency_type_enum NOT NULL DEFAULT 'talent_agency',
  country         TEXT NOT NULL DEFAULT 'Pakistan',
  currency        TEXT NOT NULL DEFAULT 'PKR',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Karachi',
  logo_url        TEXT,
  brand_color     TEXT DEFAULT '#4f46e5',
  website         TEXT,
  bio             TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Settings Table
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id           UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  public_directory_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  custom_domain             TEXT,
  email_from_name           TEXT,
  email_reply_to            TEXT,
  invoice_notes_default     TEXT,
  settings_json             JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            organization_role_enum NOT NULL DEFAULT 'agent',
  invited_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing entities
ALTER TABLE public.talent_profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.casting_calls 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.producer_profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function: Get organizations the current authenticated user belongs to
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS TABLE(org_id UUID) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

-- RLS Policies for Organizations
DROP POLICY IF EXISTS "org_select_members" ON public.organizations;
CREATE POLICY "org_select_members" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "org_insert_authenticated" ON public.organizations;
CREATE POLICY "org_insert_authenticated" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "org_update_owner_admin" ON public.organizations;
CREATE POLICY "org_update_owner_admin" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
  );

-- RLS Policies for Organization Members
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "org_members_manage" ON public.organization_members;
CREATE POLICY "org_members_manage" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
    OR user_id = auth.uid()
  );

-- RLS Policies for Organization Settings
DROP POLICY IF EXISTS "org_settings_select" ON public.organization_settings;
CREATE POLICY "org_settings_select" ON public.organization_settings
  FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "org_settings_update" ON public.organization_settings;
CREATE POLICY "org_settings_update" ON public.organization_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_settings.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Backfill: Create Default Organization for Existing Data
DO $$
DECLARE
  default_org_id UUID;
  admin_user_id UUID;
BEGIN
  -- Insert default agency if none exists
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'actors-studio-hq') THEN
    INSERT INTO public.organizations (name, slug, agency_type, country, currency, timezone)
    VALUES ('Actors Studio HQ', 'actors-studio-hq', 'talent_agency', 'Pakistan', 'PKR', 'Asia/Karachi')
    RETURNING id INTO default_org_id;

    INSERT INTO public.organization_settings (organization_id, default_commission_rate)
    VALUES (default_org_id, 20.00);

    -- Attach existing talent and casting calls to default org
    UPDATE public.talent_profiles SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.casting_calls SET organization_id = default_org_id WHERE organization_id IS NULL;

    -- Find first studio_admin or super_admin and add as agency_owner
    SELECT id INTO admin_user_id FROM public.users WHERE role IN ('super_admin', 'studio_admin') LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (default_org_id, admin_user_id, 'agency_owner')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
