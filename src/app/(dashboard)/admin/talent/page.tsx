"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { updateTalentVerificationStatus } from "./actions"
import { Button } from "@/components/ui/button"
import { TalentFullProfileModal } from "@/components/features/admin/TalentFullProfileModal"
import {
  Loader2,
  Check,
  X,
  Search,
  FileText,
  AlertCircle,
  ExternalLink,
  Calendar,
  User,
  Image as ImageIcon,
  Eye,
  Video,
  Music,
  MapPin,
  Sparkles,
  Award,
  Clock,
  Languages,
  ChevronDown,
  Scale
} from "lucide-react"
import type { Database } from "@/types/database"

type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"] & {
  users: { email: string } | null
}

export default function AdminTalentPage() {
  const { user, isLoading: authLoading } = useRequireAuth([
    "super_admin",
    "studio_admin",
    "studio_staff",
  ])
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Selection & UI States
  const [selectedTalent, setSelectedTalent] = useState<TalentProfile | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "under_review" | "approved" | "rejected">("all")

  // Rejection reason state
  const [rejectReason, setRejectReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  // Action status indicators
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  // Query talent profiles
  const { data: talentQueue = [], isLoading: dataLoading } = useQuery<TalentProfile[]>({
    queryKey: ["admin-talent-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select(`
          *,
          users (
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []) as unknown as TalentProfile[]
    },
    enabled: !!user,
  })

  // Query categories to display category name
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // Query media assets for selected talent in Inspector
  const { data: selectedMedia = [], isLoading: mediaLoading } = useQuery({
    queryKey: ["admin-talent-media", selectedTalent?.user_id],
    queryFn: async () => {
      if (!selectedTalent?.user_id) return []
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_id", selectedTalent.user_id)
        .order("sort_order", { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!selectedTalent?.user_id && isInspectorOpen,
  })

  const getCategoryName = (catId: string | null) => {
    if (!catId) return ""
    return categories.find((c: any) => c.id === catId)?.name || ""
  }

  // Handle Talent Status updates
  const handleUpdateStatus = async (
    profile: TalentProfile,
    newStatus: "approved" | "rejected" | "under_review" | "interview_scheduled",
    reason?: string
  ) => {
    setActionLoadingId(profile.id)
    setActionError("")

    try {
      const result = await updateTalentVerificationStatus(profile.id, newStatus, reason)
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-talent-queue"] })
        // If updating the selected talent, update locally
        setSelectedTalent((prev) => (prev?.id === profile.id ? { ...prev, verification_status: newStatus } : prev))
        setIsRejecting(false)
        setRejectReason("")
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to update status")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Formatting helpers
  const calculateAge = (dobString: string | null) => {
    if (!dobString) return "—"
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} yrs`
  }

  const formatHeight = (cm: number | null) => {
    if (!cm) return "—"
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}" (${cm} cm)`
  }

  const formatWeight = (kg: number | null) => {
    if (!kg) return "—"
    return `${kg} kg`
  }

  // Filtered Queue list
  const filteredQueue = talentQueue.filter((talent) => {
    const matchesSearch =
      talent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.users?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      activeTab === "all" ||
      (activeTab === "pending" && talent.verification_status === "pending") ||
      (activeTab === "under_review" && talent.verification_status === "under_review") ||
      (activeTab === "approved" && talent.verification_status === "approved") ||
      (activeTab === "rejected" && talent.verification_status === "rejected")

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; style: string }> = {
      pending: {
        label: "Pending",
        style: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      },
      under_review: {
        label: "Under Review",
        style: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      },
      approved: {
        label: "Approved",
        style: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      },
      rejected: {
        label: "Rejected",
        style: "bg-red-500/10 text-red-500 border border-red-500/20",
      },
      interview_scheduled: {
        label: "Interview Scheduled",
        style: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
      },
      audition_scheduled: {
        label: "Audition Scheduled",
        style: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20",
      },
      blacklisted: {
        label: "Blacklisted",
        style: "bg-neutral-800 text-neutral-400 border border-neutral-700",
      },
      inactive: {
        label: "Inactive",
        style: "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20",
      },
    }

    const config = statusConfig[status] || {
      label: status,
      style: "bg-muted text-muted-foreground",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.style}`}>
        {config.label}
      </span>
    )
  }

  const pageLoading = authLoading || dataLoading

  if (pageLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Loading talent queue...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const primaryPhoto = selectedMedia.find((m) => m.type === "photo" && m.is_primary) || selectedMedia.find((m) => m.type === "photo")
  const secondaryPhotos = selectedMedia.filter((m) => m.type === "photo" && m.id !== primaryPhoto?.id)
  const reels = selectedMedia.filter((m) => m.type === "reel" || m.type === "video")
  const audios = selectedMedia.filter((m) => m.type === "voice_sample")
  const resumes = selectedMedia.filter((m) => m.type === "resume")

  return (
    <DashboardShell role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Award className="h-8 w-8 text-brand-500" />
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Talent Approval Queue
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review registered talent profiles, view composite cards and portfolios, and approve or request reviews.
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

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex bg-muted/40 border border-border/30 rounded-xl p-1 w-fit overflow-x-auto">
            {(["all", "pending", "under_review", "approved", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search talent profiles..."
              className="w-full pl-9 pr-4 py-2 border border-input rounded-xl bg-background/50 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Talent List Table */}
        <div className="bg-card/20 border border-border/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-10 w-10 text-brand-500 bg-brand-500/10 p-2 rounded-full mb-3" />
              <p className="text-base font-bold text-foreground">No profiles found</p>
              <p className="text-sm mt-1 text-muted-foreground/80">
                Adjust search query or filter to view other profiles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-card/40 text-muted-foreground font-semibold">
                    <th className="p-4">Talent Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Age / Gender</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredQueue.map((talent) => {
                    const email = talent.users?.email || "No email"
                    const mainCat = getCategoryName(talent.category_id)
                    const subCat = getCategoryName(talent.sub_category_id)
                    const age = calculateAge(talent.dob)
                    const isProcessing = actionLoadingId === talent.id

                    return (
                      <tr
                        key={talent.id}
                        className="hover:bg-card/10 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedTalent(talent)
                          setIsInspectorOpen(true)
                          setIsRejecting(false)
                        }}
                      >
                        {/* Name and email */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm flex items-center gap-1">
                              {talent.stage_name || talent.full_name}
                              {talent.is_premium && (
                                <Sparkles className="h-3.5 w-3.5 text-brand-500 fill-brand-500/20" />
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              {email}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <div className="flex flex-col text-xs text-foreground/80">
                            <span className="font-medium">{mainCat || "Uncategorized"}</span>
                            {subCat && <span className="text-[10px] text-muted-foreground">{subCat}</span>}
                          </div>
                        </td>

                        {/* Experience */}
                        <td className="p-4 text-foreground/80">
                          {talent.experience_years} {talent.experience_years === 1 ? "year" : "years"}
                        </td>

                        {/* Age / Gender */}
                        <td className="p-4 text-foreground/80 capitalize">
                          {age} • {talent.gender?.replace(/_/g, " ") || "—"}
                        </td>

                        {/* Status badge */}
                        <td className="p-4">
                          {getStatusBadge(talent.verification_status)}
                        </td>

                        {/* Actions Inspect Button */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTalent(talent)
                              setIsInspectorOpen(true)
                              setIsRejecting(false)
                            }}
                            className="text-xs font-semibold border-border/60 hover:bg-brand-500/10 hover:text-brand-500 cursor-pointer h-8 rounded-lg"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exhaustive Full Profile Modal */}
        <TalentFullProfileModal
          isOpen={isInspectorOpen && !!selectedTalent}
          talent={selectedTalent}
          mediaAssets={selectedMedia}
          categoryName={selectedTalent ? getCategoryName(selectedTalent.category_id) : ""}
          subCategoryName={selectedTalent?.sub_category_id ? getCategoryName(selectedTalent.sub_category_id) : undefined}
          onClose={() => setIsInspectorOpen(false)}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={!!actionLoadingId}
        />
      </div>
    </DashboardShell>
  )
}
