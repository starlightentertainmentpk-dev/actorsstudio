"use client"

import { ReactNode, useState } from "react"
import { Sidebar } from "./Sidebar"
import { PageTransition } from "./PageTransition"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useUser } from "@/hooks/useUser"

interface DashboardShellProps {
  role: "talent" | "producer" | "admin"
  children: ReactNode
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const { data: user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Generate readable section title from path
  const pathSegments = pathname?.split("/").filter(Boolean) || []
  const sectionName =
    pathSegments.length > 1
      ? pathSegments[1].replace("-", " ")
      : "Dashboard"

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar Navigation (Desktop + Mobile Drawer) */}
      <Sidebar
        role={role}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-card/60 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-foreground hover:bg-muted"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb / Title Context */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground/80 capitalize">
                {role}
              </span>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-xs font-medium text-foreground capitalize truncate max-w-[160px] sm:max-w-none">
                {sectionName}
              </span>
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground relative rounded-lg"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
              </Button>
            </div>

            {/* User Account Capsule */}
            <div className="flex items-center gap-2.5 border-l border-border/50 pl-3">
              <Avatar
                fallback={user?.email?.[0] || role[0]}
                size="sm"
                className="ring-1 ring-border/50"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold leading-none text-foreground capitalize">
                  {role === "talent"
                    ? "Artist Account"
                    : role === "producer"
                    ? "Producer Account"
                    : "Studio Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1 truncate max-w-[140px]">
                  {user?.email || `user@${role}.com`}
                </p>
              </div>

              <Link
                href="/logout"
                title="Sign Out"
                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable Layout Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl min-h-full flex flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
