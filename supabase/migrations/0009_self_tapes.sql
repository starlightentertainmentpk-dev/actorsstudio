-- ============================================================
-- SELF-TAPE SYSTEM SCHEMA
-- Migration: 0009_self_tapes.sql
-- ============================================================

DO $$ BEGIN
  CREATE TYPE self_tape_status_enum AS ENUM (
    'requested', 'submitted', 'under_review', 'approved', 'rejected', 'retape_requested', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Self-Tape Requests Table
CREATE TABLE IF NOT EXISTS public.self_tape_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  casting_call_id       UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  casting_role_id       UUID REFERENCES public.casting_roles(id) ON DELETE SET NULL,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  requested_by_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  instructions          TEXT NOT NULL,
  sides_script_url      TEXT, -- downloadable PDF script
  deadline_at           TIMESTAMPTZ NOT NULL,
  status                self_tape_status_enum NOT NULL DEFAULT 'requested',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-Tape Submissions Table
CREATE TABLE IF NOT EXISTS public.self_tape_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  self_tape_request_id  UUID NOT NULL REFERENCES public.self_tape_requests(id) ON DELETE CASCADE,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  video_storage_path    TEXT NOT NULL,
  video_duration_sec    NUMERIC(8,2),
  file_size_bytes       BIGINT,
  talent_notes          TEXT,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                self_tape_status_enum NOT NULL DEFAULT 'submitted'
);

-- Self-Tape Reviews & Timestamped Comments
CREATE TABLE IF NOT EXISTS public.self_tape_reviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  self_tape_submission_id UUID NOT NULL REFERENCES public.self_tape_submissions(id) ON DELETE CASCADE,
  reviewer_user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_type           TEXT NOT NULL DEFAULT 'agency', -- agency | client
  score                   NUMERIC(4,2), -- 0.00 - 10.00
  timestamp_sec           NUMERIC(8,2), -- exact video second comment is anchored to
  comments                TEXT NOT NULL,
  decision                TEXT, -- shortlist | pass | re_tape | select
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.self_tape_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_tape_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_tape_reviews ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_self_tape_req_talent ON public.self_tape_requests(talent_id);
CREATE INDEX IF NOT EXISTS idx_self_tape_req_call ON public.self_tape_requests(casting_call_id);
CREATE INDEX IF NOT EXISTS idx_self_tape_req_org ON public.self_tape_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_self_tape_sub_req ON public.self_tape_submissions(self_tape_request_id);
CREATE INDEX IF NOT EXISTS idx_self_tape_sub_talent ON public.self_tape_submissions(talent_id);
CREATE INDEX IF NOT EXISTS idx_self_tape_reviews_sub ON public.self_tape_reviews(self_tape_submission_id);

-- Storage bucket configuration for self-tapes (Private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('self-tapes', 'self-tapes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for self-tapes
DROP POLICY IF EXISTS "authenticated users upload self-tapes" ON storage.objects;
CREATE POLICY "authenticated users upload self-tapes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'self-tapes');

DROP POLICY IF EXISTS "authenticated users view self-tapes" ON storage.objects;
CREATE POLICY "authenticated users view self-tapes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'self-tapes');

-- RLS: Talent can view and submit their own self-tape requests
DROP POLICY IF EXISTS "talent_self_tape_requests_view" ON public.self_tape_requests;
CREATE POLICY "talent_self_tape_requests_view" ON public.self_tape_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = self_tape_requests.talent_id AND tp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "talent_self_tape_submissions_manage" ON public.self_tape_submissions;
CREATE POLICY "talent_self_tape_submissions_manage" ON public.self_tape_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = self_tape_submissions.talent_id AND tp.user_id = auth.uid())
  );

-- RLS: Agency members can manage self-tapes for their organization
DROP POLICY IF EXISTS "agency_self_tape_requests_manage" ON public.self_tape_requests;
CREATE POLICY "agency_self_tape_requests_manage" ON public.self_tape_requests
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

DROP POLICY IF EXISTS "agency_self_tape_submissions_view" ON public.self_tape_submissions;
CREATE POLICY "agency_self_tape_submissions_view" ON public.self_tape_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.self_tape_requests str
      WHERE str.id = self_tape_submissions.self_tape_request_id
        AND str.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "self_tape_reviews_access" ON public.self_tape_reviews;
CREATE POLICY "self_tape_reviews_access" ON public.self_tape_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.self_tape_submissions sts
      JOIN public.self_tape_requests str ON str.id = sts.self_tape_request_id
      WHERE sts.id = self_tape_reviews.self_tape_submission_id
        AND (
          str.organization_id IN (SELECT public.get_auth_user_org_ids())
          OR str.client_id = public.get_auth_client_id()
        )
    )
  );
