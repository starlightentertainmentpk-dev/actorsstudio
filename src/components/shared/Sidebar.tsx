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
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Layers,
  Users,
  BarChart,
  Settings,
} from "lucide-react"

type SidebarRole = "talent" | "producer" | "admin"

interface SidebarProps {
  role: SidebarRole
  className?: string
}

export function Sidebar({ role, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Navigation configurations
  const menus = {
    talent: [
      { label: "Dashboard", href: "/talent/dashboard", icon: LayoutDashboard },
      { label: "My Profile", href: "/talent/profile", icon: User },
      { label: "Media Library", href: "/talent/media", icon: ImageIcon },
      { label: "Casting Calls", href: "/talent/casting", icon: Briefcase },
      { label: "Auditions", href: "/talent/auditions", icon: Calendar },
      { label: "Settings", href: "/talent/settings", icon: Settings },
    ],
    producer: [
      { label: "Dashboard", href: "/producer/dashboard", icon: LayoutDashboard },
      { label: "Company Profile", href: "/producer/profile", icon: User },
      { label: "Casting Calls", href: "/producer/casting", icon: Tv },
      { label: "Talent Search", href: "/producer/talent-search", icon: Search },
      { label: "Applications", href: "/producer/applications", icon: Users },
      { label: "Auditions", href: "/producer/auditions", icon: Calendar },
      { label: "Settings", href: "/producer/settings", icon: Settings },
    ],
    admin: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Producer Queue", href: "/admin/producers", icon: ShieldCheck },
      { label: "Categories", href: "/admin/categories", icon: Layers },
      { label: "Casting Calls", href: "/admin/casting", icon: Tv },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart },
    ],
  }

  const currentMenu = menus[role]

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border/40 bg-card text-card-foreground transition-all duration-300 ease-in-out h-full",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
        {!isCollapsed && (
          <span className="font-heading font-semibold text-lg text-brand-500 tracking-tight transition-all duration-200">
            Studio Space
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted shadow-sm flex items-center justify-center z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 p-2">
        {currentMenu.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-950/20 hover:text-brand-600 dark:hover:text-brand-400"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground group-hover:text-brand-500")} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border/40 text-xs text-muted-foreground truncate">
        {!isCollapsed ? (
          <div>
            <p className="font-semibold text-foreground">Actors Studio</p>
            <p>v0.1.0 • Pakistan</p>
          </div>
        ) : (
          <span className="text-center font-bold">AS</span>
        )}
      </div>
    </aside>
  )
}
