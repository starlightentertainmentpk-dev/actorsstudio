# Master Build Prompt — Completing the Actor's Studio Platform

This document serves as the implementation plan and detailed instruction set to complete the outstanding Tier-1 MVP loops and correct all stubs/gaps in the **Actor's Studio** codebase. Use this checklist as a guide to achieve 100% completeness.

---

## 🎯 Completion Goals

1. **Active Edge Protection:** Move routing rules from client-only hooks to server-side Next.js middleware.
2. **Talent Approval Queue:** Implement the admin panel dashboard and list view to approve/reject talent.
3. **Functional Auditions & Scheduling:** Transition audition management from simulated status updates to a real booking flow.
4. **Active Notification Channels:** Integrate the Resend client to send emails on lifecycle events instead of logging to console.
5. **UI & Navigation Polish:** Bind current session details to dashboards and hide or build missing 404 routes.
6. **Testing Harness:** Set up Vitest to test the core register, apply, and verify loops.

---

## 🛠️ Step-by-Step Task List

### Phase 1: Edge Protection & Header Binding (Auth & Routing)
- [ ] **Activate Next.js Middleware:**
  - Rename `src/proxy.ts` to `src/middleware.ts` in the `src/` directory.
  - Verify that unauthorized guests attempting to visit `/talent/*`, `/producer/*`, or `/admin/*` are intercepted at the server boundary and redirected to `/auth/login`.
- [ ] **Bind Session User in Dashboard Shell:**
  - Locate [DashboardShell.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/DashboardShell.tsx).
  - Replace the hardcoded placeholders (`user@role.com` and `Role User`) with data fetched from the authenticated user session (retrieve the user object via React Query or Supabase client).

---

### Phase 2: Admin Talent Onboarding Approval Queue
- [x] **Create Talent Moderation Route:**
  - Create the page at `src/app/(dashboard)/admin/talent/page.tsx`.
  - Display a table listing all talent profiles whose `verification_status` is not `'approved'` (e.g. `'pending'`, `'under_review'`).
- [x] **Implement Review Modal:**
  - Let admins click a profile to view details, photos, reels, and stats in a drawer or modal.
  - Provide actions: **Approve Profile** (sets status to `'approved'`), **Reject Profile** (prompts for a reason, sets status to `'rejected'`), or **Mark Under Review** (sets status to `'under_review'`).
- [x] **Implement Server Actions:**
  - Create `src/app/(dashboard)/admin/talent/actions.ts` containing the server actions to execute these status updates in the database.
- [x] **Link from Dashboard:**
  - Link `/admin/talent` from the Admin sidebar and show the count of pending profiles on the main Admin portal (`/admin/page.tsx`).

---

### Phase 3: Auditions Booking & Scheduling
- [ ] **Implement the Audition Table Logic:**
  - Connect the "Schedule Audition" button in [CastingCallApplicationsPage](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/%28dashboard%29/producer/casting/%5Bid%5D/applications/page.tsx) to insert rows into the `auditions` table with specific dates/times, modes (`in_person`, `self_tape`, `video_call`), and links/locations.
- [ ] **Create the Talent Auditions Page:**
  - Build `src/app/(dashboard)/talent/auditions/page.tsx`.
  - Fetch and render all scheduled auditions for the logged-in talent.
  - Allow self-tape uploads (link to a file in Supabase storage) and let talent view video links or map locations.
- [ ] **Create the Producer Auditions Page:**
  - Build `src/app/(dashboard)/producer/auditions/page.tsx`.
  - Display a calendar or list of all upcoming auditions scheduled by the producer.
  - Allow the producer to add feedback, enter scores (0–10.00), and mark results (`pass` / `fail`).

---

### Phase 4: Email Notifications (Resend Integration)
- [x] **Set up Resend Client:**
  - Add `RESEND_API_KEY` to `.env.local`.
  - Create `src/lib/resend.ts` initializing the Resend client.
- [x] **Implement Real Email Dispatch:**
  - Rewrite the stubbed `dispatchNotification` function in the following files:
    - [admin/producers/actions.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/(dashboard)/admin/producers/actions.ts)
    - [talent/casting/actions.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/(dashboard)/talent/casting/actions.ts)
    - [producer/applications/actions.ts](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/(dashboard)/producer/applications/actions.ts)
  - Configure it to send actual emails to users on:
    - Producer approval / rejection (with reasons)
    - Application status updates (shortlisted, audition scheduled, selected)
    - Audition invitations with scheduling details.

---

### Phase 5: Navigation & Sidebar Cleanup
- [x] **Create Missing Pages & Stubs:**
  - Create `/producer/settings` at `src/app/(dashboard)/producer/settings/page.tsx` (re-use the structure of the talent settings page).
  - Create `/admin/users` showing a list of all registered platform users.
  - Create `/admin/analytics` showing basic charts of total talent, producers, active casting calls, and bookings.
- [x] **Or Hide Missing Modules:**
  - If a page is not part of the initial MVP launch window, comment out or hide its navigation node in [Sidebar.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/Sidebar.tsx) to prevent users from encountering 404 pages.

---

### Phase 6: Automated Test Suite Setup
- [x] **Install Test Runner:**
  - Install Vitest and jsdom.
  - Configure `vitest.config.ts` at the root.
- [x] **Write Core Integration Tests:**
  - Create unit/integration tests for:
    - Auth flow (login, register validation).
    - Talent onboarding forms (verify Zod validation schema).
    - Status transitions (producer shortlisting talent, admin verifying producer).

---

## 📋 Verification Checklist

Run these manual smoke checks when finished:
1. [ ] **Middleware:** Try visiting `/talent/dashboard` in an incognito window. Verify it redirects you to `/auth/login?next=%2Ftalent%2Fdashboard`.
2. [ ] **Talent Loop:** Register a new talent account → complete onboarding. Verify that the profile appears in the Admin's Talent Queue.
3. [ ] **Admin approval:** Approve the talent profile. Verify the talent is now visible on `/producer/talent-search` and can click "Apply" on casting calls.
4. [ ] **Audition flow:** As a producer, shortlist the talent application → Schedule an audition slot. Verify the audition card displays in the talent dashboard and calendar.
5. [ ] **Email test:** Check the console log or Resend control panel to ensure notification emails are triggered.
