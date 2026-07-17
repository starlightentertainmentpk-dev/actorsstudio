import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/admin", "/talent", "/producer", "/casting"],
  studio_admin: ["/admin", "/talent", "/producer", "/casting"],
  studio_staff: ["/admin/talent", "/admin/casting", "/admin/auditions"],
  talent: ["/talent"],
  agent_manager: ["/agent", "/talent"],
  producer_brand: ["/producer"],
  casting_director: ["/casting", "/producer"],
}

export default async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Helper redirects for legacy paths
  if (path === "/register") {
    return NextResponse.redirect(new URL("/auth/register", request.url))
  }
  if (path === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Public paths: root, auth page, about page, API endpoints, logout, unauthorized
  const BASE_PUBLIC_PATHS = ["/", "/auth", "/about", "/api", "/logout", "/unauthorized"]
  
  // Distinguish public profiles/directories under /talent and /casting
  // from their private dashboards under /talent/dashboard, /casting/dashboard, etc.
  const isPublic =
    BASE_PUBLIC_PATHS.some(p => path === p || path.startsWith(p + "/")) ||
    (path.startsWith("/talent") && !path.startsWith("/talent/dashboard") && !path.startsWith("/talent/profile") && !path.startsWith("/talent/media") && !path.startsWith("/talent/applications") && !path.startsWith("/talent/calendar")) ||
    (path.startsWith("/casting") && !path.startsWith("/casting/dashboard"))

  if (isPublic) {
    return supabaseResponse
  }

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login?next=" + encodeURIComponent(path), request.url)
    )
  }

  // Fetch role from public.users
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = userData?.role ?? "talent"

  // Check if the requested path is allowed for this role
  const allowedPrefixes = ROLE_ROUTES[role] ?? []
  const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix))

  if (!isAllowed) {
    // Redirect to role's home dashboard
    const dashboardMap: Record<string, string> = {
      super_admin: "/admin",
      studio_admin: "/admin",
      studio_staff: "/admin/talent",
      talent: "/talent/dashboard",
      agent_manager: "/agent/dashboard",
      producer_brand: "/producer/dashboard",
      casting_director: "/casting/dashboard",
    }
    return NextResponse.redirect(
      new URL(dashboardMap[role] ?? "/auth/login", request.url)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
