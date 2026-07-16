export function generateSlug(name: string): string {
  const slugified = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  return slugified || 'talent'
}

export async function uniqueSlug(name: string, supabase: any): Promise<string> {
  const base = generateSlug(name)
  let slug = base
  let attempt = 0
  while (true) {
    const { data, error } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      
    if (!data && !error) return slug
    
    attempt++
    // Limit loop to avoid infinite calls in edge cases
    if (attempt > 10) {
      return `${base}-${Date.now().toString(36).slice(-4)}`
    }
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
}
