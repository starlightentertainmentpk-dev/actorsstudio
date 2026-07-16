"use client"

import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { calculateCompleteness } from "@/lib/utils/profile-completeness"
import Link from "next/link"
import { 
  User, 
  Image as ImageIcon, 
  Briefcase, 
  Calendar, 
  Eye,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock
} from "lucide-react"
import { motion } from "framer-motion"

export default function TalentDashboardPage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()

  // Fetch talent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Fetch primary photo asset
  const { data: primaryPhoto, isLoading: photoLoading } = useQuery({
    queryKey: ["primary-photo", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("media_assets")
        .select("url")
        .eq("owner_id", user.id)
        .eq("type", "photo")
        .eq("is_primary", true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Fetch applications count
  const { data: applicationsCount = 0, isLoading: appsLoading } = useQuery({
    queryKey: ["applications-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", profile.id)
      if (error) throw error
      return count || 0
    },
    enabled: !!profile?.id
  })

  // Fetch scheduled auditions count (scheduled in the future)
  const { data: auditionsCount = 0, isLoading: auditionsLoading } = useQuery({
    queryKey: ["auditions-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0
      const { count, error } = await supabase
        .from("auditions")
        .select("*", { count: "exact", head: true })
        .eq("talent_id", profile.id)
        .gt("scheduled_at", new Date().toISOString())
      if (error) throw error
      return count || 0
    },
    enabled: !!profile?.id
  })

  const isLoading = authLoading || profileLoading || photoLoading || appsLoading || auditionsLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading your dashboard info...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Profile not found</h2>
          <p className="text-sm text-muted-foreground">Please complete your onboarding to access the dashboard.</p>
        </div>
        <Link href="/talent/onboarding">
          <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer">
            Go to Onboarding
          </button>
        </Link>
      </div>
    )
  }

  // Calculate profile completeness
  const completenessObj = {
    full_name: profile.full_name,
    bio: profile.bio,
    city: profile.city,
    category_id: profile.category_id,
    skills: profile.skills,
    languages: profile.languages,
    primary_photo: !!primaryPhoto?.url,
    experience_years: profile.experience_years,
  }
  const completeness = calculateCompleteness(completenessObj)

  // Verification banner configuration
  const bannerConfigs: Record<string, { color: string; bg: string; border: string; icon: any; message: string }> = {
    pending: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/5 dark:bg-amber-500/10",
      border: "border-amber-500/20",
      icon: Clock,
      message: "Your profile is pending review. We'll notify you within 24–48 hours."
    },
    under_review: {
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      border: "border-blue-500/20",
      icon: Clock,
      message: "Our team is currently reviewing your profile."
    },
    interview_scheduled: {
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/5 dark:bg-purple-500/10",
      border: "border-purple-500/20",
      icon: Calendar,
      message: "An interview has been scheduled. Check your email for details."
    },
    audition_scheduled: {
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/5 dark:bg-purple-500/10",
      border: "border-purple-500/20",
      icon: Calendar,
      message: "An audition has been scheduled. Check your email for details."
    },
    rejected: {
      color: "text-destructive",
      bg: "bg-destructive/5 dark:bg-destructive/10",
      border: "border-destructive/20",
      icon: AlertTriangle,
      message: "Your profile was not approved. Contact support for details."
    },
    blacklisted: {
      color: "text-destructive",
      bg: "bg-destructive/5 dark:bg-destructive/10",
      border: "border-destructive/20",
      icon: Lock,
      message: "Your account has been suspended."
    },
    inactive: {
      color: "text-muted-foreground",
      bg: "bg-muted/40",
      border: "border-border",
      icon: AlertTriangle,
      message: "Your profile is currently inactive."
    }
  }

  const currentStatus = profile.verification_status
  const banner = currentStatus !== "approved" ? bannerConfigs[currentStatus] : null

  return (
    <div className="space-y-6">
      {/* Verification Banner */}
      {banner && (
        <div className={`flex items-center gap-3 border ${banner.border} ${banner.bg} rounded-2xl p-4 transition-all shadow-sm`}>
          <banner.icon className={`h-5 w-5 ${banner.color} shrink-0`} />
          <p className={`text-sm font-medium ${banner.color}`}>
            {banner.message}
          </p>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile.stage_name || profile.full_name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your digital comp card, upload fresh media, and track your applications.
          </p>
        </div>
        {profile.is_premium && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs border border-amber-500/20 shrink-0 self-start sm:self-center">
            <Sparkles className="h-3.5 w-3.5 fill-amber-500" /> Premium Member
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card: Completeness */}
        <div className="bg-card/25 backdrop-blur-md border border-border/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:shadow-brand-500/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Profile Completeness</span>
            <User className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">{completeness}%</span>
              <div className="w-28 bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {completeness < 100 && (
              <Link href="/talent/profile" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
                Complete profile <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Stat Card: Total Applications */}
        <div className="bg-card/25 backdrop-blur-md border border-border/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:shadow-brand-500/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active Applications</span>
            <Briefcase className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-foreground">{applicationsCount}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Submitted applications</p>
            </div>
            <Link href="/talent/casting" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
              Browse Calls <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat Card: Scheduled Auditions */}
        <div className="bg-card/25 backdrop-blur-md border border-border/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:shadow-brand-500/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Scheduled Auditions</span>
            <Calendar className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-foreground">{auditionsCount}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Upcoming auditions</p>
            </div>
            <Link href="/talent/auditions" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
              View Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat Card: Profile Views */}
        <div className="bg-card/25 backdrop-blur-md border border-border/40 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:shadow-brand-500/5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Profile Views</span>
            <Eye className="h-4 w-4 text-brand-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-foreground">—</span>
              <p className="text-[10px] text-muted-foreground mt-1">Implement in Tier 3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Actions & Status */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Action 1: Edit Profile */}
            <Link href="/talent/profile">
              <div className="bg-card/20 hover:bg-card/45 backdrop-blur-md border border-border/40 hover:border-brand-500/50 p-6 rounded-2xl transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors flex items-center gap-1">
                    Edit Profile info <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Update your bio, height, measurements, and social connections.
                  </p>
                </div>
              </div>
            </Link>

            {/* Action 2: Media Library */}
            <Link href="/talent/media">
              <div className="bg-card/20 hover:bg-card/45 backdrop-blur-md border border-border/40 hover:border-brand-500/50 p-6 rounded-2xl transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors flex items-center gap-1">
                    Manage Media <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload headshots, manage videos, and add audio voice samples.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Profile Card Preview summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Digital ID</h2>
          <div className="bg-card/20 backdrop-blur-md border border-border/40 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-brand-500/30 p-1 bg-background">
              {primaryPhoto?.url ? (
                <img 
                  src={primaryPhoto.url} 
                  alt={profile.full_name} 
                  className="h-full w-full object-cover rounded-full" 
                />
              ) : (
                <div className="h-full w-full bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center font-bold text-xl">
                  {profile.full_name[0].toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="font-bold text-foreground mt-4 text-base">{profile.stage_name || profile.full_name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{profile.city || "No location set"}</p>
            
            <div className="w-full border-t border-border/40 my-4" />

            <div className="w-full grid grid-cols-2 gap-2 text-left text-xs">
              <div>
                <span className="text-muted-foreground">Main Role</span>
                <p className="font-semibold text-foreground capitalize mt-0.5">{profile.category_id ? "Linked" : "Not set"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Experience</span>
                <p className="font-semibold text-foreground mt-0.5">{profile.experience_years} Years</p>
              </div>
            </div>

            <Link href="/talent/profile" className="w-full mt-5">
              <button className="w-full bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer">
                Preview Comp Card
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
