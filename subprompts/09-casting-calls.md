# Sub-Prompt 09 — Casting Calls

**Phase:** Tier 1 — Step 9 of 10  
**Depends on:** `08-producer-registration.md` (verified producers exist), `07-category-management.md` (categories seeded)  
**Delivers:** Full casting call creation, management, and public listing — the core content feed of the platform.

---

## Context

Casting calls are the central matching mechanism. Producers post calls; talent applies. This prompt covers:
1. **Producer side** — create, edit, publish, close, delete casting calls
2. **Public side** — listing page with filters and individual call detail page
3. **Admin side** — ability to moderate (flag, close) any call

---

## Tasks

### 1. Casting call Zod schema

`src/lib/validations/casting-call.ts`:

```ts
import { z } from 'zod'

export const castingCallSchema = z.object({
  title:               z.string().min(5, 'Title must be at least 5 characters').max(120),
  description:         z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category_id:         z.string().uuid('Select a category'),
  location:            z.string().min(2, 'Location is required'),
  shoot_date:          z.string().optional(),  // YYYY-MM-DD
  application_deadline: z.string().optional(), // ISO datetime
  compensation:        z.string().max(200).optional(),
  requirements_json:   z.object({
    gender:        z.enum(['male', 'female', 'any']).optional(),
    age_min:       z.coerce.number().min(0).max(100).optional(),
    age_max:       z.coerce.number().min(0).max(100).optional(),
    languages:     z.array(z.string()).optional(),
    skills:        z.array(z.string()).optional(),
    experience_min: z.coerce.number().min(0).optional(),
    notes:         z.string().max(500).optional(),
  }).optional(),
  status: z.enum(['draft', 'open', 'closed', 'cancelled']).default('draft'),
})
```

### 2. Create/Edit casting call form

`src/app/(dashboard)/producer/casting/create/page.tsx`  
`src/app/(dashboard)/producer/casting/[id]/edit/page.tsx`

Both use the same `CastingCallForm` component. On edit, pre-populate with existing data.

**Fields:**

**Basic Info:**
- Title (text, required)
- Description (rich textarea — use `react-quill` or a plain `<textarea>` with Markdown hints)
- Category (select from categories tree — show root categories only, not sub-categories for calls)

```bash
# If using rich text editor
npm install react-quill
```

**Schedule & Location:**
- Location (text — "Karachi Studio", "Lahore", "On-location TBD")
- Shoot Date (date picker — optional)
- Application Deadline (datetime picker — optional but recommended)

**Requirements:**
- Gender preference (radio: Any / Male / Female)
- Age range (dual-handle range slider — min/max)
- Languages (multi-checkbox: Urdu, English, Punjabi, etc.)
- Skills required (tag input)
- Minimum experience years (number input)
- Additional notes (textarea, 500 chars)

**Compensation:**
- Free text field: e.g., "PKR 50,000 per day", "Contra/TVC", "To be discussed", "Volunteer"

**Status:**
- Draft — not visible publicly
- Open — live and accepting applications
- Closed — visible but not accepting new applications

**Action buttons:**
- "Save as Draft" → `status = 'draft'`
- "Publish Now" → `status = 'open'`

Validation: producers with `verified = false` cannot publish (`status = 'open'`). Show tooltip: "Verify your company to publish casting calls."

### 3. Server actions

`src/app/(dashboard)/producer/casting/actions.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCastingCall(data: CastingCallFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch producer_profile to get producer_id
  const { data: producer } = await supabase
    .from('producer_profiles')
    .select('id, verified')
    .eq('user_id', user.id)
    .single()

  if (!producer) throw new Error('Producer profile not found')
  if (data.status === 'open' && !producer.verified) {
    throw new Error('Your company must be verified to publish casting calls')
  }

  const { data: call, error } = await supabase
    .from('casting_calls')
    .insert({ ...data, producer_id: producer.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  await logAudit(supabase, 'create_casting_call', call.id, { title: data.title })
  revalidatePath('/producer/casting')
  return call
}

export async function updateCastingCall(id: string, data: Partial<CastingCallFormData>) {
  // Same auth + ownership check, then update
}

export async function deleteCastingCall(id: string) {
  // Check no open applications, then delete
}

export async function closeCastingCall(id: string) {
  // Set status = 'closed'
}
```

### 4. Producer casting calls list page

`src/app/(dashboard)/producer/casting/page.tsx`:

Table/list of all casting calls owned by the current producer:

| Title | Status | Category | Deadline | Applications | Actions |
|-------|--------|----------|----------|--------------|---------|
| Lead Role in Drama | 🟢 Open | TV Actor | 3 days left | 24 | Edit / Close / View |

- Color-coded status badges.
- "Applications" count is a clickable link to the applications list for that call (prompt 11).
- Filter tabs: All / Draft / Open / Closed.
- "+ New Casting Call" button.
- Confirmation dialog before deleting or closing.

### 5. Public casting call listing page

`src/app/(public)/casting/page.tsx`:

Server component with ISR (`revalidate = 300` — 5 minutes).

Fetch all `status = 'open'` casting calls, ordered by `created_at DESC`. Limit 12 per page.

**Casting Call Card:**
```
┌────────────────────────────────────────────────────┐
│  [Category icon]  Lead Role — Drama Series         │
│  XYZ Productions  ✓  •  Karachi  •  TV Actor       │
│  ─────────────────────────────────────────────────  │
│  Female • Age 20–35 • Urdu, English                │
│  Compensation: PKR 80,000/episode                  │
│  Deadline: 3 days  •  18 applied                   │
│                           [View Details →]         │
└────────────────────────────────────────────────────┘
```

**Filters sidebar (client component):**
- Category (checkbox list)
- Location (text search)
- Gender required
- Compensation type (paid / contra / any)
- Deadline (today, this week, this month)

Implement filters via URL search params (`?category=tv-actor&location=karachi`).

### 6. Public casting call detail page

`src/app/(public)/casting/[id]/page.tsx`:

Dynamic route, ISR (`revalidate = 300`).

Fetch casting call by ID (only `status = 'open'` or redirect to listing). Join with producer profile.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  LEAD ROLE — UPCOMING DRAMA SERIES                       │
│  XYZ Productions ✓  •  Karachi  •  Posted 2 days ago    │
│  Deadline: 15 Jul 2026 (3 days remaining)  ⚡ Urgent     │
├──────────────────────────────────────────────────────────┤
│  Description: Full rich text                             │
│  Requirements:                                           │
│    • Gender: Female                                      │
│    • Age: 20–35                                          │
│    • Languages: Urdu, English                            │
│    • Skills: Acting, Dialogue Delivery                   │
│    • Experience: 2+ years                                │
│    • Notes: Must be available weekends                   │
│  Compensation: PKR 80,000/episode                        │
│  Shoot Date: August 2026                                 │
│  Location: Karachi                                       │
├──────────────────────────────────────────────────────────┤
│  [Apply Now] — visible to authenticated talent only      │
│  If not logged in: [Log in to Apply]                     │
│  If already applied: "You applied on July 10" [Withdraw] │
└──────────────────────────────────────────────────────────┘
```

"Apply Now" → triggers application creation (prompt 11).

### 7. Casting call metadata

`generateMetadata` for the detail page:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: call } = await supabase
    .from('casting_calls')
    .select('title, description, location, producer_profiles(company_name)')
    .eq('id', params.id)
    .single()

  return {
    title: `${call.title} | Actor's Studio Casting`,
    description: call.description?.slice(0, 160),
    openGraph: {
      title: `Casting: ${call.title}`,
      description: `Posted by ${call.producer_profiles?.company_name} • ${call.location}`,
      type: 'article',
    },
  }
}
```

### 8. Admin moderation

`src/app/(dashboard)/admin/casting/page.tsx`:

Admins see ALL casting calls across all producers. Extra column: Producer company name.
Admin actions:
- **Close** any call (override producer status).
- **Flag** a call (add a `flagged` boolean field to `casting_calls` — add via new migration if needed, or use `requirements_json.admin_flagged`).
- Admin can view even `draft` status calls.

---

## Deliverables checklist

- [ ] Zod schema with `requirements_json` typed sub-object
- [ ] `CastingCallForm` reusable component (create + edit)
- [ ] Rich text or enhanced textarea for description
- [ ] Age range slider
- [ ] Server actions: create, update, delete, close (with producer ownership check)
- [ ] Producer casting calls list page with status tabs
- [ ] Public listing page with ISR + filter sidebar via URL search params
- [ ] Casting call card component
- [ ] Public detail page with apply/withdraw CTA
- [ ] `generateMetadata` for SEO on detail page
- [ ] Admin casting calls moderation page
