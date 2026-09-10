You are acting as a senior staff engineer and security architect doing a full enterprise-readiness audit and upgrade of [APP NAME]. Work in two stages: AUDIT first, then IMPLEMENT. Do not skip straight to writing code before the audit is presented and approved.

Stage 1 — Full Application Audit

Review the entire codebase, database schema, API surface, and infrastructure config. Produce a written report covering:

Architecture review — module boundaries, coupling, dead code, inconsistent patterns, missing abstractions (service layer, repository layer, DTOs/validation).
Security posture — go through the OWASP Top 10 explicitly (injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, vulnerable dependencies, insufficient logging/monitoring) and flag every instance found in this codebase, with file/line references.
Data integrity — missing DB constraints, transactions, race conditions, N+1 queries, unindexed lookups.
Observability gaps — what happens today when something breaks in production? Is there any logging, tracing, or alerting?
Operational gaps — backups, rollback strategy, environment separation (dev/staging/prod), secrets management, CI/CD.
Feature gaps vs. what's requested below — map each requested feature area to current state (absent / partial / present).

Output the audit as a prioritized table: Issue → Severity (Critical/High/Medium/Low) → Effort (S/M/L) → Recommendation.

Stop after the audit and wait for confirmation before implementing.

Stage 2 — Enterprise Feature Implementation

Once the audit is approved, implement the following, each as a self-contained module so it can be reviewed and merged independently.

A. Error Reporting & Monitoring
Centralized error capture on both frontend and backend (uncaught exceptions, unhandled promise rejections, API 5xx responses) — wire into a service like Sentry, or a self-hosted equivalent if no third-party SaaS is wanted.
Structured logging (JSON logs, correlation/request IDs threaded through every request) instead of ad-hoc console.log.
Alerting rules for error-rate spikes, latency spikes, and downtime, routed to email/WhatsApp/Slack.
A lightweight internal "system health" dashboard: error rate, response times, uptime, last N errors.
B. Reporting Module
A generic, reusable reporting engine — not one-off queries per report. Define reports declaratively (data source, filters, grouping, columns) so new reports don't require new UI each time.
Standard report types: activity/audit logs, usage summaries, financial/transactional summaries (if applicable), user/tenant summaries — scope to what's relevant for [APP NAME].
Filters: date range, entity, status, user/tenant, with saved filter presets.
Export to PDF and Excel/CSV.
Print support: a dedicated print-friendly view (clean print CSS — no nav/sidebar, page breaks that don't split rows, header/footer with report title, date range, and page numbers). Verify actual browser print output, not just screen rendering.
Scheduled/recurring reports (e.g. emailed daily/weekly digest) if relevant to this app.
C. Ticketing System (Errors + Feature Requests)
A lightweight internal ticketing module — does not need to be a separate product, just a proper module in this app.
Ticket types: Bug/Error, Feature Request, Support/Other.
Auto-create a ticket from captured errors (link back to the error-reporting stack trace/context) so production errors surface as actionable tickets, not just log noise.
Manual ticket creation for users/admins to report issues or request features.
Fields: title, description, type, severity/priority, status (Open/In Progress/Resolved/Closed/Won't Fix), assignee, reporter, created/updated timestamps, comments/activity thread, attachments (screenshots).
Status workflow with notifications on status change (email/WhatsApp/in-app).
Admin view: filterable/sortable ticket list, basic SLA indicators (e.g. "open > 48h" flag).
D. Security Hardening
Authentication: enforce strong password policy, rate-limit login attempts, add account lockout/backoff, support MFA/2FA if not present, secure session/token handling (short-lived access tokens + refresh tokens, httpOnly/secure cookies where applicable).
Authorization: proper role-based access control (RBAC) enforced server-side on every endpoint, not just hidden in the UI. Audit for broken object-level authorization (users accessing/modifying other users' or tenants' data by changing an ID).
Input validation: server-side validation/schema enforcement on every input, parameterized queries everywhere (no string-concatenated SQL), output encoding to prevent XSS.
Transport & storage: enforce HTTPS/TLS everywhere, encrypt sensitive data at rest, never log secrets or full sensitive payloads.
Abuse & bot protection: rate limiting on all public endpoints, CAPTCHA or equivalent on public forms (signup, login, contact), request throttling, WAF-style protections against common attack patterns (SQLi, XSS, path traversal payloads) at the app or reverse-proxy layer.
Dependency hygiene: scan for known-vulnerable dependencies, pin/update, add this scan to CI so it runs automatically.
Secrets management: no secrets in source control; environment-based config with a documented rotation process.
Audit logging: who did what, when — for sensitive actions (login, permission changes, data exports, deletions) — stored immutably enough to be trustworthy in an incident review.
Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. on all responses.
Produce a short penetration-test-style checklist at the end so this can be periodically re-verified without redoing the whole audit.
E. Other Enterprise-Grade Baseline Features

Include whichever of these are genuinely missing and relevant to [APP NAME]:

Multi-environment config (dev/staging/prod) with clear separation of secrets and data.
Automated backups with a tested restore procedure, not just "backups exist."
CI/CD pipeline: lint, test, build, deploy gates — nothing reaches production without passing checks.
API documentation (OpenAPI/Swagger) if the app exposes an API.
Health-check endpoint (/health) for uptime monitoring.
Notification system (email/WhatsApp/SMS as relevant) centralized rather than scattered across the codebase.
Feature flags for safely rolling out new functionality.
Data export/portability for users or tenants who need their own data out.
Basic terms/privacy/consent handling if the app collects personal data.
Delivery expectations
Implement in the order: Audit → Security fixes (critical/high first) → Error reporting/monitoring → Ticketing → Reporting module → remaining baseline features.
Each phase should be a separately reviewable set of changes with a short summary of what changed and why.
Flag anywhere a decision needs product input (e.g. "should tickets be visible to end-users or admin-only?") rather than silently assuming.
Do not remove or break existing functionality — this is additive/hardening work on a live app, not a rewrite.