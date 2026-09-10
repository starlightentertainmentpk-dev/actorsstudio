"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  Calendar,
  ExternalLink,
  Download,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  Layers,
  Check,
  Loader2,
  Users,
  Film
} from "lucide-react"
import type { Database } from "@/types/database"

type ProducerProfile = Database["public"]["Tables"]["producer_profiles"]["Row"] & {
  users?: { email: string; phone?: string | null; role?: string } | null
}

interface DocObject {
  name: string
  url: string | null
  error: string | null
}

interface CastingCallItem {
  id: string
  title: string
  status: string
  compensation: string | null
  location: string | null
  application_deadline: string | null
  created_at: string
}

export interface ProducerFullProfileModalProps {
  producer: any
  isOpen: boolean
  onClose: () => void
  onVerify?: (producerId: string, userId: string, companyName: string) => Promise<void>
  onReject?: (producerId: string, userId: string, companyName: string, reason: string) => Promise<void>
  loadDocuments?: (userId: string) => Promise<DocObject[]>
  isActing?: boolean
}

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export function ProducerFullProfileModal({
  producer,
  isOpen,
  onClose,
  onVerify,
  onReject,
  loadDocuments,
  isActing = false,
}: ProducerFullProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "docs" | "casting" | "links">("overview")
  const [docs, setDocs] = useState<DocObject[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [castingCalls, setCastingCalls] = useState<CastingCallItem[]>([])
  const [loadingCasting, setLoadingCasting] = useState(false)

  // Rejection reason state
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const supabase = createClient()

  // Load documents and casting calls when opened
  useEffect(() => {
    if (!isOpen || !producer) return

    const loadData = async () => {
      // 1. Load documents if callback provided
      if (loadDocuments) {
        setLoadingDocs(true)
        try {
          const files = await loadDocuments(producer.user_id)
          setDocs(files)
        } catch (err) {
          console.error("Error loading producer docs:", err)
        } finally {
          setLoadingDocs(false)
        }
      }

      // 2. Load casting calls posted by this producer
      setLoadingCasting(true)
      try {
        const { data } = await supabase
          .from("casting_calls")
          .select("id, title, status, compensation, location, application_deadline, created_at")
          .eq("producer_id", producer.id)
          .order("created_at", { ascending: false })
        setCastingCalls(data || [])
      } catch (err) {
        console.error("Error loading casting calls:", err)
      } finally {
        setLoadingCasting(false)
      }
    }

    loadData()
  }, [isOpen, producer])

  if (!isOpen || !producer) return null

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground font-heading truncate">
                  {producer.company_name}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  producer.verified
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  <ShieldCheck className="h-3 w-3" />
                  {producer.verified ? "Verified Producer" : "Pending Verification"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {producer.company_type?.replace(/_/g, " ") || "Production House"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {producer.users?.email} {producer.users?.phone ? `• ${producer.users.phone}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/producer/${producer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-brand-500" /> Public Page
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60 bg-muted/20 px-6 overflow-x-auto gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Credentials
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "docs"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Verification Documents ({docs.length})
          </button>
          <button
            onClick={() => setActiveTab("casting")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "casting"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Casting Calls Posted ({castingCalls.length})
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "links"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Web & Social Profiles
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Entity Type</span>
                  <p className="text-xs font-bold text-foreground mt-1 capitalize">
                    {producer.company_type?.replace(/_/g, " ") || "Production House"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Verification</span>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {producer.verified ? "Approved / Verified" : "Pending Approval"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Account Email</span>
                  <p className="text-xs font-bold text-foreground mt-1 truncate">
                    {producer.users?.email || "—"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Contact Phone</span>
                  <p className="text-xs font-bold text-foreground mt-1">
                    {producer.users?.phone || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Bio / About */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Background / Bio
                </h3>
                {producer.bio ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {producer.bio}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No company bio provided.</p>
                )}
              </div>

              {/* Representative Note */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Authorized Representative Note / Credentials
                </h3>
                {producer.representative_note ? (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {producer.representative_note}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No representative credentials note provided.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION DOCUMENTS */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Uploaded Verification Documents</h3>
                  <p className="text-xs text-muted-foreground">Official business registrations, tax documents, or production credentials.</p>
                </div>
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  Generating secure signed links for documents...
                </div>
              ) : docs.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No verification documents uploaded</p>
                  <p className="text-xs text-muted-foreground">Producer has not uploaded business certificates or credentials.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map((file, idx) => (
                    <div key={file.name || idx} className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                          <span className="text-[10px] text-muted-foreground">Verification Asset</span>
                        </div>
                      </div>

                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm shrink-0"
                        >
                          <Download className="h-3.5 w-3.5" /> View / Download
                        </a>
                      ) : (
                        <span className="text-xs text-destructive">Failed to generate URL</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CASTING CALLS POSTED */}
          {activeTab === "casting" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Casting Calls Posted</h3>
                  <p className="text-xs text-muted-foreground">History of productions and audition notices posted by this organization.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-lg">
                  {castingCalls.length} Project{castingCalls.length === 1 ? "" : "s"}
                </span>
              </div>

              {loadingCasting ? (
                <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  Loading casting calls...
                </div>
              ) : castingCalls.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                  <Film className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No casting calls posted yet</p>
                  <p className="text-xs text-muted-foreground">This producer has not published any casting notices.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {castingCalls.map((call) => (
                    <div key={call.id} className="p-4 rounded-2xl bg-card/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-foreground">{call.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            call.status === "open"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {call.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Compensation: {call.compensation || "Not specified"} • Location: {call.location || "Pakistan"}
                        </p>
                      </div>

                      <a
                        href={`/casting/${call.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-500 font-semibold hover:underline shrink-0"
                      >
                        View Notice <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WEB & SOCIAL LINKS */}
          {activeTab === "links" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Websites & Social Media</h3>
                <p className="text-xs text-muted-foreground">Official web presence and verified social links.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Website */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Official Website</span>
                      <p className="text-xs font-medium text-foreground truncate">
                        {producer.website || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {producer.website && (
                    <a
                      href={producer.website.startsWith("http") ? producer.website : `https://${producer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted shrink-0"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Instagram */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                      <InstagramIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Instagram</span>
                      <p className="text-xs font-medium text-foreground truncate">
                        {producer.instagram_url || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {producer.instagram_url && (
                    <a
                      href={producer.instagram_url.startsWith("http") ? producer.instagram_url : `https://${producer.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted shrink-0"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <LinkedinIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">LinkedIn</span>
                      <p className="text-xs font-medium text-foreground truncate">
                        {producer.linkedin_url || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {producer.linkedin_url && (
                    <a
                      href={producer.linkedin_url.startsWith("http") ? producer.linkedin_url : `https://${producer.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted shrink-0"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejection Note Feed */}
          {isRejecting && onReject && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3 animate-in slide-in-from-bottom-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Rejection Reason for Producer <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why verification was rejected (e.g. illegible NTN certificate, invalid trade license)..."
                className="w-full p-3 rounded-xl border border-input bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-end gap-2 text-xs">
                <Button variant="ghost" onClick={() => setIsRejecting(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await onReject(producer.id, producer.user_id, producer.company_name, rejectReason)
                    setIsRejecting(false)
                  }}
                  disabled={!rejectReason.trim() || isActing}
                  className="h-8 text-xs bg-destructive text-white hover:bg-destructive/90"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Producer ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{producer.id}</code>
          </div>

          <div className="flex items-center gap-2">
            {onVerify && !producer.verified && (
              <Button
                onClick={() => onVerify(producer.id, producer.user_id, producer.company_name)}
                disabled={isActing}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
              >
                <Check className="h-4 w-4 mr-1" /> Approve & Verify Producer
              </Button>
            )}

            {onReject && !isRejecting && (
              <Button
                variant="outline"
                onClick={() => setIsRejecting(true)}
                disabled={isActing}
                className="h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-1" /> Reject Producer
              </Button>
            )}

            <Button variant="ghost" onClick={onClose} className="h-9 text-xs font-semibold">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
