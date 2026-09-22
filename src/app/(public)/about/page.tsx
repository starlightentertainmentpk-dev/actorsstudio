import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  User,
  Tv,
  Sparkles,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldCheck,
  Video,
  ArrowRight,
  Briefcase,
  Star,
  Users,
  Search,
  Filter,
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
        <section className="relative overflow-hidden py-16 md:py-24 border-b border-border/30 bg-gradient-to-b from-brand-500/10 via-background to-background">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Complete Platform Guide
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              How Actor&apos;s Studio Works
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
              Pakistan&apos;s digital casting ecosystem connecting actors, models, singers, and voice artists with verified directors, producers, and agencies.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/register">
                <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-7 rounded-xl shadow-lg shadow-brand-500/20 cursor-pointer">
                  Join as Talent <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/casting">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted font-semibold px-7 rounded-xl cursor-pointer">
                  Browse Casting Calls
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1: For Talent */}
        <section className="py-16 md:py-24 border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">For Performers</span>
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
                Your Path from Audition to Spotlight
              </h2>
              <p className="text-sm text-muted-foreground">
                Build an industry-standard portfolio, browse verified casting opportunities, and apply directly to directors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 hover:border-brand-500/30 transition-all shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                  01
                </div>
                <h3 className="text-base font-bold text-foreground">Create Your Portfolio</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload primary headshots, video reels, and audio clips. Add your physical specs, social profiles, and generate 1-click formatted PDF Comp Cards.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 hover:border-brand-500/30 transition-all shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                  02
                </div>
                <h3 className="text-base font-bold text-foreground">Discover Open Castings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filter jobs by category (acting, modeling, singing, voiceover, dancing), location (Karachi, Lahore, Islamabad), compensation, and age criteria.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 hover:border-brand-500/30 transition-all shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                  03
                </div>
                <h3 className="text-base font-bold text-foreground">1-Click Apply</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Submit tailored pitch notes and demo reels directly to production houses. Track real-time status updates right inside your talent dashboard.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 hover:border-brand-500/30 transition-all shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                  04
                </div>
                <h3 className="text-base font-bold text-foreground">Audition & Get Booked</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive interview calls, venue schedules, live video links, or self-tape briefs. Secure verified roles and sign contracts with confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: For Directors & Producers */}
        <section className="py-16 md:py-24 bg-card/40 border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">For Hirers</span>
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
                Indeed-Style Screening & Casting Workspace
              </h2>
              <p className="text-sm text-muted-foreground">
                A streamlined workflow designed specifically for directors, producers, casting directors, and creative agencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border border-border/50 p-7 rounded-2xl space-y-4 shadow-sm">
                <div className="p-3 bg-brand-500/10 text-brand-500 w-fit rounded-xl">
                  <Tv className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">1. Post Targeted Job Listings</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Publish casting calls for TV serials, commercials (TVC), films, runways, and voiceovers. Specify age brackets, language requirements, shoot dates, and compensation.
                </p>
              </div>

              <div className="bg-card border border-border/50 p-7 rounded-2xl space-y-4 shadow-sm">
                <div className="p-3 bg-brand-500/10 text-brand-500 w-fit rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">2. Screen Applicants via Pipeline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use the ATS Kanban board or high-volume table to organize candidates across 6 clear stages: <strong>New</strong>, <strong>Shortlisted</strong>, <strong>Deferred / Maybe</strong>, <strong>Interview</strong>, <strong>Hired</strong>, and <strong>Rejected</strong>.
                </p>
              </div>

              <div className="bg-card border border-border/50 p-7 rounded-2xl space-y-4 shadow-sm">
                <div className="p-3 bg-brand-500/10 text-brand-500 w-fit rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">3. Schedule Auditions & Hire</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Schedule in-person studio calls, video meetings, or self-tape submissions with automatic notifications. Add internal 1–5 star ratings and private recruiter notes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Disciplines Supported */}
        <section className="py-16 md:py-24 border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Talent Pool</span>
              <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
                All Creative Disciplines in One Hub
              </h2>
              <p className="text-sm text-muted-foreground">
                Discover specialized artists across every branch of Pakistan&apos;s entertainment and advertising industry.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: "🎭", title: "Actors", desc: "TV, Film, Theatre" },
                { icon: "✨", title: "Models", desc: "Fashion, Commercial" },
                { icon: "🎤", title: "Singers", desc: "Vocalists & Musicians" },
                { icon: "🎙️", title: "Voice Artists", desc: "Dubbing, Podcasts, Radio" },
                { icon: "💃", title: "Dancers", desc: "Choreography, Classical" },
                { icon: "🎬", title: "Crew & Other", desc: "Creative Specialists" },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-border/40 p-5 rounded-2xl text-center space-y-2 hover:border-brand-500/40 transition-all">
                  <span className="text-3xl">{item.icon}</span>
                  <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold">
              Ready to Step Into the Spotlight?
            </h2>
            <p className="text-sm md:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
              Join hundreds of Pakistani actors, models, singers, and filmmakers already collaborating on Actor&apos;s Studio.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/register?role=talent">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90 font-bold rounded-xl shadow-lg px-8 cursor-pointer">
                  Register as Talent (Free)
                </Button>
              </Link>
              <Link href="/register?role=producer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold rounded-xl px-8 cursor-pointer">
                  Register as Director / Producer
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
