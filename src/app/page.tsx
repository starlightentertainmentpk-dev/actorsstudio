import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { PageTransition } from "@/components/shared/PageTransition"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import {
  ArrowRight,
  Star,
  Shield,
  Award,
  Sparkles,
  Film,
  Mic,
  Radio,
  Music,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronRight,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <PageTransition>
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-border/50 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(37,99,235,0.18),transparent)]">
          <div className="max-w-4xl text-center space-y-6 relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Pakistan&apos;s Premier Talent Marketplace</span>
            </div>

            {/* Display Heading */}
            <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Where Pakistani Talent Meets{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-cyan bg-clip-text text-transparent">
                The Spotlight
              </span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
              Actor&apos;s Studio connects Pakistan&apos;s actors, models, vocalists, and performers with leading directors, production houses, and international agencies with 1-click ATS screening and verified digital comp cards.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto font-bold text-sm shadow-md shadow-brand-500/20"
                >
                  Join as Performer <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/casting" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto font-semibold text-sm"
                >
                  Explore Casting Calls
                </Button>
              </Link>
            </div>

            {/* Trust Metrics Pill */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Verified Studio Portfolios</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Standardized Comp Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Direct Director Auditions</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Connected SaaS Pipeline */}
        <section id="how-it-works" className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <Badge variant="default" size="sm" className="uppercase tracking-widest text-[10px] font-bold">
              Workflow
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              A Streamlined Casting Workflow
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Designed from the ground up for artists seeking opportunities and production houses discovering top tier talent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative group rounded-2xl border border-border/50 bg-card/60 p-7 backdrop-blur-xs transition-all duration-300 hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
                  STEP 01
                </span>
                <Badge variant="secondary" size="sm">Artist</Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading tracking-tight mb-2.5">
                Build Digital Portfolio
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Upload verified headshots, video reels, voice demos, and measurements. Generate print-ready PDF Comp Cards and 1-page dossiers with one click.
              </p>
              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                <span>Free Digital Dossier</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group rounded-2xl border border-border/50 bg-card/60 p-7 backdrop-blur-xs transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  STEP 02
                </span>
                <Badge variant="purple" size="sm">Casting</Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading tracking-tight mb-2.5">
                Discover &amp; 1-Click Apply
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Explore real-time verified casting calls across TV commercials, dramas, films, and theatre. Filter by discipline, location, and compensation.
              </p>
              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                <span>Instant Director Notification</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group rounded-2xl border border-border/50 bg-card/60 p-7 backdrop-blur-xs transition-all duration-300 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                  STEP 03
                </span>
                <Badge variant="cyan" size="sm">Production</Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading tracking-tight mb-2.5">
                Screen, Audition &amp; Book
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Directors screen applicants in an ATS Kanban workspace, schedule in-person or video auditions, and finalize bookings securely.
              </p>
              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                <span>Verified Contracts &amp; Bookings</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Link href="/about">
              <Button variant="outline" size="sm" className="font-semibold text-xs gap-1.5 border-border/70 hover:bg-card">
                Explore Full Platform Guide <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Disciplines Section with Modern SaaS Pill Cards */}
        <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-border/50 max-w-7xl">
          <div className="text-center space-y-2 mb-12">
            <Badge variant="secondary" size="sm" className="uppercase tracking-widest text-[10px] font-bold">
              Creative Disciplines
            </Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Cast Across Every Creative Medium
            </h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Browse pre-screened talent categorized and vetted for leading television, cinema, and digital productions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Actors", slug: "actor", icon: Film, sub: "Dramas, Films & Ads" },
              { label: "Models", slug: "model", icon: Sparkles, sub: "Fashion & Runway" },
              { label: "Singers", slug: "singer", icon: Mic, sub: "Vocalists & Bands" },
              { label: "Voice Artists", slug: "voice-artist", icon: Radio, sub: "Dubbing & Radio" },
              { label: "Dancers", slug: "dancer", icon: Music, sub: "Classical & Western" },
              { label: "Child Artists", slug: "child-artist", icon: Star, sub: "Young Talents" },
            ].map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.label}
                  href={`/casting?category=${cat.slug}`}
                  className="group block"
                >
                  <div className="p-4 rounded-xl border border-border/50 bg-card/50 text-center space-y-2.5 transition-all duration-200 group-hover:border-brand-500/40 group-hover:bg-card group-hover:shadow-md group-hover:-translate-y-0.5 h-full flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all duration-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {cat.label}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cat.sub}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Studio Trust Matrix */}
        <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-border/50 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Award className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-heading">Verified Portfolios</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pre-screened composite cards, media reels, and talent profiles verified by industry-leading studio reviewers.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-heading">Secure Bookings</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standardized contracts, transparent casting briefs, direct audition schedules, and reliable communications.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Star className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-heading">Production Grade</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Built specifically for Pakistan&apos;s leading production houses, advertising agencies, and independent filmmakers.
              </p>
            </div>
          </div>
        </section>
      </PageTransition>

      <Footer />
    </div>
  )
}
