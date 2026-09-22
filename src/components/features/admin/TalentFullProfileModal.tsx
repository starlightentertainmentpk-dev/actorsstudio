"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Award,
  ExternalLink,
  Download,
  Video,
  Music,
  FileText,
  Globe,
  Check,
  AlertCircle,
  Eye,
  Scale,
  Ruler,
  Layers,
  Clock,
  ShieldCheck,
  Play,
  Briefcase,
  Printer,
  FileDown,
  ChevronDown
} from "lucide-react"
import type { Database } from "@/types/database"

export type TalentProfile = Database["public"]["Tables"]["talent_profiles"]["Row"] & {
  users?: { email?: string; phone?: string | null; status?: string } | null
}

export type MediaAsset = Database["public"]["Tables"]["media_assets"]["Row"]

export interface TalentFullProfileModalProps {
  talent: any
  mediaAssets?: MediaAsset[]
  categoryName?: string
  subCategoryName?: string
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (talent: any, newStatus: "approved" | "rejected" | "under_review" | "interview_scheduled", reason?: string) => Promise<void>
  isUpdatingStatus?: boolean
}

// Custom Social SVG Icons
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
)

export function TalentFullProfileModal({
  talent,
  mediaAssets = [],
  categoryName = "Not specified",
  subCategoryName,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdatingStatus = false,
}: TalentFullProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "media" | "social" | "specs">("overview")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [printMenuOpen, setPrintMenuOpen] = useState(false)

  // Rejection feedback state
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  if (!isOpen || !talent) return null

  // Photos & media classification
  const photos = mediaAssets.filter((a) => a.type === "photo" || a.type === "headshot").sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0]
  const galleryPhotos = photos.filter((p) => p.id !== primaryPhoto?.id)

  const videos = mediaAssets.filter((a) => a.type === "reel" || a.type === "video")
  const voiceClips = mediaAssets.filter((a) => a.type === "voice" || a.type === "voice_sample" || a.type === "audio")
  const resumes = mediaAssets.filter((a) => a.type === "resume" || a.type === "document" || a.type === "doc")

  // Social links extraction (supports measurements_json.social and any direct properties)
  const measurements = (talent.measurements_json as Record<string, any>) || {}
  const social = measurements.social || {}

  const socialLinks = [
    { label: "Instagram", url: social.instagram || social.instagram_url, icon: InstagramIcon, color: "text-pink-500 bg-pink-500/10" },
    { label: "TikTok", url: social.tiktok || social.tiktok_url, icon: TikTokIcon, color: "text-neutral-200 bg-neutral-800" },
    { label: "YouTube", url: social.youtube || social.youtube_url, icon: YoutubeIcon, color: "text-red-500 bg-red-500/10" },
    { label: "Facebook", url: social.facebook || social.facebook_url, icon: FacebookIcon, color: "text-blue-500 bg-blue-500/10" },
    { label: "Website / Portfolio", url: social.website || social.website_url, icon: Globe, color: "text-brand-500 bg-brand-500/10" },
  ].filter((s) => Boolean(s.url))

  // Calculation helpers
  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A"
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years old (${dob})`
  }

  const formatHeight = (cm: number | null | undefined) => {
    if (!cm) return "Not specified"
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${cm} cm (${feet}'${inches}")`
  }

  const formatWeight = (kg: number | null | undefined) => {
    if (!kg) return "Not specified"
    return `${kg} kg (${Math.round(kg * 2.20462)} lbs)`
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return null
  }

  const allPhotoSlides = photos.map((p) => ({ src: p.url }))

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground font-heading truncate">
                  {talent.stage_name || talent.full_name}
                </h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  talent.verification_status === "approved"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : talent.verification_status === "rejected"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  {talent.verification_status?.replace(/_/g, " ")}
                </span>
                {talent.is_premium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shadow-sm">
                    <Sparkles className="h-3 w-3 fill-white" /> Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Legal: {talent.full_name} • {categoryName} {subCategoryName ? `(${subCategoryName})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {talent.slug && (
              <a
                href={`/talent/${talent.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-brand-500" /> Public Page
              </a>
            )}
            {/* Print / PDF Export Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPrintMenuOpen(!printMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / PDF</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${printMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {printMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-2xl py-1.5 z-30 animate-in fade-in-50 zoom-in-95 duration-150"
                  onClick={() => setPrintMenuOpen(false)}
                >
                  <a
                    href={`/api/talent/${talent.slug || talent.id}/pdf?type=overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-brand-500/10 hover:text-brand-500 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="font-bold">1. Print Overview & Bio</p>
                      <p className="text-[10px] text-muted-foreground">Formatted 1-page summary PDF</p>
                    </div>
                  </a>

                  <a
                    href={`/api/talent/${talent.slug || talent.id}/pdf?type=full`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-brand-500/10 hover:text-brand-500 transition-colors border-t border-border/40 cursor-pointer"
                  >
                    <FileDown className="h-4 w-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="font-bold">2. Print Full Profile</p>
                      <p className="text-[10px] text-muted-foreground">Full dossier with portfolio gallery PDF</p>
                    </div>
                  </a>

                  <a
                    href={`/api/talent/${talent.slug || talent.id}/pdf?type=comp_card`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-foreground hover:bg-brand-500/10 hover:text-brand-500 transition-colors border-t border-border/40 cursor-pointer"
                  >
                    <Award className="h-4 w-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="font-semibold">Print Comp Card</p>
                      <p className="text-[10px] text-muted-foreground">Landscape composite card PDF</p>
                    </div>
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/60 bg-muted/20 px-6 overflow-x-auto gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Bio
          </button>
          <button
            onClick={() => setActiveTab("photos")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "photos"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Photos & Gallery ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "media"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Reels, Voice & Resumes ({videos.length + voiceClips.length + resumes.length})
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "social"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Social Profiles ({socialLinks.length})
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "specs"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Physical Specs & Measurements
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-12 gap-6">
              {/* Primary Headshot Card */}
              <div className="md:col-span-4 space-y-4">
                <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-sm relative flex items-center justify-center">
                  {primaryPhoto ? (
                    <img
                      src={primaryPhoto.url}
                      alt={talent.stage_name || talent.full_name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform"
                      onClick={() => {
                        setLightboxIndex(0)
                        setLightboxOpen(true)
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <User className="h-16 w-16 stroke-1 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-xs">No primary photo uploaded</p>
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white rounded text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm">
                    <Eye className="h-3 w-3" /> Click to enlarge
                  </span>
                </div>

                {/* Quick Contact Box */}
                <div className="bg-card/50 border border-border/80 rounded-xl p-4 space-y-2.5 text-xs">
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    Contact & Identification
                  </h4>
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-brand-500 shrink-0" />
                    <span className="truncate">{talent.users?.email || "No email on file"}</span>
                  </div>
                  {talent.users?.phone && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-brand-500 shrink-0" />
                      <span>{talent.users.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                    <span>{talent.city || "—"}, {talent.country || "Pakistan"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-4 w-4 text-brand-500 shrink-0" />
                    <span>DOB: {calculateAge(talent.dob)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-brand-500 shrink-0" />
                    <span className="capitalize">Gender: {talent.gender?.replace(/_/g, " ") || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Bio, Professional Overview & Skills */}
              <div className="md:col-span-8 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Professional Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Primary Category</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{categoryName}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Sub-Category</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{subCategoryName || "None"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Experience</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{talent.experience_years ?? 0} Years</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Availability</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {talent.is_available ? "Available for Castings" : "Currently Unavailable"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Union Status</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {talent.union_member ? "Union Member" : "Non-Union"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Tier</span>
                      <p className="text-xs font-bold text-foreground mt-0.5 capitalize">{talent.subscription_tier || "Free"}</p>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Biography / About
                  </h3>
                  {talent.bio ? (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {talent.bio}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No biography provided by talent.</p>
                  )}
                </div>

                {/* Languages */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Languages Spoken
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.languages && talent.languages.length > 0 ? (
                      talent.languages.map((lang: string) => (
                        <span key={lang} className="px-2.5 py-1 rounded-lg bg-background/80 border border-border text-xs font-medium text-foreground">
                          {lang}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No languages listed</span>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Special Skills & Talents
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {talent.skills && talent.skills.length > 0 ? (
                      talent.skills.map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No special skills listed</span>
                    )}
                  </div>
                </div>

                {/* Physical Specs & Measurements in Overview & Bio Tab */}
                <div className="pt-2 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5 text-brand-500" />
                      Physical Specs & Measurements
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Ruler className="h-3 w-3 text-brand-500" /> Height
                      </span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{formatHeight(talent.height_cm)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3 text-brand-500" /> Weight
                      </span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{formatWeight(talent.weight_kg)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Chest / Bust</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {measurements.chest || measurements.bust ? `${measurements.chest || measurements.bust}"` : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Waist</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {measurements.waist ? `${measurements.waist}"` : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Hips</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {measurements.hip || measurements.hips ? `${measurements.hip || measurements.hips}"` : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Eye Color</span>
                      <p className="text-xs font-bold text-foreground mt-0.5 capitalize">
                        {measurements.eye_color || measurements.eyes || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Hair Color</span>
                      <p className="text-xs font-bold text-foreground mt-0.5 capitalize">
                        {measurements.hair_color || measurements.hair || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background/50 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Shoe Size</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {measurements.shoe_size || measurements.shoes || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Profiles in Overview & Bio Tab */}
                <div className="pt-2 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-brand-500" />
                      Social Profiles & Online Presence
                    </h3>
                  </div>
                  {socialLinks.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-muted/20 border border-dashed border-border text-xs text-muted-foreground italic flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground/60" />
                      No social profiles added yet.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {socialLinks.map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="p-2.5 rounded-xl bg-card/60 border border-border flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</span>
                                <p className="text-xs font-medium text-foreground truncate">{item.url}</p>
                              </div>
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted shrink-0 transition-colors"
                            >
                              Visit <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Dedicated 2 Printing Options Action Bar in Overview & Bio */}
                <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Printer className="h-4 w-4 text-brand-500" />
                      Export Profile PDF Options
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Generate official formatted PDFs for casting and archival.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`/api/talent/${talent.slug || talent.id}/pdf?type=overview`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-brand-500" />
                      Print Overview & Bio
                    </a>
                    <a
                      href={`/api/talent/${talent.slug || talent.id}/pdf?type=full`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Print Full Profile (PDF)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">All Uploaded Pictures</h3>
                  <p className="text-xs text-muted-foreground">Click any image to view in high-resolution full screen lightbox.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-lg">
                  {photos.length} Total Image{photos.length === 1 ? "" : "s"}
                </span>
              </div>

              {photos.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No photos uploaded</p>
                  <p className="text-xs text-muted-foreground">Talent has not uploaded headshots or portfolio gallery pictures.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-muted/30 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-102"
                      onClick={() => {
                        setLightboxIndex(idx)
                        setLightboxOpen(true)
                      }}
                    >
                      <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {photo.is_primary && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-500 text-white font-bold text-[9px] shadow-sm flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5 fill-white" /> Primary
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                          <Eye className="h-3.5 w-3.5" /> Enlarge
                        </span>
                      </div>

                      {photo.file_size_bytes && (
                        <span className="absolute bottom-2 right-2 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                          {(photo.file_size_bytes / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA, REELS & RESUMES */}
          {activeTab === "media" && (
            <div className="space-y-6">
              {/* Video Reels */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Video Reels & Clips ({videos.length})
                </h3>
                {videos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No video reels uploaded.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {videos.map((vid) => {
                      const embedUrl = getEmbedUrl(vid.url)
                      return (
                        <div key={vid.id} className="p-4 rounded-2xl bg-card/60 border border-border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-2">
                              <Video className="h-4 w-4 text-brand-500" /> Video Reel
                            </span>
                            <a
                              href={vid.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-brand-500 hover:underline flex items-center gap-1"
                            >
                              Direct Link <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {embedUrl ? (
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                              <iframe
                                src={embedUrl}
                                title="Video Reel"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                              <video src={vid.url} controls className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Audio Voice Samples */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Voice & Audio Samples ({voiceClips.length})
                </h3>
                {voiceClips.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No voice clips uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {voiceClips.map((audio) => (
                      <div key={audio.id} className="p-3.5 rounded-xl bg-card/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <Music className="h-4 w-4 text-brand-500" />
                          <span>Voiceover / Audio Asset</span>
                        </div>
                        <audio src={audio.url} controls className="w-full sm:w-80 h-9" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumes & Documents */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Resumes & Documents ({resumes.length})
                </h3>
                {resumes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No resume or PDF credentials uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((doc) => (
                      <div key={doc.id} className="p-3.5 rounded-xl bg-card/60 border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground min-w-0">
                          <FileText className="h-4 w-4 text-brand-500 shrink-0" />
                          <span className="truncate">Professional Resume / CV</span>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shrink-0 shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" /> Download File
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL PROFILES & LINKS */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Social & Online Profiles</h3>
                  <p className="text-xs text-muted-foreground">All verified social media channels, websites, and reels provided by talent.</p>
                </div>
              </div>

              {socialLinks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">No social profiles connected</p>
                  <p className="text-xs text-muted-foreground">Talent has not added Instagram, TikTok, YouTube, or website URLs.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {socialLinks.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="p-4 rounded-2xl bg-card/60 border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                            <p className="text-xs font-medium text-foreground truncate">{item.url}</p>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted shrink-0 transition-colors"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PHYSICAL SPECS & MEASUREMENTS */}
          {activeTab === "specs" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Core Measurements
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Ruler className="h-3 w-3 text-brand-500" /> Height
                    </span>
                    <p className="text-xs font-bold text-foreground mt-1">{formatHeight(talent.height_cm)}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Scale className="h-3 w-3 text-brand-500" /> Weight
                    </span>
                    <p className="text-xs font-bold text-foreground mt-1">{formatWeight(talent.weight_kg)}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Eye Color</span>
                    <p className="text-xs font-bold text-foreground mt-1 capitalize">
                      {measurements.eye_color || measurements.eyes || "Not specified"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Hair Color</span>
                    <p className="text-xs font-bold text-foreground mt-1 capitalize">
                      {measurements.hair_color || measurements.hair || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Clothing & Body Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Chest / Bust</span>
                    <p className="text-xs font-bold text-foreground mt-1">
                      {measurements.chest || measurements.bust ? `${measurements.chest || measurements.bust} in` : "—"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Waist</span>
                    <p className="text-xs font-bold text-foreground mt-1">
                      {measurements.waist ? `${measurements.waist} in` : "—"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Hips</span>
                    <p className="text-xs font-bold text-foreground mt-1">
                      {measurements.hips ? `${measurements.hips} in` : "—"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Shoe Size</span>
                    <p className="text-xs font-bold text-foreground mt-1">
                      {measurements.shoe_size || measurements.shoes || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Skin Tone & Complexion
                </h3>
                <div className="p-3.5 rounded-xl bg-background/50 border border-border">
                  <p className="text-xs font-bold text-foreground capitalize">
                    {measurements.skin_tone || measurements.complexion || "Standard / Unspecified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Note Feed */}
          {isRejecting && onUpdateStatus && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3 animate-in slide-in-from-bottom-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Rejection Reason / Feedback for Talent <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain to the talent why their profile was not approved (e.g. invalid photos, incomplete bio, missing contact info)..."
                className="w-full p-3 rounded-xl border border-input bg-background/80 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex justify-end gap-2 text-xs">
                <Button variant="ghost" onClick={() => setIsRejecting(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await onUpdateStatus(talent, "rejected", rejectReason)
                    setIsRejecting(false)
                  }}
                  disabled={!rejectReason.trim() || isUpdatingStatus}
                  className="h-8 text-xs bg-destructive text-white hover:bg-destructive/90"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Toolbar */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            User ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{talent.user_id}</code>
          </div>

          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <>
                {talent.verification_status !== "approved" && (
                  <Button
                    onClick={() => onUpdateStatus(talent, "approved")}
                    disabled={isUpdatingStatus}
                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve Talent
                  </Button>
                )}

                {talent.verification_status !== "rejected" && !isRejecting && (
                  <Button
                    variant="outline"
                    onClick={() => setIsRejecting(true)}
                    disabled={isUpdatingStatus}
                    className="h-9 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-1" /> Reject Profile
                  </Button>
                )}

                {talent.verification_status !== "under_review" && (
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(talent, "under_review")}
                    disabled={isUpdatingStatus}
                    className="h-9 text-xs border-border hover:bg-muted text-foreground"
                  >
                    Mark Under Review
                  </Button>
                )}
              </>
            )}

            <Button variant="ghost" onClick={onClose} className="h-9 text-xs font-semibold">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox for high-resolution picture browsing */}
      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={allPhotoSlides}
        />
      )}
    </div>
  )
}
