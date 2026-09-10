"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DashboardShell } from "@/components/shared/DashboardShell"
import { createClient } from "@/lib/supabase/client"
import { updateTalentVerificationStatus } from "./actions"
import { Button } from "@/components/ui/button"
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

        {/* Modal: Inspection & Review Drawer */}
        {isInspectorOpen && selectedTalent && (
          <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-500" />
                  <span className="font-heading font-semibold text-lg text-foreground">Talent Profile Inspector</span>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                <div className="grid md:grid-cols-12 gap-6 md:gap-8">
                  {/* Left Column: Headshot & Portfolio Photos */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Primary Photo */}
                    <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-sm relative flex items-center justify-center">
                      {mediaLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                      ) : primaryPhoto ? (
                        <img
                          src={primaryPhoto.url}
                          alt={selectedTalent.stage_name || selectedTalent.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground p-4">
                          <User className="h-16 w-16 stroke-1 mx-auto mb-2 text-muted-foreground/60" />
                          <p className="text-xs">No primary photo uploaded</p>
                        </div>
                      )}
                      {selectedTalent.is_premium && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-semibold text-[10px] shadow-md border border-brand-400/20">
                          <Sparkles className="h-3 w-3 fill-white" /> PREMIUM
                        </span>
                      )}
                    </div>

                    {/* Secondary Photos */}
                    {secondaryPhotos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portfolio Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {secondaryPhotos.map((photo) => (
                            <a
                              key={photo.id}
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted hover:scale-105 transition-transform shadow-sm block"
                            >
                              <img src={photo.url} alt="Portfolio item" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Bio, Stats, Other Media */}
                  <div className="md:col-span-7 space-y-6">
                    {/* Profile Title */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                          {selectedTalent.stage_name || selectedTalent.full_name}
                        </h2>
                        {getStatusBadge(selectedTalent.verification_status)}
                      </div>
                      <p className="text-brand-500 font-semibold text-xs capitalize mt-1.5">
                        {getCategoryName(selectedTalent.category_id)} {selectedTalent.sub_category_id ? `• ${getCategoryName(selectedTalent.sub_category_id)}` : ""}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Account Email: {selectedTalent.users?.email || "—"}
                      </p>
                    </div>

                    {/* Personal Stats details */}
                    <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-4 text-xs">
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">City / Country</span>
                        <p className="font-semibold text-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand-500" /> {selectedTalent.city || "—"}, {selectedTalent.country || "Pakistan"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Age / Gender</span>
                        <p className="font-semibold text-foreground mt-1 capitalize">
                          {calculateAge(selectedTalent.dob)} / {selectedTalent.gender?.replace(/_/g, " ") || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Height / Weight</span>
                        <p className="font-semibold text-foreground mt-1">
                          {formatHeight(selectedTalent.height_cm)} • {formatWeight(selectedTalent.weight_kg)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">Languages</span>
                        <p className="font-semibold text-foreground mt-1">
                          {selectedTalent.languages?.join(", ") || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Bio & Skills */}
                    <div className="space-y-3">
                      {selectedTalent.bio && (
                        <div>
                          <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Biography</h4>
                          <p className="text-xs text-foreground bg-muted/40 border border-border/20 p-3 rounded-xl leading-relaxed italic">
                            "{selectedTalent.bio}"
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">Special Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedTalent.skills?.map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/10 rounded-md text-[10px] font-semibold"
                            >
                              {skill}
                            </span>
                          )) || <span className="text-xs text-muted-foreground">None listed</span>}
                        </div>
                      </div>
                    </div>

                    {/* Other Portfolio Assets */}
                    {(reels.length > 0 || audios.length > 0 || resumes.length > 0) && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold text-foreground border-b border-border/40 pb-1">Media Files & Credentials</h4>
                        <div className="space-y-2">
                          {/* Video reels */}
                          {reels.map((reel) => (
                            <div key={reel.id} className="flex items-center justify-between p-2.5 bg-background/50 border border-border/30 rounded-xl">
                              <div className="flex items-center gap-2 min-w-0">
                                <Video className="h-5 w-5 text-brand-500 shrink-0" />
                                <span className="text-xs font-medium truncate max-w-[200px]">Video Reel / Clip</span>
                              </div>
                              <a
                                href={reel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] bg-brand-500 text-white font-semibold px-2.5 py-1 rounded-lg hover:bg-brand-600 shadow-md shadow-brand-500/10 transition-all cursor-pointer"
                              >
                                Watch <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))}

                          {/* Voice samples */}
                          {audios.map((audio) => (
                            <div key={audio.id} className="flex flex-col gap-2 p-2.5 bg-background/50 border border-border/30 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Music className="h-5 w-5 text-brand-500 shrink-0" />
                                <span className="text-xs font-medium">Voice Sample</span>
                              </div>
                              <audio src={audio.url} controls className="w-full h-8" />
                            </div>
                          ))}

                          {/* Resumes */}
                          {resumes.map((resume) => (
                            <div key={resume.id} className="flex items-center justify-between p-2.5 bg-background/50 border border-border/30 rounded-xl">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-5 w-5 text-brand-500 shrink-0" />
                                <span className="text-xs font-medium truncate max-w-[200px]">Professional Resume</span>
                              </div>
                              <a
                                href={resume.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] bg-brand-500 text-white font-semibold px-2.5 py-1 rounded-lg hover:bg-brand-600 shadow-md shadow-brand-500/10 transition-all cursor-pointer"
                              >
                                View File <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Feed Area */}
                {isRejecting && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                      Feedback / Rejection Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please explain why the profile is rejected. This feedback will help the talent re-submit with correct info."
                      className="w-full p-3 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsRejecting(false)
                          setRejectReason("")
                        }}
                        className="h-8 rounded-lg font-semibold cursor-pointer text-foreground"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedTalent, "rejected", rejectReason)}
                        disabled={!rejectReason.trim()}
                        className="bg-destructive hover:bg-destructive/95 text-white font-semibold shadow-md shadow-destructive/10 h-8 rounded-lg cursor-pointer"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-4 border-t border-border/40 bg-muted/20 shrink-0 flex flex-wrap gap-2 items-center justify-between">
                <div>
                  {actionLoadingId === selectedTalent.id && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                      Updating verification status...
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsInspectorOpen(false)}
                    className="h-9 text-xs rounded-lg font-semibold border-border/60 hover:bg-muted text-foreground cursor-pointer"
                  >
                    Close
                  </Button>

                  {/* Reject option */}
                  {selectedTalent.verification_status !== "rejected" && !isRejecting && (
                    <Button
                      variant="ghost"
                      onClick={() => setIsRejecting(true)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold cursor-pointer h-9 text-xs rounded-lg"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject Profile
                    </Button>
                  )}

                  {/* Under review option */}
                  {selectedTalent.verification_status !== "under_review" && (
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedTalent, "under_review")}
                      className="h-9 text-xs rounded-lg border-blue-500/20 text-blue-500 hover:bg-blue-500/10 font-semibold cursor-pointer"
                    >
                      Mark Under Review
                    </Button>
                  )}

                  {/* Approve option */}
                  {selectedTalent.verification_status !== "approved" && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedTalent, "approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/10 h-9 text-xs rounded-lg cursor-pointer"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
