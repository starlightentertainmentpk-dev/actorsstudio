# MASTER BUILD PROMPT — Actor's Studio Talent Marketplace Platform

> Paste this entire document into Antigravity as the project brief. It defines the product, the full module set, the data model, the tech stack, and the build sequence. Build in the phased order given — do not attempt every module simultaneously.

---

## 0. Mission

Build **Actor's Studio**, a production-grade, multi-sided talent marketplace platform for the Pakistani entertainment industry (actors, models, voice artists, dancers, musicians, influencers) that matches the depth and polish of world-class talent agency platforms (comparable in scope to Backstage, Casting Networks, Spotlight, Model Mayhem, and IMDbPro talent tools) — but localized for Pakistan (Urdu/English, PKR pricing, WhatsApp-first comms, local payment rails) with a clear path to regional/international expansion.

Three sides of the marketplace:
1. **Talent** — actors/models/artists who register, build a portfolio, and get discovered/booked.
2. **Studio/Agency staff (Admin)** — vet, approve, and manage talent quality; run the business.
3. **Producers/Brands/Casting Directors** — post casting calls, search talent, book, and pay.

---

## 1. Tech Stack (mandatory)

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion for micro-interactions
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime, pgvector for AI search later)
- **ORM/Schema:** Supabase migrations (SQL) + Drizzle or Supabase-generated types for type-safe queries
- **Media:** Supabase Storage for primary hosting; Cloudinary integration hook (env-gated, optional) for on-the-fly image/video transforms, watermarking, and thumbnailing
- **Payments:** Stripe (international) as primary, with a pluggable payment-provider interface so JazzCash / EasyPaisa can be added without refactoring
- **Comms:** Resend (transactional email) as MVP channel; WhatsApp Business Cloud API and SMS (Twilio or local aggregator) wired behind the same notification-dispatch abstraction so channels can be toggled per event
- **Hosting:** Vercel for frontend (preferred for edge latency/DX) + Supabase Cloud for backend. If Firebase App Hosting is used instead, confirm asia-east1 latency to Pakistan before committing
- **Auth:** Supabase Auth — email/password + Google OAuth for MVP; Facebook/Apple as fast-follow. Role-based access via a `roles` table + Postgres RLS policies enforced from the first migration, not retrofitted
- **Testing:** Vitest/Playwright for critical flows (registration, application, booking, payment)

---

## 2. Roles

`super_admin`, `studio_admin`, `studio_staff` (reviewer), `talent`, `agent_manager` (represents multiple talents), `producer_brand`, `casting_director`. RLS policies must be written per-role from the first schema migration.

---

## 3. Full Module Set

Group modules into three build tiers. Build Tier 1 completely and correctly before touching Tier 2. Do not scaffold Tier 3 UI until Tier 1 has real usage.

### Tier 1 — MVP core loop (build first)
- Auth & role-based routing
- Talent registration (multi-step: personal → professional → social → portfolio) with save-and-resume
- Talent profile & digital comp card (photos, reel/showreel video, voice sample, resume/CV, stats: height/weight/measurements where relevant, languages, skills, union/verification status)
- Media library (photo sets, video reels, self-tape upload) with primary-image selection and ordering
- Public portfolio page per talent — SEO-optimized, shareable URL, printable comp-card export (PDF)
- Category/sub-category system — self-referencing, unlimited nesting, admin-editable (actor, model, voice artist, dancer, musician, influencer, child artist, etc.)
- Casting call creation (producer/studio side) with requirements, compensation, deadline, shoot dates
- Producer/brand registration & company profile with verification badge
- Talent search & filtering (category, gender, age range, city, language, skill tags, availability, experience level, premium/featured status)
- Application flow (talent applies/withdraws, status tracking: Applied → Shortlisted → Audition → Selected/Rejected)
- Admin approval workflow for talent onboarding (Pending → Under Review → Interview Scheduled → Audition Scheduled → Approved → Rejected → Blacklisted → Inactive)
- Basic audition scheduling (time slot, mode: in-person/self-tape/video call, location or link, feedback, score, result)
- Email notifications for key lifecycle events

### Tier 2 — Fast-follow (v1.1–1.3)
- Booking module: offer → contract e-signature → invoice → payment collection → completion
- Commission tracking (agency commission % per booking, auto-calculated, exportable)
- WhatsApp + SMS notifications (Pakistan-first channel), layered onto the same dispatch abstraction from Tier 1
- Unified calendar (auditions, bookings, events) per talent, per studio, per producer
- Basic CRM for producer/agency relationship and follow-up tracking
- In-app messaging (talent ↔ producer ↔ studio) with read receipts
- Reports dashboard: growth, active talent, active producers, application-to-booking conversion, revenue
- Website CMS: homepage, about, blog, editable by admin without redeploys
- Review/rating system (post-booking, both directions) to build trust signals
- Talent verification badges (ID-verified, agency-represented, premium/pro)
- Subscription tiers for talent (free / premium listing with priority placement)

### Tier 3 — Differentiators / longer-term (backlog until data justifies it)
- AI Bio Generator (LLM-assisted profile copywriting)
- AI Talent Recommendation (match producers to talent based on casting call requirements)
- AI Face Search / duplicate-profile detection (embedding pipeline — build only once Tier 1/2 usage data justifies the infra cost)
- Self-tape submission with in-browser recording + auto-upload
- Escrow-style payment holding until booking completion, with dispute resolution workflow
- Referral program (talent-refers-talent, producer-refers-producer)
- Sub-agency / white-label micro-sites for partner agencies operating on the platform
- Mobile apps (React Native, reusing the same API/Supabase layer)
- Training module (workshops, courses) and Events module (auditions/expos calendar)
- Multi-gateway payments (JazzCash, EasyPaisa alongside Stripe), GraphQL/webhooks for external integrations
- Background-check integration hook (optional, jurisdiction-dependent)
- Multi-language UI (Urdu/English toggle at minimum; architecture should allow more locales later)
- Analytics dashboard for talent (profile views, application success rate) and producers (search-to-hire funnel)

---

## 4. Core Data Model (extend as needed, but start here)

```sql
users (id, email, phone, role, status, locale, created_at)
roles (id, name, permissions_json)
talent_profiles (
  id, user_id, full_name, stage_name, dob, gender, city,
  category_id, sub_category_id, experience_years, languages text[],
  skills text[], bio, height_cm, weight_kg, measurements_json,
  verification_status, is_premium, subscription_tier, agent_manager_id
)
agent_managers (id, user_id, agency_name, represents_talent_ids uuid[])
categories (id, name, parent_id)               -- self-referencing
media_assets (id, owner_id, type, url, is_primary, sort_order, uploaded_at)
producer_profiles (id, user_id, company_name, company_type, verified, verification_docs_url)
casting_calls (
  id, producer_id, title, description, category_id, location,
  shoot_date, application_deadline, requirements_json, compensation,
  status
)
applications (id, casting_call_id, talent_id, status, applied_at, withdrawn_at)
auditions (
  id, casting_call_id, talent_id, mode, scheduled_at,
  location_or_link, feedback, score, result
)
bookings (
  id, casting_call_id, talent_id, producer_id, status,
  contract_url, commission_pct, payout_amount, payment_status
)
invoices (id, booking_id, amount, currency, status, due_date, paid_at)
messages (id, sender_id, receiver_id, body, sent_at, read_at)
notifications (id, user_id, channel, type, payload_json, sent_at, read_at)
reviews (id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at)
audit_logs (id, actor_id, action, entity, entity_id, created_at)
```

Notes:
- Every table gets RLS policies scoped to the relevant role(s) in the same migration that creates the table — never as a follow-up patch.
- `verification_status` is a Postgres enum matching the workflow states listed in Tier 1.
- `categories` must support unlimited nesting and full admin CRUD.
- `notifications.channel` is an enum (`email`, `whatsapp`, `sms`, `in_app`) so the dispatch layer can route per-event, per-user-preference.

---

## 5. Design & UX Requirements

- Distinctive visual identity — not a generic shadcn/ui default look. Use an intentional type scale, a color system beyond default Tailwind grays, and considered spacing/motion (Framer Motion for page/section transitions).
- Dark/light theme toggle, persisted per user.
- Fully responsive, mobile-first (majority of Pakistani users will access via mobile browsers/WhatsApp links).
- Public talent portfolio pages must be fast, SEO-indexable (proper metadata, OpenGraph tags for WhatsApp/social sharing previews), and printable as a PDF comp-card.
- Accessibility: semantic HTML, keyboard navigation, sufficient contrast ratios.

---

## 6. Build Sequence for Antigravity

1. Scaffold Next.js 15 + Tailwind + shadcn project structure.
2. Provision Supabase project; write the Tier 1 schema migration (Section 4 tables relevant to Tier 1) with RLS policies inline.
3. Implement auth + role-based routing and middleware.
4. Build talent registration, profile, media library, and public portfolio page.
5. Build category management (admin CRUD).
6. Build producer registration, casting call creation, and talent search/filtering.
7. Build applications flow + admin approval workflow.
8. Build audition scheduling.
9. Wire email notifications via a channel-agnostic dispatch function (so WhatsApp/SMS can be added later without refactor).
10. QA pass: RLS audit, input validation, rate limiting, image optimization, pagination on all list views.
11. Only after Tier 1 is fully working end-to-end, move to Tier 2 modules in the order listed in Section 3.

---

## 7. Explicit Non-Goals for the First Build

Do not build AI matching/face search, multi-gateway payments, mobile apps, white-label sub-agencies, or GraphQL/webhooks in this pass. Stub these as backlog items in the codebase (e.g., a `ROADMAP.md`) rather than scaffolding partial implementations.
