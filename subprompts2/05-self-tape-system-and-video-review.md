# Sub-Prompt 05 — Self-Tape Workflow, Video Uploads & Media Review Suite

**Phase:** Audition & Media Operations — Sub-Prompt 5 of 10  
**Depends on:** `04-casting-pipeline-and-submissions.md` (Casting Pipeline), existing Supabase Storage  
**Delivers:** Complete self-tape request workflow, talent video submission portal with upload progress, secure signed storage URLs, and agency/client video review suite with timestamped feedback.

---

## 🎯 Architectural Context & Additive Strategy

Sections 12, 20, and 55 of `masterprompt1.md` specify a dedicated, upload-first **Self-Tape System**.  
In the existing codebase, talent media is uploaded to a general `talent-media` storage bucket.  
In this prompt, we add an enterprise-grade self-tape loop:
1. **Agent/Client Request:** Agency staff or corporate clients trigger a "Request Self-Tape" for a candidate on the casting pipeline, uploading sides (PDF script) and setting a deadline.
2. **Talent Submission Portal:** Talent sees pending requests in `/talent/self-tapes`, downloads scene instructions/script, records their tape, and uploads directly to a private `self-tapes` Supabase Storage bucket with live progress percentage.
3. **Dedicated Review Suite:** Agents and clients access an interactive video review player with speed controls (0.75x, 1x, 1.25x, 1.5x), timestamped commentary, and instant decision buttons (Shortlist, Request Re-Tape, Pass, Select).
4. **Realtime Updates:** Instant notification badge and live status update via Supabase Realtime when talent uploads a tape.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0009_self_tapes.sql`

```sql
-- ============================================================
-- SELF-TAPE SYSTEM SCHEMA
-- ============================================================

CREATE TYPE self_tape_status_enum AS ENUM (
  'requested', 'submitted', 'under_review', 'approved', 'rejected', 'retape_requested', 'expired'
);

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
CREATE INDEX idx_self_tape_req_talent ON public.self_tape_requests(talent_id);
CREATE INDEX idx_self_tape_req_call ON public.self_tape_requests(casting_call_id);
CREATE INDEX idx_self_tape_sub_req ON public.self_tape_submissions(self_tape_request_id);

-- Storage bucket configuration for self-tapes
INSERT INTO storage.buckets (id, name, public)
VALUES ('self-tapes', 'self-tapes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Talent can view and submit their own self-tape requests
CREATE POLICY "talent_self_tape_requests_view" ON public.self_tape_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = self_tape_requests.talent_id AND tp.user_id = auth.uid())
  );

CREATE POLICY "talent_self_tape_submissions_manage" ON public.self_tape_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = self_tape_submissions.talent_id AND tp.user_id = auth.uid())
  );

-- RLS: Agency members can manage self-tapes for their organization
CREATE POLICY "agency_self_tape_requests_manage" ON public.self_tape_requests
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "agency_self_tape_submissions_view" ON public.self_tape_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.self_tape_requests str
      WHERE str.id = self_tape_submissions.self_tape_request_id
        AND str.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

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
```

---

### 2. TypeScript Types & Zod Schemas

Create `src/types/self-tape.ts`:
```ts
export type SelfTapeStatus =
  | 'requested'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'retape_requested'
  | 'expired'

export interface SelfTapeRequest {
  id: string
  organization_id: string
  casting_call_id: string
  casting_role_id?: string | null
  talent_id: string
  instructions: string
  sides_script_url?: string | null
  deadline_at: string
  status: SelfTapeStatus
  created_at: string
  casting_call?: {
    title: string
  }
  role?: {
    role_name: string
  }
  submission?: SelfTapeSubmission | null
}

export interface SelfTapeSubmission {
  id: string
  self_tape_request_id: string
  talent_id: string
  video_storage_path: string
  video_signed_url?: string
  video_duration_sec?: number | null
  file_size_bytes?: number | null
  talent_notes?: string | null
  submitted_at: string
  status: SelfTapeStatus
  reviews?: SelfTapeReview[]
}

export interface SelfTapeReview {
  id: string
  self_tape_submission_id: string
  reviewer_user_id: string
  reviewer_type: 'agency' | 'client'
  score?: number | null
  timestamp_sec?: number | null
  comments: string
  decision?: string | null
  created_at: string
  reviewer?: {
    email: string
  }
}
```

Create `src/lib/validations/self-tape.ts`:
```ts
import { z } from 'zod'

export const requestSelfTapeSchema = z.object({
  casting_call_id: z.string().uuid(),
  casting_role_id: z.string().uuid().optional().or(z.literal('')),
  talent_id: z.string().uuid(),
  client_id: z.string().uuid().optional().or(z.literal('')),
  instructions: z.string().min(10, 'Provide scene instructions and framing notes (e.g. Medium close-up, natural lighting)'),
  sides_script_url: z.string().url().optional().or(z.literal('')),
  deadline_at: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid deadline timestamp'),
})

export const submitSelfTapeSchema = z.object({
  self_tape_request_id: z.string().uuid(),
  video_storage_path: z.string().min(1, 'Video file path is required'),
  talent_notes: z.string().optional(),
  video_duration_sec: z.coerce.number().optional(),
  file_size_bytes: z.coerce.number().optional(),
})

export const selfTapeReviewSchema = z.object({
  self_tape_submission_id: z.string().uuid(),
  timestamp_sec: z.coerce.number().optional(),
  comments: z.string().min(2, 'Comment cannot be blank'),
  score: z.coerce.number().min(0).max(10).optional(),
  decision: z.enum(['shortlist', 'pass', 're_tape', 'select']).optional(),
})
```

---

### 3. Server Actions & Signed URL Helpers

Create `src/app/(dashboard)/talent/self-tapes/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { submitSelfTapeSchema } from '@/lib/validations/self-tape'
import { revalidatePath } from 'next/cache'

export async function submitSelfTapeAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found')

  const raw = {
    self_tape_request_id: formData.get('self_tape_request_id'),
    video_storage_path: formData.get('video_storage_path'),
    talent_notes: formData.get('talent_notes') || undefined,
    video_duration_sec: formData.get('video_duration_sec') || undefined,
    file_size_bytes: formData.get('file_size_bytes') || undefined,
  }

  const validated = submitSelfTapeSchema.parse(raw)

  // 1. Insert submission
  const { data: sub, error: subError } = await supabase
    .from('self_tape_submissions')
    .insert({
      self_tape_request_id: validated.self_tape_request_id,
      talent_id: talent.id,
      video_storage_path: validated.video_storage_path,
      talent_notes: validated.talent_notes,
      video_duration_sec: validated.video_duration_sec,
      file_size_bytes: validated.file_size_bytes,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (subError) throw new Error(subError.message)

  // 2. Update request status
  await supabase
    .from('self_tape_requests')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', validated.self_tape_request_id)

  revalidatePath('/talent/self-tapes')
  return { success: true, submissionId: sub.id }
}

export async function getSelfTapeSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .storage
    .from('self-tapes')
    .createSignedUrl(storagePath, 3600) // 1 hour token

  if (error || !data) throw new Error('Could not generate signed video URL')
  return data.signedUrl
}
```

---

### 4. Video Player & Review UI

1. **Talent Self-Tape Center (`src/app/(dashboard)/talent/self-tapes/page.tsx`):**
   - Pending Requests List:
     - Casting Title & Role Name.
     - Scene instructions callout.
     - Download Script / Sides button.
     - Deadline countdown badge (e.g., "Due in 18 hours").
     - **Upload Component:** Drag-and-drop video area (accepts `.mp4`, `.mov`, `.webm`, max 250MB), client-side chunk upload indicator with progress bar.
     - "Replace submission before deadline" feature.
2. **Review Suite Component (`src/components/features/casting/SelfTapeReviewSuite.tsx`):**
   - Custom Video Player with:
     - Time scrubber with jump-to-timestamp capability.
     - Playback speed switcher (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
     - Fullscreen toggle.
   - Right Side Review Panel:
     - Candidate comp-card preview.
     - Timestamped comments feed: Clicking a comment jumps video playback to that exact second.
     - Add comment input with auto-detected current video playback timestamp (`MM:SS`).
     - Decision Action Buttons:
       - **Shortlist Candidate** (Green)
       - **Request Re-Tape** (Amber, prompts for re-take instructions)
       - **Pass / Decline** (Red)

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0009_self_tapes.sql` without errors.
- [ ] As an agent on `/agency/casting/[id]/pipeline`, click "Request Self-Tape" for a candidate with a 48h deadline.
- [ ] Log in as the candidate talent on `/talent/self-tapes`, view the request, download sides, and upload an `.mp4` video.
- [ ] Verify the file is uploaded to the private `self-tapes` bucket and marked `submitted`.
- [ ] Open the Self-Tape Review Suite as the agent; verify video playback functions properly via Supabase signed URLs.
- [ ] Leave a comment at `00:15`, click it to ensure video seeks to 15s, and mark candidate as "Shortlist".
