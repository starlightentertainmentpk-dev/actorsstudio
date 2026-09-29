# Sub-Prompt 06 — Commercial Deal Pipeline, Hold Priority Engine & Booking Conflict Detection

**Phase:** Commercial Operations & Scheduling — Sub-Prompt 6 of 10  
**Depends on:** `04-casting-pipeline-and-submissions.md` (Casting Pipeline), `02-client-crm-and-contacts.md` (Client CRM)  
**Delivers:** Deal pipeline management, booking confirmation records with usage rights, industry-standard 1st/2nd hold priority engine with 24-hour challenge, and automated scheduling conflict detection.

---

## 🎯 Architectural Context & Additive Strategy

In professional talent agencies (Sections 24, 25, 27, and 70 of `masterprompt1.md`), managing the commercial transition from selected talent to confirmed shoot is high-stakes:
1. **Commercial Deal Pipeline:** Track deals from `Lead` → `Proposal` → `Negotiation` → `Approved` → `Contract` → `Booked` → `Invoiced` → `Paid`.
2. **Hold Priority Engine:** In advertising and film, clients place actors on "Hold" before contracts are signed. The system must support **First Hold**, **Second Hold**, and **Third Hold**. If a 2nd Hold client wants to book, the system supports a **24-Hour Challenge Rule** that notifies the 1st Hold client to confirm or release the talent.
3. **Automated Conflict Detection:** Before confirming any booking, hold, or audition slot, the system automatically checks talent availability and raises an active warning banner if overlapping dates are detected, preventing catastrophic double bookings.

---

## 🛠️ Step-by-Step Implementation Tasks

### 1. Database Migration: `supabase/migrations/0010_deals_bookings_holds.sql`

```sql
-- ============================================================
-- DEALS, BOOKINGS & HOLD PRIORITY SCHEMA
-- ============================================================

CREATE TYPE deal_status_enum AS ENUM (
  'lead', 'proposal', 'negotiation', 'approved', 'contract',
  'booked', 'completed', 'invoiced', 'paid', 'cancelled'
);

CREATE TYPE booking_status_enum AS ENUM ('draft', 'confirmed', 'completed', 'cancelled');
CREATE TYPE hold_status_enum AS ENUM ('active', 'challenged', 'confirmed', 'released', 'expired');

-- Deals Table (Commercial agreements)
CREATE TABLE IF NOT EXISTS public.deals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id                 UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  casting_call_id           UUID REFERENCES public.casting_calls(id) ON DELETE SET NULL,
  talent_id                 UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  deal_name                 TEXT NOT NULL,
  deal_value                NUMERIC(12,2) NOT NULL,
  agency_commission_amount  NUMERIC(12,2) NOT NULL,
  talent_payout_amount      NUMERIC(12,2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'PKR',
  payment_terms             TEXT DEFAULT 'Net 30',
  status                    deal_status_enum NOT NULL DEFAULT 'proposal',
  start_date                DATE,
  end_date                  DATE,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings Table (Shoot schedule, call sheets, rights)
CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id           UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  project_name      TEXT NOT NULL,
  shoot_date_start  DATE NOT NULL,
  shoot_date_end    DATE NOT NULL,
  call_time         TIME,
  wrap_time         TIME,
  location_address  TEXT,
  fee_amount        NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'PKR',
  usage_rights      TEXT NOT NULL, -- e.g. "1 Year Digital + TVC"
  territory         TEXT NOT NULL DEFAULT 'Pakistan', -- Pakistan | GCC | Worldwide
  media             TEXT NOT NULL DEFAULT 'TV, Digital, Social',
  status            booking_status_enum NOT NULL DEFAULT 'draft',
  conflict_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Holds Table (First / Second / Third Hold priority)
CREATE TABLE IF NOT EXISTS public.holds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id             UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  hold_date_start       DATE NOT NULL,
  hold_date_end         DATE NOT NULL,
  priority_level        INT NOT NULL DEFAULT 1, -- 1 = First Hold, 2 = Second Hold
  project_title         TEXT NOT NULL,
  status                hold_status_enum NOT NULL DEFAULT 'active',
  challenged_at         TIMESTAMPTZ,
  challenge_expires_at  TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holds ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_deals_org ON public.deals(organization_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_bookings_talent_dates ON public.bookings(talent_id, shoot_date_start, shoot_date_end);
CREATE INDEX idx_holds_talent_dates ON public.holds(talent_id, hold_date_start, hold_date_end);

-- RLS: Agency members access
CREATE POLICY "deals_org_isolation" ON public.deals
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "bookings_org_isolation" ON public.bookings
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

CREATE POLICY "holds_org_isolation" ON public.holds
  FOR ALL USING (organization_id IN (SELECT public.get_auth_user_org_ids()));

-- Talent can view their confirmed bookings
CREATE POLICY "bookings_talent_view" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = bookings.talent_id AND tp.user_id = auth.uid())
    AND status = 'confirmed'
  );
```

---

### 2. Conflict Detection Engine

Create `src/lib/services/conflict-detector.ts`:
```ts
import { createClient } from '@/lib/supabase/server'

export interface ConflictResult {
  hasConflict: boolean
  conflicts: {
    type: 'booking' | 'hold' | 'audition'
    id: string
    title: string
    startDate: string
    endDate: string
    details: string
  }[]
}

export async function checkTalentSchedulingConflict(
  talentId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): Promise<ConflictResult> {
  const supabase = await createClient()
  const conflicts: ConflictResult['conflicts'] = []

  // 1. Check existing confirmed bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, project_name, shoot_date_start, shoot_date_end')
    .eq('talent_id', talentId)
    .neq('status', 'cancelled')
    .lte('shoot_date_start', endDate)
    .gte('shoot_date_end', startDate)

  bookings?.forEach((b) => {
    if (b.id !== excludeId) {
      conflicts.push({
        type: 'booking',
        id: b.id,
        title: `Confirmed Shoot: ${b.project_name}`,
        startDate: b.shoot_date_start,
        endDate: b.shoot_date_end,
        details: 'Talent already has a confirmed booking for these dates.',
      })
    }
  })

  // 2. Check active holds
  const { data: holds } = await supabase
    .from('holds')
    .select('id, project_title, priority_level, hold_date_start, hold_date_end')
    .eq('talent_id', talentId)
    .eq('status', 'active')
    .lte('hold_date_start', endDate)
    .gte('hold_date_end', startDate)

  holds?.forEach((h) => {
    if (h.id !== excludeId) {
      conflicts.push({
        type: 'hold',
        id: h.id,
        title: `${h.priority_level === 1 ? '1st' : '2nd'} Hold: ${h.project_title}`,
        startDate: h.hold_date_start,
        endDate: h.hold_date_end,
        details: `Talent is currently on ${h.priority_level === 1 ? 'First' : 'Second'} Hold.`,
      })
    }
  })

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
}
```

---

### 3. Server Actions & Deal Workflows

Create `src/app/(dashboard)/agency/deals/actions.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDealAction(orgId: string, data: {
  clientId: string
  talentId: string
  dealName: string
  dealValue: number
  agencyCommissionAmount: number
  talentPayoutAmount: number
  currency: string
  startDate?: string
  endDate?: string
  notes?: string
}) {
  const supabase = await createClient()

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      organization_id: orgId,
      client_id: data.clientId,
      talent_id: data.talentId,
      deal_name: data.dealName,
      deal_value: data.dealValue,
      agency_commission_amount: data.agencyCommissionAmount,
      talent_payout_amount: data.talentPayoutAmount,
      currency: data.currency,
      start_date: data.startDate,
      end_date: data.endDate,
      notes: data.notes,
      status: 'proposal',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/agency/deals')
  return { success: true, dealId: deal.id }
}

export async function challengeFirstHoldAction(holdId: string) {
  const supabase = await createClient()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 Hours

  const { error } = await supabase
    .from('holds')
    .update({
      status: 'challenged',
      challenged_at: new Date().toISOString(),
      challenge_expires_at: expiresAt,
    })
    .eq('id', holdId)

  if (error) throw new Error(error.message)

  revalidatePath('/agency/holds')
  return { success: true, expiresAt }
}
```

---

### 4. Deals & Hold Priority UI

1. **Deal Pipeline Dashboard (`src/app/(dashboard)/agency/deals/page.tsx`):**
   - KPI Bar: Total Pipeline Value, Projected Agency Commission, Closed Deals This Month.
   - Kanban board mapping deal status columns: `Proposal` → `Negotiation` → `Approved` → `Contract` → `Booked` → `Invoiced` → `Paid`.
   - Deal card showing: Project name, Client, Talent, Deal Value (e.g. `PKR 500,000`), Commission cut badge, and quick action to generate contract or invoice.
2. **Booking Creator with Conflict Warning (`src/components/features/deals/CreateBookingModal.tsx`):**
   - Talent selector & Date Range picker.
   - As dates are selected, `checkTalentSchedulingConflict` runs dynamically:
     - If conflict detected: Renders an amber alert banner ("⚠️ Scheduling Conflict: Actor is already on 1st Hold for 'Coca-Cola TVC' on Oct 16").
     - Provides option: "Place on 2nd Hold" or "Override with Admin Approval".
   - Usage Rights builder: Media checkboxes (TV, Digital, Print, Billboards), Exclusivity timeframe, Territory (Pakistan, Middle East, Worldwide).
3. **Hold Priority Manager (`src/app/(dashboard)/agency/holds/page.tsx`):**
   - Visual timeline displaying active 1st and 2nd holds across talent roster.
   - "Issue 24h Challenge" button for 2nd hold holders to force resolution.

---

## ✅ Acceptance Criteria & Smoke Testing

- [ ] Run migration `supabase/migrations/0010_deals_bookings_holds.sql` successfully.
- [ ] Place a test talent on First Hold for dates: `2026-11-01` to `2026-11-03`.
- [ ] Attempt to create a new booking for the same talent on `2026-11-02`; verify the Conflict Detector displays the warning.
- [ ] Issue a 24-hour challenge on the hold and verify `challenge_expires_at` is set to exactly 24 hours in the future.
- [ ] Confirm deal values, commission cuts, and talent net payout math are accurately stored.
