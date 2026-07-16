import { searchTalent } from "@/lib/talent-search"
import { parseSearchParams } from "@/lib/utils/search-params"
import { getCategoryTree } from "@/lib/categories-server"
import { TalentSearchClientLayout } from "@/components/features/talent/TalentSearchClientLayout"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Talent Directory | Actor's Studio Pakistan",
  description: "Browse and discover Pakistan's premier actors, models, dancers, and voice artists for your next production.",
}

export default async function TalentListingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const params = parseSearchParams(resolvedSearchParams)

  // Fetch search results and categories tree in parallel
  const [{ talent, total, page, per_page }, categories] = await Promise.all([
    searchTalent(params),
    getCategoryTree()
  ])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 space-y-10">
          
          {/* Header */}
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground tracking-tight">
              Talent Directory
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Explore and book vetted actors, models, voice actors, and presenters in Pakistan. Use profiles to review experience, portfolios, and print digital comp cards.
            </p>
          </div>

          {/* Unified search & filtering client layout */}
          <TalentSearchClientLayout
            talent={talent}
            total={total}
            page={page}
            perPage={per_page}
            defaultValues={params}
            categories={categories}
            mode="public"
          />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
