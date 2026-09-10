# Sub-Prompt 14 — Auditions Scheduling & Feedback Portal

**Phase:** Tier 1 — Step 14 of 17  
**Depends on:** `11-applications-flow.md` (casting applications workflow is active)  
**Delivers:** Fully functional audition booking backend actions, casting director scheduling interface, talent calendar, and grading/scoring portal.

---

## Context

Currently, when a producer shortlists an applicant and clicks "Schedule Audition", they see a placeholder modal that only simulates transitioning the application state. No actual rows are inserted into the `auditions` table, and both the `/talent/auditions` and `/producer/auditions` calendar dashboards are missing (returning 404s). We need to build the real scheduler form, connect it to the database, and display the scheduled auditions.

---

## Tasks

### 1. Implement Audition Server Actions
Create or update actions in `src/app/(dashboard)/producer/applications/actions.ts` to schedule an audition and save feedback/results:

```ts
// src/app/(dashboard)/producer/applications/actions.ts

export async function scheduleAudition(params: {
  castingCallId: string
  talentId: string
  mode: 'in_person' | 'self_tape' | 'video_call'
  scheduledAt: string
  locationOrLink?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership of the casting call
  const { data: call } = await supabase
    .from('casting_calls')
    .select('id, producer_id, producer_profiles(user_id)')
    .eq('id', params.castingCallId)
    .single()

  if ((call as any)?.producer_profiles?.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // 1. Insert row in auditions table
  const { data: audition, error: auditErr } = await supabase
    .from('auditions')
    .insert({
      casting_call_id: params.castingCallId,
      talent_id: params.talentId,
      mode: params.mode,
      scheduled_at: params.scheduledAt,
      location_or_link: params.locationOrLink || null,
      result: 'pending'
    })
    .select()
    .single()

  if (auditErr) throw auditErr

  // 2. Update application status to 'audition'
  const { error: appErr } = await supabase
    .from('applications')
    .update({ status: 'audition', updated_at: new Date().toISOString() })
    .eq('casting_call_id', params.castingCallId)
    .eq('talent_id', params.talentId)

  if (appErr) throw appErr

  // 3. Log Audit
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'schedule_audition',
    entity: 'auditions',
    entity_id: audition.id,
  })

  // 4. Send notification dispatch placeholder (implemented in Phase 4)
  await dispatchNotification({
    targetUserId: 'talent_user_id', // Look up from profile
    type: 'audition_scheduled',
    channel: 'email',
    payload: { audition_id: audition.id }
  })
}

export async function submitAuditionResult(
  auditionId: string,
  score: number,
  feedback: string,
  result: 'pass' | 'fail'
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('auditions')
    .update({
      score,
      feedback,
      result,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditionId)

  if (error) throw error
  return { success: true }
}
```

### 2. Implement the Booking Form Modal
In `src/app/(dashboard)/producer/casting/[id]/applications/page.tsx`, replace the `schedulerModalOpen` placeholder modal with a functional form:
- Inputs:
  - **Audition Mode:** Dropdown matching `in_person` (Physical), `self_tape` (Recorded), `video_call` (Online).
  - **Date & Time:** Datetime-local picker.
  - **Location or Link:** Text input (e.g. Google Maps link, Zoom link, or address).
- Submission triggers the `scheduleAudition` server action and invalidates React Query lists.

### 3. Create the Talent Auditions Page
Create `src/app/(dashboard)/talent/auditions/page.tsx`:
- Retrieve scheduled auditions for the active user:
  ```ts
  const { data: auditions } = await supabase
    .from('auditions')
    .select('*, casting_calls(title, location)')
    .eq('talent_id', profile.id)
  ```
- Display cards representing each audition:
  - Title, Date, and Time.
  - Mode Badge (color-coded).
  - Joining Link (for video calls) or physical Address.
  - Outcome/Result status once available.

### 4. Create the Producer Auditions Page
Create `src/app/(dashboard)/producer/auditions/page.tsx`:
- List all scheduled auditions created by the producer across all casting calls.
- Include a **"Review Feedback" Action Button** next to pending audits.
- Clicking the action opens a drawer/modal to fill:
  - **Score Slider/Input:** Decimal value between 0.00 and 10.00.
  - **Feedback Comments:** Rich text review notes.
  - **Outcome Decision:** Approve/Select or Decline talent. If Approved, update the underlying application status to `'selected'`.

---

## Verification

1. **Schedule Audition:**
   - Log in as a producer, navigate to a casting call submissions directory.
   - Click "Schedule Audition" on a shortlisted applicant, fill the form with an upcoming date/time, select `video_call`, write a Zoom link, and submit.
   - Verify the applicant's status updates to `Audition Scheduled` and the modal closes.
2. **Talent Dashboard Verification:**
   - Log in as the talent.
   - Navigate to `/talent/auditions`. Verify the audition appears with correct Zoom links and dates.
3. **Submit Feedback:**
   - Log in as the producer, navigate to `/producer/auditions`.
   - Find the audition, click "Review", enter a score of `9.50` with notes, and select "Result: PASS".
   - Verify the audit logs and that the application transitions to `'selected'`.
