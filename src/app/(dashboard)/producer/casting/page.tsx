"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { deleteCastingCall, closeCastingCall } from "./actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Loader2,
  Plus,
  Search,
  AlertCircle,
  Eye,
  Edit2,
  Slash,
  Trash2,
  Tv,
  Users,
  MapPin,
  Clock,
} from "lucide-react"

type CastingCallWithCategory = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "cancelled"
  location: string | null
  application_deadline: string | null
  created_at: string
  categories: { name: string } | null
  applications_count: number
}

export default function ProducerCastingCallsPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "open" | "closed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [now] = useState(() => Date.now())

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  // 1. Fetch producer profile to check verification status and get profile ID
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["producer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("id, verified")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // 2. Fetch casting calls with application counts
  const { data: castingCalls = [], isLoading: dataLoading } = useQuery<CastingCallWithCategory[]>({
    queryKey: ["producer-casting-calls", profile?.id],
    queryFn: async () => {
      if (!profile) return []

      // Fetch calls
      const { data: calls, error: callsError } = await supabase
        .from("casting_calls")
        .select(`
          *,
          categories:category_id (
            name
          )
        `)
        .eq("producer_id", profile.id)
        .order("created_at", { ascending: false })

      if (callsError) throw callsError
      if (!calls || calls.length === 0) return []

      const callIds = calls.map((c) => c.id)

      // Fetch applications counts for each call
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("casting_call_id, status")
        .in("casting_call_id", callIds)

      if (appsError) throw appsError

      return calls.map((call) => {
        const count = apps?.filter((a) => a.casting_call_id === call.id && a.status !== "withdrawn").length || 0
        return {
          ...call,
          applications_count: count,
        } as CastingCallWithCategory
      })
    },
    enabled: !!profile,
  })

  const handleCloseCall = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to close the casting call "${title}"? It will stop accepting new applications.`)) return
    setActionLoadingId(id)
    setActionError("")
    try {
      await closeCastingCall(id)
      queryClient.invalidateQueries({ queryKey: ["producer-casting-calls"] })
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to close casting call.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteCall = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action is permanent.`)) return
    setActionLoadingId(id)
    setActionError("")
    try {
      await deleteCastingCall(id)
      queryClient.invalidateQueries({ queryKey: ["producer-casting-calls"] })
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to delete casting call.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const isLoading = authLoading || profileLoading || dataLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading your casting calls...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Profile not found. Please onboard first.</p>
      </div>
    )
  }

  const isVerified = profile.verified

  // Filter casting calls list based on tab and search query
  const filteredCalls = castingCalls.filter((call) => {
    const matchesTab = activeTab === "all" || call.status === activeTab
    const matchesSearch =
      call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (call.location && call.location.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  // Quick stats
  const totalCalls = castingCalls.length
  const openCalls = castingCalls.filter((c) => c.status === "open").length
  const draftCalls = castingCalls.filter((c) => c.status === "draft").length
  const closedCalls = castingCalls.filter((c) => c.status === "closed").length

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tv className="h-8 w-8 text-brand-500" /> Casting Call Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, manage, and moderate your casting and audition calls.
          </p>
        </div>

        <div>
          {isVerified ? (
            <Link href="/producer/casting/create">
              <Button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-2 shadow-md shadow-brand-500/10 cursor-pointer">
                <Plus className="h-4 w-4" /> New Casting Call
              </Button>
            </Link>
          ) : (
            <div className="relative group">
              <Button
                disabled
                className="bg-brand-500/50 text-white/70 font-semibold flex items-center gap-2 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" /> New Casting Call
              </Button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2.5 rounded-lg border border-border/80 shadow-md max-w-[200px] z-50">
                Verify your company to publish casting calls.
              </div>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2 animate-in fade-in-50">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Action Blocked</p>
            <p className="text-xs mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Calls", value: totalCalls, color: "text-foreground bg-muted/40" },
          { label: "Open / Live", value: openCalls, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Drafts", value: draftCalls, color: "text-amber-500 bg-amber-500/10" },
          { label: "Closed", value: closedCalls, color: "text-muted-foreground bg-muted/60" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border border-border/40 backdrop-blur-sm ${stat.color} flex flex-col justify-center`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
              {stat.label}
            </span>
            <span className="text-2xl font-bold mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["all", "draft", "open", "closed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                activeTab === tab
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab}
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
            placeholder="Search by title or location..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Casting Calls List */}
      <div className="bg-card/25 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-brand-500/5">
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
            <Tv className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-base font-bold text-foreground">No casting calls found</p>
            <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">
              {searchQuery
                ? "Try adjusting your search criteria or tabs."
                : "Get started by creating a new casting call to publish details."}
            </p>
          </div>
        ) : (
          /* Table View for Desktop / List Cards for Mobile */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm hidden md:table">
              <thead>
                <tr className="border-b border-border/40 bg-card/45 text-muted-foreground font-semibold">
                  <th className="p-4">Casting Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4 text-center">Applications</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredCalls.map((call) => {
                  const isProcessing = actionLoadingId === call.id
                  const deadlineDate = call.application_deadline
                    ? new Date(call.application_deadline)
                    : null
                  const daysLeft = deadlineDate
                    ? Math.max(0, Math.ceil((deadlineDate.getTime() - now) / (1000 * 3600 * 24)))
                    : null

                  return (
                    <tr key={call.id} className="hover:bg-card/10 transition-colors group">
                      {/* Title & Location */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-base group-hover:text-brand-500 transition-colors">
                            {call.title}
                          </span>
                          {call.location && (
                            <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {call.location}
                            </span>
                          )}
                        </div>
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

                      {/* Category */}
                      <td className="p-4 text-foreground/80">
                        {call.categories?.name || "Uncategorized"}
                      </td>

                      {/* Deadline */}
                      <td className="p-4 text-muted-foreground text-xs">
                        {deadlineDate ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {daysLeft === 0 ? (
                              <span className="text-destructive font-semibold">Expired</span>
                            ) : (
                              <span>{daysLeft} days left</span>
                            )}
                          </div>
                        ) : (
                          "No deadline"
                        )}
                      </td>

                      {/* Applications count & Screen CTA */}
                      <td className="p-4 text-center">
                        <Link href={`/producer/applications?callId=${call.id}`}>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 cursor-pointer shadow-xs gap-1.5"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Screen ({call.applications_count})</span>
                          </Button>
                        </Link>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                          ) : (
                            <>
                              <Link href={`/casting/${call.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="View Publicly"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>

                              {call.status !== "closed" && call.status !== "cancelled" && (
                                <Link href={`/producer/casting/${call.id}/edit`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-brand-500 cursor-pointer"
                                    title="Edit Call"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}

                              {call.status === "open" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCloseCall(call.id, call.title)}
                                  className="h-8 w-8 text-muted-foreground hover:text-amber-500 cursor-pointer"
                                  title="Close Call"
                                >
                                  <Slash className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCall(call.id, call.title)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Delete Call"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile View Card Grid */}
            <div className="md:hidden divide-y divide-border/30 p-4 space-y-4">
              {filteredCalls.map((call) => {
                const isProcessing = actionLoadingId === call.id
                const deadlineDate = call.application_deadline
                  ? new Date(call.application_deadline)
                  : null

                return (
                  <div key={call.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{call.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {call.location || "TBD"}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          call.status === "open"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : call.status === "draft"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Category: {call.categories?.name || "Uncategorized"}</span>
                      {deadlineDate && (
                        <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Link href={`/producer/applications?callId=${call.id}`}>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-500 bg-brand-500/5 px-2.5 py-1 rounded-full">
                          <Users className="h-3.5 w-3.5" /> {call.applications_count} applicants
                        </span>
                      </Link>

                      <div className="flex items-center gap-1">
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                        ) : (
                          <>
                            <Link href={`/casting/${call.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {call.status !== "closed" && (
                              <Link href={`/producer/casting/${call.id}/edit`}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCall(call.id, call.title)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
