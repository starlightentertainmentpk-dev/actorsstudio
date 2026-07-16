# Sub-Prompt 10 — Talent Search & Advanced Filtering

**Phase:** Tier 1 — Step 10 of 10  
**Depends on:** `06-public-portfolio.md` (portfolio pages), `07-category-management.md` (categories)  
**Delivers:** A powerful, fast talent search page with faceted filtering, accessible to both authenticated producers and the public.

---

## Context

Talent search is the most-used feature for producers and casting directors. It must be fast, relevant, and filterable across many dimensions. This prompt builds the search page at `/talent` (public) and `/producer/talent-search` (authenticated, with more actions).

---

## Tasks

### 1. Search architecture

Use **server-side Supabase queries** with URL search params — no separate search service for Tier 1. Structure:

```
GET /talent?q=sara&category=actor&city=Karachi&gender=female&age_min=20&age_max=35&lang=Urdu&exp=2&premium=true&page=1
```

All filters map 1:1 to URL params so results are shareable and bookmarkable.

### 2. Supabase search query

`src/lib/talent-search.ts`:

```ts
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

export async function searchTalent(params: TalentSearchParams) {
  const supabase = await createClient()
  const { q, category, city, gender, age_min, age_max, languages, skills, exp_min, premium, available, page = 1, per_page = 12 } = params

  let query = supabase
    .from('talent_profiles')
    .select(`
      id, full_name, stage_name, slug, city, gender, experience_years,
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
  if (gender) query = query.eq('gender', gender)
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
  if (languages?.length) {
    query = query.contains('languages', languages)
  }
  if (skills?.length) {
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

  return { talent: data ?? [], total: count ?? 0, page, per_page }
}
```

> **Note on full-text search:** For Tier 1, `ilike` is sufficient. Add a `tsvector` column and `pg_trgm` index in the Tier 2 QA pass if search feels slow at scale.

### 3. Search page (public)

`src/app/(public)/talent/page.tsx` — refactor from the stub in prompt 06:

**Server component** — reads URL search params, calls `searchTalent()`, renders results.

```tsx
export default async function TalentSearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>
}) {
  const params = parseSearchParams(searchParams)
  const { talent, total, page, per_page } = await searchTalent(params)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <TalentFilterSidebar defaultValues={params} />
        </aside>
        <main className="flex-1">
          <TalentSearchHeader total={total} query={params.q} />
          <TalentGrid talent={talent} />
          <Pagination total={total} page={page} perPage={per_page} />
        </main>
      </div>
    </div>
  )
}
```

### 4. Filter sidebar component

`src/components/features/talent/TalentFilterSidebar.tsx` — client component (handles local state for multi-selects, then navigates on Apply):

#### Sections:

**Search box** — text input with debounce (300ms), updates `q` param on change.

**Category** — accordion list of parent categories with checkboxes. Check a parent → filter. Clicking expands sub-categories.

**Location** — searchable dropdown of Pakistani cities + free-text fallback.

**Gender** — radio: Any / Male / Female.

**Age Range** — dual-handle slider (min 0, max 80, step 1). Uses shadcn `Slider` or custom.

**Languages** — checkbox group: Urdu, English, Punjabi, Sindhi, Pashto, Balochi.

**Skills** — tag input autocomplete from common skills list.

**Experience** — select: Any / 0–2 years / 2–5 years / 5–10 years / 10+ years.

**Availability** — toggle: "Available only"

**Premium** — toggle: "Premium talent only"

**Apply / Reset buttons** at the bottom.

On Apply: construct URL params and `router.push()` with the new URL. This triggers a server-side re-fetch.

Mobile: filters are in a Drawer (shadcn `Sheet`) triggered by a "Filters" button above the results grid.

### 5. Results grid

`src/components/features/talent/TalentGrid.tsx`:

- Responsive grid: 1 col (mobile) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl)
- Each cell: `TalentProfileCard` from prompt 05
- If `is_premium`: card has a subtle gold border glow
- Empty state: "No talent found matching your filters" with a "Clear filters" link
- Loading state: skeleton cards (10 shimmer placeholders)

**Premium card styling:**
```css
.premium-card {
  border: 1px solid rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.08);
}
```

### 6. Pagination component

`src/components/shared/Pagination.tsx`:

```tsx
type Props = { total: number; page: number; perPage: number }

export function Pagination({ total, page, perPage }: Props) {
  const totalPages = Math.ceil(total / perPage)
  // Generate page numbers, ellipsis for large ranges
  // Previous / Next buttons
  // "Showing X–Y of Z results" text
}
```

Updates via URL param `?page=2`, triggering server re-fetch.

### 7. Producer talent search (authenticated)

`src/app/(dashboard)/producer/talent-search/page.tsx`:

Same search UI but with additional features visible to authenticated producers:
- **"Save to Shortlist"** button on each card → creates a shortlist entry (stub: save to localStorage or a `producer_shortlists` table — add table if building properly).
- **"View Profile"** opens the portfolio page in a new tab.
- **"Invite to Apply"** button → dispatches an invitation notification to the talent (stub call to `dispatchNotification`).
- Shows talent's **contact info** (phone/WhatsApp) — only available to verified producers.

For Tier 1, "Save to Shortlist" can use localStorage. A proper `producer_shortlists` table is Tier 2.

### 8. `parseSearchParams` utility

`src/lib/utils/search-params.ts`:

```ts
export function parseSearchParams(raw: Record<string, string | string[]>): TalentSearchParams {
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

function getString(v: string | string[] | undefined) { return typeof v === 'string' ? v : undefined }
function getNumber(v: string | string[] | undefined) { return typeof v === 'string' ? Number(v) || undefined : undefined }
function getArray(v: string | string[] | undefined)  { return Array.isArray(v) ? v : v ? [v] : undefined }
function getBoolean(v: string | string[] | undefined){ return v === 'true' ? true : undefined }
```

### 9. Performance index (add to migration)

```sql
-- Full-text search index for talent name fields
CREATE INDEX idx_talent_fullname_trgm ON public.talent_profiles
  USING GIN (full_name gin_trgm_ops);
CREATE INDEX idx_talent_stagename_trgm ON public.talent_profiles
  USING GIN (stage_name gin_trgm_ops);

-- Extension needed
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Add this as `supabase/migrations/0002_search_indexes.sql`.

---

## Deliverables checklist

- [ ] `searchTalent()` server-side query with all filter params
- [ ] `parseSearchParams()` utility
- [ ] Public `/talent` search page (server component, URL-driven)
- [ ] `TalentFilterSidebar` with all filter sections
- [ ] Mobile filters in a Drawer/Sheet
- [ ] `TalentGrid` with responsive layout and empty/loading states
- [ ] Premium card gold border styling
- [ ] `Pagination` component (URL-driven)
- [ ] Producer `/producer/talent-search` page with extra actions
- [ ] `pg_trgm` extension + trigram indexes migration
