import { createClient } from '@/lib/supabase/server'

export type TalentSearchParams = {
  q?: string         // full-text search on name, stage_name, bio, skills
  category?: string  // category slug
  city?: string
  gender?: string
  age_min?: number
  age_max?: number
  languages?: string[]
  skills?: string[]
  exp_min?: number   // experience_years >= exp_min
  premium?: boolean  // is_premium = true
  available?: boolean // is_available = true
  page?: number
  per_page?: number
}

export type TalentSearchResultItem = {
  id: string
  user_id: string
  full_name: string
  stage_name: string | null
  slug: string | null
  city: string | null
  gender: string | null
  experience_years: number
  is_premium: boolean
  is_available: boolean
  skills: string[]
  languages: string[]
  dob: string | null
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null
  media_assets: { url: string; is_primary: boolean; type: string }[]
}

export async function searchTalent(params: TalentSearchParams) {
  const supabase = await createClient()
  const { 
    q, 
    category, 
    city, 
    gender, 
    age_min, 
    age_max, 
    languages, 
    skills, 
    exp_min, 
    premium, 
    available, 
    page = 1, 
    per_page = 12 
  } = params

  let query = supabase
    .from('talent_profiles')
    .select(`
      id, user_id, full_name, stage_name, slug, city, gender, experience_years,
      is_premium, is_available, skills, languages, dob,
      categories:category_id(name, slug),
      media_assets!inner(url, is_primary, type)
    `, { count: 'exact' })
    .eq('verification_status', 'approved')
    .eq('media_assets.is_primary', true)
    .eq('media_assets.type', 'photo')

  // Text search across name fields and bio
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,stage_name.ilike.%${q}%,bio.ilike.%${q}%`
    )
  }

  // Category filter — join via categories table
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (city) query = query.ilike('city', `%${city}%`)
  if (gender) query = query.eq('gender', gender as any)
  if (exp_min) query = query.gte('experience_years', exp_min)
  if (premium) query = query.eq('is_premium', true)
  if (available) query = query.eq('is_available', true)

  // Age filter: calculate from dob
  if (age_min) {
    const maxDob = new Date()
    maxDob.setFullYear(maxDob.getFullYear() - age_min)
    query = query.lte('dob', maxDob.toISOString().slice(0, 10))
  }
  if (age_max) {
    const minDob = new Date()
    minDob.setFullYear(minDob.getFullYear() - age_max - 1)
    query = query.gte('dob', minDob.toISOString().slice(0, 10))
  }

  // Array filters (languages, skills) — PostgreSQL @> operator
  if (languages && languages.length > 0) {
    query = query.contains('languages', languages)
  }
  if (skills && skills.length > 0) {
    query = query.contains('skills', skills)
  }

  // Ordering: premium first, then most experienced
  query = query.order('is_premium', { ascending: false })
               .order('experience_years', { ascending: false })

  // Pagination
  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return { 
    talent: (data as any[] ?? []) as TalentSearchResultItem[], 
    total: count ?? 0, 
    page, 
    per_page 
  }
}
