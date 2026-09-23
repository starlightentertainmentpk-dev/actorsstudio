import Link from "next/link"
import { Sparkles, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-heading text-lg font-bold text-foreground">
                Actor&apos;s Studio
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pakistan&apos;s premier production-grade talent marketplace connecting actors, models, voiceover artists, and performers with top production houses.
            </p>
          </div>

          {/* Quick Links 1 */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/talent" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Browse Talent
                </Link>
              </li>
              <li>
                <Link href="/casting" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Casting Calls
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Get Started
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/register?role=talent" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Join as Performer
                </Link>
              </li>
              <li>
                <Link href="/register?role=producer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Post Casting Calls
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Sign In to Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Ecosystem */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Ecosystem
            </h4>
            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
              Empowering artists across film, television, theatre, and commercial campaigns.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 mt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Karachi • Lahore • Islamabad</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            © {new Date().getFullYear()} Actor&apos;s Studio. Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for Pakistan&apos;s Creative Community.
          </p>
          <div className="flex gap-5 font-medium">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
