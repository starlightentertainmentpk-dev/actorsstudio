"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  total: number
  page: number
  perPage: number
}

export function Pagination({ total, page, perPage }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / perPage)

  if (totalPages <= 1) return null

  // Generate URL for a specific page number, preserving all other query parameters
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("page", String(pageNumber))
    return `${pathname}?${params.toString()}`
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    
    // Always include first page
    pages.push(1)

    if (page > 3) {
      pages.push("...")
    }

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) {
      pages.push("...")
    }

    // Always include last page
    pages.push(totalPages)

    return pages
  }

  const hasPrev = page > 1
  const hasNext = page < totalPages
  const startRange = (page - 1) * perPage + 1
  const endRange = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-6 mt-8">
      {/* Results description */}
      <span className="text-xs text-muted-foreground">
        Showing <strong className="font-semibold text-foreground">{startRange}–{endRange}</strong> of{" "}
        <strong className="font-semibold text-foreground">{total}</strong> results
      </span>

      {/* Page number buttons */}
      <div className="flex items-center gap-1">
        {/* Previous page */}
        <Link
          href={hasPrev ? createPageUrl(page - 1) : "#"}
          className={!hasPrev ? "pointer-events-none opacity-50" : ""}
          aria-disabled={!hasPrev}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            className="cursor-pointer h-8 px-2 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
        </Link>

        {/* Dynamic page list */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, index) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground select-none"
                >
                  ...
                </span>
              )
            }

            const isCurrent = p === page

            return (
              <Link key={`page-${p}`} href={createPageUrl(p as number)}>
                <Button
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  className={`size-8 p-0 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isCurrent 
                      ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/10" 
                      : "hover:bg-muted"
                  }`}
                >
                  {p}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Next page */}
        <Link
          href={hasNext ? createPageUrl(page + 1) : "#"}
          className={!hasNext ? "pointer-events-none opacity-50" : ""}
          aria-disabled={!hasNext}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            className="cursor-pointer h-8 px-2 rounded-xl"
          >
            <span className="sr-only">Next Page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
