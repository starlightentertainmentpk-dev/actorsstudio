# Sub-Prompt 02 — Supabase Schema & RLS

**Phase:** Tier 1 — Step 2 of 10  
**Depends on:** `01-project-scaffold.md` (project is initialised)  
**Delivers:** A fully migrated Supabase database with all Tier 1 tables, enums, indexes, and RLS policies enforced from day one.

---

## Context

You are setting up the database layer for **Actor's Studio**. Every table must have Row-Level Security (RLS) policies defined **in the same migration** that creates the table — never as a follow-up patch.

---

## Tasks

### 1. Supabase project setup

1. Create a new Supabase project (or connect to an existing one).
2. Copy the project URL and anon key into `.env.local`.
3. Install Supabase CLI locally if not present:
   ```bash
   npm install supabase --save-dev
   npx supabase login
   npx supabase init
   npx supabase link --project-ref <your-project-ref>
   ```

### 2. Supabase client helpers

Create `src/lib/supabase/client.ts` (browser client):

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts` (server/RSC client using cookies):

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

Create `src/lib/supabase/admin.ts` (service-role client, server-only):

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 3. Write the Tier 1 migration

Create `supabase/migrations/0001_initial_tier1.sql`. Write it completely — do not leave RLS as a TODO.

#### Enums

```sql
-- Roles
CREATE TYPE user_role AS ENUM (
  'super_admin', 'studio_admin', 'studio_staff',
  'talent', 'agent_manager', 'producer_brand', 'casting_director'
);

-- Talent verification workflow states
CREATE TYPE verification_status AS ENUM (
  'pending', 'under_review', 'interview_scheduled',
  'audition_scheduled', 'approved', 'rejected', 'blacklisted', 'inactive'
);

-- Application lifecycle
CREATE TYPE application_status AS ENUM (
  'applied', 'shortlisted', 'audition', 'selected', 'rejected', 'withdrawn'
);

-- Audition mode
CREATE TYPE audition_mode AS ENUM ('in_person', 'self_tape', 'video_call');

-- Casting call status
CREATE TYPE casting_call_status AS ENUM ('draft', 'open', 'closed', 'cancelled');

-- Notification channels
CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'sms', 'in_app');

-- Gender
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
```

#### Core tables with RLS

```sql
-- ============================================================
-- USERS (extends auth.users)
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'talent',
  status      TEXT NOT NULL DEFAULT 'active',  -- active | suspended | deleted
  locale      TEXT NOT NULL DEFAULT 'en',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row; admins can read all
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

-- Users can update their own row (except role)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only super_admin can update roles
CREATE POLICY "users_update_role_super_admin" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Auto-insert on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'talent');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- CATEGORIES (self-referencing, unlimited nesting)
-- ============================================================
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT USING (true);

-- Admin write
CREATE POLICY "categories_write_admin" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin'))
  );

-- ============================================================
-- TALENT PROFILES
-- ============================================================
CREATE TABLE public.talent_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  stage_name           TEXT,
  dob                  DATE,
  gender               gender_type,
  city                 TEXT,
  country              TEXT NOT NULL DEFAULT 'Pakistan',
  category_id          UUID REFERENCES public.categories(id),
  sub_category_id      UUID REFERENCES public.categories(id),
  experience_years     INT NOT NULL DEFAULT 0,
  languages            TEXT[] NOT NULL DEFAULT '{}',
  skills               TEXT[] NOT NULL DEFAULT '{}',
  bio                  TEXT,
  height_cm            NUMERIC(5,2),
  weight_kg            NUMERIC(5,2),
  measurements_json    JSONB,
  verification_status  verification_status NOT NULL DEFAULT 'pending',
  is_premium           BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_tier    TEXT NOT NULL DEFAULT 'free',  -- free | premium
  agent_manager_id     UUID,   -- FK added after agent_managers table
  slug                 TEXT UNIQUE,  -- for public portfolio URL
  is_available         BOOLEAN NOT NULL DEFAULT TRUE,
  union_member         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- Public can see approved talent profiles
CREATE POLICY "talent_profiles_select_approved" ON public.talent_profiles
  FOR SELECT USING (verification_status = 'approved');

-- Talent can see their own profile (any status)
CREATE POLICY "talent_profiles_select_own" ON public.talent_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all
CREATE POLICY "talent_profiles_select_admin" ON public.talent_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

-- Talent can insert/update their own profile
CREATE POLICY "talent_profiles_write_own" ON public.talent_profiles
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update verification_status, is_premium, etc.
CREATE POLICY "talent_profiles_update_admin" ON public.talent_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER talent_profiles_updated_at
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- AGENT MANAGERS
-- ============================================================
CREATE TABLE public.agent_managers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  agency_name          TEXT NOT NULL,
  represents_talent_ids UUID[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_managers_select_admin" ON public.agent_managers
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
               AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

CREATE POLICY "agent_managers_write_own" ON public.agent_managers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Now add FK to talent_profiles
ALTER TABLE public.talent_profiles
  ADD CONSTRAINT talent_profiles_agent_manager_fk
  FOREIGN KEY (agent_manager_id) REFERENCES public.agent_managers(id) ON DELETE SET NULL;

-- ============================================================
-- MEDIA ASSETS
-- ============================================================
CREATE TABLE public.media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- photo | video | voice_sample | resume | reel
  url         TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT NOT NULL DEFAULT 0,
  file_size_bytes BIGINT,
  duration_sec    NUMERIC(10,2),  -- for video/audio
  metadata_json   JSONB,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Talent / owner can see their own assets
CREATE POLICY "media_assets_select_own" ON public.media_assets
  FOR SELECT USING (owner_id = auth.uid());

-- Public can see media belonging to approved talent
CREATE POLICY "media_assets_select_public" ON public.media_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp
      WHERE tp.user_id = media_assets.owner_id
        AND tp.verification_status = 'approved'
    )
  );

-- Admins can see all
CREATE POLICY "media_assets_select_admin" ON public.media_assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

-- Owner can write
CREATE POLICY "media_assets_write_own" ON public.media_assets
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- PRODUCER PROFILES
-- ============================================================
CREATE TABLE public.producer_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  company_name          TEXT NOT NULL,
  company_type          TEXT,  -- production_house | brand | ad_agency | individual
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  verification_docs_url TEXT,
  website               TEXT,
  bio                   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.producer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "producer_profiles_select_public" ON public.producer_profiles
  FOR SELECT USING (verified = TRUE);

CREATE POLICY "producer_profiles_select_own" ON public.producer_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "producer_profiles_select_admin" ON public.producer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

CREATE POLICY "producer_profiles_write_own" ON public.producer_profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "producer_profiles_update_admin" ON public.producer_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin'))
  );

CREATE TRIGGER producer_profiles_updated_at
  BEFORE UPDATE ON public.producer_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- CASTING CALLS
-- ============================================================
CREATE TABLE public.casting_calls (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id          UUID NOT NULL REFERENCES public.producer_profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  category_id          UUID REFERENCES public.categories(id),
  location             TEXT,
  shoot_date           DATE,
  application_deadline TIMESTAMPTZ,
  requirements_json    JSONB,   -- gender, age range, skills, etc.
  compensation         TEXT,    -- free text for now (PKR amount, contra, TBD)
  status               casting_call_status NOT NULL DEFAULT 'draft',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.casting_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casting_calls_select_open" ON public.casting_calls
  FOR SELECT USING (status = 'open');

CREATE POLICY "casting_calls_select_own" ON public.casting_calls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.producer_profiles pp
            WHERE pp.id = casting_calls.producer_id AND pp.user_id = auth.uid())
  );

CREATE POLICY "casting_calls_select_admin" ON public.casting_calls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

CREATE POLICY "casting_calls_write_producer" ON public.casting_calls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.producer_profiles pp
            WHERE pp.id = casting_calls.producer_id AND pp.user_id = auth.uid())
  );

CREATE TRIGGER casting_calls_updated_at
  BEFORE UPDATE ON public.casting_calls
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE public.applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_call_id UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  talent_id       UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  status          application_status NOT NULL DEFAULT 'applied',
  cover_note      TEXT,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(casting_call_id, talent_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Talent can see their own applications
CREATE POLICY "applications_select_own_talent" ON public.applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp
            WHERE tp.id = applications.talent_id AND tp.user_id = auth.uid())
  );

-- Producer can see applications on their casting calls
CREATE POLICY "applications_select_producer" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.casting_calls cc
      JOIN public.producer_profiles pp ON pp.id = cc.producer_id
      WHERE cc.id = applications.casting_call_id AND pp.user_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY "applications_select_admin" ON public.applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

-- Talent can insert (apply) and update own (withdraw)
CREATE POLICY "applications_write_talent" ON public.applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp
            WHERE tp.id = applications.talent_id AND tp.user_id = auth.uid())
  );

-- Producer/admin can update status (shortlist, reject, select)
CREATE POLICY "applications_update_producer_admin" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.casting_calls cc
      JOIN public.producer_profiles pp ON pp.id = cc.producer_id
      WHERE cc.id = applications.casting_call_id AND pp.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
               AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- AUDITIONS
-- ============================================================
CREATE TABLE public.auditions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_call_id  UUID NOT NULL REFERENCES public.casting_calls(id) ON DELETE CASCADE,
  talent_id        UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  mode             audition_mode NOT NULL DEFAULT 'in_person',
  scheduled_at     TIMESTAMPTZ,
  location_or_link TEXT,
  feedback         TEXT,
  score            NUMERIC(4,2),  -- 0.00 – 10.00
  result           TEXT,          -- pending | pass | fail
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditions_select_talent" ON public.auditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp
            WHERE tp.id = auditions.talent_id AND tp.user_id = auth.uid())
  );

CREATE POLICY "auditions_select_producer" ON public.auditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.casting_calls cc
      JOIN public.producer_profiles pp ON pp.id = cc.producer_id
      WHERE cc.id = auditions.casting_call_id AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "auditions_select_admin" ON public.auditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
  );

CREATE POLICY "auditions_write_admin_producer" ON public.auditions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin', 'studio_staff'))
    OR EXISTS (
      SELECT 1 FROM public.casting_calls cc
      JOIN public.producer_profiles pp ON pp.id = cc.producer_id
      WHERE cc.id = auditions.casting_call_id AND pp.user_id = auth.uid()
    )
  );

CREATE TRIGGER auditions_updated_at
  BEFORE UPDATE ON public.auditions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel      notification_channel NOT NULL DEFAULT 'in_app',
  type         TEXT NOT NULL,   -- e.g. 'application_received', 'status_changed'
  payload_json JSONB,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at      TIMESTAMPTZ
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role inserts notifications (no user policy needed; done via admin client)

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  UUID,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND u.role IN ('super_admin', 'studio_admin'))
  );

-- Service role inserts via admin client (no user INSERT policy)
```

#### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_talent_profiles_user_id ON public.talent_profiles(user_id);
CREATE INDEX idx_talent_profiles_category ON public.talent_profiles(category_id);
CREATE INDEX idx_talent_profiles_verification_status ON public.talent_profiles(verification_status);
CREATE INDEX idx_talent_profiles_city ON public.talent_profiles(city);
CREATE INDEX idx_talent_profiles_slug ON public.talent_profiles(slug);
CREATE INDEX idx_media_assets_owner ON public.media_assets(owner_id);
CREATE INDEX idx_casting_calls_producer ON public.casting_calls(producer_id);
CREATE INDEX idx_casting_calls_status ON public.casting_calls(status);
CREATE INDEX idx_applications_casting_call ON public.applications(casting_call_id);
CREATE INDEX idx_applications_talent ON public.applications(talent_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
```

### 4. Seed initial categories

```sql
-- supabase/seed.sql
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('Actor', 'actor', NULL, 1),
  ('Model', 'model', NULL, 2),
  ('Voice Artist', 'voice-artist', NULL, 3),
  ('Dancer', 'dancer', NULL, 4),
  ('Musician', 'musician', NULL, 5),
  ('Influencer', 'influencer', NULL, 6),
  ('Child Artist', 'child-artist', NULL, 7);
```

### 5. Generate TypeScript types

```bash
npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.ts
```

Add this to your `package.json` scripts:
```json
"db:types": "supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.ts"
```

### 6. Run migration

```bash
npx supabase db push
# or for local dev:
npx supabase db reset
```

---

## Deliverables checklist

- [ ] Supabase project linked
- [ ] Browser, server, and admin client helpers created
- [ ] All enums defined
- [ ] All Tier 1 tables created with RLS policies inline
- [ ] `set_updated_at()` trigger on all mutable tables
- [ ] `handle_new_user()` trigger on `auth.users`
- [ ] Performance indexes added
- [ ] Initial category seed data
- [ ] TypeScript database types generated
- [ ] Migration applies cleanly (`db push` or `db reset` succeeds)
