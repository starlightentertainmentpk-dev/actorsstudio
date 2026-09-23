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

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-xs text-muted-foreground font-medium">Loading your studio dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center ring-4 ring-destructive/5">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-heading">Profile not found</h2>
          <p className="text-xs text-muted-foreground mt-1">Please complete your onboarding to access the studio dashboard.</p>
        </div>
        <Link href="/talent/onboarding">
          <Button size="sm" variant="default" className="font-semibold shadow-xs">
            Complete Onboarding
          </Button>
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
  const bannerConfigs: Record<string, { variant: "warning" | "default" | "purple" | "destructive" | "secondary"; icon: any; message: string }> = {
    pending: {
      variant: "warning",
      icon: Clock,
      message: "Your profile is pending review. We will notify you within 24–48 hours."
    },
    under_review: {
      variant: "default",
      icon: Clock,
      message: "Our studio casting team is currently reviewing your profile."
    },
    interview_scheduled: {
      variant: "purple",
      icon: Calendar,
      message: "An interview has been scheduled. Check your email or Auditions tab."
    },
    audition_scheduled: {
      variant: "purple",
      icon: Calendar,
      message: "An audition has been scheduled. Check your email for details."
    },
    rejected: {
      variant: "destructive",
      icon: AlertTriangle,
      message: "Your profile was not approved. Contact studio support for details."
    },
    blacklisted: {
      variant: "destructive",
      icon: Lock,
      message: "Your studio account has been suspended."
    },
    inactive: {
      variant: "secondary",
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
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-800 dark:text-amber-200 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <banner.icon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">{banner.message}</span>
          </div>
          <Badge variant={banner.variant} size="sm" className="capitalize shrink-0">
            {profile.verification_status.replace(/_/g, " ")}
          </Badge>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile.stage_name || profile.full_name}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Manage your digital comp card, upload fresh media reels, and track your active casting applications.
          </p>
        </div>
        {profile.is_premium && (
          <Badge variant="warning" size="default" className="gap-1.5 self-start sm:self-center font-bold">
            <Sparkles className="h-3 w-3 fill-current" /> Premium Artist
          </Badge>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card: Completeness */}
        <Card hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Profile Completeness
            </span>
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold font-heading text-foreground tabular-nums">{completeness}%</span>
              <div className="w-28 bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {completeness < 100 && (
              <Link href="/talent/profile" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                Complete <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </Card>

        {/* Stat Card: Total Applications */}
        <Card hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Applications
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold font-heading text-foreground tabular-nums">{applicationsCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Submitted applications</p>
            </div>
            <Link href="/talent/casting" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              Browse Calls <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Stat Card: Scheduled Auditions */}
        <Card hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Scheduled Auditions
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-3xl font-extrabold font-heading text-foreground tabular-nums">{auditionsCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Upcoming sessions</p>
            </div>
            <Link href="/talent/auditions" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
              Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Stat Card: Profile Verification */}
        <Card hover className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Verification Status
            </span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-lg font-bold font-heading text-foreground capitalize">
                {profile.verification_status || "Pending"}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Studio verified badge</p>
            </div>
            <Badge variant={profile.verification_status === "approved" ? "success" : "cyan"} size="sm" className="capitalize">
              {profile.verification_status === "approved" ? "Verified" : profile.verification_status}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Main Grid: Quick Actions & Digital ID */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground font-heading">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Action 1: Edit Profile */}
            <Link href="/talent/profile">
              <Card hover className="p-6 cursor-pointer h-full flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1 font-heading">
                    Edit Profile Info <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Update your biography, height, measurements, and verified social connections.
                  </p>
                </div>
              </Card>
            </Link>

            {/* Action 2: Media Library */}
            <Link href="/talent/media">
              <Card hover className="p-6 cursor-pointer h-full flex flex-col justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1 font-heading">
                    Manage Media Library <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Upload headshots, manage high-def video reels, and add voice/accent demos.
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Digital ID Card */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground font-heading">Digital Comp Card</h2>
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-brand-500/30 p-1 bg-background shadow-xs">
              {primaryPhoto?.url ? (
                <img 
                  src={primaryPhoto.url} 
                  alt={profile.full_name} 
                  className="h-full w-full object-cover rounded-full" 
                />
              ) : (
                <div className="h-full w-full bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-xl font-heading">
                  {profile.full_name[0].toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="font-bold text-foreground mt-3.5 text-base font-heading">
              {profile.stage_name || profile.full_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.city || "Pakistan"}</p>
            
            <div className="w-full border-t border-border/50 my-4" />

            <div className="w-full grid grid-cols-2 gap-3 text-left text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Category</span>
                <p className="font-semibold text-foreground capitalize mt-0.5 truncate">
                  {profile.category_id ? "Linked" : "Performer"}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Experience</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {profile.experience_years} Years
                </p>
              </div>
            </div>

            <Link href="/talent/profile" className="w-full mt-4">
              <Button variant="outline" size="sm" className="w-full font-semibold text-xs">
                Preview Comp Card
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
