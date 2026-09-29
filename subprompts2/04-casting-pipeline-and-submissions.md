# Sub-Prompt 04 — Visual Kanban Casting Pipeline, Candidate Matching & Client Submissions Workflow

**Phase:** Casting Operations — Sub-Prompt 4 of 10  
**Depends on:** Existing `casting_calls`, `applications`, `01-multi-tenant-organizations.md`, `02-client-crm-and-contacts.md`  
**Delivers:** Role breakdown per casting project, full 11-stage visual Kanban pipeline (`@dnd-kit`), candidate submission workflow to clients with fee proposals, and bulk pipeline operations.

---

## 🎯 Architectural Context & Additive Strategy

The existing Actor's Studio codebase has basic casting calls where talent can apply directly.  
This prompt implements the agency-grade **Casting Operating Engine** specified in Sections 17, 18, 19, and 74 of `masterprompt1.md`:
1. **Multi-Role Projects:** A single casting call can have multiple specific roles (e.g. "Main Lead", "Mother", "Stunt Double") with distinct criteria.
2. **Visual Drag-and-Drop Kanban Board:** Utilizes the installed `@dnd-kit/core` and `@dnd-kit/sortable` packages to provide smooth drag-and-drop between pipeline stages:
   `New Brief` → `Searching` → `Shortlisted` → `Submitted` → `Client Review` → `Audition` → `Callback` → `Selected` → `Offer` → `Booked` → `Completed`.
3. **Formal Client Submission Drawer:** Agents can package talent candidates, set a proposed client fee, write custom pitch notes, and submit them directly to the client's portal.
4. **Bulk Candidate Operations:** Bulk move stages, bulk export candidate comp cards, or bulk request self-tapes.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0008_casting_pipeline.sql`

```sql
-- ============================================================
-- ADVANCED CASTING PIPELINE & SUBMISSIONS SCHEMA
-- ============================================================

-- Pipeline Stage Enum (11 Stages)
CREATE TYPE pipeline_stage_enum AS ENUM (
  'new_brief', 'searching', 'shortlisted', 'submitted',
  'client_review', 'audition', 'callback', 'selected',
  'offer', 'booked', 'completed'
);

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
CREATE INDEX idx_casting_roles_call ON public.casting_roles(casting_call_id);
CREATE INDEX idx_submissions_stage ON public.casting_submissions(stage);
CREATE INDEX idx_submissions_talent ON public.casting_submissions(talent_id);
CREATE INDEX idx_submissions_org ON public.casting_submissions(organization_id);

-- RLS: Agency members access
CREATE POLICY "casting_roles_org_isolation" ON public.casting_roles
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "submissions_org_isolation" ON public.casting_submissions
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "shortlists_org_isolation" ON public.shortlists
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "shortlist_items_access" ON public.shortlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      WHERE s.id = shortlist_items.shortlist_id
        AND s.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- Client Users can view submissions explicitly submitted to their client account
CREATE POLICY "submissions_client_view" ON public.casting_submissions
  FOR SELECT USING (
    client_id = public.get_auth_client_id()
    AND stage IN ('submitted', 'client_review', 'audition', 'callback', 'selected', 'booked')
  );
```

---

### 2. TypeScript Interfaces & Zod Validation

Create `src/types/pipeline.ts`:
```ts
export type PipelineStage =
  | 'new_brief'
  | 'searching'
  | 'shortlisted'
  | 'submitted'
  | 'client_review'
  | 'audition'
  | 'callback'
  | 'selected'
  | 'offer'
  | 'booked'
  | 'completed'

export interface CastingRole {
  id: string
  casting_call_id: string
  role_name: string
  role_type: string
  gender_requirement?: string | null
  age_min?: number | null
  age_max?: number | null
  pay_rate?: string | null
  description?: string | null
}

export interface PipelineCandidate {
  id: string
  casting_call_id: string
  casting_role_id?: string | null
  talent_id: string
  stage: PipelineStage
  proposed_fee?: number | null
  currency: string
  agent_pitch_note?: string | null
  client_decision?: string | null
  client_feedback?: string | null
  talent: {
    id: string
    full_name: string
    stage_name?: string | null
    city?: string | null
    height_cm?: number | null
    is_available: boolean
    user_id: string
    avatar_url?: string | null
  }
  role?: CastingRole | null
}
```

Create `src/lib/validations/pipeline.ts`:
```ts
import { z } from 'zod'

export const moveCandidateStageSchema = z.object({
  submissionId: z.string().uuid(),
  newStage: z.enum([
    'new_brief', 'searching', 'shortlisted', 'submitted',
    'client_review', 'audition', 'callback', 'selected',
    'offer', 'booked', 'completed'
  ]),
})

export const submitToClientSchema = z.object({
  submissionId: z.string().uuid(),
  clientId: z.string().uuid(),
  proposedFee: z.coerce.number().min(0, 'Proposed fee must be positive'),
  currency: z.string().default('PKR'),
  agentPitchNote: z.string().optional(),
})

export const castingRoleSchema = z.object({
  casting_call_id: z.string().uuid(),
  role_name: z.string().min(2, 'Role name is required'),
  role_type: z.enum(['lead', 'supporting', 'extra', 'voiceover']).default('lead'),
  gender_requirement: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  age_min: z.coerce.number().optional(),
  age_max: z.coerce.number().optional(),
  pay_rate: z.string().optional(),
  description: z.string().optional(),
})
```

---

### 3. Server Actions & Pipeline Service

Create `src/app/(dashboard)/agency/casting/[id]/pipeline/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { moveCandidateStageSchema, submitToClientSchema } from '@/lib/validations/pipeline'
import { revalidatePath } from 'next/cache'

export async function moveCandidateStageAction(submissionId: string, newStage: string) {
  const supabase = await createClient()
  const validated = moveCandidateStageSchema.parse({ submissionId, newStage })

  const { error } = await supabase
    .from('casting_submissions')
    .update({ stage: validated.newStage, updated_at: new Date().toISOString() })
    .eq('id', validated.submissionId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/casting')
  return { success: true }
}

export async function submitCandidateToClientAction(data: {
  submissionId: string
  clientId: string
  proposedFee: number
  currency: string
  agentPitchNote?: string
}) {
  const supabase = await createClient()
  const validated = submitToClientSchema.parse(data)

  const { error } = await supabase
    .from('casting_submissions')
    .update({
      client_id: validated.clientId,
      proposed_fee: validated.proposedFee,
      currency: validated.currency,
      agent_pitch_note: validated.agentPitchNote,
      stage: 'submitted',
      client_decision: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', validated.submissionId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/casting')
  return { success: true }
}

export async function bulkUpdateStageAction(submissionIds: string[], newStage: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('casting_submissions')
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .in('id', submissionIds)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/casting')
  return { success: true }
}
```

---

### 4. Drag-and-Drop Kanban Board UI (`@dnd-kit`)

Create `src/app/(dashboard)/agency/casting/[id]/pipeline/page.tsx`:
- Header: Casting Project Title, Client Badge, Shoot Dates, "Add Talent" button, "New Role" button.
- Role Filter Tabs: "All Roles" + individual tabs for each defined `casting_role`.
- Kanban Container utilizing `DndContext`, `PointerSensor`, and `rectIntersection` from `@dnd-kit/core`:
  - Columns mapped to stages:
    1. **Shortlisted**
    2. **Submitted to Client**
    3. **Client Review**
    4. **Audition / Self-Tape**
    5. **Callback**
    6. **Selected / Offer**
    7. **Booked**
  - **Candidate Card (`src/components/features/casting/PipelineCandidateCard.tsx`):**
    - Drag Handle
    - Talent Thumbnail & Stage Name
    - Role badge
    - Availability status indicator (Green dot for available, Yellow for hold)
    - Proposed fee badge (e.g. `PKR 150,000`)
    - Client feedback indicator (e.g. Green tick if client approved, speech bubble with feedback preview)
    - Quick actions menu: "Submit to Client", "Schedule Audition", "Request Self-Tape", "Remove"
- **Submit to Client Modal (`src/components/features/casting/SubmitToClientModal.tsx`):**
  - Select target client company & primary contact.
  - Input proposed talent fee & currency.
  - Agent pitch text box ("Ideal match for the lead character with 5 years acting experience").
  - Preview card of comp-card details.
  - "Submit to Client Portal" action button.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0008_casting_pipeline.sql` without errors.
- [ ] In the agency casting dashboard, navigate to `/agency/casting/[id]/pipeline`.
- [ ] Add 2 roles to the project (e.g., "Main Lead", "Supporting Artist").
- [ ] Move a candidate card between columns (e.g., from `Shortlisted` to `Audition`) using drag and drop; verify the stage is persisted in Supabase.
- [ ] Open the "Submit to Client" drawer, fill in proposed fee and pitch note, and click Submit.
- [ ] Log in as the corresponding client user and verify the submitted candidate card appears in `/client/projects/[id]`.
