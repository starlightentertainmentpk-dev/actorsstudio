import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <span className="font-heading text-lg font-bold text-foreground">
              Actor&apos;s Studio<span className="text-gold-500">.</span>
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering the next generation of Pakistani talent. We connect models, actors, musicians, and performers with top production houses.
            </p>
          </div>

          {/* Quick Links 1 */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/talent" className="hover:text-brand-500 transition-colors">Browse Talent</Link>
              </li>
              <li>
                <Link href="/casting" className="hover:text-brand-500 transition-colors">Casting Calls</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand-500 transition-colors">Membership</Link>
              </li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-brand-500 transition-colors">Industry News</Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-brand-500 transition-colors">Talent Guides</Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-brand-500 transition-colors">Help & FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Ecosystem */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Ecosystem</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Proudly crafted for the Pakistani creative ecosystem.
            </p>
            <p className="text-xs text-muted-foreground">
              Karachi • Lahore • Islamabad
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Actor&apos;s Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-brand-500 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-brand-500 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
