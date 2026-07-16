"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export default function LogoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    const performLogout = async () => {
      const supabase = createClient()
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear React Query cache (removes cached user profile information)
      queryClient.clear()
      
      // Redirect to login
      router.push("/auth/login")
      router.refresh()
    }

    performLogout()
  }, [router, queryClient])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 text-foreground">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  )
}
