"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight text-foreground transition-colors hover:text-brand-500 sm:text-2xl">
            Actor&apos;s Studio<span className="text-gold-500">.</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/talent" className="text-muted-foreground hover:text-brand-500 transition-colors">
            Browse Talent
          </Link>
          <Link href="/casting" className="text-muted-foreground hover:text-brand-500 transition-colors">
            Casting Calls
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-brand-500 transition-colors">
            How it Works
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20 rounded-md px-4 transition-all duration-200">
              Join Studio
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle & Theme */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground hover:bg-muted"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-3 font-medium">
            <Link
              href="/talent"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-muted-foreground hover:text-brand-500 transition-colors border-b border-border/10"
            >
              Browse Talent
            </Link>
            <Link
              href="/casting"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-muted-foreground hover:text-brand-500 transition-colors border-b border-border/10"
            >
              Casting Calls
            </Link>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-muted-foreground hover:text-brand-500 transition-colors border-b border-border/10"
            >
              How it Works
            </Link>
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="w-full">
              <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20">
                Join Studio
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
