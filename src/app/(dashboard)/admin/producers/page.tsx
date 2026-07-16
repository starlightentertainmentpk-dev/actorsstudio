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
} from "lucide-react"
import type { Database } from "@/types/database"

type ProducerWithUser = Database["public"]["Tables"]["producer_profiles"]["Row"] & {
  users: { email: string } | null
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

  // Modal / action states
  const [selectedProducer, setSelectedProducer] = useState<ProducerWithUser | null>(null)
  
  // Docs viewing modal
  const [docsModalOpen, setDocsModalOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [producerDocs, setProducerDocs] = useState<DocObject[]>([])

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // Action status indicators
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  // Query unverified producers who have uploaded verification documents
  const { data: queue = [], isLoading: dataLoading } = useQuery<ProducerWithUser[]>({
    queryKey: ["admin-producers-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("producer_profiles")
        .select(`
          *,
          users (
            email
          )
        `)
        .eq("verified", false)
        .not("verification_docs_url", "is", null)
        .order("created_at", { ascending: true })

      if (error) throw error
      return (data || []) as unknown as ProducerWithUser[]
    },
    enabled: !!user,
  })

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
  const handleVerify = async (producer: ProducerWithUser) => {
    if (!confirm(`Are you sure you want to verify "${producer.company_name}"?`)) return
    setActionLoadingId(producer.id)
    setActionError("")

    try {
      const result = await verifyProducer(producer.id, producer.user_id, producer.company_name)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-producers-queue"] })
      }
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to verify producer.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reject Producer Action (Confirm)
  const handleRejectClick = (producer: ProducerWithUser) => {
    setSelectedProducer(producer)
    setRejectionReason("")
    setRejectModalOpen(true)
    setActionError("")
  }

  const handleRejectSubmit = async () => {
    if (!selectedProducer) return
    if (!rejectionReason.trim() || rejectionReason.length < 5) {
      setActionError("Please provide a rejection reason (minimum 5 characters).")
      return
    }

    setActionLoadingId(selectedProducer.id)
    setRejectModalOpen(false)

    try {
      const result = await rejectProducer(
        selectedProducer.id,
        selectedProducer.user_id,
        selectedProducer.company_name,
        rejectionReason
      )
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-producers-queue"] })
        setSelectedProducer(null)
      }
    } catch (err) {
      const errorVal = err as Error
      setActionError(errorVal.message || "Failed to reject producer.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const pageLoading = authLoading || dataLoading

  if (pageLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Loading verification queue...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-brand-500" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Producer Verification Queue
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review and verify business credentials for producers and brands.
            </p>
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

        {/* Table/Queue List */}
        <div className="bg-card/20 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Check className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full mb-3" />
              <p className="text-base font-bold text-foreground">Queue is empty!</p>
              <p className="text-sm mt-1 text-muted-foreground/80">
                All producer onboarding applications have been processed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-card/40 text-muted-foreground font-semibold">
                    <th className="p-4">Company Details</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4 text-center">Documents</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {queue.map((producer) => {
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
                            <span className="font-bold text-foreground text-base">
                              {producer.company_name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {email}
                            </span>
                          </div>
                        </td>

                        {/* Company Type */}
                        <td className="p-4">
                          <span className="capitalize text-foreground/80">
                            {producer.company_type?.replace("_", " ")}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocs(producer)}
                            className="text-xs font-semibold border-border/60 hover:bg-brand-500/10 hover:text-brand-500 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> View Docs
                          </Button>
                        </td>

                        {/* Verify/Reject Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectClick(producer)}
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold cursor-pointer h-9 rounded-lg"
                                >
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleVerify(producer)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/10 cursor-pointer h-9 rounded-lg"
                                >
                                  <Check className="h-4 w-4 mr-1" /> Verify
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
            </div>
          )}
        </div>

        {/* Modal: Verification Documents View */}
        {docsModalOpen && selectedProducer && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                    <Building className="h-5 w-5 text-brand-500" /> {selectedProducer.company_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Onboarding Verification documents
                  </p>
                </div>
                <button
                  onClick={() => setDocsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loadingDocs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                  <span className="text-xs">Generating secure preview URLs...</span>
                </div>
              ) : producerDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No documents found for this profile.
                </div>
              ) : (
                <div className="space-y-3">
                  {producerDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-background/50 border border-border/30 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-8 w-8 text-brand-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[180px]">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Expires in 15 mins
                          </p>
                        </div>
                      </div>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-brand-500 text-white hover:bg-brand-600 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-brand-500/10 transition-colors"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-destructive">Failed</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedProducer.representative_note && (
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/30">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Representative Note
                  </p>
                  <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                    {selectedProducer.representative_note}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setDocsModalOpen(false)}
                  className="bg-muted text-foreground hover:bg-muted/80 font-semibold cursor-pointer text-xs h-9 px-4 rounded-lg border border-border/50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Producer Reasoning */}
        {rejectModalOpen && selectedProducer && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-start justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Reject Application
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Provide rejection feedback to {selectedProducer.company_name}
                  </p>
                </div>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Rejection Reason <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the application is rejected (e.g., missing valid business license, passport photo is blurry)..."
                  className="w-full p-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  This note will be dispatched via email notification to the producer.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-xs">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRejectModalOpen(false)
                    setSelectedProducer(null)
                  }}
                  className="h-9 rounded-lg font-semibold cursor-pointer border border-border/50 text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubmit}
                  className="bg-destructive hover:bg-destructive/90 text-white font-semibold shadow-md shadow-destructive/10 h-9 rounded-lg cursor-pointer"
                >
                  Reject Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
