"use client"

import { useState } from "react"
import { TalentFilterSidebar } from "./TalentFilterSidebar"
import { TalentGrid } from "./TalentGrid"
import { Pagination } from "@/components/shared/Pagination"
import { CategoryNode } from "@/lib/categories"
import { TalentSearchParams, TalentSearchResultItem } from "@/lib/talent-search"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TalentSearchClientLayoutProps {
  talent: TalentSearchResultItem[]
  total: number
  page: number
  perPage: number
  defaultValues: TalentSearchParams
  categories: CategoryNode[]
  mode?: "public" | "producer"
  isVerified?: boolean
}

export function TalentSearchClientLayout({
  talent,
  total,
  page,
  perPage,
  defaultValues,
  categories,
  mode = "public",
  isVerified = false
}: TalentSearchClientLayoutProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Mobile filters button */}
      <div className="flex lg:hidden items-center justify-between bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
        <span className="text-sm font-medium text-muted-foreground">
          Showing {talent.length} of {total} results
        </span>
        <Button
          onClick={() => setIsMobileFiltersOpen(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 font-bold cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <TalentFilterSidebar defaultValues={defaultValues} categories={categories} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          <div className="hidden lg:flex items-center justify-between border-b border-border/30 pb-4">
            <span className="text-sm font-semibold text-muted-foreground">
              We found <strong className="text-foreground">{total}</strong> vetted talent profiles
            </span>
          </div>

          <TalentGrid 
            talent={talent} 
            mode={mode} 
            isVerified={isVerified} 
          />

          <Pagination total={total} page={page} perPage={perPage} />
        </main>
      </div>

      {/* Mobile Filters Drawer Overlay */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsMobileFiltersOpen(false)} />
          
          <div className="relative w-full max-w-md bg-card border-l border-border/80 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card sticky top-0 z-10">
              <span className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand-500" /> Filters
              </span>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
              <TalentFilterSidebar 
                defaultValues={defaultValues} 
                categories={categories} 
                onCloseMobile={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
