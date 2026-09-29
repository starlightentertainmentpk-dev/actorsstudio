# MASTER PROMPT 1
## World-Class AI-Powered Talent Agency Management SaaS

You are an expert senior full-stack SaaS architect, UI/UX designer, database architect, security engineer and AI application developer.

Build a production-ready, world-class **multi-tenant Talent Agency Management SaaS platform** using:

- Next.js latest stable version
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where appropriate
- Vercel deployment
- Server Actions / Route Handlers where appropriate
- Modern responsive PWA architecture
- AI-ready architecture
- REST/API-ready architecture

Do NOT build a simple demo, template, landing page, or basic CRUD application.

Build a polished commercial SaaS product capable of being offered to professional talent agencies, modeling agencies, casting agencies, creator management companies, entertainment agencies and influencer management companies.

---

# 1. PRODUCT VISION

The product is an end-to-end operating system for talent agencies.

It should manage:

Talent
→ Clients
→ Casting Projects
→ Talent Matching
→ Submissions
→ Auditions
→ Self-Tapes
→ Shortlists
→ Bookings
→ Deals
→ Contracts
→ Invoices
→ Payments
→ Commissions
→ Communication
→ Analytics

The system should also include AI-powered capabilities for:

- Talent matching
- Casting assistance
- Talent profile generation
- Contract analysis
- Email generation
- Client brief analysis
- Search
- Recommendations
- Reporting
- Agency productivity

The application must feel like a premium global SaaS product.

---

# 2. PRODUCT NAME

Use a temporary professional product name:

"TALENTOS"

The architecture must allow the product name, logo, colors and branding to be changed later.

Do not hard-code the brand name throughout the application.

Create centralized branding/configuration.

---

# 3. CORE TECHNOLOGY STACK

Frontend:

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Lucide icons

Backend:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions where appropriate

Deployment:

- Vercel

Validation:

- Zod

Forms:

- React Hook Form

Charts:

- Recharts

Tables:

- TanStack Table

Date handling:

- date-fns

State:

Prefer server state and React Server Components where appropriate.

Use Zustand only when client-side global state is actually required.

---

# 4. DEVELOPMENT PRINCIPLES

Follow these principles throughout the project:

1. Production-ready code.
2. Type-safe code.
3. No unnecessary dependencies.
4. Reusable components.
5. Modular architecture.
6. Secure by default.
7. Responsive by default.
8. Accessibility-conscious UI.
9. Excellent loading states.
10. Excellent empty states.
11. Excellent error handling.
12. No fake functionality presented as completed functionality.
13. No hardcoded business data.
14. No insecure API keys in client-side code.
15. No service-role Supabase key exposed to browser.
16. Use environment variables.
17. Use Row Level Security extensively.
18. Multi-tenant isolation must be enforced at database level.
19. Build reusable UI components rather than duplicating screens.
20. Avoid giant monolithic components.

---

# 5. MULTI-TENANT SAAS ARCHITECTURE

This is extremely important.

The platform will support multiple independent agencies.

Create an organization/tenant architecture.

Example:

Agency A
- users
- talent
- clients
- projects
- deals
- finances

Agency B
- users
- talent
- clients
- projects
- deals
- finances

Agency C
- users
- talent
- clients
- projects
- deals
- finances

Never allow one agency to access another agency's data.

Every organization-owned record must contain:

organization_id

Use Supabase Row Level Security to enforce tenant isolation.

Do NOT rely only on frontend filtering.

---

# 6. USER TYPES

Create role-based access control.

Roles:

SUPER_ADMIN
AGENCY_OWNER
AGENCY_ADMIN
AGENT
CASTING_MANAGER
TALENT_MANAGER
FINANCE_MANAGER
VIEWER
TALENT
CLIENT

Agency staff roles belong to an organization.

Talent users may have access only to their own talent profile and authorized information.

Client users may access only their own organization/client portal data.

Super Admin can manage the entire SaaS platform.

---

# 7. AUTHENTICATION

Implement Supabase Auth.

Support:

- Email/password
- Password reset
- Email verification
- Magic link architecture
- Google OAuth architecture
- Optional 2FA-ready architecture

Authentication screens:

- Login
- Register
- Forgot Password
- Reset Password
- Verify Email
- Accept Invitation
- Account Setup

After authentication:

Determine:

- user
- organization
- role
- onboarding state

Redirect appropriately.

---

# 8. ONBOARDING

Create a professional onboarding wizard.

For Agency Owner:

Step 1:
Agency name

Step 2:
Agency type

Options:

- Talent Agency
- Modeling Agency
- Casting Agency
- Entertainment Agency
- Influencer Agency
- Creator Management
- Sports Talent
- Other

Step 3:
Country

Step 4:
Currency

Step 5:
Timezone

Step 6:
Logo

Step 7:
Agency profile

Step 8:
Invite team

Step 9:
Add first talent

Step 10:
Complete setup

Show onboarding progress.

---

# 9. MAIN APPLICATION LAYOUT

Create a premium SaaS dashboard.

Desktop:

Left sidebar navigation.

Top bar:

- Search
- AI Assistant
- Notifications
- Quick Add
- Help
- User avatar

Sidebar:

Dashboard

Talent
- All Talent
- Shortlists
- Categories
- Availability
- Talent Analytics

Casting
- Projects
- New Casting
- Submissions
- Auditions
- Self-Tapes
- Shortlists

Clients
- Companies
- Contacts
- Leads
- Client Portal

Deals
- Pipeline
- Bookings
- Contracts
- Deliverables

Calendar

Messages

Finance
- Invoices
- Payments
- Commissions
- Expenses

Documents

Reports

AI Assistant

Settings

On mobile use a responsive navigation system.

---

# 10. DASHBOARD

Create a premium executive dashboard.

Top KPI cards:

Total Talent
Active Clients
Active Castings
Upcoming Bookings
Revenue
Agency Commission
Outstanding Payments

Charts:

Revenue Trend
Bookings Trend
Casting Conversion
Talent Performance
Client Revenue
Monthly Commission

Upcoming:

- Auditions
- Bookings
- Contract expirations
- Payment deadlines
- Client follow-ups

Recent activity:

"Sarah submitted a self-tape"

"ABC Production approved John"

"Invoice #INV-1023 was paid"

"Contract expires in 7 days"

---

# 11. TALENT MANAGEMENT

Talent is a core entity.

Create a complete talent profile.

Fields:

Basic:

- First name
- Last name
- Stage name
- Gender
- Date of birth
- Nationality
- Location
- Country
- Languages
- Bio

Physical:

- Height
- Weight
- Hair color
- Eye color
- Shoe size
- Clothing size
- Measurements

Professional:

- Talent categories
- Skills
- Special skills
- Acting experience
- Modeling experience
- Voice-over
- Sports
- Musical skills
- Instruments
- Accents
- Driving license

Professional documents:

- CV
- Passport
- Visa
- Work authorization
- Certifications
- Contracts

Social:

- Instagram
- TikTok
- YouTube
- Facebook
- LinkedIn
- Website

Availability:

- Available
- Unavailable
- Hold
- Booked

Status:

- Active
- Inactive
- Pending Approval
- Suspended
- Archived

---

# 12. TALENT MEDIA LIBRARY

Each talent can have:

- Profile image
- Portfolio images
- Headshots
- Videos
- Reels
- Voice samples
- Introduction videos
- Documents

Use Supabase Storage.

Create organized storage paths.

Example:

organization_id/talent_id/photos
organization_id/talent_id/videos
organization_id/talent_id/documents

Do not expose private storage files publicly.

Use signed URLs where required.

Allow:

- Upload
- Preview
- Download
- Delete
- Reorder
- Set primary image
- Add tags
- Add captions

---

# 13. DIGITAL TALENT PORTFOLIO

Generate public talent pages.

Example:

/talent/john-doe

Allow agency to enable/disable public visibility.

Portfolio includes:

- Photo
- Bio
- Measurements
- Skills
- Experience
- Videos
- Social profiles
- Selected work

Create a beautiful public-facing portfolio.

SEO-ready.

Open Graph metadata.

Share buttons.

QR-code-ready architecture.

---

# 14. TALENT CATEGORIES

Create configurable categories.

Examples:

Actor
Model
Commercial Model
Fashion Model
Fitness Model
Voice Artist
Presenter
Influencer
Content Creator
UGC Creator
Musician
Dancer
Host
Extra
Child Artist

Agencies must be able to create custom categories.

---

# 15. ADVANCED TALENT SEARCH

Build a powerful filtering/search interface.

Filters:

- Name
- Category
- Gender
- Age
- Location
- Height
- Languages
- Skills
- Experience
- Availability
- Social followers
- Previous brands
- Tags
- Status

Use full-text search.

Architect the database so AI semantic search can be added later.

Search results should display beautiful talent cards.

---

# 16. AI TALENT MATCHING

Create an AI-ready talent matching service.

Input:

Client casting brief.

Example:

"Looking for a female lifestyle model aged 22-30, Lahore, fluent English, available October 15-16, commercial experience."

System should analyze:

- Age
- Gender
- Location
- Skills
- Experience
- Availability
- Language
- Category
- Other requirements

Return candidates.

For each candidate show:

Match explanation.

Example:

94% Match

Matched:
✓ Age
✓ Location
✓ Category
✓ English
✓ Commercial experience
✓ Availability

Missing:
— Height not specified

Do not create arbitrary or misleading AI scores.

The scoring algorithm must be transparent/configurable.

Create an AI service abstraction so OpenAI or another LLM provider can be connected through environment variables.

Do not hard-code a specific AI provider throughout the application.

---

# 17. CASTING PROJECTS

Create casting projects.

Fields:

- Project name
- Client
- Brand
- Production company
- Description
- Casting requirements
- Categories
- Roles
- Location
- Shoot dates
- Audition dates
- Submission deadline
- Budget
- Usage rights
- Territory
- Media
- Exclusivity
- Notes
- Status

Statuses:

Draft
Open
Shortlisting
Submitted
Audition
Callback
Selected
Booked
Completed
Cancelled

---

# 18. CASTING PIPELINE

Create Kanban pipeline.

Columns:

New Brief
Searching
Shortlisted
Submitted
Client Review
Audition
Callback
Selected
Offer
Booked
Completed

Drag and drop where practical.

Each candidate card should show:

- Talent photo
- Name
- Match
- Availability
- Status
- Agent
- Client feedback

---

# 19. CASTING SUBMISSIONS

Allow agents to submit talent to clients.

Submission fields:

- Talent
- Casting
- Role
- Proposed fee
- Notes
- Attachments
- Self-tape
- Status

Statuses:

Submitted
Viewed
Shortlisted
Rejected
Audition
Callback
Selected
Booked

Track timestamps.

---

# 20. SELF-TAPE SYSTEM

Build a self-tape workflow.

Agent/client creates self-tape request.

Talent receives notification.

Talent can:

- View instructions
- Upload video
- Record later
- Submit
- Replace submission before deadline

Store:

- Video
- Timestamp
- Submission status
- Notes

Client/agent can:

- Watch
- Comment
- Approve
- Reject
- Shortlist

Create a video review interface.

Do not build browser-based video recording unless technically stable; make upload-first architecture and optionally support recording later.

---

# 21. AUDITIONS

Create auditions.

Fields:

- Date
- Time
- Location
- Online/offline
- Meeting URL
- Instructions
- Contact person
- Status

Calendar integration-ready.

Send notifications.

Track:

Scheduled
Confirmed
Attended
No-show
Rescheduled
Completed

---

# 22. CLIENT CRM

Client entity:

Company
Industry
Website
Country
City
Address
Notes
Status

Contacts:

Name
Position
Email
Phone
WhatsApp
Notes

Track:

- Projects
- Deals
- Bookings
- Revenue
- Invoices
- Payments
- Messages
- Documents

---

# 23. CLIENT PORTAL

Build a separate client experience.

Client login.

Client dashboard:

Active Projects
Pending Approvals
Upcoming Auditions
Shortlisted Talent
Pending Contracts
Invoices

Client can:

- Submit brief
- View talent
- Review submissions
- Review self-tapes
- Shortlist
- Reject
- Request changes
- Approve talent
- Approve quote
- View contracts
- Download documents

Client must never access internal agency notes.

---

# 24. DEAL MANAGEMENT

Create deals.

Deal fields:

- Client
- Project
- Talent
- Deal value
- Agency commission
- Talent fee
- Agent commission
- Expenses
- Currency
- Payment terms
- Start date
- End date
- Status

Pipeline:

Lead
Proposal
Negotiation
Submitted
Approved
Contract
Booked
Production
Completed
Invoiced
Paid
Closed

---

# 25. BOOKING MANAGEMENT

Create booking records.

Fields:

- Talent
- Client
- Project
- Date
- Start time
- End time
- Location
- Fee
- Usage
- Territory
- Media
- Status

Detect scheduling conflicts.

Show warning before confirming conflicting booking.

---

# 26. SMART CALENDAR

Create calendar views:

- Month
- Week
- Day
- Agenda

Filters:

- Talent
- Agent
- Client
- Project
- Booking
- Audition
- Hold
- Availability

Color coding should be configurable.

Do not hard-code colors in business logic.

---

# 27. HOLD SYSTEM

Talent may be placed on hold.

Example:

Client A:
October 15

Client B:
October 15

System should show:

FIRST HOLD
SECOND HOLD

Agents can manage priority.

Prevent accidental double booking.

---

# 28. CONTRACT MANAGEMENT

Create contract templates.

Types:

- Talent representation
- Booking
- Client agreement
- NDA
- Model release
- Appearance release
- Influencer agreement
- Usage rights
- Exclusivity

Use dynamic variables:

{{talent_name}}
{{client_name}}
{{project_name}}
{{fee}}
{{commission}}
{{start_date}}
{{end_date}}

Contract statuses:

Draft
Sent
Viewed
Signed
Rejected
Expired

Create audit trail.

Build e-signature provider abstraction.

Do not implement legally binding signature infrastructure unless connected to a compliant provider.

---

# 29. AI CONTRACT ANALYSIS

Allow users to upload a contract.

AI should extract:

- Parties
- Fees
- Payment terms
- Usage rights
- Territory
- Duration
- Exclusivity
- Cancellation
- Deliverables
- Important dates

Display:

"Key Terms"

"Important Dates"

"Potential Issues to Review"

Never represent AI output as legal advice.

Always show that extracted information should be verified against the original contract.

---

# 30. FINANCE

Create:

Invoices
Payments
Expenses
Commissions

Invoice:

- Invoice number
- Client
- Project
- Booking
- Amount
- Tax
- Discount
- Currency
- Due date
- Status

Statuses:

Draft
Sent
Viewed
Partially Paid
Paid
Overdue
Cancelled

---

# 31. COMMISSION ENGINE

Create configurable commission rules.

Examples:

Agency commission = 20%

Agent commission = 10%

Talent payout = 70%

Allow:

- Percentage
- Fixed amount
- Tiered commission
- Different rates by talent
- Different rates by client
- Different rates by category

Calculate automatically.

Show calculation breakdown.

Example:

Client Fee
$10,000

Agency Commission
$2,000

Talent Amount
$8,000

---

# 32. EXPENSE MANAGEMENT

Track:

Travel
Accommodation
Transport
Photography
Production
Marketing
Other

Each expense can be linked to:

Talent
Project
Booking
Client
Deal

---

# 33. PAYMENT TRACKING

Track:

- Invoice
- Amount due
- Amount paid
- Payment date
- Payment method
- Reference
- Currency

Support partial payments.

Calculate outstanding balance.

---

# 34. MULTI-CURRENCY

Support multiple currencies.

Default currency per organization.

Do not perform automatic exchange-rate conversion unless a reliable exchange-rate API is configured.

Store original transaction currency.

Architecture should support exchange-rate snapshots.

---

# 35. COMMUNICATION SYSTEM

Create internal messaging.

Threads can belong to:

- Talent
- Client
- Project
- Casting
- Deal
- Booking

Create unified activity timeline.

Events:

Email
Message
Note
Status change
Upload
Approval
Contract
Payment

Build provider abstraction for:

Email
SMS
WhatsApp

Do not claim WhatsApp functionality is implemented unless an official API integration is configured.

---

# 36. NOTIFICATIONS

Create notification system.

Channels:

- In-app
- Email-ready
- Push-ready

Events:

New casting
Self-tape request
Booking
Audition
Contract
Payment
Message
Deadline
Availability conflict

Allow notification preferences.

---

# 37. AI AGENCY ASSISTANT

Create a prominent AI Assistant.

User can ask:

"Find five female models available next Friday."

"Show unpaid invoices."

"Which talent has worked with Coca-Cola?"

"Create a shortlist for this casting."

"Summarize this client."

"Draft an email to the client."

"Show contracts expiring this month."

"Which bookings are pending confirmation?"

The assistant must respect user permissions.

Never allow AI to bypass RLS.

AI must retrieve data through secure server-side functions.

---

# 38. AI PROFILE BUILDER

Allow talent/agent to upload:

- CV
- Existing profile
- Notes

AI can suggest:

- Bio
- Skills
- Categories
- Keywords
- Professional summary

User must approve changes before saving.

Never silently overwrite existing profile information.

---

# 39. AI CLIENT BRIEF PARSER

User pastes:

"Need 3 male actors aged 25-35 in Karachi..."

AI converts it into structured fields:

Category
Gender
Age
Location
Skills
Dates
Budget
Languages
Experience

Show extracted information for confirmation.

---

# 40. AI EMAIL GENERATOR

Generate:

- Casting invitation
- Client follow-up
- Talent availability request
- Booking confirmation
- Payment reminder
- Contract reminder
- Audition invitation

User must review before sending.

---

# 41. REPORTING

Create reports:

Talent Revenue
Client Revenue
Bookings
Casting Conversion
Agent Performance
Commission
Outstanding Invoices
Payment Aging
Talent Utilization
Top Clients
Project Profitability

Allow:

- Date range
- Client filter
- Talent filter
- Agent filter
- Category filter

Export architecture:

CSV
PDF-ready

---

# 42. TALENT ANALYTICS

For each talent:

Bookings
Auditions
Selection rate
Revenue
Agency commission
Client rating
Cancellation count
No-shows
Response time

Show trends.

Avoid arbitrary "performance scores" unless the underlying methodology is clearly defined.

---

# 43. ACTIVITY / AUDIT LOG

Track important actions:

Created
Updated
Deleted
Approved
Rejected
Viewed
Downloaded
Signed
Paid
Status changed

Store:

User
Timestamp
Action
Entity
Entity ID
Metadata

Make audit logs immutable to ordinary users.

---

# 44. DOCUMENT MANAGEMENT

Central document library.

Folders/categories:

Contracts
Invoices
Talent Documents
Client Documents
Project Documents
Legal
Other

Search documents.

Permissions.

Signed URLs.

File metadata.

Version-ready architecture.

---

# 45. SEARCH

Global search.

Search:

Talent
Clients
Contacts
Projects
Bookings
Deals
Invoices
Contracts
Documents

Keyboard shortcut:

CMD/CTRL + K

Create command palette.

---

# 46. QUICK ACTIONS

Global "+" button.

Actions:

Add Talent
New Client
New Casting
New Booking
New Deal
Create Invoice
Upload Document
Create Task

---

# 47. TASK MANAGEMENT

Create lightweight tasks.

Fields:

Title
Description
Assigned user
Due date
Priority
Related entity
Status

Statuses:

To Do
In Progress
Completed

Do not turn the application into a generic project management system.

Tasks should primarily support agency workflows.

---

# 48. PUBLIC TALENT DISCOVERY

Create optional public talent directory.

Agency can decide:

- Public
- Private
- Invite only

Public visitors can:

Search
Filter
View profile
Request booking

Booking request should create a lead/brief rather than automatically confirm booking.

---

# 49. SEO

Public pages must be SEO-friendly.

Implement:

- Metadata
- OpenGraph
- Sitemap
- Robots
- Canonical URLs
- Structured data where appropriate

Do not expose private talent information through search engines.

---

# 50. RESPONSIVE DESIGN

Desktop:

Full dashboard.

Tablet:

Condensed sidebar.

Mobile:

Bottom navigation or mobile navigation.

Talent portal should be mobile-first.

Client portal should be responsive.

---

# 51. UI/UX DESIGN DIRECTION

The application must look like a premium modern SaaS.

Design characteristics:

- Clean
- Modern
- Professional
- High information density without feeling crowded
- Excellent typography
- Rounded cards
- Subtle borders
- Soft shadows
- Consistent spacing
- Clear hierarchy
- Excellent empty states
- Professional charts
- Elegant dialogs
- Smooth transitions

Avoid:

- Old-fashioned enterprise UI
- Excessive gradients
- Excessive glassmorphism
- Huge text
- Cartoonish illustrations
- Random colors
- Clutter
- Excessive animations

Use a restrained professional color system.

Provide:

Light mode
Dark mode

Make colors configurable through design tokens.

---

# 52. COMPONENT SYSTEM

Create reusable components:

Button
Input
Select
Combobox
DatePicker
Modal
Drawer
Dropdown
Tabs
Badge
Avatar
Tooltip
DataTable
Kanban
Calendar
Timeline
StatCard
ChartCard
EmptyState
LoadingState
ErrorState
FileUploader
MediaGallery
VideoPlayer
SearchCommand
NotificationCenter

Do not duplicate components across pages.

---

# 53. DATABASE ARCHITECTURE

Create normalized PostgreSQL schema.

Core tables should include at minimum:

organizations
organization_settings
users
organization_members
roles
permissions
talents
talent_categories
talent_category_assignments
talent_skills
talent_availability
talent_media
talent_documents
talent_social_links
clients
client_contacts
client_users
casting_projects
casting_roles
casting_requirements
casting_submissions
auditions
self_tape_requests
self_tape_submissions
shortlists
shortlist_items
deals
bookings
booking_talents
holds
contracts
contract_templates
contract_signatures
invoices
invoice_items
payments
commission_rules
commission_records
expenses
messages
message_threads
notifications
tasks
documents
document_versions
activity_logs
ai_requests
ai_outputs

Add created_at and updated_at where appropriate.

Use UUID primary keys.

Use foreign keys.

Use indexes on:

organization_id
status
created_at
email
client_id
talent_id
project_id

Add indexes based on actual query patterns.

---

# 54. ROW LEVEL SECURITY

RLS is mandatory.

Every organization-owned table must have appropriate policies.

Users should only access records belonging to organizations they are members of.

Talent users:

Only access their own authorized records.

Client users:

Only access records explicitly associated with their client organization and portal permissions.

Super Admin:

Use a secure server-side mechanism.

Never expose Supabase service-role credentials to the client.

Test RLS thoroughly.

---

# 55. STORAGE SECURITY

Supabase Storage buckets:

talent-media
talent-documents
project-files
contracts
invoices
avatars

Private by default.

Use signed URLs.

Do not expose private files through public buckets.

Validate:

File size
MIME type
Extension

---

# 56. SECURITY

Implement:

- RLS
- Secure cookies
- Server-side authorization
- Input validation
- Zod validation
- Rate limiting architecture
- CSRF-aware architecture
- Secure headers
- XSS-safe rendering
- File validation
- Audit logs

Never trust client-side role information.

Always validate permissions server-side.

---

# 57. API ARCHITECTURE

Create clean service layers.

Example:

/lib/services/talent
/lib/services/casting
/lib/services/clients
/lib/services/deals
/lib/services/finance
/lib/services/ai

API routes should not contain huge business logic.

Use service functions.

---

# 58. ERROR HANDLING

Every feature needs:

Loading state
Empty state
Error state
Success feedback

Use toast notifications for appropriate actions.

Never expose raw database errors to users.

Log technical errors server-side.

---

# 59. DEMO DATA

Create a development seed system.

Include:

1 demo agency
10 talents
5 clients
5 casting projects
10 submissions
5 bookings
3 deals
5 invoices
Sample notifications
Sample activities

Clearly mark demo data.

Never mix demo data into production automatically.

---

# 60. SETTINGS

Agency settings:

General
Branding
Currency
Timezone
Commission
Notifications
Roles
Permissions
Talent categories
Contract templates
Invoice settings
Email settings
Storage
Integrations
AI settings

---

# 61. WHITE LABEL

Architecture should support:

Agency logo
Agency name
Brand color
Favicon
Custom email branding
Custom public talent page branding

Prepare custom-domain architecture for future implementation.

Do not implement DNS automation unless required.

---

# 62. SAAS BILLING ARCHITECTURE

Prepare architecture for future subscription billing.

Plans:

Starter
Professional
Business
Enterprise

Possible limits:

Talent count
Users
Storage
AI usage
Clients
Casting projects
Automations

Do not implement payment processing until a provider is configured.

Create subscription-related database architecture but avoid fake billing functionality.

---

# 63. AUTOMATION ENGINE

Design future-ready automation system.

Example:

WHEN:

Casting status = Selected

THEN:

Create booking
Notify talent
Notify agent
Create task
Prepare contract

Another:

WHEN:

Invoice overdue

THEN:

Notify finance manager
Create follow-up task

Another:

WHEN:

Contract expires in 30 days

THEN:

Create reminder

Build reusable event/action architecture.

---

# 64. INTEGRATIONS ARCHITECTURE

Prepare provider abstraction for:

Google Calendar
Microsoft Calendar
Gmail
Outlook
WhatsApp Business API
Twilio
SendGrid/Resend
Stripe
DocuSign
Dropbox
Google Drive

Do not fake integrations.

Only mark integration as active when real credentials/configuration exist.

---

# 65. REALTIME

Use Supabase Realtime where it adds actual value:

- Messages
- Notifications
- Booking status
- Self-tape status
- Client approvals

Do not use realtime unnecessarily.

---

# 66. PERFORMANCE

Optimize for:

Fast dashboard
Fast search
Pagination
Lazy loading
Image optimization
Video streaming
Server components
Caching where appropriate

Never load thousands of records unnecessarily.

Use pagination/infinite loading.

---

# 67. ACCESSIBILITY

Follow accessible UI practices:

- Keyboard navigation
- Proper labels
- Focus states
- Screen reader-friendly controls
- Sufficient contrast
- Semantic HTML

---

# 68. INTERNATIONALIZATION

Prepare architecture for:

English
Urdu
Arabic

But launch the first version in English.

Use translation keys rather than hardcoding all UI strings.

Support:

LTR

Prepare architecture for RTL.

---

# 69. TIMEZONE

Every organization has a timezone.

Store timestamps in UTC.

Display according to organization/user timezone.

Do not store local time as the canonical database timestamp.

---

# 70. AUDITABILITY

Important financial, contract and booking actions must be traceable.

Never permanently overwrite important historical information without recording the change.

---

# 71. AI SAFETY

AI must never:

- Bypass permissions
- Access unauthorized records
- Automatically send important communications without approval
- Automatically modify contracts
- Automatically modify financial records
- Delete records
- Make legal claims
- Invent talent information

AI suggestions must be clearly distinguishable from verified database information.

---

# 72. DASHBOARD UX DETAILS

Dashboard should support:

Drag/reorder widgets architecture.

Widgets:

Revenue
Bookings
Casting
Talent
Invoices
Tasks
Calendar
Notifications

Users can eventually customize dashboard.

---

# 73. TALENT CARD DESIGN

Talent cards should display:

Profile image
Name
Category
Location
Age where permitted
Height where relevant
Availability
Tags
Current status

Actions:

View
Shortlist
Submit
Book
Message

Do not display sensitive information unnecessarily.

---

# 74. CASTING BOARD UX

Make casting visually excellent.

Each talent card:

Photo
Name
Match
Category
Availability
Submission status

Actions:

Shortlist
Submit
Request Self-Tape
Reject
View Profile

---

# 75. MOBILE EXPERIENCE

The mobile experience must not simply shrink desktop UI.

For Talent:

Home
Opportunities
Bookings
Calendar
Messages
Profile

For Agents:

Dashboard
Talent
Casting
Calendar
Messages
More

---

# 76. PWA

Prepare the application as a Progressive Web App.

Manifest.

App icons.

Installable architecture.

Offline-friendly shell where appropriate.

Do not claim full offline database functionality.

---

# 77. SEEDING / TESTING

Create realistic test scenarios.

Test:

- Tenant isolation
- Talent creation
- Client creation
- Casting creation
- Submission
- Booking
- Conflict detection
- Invoice
- Commission
- Contract
- Permissions
- File uploads
- Notifications

---

# 78. ENVIRONMENT VARIABLES

Create:

.env.example

Variables should include placeholders for:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

AI provider configuration

Email provider configuration

Future payment provider configuration

Never commit actual secrets.

---

# 79. VERCEL

Application must be Vercel-ready.

Configure:

- Build
- Environment variables
- Production
- Preview deployments

Avoid dependencies that require persistent local filesystem storage.

All uploaded files must use Supabase Storage.

---

# 80. SUPABASE MIGRATIONS

Create proper migration files.

Do not manually depend on dashboard-only database changes.

Schema should be reproducible.

Include:

Tables
Indexes
Foreign keys
RLS policies
Functions
Triggers

where appropriate.

---

# 81. DATABASE TRIGGERS

Use triggers carefully for:

updated_at
audit events where appropriate
notification events where appropriate

Avoid excessive trigger logic that makes the system difficult to debug.

---

# 82. FINAL UI REQUIREMENT

Every screen must answer:

1. What am I looking at?
2. What needs my attention?
3. What can I do here?
4. What happens next?

Avoid screens that are simply tables of database records.

Use:

Cards
Tables
Timeline
Kanban
Calendar
Charts
Filters
Search
Contextual actions

appropriately.

---

# 83. GLOBAL UX FEATURES

Implement:

Global search
Command palette
Keyboard shortcuts
Quick create
Breadcrumbs
Notifications
Recent items
Favorites-ready architecture
Saved filters
Pagination
Sorting
Filtering
Bulk actions
Confirmation dialogs
Undo where safe
Skeleton loaders
Empty states
Error states

---

# 84. BULK OPERATIONS

Support bulk actions for appropriate entities.

Examples:

Talent:

- Add category
- Change status
- Add tag
- Send message
- Add to shortlist

Casting:

- Submit multiple talent
- Reject multiple submissions

Invoices:

- Mark selected as sent

Do not allow dangerous bulk deletion without strong confirmation.

---

# 85. DATA EXPORT

Agency users should eventually be able to export their data.

Prepare export architecture for:

Talent
Clients
Projects
Bookings
Invoices
Payments

CSV.

Respect permissions.

---

# 86. DELETE / ARCHIVE STRATEGY

Prefer soft deletion/archive for business-critical records.

Examples:

Talent
Clients
Projects
Contracts
Invoices

Use:

deleted_at
archived_at

where appropriate.

Do not permanently delete financial records casually.

---

# 87. FINAL DELIVERABLE

Deliver:

1. Fully functioning Next.js application
2. Supabase schema
3. RLS policies
4. Authentication
5. Multi-tenancy
6. Responsive UI
7. Core Talent module
8. Client module
9. Casting module
10. Booking module
11. Finance foundation
12. AI-ready architecture
13. Storage
14. Notifications
15. Audit logs
16. Seed data
17. Environment example
18. README
19. Deployment instructions
20. Testing instructions

---

# 88. README

Create a professional README explaining:

Project architecture
Technology stack
Local setup
Supabase setup
Environment variables
Database migration
Seed data
Vercel deployment
Storage configuration
Authentication
RLS
AI configuration
Future integrations

---

# 89. FINAL VALIDATION

Before considering the project complete, verify:

Authentication works.

Registration works.

Login works.

Password reset architecture works.

Organization creation works.

Organization isolation works.

RBAC works.

Talent creation works.

Talent media upload works.

Client creation works.

Casting creation works.

Talent submission works.

Shortlisting works.

Availability works.

Booking conflict detection works.

Invoices work.

Commission calculation works.

Notifications work.

Audit logs work.

RLS prevents cross-tenant access.

Responsive layouts work.

No console errors.

No TypeScript errors.

No broken routes.

No fake integrations.

No exposed secrets.

No Supabase service-role key in frontend.

---

# 90. IMPORTANT ANTIGRAVITY EXECUTION INSTRUCTION

Do not merely generate the project specification.

Actually implement the application.

When something is ambiguous, choose the architecture that best supports:

Security
Scalability
Maintainability
Performance
UX
Multi-tenancy

Do not repeatedly ask for confirmation for normal engineering decisions.

Make sensible professional decisions.

Build incrementally.

After completing each phase:

- Run type checking
- Run linting
- Test affected functionality
- Fix errors
- Continue

Do not stop after creating static UI mockups.

The application must be connected to Supabase and use real database operations.

---

# 91. DEVELOPMENT PHASES

Do NOT attempt to build every feature simultaneously.

Build in phases.

## PHASE 1 — FOUNDATION

- Project architecture
- Authentication
- Multi-tenancy
- Organization onboarding
- RBAC
- Dashboard
- Talent management
- Client management
- Supabase Storage
- Basic search

## PHASE 2 — CASTING & BOOKING

- Casting
- Submissions
- Shortlists
- Auditions
- Availability
- Calendar
- Bookings
- Hold system

## PHASE 3 — COMMERCIAL OPERATIONS

- Deals
- Contracts
- Invoices
- Payments
- Commission
- Expenses

## PHASE 4 — PORTALS & COMMUNICATION

- Talent portal
- Client portal
- Messaging
- Notifications
- Activity timeline

## PHASE 5 — AI

- AI Assistant
- AI talent matching
- AI profile builder
- AI brief parser
- AI contract analyzer
- AI email generator

## PHASE 6 — SCALE

- Analytics
- Automation
- Integrations
- White-label
- SaaS billing
- Advanced search
- Public talent marketplace

At every phase:

1. Build database schema.
2. Build RLS.
3. Build server services.
4. Build UI.
5. Connect UI.
6. Test permissions.
7. Test edge cases.
8. Fix errors.
9. Polish UX.
10. Only then move to the next module.

---

# 92. PRIORITY ORDER

When there is a conflict between features, prioritize:

1. Security
2. Data integrity
3. Multi-tenant isolation
4. Core business workflows
5. Performance
6. Usability
7. Visual polish
8. Advanced AI features

Do not sacrifice security or data integrity for visual effects.

---

# 93. START NOW

Start by:

1. Inspecting the existing repository.
2. Determining whether this is a new or existing project.
3. Setting up the Next.js architecture.
4. Installing only required dependencies.
5. Creating the Supabase integration.
6. Designing the database schema.
7. Creating migrations.
8. Creating RLS policies.
9. Creating authentication.
10. Creating organization onboarding.
11. Creating the application shell.
12. Creating the dashboard.
13. Building the Talent module.
14. Testing it end-to-end.

Do not jump directly to AI features.

Build a solid production foundation first.

The final objective is a **world-class, scalable, multi-tenant Talent Agency Operating System**, not a simple talent database.
