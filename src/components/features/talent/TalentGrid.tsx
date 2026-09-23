"use client"

import { TalentProfileCard } from "./TalentProfileCard"
import { TalentSearchResultItem } from "@/lib/talent-search"
import { Users } from "lucide-react"
import Link from "next/link"

interface TalentGridProps {
  talent: TalentSearchResultItem[]
  mode?: "public" | "producer"
  isVerified?: boolean
  loading?: boolean
}

export function TalentGrid({ talent, mode = "public", isVerified = false, loading = false }: TalentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col h-full bg-card border border-border/50 rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-[3/4] w-full bg-muted" />
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-md w-3/4" />
                <div className="h-3 bg-muted rounded-md w-1/2" />
              </div>
              <div className="pt-3 border-t border-border/40 flex gap-1.5">
                <div className="h-4 bg-muted rounded-md w-10" />
                <div className="h-4 bg-muted rounded-md w-12" />
                <div className="h-4 bg-muted rounded-md w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (talent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-border/50 bg-card/40 backdrop-blur-xs">
        <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3.5 ring-4 ring-brand-500/5">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground font-heading">No Talent Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5 leading-relaxed">
          We couldn&apos;t find any approved talent matching your current filter selections. Try clearing or relaxing your filters.
        </p>
        <Link href={mode === "producer" ? "/producer/talent-search" : "/talent"}>
          <span className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 rounded-lg transition-all cursor-pointer">
            Clear Filters
          </span>
        </Link>
      </div>
    )
  }

  // Map search result item to TalentProfileCard format
  const mappedTalents = talent.map((t) => {
    // Extract category name
    let categoryName = "Talent"
    if (t.categories) {
      if (Array.isArray(t.categories)) {
        categoryName = t.categories[0]?.name || "Talent"
      } else {
        categoryName = t.categories.name || "Talent"
      }
    }

    // Find primary photo url
    const primaryPhotoUrl = t.media_assets?.find(
      (asset) => asset.is_primary && asset.type === "photo"
    )?.url || t.media_assets?.[0]?.url

    return {
      id: t.id,
      full_name: t.full_name,
      stage_name: t.stage_name || undefined,
      slug: t.slug || "",
      primary_photo_url: primaryPhotoUrl,
      category: categoryName,
      city: t.city || undefined,
      experience_years: t.experience_years,
      is_premium: t.is_premium,
      skills: t.skills || [],
      // Extra details for producer mode
      languages: t.languages || [],
      is_available: t.is_available,
    }
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {mappedTalents.map((talentItem) => (
        <TalentProfileCard 
          key={talentItem.id} 
          talent={talentItem} 
          mode={mode} 
          isVerified={isVerified}
        />
      ))}
    </div>
  )
}
