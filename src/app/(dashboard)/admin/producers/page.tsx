"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import {
  verifyProducer,
  rejectProducer,
  getSignedUrlsForDocs,
} from "./actions"
import { Button } from "@/components/ui/button"
import { ProducerFullProfileModal } from "@/components/features/admin/ProducerFullProfileModal"
import {
  Loader2,
  Check,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building,
  Eye,
  Search,
  Users
} from "lucide-react"
import type { Database } from "@/types/database"

type ProducerWithUser = Database["public"]["Tables"]["producer_profiles"]["Row"] & {
  users?: { email: string; phone?: string | null; role?: string } | null
}

interface DocObject {
  name: string
  url: string | null
  error: string | null
}

export default function AdminProducersPage() {
  const { user, isLoading: authLoading } = useRequireAuth([
    "super_admin",
    "studio_admin",
    "studio_staff",
  ])
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Selection & Modal States
  const [selectedProducer, setSelectedProducer] = useState<ProducerWithUser | null>(null)
  const [isFullProfileOpen, setIsFullProfileOpen] = useState(false)
  const [docsModalOpen, setDocsModalOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [producerDocs, setProducerDocs] = useState<DocObject[]>([])

  // Filter States
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // Action status indicators
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  // Query all producers
  const { data: allProducers = [], isLoading: dataLoading } = useQuery<ProducerWithUser[]>({
    queryKey: ["admin-producers-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_profiles")
        .select(`
          *,
          users (
            email,
            phone,
            role
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []) as unknown as ProducerWithUser[]
    },
    enabled: !!user,
  })

  // Inspect Full Profile
  const handleInspect = (producer: ProducerWithUser) => {
    setSelectedProducer(producer)
    setIsFullProfileOpen(true)
  }

  // Load and View Documents Action
  const handleViewDocs = async (producer: ProducerWithUser) => {
    setSelectedProducer(producer)
    setDocsModalOpen(true)
    setLoadingDocs(true)
    setProducerDocs([])
    setActionError("")

    try {
      const docsList = await getSignedUrlsForDocs(producer.user_id)
      setProducerDocs(docsList)
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to load verification documents.")
    } finally {
      setLoadingDocs(false)
    }
  }

  // Verify Producer Action
  const handleVerify = async (producerId: string, userId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to verify "${companyName}"?`)) return
    setActionLoadingId(producerId)
    setActionError("")

    try {
      const result = await verifyProducer(producerId, userId, companyName)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-producers-all"] })
        setIsFullProfileOpen(false)
      }
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to verify producer.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reject Producer Action
  const handleReject = async (producerId: string, userId: string, companyName: string, reason: string) => {
    setActionLoadingId(producerId)
    setActionError("")

    try {
      const result = await rejectProducer(producerId, userId, companyName, reason)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-producers-all"] })
        setSelectedProducer(null)
        setIsFullProfileOpen(false)
      }
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to reject producer.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered queue based on active tab and search query
  const filteredProducers = allProducers.filter((p) => {
    if (activeTab === "pending" && p.verified) return false
    if (activeTab === "verified" && !p.verified) return false

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchName = p.company_name?.toLowerCase().includes(query)
      const matchType = p.company_type?.toLowerCase().includes(query)
      const matchEmail = p.users?.email?.toLowerCase().includes(query)
      if (!matchName && !matchType && !matchEmail) return false
    }

    return true
  })

  const pendingCount = allProducers.filter((p) => !p.verified).length
  const verifiedCount = allProducers.filter((p) => p.verified).length

  const pageLoading = authLoading || dataLoading

  if (pageLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Loading producers directory...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-brand-500" />
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                Producers & Directors Management
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Inspect complete profiles, review company credentials, and verify production houses.
              </p>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 flex items-start gap-2 animate-in fade-in-50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Action Failed</p>
              <p className="text-xs mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/40 border border-border/60 p-3 rounded-2xl backdrop-blur-md">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({allProducers.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "pending"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "verified"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              Verified / Approved ({verifiedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, type, email..."
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-input bg-background/50 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table/Queue List */}
        <div className="bg-card/20 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {filteredProducers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Check className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full mb-3" />
              <p className="text-base font-bold text-foreground">No producers found</p>
              <p className="text-sm mt-1 text-muted-foreground/80">
                {searchQuery ? "Try a different search term." : "There are no producers matching this filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-card/40 text-muted-foreground font-semibold text-xs">
                    <th className="p-4">Company & Identity</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4 text-center">Docs</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredProducers.map((producer) => {
                    const email = producer.users?.email || "No email linked"
                    const formattedDate = new Date(producer.created_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )
                    const isProcessing = actionLoadingId === producer.id

                    return (
                      <tr
                        key={producer.id}
                        className="hover:bg-card/10 transition-colors group"
                      >
                        {/* Company Details */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm">
                              {producer.company_name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {email} {producer.users?.phone ? `• ${producer.users.phone}` : ""}
                            </span>
                          </div>
                        </td>

                        {/* Company Type */}
                        <td className="p-4">
                          <span className="capitalize text-xs text-foreground/80 font-medium">
                            {producer.company_type?.replace(/_/g, " ") || "Production House"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            producer.verified
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}>
                            <ShieldCheck className="h-3 w-3" />
                            {producer.verified ? "Verified" : "Pending"}
                          </span>
                        </td>

                        {/* Submission Date */}
                        <td className="p-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5" />
                            {formattedDate}
                          </div>
                        </td>

                        {/* Documents View Button */}
                        <td className="p-4 text-center">
                          {producer.verification_docs_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocs(producer)}
                              className="text-xs font-semibold border-border/60 hover:bg-brand-500/10 hover:text-brand-500 cursor-pointer h-8 rounded-lg"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1" /> View Docs
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No docs</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect Full Profile */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspect(producer)}
                              className="text-xs font-semibold border-brand-500/30 text-brand-500 hover:bg-brand-500/10 cursor-pointer h-8 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Full Profile
                            </Button>

                            {/* Verify button if pending */}
                            {!producer.verified && (
                              <Button
                                size="sm"
                                onClick={() => handleVerify(producer.id, producer.user_id, producer.company_name)}
                                disabled={isProcessing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm h-8 rounded-lg text-xs"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3.5 w-3.5 mr-1" /> Verify
                                  </>
                                )}
                              </Button>
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

        {/* Modal: Full Producer Dossier */}
        <ProducerFullProfileModal
          isOpen={isFullProfileOpen && !!selectedProducer}
          producer={selectedProducer}
          onClose={() => setIsFullProfileOpen(false)}
          onVerify={handleVerify}
          onReject={handleReject}
          loadDocuments={getSignedUrlsForDocs}
          isActing={!!actionLoadingId}
        />

        {/* Modal: Verification Documents Quick View */}
        {docsModalOpen && selectedProducer && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-500" />
                  <h3 className="font-heading font-semibold text-lg text-foreground">
                    Verification Documents — {selectedProducer.company_name}
                  </h3>
                </div>
                <button
                  onClick={() => setDocsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  Fetching secure document URLs...
                </div>
              ) : producerDocs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  No files found in this producer&apos;s verification folder.
                </div>
              ) : (
                <div className="space-y-3">
                  {producerDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-background/50 border border-border rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          {doc.name}
                        </span>
                      </div>

                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors shrink-0 shadow-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View / Download
                        </a>
                      ) : (
                        <span className="text-xs text-destructive">Failed to sign URL</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setDocsModalOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
