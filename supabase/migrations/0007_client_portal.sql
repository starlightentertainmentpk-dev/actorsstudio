-- ============================================================
-- CLIENT PORTAL SCHEMA & USER MAPPING
-- Migration: 0007_client_portal.sql
-- ============================================================

-- Add 'client' to user_role enum if not already present
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';

-- Client Portal Users (maps auth users to client companies)
CREATE TABLE IF NOT EXISTS public.client_users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  can_submit_briefs   BOOLEAN NOT NULL DEFAULT TRUE,
  can_approve_talent  BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_invoices   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Briefs (external casting intake)
CREATE TABLE IF NOT EXISTS public.client_briefs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submitted_by_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_title         TEXT NOT NULL,
  target_category_id    UUID REFERENCES public.categories(id),
  gender_preference     gender_type,
  age_range_min         INT,
  age_range_max         INT,
  shoot_dates           TEXT,
  budget_range          TEXT,
  location              TEXT,
  raw_brief_text        TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'submitted', -- submitted | under_review | converted | declined
  converted_casting_id  UUID REFERENCES public.casting_calls(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline stage enum for submissions (supports candidate review workflow)
DO $$ BEGIN
  CREATE TYPE pipeline_stage_enum AS ENUM (
    'new_brief', 'searching', 'shortlisted', 'submitted',
    'client_review', 'audition', 'callback', 'selected',
    'offer', 'booked', 'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Casting Submissions Table (Connects talent, roles, and client review)
CREATE TABLE IF NOT EXISTS public.casting_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casting_call_id       UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  casting_role_id       UUID,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  submitted_by_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  stage                 pipeline_stage_enum NOT NULL DEFAULT 'submitted',
  proposed_fee          NUMERIC(12,2),
  currency              TEXT NOT NULL DEFAULT 'PKR',
  agent_pitch_note      TEXT,
  client_decision       TEXT DEFAULT 'pending', -- pending | shortlisted | rejected | audition_requested | selected
  client_feedback       TEXT,
  client_reviewed_at    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_submissions ENABLE ROW LEVEL SECURITY;

-- Helper function: Get the client_id for the authenticated client user
CREATE OR REPLACE FUNCTION public.get_auth_client_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT client_id FROM public.client_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS: Client users can see their own client mapping
DROP POLICY IF EXISTS "client_users_select_own" ON public.client_users;
CREATE POLICY "client_users_select_own" ON public.client_users
  FOR SELECT USING (user_id = auth.uid());

-- RLS: Agency admins can manage client users for their agency's clients
DROP POLICY IF EXISTS "client_users_agency_manage" ON public.client_users;
CREATE POLICY "client_users_agency_manage" ON public.client_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_users.client_id
        AND c.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- RLS for Client Briefs
DROP POLICY IF EXISTS "client_briefs_client_access" ON public.client_briefs;
CREATE POLICY "client_briefs_client_access" ON public.client_briefs
  FOR ALL USING (client_id = public.get_auth_client_id());

DROP POLICY IF EXISTS "client_briefs_agency_access" ON public.client_briefs;
CREATE POLICY "client_briefs_agency_access" ON public.client_briefs
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- RLS for Casting Submissions Client Access
DROP POLICY IF EXISTS "submissions_client_view" ON public.casting_submissions;
CREATE POLICY "submissions_client_view" ON public.casting_submissions
  FOR SELECT USING (
    client_id = public.get_auth_client_id()
    AND stage IN ('submitted', 'client_review', 'audition', 'callback', 'selected', 'booked')
  );

DROP POLICY IF EXISTS "submissions_client_update" ON public.casting_submissions;
CREATE POLICY "submissions_client_update" ON public.casting_submissions
  FOR UPDATE USING (client_id = public.get_auth_client_id())
  WITH CHECK (client_id = public.get_auth_client_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_users_client ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_user ON public.client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_briefs_client ON public.client_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_briefs_org ON public.client_briefs(organization_id);
CREATE INDEX IF NOT EXISTS idx_casting_submissions_client ON public.casting_submissions(client_id);
