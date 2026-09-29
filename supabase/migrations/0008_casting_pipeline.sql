-- ============================================================
-- ADVANCED CASTING PIPELINE & SUBMISSIONS SCHEMA
-- Migration: 0008_casting_pipeline.sql
-- ============================================================

-- Pipeline Stage Enum (11 Stages)
DO $$ BEGIN
  CREATE TYPE pipeline_stage_enum AS ENUM (
    'new_brief', 'searching', 'shortlisted', 'submitted',
    'client_review', 'audition', 'callback', 'selected',
    'offer', 'booked', 'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Casting Roles Table (Specific characters/parts within a project)
CREATE TABLE IF NOT EXISTS public.casting_roles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_call_id     UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_name           TEXT NOT NULL,
  role_type           TEXT NOT NULL DEFAULT 'lead', -- lead | supporting | extra | voiceover
  gender_requirement  gender_type,
  age_min             INT,
  age_max             INT,
  height_cm_min       NUMERIC(5,2),
  height_cm_max       NUMERIC(5,2),
  pay_rate            TEXT,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Casting Submissions Table (Connects talent, roles, and client review)
CREATE TABLE IF NOT EXISTS public.casting_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casting_call_id       UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  casting_role_id       UUID REFERENCES public.casting_roles(id) ON DELETE SET NULL,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  submitted_by_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  stage                 pipeline_stage_enum NOT NULL DEFAULT 'shortlisted',
  proposed_fee          NUMERIC(12,2),
  currency              TEXT NOT NULL DEFAULT 'PKR',
  agent_pitch_note      TEXT,
  client_decision       TEXT DEFAULT 'pending', -- pending | shortlisted | rejected | audition_requested | selected
  client_feedback       TEXT,
  client_reviewed_at    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(casting_call_id, talent_id, casting_role_id)
);

-- Shortlists Table (Custom shareable talent lists)
CREATE TABLE IF NOT EXISTS public.shortlists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shortlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id UUID NOT NULL REFERENCES public.shortlists(id) ON DELETE CASCADE,
  talent_id    UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT,
  UNIQUE(shortlist_id, talent_id)
);

-- Enable RLS
ALTER TABLE public.casting_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casting_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_casting_roles_call ON public.casting_roles(casting_call_id);
CREATE INDEX IF NOT EXISTS idx_casting_roles_org ON public.casting_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_stage ON public.casting_submissions(stage);
CREATE INDEX IF NOT EXISTS idx_submissions_talent ON public.casting_submissions(talent_id);
CREATE INDEX IF NOT EXISTS idx_submissions_org ON public.casting_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_submissions_call ON public.casting_submissions(casting_call_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_org ON public.shortlists(organization_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_items_shortlist ON public.shortlist_items(shortlist_id);

-- RLS: Agency members access
DROP POLICY IF EXISTS "casting_roles_org_isolation" ON public.casting_roles;
CREATE POLICY "casting_roles_org_isolation" ON public.casting_roles
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "submissions_org_isolation" ON public.casting_submissions;
CREATE POLICY "submissions_org_isolation" ON public.casting_submissions
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "shortlists_org_isolation" ON public.shortlists;
CREATE POLICY "shortlists_org_isolation" ON public.shortlists
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "shortlist_items_access" ON public.shortlist_items;
CREATE POLICY "shortlist_items_access" ON public.shortlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      WHERE s.id = shortlist_items.shortlist_id
        AND s.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- Client Users can view submissions explicitly submitted to their client account
DROP POLICY IF EXISTS "submissions_client_view" ON public.casting_submissions;
CREATE POLICY "submissions_client_view" ON public.casting_submissions
  FOR SELECT USING (
    client_id = public.get_auth_client_id()
    AND stage IN ('submitted', 'client_review', 'audition', 'callback', 'selected', 'booked')
  );
