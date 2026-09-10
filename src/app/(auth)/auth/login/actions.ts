"use server"

import { createClient } from "@/lib/supabase/server"

export interface LoginResult {
  success: boolean
  error?: string
  destination?: string
}

export async function loginWithEmail(formData: {
  email: string
  password: string
}): Promise<LoginResult> {
  try {
    // Strip invisible characters, zero-width spaces, and trim
    const email = formData.email
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
      .trim()
    const password = formData.password.replace(/[\u200B-\u200D\uFEFF]/g, "")

    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Sign in failed. No user found." }
    }

    // Fetch user role from public.users table
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (roleError) {
      console.error("Role lookup error in login action:", roleError)
    }

    const role = userData?.role ?? "talent"

    const dashboardMap: Record<string, string> = {
      super_admin: "/admin",
      studio_admin: "/admin",
      studio_staff: "/admin/talent",
      talent: "/talent/dashboard",
      agent_manager: "/agent/dashboard",
      producer_brand: "/producer/dashboard",
      casting_director: "/casting/dashboard",
    }

    return {
      success: true,
      destination: dashboardMap[role] ?? "/talent/dashboard",
    }
  } catch (err: any) {
    console.error("Server action login error:", err)
    return {
      success: false,
      error: err.message || "An unexpected error occurred during login.",
    }
  }
}
