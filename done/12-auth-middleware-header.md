# Sub-Prompt 12 — Edge Routing Middleware & Dashboard Header Binding

**Phase:** Tier 1 — Step 12 of 17  
**Depends on:** `03-auth-roles.md` (Authentication infrastructure setup)  
**Delivers:** Proper server-side edge redirection and dynamic user context in the dashboard shell headers.

---

## Context

Currently, the server-side role redirections are configured in `src/proxy.ts` but are not executed by Next.js because the file is not named `middleware.ts`. Redirection is solely running on client-side React hooks, exposing brief flickers of dashboard content before redirecting unauthorized users. Additionally, the dashboard header sidebar shell has hardcoded details like `user@role.com` rather than reading from the active Supabase session.

---

## Tasks

### 1. Rename and Activate Next.js Middleware
Move and rename the proxy file to the root of the source directory so that Next.js automatically executes it as edge middleware on all requests:
- Target File: `src/middleware.ts` (renamed from `src/proxy.ts`).
- Verify that standard route matching config matches:
  ```ts
  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  }
  ```

### 2. Update Dashboard Shell Header Context
Modify [DashboardShell.tsx](file:///c:/My%20Drive/My%20Drive/ActorsStudio/src/components/shared/DashboardShell.tsx) to fetch the logged-in user details and display them dynamically in the top-right user panel, replacing the hardcoded stubs.

Use the `useUser` hook (or query client cache) to pull email and role values:
```tsx
// src/components/shared/DashboardShell.tsx
// Replace:
<div className="hidden sm:block text-left">
  <p className="text-xs font-semibold leading-none text-foreground capitalize">{role} User</p>
  <p className="text-[10px] text-muted-foreground leading-none mt-1">user@{role}.com</p>
</div>

// With:
<div className="hidden sm:block text-left">
  <p className="text-xs font-semibold leading-none text-foreground capitalize">
    {role === "talent" ? "Artist Account" : role === "producer" ? "Producer Account" : "Studio Admin"}
  </p>
  <p className="text-[10px] text-muted-foreground leading-none mt-1">
    {user?.email || `user@${role}.com`}
  </p>
</div>
```

---

## Verification

1. **Incognito Redirection Test:**
   - Open an incognito browser.
   - Navigate directly to `/talent/dashboard`.
   - Verify that you are immediately redirected to `/auth/login?next=%2Ftalent%2Fdashboard` on the server-side, with no page flicker.
2. **Dashboard Shell Verification:**
   - Log in with any account.
   - Look at the top-right header avatar menu.
   - Verify the profile text correctly displays your active email instead of a placeholder.
