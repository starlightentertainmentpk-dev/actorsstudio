-- ============================================================
-- CLIENT CRM SCHEMA
-- ============================================================

DO $$ BEGIN
  CREATE TYPE client_status_enum AS ENUM ('lead', 'prospect', 'active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_producer ON public.clients(producer_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_org ON public.client_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON public.client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_org ON public.agency_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_client ON public.agency_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_due ON public.agency_tasks(due_date);

-- RLS: Agency members can manage clients belonging to their organization
DROP POLICY IF EXISTS "clients_org_isolation" ON public.clients;
CREATE POLICY "clients_org_isolation" ON public.clients
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "client_contacts_org_isolation" ON public.client_contacts;
CREATE POLICY "client_contacts_org_isolation" ON public.client_contacts
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

DROP POLICY IF EXISTS "client_notes_org_isolation" ON public.client_notes;
CREATE POLICY "client_notes_org_isolation" ON public.client_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_notes.client_id
        AND (
          c.organization_id IN (SELECT public.get_auth_user_org_ids())
          OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
        )
    )
  );

DROP POLICY IF EXISTS "agency_tasks_org_isolation" ON public.agency_tasks;
CREATE POLICY "agency_tasks_org_isolation" ON public.agency_tasks
  FOR ALL USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );
