# Sub-Prompt 13 — Admin Talent Approval Queue

**Phase:** Tier 1 — Step 13 of 17  
**Depends on:** `04-talent-registration.md` (onboarding registration completes to 'pending' status)  
**Delivers:** Complete talent onboarding review flow for admins to transition talent from `'pending'` to `'approved'` status, enabling them to apply and be searched.

---

## Context

Newly registered talent profiles default to a `verification_status` of `'pending'`. Currently, they cannot apply to casting calls or show up in search results because both actions check for `verification_status = 'approved'`. There is no interface in the admin panel to view, inspect, or approve these talent profiles, causing a deadlock where talent profiles remain pending indefinitely.

---

## Tasks

### 1. Create Admin Talent Server Actions
Create a new file `src/app/(dashboard)/admin/talent/actions.ts` with server actions to modify the validation status of a talent profile, with audit logging:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTalentVerificationStatus(
  profileId: string,
  newStatus: 'approved' | 'rejected' | 'under_review' | 'interview_scheduled' | 'blacklisted' | 'inactive',
  rejectionReason?: string
) {
  const supabase = await createClient()

  // 1. Authenticate user and verify admin authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminUser || !['super_admin', 'studio_admin', 'studio_staff'].includes(adminUser.role)) {
    throw new Error('Unauthorized')
  }

  // 2. Perform the update
  const updatePayload: any = {
    verification_status: newStatus,
    updated_at: new Date().toISOString(),
  }

  // In a future step, the rejectionReason can be emailed to the talent.
  // For now, save it in measurements_json or metadata_json if necessary, or pass to audit logs.
  
  const { error } = await supabase
    .from('talent_profiles')
    .update(updatePayload)
    .eq('id', profileId)

  if (error) throw error

  // 3. Log the audit activity
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: `talent_verification_${newStatus}`,
    entity: 'talent_profiles',
    entity_id: profileId,
    payload_json: { reason: rejectionReason || null }
  })

  // 4. Revalidate cache
  revalidatePath('/admin/talent')
  revalidatePath('/producer/talent-search')
  return { success: true }
}
```

### 2. Implement the Admin Talent Review Page
Create a new route file at `src/app/(dashboard)/admin/talent/page.tsx`. This page should contain:
- A search bar to filter by name.
- Status filters (tabs for `'all'`, `'pending'`, `'under_review'`, `'approved'`, `'rejected'`).
- A table listing:
  - Full Name (and category)
  - Date Submitted
  - Current Status Badge
  - Experience Years
  - Actions button to inspect / review.
- An **Inspection Modal/Drawer** that appears when clicking a row:
  - Display the talent's composite card, stats, biography, and media assets (photos, video reel).
  - Provide a panel with action buttons:
    - **Approve Profile:** Sets status to `'approved'` and publishes them to the directory.
    - **Mark Under Review:** Transitions status to `'under_review'`.
    - **Reject Profile:** Opens a text area for feedback (reason) and sets status to `'rejected'`.

### 3. Update the Admin Sidebar & Home Dashboard
- Modify [Sidebar.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/Sidebar.tsx) to redirect the `"User Management"` or a new `"Talent Queue"` sidebar item to `/admin/talent`.
- Update the main `/admin/page.tsx` dashboard home to fetch the count of pending talent profiles:
  ```ts
  const { data: pendingCount } = await supabase
    .from('talent_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'pending')
  ```
  Display this count prominently as an admin action card.

---

## Verification

1. **Pending Talent Registration:**
   - Sign up a new talent account and complete onboarding.
   - Access the database or admin panel. Verify the profile defaults to `'pending'`.
2. **Admin Queue Validation:**
   - Log in as a `studio_admin` and navigate to `/admin/talent`.
   - Verify the new talent profile is listed under the "Pending" tab.
3. **Approval Execution:**
   - Open the profile inspector modal and click "Approve Profile".
   - Refresh the page and verify the profile status has changed to `'approved'` in the table.
   - Navigate to `/producer/talent-search` as a producer, and verify this talent is now discoverable.
