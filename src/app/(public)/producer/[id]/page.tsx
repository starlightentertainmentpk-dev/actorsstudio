import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { VerifiedBadge } from "@/components/features/producer/VerifiedBadge"
import type { Database } from "@/types/database"
import Link from "next/link"
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowRight,
} from "lucide-react"

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

type Props = {
  params: Promise<{ id: string }>
}

function sanitizeEnv(val?: string): string {
  return (val || "").replace(/[^\x20-\x7E]/g, "").trim()
}

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Fetch Helper to avoid code duplication
async function getProducerDetails(id: string) {
  // First query by profile ID
  let { data: profile } = await supabase
    .from("producer_profiles")
    .select("*")
    .eq("id", id)
    .eq("verified", true)
    .maybeSingle()

  // Fallback: query by user_id
  if (!profile) {
    const { data: fallbackProfile } = await supabase
      .from("producer_profiles")
      .select("*")
      .eq("user_id", id)
      .eq("verified", true)
      .maybeSingle()
    profile = fallbackProfile
  }

  if (!profile) return null

  // Fetch open casting calls
  const { data: castingCalls } = await supabase
    .from("casting_calls")
    .select("id, title, description, location, compensation, application_deadline, shoot_date")
    .eq("producer_id", profile.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  return {
    profile,
    castingCalls: castingCalls || [],
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const details = await getProducerDetails(id)

  if (!details) {
    return {
      title: "Producer Profile Not Found | Actor's Studio",
    }
  }

  const { profile } = details
  const description = profile.bio?.slice(0, 160) || `${profile.company_name} — Verified Producer on Actor's Studio`

  return {
    title: `${profile.company_name} | Actor's Studio`,
    description,
    openGraph: {
      title: `${profile.company_name} | Actor's Studio`,
      description,
      type: "profile",
      url: `https://actorsstudio.pk/producer/${profile.id}`,
      siteName: "Actor's Studio",
    },
    twitter: {
      card: "summary",
      title: `${profile.company_name} | Actor's Studio`,
      description,
    },
  }
}

export default async function ProducerPublicProfilePage({ params }: Props) {
  const { id } = await params
  const details = await getProducerDetails(id)

  if (!details) {
    notFound()
  }

  const { profile, castingCalls } = details

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header Card */}
          <div className="bg-card/25 border border-border/40 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {profile.company_name}
                  </h1>
                  <VerifiedBadge verified={profile.verified} />
                </div>
                <p className="text-muted-foreground text-sm mt-1 capitalize">
                  {profile.company_type?.replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Social & Contact Links */}
            <div className="flex items-center gap-2.5">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 border border-border/60 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Website"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 border border-border/60 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 border border-border/60 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="LinkedIn"
                >
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* About / Bio Panel */}
            <div className="md:col-span-1 bg-card/25 border border-border/40 p-6 rounded-3xl backdrop-blur-md h-fit space-y-4">
              <h2 className="text-lg font-bold text-foreground pb-2 border-b border-border/40">
                About Company
              </h2>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {profile.bio || "No description provided."}
              </p>
            </div>

            {/* Active Casting Calls Panel */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5.5 w-5.5 text-brand-500" /> Active Casting Calls
                </h2>
                <span className="text-xs bg-brand-500/10 text-brand-500 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                  {castingCalls.length} Open
                </span>
              </div>

              {castingCalls.length === 0 ? (
                <div className="bg-card/10 border border-border/30 rounded-3xl p-12 text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No active casting calls</p>
                  <p className="text-xs mt-0.5">
                    This producer is not currently hosting any casting opportunities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {castingCalls.map((call) => {
                    const deadline = call.application_deadline
                      ? new Date(call.application_deadline).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No deadline"

                    return (
                      <div
                        key={call.id}
                        className="bg-card/15 border border-border/40 rounded-2xl p-5 hover:border-brand-500/40 transition-colors flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-brand-500 transition-colors">
                              {call.title}
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md shrink-0">
                              Deadline: {deadline}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {call.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            {call.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {call.location}
                              </span>
                            )}
                            {call.compensation && (
                              <span className="flex items-center gap-1 text-brand-500 font-medium">
                                <DollarSign className="h-3.5 w-3.5 text-brand-500" /> {call.compensation}
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/casting/${call.id}`}
                            className="text-xs font-semibold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1"
                          >
                            View Details <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
