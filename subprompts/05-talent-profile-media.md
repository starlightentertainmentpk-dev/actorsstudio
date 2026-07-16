# Sub-Prompt 05 — Talent Profile & Media Library

**Phase:** Tier 1 — Step 5 of 10  
**Depends on:** `04-talent-registration.md` (talent profile data exists in DB)  
**Delivers:** A private talent dashboard for viewing/editing their profile, managing their media library, and previewing their digital comp card.

---

## Context

The **Talent Dashboard** is the talent's control center. This prompt covers:
1. **Profile view & edit** — update any field from onboarding, manage stats.
2. **Media Library** — upload, reorder, set primary photo, delete assets.
3. **Comp Card Preview** — visual preview of what casting directors will see.
4. **Verification status banner** — always visible at the top.

---

## Tasks

### 1. Talent dashboard layout

`src/app/(dashboard)/talent/layout.tsx`:

- Sidebar nav items for the talent role:
  - Dashboard (overview stats)
  - My Profile
  - Media Library
  - Casting Calls (browse + my applications)
  - Auditions
  - Settings

Use the `DashboardShell` and `Sidebar` components from prompt 01.

### 2. Dashboard overview page

`src/app/(dashboard)/talent/dashboard/page.tsx`:

Stat cards (fetch from Supabase):
- **Profile Completeness** — percentage based on filled fields (name, photo, bio, category, skills, city = 100%)
- **Total Applications** — count from `applications` where `talent_id = me`
- **Auditions Scheduled** — count from `auditions` where `talent_id = me` and `scheduled_at > NOW()`
- **Profile Views** — stub (show "—" for now; implement in Tier 3)

Verification status banner at the very top (conditionally shown if status ≠ `approved`):

| Status | Color | Message |
|---|---|---|
| `pending` | amber | "Your profile is pending review. We'll notify you within 24–48 hours." |
| `under_review` | blue | "Our team is reviewing your profile." |
| `interview_scheduled` | purple | "An interview has been scheduled. Check your email." |
| `audition_scheduled` | purple | "An audition has been scheduled. Check your email." |
| `rejected` | red | "Your profile was not approved. Contact support for details." |
| `blacklisted` | red | "Your account has been suspended." |
| `inactive` | gray | "Your profile is currently inactive." |

### 3. Profile edit page

`src/app/(dashboard)/talent/profile/page.tsx`:

Single-page edit form (not a wizard — they're already onboarded). Organized in collapsible `<Accordion>` sections using shadcn:

1. **Personal Info** — full_name, stage_name, dob, gender, city, phone
2. **Professional** — category, sub_category, experience_years, bio, skills, languages, height, weight, union_member, is_available
3. **Social Links** — same as onboarding Step 3
4. **Measurements** — optional detailed measurements (bust/waist/hip or chest/waist/hip depending on gender)

Auto-save on field blur (debounced 800ms) using `supabase.from('talent_profiles').update()`.

Show a "Last saved" timestamp below the form.

### 4. Media library page

`src/app/(dashboard)/talent/media/page.tsx`:

#### Layout

Two-column grid on desktop, single column on mobile:
- Left/top: **Photos & Images** section
- Right/bottom: **Videos & Reels** section

#### Photo management

Fetch all `media_assets` where `owner_id = userId` and `type = 'photo'`.

- Render as a drag-and-drop grid (use `@dnd-kit/core` + `@dnd-kit/sortable`).
- Each photo card shows:
  - Thumbnail
  - "Primary" badge if `is_primary = true`
  - On hover: "Set as Primary" button, "Delete" button (with confirm dialog)
- **Add Photos** button: opens a multi-file upload modal (max 20 photos, 5 MB each, JPEG/PNG/WebP).
- On reorder: update `sort_order` in batch.
- On "Set as Primary": set `is_primary = false` for all others, then `is_primary = true` for selected.
- On delete: `supabase.storage.remove()` then delete `media_assets` row.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### Video / Reel management

Fetch all `media_assets` where `owner_id = userId` and `type IN ('video', 'reel', 'voice_sample')`.

- List view with type badge, title, duration.
- **Add Video**: two options:
  1. **Upload file** — to Supabase Storage (max 100 MB, MP4/MOV/WebM). Shows progress bar during upload.
  2. **Add URL** — YouTube or Vimeo link (stored as URL, no upload).
- **Add Voice Sample**: upload audio file (MP3/WAV, max 10 MB). Renders an HTML `<audio>` player in the card.
- Delete: same pattern as photos.

#### Resume / CV upload

Separate small section:
- Upload PDF or DOCX (max 5 MB).
- Stored in `media_assets` with `type = 'resume'`.
- Shows file name, upload date, download link, replace/delete options.

### 5. Comp card preview modal

Add a **"Preview Comp Card"** button to the profile page. On click, open a full-screen modal showing the comp card exactly as the public will see it:

```
┌─────────────────────────────────────────────────────┐
│  [Primary Photo - large]                            │
│  Stage Name / Full Name                             │
│  Category | Sub-category                            │
│─────────────────────────────────────────────────────│
│  City | Age | Gender                                │
│  Height: 5'7" | Languages: Urdu, English            │
│─────────────────────────────────────────────────────│
│  Skills: Acting, Hosting, Dubbing                   │
│  Bio: ...                                           │
│─────────────────────────────────────────────────────│
│  [Photo grid - up to 6 additional photos]           │
│─────────────────────────────────────────────────────│
│  actor's studio logo | actorsstudio.pk/talent/slug  │
└─────────────────────────────────────────────────────│
```

### 6. Shared `TalentProfileCard` component

`src/components/features/talent/TalentProfileCard.tsx`:

Used in talent search results (prompt 10). Props:

```ts
type TalentProfileCardProps = {
  talent: {
    id: string
    full_name: string
    stage_name?: string
    slug: string
    primary_photo_url?: string
    category: string
    city?: string
    experience_years: number
    is_premium: boolean
    skills: string[]
  }
}
```

- Compact card with hover scale animation (Framer Motion).
- Premium badge (gold star icon) if `is_premium`.
- Click → navigate to public portfolio page.

### 7. Profile completeness calculation

`src/lib/utils/profile-completeness.ts`:

```ts
type Profile = {
  full_name?: string
  bio?: string
  city?: string
  category_id?: string
  skills?: string[]
  languages?: string[]
  primary_photo?: boolean
  experience_years?: number
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
```

### 8. Settings page stub

`src/app/(dashboard)/talent/settings/page.tsx`:
- Change password form
- Email notification preferences (checkboxes per event type)
- Account deactivation (sets `is_available = false`)
- Danger zone: "Delete account" (soft-delete — set `users.status = 'deleted'`)

---

## Deliverables checklist

- [ ] Talent dashboard layout with sidebar nav
- [ ] Dashboard overview: stat cards + verification status banner
- [ ] Profile edit page with accordion sections and auto-save
- [ ] Media library: photo drag-and-drop grid with primary/delete/reorder
- [ ] Media library: video/reel upload (file + URL) with progress bar
- [ ] Voice sample upload with audio player
- [ ] Resume/CV upload
- [ ] Comp card preview modal
- [ ] `TalentProfileCard` shared component
- [ ] `calculateCompleteness` utility
- [ ] Settings page stub
