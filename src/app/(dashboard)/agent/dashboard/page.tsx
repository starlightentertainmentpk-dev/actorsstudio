"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"

export default function AgentDashboardPage() {
  const { user, isLoading } = useRequireAuth("agent_manager")

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell role="talent">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Agent Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user.email.split("@")[0]} • Role: {user.role}
          </p>
        </div>
        <div className="border border-border/40 bg-card/20 rounded-xl p-6">
          <p className="text-sm text-foreground">
            This is the Agent Manager dashboard workspace. Here you can manage the talent profiles in your agency, review submitted applications, and coordinate booking requests.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
