# Sub-Prompt 11 — Applications Flow & Status Tracking

**Phase:** Tier 1 — Step 11 of 15  
**Depends on:** `09-casting-calls.md` (casting calls exist), `04-talent-registration.md` (talent profiles exist)  
**Delivers:** End-to-end application lifecycle — talent applies, producer shortlists/rejects, talent tracks status — with real-time status updates.

---

## Context

The application flow is the heartbeat of the marketplace:

```
Talent Applies → Applied → Shortlisted → Audition → Selected / Rejected
                                       ↗ (producer) ↘
                         Withdrawn (by talent)
```

Both parties must be able to see and act on applications from their dashboards.

---

## Tasks

### 1. Application server actions

`src/app/(dashboard)/talent/casting/actions.ts`:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function applyToCastingCall(castingCallId: string, coverNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get talent profile
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id, verification_status')
    .eq('user_id', user.id)
    .single()

  if (!talent) throw new Error('Talent profile not found')
  if (talent.verification_status !== 'approved') {
    throw new Error('Only approved talent can apply to casting calls')
  }

  // Check not already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('casting_call_id', castingCallId)
    .eq('talent_id', talent.id)
    .maybeSingle()

  if (existing && existing.status !== 'withdrawn') {
    throw new Error('You have already applied to this casting call')
  }

  // Insert or re-insert if withdrawn
  if (existing?.status === 'withdrawn') {
    await supabase
      .from('applications')
      .update({ status: 'applied', cover_note: coverNote, withdrawn_at: null, applied_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('applications')
      .insert({ casting_call_id: castingCallId, talent_id: talent.id, status: 'applied', cover_note: coverNote })
  }

  // Notify producer
  await dispatchNotification({ targetUserId: 'producer_user_id', type: 'new_application', channel: 'email', payload: { casting_call_id: castingCallId } })

  await logAudit(supabase, 'apply', castingCallId, { talent_id: talent.id })
  revalidatePath(`/casting/${castingCallId}`)
  revalidatePath('/talent/applications')
}

export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Verify ownership
  const { data: app } = await supabase
    .from('applications')
    .select('id, status, talent_id')
    .eq('id', applicationId)
    .single()

  if (app?.talent_id !== talent?.id) throw new Error('Forbidden')
  if (['selected', 'audition'].includes(app?.status)) {
    throw new Error('Cannot withdraw an application that is already in audition/selected stage. Contact the studio.')
  }

  await supabase
    .from('applications')
    .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
    .eq('id', applicationId)

  revalidatePath('/talent/applications')
}
```

### 2. Producer: update application status

`src/app/(dashboard)/producer/applications/actions.ts`:

```ts
'use server'
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: 'shortlisted' | 'audition' | 'selected' | 'rejected'
) {
  const supabase = await createClient()
  // Verify producer owns the casting call
  const { data: app } = await supabase
    .from('applications')
    .select('id, casting_call_id, talent_id, status')
    .eq('id', applicationId)
    .single()

  const { data: call } = await supabase
    .from('casting_calls')
    .select('producer_id, producer_profiles(user_id)')
    .eq('id', app.casting_call_id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  if ((call as any)?.producer_profiles?.user_id !== user?.id) throw new Error('Forbidden')

  // Validate status transition
  const VALID_TRANSITIONS: Record<string, string[]> = {
    applied:     ['shortlisted', 'rejected'],
    shortlisted: ['audition', 'rejected'],
    audition:    ['selected', 'rejected'],
    selected:    [],
    rejected:    ['shortlisted'], // allow re-consideration
    withdrawn:   [],
  }

  if (!VALID_TRANSITIONS[app.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${app.status} to ${newStatus}`)
  }

  await supabase
    .from('applications')
    .update({ status: newStatus })
    .eq('id', applicationId)

  // Notify talent of status change
  await dispatchNotification({
    targetUserId: /* talent user_id */ null,
    type: 'application_status_changed',
    channel: 'email',
    payload: { new_status: newStatus }
  })

  await logAudit(supabase, 'update_application_status', applicationId, { from: app.status, to: newStatus })
  revalidatePath(`/producer/casting/${app.casting_call_id}/applications`)
}
```

### 3. Apply modal (Talent side)

`src/components/features/applications/ApplyModal.tsx`:

Triggered from the casting call detail page's "Apply Now" button.

```tsx
// Dialog with:
// - Casting call title (readonly)
// - Cover note textarea (optional, max 500 chars)
// - Character counter
// - Submit button with loading state
// - Error inline if already applied / not approved
```

On submit: call `applyToCastingCall()` server action.

Success state: confetti animation (optional) + "Application submitted!" toast. Button becomes "Applied ✓" and is disabled.

### 4. Talent: My Applications page

`src/app/(dashboard)/talent/applications/page.tsx`:

**Tab view:**
- All
- Applied
- Shortlisted
- Audition
- Selected
- Rejected/Withdrawn

Each application row shows:

```
┌──────────────────────────────────────────────────────────────┐
│  Lead Role — Drama Series                    🟡 Shortlisted  │
│  XYZ Productions ✓ • Karachi • Applied Jul 5                │
│  Deadline was: Jul 15 2026                                   │
│                               [View Call] [Withdraw]         │
└──────────────────────────────────────────────────────────────┘
```

Status badge colors:
- `applied` → blue
- `shortlisted` → amber
- `audition` → purple  
- `selected` → green 🎉
- `rejected` → red
- `withdrawn` → gray

"Withdraw" button: only visible on `applied` and `shortlisted` status. Opens confirm dialog.

Timeline widget for each application (collapsible):
```
● Applied — Jul 5, 2026
● Shortlisted — Jul 8, 2026
○ Audition (pending)
○ Selected / Rejected (pending)
```

### 5. Producer: Applications management page

`src/app/(dashboard)/producer/casting/[id]/applications/page.tsx`:

Full-page view of all applications for a specific casting call.

**Summary bar at top:**
```
Total: 45   Applied: 20   Shortlisted: 12   Audition: 8   Selected: 2   Rejected: 3
```

**Application cards** — sorted by `applied_at DESC`:

```
┌──────────────────────────────────────────────────────────────┐
│ [Photo] Sara Khan — Actress, Karachi, 5 yrs      🟡 Applied  │
│          Skills: Acting, Dubbing, Hosting                    │
│          Languages: Urdu, English                            │
│          Cover note: "I would be perfect for this role..."  │
│  [View Profile ↗] [Shortlist] [Schedule Audition] [Reject]  │
└──────────────────────────────────────────────────────────────┘
```

- "View Profile" opens talent public portfolio in new tab.
- "Shortlist" → `updateApplicationStatus(id, 'shortlisted')`.
- "Schedule Audition" → opens `AuditionScheduleModal` (prompt 13) pre-filled with this applicant.
- "Reject" → confirm dialog → `updateApplicationStatus(id, 'rejected')`.

**Filter controls:**
- Filter by status tab
- Sort by: Newest / Oldest / Experience (high-low)
- Search by talent name

**Bulk actions:**
- Select multiple → Bulk Reject / Bulk Shortlist.
- Checkbox on each card, "Select All" at top.

```ts
export async function bulkUpdateApplicationStatus(
  applicationIds: string[],
  newStatus: 'shortlisted' | 'rejected'
) {
  // ... loop updateApplicationStatus for each
}
```

### 6. Application count on casting call card

Update the `CastingCallCard` component (prompt 09) to show live application count:

```ts
// Add to the casting call query:
casting_calls(*, applications(count))
// Then display: "24 applications"
```

### 7. Talent: Browse casting calls page

`src/app/(dashboard)/talent/casting/page.tsx`:

Authenticated view of open casting calls — same as public listing (prompt 09) but:
- Shows "Applied ✓" badge if the talent has already applied.
- "Apply Now" button is pre-wired to the ApplyModal.
- Filter by whether they've applied (tabs: All Calls / My Applications).
- My Applications tab shows a mini status timeline inline.

Fetch the talent's applications in the same query to determine applied state:

```ts
// Fetch calls + check if current talent has applied
const { data: callsWithStatus } = await supabase
  .from('casting_calls')
  .select(`
    *,
    categories:category_id(name),
    producer_profiles(company_name, verified),
    applications(id, status, talent_id)
  `)
  .eq('status', 'open')
  .eq('applications.talent_id', talentId)  // left join — returns null if not applied
```

### 8. Real-time updates (optional enhancement)

Use Supabase Realtime to push application status updates to the talent dashboard without a page refresh:

```ts
// In talent applications page
useEffect(() => {
  const channel = supabase
    .channel('application-updates')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'applications', filter: `talent_id=eq.${talentId}` },
      (payload) => {
        // Update local state — show toast "Your application status changed to Shortlisted!"
        toast.info(`Application updated: ${payload.new.status}`)
        router.refresh()
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [])
```

---

## Deliverables checklist

- [ ] `applyToCastingCall` server action with approval check and duplicate guard
- [ ] `withdrawApplication` server action with stage guard
- [ ] `updateApplicationStatus` with valid transition enforcement
- [ ] `bulkUpdateApplicationStatus` for producer bulk actions
- [ ] `ApplyModal` with cover note and loading state
- [ ] Talent "My Applications" page with tabs, status badges, and timeline
- [ ] Producer applications management page with summary bar and bulk actions
- [ ] Application count on casting call cards
- [ ] Talent browse page showing "Applied ✓" state
- [ ] Supabase Realtime listener for live status updates
- [ ] Notification dispatch stubs on apply and status change
