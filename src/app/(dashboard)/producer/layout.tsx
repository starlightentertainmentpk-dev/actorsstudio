"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function ProducerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useRequireAuth("producer_brand")
  const [profileLoading, setProfileLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function checkProfile() {
      if (!user) return
      try {
        const { data } = await supabase
          .from("producer_profiles")
          .select("company_type")
          .eq("user_id", user.id)
          .maybeSingle()

        if (!data || !data.company_type) {
          setIsComplete(false)
          // Redirect to onboarding if not already there
          if (!pathname?.includes("/producer/onboarding")) {
            router.replace("/producer/onboarding")
          }
        } else {
          setIsComplete(true)
        }
      } catch (err) {
        console.error("Error checking producer profile:", err)
      } finally {
        setProfileLoading(false)
      }
    }

    if (user && !authLoading) {
      checkProfile()
    } else if (!user && !authLoading && profileLoading) {
      Promise.resolve().then(() => setProfileLoading(false))
    }
  }, [user, authLoading, pathname, router, supabase, profileLoading])

  const isOnboarding = pathname?.includes("/producer/onboarding")

  if (authLoading || (profileLoading && !isOnboarding)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    )
  }

  // If on onboarding page, render full screen without Sidebar/DashboardShell
  if (isOnboarding) {
    return <>{children}</>
  }

  // If profile is incomplete, wait for redirect
  if (!isComplete) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  return <DashboardShell role="producer">{children}</DashboardShell>
}
