You are acting as a senior product designer and frontend engineer doing a full UI/UX and theming audit and upgrade of [APP NAME]. Work in two stages: AUDIT first, then IMPLEMENT. Do not skip straight to changing code before the audit is presented and approved.

Stage 1 — Full UI/UX Audit

Go through every screen and flow in the app and produce a written report covering:

Visual consistency — inconsistent spacing, colors, font sizes/weights, button styles, icon sets, border radii, shadows across the app. Flag every screen/component that doesn't follow a consistent system.
Design system gaps — is there a defined set of design tokens (colors, spacing scale, typography scale) at all, or is styling ad-hoc per component? Flag hardcoded values that should be tokens.
Navigation & information architecture — is it obvious where things are? Flag confusing menus, buried features, inconsistent back/close behavior, unclear active states.
Responsiveness — check every screen at mobile, tablet, and desktop widths. Flag broken layouts, overflow, unreadable text, touch targets that are too small.
Accessibility — color contrast ratios (WCAG AA at minimum), missing alt text, missing form labels, keyboard navigation, focus states, screen-reader landmarks.
Empty/loading/error states — does every list, table, and form have a real empty state, loading state, and error state — or do they just show blank/broken?
Feedback & affordance — are clickable things obviously clickable? Do actions (save, delete, submit) give clear success/failure feedback? Are destructive actions confirmed?
Performance-perceived UX — skeleton loaders vs. spinners vs. nothing, layout shift on load, unnecessary full-page reloads where a partial update would do.
Content/microcopy — inconsistent tone, unclear labels/buttons ("Submit" vs "Save" vs "OK" used inconsistently), missing helper text on complex fields.

Output the audit as a prioritized table: Issue → Screen/Component → Severity (Critical/High/Medium/Low) → Effort (S/M/L) → Recommendation. Include screenshots or component references where possible.

Stop after the audit and wait for confirmation before implementing.

Stage 2 — Theme, UI & UX Implementation

Once the audit is approved, implement the following, each as a self-contained, reviewable change:

A. Design System / Theme Foundation
Define a proper design token set: color palette (primary, secondary, neutral scale, semantic colors for success/warning/error/info), typography scale (font family, sizes, weights, line heights), spacing scale, border radius scale, shadow/elevation scale.
Centralize these as theme variables (CSS variables / Tailwind config / theme object — whatever fits the stack) so they're changed in one place, not hunted down component-by-component.
Support light and dark mode if not already present, using the same token system so both modes stay in sync automatically.
Apply the token system consistently across every existing screen — this is the pass that actually removes the hardcoded one-off values found in the audit.
B. Component Library Consistency
Standardize core components to a single implementation each: buttons (primary/secondary/danger/ghost variants), inputs, selects, checkboxes/radios, modals/dialogs, toasts/notifications, tables, cards, badges/tags, tabs, pagination.
Every instance of a given component type in the app should use the shared component, not a locally re-implemented variant.
Define clear interactive states for each: default, hover, focus, active, disabled, loading, error.
C. Navigation & Layout
Consistent, predictable navigation structure (sidebar/topbar/breadcrumbs as appropriate to this app) with clear active/current-page indication.
Consistent page layout patterns: page header with title + primary action, consistent content width/padding, consistent placement of filters/search relative to content.
Improve any flows flagged as confusing in the audit — reduce clicks to reach frequently used actions.
D. Responsive & Cross-Device Polish
Fix every responsiveness issue flagged in the audit at mobile, tablet, and desktop breakpoints.
Ensure touch targets meet minimum size on mobile, tables/dense data views degrade gracefully on small screens (card view, horizontal scroll with sticky first column, or similar — pick what fits the data).
Verify no layout breaks at common breakpoints (not just resizing the browser — test on the actual target devices/emulators if available).
E. Accessibility Pass
Fix contrast issues to meet WCAG AA.
Add missing alt text, form labels, and ARIA attributes where needed.
Ensure full keyboard navigability (tab order, visible focus states, modals trap focus and close on Escape).
Verify with a screen reader on at least the primary flows.
F. States & Feedback
Add real empty states (with a clear next action, not just "No data") to every list/table currently missing one.
Add skeleton loaders or consistent loading indicators to replace blank screens/spinners-only where it improves perceived performance.
Standardize error states — inline field errors, toast/banner for action failures, a proper 404/500 page instead of a broken screen.
Add confirmation dialogs to destructive actions (delete, deactivate, bulk actions) and success feedback (toast/inline) after actions complete.
G. Microcopy & Polish
Standardize button/label wording across the app (pick one term per action and use it everywhere).
Add helper text/tooltips to non-obvious fields or settings.
Final visual QA pass: alignment, consistent icon sizing, consistent spacing rhythm, no orphaned/inconsistent one-off styles left behind.
Delivery expectations
Implement in the order: Design tokens/theme foundation → Component library consistency → Navigation/layout → Responsive fixes → Accessibility → States/feedback → Microcopy/final polish.
Each phase should be a separately reviewable set of changes with a short summary and, where practical, before/after screenshots.
Flag anywhere a decision needs product/brand input (e.g. "which color is primary vs. accent?") rather than silently assuming.
Do not change underlying functionality/business logic — this is a visual and interaction-layer upgrade on a live app, not a rewrite.