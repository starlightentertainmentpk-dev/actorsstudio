"use client"

import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
  const { data: user, isLoading } = useUser()

  const dashboardMap: Record<string, string> = {
    super_admin: "/admin",
    studio_admin: "/admin",
    studio_staff: "/admin/talent",
    talent: "/talent/dashboard",
    agent_manager: "/agent/dashboard",
    producer_brand: "/producer/dashboard",
    casting_director: "/casting/dashboard",
  }

  const destination = user ? (dashboardMap[user.role] ?? "/talent/dashboard") : "/auth/login"

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 text-foreground p-4">
      <div className="w-full max-w-md bg-card/45 backdrop-blur-md border border-border/40 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto border border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-brand-500 to-brand-700 bg-clip-text text-transparent">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page. Please make sure you are logged in with the correct account role.
          </p>
        </div>

        <div className="border-t border-border/40 pt-6">
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mx-auto" />
          ) : (
            <Link href={destination} className="block w-full">
              <Button
                className="w-full h-9 flex items-center justify-center font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors rounded-lg shadow-md cursor-pointer"
              >
                {user ? "Go to Dashboard" : "Return to Login"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
