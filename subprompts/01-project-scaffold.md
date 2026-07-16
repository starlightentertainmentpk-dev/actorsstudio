# Sub-Prompt 01 — Project Scaffold

**Phase:** Tier 1 — Step 1 of 10  
**Depends on:** Nothing (first step)  
**Delivers:** A fully configured Next.js 15 monorepo with the design system, folder structure, and tooling ready for feature development.

---

## Context

You are building **Actor's Studio** — a production-grade talent marketplace for the Pakistani entertainment industry. This prompt covers only the project scaffold and design system. No pages with real data yet.

Tech stack:
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend/DB:** Supabase (wired in the next prompt)
- **Hosting:** Vercel

---

## Tasks

### 1. Initialize the project

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### 2. Install core dependencies

```bash
# UI + animation
npx shadcn@latest init
npm install framer-motion

# Utilities
npm install clsx tailwind-merge
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod

# Icons
npm install lucide-react

# Supabase client (schema comes next prompt)
npm install @supabase/supabase-js @supabase/ssr
```

### 3. Folder structure

Create the following structure under `src/`:

```
src/
├── app/
│   ├── (auth)/            # login, register, forgot-password
│   ├── (dashboard)/
│   │   ├── talent/        # talent dashboard pages
│   │   ├── admin/         # studio admin pages
│   │   └── producer/      # producer/brand pages
│   ├── (public)/
│   │   ├── talent/[slug]/ # public portfolio pages
│   │   └── casting/       # public casting call listings
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn components (auto-generated)
│   ├── shared/            # shared layout (Navbar, Footer, Sidebar)
│   └── features/          # feature-specific components (organized by module)
├── lib/
│   ├── supabase/          # client + server Supabase helpers
│   ├── utils.ts           # cn() and other utilities
│   └── validations/       # Zod schemas
├── hooks/                 # custom React hooks
├── types/                 # global TypeScript types & database types
└── styles/
    └── globals.css
```

### 4. Design system

**Do not use shadcn/Tailwind defaults.** Create a distinctive identity for Actor's Studio:

#### Color palette (add to `tailwind.config.ts`):
```ts
colors: {
  brand: {
    50:  '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',   // primary brand (deep magenta/fuchsia)
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  gold: {
    400: '#fbbf24',
    500: '#f59e0b',   // accent – prestige/premium feel
    600: '#d97706',
  },
  surface: {
    50:  '#fafafa',
    100: '#f4f4f5',
    900: '#09090b',   // near-black for dark mode base
    950: '#030303',
  },
}
```

#### Typography (add Google Font in `layout.tsx`):
- **Heading:** `Playfair Display` (serif, editorial feel)
- **Body:** `Inter` (clean, readable)

```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
```

#### Dark/light theme toggle:
- Use `next-themes` for theme management.
- Persist the preference in `localStorage`.
- Default to `dark` theme (entertainment/creative industry convention).

```bash
npm install next-themes
```

Wrap the root layout in `<ThemeProvider>`.

#### Spacing / motion tokens (add to `globals.css`):
```css
:root {
  --radius: 0.75rem;
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```

#### Framer Motion page transition wrapper:
Create `src/components/shared/PageTransition.tsx` — a simple `motion.div` with `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}` that wraps every page.

### 5. Shared layout components

Build placeholder versions (real nav links added per feature):

- **`Navbar`** — logo (Actor's Studio wordmark), nav links, theme toggle, auth CTA.
- **`Sidebar`** — collapsible sidebar for dashboard routes (talent/admin/producer each get their own nav items via props).
- **`Footer`** — minimal; links, copyright, social icons.
- **`DashboardShell`** — layout wrapper that composes Sidebar + main content area.

### 6. Environment variables

Create `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Media
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Comms
RESEND_API_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

### 7. Tooling

- Add `prettier` with Tailwind class sorting plugin.
- Add `@types/node` if missing.
- Configure `tsconfig.json` path aliases so `@/*` resolves to `src/*`.
- Add a `ROADMAP.md` at repo root listing all Tier 3 features as backlog items (no code, just documented stubs).

### 8. Smoke-test

Run `npm run dev` and verify:
- Home page renders with Navbar and Footer.
- Dark/light toggle works.
- No TypeScript errors.
- Tailwind custom colors resolve correctly (add a temporary color swatch to the home page to verify).

---

## Deliverables checklist

- [ ] Next.js 15 app router project initialised
- [ ] All dependencies installed
- [ ] Folder structure created
- [ ] Custom color palette + typography applied
- [ ] `next-themes` dark/light toggle working
- [ ] Framer Motion page transition wrapper created
- [ ] Shared Navbar, Sidebar, Footer placeholder components
- [ ] `.env.local.example` with all keys
- [ ] `ROADMAP.md` stub created
- [ ] `npm run dev` runs without errors
