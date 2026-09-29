"use client"

import { DashboardShell } from "@/components/shared/DashboardShell"
import { useOrganizations } from "@/hooks/useOrganizations"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Filter, Sparkles } from "lucide-react"

export default function AgencyTalentPage() {
  const { activeOrg } = useOrganizations()
  const orgName = activeOrg?.name || "Agency"

  return (
    <DashboardShell role="agency">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Talent Roster
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Represented talent, exclusivity contracts, and internal agent notes for {orgName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Talent to Roster
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Search roster by name, skills, or dialect...</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>

        {/* Empty state roster */}
        <Card className="border-dashed border-border/80 p-8 text-center bg-card/40">
          <div className="max-w-md mx-auto space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No Talent Represented Yet
            </h3>
            <p className="text-xs text-muted-foreground">
              Start adding actors, models, and creators to {orgName}&apos;s roster or invite existing talent to link their profiles.
            </p>
            <div className="pt-2">
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Invite First Artist
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
