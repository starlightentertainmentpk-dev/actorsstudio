# Sub-Prompt 16 — Navigation & Missing Pages Cleanup

**Phase:** Tier 1 — Step 16 of 17  
**Depends on:** `12-auth-middleware-header.md`, `13-admin-talent-approval.md`, `14-auditions-scheduling.md`  
**Delivers:** Clean, 404-free navigation interface by building stubs and dashboards for settings, analytics, and user lists.

---

## Context

The navigation sidebar defines links to pages that do not yet exist in the codebase:
- Talent: `/talent/auditions` (Fixed in Sub-Prompt 14)
- Producer: `/producer/settings`, `/producer/auditions` (Fixed in Sub-Prompt 14)
- Admin: `/admin/users`, `/admin/analytics`

Users clicking these elements see raw Next.js 404 pages. We must build clean, styled settings and statistics layouts for these routes to ensure a cohesive user experience.

---

## Tasks

### 1. Build Producer Settings Page
Create the settings dashboard for producers at `src/app/(dashboard)/producer/settings/page.tsx`:
- Allow producers to toggle notification options (e.g. Email alerts for new submissions, scheduling updates).
- Render account info forms (Name, Company email details, status).
- Re-use UI components from [talent/settings/page.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/app/%28dashboard%29/talent/settings/page.tsx) to maintain stylistic coherence.

### 2. Build Admin User Management Page
Create `src/app/(dashboard)/admin/users/page.tsx`:
- Query and list all accounts from the database `users` table.
- Display a table containing:
  - User ID / Email address.
  - Role Badge (e.g. `talent`, `producer_brand`, `studio_admin`).
  - Active Status (active, suspended).
  - Date Created.
- Add an action button allowing the super admin to change roles or suspend/unsuspend user accounts (updates the `users.status` field in the database).

### 3. Build Admin Analytics Page
Create `src/app/(dashboard)/admin/analytics/page.tsx`:
- Build a statistics dashboard displaying cards for platform growth metrics:
  - **Total Talent Accounts** (grouped by verification state).
  - **Total Producer Accounts** (grouped by verified state).
  - **Total Casting Calls** (draft vs. open vs. closed).
  - **Application Success Rate** (total shortlists and selections vs. total submissions).
- Use simple, styled CSS/SVG bar graphs to represent categories and talent distribution without installing heavy charting libraries if possible, or use standard shadcn charts.

---

## Verification

1. **Producer Settings Navigation:**
   - Log in as a producer, open the sidebar, and click "Settings".
   - Verify the page displays correctly instead of a 404.
2. **Admin User and Analytics Portals:**
   - Log in as an admin.
   - Navigate to `/admin/users` and `/admin/analytics` using the sidebar.
   - Verify that all active users are loaded in the table and that statistical counts match database state.
