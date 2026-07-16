# Sub-Prompt 06 — Public Portfolio Page, SEO & PDF Comp Card

**Phase:** Tier 1 — Step 6 of 10  
**Depends on:** `05-talent-profile-media.md` (talent profiles with media exist)  
**Delivers:** A stunning, SEO-optimized public portfolio page per talent, shareable via URL and printable as a PDF comp card.

---

## Context

Every approved talent gets a public page at `/talent/[slug]` (e.g., `actorsstudio.pk/talent/sara-khan`). This page must:
- Load fast (SSG/ISR)
- Be fully SEO-indexed with proper metadata
- Have OpenGraph tags so WhatsApp/social sharing shows a rich preview
- Be printable as a clean PDF comp card

---

## Tasks

### 1. Dynamic route with ISR

`src/app/(public)/talent/[slug]/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = { params: { slug: string } }

// Generate static paths for top 1000 approved talent (rest served on demand)
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('talent_profiles')
    .select('slug')
    .eq('verification_status', 'approved')
    .not('slug', 'is', null)
    .limit(1000)
  return (data ?? []).map(t => ({ slug: t.slug }))
}

// Dynamic metadata for SEO + OpenGraph
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(`
      full_name, stage_name, bio, city, slug,
      media_assets!inner(url, is_primary, type)
    `)
    .eq('slug', params.slug)
    .eq('verification_status', 'approved')
    .single()

  if (!talent) return { title: 'Talent Not Found | Actor\'s Studio' }

  const displayName = talent.stage_name || talent.full_name
  const primaryPhoto = talent.media_assets?.find((m: any) => m.is_primary && m.type === 'photo')?.url
  const description = talent.bio?.slice(0, 160) ?? `${displayName} — talent profile on Actor's Studio Pakistan`

  return {
    title: `${displayName} | Actor's Studio`,
    description,
    openGraph: {
      title: `${displayName} | Actor's Studio`,
      description,
      images: primaryPhoto ? [{ url: primaryPhoto, width: 1200, height: 630 }] : [],
      type: 'profile',
      url: `https://actorsstudio.pk/talent/${params.slug}`,
      siteName: "Actor's Studio",
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | Actor's Studio`,
      description,
      images: primaryPhoto ? [primaryPhoto] : [],
    },
    alternates: {
      canonical: `https://actorsstudio.pk/talent/${params.slug}`,
    },
  }
}

export default async function TalentPortfolioPage({ params }: Props) {
  const supabase = await createClient()

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(`
      *,
      categories:category_id(name),
      sub_category:sub_category_id(name),
      media_assets(id, type, url, thumbnail_url, is_primary, sort_order, duration_sec)
    `)
    .eq('slug', params.slug)
    .eq('verification_status', 'approved')
    .single()

  if (!talent) notFound()

  return <TalentPortfolioView talent={talent} />
}
```

Set ISR revalidation: `export const revalidate = 3600` (1 hour).

### 2. Portfolio view component

`src/components/features/talent/TalentPortfolioView.tsx`:

#### Hero section
```
┌──────────────────────────────────────────────────────────┐
│  [Primary photo — 400×500px portrait card]               │
│                                                          │
│  SARA KHAN                           [Book / Contact CTA]│
│  Actress & Model                                         │
│  ★ Premium  •  Karachi  •  5 yrs experience             │
│  ✓ ID Verified  ✓ Agency Represented                    │
└──────────────────────────────────────────────────────────┘
```
- Primary photo in a stylish portrait card with subtle gradient overlay at bottom.
- Display name (stage_name preferred) in large Playfair Display.
- Category / sub-category below name.
- Badges row: Premium, Verified, Availability.
- CTA button: "Book / Enquire" → opens contact modal or logs in to apply.
- "Print Comp Card" button (bottom right corner, shows only on desktop).

#### Stats bar
Horizontal bar below the hero:

| Height | Languages | Skills | Experience |
|--------|-----------|--------|------------|
| 5'7" (170cm) | Urdu, English | Acting, Hosting | 5 years |

#### Bio section
Full bio text. If truncated (> 300 chars), show "Read more" expandable.

#### Photo gallery
Masonry grid (3 columns desktop, 2 mobile) of all `type = 'photo'` media assets sorted by `sort_order`.
- Clicking a photo opens a lightbox (`yet-another-react-lightbox`).
- Primary photo excluded from grid (already shown in hero).

```bash
npm install yet-another-react-lightbox
```

#### Video reel section (conditional)
If any `type = 'video' | 'reel'` media exists:
- Show YouTube/Vimeo embed (parse URL to get embed URL).
- For uploaded videos: `<video>` element with `controls` + poster thumbnail.

#### Voice sample section (conditional)
If any `type = 'voice_sample'` media exists:
- HTML `<audio controls>` with waveform-style styling.

#### Social links
Row of icon buttons (Instagram, TikTok, YouTube, Facebook, Website) — only shown if URLs exist in `measurements_json.social`.

### 3. Not-found page

`src/app/(public)/talent/[slug]/not-found.tsx`:
- Friendly page: "This talent profile doesn't exist or is not yet approved."
- Back to search button.

### 4. PDF Comp Card export

Install `@react-pdf/renderer`:

```bash
npm install @react-pdf/renderer
```

Create `src/lib/pdf/CompCard.tsx` — a React PDF document:

```tsx
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
})

const styles = StyleSheet.create({
  page: { flexDirection: 'row', backgroundColor: '#09090b', padding: 0 },
  photoColumn: { width: '40%', backgroundColor: '#1a1a1a' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  contentColumn: { width: '60%', padding: 32, backgroundColor: '#09090b', color: '#ffffff' },
  name: { fontSize: 28, fontFamily: 'Inter', fontWeight: 700, color: '#ffffff', marginBottom: 4 },
  category: { fontSize: 12, color: '#d946ef', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 },
  statRow: { flexDirection: 'row', marginBottom: 8 },
  statLabel: { fontSize: 9, color: '#71717a', width: 80, textTransform: 'uppercase' },
  statValue: { fontSize: 10, color: '#d4d4d8', flex: 1 },
  sectionTitle: { fontSize: 9, color: '#d946ef', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  bioText: { fontSize: 10, color: '#a1a1aa', lineHeight: 1.6 },
  skillTag: { backgroundColor: '#27272a', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4, marginBottom: 4 },
  skillText: { fontSize: 9, color: '#d4d4d8' },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 8, color: '#52525b' },
  logoText: { fontSize: 10, color: '#d946ef', fontWeight: 700 },
})

export function CompCardPDF({ talent }: { talent: any }) {
  const displayName = talent.stage_name || talent.full_name
  const primaryPhoto = talent.media_assets?.find((m: any) => m.is_primary && m.type === 'photo')?.url

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.photoColumn}>
          {primaryPhoto && <Image src={primaryPhoto} style={styles.photo} />}
        </View>
        <View style={styles.contentColumn}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.category}>{talent.categories?.name}</Text>

          {/* Stats */}
          {talent.height_cm && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Height</Text>
              <Text style={styles.statValue}>{talent.height_cm} cm</Text>
            </View>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>City</Text>
            <Text style={styles.statValue}>{talent.city}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Languages</Text>
            <Text style={styles.statValue}>{talent.languages?.join(', ')}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Experience</Text>
            <Text style={styles.statValue}>{talent.experience_years} years</Text>
          </View>

          {/* Bio */}
          {talent.bio && (
            <>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{talent.bio.slice(0, 400)}</Text>
            </>
          )}

          {/* Skills */}
          {talent.skills?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {talent.skills.slice(0, 10).map((skill: string) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.logoText}>Actor's Studio</Text>
            <Text style={styles.footerText}>actorsstudio.pk/talent/{talent.slug}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
```

#### PDF download API route

`src/app/api/talent/[slug]/comp-card/route.ts`:

```ts
import { renderToBuffer } from '@react-pdf/renderer'
import { CompCardPDF } from '@/lib/pdf/CompCard'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(`*, categories:category_id(name), media_assets(*)`)
    .eq('slug', params.slug)
    .eq('verification_status', 'approved')
    .single()

  if (!talent) return new Response('Not found', { status: 404 })

  const buffer = await renderToBuffer(<CompCardPDF talent={talent} />)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${talent.slug}-comp-card.pdf"`,
    },
  })
}
```

The "Print Comp Card" button on the portfolio page links to `/api/talent/[slug]/comp-card`.

### 5. Schema.org JSON-LD structured data

Add to the portfolio page's `<head>` via Next.js metadata or a `<script>` tag:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: talent.stage_name || talent.full_name,
  jobTitle: talent.categories?.name,
  address: { '@type': 'PostalAddress', addressLocality: talent.city, addressCountry: 'PK' },
  image: primaryPhoto,
  url: `https://actorsstudio.pk/talent/${talent.slug}`,
}
```

### 6. Public `/talent` listing page

`src/app/(public)/talent/page.tsx`:

- Grid of `TalentProfileCard` components (from prompt 05).
- Server-side fetch: approved talent, ordered by `is_premium DESC, created_at DESC`.
- Basic pagination (12 per page, Next/Prev buttons).
- This is a stub — full search/filter comes in prompt 10.

---

## Deliverables checklist

- [ ] Dynamic `/talent/[slug]` page with ISR (1-hour revalidation)
- [ ] `generateMetadata` with full OpenGraph + Twitter card tags
- [ ] Hero section (primary photo, name, stats, CTA)
- [ ] Photo gallery with lightbox
- [ ] Video reel embed section
- [ ] Voice sample audio player
- [ ] Social links row
- [ ] Not-found page
- [ ] `CompCardPDF` React PDF document
- [ ] `/api/talent/[slug]/comp-card` download route
- [ ] Schema.org JSON-LD structured data
- [ ] Public `/talent` listing page (12 per page)
