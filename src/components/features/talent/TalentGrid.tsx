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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col h-full bg-card border border-border/40 rounded-2xl overflow-hidden animate-pulse">
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
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card border border-border/40 rounded-3xl shadow-sm">
        <div className="p-4 bg-brand-500/10 rounded-full text-brand-500">
          <Users className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">No Talent Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm px-4">
            We couldn't find any approved talent matching your current filter selections. Try clearing some filters.
          </p>
        </div>
        <Link href={mode === "producer" ? "/producer/talent-search" : "/talent"}>
          <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-brand-500 border border-brand-500/20 hover:bg-brand-500/5 rounded-xl transition-all cursor-pointer">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
