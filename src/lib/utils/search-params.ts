import { TalentSearchParams } from '../talent-search'

export function parseSearchParams(raw: Record<string, string | string[] | undefined>): TalentSearchParams {
  return {
    q:          getString(raw.q),
    category:   getString(raw.category),
    city:       getString(raw.city),
    gender:     getString(raw.gender),
    age_min:    getNumber(raw.age_min),
    age_max:    getNumber(raw.age_max),
    languages:  getArray(raw.languages),
    skills:     getArray(raw.skills),
    exp_min:    getNumber(raw.exp_min),
    premium:    getBoolean(raw.premium),
    available:  getBoolean(raw.available),
    page:       getNumber(raw.page) ?? 1,
    per_page:   12,
  }
}

function getString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return typeof v === 'string' ? v : undefined
}

function getNumber(v: string | string[] | undefined): number | undefined {
  if (Array.isArray(v)) v = v[0]
  if (typeof v === 'string') {
    const parsed = Number(v)
    return isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function getArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined
  if (Array.isArray(v)) return v
  return [v]
}

function getBoolean(v: string | string[] | undefined): boolean | undefined {
  if (Array.isArray(v)) v = v[0]
  return v === 'true' ? true : v === 'false' ? false : undefined
}
