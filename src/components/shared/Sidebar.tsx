"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  User,
  Image as ImageIcon,
  Briefcase,
  Calendar,
  Search,
  Tv,
  ShieldCheck,
  Layers,
  Users,
  UserCheck,
  BarChart,
  Settings,
  Sparkles,
  X,
  FileCheck,
  Building2,
  Video,
  Handshake,
  Bookmark,
  FileSignature,
  FolderOpen,
  Receipt,
  Wallet,
} from "lucide-react"
import { useOrganizations } from "@/hooks/useOrganizations"

type SidebarRole = "talent" | "producer" | "admin" | "agency" | "client"

interface SidebarProps {
  role: SidebarRole
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ role, className, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { activeOrg } = useOrganizations()

  const brandName = activeOrg?.name || "Actor's Studio"
  const brandColor = activeOrg?.brand_color || "#4f46e5"

  // Navigation configurations
  const menus = {
    talent: [
      { label: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard },
      { label: "My Profile", href: "/talent/profile", icon: User },
      { label: "Media Library", href: "/talent/media", icon: ImageIcon },
      { label: "Jobs & Castings", href: "/talent/casting", icon: Briefcase },
      { label: "Applications", href: "/talent/applications", icon: FileCheck },
      { label: "Self-Tapes", href: "/talent/self-tapes", icon: Video },
      { label: "Auditions", href: "/talent/auditions", icon: Calendar },
      { label: "My Availability", href: "/talent/availability", icon: Bookmark },
      { label: "Earnings & Payouts", href: "/talent/earnings", icon: Wallet },
      { label: "Settings", href: "/talent/settings", icon: Settings },
    ],
    producer: [
      { label: "Dashboard", href: "/producer/dashboard", icon: LayoutDashboard },
      { label: "Company Profile", href: "/producer/profile", icon: User },
      { label: "Job Listings", href: "/producer/casting", icon: Tv },
      { label: "Screening ATS", href: "/producer/applications", icon: UserCheck },
      { label: "Talent Search", href: "/producer/talent-search", icon: Search },
      { label: "Auditions", href: "/producer/auditions", icon: Calendar },
      { label: "Settings", href: "/producer/settings", icon: Settings },
    ],
    admin: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Producer Queue", href: "/admin/producers", icon: ShieldCheck },
      { label: "Categories", href: "/admin/categories", icon: Layers },
      { label: "Casting Calls", href: "/admin/casting", icon: Tv },
      { label: "Talent Queue", href: "/admin/talent", icon: UserCheck },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    ],
    agency: [
      { label: "Dashboard", href: "/agency/dashboard", icon: LayoutDashboard },
      { label: "Talent Roster", href: "/agency/talent", icon: Users },
      { label: "Client Accounts", href: "/agency/clients", icon: Building2 },
      { label: "Casting Pipeline", href: "/agency/casting", icon: Tv },
      { label: "Commercial Deals", href: "/agency/deals", icon: Handshake },
      { label: "Hold Priority", href: "/agency/holds", icon: Bookmark },
      { label: "Smart Calendar", href: "/agency/calendar", icon: Calendar },
      { label: "Contracts & Sign", href: "/agency/contracts", icon: FileSignature },
      { label: "Document Vault", href: "/agency/documents", icon: FolderOpen },
      { label: "Finance & Invoices", href: "/agency/finance", icon: Receipt },
      { label: "Agency Settings", href: "/agency/settings", icon: Settings },
    ],
    client: [
      { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
      { label: "Casting Reviews", href: "/client/projects", icon: Tv },
      { label: "Submit Brief", href: "/client/briefs/new", icon: Sparkles },
      { label: "My Briefs", href: "/client/briefs", icon: Briefcase },
      { label: "Invoices", href: "/client/invoices", icon: FileCheck },
    ],
  }

  const currentMenu = menus[role] || menus.agency

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer overflow-hidden min-w-0"
          >
            <div
              className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-white shadow-xs font-bold text-xs"
              style={{ backgroundColor: brandColor }}
            >
              {activeOrg?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeOrg.logo_url}
                  alt=""
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            {!isCollapsed && (
              <span className="font-heading font-bold text-sm text-foreground tracking-tight transition-opacity duration-200 truncate">
                {brandName}
              </span>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Mobile close button */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onMobileClose}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-2 mt-2">
          {currentMenu.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/talent/dashboard" &&
                item.href !== "/producer/dashboard" &&
                pathname?.startsWith(item.href + "/"))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all duration-150 group relative",
                  isActive
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-500" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                    isActive
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border/50 text-xs text-muted-foreground truncate">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="font-semibold text-foreground text-[11px] truncate">{brandName}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {activeOrg?.country || "Pakistan"} • {activeOrg?.currency || "PKR"}
              </p>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className="text-[10px] font-bold"
              style={{ color: brandColor }}
            >
              {brandName.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border/50 bg-card text-card-foreground transition-all duration-200 ease-in-out h-full shrink-0",
          isCollapsed ? "w-16" : "w-60",
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer content */}
          <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-card border-r border-border shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
