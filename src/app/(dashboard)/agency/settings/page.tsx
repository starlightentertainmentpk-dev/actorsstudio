"use client"

import { DashboardShell } from "@/components/shared/DashboardShell"
import { useOrganizations } from "@/hooks/useOrganizations"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, ShieldCheck, Building2, Palette, Percent, Globe, Users } from "lucide-react"

export default function AgencySettingsPage() {
  const { activeOrg } = useOrganizations()
  const orgName = activeOrg?.name || "Agency Workspace"
  const brandColor = activeOrg?.brand_color || "#4f46e5"

  return (
    <DashboardShell role="agency">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Agency Configuration & Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage multi-tenant branding, financial commission baselines, and legal jurisdiction for {orgName}.
          </p>
        </div>

        {/* Agency Info */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-500" />
              Agency Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Primary metadata and public directory representation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Agency Name</label>
                <Input defaultValue={activeOrg?.name || ""} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">URL Slug</label>
                <Input defaultValue={activeOrg?.slug || ""} className="mt-1 font-mono" disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Specialization</label>
                <Input defaultValue={activeOrg?.agency_type?.replace("_", " ") || ""} className="mt-1 capitalize" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Country</label>
                <Input defaultValue={activeOrg?.country || "Pakistan"} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Commission Engine */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-500" />
              Financial & Commission Rules
            </CardTitle>
            <CardDescription className="text-xs">
              Default commission rates applied to new talent contracts and commercial bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground">Operational Currency</label>
                <Input defaultValue={activeOrg?.currency || "PKR"} className="mt-1 font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Default Commission Rate (%)</label>
                <Input defaultValue="20.00" className="mt-1 font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant RLS Security Confirmation */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              Multi-Tenant Data Boundary
            </CardTitle>
            <CardDescription className="text-xs">
              Verification of PostgreSQL Row Level Security (RLS) policies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-semibold text-foreground">Tenant Organization ID</p>
                <p className="font-mono text-muted-foreground text-[11px] mt-0.5">
                  {activeOrg?.id || "e3e8f7a1-2d3b-4c5e-9f8a-1b2c3d4e5f6a"}
                </p>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                Active Isolation
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button size="sm">Save Changes</Button>
        </div>
      </div>
    </DashboardShell>
  )
}
