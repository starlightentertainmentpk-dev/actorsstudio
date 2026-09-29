# Sub-Prompt 03 — Dedicated Client Portal Experience, External Briefs & Secure Review Workflow

**Phase:** Commercial Operations & Portals — Sub-Prompt 3 of 10  
**Depends on:** `02-client-crm-and-contacts.md` (Client CRM) & existing `casting_calls` / `applications`  
**Delivers:** Client Portal layout (`/client/*`), client user authentication mapping, external casting brief submission, candidate review & shortlisting interface, and strict client data isolation RLS.

---

## 🎯 Architectural Context & Additive Strategy

Professional talent agencies do not just use internal dashboards; they provide their corporate clients (directors, production houses, marketing managers) with a **branded Client Portal** (Section 23 of `masterprompt1.md`).
In this prompt, we add the `/client/*` experience to the existing Next.js App Router:
1. **Client User Binding:** Associates authenticated Supabase users with role `client` to their corresponding `clients` record via `client_users`.
2. **Absolute Data Isolation (RLS):** Clients can only see projects, submissions, and auditions explicitly submitted to them. They **never** see internal agency notes, agent commissions, or candidate contact info.
3. **Candidate Review Suite:** Clients can browse presented talent cards, watch showreels, listen to voice samples, and click **Shortlist**, **Request Audition**, or **Decline**.
4. **Self-Service Brief Submission:** Clients can submit casting briefs directly into the agency's intake queue.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0007_client_portal.sql`

```sql
-- ============================================================
-- CLIENT PORTAL SCHEMA & USER MAPPING
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

-- Enable RLS
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_briefs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get the client_id for the authenticated client user
CREATE OR REPLACE FUNCTION public.get_auth_client_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT client_id FROM public.client_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS: Client users can see their own client mapping
CREATE POLICY "client_users_select_own" ON public.client_users
  FOR SELECT USING (user_id = auth.uid());

-- RLS: Agency admins can manage client users for their agency's clients
CREATE POLICY "client_users_agency_manage" ON public.client_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_users.client_id
        AND c.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

-- RLS for Client Briefs
CREATE POLICY "client_briefs_client_access" ON public.client_briefs
  FOR ALL USING (client_id = public.get_auth_client_id());

CREATE POLICY "client_briefs_agency_access" ON public.client_briefs
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));
```

---

### 2. TypeScript Types & Zod Schemas

Create `src/types/client-portal.ts`:
```ts
export interface ClientUser {
  id: string
  client_id: string
  user_id: string
  can_submit_briefs: boolean
  can_approve_talent: boolean
  can_view_invoices: boolean
  client?: {
    company_name: string
    organization_id: string
  }
}

export interface ClientBrief {
  id: string
  client_id: string
  organization_id: string
  project_title: string
  target_category_id?: string | null
  gender_preference?: string | null
  age_range_min?: number | null
  age_range_max?: number | null
  shoot_dates?: string | null
  budget_range?: string | null
  location?: string | null
  raw_brief_text: string
  status: 'submitted' | 'under_review' | 'converted' | 'declined'
  created_at: string
}
```

Create `src/lib/validations/client-portal.ts`:
```ts
import { z } from 'zod'

export const clientBriefSchema = z.object({
  project_title: z.string().min(3, 'Project title is required'),
  target_category_id: z.string().uuid().optional().or(z.literal('')),
  gender_preference: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  age_range_min: z.coerce.number().min(0).max(100).optional(),
  age_range_max: z.coerce.number().min(0).max(100).optional(),
  shoot_dates: z.string().optional(),
  budget_range: z.string().optional(),
  location: z.string().optional(),
  raw_brief_text: z.string().min(10, 'Please provide details about the project requirements'),
})
```

---

### 3. Client Portal Shell & Navigation

Create `src/app/(dashboard)/client/layout.tsx`:
- Render dedicated top bar and navigation designed specifically for brand/producer clients:
  - Brand Logo + Agency Representation label ("Powered by [Agency Name]")
  - Nav Links:
    - **Dashboard** (`/client/dashboard`)
    - **Casting Reviews** (`/client/projects`)
    - **Submit Brief** (`/client/briefs/new`)
    - **My Briefs** (`/client/briefs`)
    - **Invoices** (`/client/invoices`)
- Restrict route access: If the logged-in user does NOT have role `'client'`, redirect to `/unauthorized`.

---

### 4. Client Portal Screens & Actions

Create Server Actions in `src/app/(dashboard)/client/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { clientBriefSchema } from '@/lib/validations/client-portal'
import { revalidatePath } from 'next/cache'

export async function submitClientBriefAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get client details
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('client_id, clients(organization_id)')
    .eq('user_id', user.id)
    .single()

  if (!clientUser) throw new Error('Client account not found')

  const raw = {
    project_title: formData.get('project_title'),
    target_category_id: formData.get('target_category_id') || undefined,
    gender_preference: formData.get('gender_preference') || undefined,
    age_range_min: formData.get('age_range_min') || undefined,
    age_range_max: formData.get('age_range_max') || undefined,
    shoot_dates: formData.get('shoot_dates') || undefined,
    budget_range: formData.get('budget_range') || undefined,
    location: formData.get('location') || undefined,
    raw_brief_text: formData.get('raw_brief_text'),
  }

  const validated = clientBriefSchema.parse(raw)

  const { data, error } = await supabase
    .from('client_briefs')
    .insert({
      ...validated,
      client_id: clientUser.client_id,
      organization_id: (clientUser.clients as any).organization_id,
      submitted_by_user_id: user.id
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/client/briefs')
  return { success: true, briefId: data.id }
}

export async function reviewCandidateAction(submissionId: string, decision: 'shortlist' | 'reject' | 'audition_request', feedback?: string) {
  const supabase = await createClient()
  
  // Update candidate submission state
  const { error } = await supabase
    .from('casting_submissions')
    .update({
      client_decision: decision,
      client_feedback: feedback,
      client_reviewed_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  if (error) throw new Error(error.message)

  revalidatePath('/client/projects')
  return { success: true }
}
```

1. **Client Dashboard (`src/app/(dashboard)/client/dashboard/page.tsx`):**
   - KPI Cards: "Active Projects", "Talent Candidates for Review", "Upcoming Auditions", "Briefs Under Agency Review".
   - Quick action banner: "Have a new campaign or film shoot? Submit a new casting brief."
   - Recent activity list.
2. **Client Project Review Screen (`src/app/(dashboard)/client/projects/[id]/page.tsx`):**
   - Presents curated talent submitted by the agency.
   - For each candidate:
     - Profile headshot & stage name.
     - Height, age range, location, key skills.
     - Embedded reel / video player & voice sample player.
     - Action buttons:
       - **Shortlist** (green check)
       - **Request Audition** (calendar icon)
       - **Decline** (subtle red cross)
     - Private feedback input modal ("Great look for the lead role, let's audition on Thursday").
3. **Submit Brief Page (`src/app/(dashboard)/client/briefs/new/page.tsx`):**
   - Clean, professional form allowing clients to input their character requirements, shoot window, budget, and freeform creative brief.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0007_client_portal.sql` successfully.
- [ ] Create a test client user in `client_users` associated with an active client.
- [ ] Login as client user and navigate to `/client/dashboard`.
- [ ] Submit a new brief via `/client/briefs/new`.
- [ ] Verify the brief appears in the client's list and is queryable by the agency in the agency CRM.
- [ ] Verify that client users cannot navigate to `/agency/*` or view internal commission records.
