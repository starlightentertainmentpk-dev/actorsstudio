"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { adminCloseCastingCall, adminToggleFlagCastingCall } from "./actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Loader2,
  AlertCircle,
  Eye,
  Slash,
  Flag,
  Search,
  Building,
  Tv,
} from "lucide-react"

type AdminCastingCall = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "cancelled"
  location: string | null
  requirements_json: unknown
  created_at: string
  producer_profiles: {
    company_name: string
    verified: boolean
  } | null
  categories: {
    name: string
  } | null
}

export default function AdminCastingCallsPage() {
  const { user, isLoading: authLoading } = useRequireAuth([
    "super_admin",
    "studio_admin",
    "studio_staff",
  ])

  const supabase = createClient()
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "open" | "closed" | "flagged">("all")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  // Fetch all casting calls
  const { data: calls = [], isLoading: dataLoading } = useQuery<AdminCastingCall[]>({
    queryKey: ["admin-casting-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casting_calls")
        .select(`
          *,
          producer_profiles (
            company_name,
            verified
          ),
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []) as unknown as AdminCastingCall[]
    },
    enabled: !!user,
  })

  // Action handlers
  const handleClose = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to CLOSE the casting call "${title}"? This overrides the producer's settings.`)) return
    setActionLoadingId(id)
    setActionError("")

    try {
      await adminCloseCastingCall(id)
      queryClient.invalidateQueries({ queryKey: ["admin-casting-calls"] })
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to close casting call.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleFlag = async (id: string, title: string, currentFlag: boolean) => {
    const actionWord = currentFlag ? "UNFLAG" : "FLAG"
    if (!confirm(`Are you sure you want to ${actionWord} the casting call "${title}"?`)) return
    setActionLoadingId(id)
    setActionError("")

    try {
      await adminToggleFlagCastingCall(id, currentFlag)
      queryClient.invalidateQueries({ queryKey: ["admin-casting-calls"] })
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to flag/unflag casting call.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const isLoading = authLoading || dataLoading

  if (isLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Loading all casting calls...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Filter casting calls
  const filteredCalls = calls.filter((call) => {
    const isFlagged = !!(call.requirements_json as Record<string, unknown>)?.admin_flagged

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "flagged" && isFlagged) ||
      (statusFilter !== "flagged" && call.status === statusFilter)

    const matchesSearch =
      call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.producer_profiles?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.location && call.location.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesStatus && matchesSearch
  })

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Tv className="h-8 w-8 text-brand-500" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Casting Calls Moderation
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review, flag, or close casting calls across all registered producers.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Operation Failed</p>
              <p className="text-xs mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          {/* tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(["all", "draft", "open", "closed", "flagged"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                  statusFilter === tab
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {tab === "flagged" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5" />
                    <span>Flagged</span>
                  </span>
                ) : (
                  tab
                )}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="relative flex items-center w-full md:max-w-xs">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, producer..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Grid / Table */}
        <div className="bg-card/25 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-brand-500/5">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
              <Tv className="h-10 w-10 text-muted-foreground/35 mb-2.5" />
              <p className="text-base font-bold text-foreground">No casting calls found</p>
              <p className="text-xs mt-1 text-muted-foreground/80">
                There are no calls that match the search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/45 text-muted-foreground font-semibold">
                    <th className="p-4">Casting Call</th>
                    <th className="p-4">Producer</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Flagged</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCalls.map((call) => {
                    const isProcessing = actionLoadingId === call.id
                    const isFlagged = !!(call.requirements_json as Record<string, unknown>)?.admin_flagged

                    return (
                      <tr key={call.id} className="hover:bg-card/10 transition-colors group">
                        {/* Title */}
                        <td className="p-4">
                          <div className="flex flex-col max-w-[280px]">
                            <span className="font-bold text-foreground text-sm truncate">
                              {call.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              ID: {call.id}
                            </span>
                          </div>
                        </td>

                        {/* Producer Company */}
                        <td className="p-4">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                              {call.producer_profiles?.company_name}
                            </span>
                            {call.producer_profiles?.verified && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                Verified Business
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4 text-xs text-foreground/80">
                          {call.categories?.name || "Uncategorized"}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              call.status === "open"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : call.status === "draft"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : call.status === "closed"
                                ? "bg-muted text-muted-foreground"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {call.status}
                          </span>
                        </td>

                        {/* Flagged Status */}
                        <td className="p-4">
                          {isFlagged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/15 px-2.5 py-0.5 rounded-full border border-destructive/20">
                              <AlertCircle className="h-3.5 w-3.5" /> Flagged
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Normal</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                            ) : (
                              <>
                                <Link href={`/casting/${call.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold border-border/60 hover:bg-brand-500/10 hover:text-brand-500 cursor-pointer h-8 rounded-lg"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                                  </Button>
                                </Link>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFlag(call.id, call.title, isFlagged)}
                                  className={`text-xs font-semibold cursor-pointer h-8 rounded-lg ${
                                    isFlagged
                                      ? "text-emerald-600 hover:bg-emerald-550/10"
                                      : "text-amber-550 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  <Flag className="h-3.5 w-3.5 mr-1" />
                                  {isFlagged ? "Unflag" : "Flag"}
                                </Button>

                                {call.status === "open" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleClose(call.id, call.title)}
                                    className="text-xs font-semibold text-destructive hover:bg-destructive/10 h-8 rounded-lg cursor-pointer"
                                  >
                                    <Slash className="h-3.5 w-3.5 mr-1" /> Close
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
