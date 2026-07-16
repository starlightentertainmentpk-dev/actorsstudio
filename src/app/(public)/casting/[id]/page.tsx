import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { CastingApplyButton } from "../_components/CastingApplyButton"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Metadata } from "next"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle,
  Briefcase,
  Layers,
  Clock,
  Shield,
  Languages,
  User,
  HeartHandshake,
} from "lucide-react"

type PageProps = {
  params: Promise<{ id: string }>
}

// SEO Metadata Generator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: call } = await supabase
    .from("casting_calls")
    .select(`
      title,
      description,
      location,
      producer_profiles (
        company_name
      )
    `)
    .eq("id", resolvedParams.id)
    .single()

  if (!call) {
    return {
      title: "Casting Call | Actor's Studio Pakistan",
    }
  }

  const producerName = call.producer_profiles?.company_name || "Paramount Pictures"
  const cleanedDesc = call.description?.replace(/<[^>]*>/g, "").slice(0, 160) || ""

  return {
    title: `${call.title} by ${producerName} | Actor's Studio Casting`,
    description: cleanedDesc,
    openGraph: {
      title: `Casting Call: ${call.title}`,
      description: `Posted by ${producerName} • Location: ${call.location || "Pakistan"}`,
      type: "article",
    },
  }
}

export default async function PublicCastingCallDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  // 1. Fetch user authentication info
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null
  let talentProfile: any = null
  let existingApplication: any = null

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    userRole = userData?.role || null

    if (userRole === "talent") {
      const { data: talent } = await supabase
        .from("talent_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      talentProfile = talent
    }
  }

  // 2. Fetch casting call details
  const { data: call } = await supabase
    .from("casting_calls")
    .select(`
      *,
      producer_profiles (
        id,
        user_id,
        company_name,
        verified,
        company_type,
        bio
      ),
      categories (
        name,
        slug
      )
    `)
    .eq("id", resolvedParams.id)
    .single()

  if (!call) {
    redirect("/casting")
  }

  // Ownership / Admin Check for non-open calls
  const isOwner = user && call.producer_profiles?.user_id === user.id
  const isAdmin = userRole && ["super_admin", "studio_admin", "studio_staff"].includes(userRole)

  if (call.status !== "open" && !isOwner && !isAdmin) {
    redirect("/casting")
  }

  // 3. Fetch active application if user is talent
  if (talentProfile) {
    const { data: app } = await supabase
      .from("applications")
      .select("id, status, applied_at")
      .eq("casting_call_id", call.id)
      .eq("talent_id", talentProfile.id)
      .neq("status", "withdrawn")
      .maybeSingle()

    existingApplication = app
  }

  // 4. Time remaining math
  const deadlineDate = call.application_deadline ? new Date(call.application_deadline) : null
  const now = new Date()
  const daysLeft = deadlineDate
    ? Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24)))
    : null

  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft > 0

  const reqJson = (call.requirements_json as any) || {}
  const skillsList: string[] = reqJson.skills || []
  const langsList: string[] = reqJson.languages || []

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          {/* Back button */}
          <div>
            <Link
              href="/casting"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all casting calls
            </Link>
          </div>

          {/* Banner for draft / closed calls */}
          {call.status !== "open" && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl">
              <Shield className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold capitalize">Casting status: {call.status}</p>
                <p className="mt-0.5 opacity-85">
                  This casting call is not public. You are viewing it as an administrator or the owner.
                </p>
              </div>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Info */}
              <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">
                    {call.categories?.name || "Talent Category"}
                  </span>
                  {isUrgent && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 uppercase tracking-wider animate-pulse">
                      Urgent • Closing Soon
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                  {call.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/20 mt-4">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    {call.producer_profiles?.company_name}
                    {call.producer_profiles?.verified && (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" /> {call.location || "Pakistan"}
                  </span>
                  <span>•</span>
                  <span>Posted {new Date(call.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description Body */}
              <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-500/5 space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                  <Briefcase className="h-5 w-5 text-brand-500" /> Role & Project Description
                </h3>
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
                  {call.description}
                </div>
              </div>
            </div>

            {/* Right Column: Requirements & Apply panel */}
            <div className="space-y-6">
              {/* Apply / CTA Panel */}
              <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 rounded-3xl shadow-xl shadow-brand-500/5 space-y-4">
                <h3 className="text-base font-bold text-foreground">Apply for this role</h3>
                
                {deadlineDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/40 p-3 rounded-xl border border-border/30">
                    <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Application Deadline</p>
                      <p className="text-[10px] mt-0.5">
                        {deadlineDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <CastingApplyButton
                  castingCallId={call.id}
                  castingCallTitle={call.title}
                  initialApp={
                    existingApplication
                      ? {
                          id: existingApplication.id,
                          status: existingApplication.status,
                          applied_at: existingApplication.applied_at,
                        }
                      : null
                  }
                  userRole={userRole}
                />
              </div>

              {/* Requirements Specifications Card */}
              <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 rounded-3xl shadow-xl shadow-brand-500/5 space-y-5">
                <h3 className="text-base font-bold text-foreground border-b border-border/40 pb-2">
                  Role Requirements
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Gender preference */}
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Gender Preferred
                      </span>
                      <p className="text-sm font-semibold capitalize text-foreground mt-0.5">
                        {reqJson.gender || "Any Gender"}
                      </p>
                    </div>
                  </div>

                  {/* Age Preference */}
                  <div className="flex items-start gap-2.5">
                    <Layers className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Age Range
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {reqJson.age_min || 18}–{reqJson.age_max || 60} years old
                      </p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="flex items-start gap-2.5">
                    <Briefcase className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Minimum Experience
                      </span>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {reqJson.experience_min || 0} years
                      </p>
                    </div>
                  </div>

                  {/* Compensation */}
                  <div className="flex items-start gap-2.5">
                    <HeartHandshake className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Compensation
                      </span>
                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                        {call.compensation || "To be discussed"}
                      </p>
                    </div>
                  </div>

                  {/* Languages preferred */}
                  {langsList.length > 0 && (
                    <div className="flex items-start gap-2.5">
                      <Languages className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                          Languages Preferred
                        </span>
                        <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">
                          {langsList.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Skills tags */}
                  {skillsList.length > 0 && (
                    <div className="pt-2 border-t border-border/20">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block mb-2">
                        Key Skills Required
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground font-medium text-[10px] capitalize"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {reqJson.notes && (
                    <div className="pt-3 border-t border-border/20 bg-background/20 p-3 rounded-xl">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">
                        Additional Notes
                      </span>
                      <p className="text-[11px] text-foreground/80 mt-1 leading-relaxed">
                        {reqJson.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
