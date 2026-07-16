# Sub-Prompt Index — Actor's Studio Talent Marketplace

> This folder contains numbered, self-contained build prompts for each phase of the Actor's Studio platform. Feed them to Antigravity **in order**. Do not jump ahead; each prompt assumes the previous one is fully working.

---

## Platform Mission

Build **Actor's Studio** — a production-grade, multi-sided talent marketplace for the Pakistani entertainment industry. It connects:

- **Talent** (actors, models, voice artists, dancers, musicians, influencers)
- **Studio/Agency Admins** (vetting, approval, business management)
- **Producers / Brands / Casting Directors** (post calls, search, book, pay)

Comparable in scope to Backstage, Casting Networks, Spotlight, Model Mayhem, and IMDbPro — but **localized for Pakistan** (Urdu/English, PKR pricing, WhatsApp-first comms, local payment rails).

---

## Build Order

| # | File | Phase | Status |
|---|------|-------|--------|
| 01 | `01-project-scaffold.md` | Project setup, Next.js, Tailwind, shadcn | ✅ |
| 02 | `02-supabase-schema.md` | Supabase provisioning, Tier 1 schema + RLS | ✅ |
| 03 | `03-auth-roles.md` | Auth, role-based routing, middleware | ⬜ |
| 04 | `04-talent-registration.md` | Multi-step talent registration flow | ⬜ |
| 05 | `05-talent-profile-media.md` | Talent profile, comp card, media library | ⬜ |
| 06 | `06-public-portfolio.md` | Public portfolio page, SEO, PDF export | ⬜ |
| 07 | `07-category-management.md` | Category/sub-category admin CRUD | ⬜ |
| 08 | `08-producer-registration.md` | Producer/brand registration & company profile | ⬜ |
| 09 | `09-casting-calls.md` | Casting call creation, management | ⬜ |
| 10 | `10-talent-search.md` | Talent search & advanced filtering | ⬜ |
| 11 | `11-applications-flow.md` | Application flow & status tracking | ⬜ |
| 12 | `12-admin-approval-workflow.md` | Admin approval workflow for talent onboarding | ⬜ |
| 13 | `13-audition-scheduling.md` | Audition scheduling & feedback | ⬜ |
| 14 | `14-notifications.md` | Channel-agnostic notification dispatch (email) | ⬜ |
| 15 | `15-qa-rls-audit.md` | QA pass: RLS audit, validation, rate limiting | ⬜ |
| 16 | `16-tier2-booking.md` | Tier 2: Booking module, contracts, payments | ⬜ |
| 17 | `17-tier2-comms-calendar.md` | Tier 2: WhatsApp/SMS, calendar, messaging | ⬜ |
| 18 | `18-tier2-reports-cms.md` | Tier 2: Reports dashboard, website CMS | ⬜ |
| 19 | `19-tier2-reviews-subscriptions.md` | Tier 2: Reviews, badges, subscription tiers | ⬜ |
| 20 | `20-roadmap.md` | Tier 3 backlog / ROADMAP.md stubs | ⬜ |

---

## Key Constraints (apply to every prompt)

- **Never skip RLS** — every table gets row-level security in the same migration that creates it.
- **Mobile-first** — majority of Pakistani users are on mobile browsers / WhatsApp links.
- **Channel-agnostic notifications** — always route through the dispatch abstraction, never hardcode email.
- **No Tier 3 scaffolding** — stub AI/multi-gateway/mobile features in `ROADMAP.md` only.
- **Design polish** — no generic shadcn defaults; use the intentional design system defined in prompt 01.
