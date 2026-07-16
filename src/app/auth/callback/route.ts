import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Determine the correct dashboard for this user based on their role
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        const dashboardMap: Record<string, string> = {
          super_admin: "/admin",
          studio_admin: "/admin",
          studio_staff: "/admin/talent",
          talent: "/talent/dashboard",
          agent_manager: "/agent/dashboard",
          producer_brand: "/producer/dashboard",
          casting_director: "/casting/dashboard",
        }
        
        const destination = dashboardMap[userData?.role ?? "talent"] ?? "/talent/dashboard"
        return NextResponse.redirect(new URL(destination, origin))
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin))
}
