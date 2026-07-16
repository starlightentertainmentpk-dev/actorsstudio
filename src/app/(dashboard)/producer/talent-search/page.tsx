import { searchTalent } from "@/lib/talent-search"
import { parseSearchParams } from "@/lib/utils/search-params"
import { getCategoryTree } from "@/lib/categories-server"
import { TalentSearchClientLayout } from "@/components/features/talent/TalentSearchClientLayout"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/supabase/admin"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Talent Search | Producer Studio",
  description: "Find and contact premier talent in Pakistan for your production.",
}

export default async function ProducerTalentSearchPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const params = parseSearchParams(resolvedSearchParams)

  const supabase = await createClient()

  // 1. Get current user and check producer verification status
  const { data: { user } } = await supabase.auth.getUser()
  
  let isVerified = false
  if (user) {
    const { data: profile } = await supabase
      .from("producer_profiles")
      .select("verified")
      .eq("user_id", user.id)
      .maybeSingle()
    
    isVerified = !!profile?.verified
  }

  // 2. Fetch search results and categories tree in parallel
  const [{ talent, total, page, per_page }, categories] = await Promise.all([
    searchTalent(params),
    getCategoryTree()
  ])

  // 3. Securely fetch contact details only for verified producers using adminClient
  let talentWithContacts = talent
  if (isVerified) {
    const userIds = talent.map((t) => t.user_id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: contactsData } = await adminClient
        .from("users")
        .select("id, email, phone")
        .in("id", userIds)

      if (contactsData) {
        talentWithContacts = talent.map((t) => {
          const contact = contactsData.find((c) => c.id === t.user_id)
          return {
            ...t,
            contactInfo: contact 
              ? { email: contact.email, phone: contact.phone } 
              : undefined
          }
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-foreground tracking-tight">
          Talent Search
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Faceted filter search across all vetted talent profiles. Verified producers have direct access to contact details.
        </p>
      </div>

      {/* Search client layout in producer mode */}
      <TalentSearchClientLayout
        talent={talentWithContacts}
        total={total}
        page={page}
        perPage={per_page}
        defaultValues={params}
        categories={categories}
        mode="producer"
        isVerified={isVerified}
      />
    </div>
  )
}
