import { createClient } from '@/lib/supabase/server'

export interface BrandConfig {
  name: string
  logoUrl?: string
  brandColor: string
  currency: string
  timezone: string
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "Actor's Studio",
  brandColor: "#4f46e5",
  currency: "PKR",
  timezone: "Asia/Karachi",
}

export async function getActiveOrganizationBrand(orgId?: string): Promise<BrandConfig> {
  if (!orgId) return DEFAULT_BRAND

  try {
    const supabase = await createClient()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('name, logo_url, brand_color, currency, timezone')
      .eq('id', orgId)
      .maybeSingle()

    if (error || !org) return DEFAULT_BRAND

    return {
      name: org.name || DEFAULT_BRAND.name,
      logoUrl: org.logo_url || undefined,
      brandColor: org.brand_color || DEFAULT_BRAND.brandColor,
      currency: org.currency || DEFAULT_BRAND.currency,
      timezone: org.timezone || DEFAULT_BRAND.timezone,
    }
  } catch {
    return DEFAULT_BRAND
  }
}
