"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useClientPortal } from "@/hooks/useClientPortal"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Tv,
  PlusCircle,
  Briefcase,
  FileCheck,
  Building2,
  Bell,
  Menu,
  X,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react"

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { clientInfo } = useClientPortal()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Enforce role-based access:
  // If user is logged in with an incompatible role (e.g. talent, producer, agent), redirect to /unauthorized.
  useEffect(() => {
    if (!userLoading && user) {
      const allowedRoles = ["client", "super_admin"]
      if (!allowedRoles.includes(user.role)) {
        router.replace("/unauthorized")
      }
    }
  }, [user, userLoading, router])

  const navLinks = [
    {
      label: "Dashboard",
      href: "/client/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/client/dashboard" || pathname === "/client",
    },
    {
      label: "Casting Reviews",
      href: "/client/projects",
      icon: Tv,
      active: pathname.startsWith("/client/projects"),
    },
    {
      label: "Submit Brief",
      href: "/client/briefs/new",
      icon: PlusCircle,
      active: pathname === "/client/briefs/new",
    },
    {
      label: "My Briefs",
      href: "/client/briefs",
      icon: Briefcase,
      active: pathname === "/client/briefs",
    },
    {
      label: "Invoices",
      href: "/client/invoices",
      icon: FileCheck,
      active: pathname.startsWith("/client/invoices"),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand-500/20 selection:text-brand-400">
      {/* Client Portal Dedicated Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between gap-4">
            {/* Brand Logo & Representation Notice */}
            <div className="flex items-center gap-4">
              <Link href="/client/dashboard" className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                  AS
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base tracking-tight text-foreground">
                      {clientInfo.company_name}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-[10px] font-semibold py-0"
                    >
                      Client Portal
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                    Powered by <strong className="text-foreground/80 font-semibold">{clientInfo.organization_name}</strong>
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      link.active
                        ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-xs border border-brand-500/20 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${link.active ? "text-brand-500" : ""}`} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right Action Items */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex">
                <Link href="/client/briefs/new">
                  <Button
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-xs shadow-brand-500/20 rounded-xl gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Submit Brief</span>
                  </Button>
                </Link>
              </div>

              <ThemeToggle />

              {/* Notification Bell */}
              <div className="relative hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl text-muted-foreground hover:text-foreground relative"
                  aria-label="Client Notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-card" />
                </Button>
              </div>

              {/* Client User Info Capsule */}
              <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-border/60">
                <Avatar
                  fallback={clientInfo.user_name.substring(0, 2).toUpperCase()}
                  size="sm"
                  className="ring-1 ring-border/50 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-xs"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold leading-tight text-foreground">
                    {clientInfo.user_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
                    {clientInfo.role_title}
                  </p>
                </div>
              </div>

              {/* Mobile Drawer Hamburger Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden rounded-xl"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-card px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              Navigation
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    link.active
                      ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <div className="pt-2 border-t border-border/50">
              <Link
                href="/client/briefs/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white font-medium text-sm shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>Submit New Casting Brief</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Client Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Client Portal Footer */}
      <footer className="border-t border-border/40 bg-card/40 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            <span>Strict Commercial Client Isolation • Zero Candidate Contact Leakage Policy</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} {clientInfo.organization_name}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
