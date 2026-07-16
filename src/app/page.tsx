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

        {/* Smoke Test: Color Palette Swatches */}
        <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 border-t border-border/20 max-w-4xl">
          <div className="bg-card border border-border/40 rounded-xl p-6 sm:p-8 shadow-sm">
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">
              Scaffold Smoke-Test Swatches
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Use this section to verify that the custom design token color configurations are resolving correctly in the Tailwind compiler.
            </p>

            <div className="space-y-6">
              {/* Brand Swatch */}
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Brand Palette (Fuchsia Accent)
                </h3>
                <div className="grid grid-cols-11 gap-1">
                  <div className="h-10 rounded bg-brand-50" title="brand-50" />
                  <div className="h-10 rounded bg-brand-100" title="brand-100" />
                  <div className="h-10 rounded bg-brand-200" title="brand-200" />
                  <div className="h-10 rounded bg-brand-300" title="brand-300" />
                  <div className="h-10 rounded bg-brand-400" title="brand-400" />
                  <div className="h-10 rounded bg-brand-500" title="brand-500" />
                  <div className="h-10 rounded bg-brand-600" title="brand-600" />
                  <div className="h-10 rounded bg-brand-700" title="brand-700" />
                  <div className="h-10 rounded bg-brand-800" title="brand-800" />
                  <div className="h-10 rounded bg-brand-900" title="brand-900" />
                  <div className="h-10 rounded bg-brand-950" title="brand-950" />
                </div>
              </div>

              {/* Gold Accent Swatch */}
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Gold Accent Palette (Prestige Feel)
                </h3>
                <div className="grid grid-cols-3 gap-2 max-w-xs">
                  <div className="h-10 rounded bg-gold-400 flex items-center justify-center text-[10px] text-black font-semibold">400</div>
                  <div className="h-10 rounded bg-gold-500 flex items-center justify-center text-[10px] text-white font-semibold">500</div>
                  <div className="h-10 rounded bg-gold-600 flex items-center justify-center text-[10px] text-white font-semibold">600</div>
                </div>
              </div>

              {/* Surface Swatch */}
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Surface Neutrals (Dark Mode / Light Mode Bases)
                </h3>
                <div className="grid grid-cols-4 gap-2 max-w-md">
                  <div className="h-10 rounded bg-surface-50 border border-border flex items-center justify-center text-[10px] text-black font-semibold">50</div>
                  <div className="h-10 rounded bg-surface-100 border border-border flex items-center justify-center text-[10px] text-black font-semibold">100</div>
                  <div className="h-10 rounded bg-surface-900 flex items-center justify-center text-[10px] text-white font-semibold">900</div>
                  <div className="h-10 rounded bg-surface-950 flex items-center justify-center text-[10px] text-white font-semibold">950</div>
                </div>
              </div>
            </div>
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
