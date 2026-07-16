# Sub-Prompt 04 — Talent Registration (Multi-Step Onboarding)

**Phase:** Tier 1 — Step 4 of 10  
**Depends on:** `03-auth-roles.md` (auth working, `talent_profiles` table exists)  
**Delivers:** A polished, save-and-resume multi-step registration wizard that collects all profile data for a talent.

---

## Context

After a new talent registers their account, they are redirected to `/talent/onboarding`. This is a **4-step wizard** with progress saved to `talent_profiles` after each step, so they can close the browser and resume later.

Steps:
1. **Personal** — name, DOB, gender, city, phone
2. **Professional** — category, sub-category, experience, languages, skills, union status, availability
3. **Social** — Instagram, TikTok, YouTube, Facebook, website links
4. **Portfolio** — upload profile photo, optional additional photos, optional reel video link

---

## Tasks

### 1. Wizard state management

Create `src/lib/validations/talent-onboarding.ts` — Zod schemas per step:

```ts
import { z } from 'zod'

export const step1Schema = z.object({
  full_name:   z.string().min(2, 'Full name is required'),
  stage_name:  z.string().optional(),
  dob:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date (YYYY-MM-DD)').optional(),
  gender:      z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  city:        z.string().min(2, 'City is required'),
  phone:       z.string().regex(/^(\+92|0)[0-9]{10}$/, 'Enter a valid Pakistani phone number').optional(),
})

export const step2Schema = z.object({
  category_id:     z.string().uuid('Select a category'),
  sub_category_id: z.string().uuid().optional(),
  experience_years: z.coerce.number().min(0).max(60),
  languages:       z.array(z.string()).min(1, 'Select at least one language'),
  skills:          z.array(z.string()),
  union_member:    z.boolean().default(false),
  is_available:    z.boolean().default(true),
  bio:             z.string().max(1000, 'Bio must be under 1000 characters').optional(),
  height_cm:       z.coerce.number().min(100).max(250).optional(),
  weight_kg:       z.coerce.number().min(30).max(200).optional(),
})

export const step3Schema = z.object({
  instagram_url: z.string().url().optional().or(z.literal('')),
  tiktok_url:    z.string().url().optional().or(z.literal('')),
  youtube_url:   z.string().url().optional().or(z.literal('')),
  facebook_url:  z.string().url().optional().or(z.literal('')),
  website_url:   z.string().url().optional().or(z.literal('')),
})

export const step4Schema = z.object({
  profile_photo_url: z.string().url('Upload a profile photo'),
  reel_url:          z.string().url().optional().or(z.literal('')),
})
```

> Store social links in `talent_profiles.measurements_json` → `{ social: { instagram, tiktok, ... } }` for now; a dedicated `talent_social_links` table can be added in Tier 2.

### 2. Wizard page structure

`src/app/(dashboard)/talent/onboarding/page.tsx` — client component.

Use a `currentStep` state (1–4). Render the correct step form. Show a progress bar at the top.

```tsx
'use client'
import { useState } from 'react'
import { OnboardingStep1 } from './_components/Step1Personal'
import { OnboardingStep2 } from './_components/Step2Professional'
import { OnboardingStep3 } from './_components/Step3Social'
import { OnboardingStep4 } from './_components/Step4Portfolio'
import { ProgressBar } from './_components/ProgressBar'
import { useUser } from '@/hooks/useUser'

const STEPS = ['Personal', 'Professional', 'Social', 'Portfolio']

export default function TalentOnboardingPage() {
  const [step, setStep] = useState(1)
  const { data: user } = useUser()

  const next = () => setStep(s => Math.min(s + 1, 4))
  const prev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <ProgressBar steps={STEPS} current={step} />
      {step === 1 && <OnboardingStep1 onNext={next} />}
      {step === 2 && <OnboardingStep2 onNext={next} onBack={prev} />}
      {step === 3 && <OnboardingStep3 onNext={next} onBack={prev} />}
      {step === 4 && <OnboardingStep4 onBack={prev} />}
    </div>
  )
}
```

### 3. Progress bar component

`src/app/(dashboard)/talent/onboarding/_components/ProgressBar.tsx`:
- Horizontal stepper with step names.
- Active step highlighted in `brand-500`.
- Completed steps show a checkmark.
- Animated transition between steps using Framer Motion.

### 4. Step 1 — Personal

`_components/Step1Personal.tsx`:

Fields:
- `full_name` — text input (required)
- `stage_name` — text input (optional), helper text: "Name used on screen/stage"
- `dob` — date picker or date input
- `gender` — radio/select: Male, Female, Non-binary, Prefer not to say
- `city` — searchable select (list of major Pakistani cities + "Other")
- `phone` — text input with `+92` prefix shown

Pakistani city list: Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Quetta, Multan, Sialkot, Hyderabad, Sukkur, Abbottabad, Other.

On submit: upsert `talent_profiles` with step 1 data. Show success toast. Call `onNext()`.

### 5. Step 2 — Professional

`_components/Step2Professional.tsx`:

Fields:
- `category_id` — fetch from `categories` (parent only, `parent_id IS NULL`). Rendered as visual category cards with icons.
- `sub_category_id` — conditionally shown after category selected. Fetch sub-categories where `parent_id = category_id`.
- `experience_years` — number input / slider (0–30+)
- `languages` — multi-select checkboxes: Urdu, English, Punjabi, Sindhi, Pashto, Balochi, Other
- `skills` — tag input (type and press Enter to add tags like "Hosting", "Dubbing", "Dancing", etc.). Pre-suggest common skills.
- `bio` — textarea with character counter (max 1000)
- `height_cm` / `weight_kg` — number inputs (optional)
- `union_member` — toggle
- `is_available` — toggle (available for bookings)

On submit: upsert `talent_profiles` with step 2 data.

### 6. Step 3 — Social

`_components/Step3Social.tsx`:

- One input per social platform with the platform icon as a prefix decoration.
- All optional.
- Validate URLs if entered.
- Store in `measurements_json.social`.

On submit: upsert `talent_profiles.measurements_json` merging social links. Step is optional — show "Skip for now" link.

### 7. Step 4 — Portfolio (profile photo + reel)

`_components/Step4Portfolio.tsx`:

**Profile photo upload:**
- Drag-and-drop zone + click-to-browse.
- Preview the selected image immediately.
- Max file size: 5 MB. Accepted types: JPEG, PNG, WebP.
- On file selected: upload to Supabase Storage bucket `talent-media/{userId}/profile/`.
- Insert a `media_assets` row: `type='photo', is_primary=true`.
- Store the returned URL back to form state.

**Reel URL (optional):**
- Text input for YouTube/Vimeo URL.
- If entered, insert a `media_assets` row: `type='reel', url=reel_url`.

**Completion:**
- On submit: upsert final data and set `verification_status = 'pending'`.
- Generate a slug from `stage_name` or `full_name` (slugify + deduplicate with random suffix if taken).
- Redirect to `/talent/dashboard` with a success toast: "Profile submitted! Our team will review it within 24–48 hours."

### 8. Slug generation utility

`src/lib/utils/slug.ts`:

```ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function uniqueSlug(name: string, supabase: any): Promise<string> {
  const base = generateSlug(name)
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    attempt++
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
}
```

### 9. Save-and-resume logic

On page load (`useEffect`), check if a `talent_profiles` row already exists for the current user:

```ts
const { data: existingProfile } = await supabase
  .from('talent_profiles')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle()
```

If it exists:
- Pre-populate each step form with the existing data.
- Jump to the first **incomplete** step (e.g., if step 2 data is missing, start at step 2).

### 10. Supabase Storage bucket

Create a `talent-media` bucket (public, with RLS):
- Talent can upload to their own path: `talent-media/{user_id}/**`
- Public read on files inside approved talent paths

Add storage policy via Supabase dashboard or migration:
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "talent upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'talent-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read
CREATE POLICY "public read talent media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'talent-media');
```

---

## Deliverables checklist

- [ ] Zod schemas for all 4 steps
- [ ] Progress bar stepper component with Framer Motion
- [ ] Step 1: Personal info form with Pakistani city list
- [ ] Step 2: Professional form with category cards, tag input, language checkboxes
- [ ] Step 3: Social links form (skippable)
- [ ] Step 4: Profile photo upload to Supabase Storage + reel URL
- [ ] Slug generation and deduplication
- [ ] Save-and-resume: pre-populate from existing profile on page load
- [ ] Supabase Storage bucket and policies
- [ ] On completion: `verification_status = 'pending'`, redirect to dashboard
