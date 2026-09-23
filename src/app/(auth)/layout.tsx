import Link from "next/link"
import { Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden selection:bg-brand-500/20 selection:text-brand-600">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Decorative Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-b from-brand-500/10 via-purple-500/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/5 blur-3xl rounded-full" />

      <div className="w-full max-w-md relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group mb-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
          >
            <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">
              Actor&apos;s Studio
            </span>
          </Link>
          <p className="text-muted-foreground text-xs">
            Pakistan&apos;s premier creative talent &amp; casting marketplace
          </p>
        </div>

        {/* Auth Content Card */}
        <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-7 shadow-xs">
          {children}
        </div>

        {/* Subtle footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
