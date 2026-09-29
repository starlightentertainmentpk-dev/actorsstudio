"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Building2, Check, ChevronsUpDown, Plus, Sparkles, Loader2 } from "lucide-react"
import { useOrganizations } from "@/hooks/useOrganizations"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function OrganizationSwitcher() {
  const { organizations, activeOrg, switchOrganization, isSwitching, isLoading } = useOrganizations()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentOrgName = activeOrg?.name || "Actors Studio HQ"
  const brandColor = activeOrg?.brand_color || "#4f46e5"

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isSwitching}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted/60 transition-all text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500 max-w-[200px] sm:max-w-[240px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div
          className="h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
          style={{ backgroundColor: brandColor }}
        >
          {activeOrg?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeOrg.logo_url}
              alt=""
              className="h-full w-full object-cover rounded-md"
            />
          ) : (
            currentOrgName.substring(0, 2).toUpperCase()
          )}
        </div>

        <span className="truncate font-semibold">{currentOrgName}</span>

        {isSwitching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto shrink-0" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Agency Workspaces
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {organizations.length > 0 ? (
              organizations.map((org) => {
                const isActive = activeOrg?.id === org.id
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      if (!isActive) switchOrganization(org.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                      isActive
                        ? "bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: org.brand_color || "#4f46e5" }}
                    >
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{org.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate capitalize">
                        {org.agency_type.replace("_", " ")}
                      </p>
                    </div>

                    {isActive && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="p-2.5 text-center text-xs text-muted-foreground">
                <Building2 className="h-4 w-4 mx-auto mb-1 opacity-50" />
                No additional agencies
              </div>
            )}
          </div>

          <div className="mt-1 pt-1 border-t border-border/60">
            <Link
              href="/agency/onboarding"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Agency</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
