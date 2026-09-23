"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles, ArrowRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { label: "Browse Talent", href: "/talent" },
    { label: "Casting Calls", href: "/casting" },
    { label: "How It Works", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:shadow-brand-500/25 transition-all">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Actor&apos;s Studio
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              variant="default"
              className="font-bold text-xs shadow-xs"
            >
              Join Studio <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle & Theme */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground hover:bg-muted"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-border/60 bg-background/95 backdrop-blur-xl px-5 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5 font-medium">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                </Link>
              )
            })}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="outline" className="w-full justify-center text-xs font-semibold h-9">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
              <Button className="w-full justify-center text-xs font-bold h-9 shadow-xs">
                Join Studio <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
