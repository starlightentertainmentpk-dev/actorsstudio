"use client"

import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { PageTransition } from "./PageTransition"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { Bell, User, LogOut } from "lucide-react"
import Link from "next/link"

interface DashboardShellProps {
  role: "talent" | "producer" | "admin"
  children: ReactNode
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar role={role} className="shrink-0" />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border/40 bg-card/40 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 capitalize">
              {role} portal
            </span>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Notification Stub */}
            <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            
            {/* User Stub */}
            <div className="flex items-center gap-2 border-l border-border/40 pl-4">
              <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-inner shadow-brand-600/30">
                {role[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-none text-foreground capitalize">{role} User</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-1">user@{role}.com</p>
              </div>
              
              <Link href="/logout">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive transition-colors ml-1" title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable Layout Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6">
          <div className="container mx-auto max-w-7xl h-full flex flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
