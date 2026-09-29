# Sub-Prompt 02 — Client CRM, Company Accounts, Contacts Directory & Interaction Timeline

**Phase:** Commercial Operations — Sub-Prompt 2 of 10  
**Depends on:** `01-multi-tenant-organizations.md` (organization context) & existing `producer_profiles`  
**Delivers:** Comprehensive Agency Client CRM, multiple company contacts per client, interaction notes timeline, agency task manager, and link to existing producer profiles.

---

## 🎯 Architectural Context & Additive Strategy

In the initial MVP, the platform supported `producer_profiles` representing individual or company producers who post casting calls.  
For a professional agency (Sections 22, 35, and 47 of `masterprompt1.md`), agents must manage full **Client CRM dossiers**:
1. Multiple contacts per company (e.g. Executive Producer, Casting Director, Accounts Payable).
2. Lead status pipeline (`lead` → `prospect` → `active` → `inactive`).
3. Internal agency notes and communication logs.
4. Follow-up task reminders for agency staff.
5. Direct link to existing `producer_profiles` so self-registered producers seamlessly connect to the agency's client database.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0006_clients_crm.sql`

```sql
-- ============================================================
-- CLIENT CRM SCHEMA
-- ============================================================

CREATE TYPE client_status_enum AS ENUM ('lead', 'prospect', 'active', 'inactive');
CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'completed');

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  producer_profile_id UUID REFERENCES public.producer_profiles(id) ON DELETE SET NULL,
  company_name        TEXT NOT NULL,
  industry            TEXT NOT NULL DEFAULT 'Entertainment & Film',
  website             TEXT,
  country             TEXT NOT NULL DEFAULT 'Pakistan',
  city                TEXT NOT NULL DEFAULT 'Karachi',
  address             TEXT,
  billing_email       TEXT,
  phone               TEXT,
  status              client_status_enum NOT NULL DEFAULT 'active',
  internal_notes      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Contacts Table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  role_title      TEXT, -- e.g. "Senior Producer", "Casting Director", "Creative Lead"
  email           TEXT NOT NULL,
  phone           TEXT,
  whatsapp_number TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Notes & Interaction Timeline
CREATE TABLE IF NOT EXISTS public.client_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_text   TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agency Tasks for Clients & Workflows
CREATE TABLE IF NOT EXISTS public.agency_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  priority            task_priority_enum NOT NULL DEFAULT 'medium',
  status              task_status_enum NOT NULL DEFAULT 'todo',
  due_date            DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE INDEX idx_clients_producer ON public.clients(producer_profile_id);
CREATE INDEX idx_client_contacts_client ON public.client_contacts(client_id);
CREATE INDEX idx_client_notes_client ON public.client_notes(client_id);
CREATE INDEX idx_agency_tasks_org ON public.agency_tasks(organization_id);
CREATE INDEX idx_agency_tasks_due ON public.agency_tasks(due_date);

-- RLS: Agency members can manage clients belonging to their organization
CREATE POLICY "clients_org_isolation" ON public.clients
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "client_contacts_org_isolation" ON public.client_contacts
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "client_notes_org_isolation" ON public.client_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_notes.client_id
        AND c.organization_id IN (SELECT public.get_auth_user_org_ids())
    )
  );

CREATE POLICY "agency_tasks_org_isolation" ON public.agency_tasks
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );
```

---

### 2. TypeScript Interfaces & Zod Validation

Create `src/types/client.ts`:
```ts
export type ClientStatus = 'lead' | 'prospect' | 'active' | 'inactive'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export interface Client {
  id: string
  organization_id: string
  producer_profile_id?: string | null
  company_name: string
  industry: string
  website?: string | null
  country: string
  city: string
  address?: string | null
  billing_email?: string | null
  phone?: string | null
  status: ClientStatus
  internal_notes?: string | null
  created_at: string
  contacts?: ClientContact[]
  tasks?: AgencyTask[]
}

export interface ClientContact {
  id: string
  client_id: string
  full_name: string
  role_title?: string | null
  email: string
  phone?: string | null
  whatsapp_number?: string | null
  is_primary: boolean
  notes?: string | null
  created_at: string
}

export interface ClientNote {
  id: string
  client_id: string
  author_id: string
  note_text: string
  is_pinned: boolean
  created_at: string
  author?: {
    email: string
  }
}

export interface AgencyTask {
  id: string
  organization_id: string
  client_id?: string | null
  assigned_to_user_id?: string | null
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date?: string | null
  created_at: string
}
```

Create `src/lib/validations/client.ts`:
```ts
import { z } from 'zod'

export const clientSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(2).default('Entertainment & Film'),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().default('Pakistan'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional(),
  billing_email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['lead', 'prospect', 'active', 'inactive']).default('active'),
  internal_notes: z.string().optional(),
})

export const clientContactSchema = z.object({
  client_id: z.string().uuid(),
  full_name: z.string().min(2, 'Contact name is required'),
  role_title: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
})

export const agencyTaskSchema = z.object({
  client_id: z.string().uuid().optional(),
  title: z.string().min(3, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed']).default('todo'),
  due_date: z.string().optional(),
})
```

---

### 3. Server Actions & CRM Service Layer

Create `src/lib/services/clients.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { Client, ClientContact, ClientNote, AgencyTask } from '@/types/client'

export async function getAgencyClients(orgId: string): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts:client_contacts(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      contacts:client_contacts(*),
      notes:client_notes(*, author:users(email)),
      tasks:agency_tasks(*)
    `)
    .eq('id', clientId)
    .single()

  if (error) return null
  return data
}
```

Create `src/app/(dashboard)/agency/clients/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { clientSchema, clientContactSchema, agencyTaskSchema } from '@/lib/validations/client'
import { revalidatePath } from 'next/cache'

export async function createClientAction(orgId: string, formData: FormData) {
  const supabase = await createClient()
  const raw = {
    company_name: formData.get('company_name'),
    industry: formData.get('industry') || 'Entertainment & Film',
    website: formData.get('website') || undefined,
    country: formData.get('country') || 'Pakistan',
    city: formData.get('city') || 'Karachi',
    address: formData.get('address') || undefined,
    billing_email: formData.get('billing_email') || undefined,
    phone: formData.get('phone') || undefined,
    status: formData.get('status') || 'active',
    internal_notes: formData.get('internal_notes') || undefined,
  }

  const validated = clientSchema.parse(raw)

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...validated, organization_id: orgId })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/clients')
  return { success: true, clientId: data.id }
}

export async function addContactAction(orgId: string, formData: FormData) {
  const supabase = await createClient()
  const raw = {
    client_id: formData.get('client_id'),
    full_name: formData.get('full_name'),
    role_title: formData.get('role_title') || undefined,
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    whatsapp_number: formData.get('whatsapp_number') || undefined,
    is_primary: formData.get('is_primary') === 'true',
    notes: formData.get('notes') || undefined,
  }

  const validated = clientContactSchema.parse(raw)

  const { error } = await supabase
    .from('client_contacts')
    .insert({ ...validated, organization_id: orgId })

  if (error) throw new Error(error.message)

  revalidatePath(`/agency/clients/${validated.client_id}`)
  return { success: true }
}

export async function addClientNoteAction(clientId: string, noteText: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('client_notes')
    .insert({ client_id: clientId, author_id: user.id, note_text: noteText })

  if (error) throw new Error(error.message)
  revalidatePath(`/agency/clients/${clientId}`)
  return { success: true }
}
```

---

### 4. Client CRM User Interface

1. **Client Directory Page (`src/app/(dashboard)/agency/clients/page.tsx`):**
   - Header with Quick Search, Industry Filter, Status Filter (`Lead`, `Prospect`, `Active`, `Inactive`).
   - "New Client" dialog modal.
   - TanStack Table / Responsive Card grid displaying:
     - Company Name, Industry, City, Status badge.
     - Primary Contact (Name, Email, WhatsApp quick trigger).
     - Active Projects count.
     - View Details action linking to `/agency/clients/[id]`.
2. **Client Dossier Detail Page (`src/app/(dashboard)/agency/clients/[id]/page.tsx`):**
   - Company Header: Logo, Company Name, Industry, Location, Status, Billing info.
   - Tabs:
     - **Contacts Tab:** Card list of company team members with click-to-email and click-to-WhatsApp links (`https://wa.me/...`).
     - **Activity Timeline & Notes Tab:** Pinned notes, interaction log, inline markdown note composer.
     - **Tasks & Reminders Tab:** Agency to-do list for this client (follow-up calls, quote reviews, contract status).
     - **Projects & Castings Tab:** Shows all casting calls associated with this client.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0006_clients_crm.sql` successfully.
- [ ] In agency dashboard, navigate to `/agency/clients`.
- [ ] Add a new client company (e.g., "Dawn Films", Industry: "Film & Cinema", City: "Karachi").
- [ ] Add two contacts to the client, marking one as primary contact with a WhatsApp number.
- [ ] Post an internal note ("Meeting scheduled for upcoming commercial casting").
- [ ] Verify that other organizations cannot query or view this client due to RLS policies.
