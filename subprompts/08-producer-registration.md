# Sub-Prompt 08 — Producer Registration & Company Profile

**Phase:** Tier 1 — Step 8 of 10  
**Depends on:** `03-auth-roles.md` (auth + roles working), `02-supabase-schema.md` (`producer_profiles` table exists)  
**Delivers:** Producer/brand onboarding flow, company profile management page, and admin verification workflow for producers.

---

## Context

Producers, brands, and casting directors register separately from talent. After creating an account with role `producer_brand` or `casting_director`, they go through a simpler 2-step onboarding and await verification before they can post casting calls.

---

## Tasks

### 1. Producer onboarding flow

`src/app/(dashboard)/producer/onboarding/page.tsx`:

2-step wizard (simpler than talent onboarding):

**Step 1 — Company Details:**
- Company name (required)
- Company type (select): Production House, Brand, Advertising Agency, Independent Producer, Casting Director
- Website URL (optional)
- Instagram / LinkedIn (optional)
- Company bio (textarea, max 500 chars)

**Step 2 — Verification Documents:**
- Upload company registration / NTN document (PDF or image, max 10 MB).
- Upload national ID or passport of authorized representative (required for verification badge).
- Optional: a brief note about what types of projects they typically produce.

On completion:
- Insert `producer_profiles` row with `verified = false`.
- Upload documents to Supabase Storage: `producer-docs/{userId}/`.
- Set `verification_docs_url` to the uploaded file URL.
- Redirect to `/producer/dashboard` with banner: "Your company is under review. You can explore talent while we verify your account."

Storage bucket policies for `producer-docs`:
```sql
-- Producer can upload to their own folder
CREATE POLICY "producer upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'producer-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Only admins can read producer docs
CREATE POLICY "admin read producer docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'producer-docs'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'studio_admin', 'studio_staff')
    )
  );
```

### 2. Producer dashboard layout

`src/app/(dashboard)/producer/layout.tsx`:

Sidebar nav items for producer/brand role:
- Dashboard
- Company Profile
- Casting Calls (my calls + create new)
- Talent Search
- Applications (received)
- Auditions
- Settings

### 3. Producer dashboard overview

`src/app/(dashboard)/producer/dashboard/page.tsx`:

Verification banner (if `verified = false`):
> ⏳ "Your company profile is under verification. You can browse talent but cannot post casting calls until verified."

Stat cards:
- Active Casting Calls (count where `status = 'open'`)
- Total Applications Received (sum of applications on all my calls)
- Shortlisted Talent (sum of applications with `status = 'shortlisted'`)
- Auditions Scheduled (count from `auditions` on my calls)

Quick action buttons:
- "+ New Casting Call" (disabled + tooltip if not verified)
- "Search Talent"

Recent activity feed (last 5 application status changes on my calls).

### 4. Company profile edit page

`src/app/(dashboard)/producer/profile/page.tsx`:

Single-page form with:
- Company name
- Company type (select)
- Website
- Bio
- Social links (Instagram, LinkedIn)
- Current verification status badge
- Verification documents section:
  - Show uploaded document name + date
  - "Replace document" option

Auto-save on blur.

### 5. Admin: Producer verification queue

`src/app/(dashboard)/admin/producers/page.tsx`:

Table of all `producer_profiles` where `verified = false`, sorted by `created_at`:

| Company | Type | Submitted | Documents | Action |
|---------|------|-----------|-----------|--------|
| XYZ Productions | Production House | 2 days ago | [View Docs] | [Verify] [Reject] |

Clicking "View Docs" opens the uploaded documents in a new tab (using the admin Supabase client to generate a signed URL).

"Verify" button → sets `producer_profiles.verified = true` → triggers notification email to producer.
"Reject" button → opens a modal with a rejection reason text field → triggers notification email with reason.

```ts
// Server action
export async function verifyProducer(producerId: string) {
  const adminSupa = adminClient
  await adminSupa.from('producer_profiles').update({ verified: true }).eq('id', producerId)
  // Trigger notification (prompt 14)
  await dispatchNotification({
    userId: producerUserId,
    type: 'producer_verified',
    channel: 'email',
    payload: { company_name: ... }
  })
  await logAudit(supabase, 'verify_producer', producerId, {})
}
```

### 6. Verified badge component

`src/components/features/producer/VerifiedBadge.tsx`:

```tsx
export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null
  return (
    <span className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 border border-brand-500/30 rounded-full px-2 py-0.5 text-xs font-medium">
      <CheckCircle2 className="h-3 w-3" />
      Verified
    </span>
  )
}
```

Shown on:
- Producer dashboard sidebar under company name
- Casting call cards (shows producer is verified)
- Talent-facing producer profile view

### 7. Producer public profile page

`src/app/(public)/producer/[id]/page.tsx`:

A simplified public page for verified producers, shown to talent when they view a casting call:
- Company name + type
- Verified badge
- Bio
- Active casting calls (list of open calls by this producer)
- Social links

### 8. Zod validation schemas

`src/lib/validations/producer-onboarding.ts`:

```ts
export const producerStep1Schema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_type: z.enum([
    'production_house', 'brand', 'ad_agency',
    'independent_producer', 'casting_director'
  ]),
  website: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
  linkedin_url:  z.string().url().optional().or(z.literal('')),
})

export const producerStep2Schema = z.object({
  verification_docs_url: z.string().url('Upload at least one verification document'),
  representative_note: z.string().max(300).optional(),
})
```

---

## Deliverables checklist

- [ ] 2-step producer onboarding wizard
- [ ] Supabase Storage `producer-docs` bucket with correct policies
- [ ] Producer dashboard layout with sidebar
- [ ] Dashboard overview: verification banner + stat cards + quick actions
- [ ] Company profile edit page with auto-save
- [ ] Admin producer verification queue page (table + verify/reject actions)
- [ ] Signed URL for admin document preview
- [ ] `VerifiedBadge` component
- [ ] Producer public profile page
- [ ] Notification dispatch on verify/reject (stub call to `dispatchNotification`)
- [ ] Audit logging on verify/reject actions
