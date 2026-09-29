# Sub-Prompt Index — World-Class Talent Agency Operating System (TALENTOS / Actor's Studio)

> **Important Instruction for Antigravity & Developers:**  
> This directory (`subprompts2/`) contains 10 sequentially structured, production-ready build prompts derived from `masterprompt1.md`.  
> **CRITICAL RULE:** We are **ADDING** to the existing Actor's Studio Next.js application, **NOT** rebuilding from scratch.  
> Every prompt builds directly on existing tables (`users`, `talent_profiles`, `producer_profiles`, `casting_calls`, `applications`, `auditions`, `categories`, `media_assets`, `notifications`, `audit_logs`), existing components (`DashboardShell`, `Sidebar`, `RoleGuard`, `Navbar`), existing Supabase SSR client utilities (`src/lib/supabase/server.ts`, `client.ts`), and existing routes.

---

## 🏗️ Architectural Foundation & Stack Alignment

The project currently runs on:
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS v4 + shadcn/ui + Lucide icons + Framer Motion
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) + Supabase Auth SSR
- **State & Data Fetching:** Server Components + Server Actions + `@tanstack/react-query`
- **Validation:** Zod v4 + React Hook Form
- **Documents & Media:** `@react-pdf/renderer` (PDF comp cards/invoices) + Supabase Storage private buckets + signed URLs
- **Testing:** Vitest + jsdom + Testing Library

---

## 🗺️ Build Order & Sub-Prompt Roadmap

| # | File | Domain | Key Deliverables | Status |
|---|------|--------|------------------|:------:|
| 00 | `00-project-overview.md` | Master Index | Architecture overview, dependency graph, execution rules | ✅ |
| 01 | `01-multi-tenant-organizations.md` | Multi-Tenancy & Branding | Organizations, agency onboarding wizard, dynamic branding tokens, tenant RLS | ✅ |
| 02 | `02-client-crm-and-contacts.md` | Client CRM & Accounts | Client companies, primary contacts, CRM dossiers, interaction timeline, task management | ⬜ |
| 03 | `03-client-portal.md` | Dedicated Client Portal | `/client/*` dashboard, submission review, self-tape watch room, brief intake, strict data boundary | ⬜ |
| 04 | `04-casting-pipeline-and-submissions.md` | Visual Kanban Pipeline | Multi-stage casting Kanban board, candidate submission workflow, pitch drawer, bulk actions | ⬜ |
| 05 | `05-self-tape-system-and-video-review.md` | Self-Tape Media Suite | Self-tape request workflow, talent video upload with progress, agency/client video review player | ⬜ |
| 06 | `06-deals-and-hold-system.md` | Deals & Hold Engine | Commercial deal pipeline, First/Second Hold priority manager, booking conflict detection engine | ⬜ |
| 07 | `07-smart-agency-calendar-and-availability.md` | Smart Agency Calendar | Unified multi-entity calendar (auditions, bookings, holds), talent availability blackout scheduler | ⬜ |
| 08 | `08-contract-management-and-esignatures.md` | Contracts & Vault | Dynamic variable template engine, contract lifecycle, e-signature abstraction, documents library | ⬜ |
| 09 | `09-finance-invoicing-and-commission-engine.md` | Finance & Commissions | Automated commission splits, multi-currency invoicing, partial payments, downloadable PDF invoices | ⬜ |
| 10 | `10-ai-agency-assistant-and-matching.md` | AI Agency Intelligence | Provider-agnostic AI service, casting match score & breakdown, brief parser, contract analyzer, Cmd+K | ⬜ |

---

## 🔒 Non-Negotiable Core Engineering Principles

1. **Strictly Additive Migrations:**  
   Always add new migrations sequentially in `supabase/migrations/` (e.g., `0005_*.sql`, `0006_*.sql`). **NEVER** drop or truncate existing production tables (`users`, `talent_profiles`, `producer_profiles`, etc.). All new foreign keys to existing tables must use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately.
2. **Multi-Tenant Row Level Security (RLS):**  
   Every new table must have RLS enabled in the same migration that creates it. Tenant isolation is enforced at the database level using `organization_id` checking against `organization_members` for authenticated users.
3. **No Hardcoded Branding:**  
   All agency names, logos, colors, and headers must resolve through `src/lib/branding.ts` or organization settings, maintaining multi-agency white-label capability.
4. **Client Boundary Protection:**  
   Client portal users (`role: 'client'`) must **never** be able to query or see agency internal notes, proposed talent markup margins, or internal commission splits.
5. **No Fake Integrations or Mocked Loops:**  
   Database writes must go to Supabase. Storage uploads must go to real Supabase Storage buckets. File downloads and video streams must use authenticated signed URLs.
6. **Next.js 16 & React 19 Compatibility:**  
   Follow current App Router conventions (async request headers/cookies, proper Server Action signatures, correct `'use server'` and `'use client'` boundaries). Heed Next.js deprecation notices.
