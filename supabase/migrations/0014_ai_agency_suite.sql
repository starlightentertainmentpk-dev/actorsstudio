-- ============================================================
-- AI AGENCY SUITE SCHEMA
-- Migration: 0014_ai_agency_suite.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE ai_feature_type_enum AS ENUM (
    'talent_matching', 'brief_parser', 'profile_builder',
    'contract_analyzer', 'email_generator', 'assistant_chat'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AI Usage & Audit Log Table
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_type      ai_feature_type_enum NOT NULL,
  model_name        TEXT NOT NULL,
  prompt_summary    TEXT,
  response_summary  TEXT,
  tokens_used       INT,
  latency_ms        INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Generated Candidate Match Shortlists Table
CREATE TABLE IF NOT EXISTS public.ai_match_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casting_call_id     UUID REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  brief_query         TEXT NOT NULL,
  results_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_results ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_req_org ON public.ai_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_match_call ON public.ai_match_results(casting_call_id);

-- RLS: Agency members access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_requests_org_isolation' AND tablename = 'ai_requests') THEN
    CREATE POLICY "ai_requests_org_isolation" ON public.ai_requests
      FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_matches_org_isolation' AND tablename = 'ai_match_results') THEN
    CREATE POLICY "ai_matches_org_isolation" ON public.ai_match_results
      FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));
  END IF;
END $$;
