"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Search, Loader2, MapPin, Filter } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
}

interface CastingFilterSidebarProps {
  categories: Category[]
}

export function CastingFilterSidebar({ categories }: CastingFilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state initialized from searchParams
  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [gender, setGender] = useState(searchParams.get("gender") || "")
  const [compensation, setCompensation] = useState(searchParams.get("compensation") || "")
  const [deadline, setDeadline] = useState(searchParams.get("deadline") || "")

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (location.trim()) params.set("location", location.trim())
    if (category) params.set("category", category)
    if (gender) params.set("gender", gender)
    if (compensation) params.set("compensation", compensation)
    if (deadline) params.set("deadline", deadline)

    startTransition(() => {
      router.push(`/casting?${params.toString()}`)
    })
  }

  const handleClearFilters = () => {
    setLocation("")
    setCategory("")
    setGender("")
    setCompensation("")
    setDeadline("")

    startTransition(() => {
      router.push("/casting")
    })
  }

  return (
    <div className="bg-card border border-border/50 p-5 rounded-xl shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-brand-500" /> Filters
        </h3>
        {(location || category || gender || compensation || deadline) && (
          <button
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-brand-500 hover:text-brand-600 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Location Search */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Location
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-muted-foreground/60 pointer-events-none">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Karachi, Lahore..."
              className="w-full h-8.5 pl-8 pr-2.5 rounded-lg border border-border/70 bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-xs"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-lg border border-border/70 bg-background text-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-xs"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Gender Preference
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-lg border border-border/70 bg-background text-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-xs"
          >
            <option value="">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-Binary / Any</option>
          </select>
        </div>

        {/* Compensation Type */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Compensation
          </label>
          <select
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-lg border border-border/70 bg-background text-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-xs"
          >
            <option value="">All Types</option>
            <option value="paid">Paid Only</option>
            <option value="contra">Contra / Voluntary</option>
          </select>
        </div>

        {/* Application Deadline */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Deadline
          </label>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-8.5 px-2.5 rounded-lg border border-border/70 bg-background text-foreground focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-xs"
          >
            <option value="">Any Deadline</option>
            <option value="today">Closing Today</option>
            <option value="week">Closing This Week</option>
            <option value="month">Closing This Month</option>
          </select>
        </div>

        <Button
          onClick={handleApplyFilters}
          disabled={isPending}
          className="w-full font-semibold text-xs h-8.5 rounded-lg shadow-xs cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              <span>Filtering...</span>
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5 mr-1.5" />
              <span>Apply Filters</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
