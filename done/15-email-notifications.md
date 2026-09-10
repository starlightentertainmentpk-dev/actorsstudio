# Sub-Prompt 15 — Email Notifications via Resend

**Phase:** Tier 1 — Step 15 of 17  
**Depends on:** `12-auth-middleware-header.md`, `13-admin-talent-approval.md`, `14-auditions-scheduling.md`  
**Delivers:** Active, production-ready email dispatching for user registration, application changes, and audition updates.

---

## Context

The `dispatchNotification` function is stubbed out with `console.log` statements in all database mutation actions (producers, applications, audits). We need to integrate a third-party email provider (**Resend**) to replace all stubs and send real transactional emails to our users.

---

## Tasks

### 1. Install Resend dependency
Add `resend` to your package dependencies:
- Run in terminal:
  ```bash
  npm install resend
  ```

### 2. Configure Environment Variables
Add the following keys to your [.env.local](file:///c:/My%20Drive/My%20Drive/ActorsStudio/.env.local) file:
```env
RESEND_API_KEY=re_your_actual_key_here
SYSTEM_FROM_EMAIL=notifications@actorsstudio.pk # Or onboarding@resend.dev for test sandbox
```

### 3. Create the Notifications Dispatch Module
Create a new file `src/lib/notifications.ts` to host a unified dispatch mechanism:

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.SYSTEM_FROM_EMAIL || 'onboarding@resend.dev'

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not defined. Email logged to console:')
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${html}`)
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Actors Studio <${fromEmail}>`,
      to,
      subject,
      html,
    })

    if (error) throw error
    return data
  } catch (err) {
    console.error('Failed to send email via Resend:', err)
  }
}

// Map notification types to html templates
export async function dispatchNotification(params: {
  targetEmail: string
  type: 'producer_approved' | 'producer_rejected' | 'application_shortlisted' | 'audition_scheduled' | 'talent_selected'
  payload: Record<string, any>
}) {
  let subject = ''
  let html = ''

  switch (params.type) {
    case 'producer_approved':
      subject = 'Welcome to Actors Studio! Your Producer Account is Approved'
      html = `<p>Hi ${params.payload.company_name},</p><p>Congratulations! Your business account has been verified. You can now publish casting calls and view talent details.</p>`
      break
    case 'producer_rejected':
      subject = 'Actors Studio — Producer Verification Update'
      html = `<p>Hi ${params.payload.company_name},</p><p>Your application was not approved for the following reason:</p><blockquote style="color:red;">"${params.payload.reason}"</blockquote><p>Please update your onboarding details and re-upload supporting documents.</p>`
      break
    case 'application_shortlisted':
      subject = 'Good News! You have been Shortlisted!'
      html = `<p>Hi,</p><p>Your application to the casting call <strong>${params.payload.call_title}</strong> has been shortlisted by the casting director.</p><p>Check your dashboard for upcoming schedule slots.</p>`
      break
    case 'audition_scheduled':
      subject = 'Audition Scheduled — Action Required'
      html = `<p>Hi,</p><p>An audition has been scheduled for you!</p><ul><li><strong>Mode:</strong> ${params.payload.mode}</li><li><strong>Time:</strong> ${params.payload.time}</li><li><strong>Location/Link:</strong> <a href="${params.payload.link}">${params.payload.link}</a></li></ul><p>Please review and confirm your availability.</p>`
      break
    case 'talent_selected':
      subject = 'Congratulations! You have been Selected!'
      html = `<p>Hi,</p><p>You have been officially SELECTED for the role in <strong>${params.payload.call_title}</strong>!</p><p>A representative from the studio will contact you shortly regarding booking contracts.</p>`
      break
  }

  await sendEmail({
    to: params.targetEmail,
    subject,
    html,
  })
}
```

### 4. Replace Stub Logs in Actions
Find all occurrences of `console.log("Notification dispatched:")` or similar stubs in the server actions, import the new `dispatchNotification` from `@/lib/notifications`, retrieve the target user's email, and trigger the email sending:
- **Producer Actions:** [admin/producers/actions.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/(dashboard)/admin/producers/actions.ts) (Trigger `'producer_approved'` / `'producer_rejected'`).
- **Shortlist / Selection Actions:** [producer/applications/actions.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/(dashboard)/producer/applications/actions.ts) (Trigger `'application_shortlisted'` / `'talent_selected'`).
- **Audition Scheduler Actions:** (Trigger `'audition_scheduled'`).

---

## Verification

1. **Trigger Onboarding Status Update:**
   - Log in as admin.
   - Decline a pending producer account with the reason: "Invalid NTN certificate uploaded".
   - Check the console logs (if API keys are missing) or check your inbox to ensure the email with the feedback is delivered.
2. **Shortlist Application:**
   - As a producer, shortlist a talent's submission.
   - Verify the talent receives an email notifying them of their shortlisted status.
