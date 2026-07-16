"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  Tv,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react"

type CastingCallWithCount = {
  id: string
  title: string
  status: "draft" | "open" | "closed" | "cancelled"
  location: string | null
  application_deadline: string | null
  categories: { name: string } | null
  applications_count: number
}

export default function ProducerApplicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callId = searchParams.get("callId")
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()

  // 1. Redirect if callId is specified in URL query
  useEffect(() => {
    if (callId) {
      router.replace(`/producer/casting/${callId}/applications`)
    }
  }, [callId, router])

  // 2. Fetch producer profile to check verification status and get profile ID
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["producer-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user?.id && !callId,
  })

  // 3. Fetch all producer's casting calls and their applicant counts
  const { data: castingCalls = [], isLoading: callsLoading } = useQuery<CastingCallWithCount[]>({
    queryKey: ["producer-casting-calls-list-apps", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: calls, error: callsError } = await supabase
        .from("casting_calls")
        .select(`
          id,
          title,
          status,
          location,
          application_deadline,
          categories:category_id (
            name
          )
        `)
        .eq("producer_id", profile.id)
        .order("created_at", { ascending: false })

      if (callsError) throw callsError
      if (!calls || calls.length === 0) return []

      const callIds = calls.map((c) => c.id)

      // Get count of applications for these calls
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
        } as CastingCallWithCount
      })
    },
    enabled: !!profile?.id && !callId,
  })

  const isLoading = authLoading || profileLoading || callsLoading

  if (callId || isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading application portal...</p>
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
          <p className="text-sm text-muted-foreground">Please complete onboarding to manage applications.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-brand-500" /> Submissions Portal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select one of your active casting calls below to moderate applicant portfolios, shortlists, and auditions.
        </p>
      </div>

      {/* Grid of Casting Calls with application stats */}
      {castingCalls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center bg-card/25 border border-border/40 rounded-2xl">
          <Tv className="h-12 w-12 text-muted-foreground/45 mb-3" />
          <p className="text-base font-bold text-foreground">No casting calls found</p>
          <p className="text-xs mt-1 text-muted-foreground/80 max-w-xs">
            You must create and publish a casting call before receiving submissions.
          </p>
          <Link href="/producer/casting/create" className="mt-4">
            <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer">
              Create Casting Call
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {castingCalls.map((call) => {
            const deadlineDate = call.application_deadline ? new Date(call.application_deadline) : null
            const hasPassed = deadlineDate ? deadlineDate.getTime() < Date.now() : false

            return (
              <div
                key={call.id}
                className="bg-card/25 border border-border/40 hover:border-brand-500/30 p-5 rounded-2xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-heading text-base font-bold text-foreground group-hover:text-brand-500 transition-colors">
                      {call.title}
                    </h3>
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

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      {call.categories?.name || "Talent Category"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {call.location || "Pakistan"}
                    </span>
                    {deadlineDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {hasPassed ? "Expired" : "Active"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-border/10 md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                  {/* Stats count indicator */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-500 bg-brand-500/5 hover:bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/10 transition-colors">
                    <Users className="h-4 w-4" /> {call.applications_count} submissions
                  </div>

                  {/* Link */}
                  <Link href={`/producer/casting/${call.id}/applications`}>
                    <button className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-brand-500/10">
                      Review Submissions <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
