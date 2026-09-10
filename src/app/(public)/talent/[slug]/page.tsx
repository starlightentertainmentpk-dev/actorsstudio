import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import TalentPortfolioView from "@/components/features/talent/TalentPortfolioView"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import type { Database } from "@/types/database"

// Incremental Static Regeneration (ISR) configuration
export const revalidate = 3600 // Revalidate cache every hour

type Props = {
  params: Promise<{ slug: string }>
}

function sanitizeEnv(val?: string): string {
  return (val || "").replace(/[^\x20-\x7E]/g, "").trim()
}

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co"
const supabaseAnonKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "placeholder"
const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Generate static paths for up to 1000 approved talents for high-speed initial loading
export async function generateStaticParams() {
  const { data } = await supabase
    .from("talent_profiles")
    .select("slug")
    .eq("verification_status", "approved")
    .not("slug", "is", null)
    .limit(1000)

  return (data ?? []).map((t) => ({
    slug: t.slug as string,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("full_name, stage_name, bio, city, slug, user_id")
    .eq("slug", slug)
    .eq("verification_status", "approved")
    .single()

  if (!talent) {
    return {
      title: "Talent Profile Not Found | Actor's Studio",
    }
  }

  // Fetch primary photo url
  const { data: primaryPhotoAsset } = await supabase
    .from("media_assets")
    .select("url")
    .eq("owner_id", talent.user_id)
    .eq("type", "photo")
    .eq("is_primary", true)
    .maybeSingle()

  const displayName = talent.stage_name || talent.full_name
  const description = talent.bio?.slice(0, 160) ?? `${displayName} — Talent Profile on Actor's Studio Pakistan`
  const primaryPhotoUrl = primaryPhotoAsset?.url

  return {
    title: `${displayName} | Actor's Studio`,
    description,
    openGraph: {
      title: `${displayName} | Actor's Studio`,
      description,
      images: primaryPhotoUrl ? [{ url: primaryPhotoUrl, width: 1200, height: 630 }] : [],
      type: "profile",
      url: `https://actorsstudio.pk/talent/${talent.slug}`,
      siteName: "Actor's Studio",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | Actor's Studio`,
      description,
      images: primaryPhotoUrl ? [primaryPhotoUrl] : [],
    },
    alternates: {
      canonical: `https://actorsstudio.pk/talent/${talent.slug}`,
    },
  }
}

export default async function TalentPortfolioPage({ params }: Props) {
  const { slug } = await params

  // 1. Fetch talent profile
  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("verification_status", "approved")
    .single()

  if (!talent) {
    notFound()
  }

  // 2. Fetch category and sub-category names
  let categoryName = ""
  let subCategoryName = ""
  const categoryIds = [talent.category_id, talent.sub_category_id].filter(Boolean) as string[]
  
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds)
    
    categoryName = categories?.find((c) => c.id === talent.category_id)?.name || ""
    subCategoryName = categories?.find((c) => c.id === talent.sub_category_id)?.name || ""
  }

  // 3. Fetch media assets
  const { data: mediaAssets } = await supabase
    .from("media_assets")
    .select("*")
    .eq("owner_id", talent.user_id)
    .order("sort_order", { ascending: true })

  const talentWithDetails = {
    ...talent,
    category_name: categoryName,
    sub_category_name: subCategoryName,
    media_assets: mediaAssets || [],
  }

  const primaryPhoto = mediaAssets?.find((m: any) => m.is_primary && m.type === "photo")?.url

  // JSON-LD Structured Data for search engine scrapers
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: talent.stage_name || talent.full_name,
    jobTitle: categoryName || "Talent",
    address: {
      "@type": "PostalAddress",
      addressLocality: talent.city,
      addressCountry: "PK",
    },
    image: primaryPhoto,
    url: `https://actorsstudio.pk/talent/${talent.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Public layout navbar & footer around the portfolio view */}
      <Navbar />
      <main className="flex-1 bg-background">
        <TalentPortfolioView talent={talentWithDetails} />
      </main>
      <Footer />
    </>
  )
}
