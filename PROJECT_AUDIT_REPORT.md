# PROJECT_AUDIT_REPORT.md

## 0) Audit scope
This is a **read-first technical audit** of the current `bloggerha-connect` codebase.
No major functional changes were applied in this pass.

---

## 1) Current architecture (high-level)

### Frontend
- Stack: React 18 + TypeScript + Vite + React Router + React Query + Supabase JS client.
- Entry: `src/main.tsx` -> `src/App.tsx`.
- Global providers in `App.tsx`:
  - `QueryClientProvider`
  - `ThemeProvider`
  - `LanguageProvider`
  - `BrowserRouter`
  - `AuthProvider`
  - `TooltipProvider`
- Route gate: `AuthGate` wraps all routes.

### Backend/data
- Primary backend: Supabase (Postgres + RLS + Edge Functions).
- Edge functions in this repo:
  - `register`
  - `check-registration`
  - `admin-sync`
- Data synchronization with an **external admin Supabase project** is done through `admin-sync` and `register` edge functions.

### Admin side
- There is no standalone admin dashboard app in this repository.
- Current “Admin Entry” is a UI modal that routes to `admin_preview=true` query params on blogger/business dashboards.
- Real moderation appears to exist in external admin DB/project and is polled through `admin-sync`.

---

## 2) Frontend routes map

Defined in `src/App.tsx`:
- `/` → landing page
- `/register/blogger` → blogger registration form
- `/register/business` → business registration form
- `/dashboard` → blogger dashboard page shell
- `/dashboard/business` → business dashboard page shell
- `*` → not found

Notes:
- Route protection and role redirect are performed by `AuthGate`.
- `AuthGate` currently checks only exact path matches in `publicPaths` and `protectedPaths` arrays.

---

## 3) User roles map

Role sources in code:
1. `user_roles` table via RPC `get_user_role` in `AuthContext` (used for route targeting).
2. `profiles.role` queried in some components.
3. `user.user_metadata.role` used in some messaging sync payloads.

Canonical intent appears to be `user_roles` (more secure), but role usage is currently mixed across components.

---

## 4) Registration flows (blogger + business)

### Current path
- Register UI (`RegisterForm`) calls edge function `register`.
- `register` function:
  - validates form fields
  - rate limits by IP
  - creates auth user via admin API (`auth.admin.createUser`)
  - updates `profiles`
  - upserts `user_roles`
  - syncs to external admin DB (`influencers`/`businesses` + `approvals`)
  - sends password reset email so user can set password

### Observed behavior
- Both blogger/business are set to local `approval_status = 'pending'` in register function.
- Register form stores email in localStorage to show pending screen on revisit.

---

## 5) Login/auth/session flow

- Auth state managed in `AuthContext` through Supabase session and `onAuthStateChange`.
- Role fetched from RPC `get_user_role`.
- `UserLoginModal` supports role selection + password login and redirects by role.
- Modal signup now routes users to full registration pages (good; no direct auth signup path in modal).

---

## 6) Admin approval flow

### Local gating
- Dashboard layouts (`DashboardLayout`, `BusinessDashboardLayout`) gate access by `profiles.approval_status` (normalized aliases accepted).
- If not approved, pending screen is rendered.

### Sync source
- `checkApproval` in `admin-sync` reads external admin `approvals` and fallback entity status tables.
- Syncs normalized status back to local `profiles.approval_status` or `campaigns.admin_approval_status`.

### Source-of-truth reality
- Practical source-of-truth is **hybrid**:
  - external admin approvals data
  - external entity status fallback
  - local profile fallback
- Local dashboard gating finally depends on `profiles.approval_status` (user) and `campaigns.admin_approval_status + campaigns.status` (campaign visibility).

---

## 7) Blogger dashboard audit

Components: `DashboardLayout`, `DashHome`, `DashCampaigns`, `DashUploadReview`, `DashMessages`, `DashProfile`, etc.

Key findings:
- Access gated by approval check.
- Campaign listing filters on approved/admin-approved campaigns and active lifecycle.
- Applications are created with `applications.status = 'pending'`.
- Messaging tab currently points to admin support chat (`AdminChatPanel`), not blogger↔business inbox.

---

## 8) Business dashboard audit

Components: `BusinessDashboardLayout`, `BizCampaigns`, `CreateCampaignModal`, `BizApplications`, `BizMessages`, etc.

Key findings:
- Access gated by approval check.
- Campaign create/edit sets `admin_approval_status = 'pending'` and lifecycle `status = 'draft'` before admin approval.
- `BizApplications` is based on accepted applications (`applications.status = 'accepted'`).
- Messaging tab is also admin support chat, not business↔blogger direct messaging UX.

---

## 9) Admin dashboard audit

- No dedicated admin dashboard pages/routes in this repository.
- `AdminEntryModal` offers preview routes only (`?admin_preview=true`) that bypass approval gate for local UI preview.
- Real admin moderation appears external and integrated via edge functions.

**Business rule gap:** “Admin must see/manage pending users/campaigns/messages” is not implementable solely from this repo UI.

---

## 10) Campaign creation + approval flow audit

### Intended flow
1. Business creates campaign locally.
2. Campaign syncs to external admin DB.
3. Admin approves in external system.
4. `admin-sync` check updates local `admin_approval_status` and lifecycle status.
5. Blogger dashboard shows approved campaigns only.

### Current risks
- Sync to external admin is non-transactional (best effort). Local success can happen even if external sync fails.
- Frontend filtering is correct-ish, but RLS `SELECT` policy on campaigns is broad (`USING (true)`), so hidden-by-UI only.

---

## 11) Messaging flow audit

### Implemented
- `messages` table + RLS enforces sender/receiver ownership.
- UI currently uses `AdminChatPanel` in both dashboards (user↔admin support).
- `ChatPanel` exists for generic direct chat but is not wired into current dashboard tabs.

### Gaps
- Explicit business↔blogger messaging flow is not currently surfaced in primary UI.
- Admin moderation UI for all conversations is external / not in this repo.

---

## 12) Supabase data model / RLS / triggers / migrations audit

### Core tables inspected
- `profiles`
- `user_roles`
- `campaigns`
- `applications`
- `messages`
- `notifications`
- `upload_reviews`
- `registration_attempts`

### RLS highlights
- `messages`: ownership-based read/write is strong.
- `campaigns`: broad authenticated `SELECT USING (true)` means any authenticated user can read all campaigns regardless of approval; UI filters do the hiding.
- `profiles`: multiple migrations created broad authenticated read; sensitive fields (`email`, `phone`) may be exposed through direct table reads.

### Trigger/function highlights
- `handle_new_user` redefined multiple times in migrations (historical logic drift present).
- campaign count trigger initially used `applications.status='approved'`; later migration corrected to `'accepted'`.
- campaign field tampering function also redefined; behavior changed over time.

### Migration consistency observation
There is significant historical drift, and many corrective migrations layer on top of earlier contradictory assumptions.

---

## 13) Build / deployment / config audit

- Build tool: Vite (`npm run build`).
- Test tool: Vitest (`npm test`).
- No `vercel.json` present in repository root.
- `README.md` is placeholder and does not document build/deploy.
- Edge function config exists in `supabase/config.toml`.

---

## 14) Duplicated / conflicting logic identified

1. Approval/status normalization exists in multiple places (`approvalStatus.ts`, `campaignVisibility.ts`, and edge function internals) with overlapping logic.
2. Role source is split (`user_roles`, `profiles.role`, `user_metadata.role`).
3. Admin approval source is hybrid/fallback logic rather than strict single source.
4. Messaging has two parallel panel paradigms (`AdminChatPanel` in use, `ChatPanel` unused in main dashboard routes).
5. Migrations redefine same trigger functions multiple times, indicating evolving but fragile behavior.

---

## 15) Discovered bugs / risks / security gaps

| ID | Finding | Risk | Exact files involved | Recommended fix |
|---|---|---|---|---|
| A-001 | **Hardcoded external service-role key in repo** (admin DB key embedded in edge functions). | **Critical** | `supabase/functions/register/index.ts`, `supabase/functions/admin-sync/index.ts` | Move keys to Supabase secrets/env vars; rotate leaked keys immediately. |
| A-002 | `register` edge function logs **duplicate rate-limit attempts** (`recordAttempt` called twice). | Medium | `supabase/functions/register/index.ts` | Remove duplicate call; keep single write per request. |
| A-003 | `register` and `check-registration` are set `verify_jwt = false` (public invocation); risk of abuse/spam/enumeration. | High | `supabase/config.toml`, `supabase/functions/register/index.ts`, `supabase/functions/check-registration/index.ts` | Add CAPTCHA/turnstile + stricter throttling; for check endpoint, minimize returned profile info and protect against enumeration. |
| A-004 | Broad campaigns SELECT policy allows all authenticated users to read all campaigns; approval visibility relies on UI filtering. | High | `supabase/migrations/20260408123012_9280eae5-a778-4b4d-a1c9-7c148a668866.sql` (+ later policy migrations) | Replace with role/status-aware RLS for bloggers/business/admin. |
| A-005 | Broad profile read policy can expose sensitive columns via direct table access (`email`, `phone`). | High | `supabase/migrations/20260420172841_8b53a19c-ad3a-44db-a0e5-259d0178b130.sql`, `...20173425...sql` | Restrict table SELECT to owner/admin; expose safe public data via view/function only. |
| A-006 | Reset-password redirect path `/reset-password` is used by register flow but no route/page exists in app. | Medium | `supabase/functions/register/index.ts`, `src/App.tsx` | Add reset-password route/page or update redirect target to existing flow. |
| A-007 | `AuthGate` protects only exact dashboard paths (not future nested routes). | Medium | `src/components/shared/AuthGate.tsx` | Switch to prefix-based protected route logic (`startsWith('/dashboard')`) or route-level guards. |
| A-008 | Messaging role in admin sync uses `user_metadata.role` (mutable) rather than `user_roles`/server-resolved role. | Medium | `src/components/shared/AdminChatPanel.tsx` | Resolve sender role server-side using `auth.uid()` + `user_roles` lookup. |
| A-009 | Admin UI requirements are not fulfilled in this repo; only preview modal exists. | Medium | `src/components/AdminEntryModal.tsx`, dashboard pages | Either document external admin app dependency clearly or implement internal admin dashboard routes/features. |
| A-010 | Status source-of-truth still hybrid (external approvals + entity status + local fallback), potentially masking stale/incorrect state. | Medium | `supabase/functions/admin-sync/index.ts`, dashboard layouts | Define strict precedence contract and audit logs; ideally make one canonical status source per entity type. |
| A-011 | Direct business↔blogger messaging flow is not exposed in current dashboard UX despite existing generic chat component. | Low/Medium | `src/components/dashboard/DashMessages.tsx`, `src/components/business/BizMessages.tsx`, `src/components/shared/ChatPanel.tsx` | Decide product requirement and wire ChatPanel/recipient discovery with permission checks. |
| A-012 | Multiple redefinitions of same triggers/functions across migrations create maintenance risk and onboarding confusion. | Medium | various migration files (`handle_new_user`, `sync_campaign_counts`, `prevent_campaign_field_tampering`) | Consolidate schema state into squashed baseline migration for new environments + document canonical behavior. |

---

## 16) True source of truth (current state)

### Users
- Effective gate: `profiles.approval_status` (frontend checks this).
- Upstream source: external admin `approvals` / entity status, synchronized back via `admin-sync`.

### Campaigns
- Effective gate: `campaigns.admin_approval_status` **and** lifecycle `campaigns.status` visible state.
- Upstream source: external admin approvals, synchronized back via `admin-sync`.

### Applications
- Acceptance source: `applications.status='accepted'`.
- Campaign counters now aligned to `'accepted'` after later migration.

---

## 17) Can old data get stuck?

Yes, historically possible (and partially addressed by normalization migrations):
- alias statuses (`accepted/active/verified`) on profile/campaign approval fields
- campaign lifecycle alias values (`approved/live`)
- older `handle_new_user` logic with business auto-approved
- older `sync_campaign_counts` logic counting `'approved'` instead of `'accepted'`

The added normalization migrations reduce this risk, but long migration history still warrants data validation scripts in production.

---

## 18) Manual test checklist (recommended)

1. Blogger registration (new email) -> pending screen -> admin approve externally -> dashboard unlocked.
2. Business registration (new email) -> pending screen -> admin approve externally -> business dashboard unlocked.
3. Unauthenticated visit to `/dashboard` and `/dashboard/business` redirects to `/`.
4. Blogger tries `/dashboard/business` and business tries `/dashboard`; verify role redirect.
5. Business creates campaign -> appears pending in business dashboard -> not visible in blogger dashboard pre-approval.
6. Admin approves campaign externally -> campaign lifecycle becomes active locally -> appears in blogger dashboard.
7. Blogger applies to campaign -> application status changes through business/admin actions -> counts stay correct.
8. Messaging: user can only read/write own conversations; no cross-user leakage.
9. Rejected user remains blocked from dashboards and sees rejected state.
10. Password reset link from registration lands on a valid app route (currently expected to fail until fixed).

---

## 19) Automated test suggestions

### Unit tests
- Approval status normalization matrix (all aliases).
- Campaign visibility matrix (`admin_approval_status` x `campaign.status`).
- AuthGate path protection including nested dashboard routes.

### Integration/component tests
- Registration form -> edge function mock responses (success/duplicate/validation).
- Pending screen polling + realtime transitions.
- Create campaign flow ensures synced ID equals inserted local ID.
- Dashboards render pending vs approved states correctly by role.

### DB/RLS tests (SQL or Supabase test harness)
- `campaigns` SELECT does not leak pending/rejected campaigns to blogger role.
- `profiles` SELECT does not leak `email/phone` outside owner/admin.
- `messages` ownership guarantees for SELECT/INSERT/UPDATE.

### E2E tests
- Full blogger/business registration->approval->dashboard sequence.
- Campaign moderation lifecycle from business create to blogger visibility.
- Messaging delivery and isolation across roles.

---

## 20) Build verification status in this environment

- `npm test -- ...` currently fails in this container because `vitest` binary is unavailable (dependencies not installed in runtime image).
- `npm run build` currently fails in this container because `vite` binary is unavailable (same root cause).

(Commands and outputs are listed in the final response.)

---

## 21) Next step

Per your instruction, this pass is audit-only.
Please review this report and confirm before I apply fixes.
