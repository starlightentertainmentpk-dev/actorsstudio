"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { usePathname } from "next/navigation"

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth("talent")
  const pathname = usePathname()

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    )
  }

  // Onboarding wizard is full screen and doesn't use the dashboard shell
  const isOnboarding = pathname?.includes("/onboarding")
  if (isOnboarding) {
    return <>{children}</>
  }

  return <DashboardShell role="talent">{children}</DashboardShell>
}
