"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { askAIAssistantAction } from "@/app/actions/ai"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  Sparkles,
  Command,
  ArrowRight,
  Users,
  Building2,
  Tv,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Settings,
  Loader2,
  X,
  CornerDownLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

interface NavItem {
  id: string
  title: string
  category: "Navigation" | "Quick Action" | "AI Query"
  href?: string
  icon: any
  action?: () => void
  keywords?: string[]
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "nav-talent",
    title: "Talent Roster & Profiles",
    category: "Navigation",
    href: "/agency/talent",
    icon: Users,
    keywords: ["actors", "models", "artists", "roster", "lahore", "karachi"],
  },
  {
    id: "nav-casting",
    title: "Casting Pipelines & Submissions",
    category: "Navigation",
    href: "/agency/casting",
    icon: Tv,
    keywords: ["auditions", "briefs", "roles", "jobs", "submissions"],
  },
  {
    id: "nav-contracts",
    title: "Contracts & E-Signatures",
    category: "Navigation",
    href: "/agency/contracts",
    icon: FileText,
    keywords: ["agreements", "signatures", "legal", "releases", "documents"],
  },
  {
    id: "nav-finance",
    title: "Finance, Invoicing & Commissions",
    category: "Navigation",
    href: "/agency/finance",
    icon: DollarSign,
    keywords: ["invoices", "payments", "money", "overdue", "payouts"],
  },
  {
    id: "nav-clients",
    title: "Client CRM & Accounts",
    category: "Navigation",
    href: "/agency/clients",
    icon: Building2,
    keywords: ["brands", "producers", "directors", "production houses"],
  },
  {
    id: "nav-calendar",
    title: "Agency Calendar & Talent Availability",
    category: "Navigation",
    href: "/agency/calendar",
    icon: Calendar,
    keywords: ["schedule", "shoots", "holds", "bookings", "conflicts"],
  },
  {
    id: "nav-deals",
    title: "Deals & Booking Pipeline",
    category: "Navigation",
    href: "/agency/deals",
    icon: Layers,
    keywords: ["bookings", "offers", "pipeline", "commercials"],
  },
]

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [aiResponse, setAiResponse] = useState<{
    answer: string
    actionLink?: { label: string; href: string }
    dataItems?: Array<{ title: string; subtitle?: string; badge?: string; href?: string }>
  } | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K or Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setAiResponse(null)
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Custom event listener so other UI buttons (like topbar search) can trigger it
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true)
    window.addEventListener("open-command-palette", handleOpenEvent)
    return () => window.removeEventListener("open-command-palette", handleOpenEvent)
  }, [])

  const filteredNavItems = query.trim()
    ? DEFAULT_NAV_ITEMS.filter((item) => {
        const q = query.toLowerCase()
        return (
          item.title.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q))
        )
      })
    : DEFAULT_NAV_ITEMS

  const handleAskAI = async (askText?: string) => {
    const textToQuery = askText || query
    if (!textToQuery.trim()) return

    setIsAskingAI(true)
    setAiResponse(null)
    try {
      const res = await askAIAssistantAction(textToQuery)
      if (res.success) {
        setAiResponse({
          answer: res.answer,
          actionLink: res.actionLink,
          dataItems: res.dataItems,
        })
      }
    } catch {
      setAiResponse({
        answer: "Unable to query agency database right now. Please try again.",
      })
    } finally {
      setIsAskingAI(false)
    }
  }

  const handleSelectNav = (item: NavItem) => {
    setIsOpen(false)
    if (item.href) {
      router.push(item.href)
    } else if (item.action) {
      item.action()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-100">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/60 bg-muted/20 gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (filteredNavItems.length > 0 && selectedIndex < filteredNavItems.length && !query.includes("?")) {
                  handleSelectNav(filteredNavItems[selectedIndex])
                } else {
                  handleAskAI()
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex((prev) => Math.min(filteredNavItems.length - 1, prev + 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex((prev) => Math.max(0, prev - 1))
              }
            }}
            placeholder="Search agency commands or ask AI copilot... (e.g. 'overdue invoices', 'contracts', 'Lahore talent')"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-hidden"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("")
                setAiResponse(null)
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              disabled={isAskingAI || !query.trim()}
              onClick={() => handleAskAI()}
              className="text-xs h-7 px-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1 shadow-xs"
            >
              {isAskingAI ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Ask AI
            </Button>
            <kbd className="hidden sm:inline-block text-[10px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded-md border border-border/70 font-mono">
              ESC
            </kbd>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* AI Response Card (if available or loading) */}
          {(isAskingAI || aiResponse) && (
            <div className="p-4 rounded-xl border border-brand-500/30 bg-gradient-to-br from-card via-card to-brand-500/5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  <span>Actors Studio Copilot</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-brand-500/10 text-brand-400 border-brand-500/30"
                >
                  RLS Protected
                </Badge>
              </div>

              {isAskingAI ? (
                <div className="py-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Synthesizing agency intelligence...</span>
                </div>
              ) : aiResponse ? (
                <div className="space-y-3">
                  <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                    {aiResponse.answer}
                  </div>

                  {/* Related Data Records */}
                  {aiResponse.dataItems && aiResponse.dataItems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                        Direct Records:
                      </span>
                      {aiResponse.dataItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (item.href) {
                              setIsOpen(false)
                              router.push(item.href)
                            }
                          }}
                          className="p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-semibold text-foreground block">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-[11px] text-muted-foreground block">{item.subtitle}</span>
                            )}
                          </div>
                          {item.badge && (
                            <Badge variant="outline" className="text-[10px] bg-accent/60">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Link */}
                  {aiResponse.actionLink && (
                    <div className="pt-1 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsOpen(false)
                          if (aiResponse.actionLink?.href) {
                            router.push(aiResponse.actionLink.href)
                          }
                        }}
                        className="text-xs h-7 gap-1 bg-brand-600 hover:bg-brand-500 text-white"
                      >
                        {aiResponse.actionLink.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Quick AI Suggestion Chips when query is empty */}
          {!query && !aiResponse && !isAskingAI && (
            <div className="px-2 pt-1 pb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Ask AI Assistant (Quick Queries)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Which invoices are overdue?",
                  "Show female models in Lahore",
                  "Active contracts pending signatures",
                  "Show casting calls needing submissions",
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(prompt)
                      handleAskAI(prompt)
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-accent/40 hover:bg-accent border border-border/50 text-foreground/80 hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-brand-400" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items List */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 block">
              Commands & Modules
            </span>

            {filteredNavItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No matching navigation command. Press &ldquo;Ask AI&rdquo; or Enter to query your database.
              </div>
            ) : (
              filteredNavItems.map((item, idx) => {
                const IconComponent = item.icon
                const isSelected = idx === selectedIndex

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-brand-500/10 border border-brand-500/30 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-brand-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-foreground">{item.title}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.category}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded-sm bg-muted border border-border/60 font-mono text-[9px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded-sm bg-muted border border-border/60 font-mono text-[9px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded-sm bg-muted border border-border/60 font-mono text-[9px]">⌘K</kbd>
              Toggle
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>RLS Isolated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
