type Profile = {
  full_name?: string | null
  bio?: string | null
  city?: string | null
  category_id?: string | null
  skills?: string[] | null
  languages?: string[] | null
  primary_photo?: boolean | null
  experience_years?: number | null
}

const FIELDS: { key: keyof Profile; label: string; weight: number }[] = [
  { key: 'full_name',       label: 'Full name',    weight: 15 },
  { key: 'bio',             label: 'Bio',           weight: 20 },
  { key: 'city',            label: 'City',          weight: 10 },
  { key: 'category_id',     label: 'Category',      weight: 15 },
  { key: 'skills',          label: 'Skills',        weight: 10 },
  { key: 'languages',       label: 'Languages',     weight: 10 },
  { key: 'primary_photo',   label: 'Profile photo', weight: 20 },
]

export function calculateCompleteness(profile: Profile): number {
  return FIELDS.reduce((acc, field) => {
    const val = profile[field.key]
    const filled = Array.isArray(val) ? val.length > 0 : !!val
    return acc + (filled ? field.weight : 0)
  }, 0)
}
