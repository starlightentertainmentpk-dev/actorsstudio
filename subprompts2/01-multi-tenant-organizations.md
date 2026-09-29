# Sub-Prompt 01 — Multi-Tenant Organization Architecture, Agency Onboarding & Dynamic Branding

**Phase:** Architecture Upgrade — Sub-Prompt 1 of 10  
**Depends on:** Existing `users`, `talent_profiles`, `producer_profiles`, Supabase SSR setup  
**Delivers:** Multi-tenant organization data model, agency tenant isolation RLS, 10-step agency onboarding wizard, dynamic branding system, and organization context switcher.

---

## 🎯 Architectural Context & Additive Strategy

The existing Actor's Studio application was designed around a single studio model (`studio_admin`, `studio_staff`, `talent`, `producer_brand`).  
In this prompt, we evolve the platform into a **multi-tenant agency operating system** that can power multiple independent agencies (e.g. Actor's Studio Lahore, Star Talent Dubai, Elite Creators Agency) alongside existing independent talent and producer accounts.

### Key Rules for this Additive Step:
1. **Never break existing data:** We create a default organization (`Actors Studio Headquarters`) and backfill existing `talent_profiles` and `casting_calls` with this `organization_id`.
2. **Backward-compatible roles:** Existing users with `studio_admin` or `super_admin` become owners/admins of the default organization.
3. **Dynamic White-Label Branding:** Remove hardcoded "Studio Space" / "Actor's Studio" from headers and footers; resolve brand name, logo, currency, and primary colors dynamically from the active organization.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0005_multi_tenant_organizations.sql`

Create a new migration file with the following complete SQL:

```sql
-- ============================================================
-- MULTI-TENANT ORGANIZATIONS SCHEMA
-- ============================================================

-- Agency Types Enum
CREATE TYPE agency_type_enum AS ENUM (
  'talent_agency', 'modeling_agency', 'casting_agency',
  'entertainment_agency', 'influencer_agency', 'creator_management',
  'sports_talent', 'other'
);

-- Organization Roles Enum
CREATE TYPE organization_role_enum AS ENUM (
  'super_admin', 'agency_owner', 'agency_admin', 'agent',
  'casting_manager', 'talent_manager', 'finance_manager', 'viewer'
);

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  agency_type     agency_type_enum NOT NULL DEFAULT 'talent_agency',
  country         TEXT NOT NULL DEFAULT 'Pakistan',
  currency        TEXT NOT NULL DEFAULT 'PKR',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Karachi',
  logo_url        TEXT,
  brand_color     TEXT DEFAULT '#4f46e5',
  website         TEXT,
  bio             TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Settings Table
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id           UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  default_commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  public_directory_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  custom_domain             TEXT,
  email_from_name           TEXT,
  email_reply_to            TEXT,
  invoice_notes_default     TEXT,
  settings_json             JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members Table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            organization_role_enum NOT NULL DEFAULT 'agent',
  invited_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing entities
ALTER TABLE public.talent_profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.casting_calls 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.producer_profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function: Get organizations the current authenticated user belongs to
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS TABLE(org_id UUID) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

-- RLS Policies for Organizations
CREATE POLICY "org_select_members" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "org_update_owner_admin" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
  );

-- RLS Policies for Organization Members
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT public.get_auth_user_org_ids())
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

CREATE POLICY "org_members_manage" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
  );

-- RLS Policies for Organization Settings
CREATE POLICY "org_settings_select" ON public.organization_settings
  FOR SELECT USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "org_settings_update" ON public.organization_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_settings.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('agency_owner', 'agency_admin', 'super_admin')
    )
  );

-- Backfill: Create Default Organization for Existing Data
DO $$
DECLARE
  default_org_id UUID;
  admin_user_id UUID;
BEGIN
  -- Insert default agency if none exists
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'actors-studio-hq') THEN
    INSERT INTO public.organizations (name, slug, agency_type, country, currency, timezone)
    VALUES ('Actors Studio HQ', 'actors-studio-hq', 'talent_agency', 'Pakistan', 'PKR', 'Asia/Karachi')
    RETURNING id INTO default_org_id;

    INSERT INTO public.organization_settings (organization_id, default_commission_rate)
    VALUES (default_org_id, 20.00);

    -- Attach existing talent and casting calls to default org
    UPDATE public.talent_profiles SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE public.casting_calls SET organization_id = default_org_id WHERE organization_id IS NULL;

    -- Find first studio_admin or super_admin and add as agency_owner
    SELECT id INTO admin_user_id FROM public.users WHERE role IN ('super_admin', 'studio_admin') LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role)
      VALUES (default_org_id, admin_user_id, 'agency_owner')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
```

---

### 2. TypeScript Types & Zod Schemas

Create `src/types/organization.ts`:
```ts
export type AgencyType =
  | 'talent_agency'
  | 'modeling_agency'
  | 'casting_agency'
  | 'entertainment_agency'
  | 'influencer_agency'
  | 'creator_management'
  | 'sports_talent'
  | 'other'

export type OrganizationRole =
  | 'super_admin'
  | 'agency_owner'
  | 'agency_admin'
  | 'agent'
  | 'casting_manager'
  | 'talent_manager'
  | 'finance_manager'
  | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  agency_type: AgencyType
  country: string
  currency: string
  timezone: string
  logo_url?: string | null
  brand_color?: string | null
  website?: string | null
  bio?: string | null
  is_active: boolean
  created_at: string
}

export interface OrganizationSettings {
  organization_id: string
  default_commission_rate: number
  public_directory_enabled: boolean
  custom_domain?: string | null
  email_from_name?: string | null
  email_reply_to?: string | null
  invoice_notes_default?: string | null
  settings_json: Record<string, unknown>
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  joined_at: string
  user?: {
    email: string
    role: string
  }
}
```

Create `src/lib/validations/organization.ts`:
```ts
import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
  agency_type: z.enum([
    'talent_agency', 'modeling_agency', 'casting_agency',
    'entertainment_agency', 'influencer_agency', 'creator_management',
    'sports_talent', 'other'
  ]),
  country: z.string().default('Pakistan'),
  currency: z.string().default('PKR'),
  timezone: z.string().default('Asia/Karachi'),
  logo_url: z.string().url().optional().or(z.literal('')),
  brand_color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color').default('#4f46e5'),
  website: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(1000).optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
```

---

### 3. Dynamic Branding & Tenant Context Resolver

Create `src/lib/branding.ts`:
```ts
import { createClient } from '@/lib/supabase/server'

export interface BrandConfig {
  name: string
  logoUrl?: string
  brandColor: string
  currency: string
  timezone: string
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "Actor's Studio",
  brandColor: "#4f46e5",
  currency: "PKR",
  timezone: "Asia/Karachi"
}

export async function getActiveOrganizationBrand(orgId?: string): Promise<BrandConfig> {
  if (!orgId) return DEFAULT_BRAND
  
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, brand_color, currency, timezone')
    .eq('id', orgId)
    .single()

  if (!org) return DEFAULT_BRAND

  return {
    name: org.name,
    logoUrl: org.logo_url || undefined,
    brandColor: org.brand_color || DEFAULT_BRAND.brandColor,
    currency: org.currency || DEFAULT_BRAND.currency,
    timezone: org.timezone || DEFAULT_BRAND.timezone,
  }
}
```

Create `src/lib/organizations.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { Organization, OrganizationMember } from '@/types/organization'

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)

  return (data?.map((m: any) => m.organizations).filter(Boolean) as Organization[]) || []
}

export async function getCurrentActiveOrgId(): Promise<string | null> {
  const orgs = await getUserOrganizations()
  return orgs[0]?.id || null
}
```

---

### 4. 10-Step Agency Onboarding Wizard

Create Server Action in `src/app/(dashboard)/agency/onboarding/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrganizationSchema } from '@/lib/validations/organization'
import { revalidatePath } from 'next/cache'

export async function createAgencyOrganization(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    agency_type: formData.get('agency_type'),
    country: formData.get('country') || 'Pakistan',
    currency: formData.get('currency') || 'PKR',
    timezone: formData.get('timezone') || 'Asia/Karachi',
    logo_url: formData.get('logo_url') || undefined,
    brand_color: formData.get('brand_color') || '#4f46e5',
    website: formData.get('website') || undefined,
    bio: formData.get('bio') || undefined,
  }

  const validated = createOrganizationSchema.parse(rawData)

  // 1. Insert organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert(validated)
    .select('id, slug')
    .single()

  if (orgError) throw new Error(orgError.message)

  // 2. Insert organization settings
  await supabase
    .from('organization_settings')
    .insert({
      organization_id: org.id,
      default_commission_rate: 20.00,
      public_directory_enabled: true
    })

  // 3. Make current user the agency_owner
  await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'agency_owner'
    })

  revalidatePath('/agency')
  return { success: true, orgId: org.id, slug: org.slug }
}
```

Create page `src/app/(dashboard)/agency/onboarding/page.tsx`:
Implement a clean multi-step wizard adhering to Section 8 of `masterprompt1.md`:
- Step 1: Agency Name & Slug
- Step 2: Agency Type selector (Talent, Modeling, Casting, Influencer, Creator, etc.)
- Step 3: Country selector
- Step 4: Currency (PKR, USD, EUR, GBP, AED)
- Step 5: Timezone (Asia/Karachi, UTC, etc.)
- Step 6: Brand Logo Upload / URL & Brand Accent Color picker
- Step 7: Agency Bio & Website
- Step 8: Invite Initial Team (agent email invitations)
- Step 9: Default Commission Rate (e.g. 20%)
- Step 10: Confirmation & Launch to Agency Dashboard.

---

### 5. UI Integration & Organization Switcher

1. Create `src/components/shared/OrganizationSwitcher.tsx`:
   - A dropdown menu in the sidebar or navbar header displaying the current agency name.
   - Allows switching between multiple agencies if the user is a member of more than one.
   - Includes "Create New Agency" button linking to `/agency/onboarding`.
2. Update [DashboardShell.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/DashboardShell.tsx):
   - Replace hardcoded `"Studio Space"` text with the dynamic organization name resolved from `getActiveOrganizationBrand()`.
   - Embed the `OrganizationSwitcher` into the top bar.
3. Update [Sidebar.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/Sidebar.tsx):
   - Support `'agency'` role in addition to `admin`, `producer`, `talent`.
   - Add routes: `/agency/dashboard`, `/agency/talent`, `/agency/clients`, `/agency/casting`, `/agency/settings`.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0005_multi_tenant_organizations.sql` without any errors.
- [ ] Verify that existing talent profiles and casting calls have their `organization_id` backfilled to the default organization.
- [ ] Login as an admin user → Navigate to `/agency/onboarding` → Complete the 10-step wizard.
- [ ] Confirm new organization, settings, and member record are created in Supabase with RLS active.
- [ ] Confirm `OrganizationSwitcher` allows toggling between agencies.
- [ ] Run `npm run test` to verify no existing tests break.
