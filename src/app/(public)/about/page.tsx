import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  Tv,
  Users,
  Calendar,
  Film,
  Mic,
  Radio,
  Music,
  Clapperboard,
  CheckCircle2,
  FileCheck,
  Search,
  Building2,
} from "lucide-react"

export const metadata = {
  title: "How It Works | Actor's Studio Pakistan",
  description:
    "Learn how Actor's Studio connects Pakistani actors, models, singers, and performers with leading directors, producers, and casting agencies.",
}

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28 border-b border-border/50 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.18),transparent)]">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-600 dark:text-brand-400 text-xs font-bold shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Complete Platform Guide
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              How Actor&apos;s Studio Works
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed font-normal">
              Pakistan&apos;s digital casting ecosystem connecting performers with verified directors, producers, and creative agencies.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link href="/register">
                <Button size="lg" variant="default" className="font-bold px-6 shadow-sm">
                  Join as Performer <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/casting">
                <Button size="lg" variant="outline" className="font-semibold px-6">
                  Browse Casting Calls
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1: For Talent */}
        <section className="py-20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="default" size="sm" className="uppercase tracking-widest text-[10px]">
                For Performers
              </Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Your Path from Audition to Spotlight
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build an industry-standard portfolio, browse verified casting opportunities, and apply directly to directors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <Card hover className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm font-heading ring-4 ring-brand-500/5">
                  01
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading">Create Digital Dossier</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload primary headshots, video reels, and audio clips. Add physical specs, social profiles, and generate 1-click formatted PDF Comp Cards.
                </p>
              </Card>

              {/* Step 2 */}
              <Card hover className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-sm font-heading ring-4 ring-purple-500/5">
                  02
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading">Discover Open Castings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filter jobs by category (acting, modeling, singing, voiceover, dancing), location (Karachi, Lahore, Islamabad), compensation, and age criteria.
                </p>
              </Card>

              {/* Step 3 */}
              <Card hover className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-sm font-heading ring-4 ring-cyan-500/5">
                  03
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading">1-Click Apply</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submit tailored pitch notes and demo reels directly to production houses. Track real-time status updates right inside your talent dashboard.
                </p>
              </Card>

              {/* Step 4 */}
              <Card hover className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm font-heading ring-4 ring-emerald-500/5">
                  04
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading">Audition &amp; Get Booked</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive interview calls, venue schedules, live video links, or self-tape briefs. Secure verified roles and sign contracts with confidence.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 2: For Directors & Producers */}
        <section className="py-20 bg-muted/20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" size="sm" className="uppercase tracking-widest text-[10px]">
                For Hirers &amp; Agencies
              </Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                ATS-Grade Screening &amp; Casting Workspace
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A streamlined workflow designed specifically for directors, producers, casting directors, and creative agencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card hover className="p-8 space-y-4">
                <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 w-fit rounded-xl">
                  <Tv className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground font-heading">1. Post Targeted Job Listings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Publish casting calls for TV serials, commercials (TVC), films, runways, and voiceovers. Specify age brackets, language requirements, shoot dates, and compensation.
                </p>
              </Card>

              <Card hover className="p-8 space-y-4">
                <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground font-heading">2. Screen Applicants via Pipeline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use the ATS Kanban board or high-volume table to organize candidates across 6 clear stages: <strong>New</strong>, <strong>Shortlisted</strong>, <strong>Deferred</strong>, <strong>Interview</strong>, <strong>Hired</strong>, and <strong>Rejected</strong>.
                </p>
              </Card>

              <Card hover className="p-8 space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground font-heading">3. Schedule Auditions &amp; Hire</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Schedule in-person studio calls, video meetings, or self-tape submissions with automatic notifications. Add internal ratings and private recruiter notes.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Disciplines Supported */}
        <section className="py-20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="default" size="sm" className="uppercase tracking-widest text-[10px]">
                Talent Pool
              </Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                All Creative Disciplines in One Hub
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Discover specialized artists across every branch of Pakistan&apos;s entertainment and advertising industry.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: Film, title: "Actors", desc: "TV, Film, Theatre" },
                { icon: Sparkles, title: "Models", desc: "Fashion, Commercial" },
                { icon: Mic, title: "Singers", desc: "Vocalists & Musicians" },
                { icon: Radio, title: "Voice Artists", desc: "Dubbing & Podcasts" },
                { icon: Music, title: "Dancers", desc: "Choreography & Dance" },
                { icon: Clapperboard, title: "Crew & Other", desc: "Creative Specialists" },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.title} hover className="p-5 text-center space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground font-heading">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section className="py-20 bg-gradient-to-br from-brand-600 via-indigo-600 to-brand-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to Step Into the Spotlight?
            </h2>
            <p className="text-sm md:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
              Join hundreds of Pakistani actors, models, vocalists, and filmmakers already collaborating on Actor&apos;s Studio.
            </p>
            <div className="flex flex-wrap justify-center gap-3.5 pt-2">
              <Link href="/register?role=talent">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90 font-bold shadow-lg px-7">
                  Register as Performer (Free)
                </Button>
              </Link>
              <Link href="/register?role=producer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-7">
                  Register as Production House
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
