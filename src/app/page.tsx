import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { PageTransition } from "@/components/shared/PageTransition"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Star, Shield, Award } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <PageTransition>
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-50/30 to-transparent dark:from-brand-950/10">
          <div className="max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-950 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 text-xs font-semibold">
              <Star className="h-3 w-3 fill-current text-gold-500" />
              Pakistan&apos;s Leading Talent Marketplace
            </div>
            
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Where Pakistani Talent Meets <br />
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-gold-500 bg-clip-text text-transparent">
                The Spotlight
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
              Actor&apos;s Studio is a premium production-grade ecosystem connecting Pakistan&apos;s actors, models, voiceover artists, and performers with leading directors, agencies, and international brands.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/25 transition-all duration-200 rounded-md">
                  Join as Talent <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/casting">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-border hover:bg-muted text-foreground transition-all duration-200 rounded-md">
                  Explore Casting Calls
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-border/20 max-w-6xl">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Simple 3-Step Process</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">
              How Actor&apos;s Studio Works
            </h2>
            <p className="text-sm text-muted-foreground">
              Whether you are an artist seeking your big break or a director casting your next production, we make it effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/40 p-8 rounded-2xl space-y-4 hover:border-brand-500/40 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-foreground">Build Digital Portfolio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your verified headshots, video reels, voice demos, and measurements. Generate print-ready PDF Comp Cards and 1-page dossiers with one click.
              </p>
            </div>

            <div className="bg-card border border-border/40 p-8 rounded-2xl space-y-4 hover:border-brand-500/40 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-foreground">Discover &amp; 1-Click Apply</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore real-time casting calls across TV commercials, dramas, films, and theatre. Filter by discipline, location, and compensation.
              </p>
            </div>

            <div className="bg-card border border-border/40 p-8 rounded-2xl space-y-4 hover:border-brand-500/40 transition-all shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-foreground">Screen, Audition &amp; Book</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Directors screen applicants in an Indeed-style ATS workspace, schedule in-person or video auditions, and finalize bookings securely.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <Link href="/about">
              <Button variant="outline" className="border-border hover:bg-muted font-semibold text-xs rounded-xl px-6 cursor-pointer">
                Explore Full Platform Guide &amp; Details <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Disciplines Section */}
        <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 border-t border-border/20 max-w-6xl">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Explore by Talent Category</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Cast Across Every Creative Discipline
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Actors", slug: "actor", icon: "🎭", sub: "Dramas, Films & Ads" },
              { label: "Models", slug: "model", icon: "✨", sub: "Fashion & Runway" },
              { label: "Singers", slug: "singer", icon: "🎤", sub: "Vocalists & Bands" },
              { label: "Voice Artists", slug: "voice-artist", icon: "🎙️", sub: "Dubbing & Radio" },
              { label: "Dancers", slug: "dancer", icon: "💃", sub: "Performers & Classical" },
              { label: "Child Artists", slug: "child-artist", icon: "⭐", sub: "Young Talents" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/casting?category=${cat.slug}`}
                className="bg-card border border-border/40 p-4 rounded-2xl text-center space-y-1.5 hover:border-brand-500/40 transition-all hover:shadow-md group cursor-pointer"
              >
                <span className="text-3xl block group-hover:scale-110 transition-transform">{cat.icon}</span>
                <h4 className="font-bold text-xs text-foreground group-hover:text-brand-500 transition-colors">{cat.label}</h4>
                <p className="text-[10px] text-muted-foreground">{cat.sub}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Feature Stubs */}
        <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/40 p-6 rounded-lg space-y-3">
              <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Verified Portfolios</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pre-screened composite cards, media reels, and talent profiles verified by industry-leading studio reviewers.
              </p>
            </div>

            <div className="bg-card border border-border/40 p-6 rounded-lg space-y-3">
              <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Secure Bookings</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tier-1 contracts, standard agency commissions, escrow-enabled transactions, and integrated payout tools.
              </p>
            </div>

            <div className="bg-card border border-border/40 p-6 rounded-lg space-y-3">
              <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Premium Casting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct casting pipelines for television, cinema, commercials, voice-acting, and fashion campaigns.
              </p>
            </div>
          </div>
        </section>
      </PageTransition>

      <Footer />
    </div>
  )
}
