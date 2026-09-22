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
    <div className="bg-card/45 backdrop-blur-md border border-border/40 p-5 rounded-2xl shadow-xl shadow-brand-500/5 space-y-5">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-brand-500" /> Filters
        </h3>
        {(location || category || gender || compensation || deadline) && (
          <button
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-brand-500 hover:text-brand-600 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4 text-xs">
        {/* Location Search */}
        <div>
          <label className="block font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Location
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Karachi, Lahore..."
              className="w-full h-9 pl-8 pr-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
          >
            <option value="">All Categories</option>
            {(categories && categories.length > 0
              ? categories
              : [
                  { id: "cat-actor", name: "Actor / Actress", slug: "actor" },
                  { id: "cat-model", name: "Model", slug: "model" },
                  { id: "cat-singer", name: "Singer / Musician", slug: "singer" },
                  { id: "cat-voice", name: "Voice Artist", slug: "voice-artist" },
                  { id: "cat-dancer", name: "Dancer", slug: "dancer" },
                ]
            ).map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Preference */}
        <div>
          <label className="block font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Gender Preference
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
          >
            <option value="">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="any">Shared / Any</option>
          </select>
        </div>

        {/* Compensation Type */}
        <div>
          <label className="block font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Compensation Type
          </label>
          <select
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
          >
            <option value="">Any Compensation</option>
            <option value="paid">Paid Roles</option>
            <option value="contra">Contra / Volunteer</option>
          </select>
        </div>

        {/* Deadline */}
        <div>
          <label className="block font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Application Deadline
          </label>
          <select
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-9 px-2 rounded-lg border border-input bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all text-xs"
          >
            <option value="">All Deadlines</option>
            <option value="today">Closing Today</option>
            <option value="week">Closing This Week</option>
            <option value="month">Closing This Month</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleApplyFilters}
        disabled={isPending}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 rounded-lg text-xs transition-all shadow-md shadow-brand-500/10 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Filtering...
          </>
        ) : (
          "Apply Filters"
        )}
      </Button>
    </div>
  )
}
