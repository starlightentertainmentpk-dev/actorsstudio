# Sub-Prompt 03 — Auth & Role-Based Routing

**Phase:** Tier 1 — Step 3 of 10  
**Depends on:** `02-supabase-schema.md` (database + users table exist)  
**Delivers:** Full authentication flow (login, register, OAuth, forgot password) with role-based middleware that guards every route group.

---

## Context

**Actor's Studio** has 7 distinct roles: `super_admin`, `studio_admin`, `studio_staff`, `talent`, `agent_manager`, `producer_brand`, `casting_director`. Each role has different allowed route prefixes. Middleware must enforce this — never trust the client.

---

## Tasks

### 1. Next.js Middleware

Create `src/middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin:      ['/admin', '/talent', '/producer', '/casting'],
  studio_admin:     ['/admin', '/talent', '/producer', '/casting'],
  studio_staff:     ['/admin/talent', '/admin/casting', '/admin/auditions'],
  talent:           ['/talent'],
  agent_manager:    ['/agent', '/talent'],
  producer_brand:   ['/producer'],
  casting_director: ['/casting', '/producer'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes — always allow
  const PUBLIC_PATHS = ['/', '/auth', '/talent/', '/casting/', '/about', '/api']
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) return supabaseResponse

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?next=' + path, request.url))
  }

  // Fetch role from public.users
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = userData?.role ?? 'talent'

  // Check if the requested path is allowed for this role
  const allowedPrefixes = ROLE_ROUTES[role] ?? []
  const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix))

  if (!isAllowed) {
    // Redirect to role's home dashboard
    const dashboardMap: Record<string, string> = {
      super_admin:      '/admin',
      studio_admin:     '/admin',
      studio_staff:     '/admin/talent',
      talent:           '/talent/dashboard',
      agent_manager:    '/agent/dashboard',
      producer_brand:   '/producer/dashboard',
      casting_director: '/casting/dashboard',
    }
    return NextResponse.redirect(new URL(dashboardMap[role] ?? '/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 2. Auth pages

Create `src/app/(auth)/layout.tsx` — centered card layout, brand logo, no Sidebar:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-brand-400">
            Actor's Studio
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Pakistan's premier talent marketplace
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

#### Login page — `src/app/(auth)/auth/login/page.tsx`

Requirements:
- Email + password form validated with Zod + react-hook-form.
- "Continue with Google" OAuth button.
- "Forgot password?" link.
- Error messages rendered inline (not alert popups).
- On success, redirect to the user's role dashboard (fetch role from `public.users` after login).
- Show loading spinner while submitting.

Zod schema:
```ts
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
```

Server action or client-side Supabase `signInWithPassword`. Use server action pattern for better DX with Next.js 15.

#### Register page — `src/app/(auth)/auth/register/page.tsx`

Two-step register:

**Step 1 — Account type selection:**
- Cards for: Talent, Producer/Brand, Casting Director.
- Visual icons for each.
- Store selection in state.

**Step 2 — Account creation form:**
- Full name, email, password, confirm password.
- On submit: `supabase.auth.signUp()`, then update `public.users` row with the selected role.
- For Talent: redirect to `/talent/onboarding` (multi-step registration, prompt 04).
- For Producer/Brand: redirect to `/producer/onboarding`.

#### Forgot password — `src/app/(auth)/auth/forgot-password/page.tsx`

- Email input → `supabase.auth.resetPasswordForEmail()`.
- Success state message.

#### Reset password — `src/app/(auth)/auth/reset-password/page.tsx`

- New password + confirm → `supabase.auth.updateUser({ password })`.
- Redirect to login on success.

#### Auth callback — `src/app/auth/callback/route.ts`

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/talent/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Determine the correct dashboard for this user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const dashboardMap: Record<string, string> = {
          super_admin:      '/admin',
          studio_admin:     '/admin',
          studio_staff:     '/admin/talent',
          talent:           '/talent/dashboard',
          agent_manager:    '/agent/dashboard',
          producer_brand:   '/producer/dashboard',
          casting_director: '/casting/dashboard',
        }
        return NextResponse.redirect(new URL(dashboardMap[userData?.role ?? 'talent'], origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
}
```

### 3. Custom hooks

**`src/hooks/useUser.ts`** — returns the current user + role, cached with React Query:

```ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

**`src/hooks/useRequireAuth.ts`** — throws redirect if not authenticated:

```ts
import { useUser } from './useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useRequireAuth(requiredRole?: string) {
  const { data: user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
    if (!isLoading && requiredRole && user?.role !== requiredRole) {
      router.replace('/unauthorized')
    }
  }, [user, isLoading, requiredRole, router])

  return { user, isLoading }
}
```

### 4. Role guard component

`src/components/shared/RoleGuard.tsx`:

```tsx
'use client'
import { useUser } from '@/hooks/useUser'
import { redirect } from 'next/navigation'

type Props = {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback = null }: Props) {
  const { data: user, isLoading } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
```

### 5. Dashboard stub pages

Create placeholder dashboard pages for each role with correct layout:

- `src/app/(dashboard)/talent/dashboard/page.tsx`
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/producer/dashboard/page.tsx`
- `src/app/(dashboard)/casting/dashboard/page.tsx`
- `src/app/(dashboard)/agent/dashboard/page.tsx`

Each should:
- Use `DashboardShell` from prompt 01.
- Show a welcome message with the user's name and role.
- Have a "Loading..." skeleton while user data fetches.

### 6. Unauthorized page

`src/app/unauthorized/page.tsx` — friendly "You don't have access to this page" with a button back to the user's dashboard.

### 7. React Query setup

Create `src/components/shared/Providers.tsx`:

```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

Wrap in `app/layout.tsx`.

---

## Deliverables checklist

- [ ] `middleware.ts` enforces role-based routing
- [ ] Login page (email/password + Google OAuth)
- [ ] Register page (role selection + account form)
- [ ] Forgot/reset password pages
- [ ] Auth callback route
- [ ] `useUser` and `useRequireAuth` hooks
- [ ] `RoleGuard` component
- [ ] Dashboard stub pages for all roles
- [ ] `Providers` wrapper (React Query + ThemeProvider)
- [ ] Manual test: login as talent → redirected to `/talent/dashboard`; try accessing `/admin` → redirected back
