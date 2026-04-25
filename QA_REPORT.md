# QA_REPORT.md (Updated)

## What polling was added
- Pending authenticated screen (`PendingApprovalScreen`) now:
  - checks immediately on load,
  - polls every 20 seconds,
  - checks again when the tab becomes visible,
  - checks on manual button click (`Check approval status`),
  - cleans up interval/listeners on unmount to avoid leaks.
- Pending-by-email screen (`PendingByEmailScreen`) now also polls every 20 seconds and checks on tab visibility restore.

## Which backend/status source is checked
- Waiting screen uses combined source:
  1) local `profiles.approval_status` read,
  2) `admin-sync` `check_approval` response (which syncs from external admin approvals/entity statuses),
  3) shared normalization utility (`normalizeApprovalStatus`) before decision.

## How approved users are redirected
- If status resolves to approved/accepted/active/verified (normalized to `approved`):
  - success toast shown,
  - `AuthContext.refreshAuth()` is called,
  - role-based redirect applied:
    - blogger/influencer -> `/dashboard`
    - business -> `/dashboard/business`
  - fallback hard session refresh + hard navigation is attempted to prevent stale pending lock.

## How rejected users are handled
- Rejected aliases normalize to `rejected`.
- Waiting screen renders explicit rejected state and keeps dashboard blocked.

## How old stuck users are repaired
- Added migration `20260425150000_harden_access_and_backfill_approved_users.sql`:
  - normalizes old profile approval aliases:
    - accepted/active/verified -> approved
    - denied/blocked -> rejected
  - backfills missing `user_roles` rows from `profiles`.

## Additional fixes validated in this pass
- Removed hardcoded external service-role keys from source code and switched to environment variables for edge functions.
- Removed duplicate registration attempt logging in `register` edge function.
- Added missing `/reset-password` route + page referenced by register flow.
- Tightened campaign RLS visibility to owner/admin + approved-visible-to-blogger policy.
- Reduced profile sensitive-field exposure by revoking `email/phone` column read for anon/authenticated roles.

## Manual test checklist
1. Register blogger -> pending screen -> approve in admin -> auto redirect to `/dashboard` within next poll or manual check.
2. Register business -> pending screen -> approve in admin -> auto redirect to `/dashboard/business`.
3. Keep pending user open > 20s and verify periodic checks continue without duplicate toasts.
4. Switch tab away/back and verify immediate re-check.
5. Click manual check button and verify immediate status refresh.
6. Reject a user in admin and verify rejected UI appears.
7. Existing approved users previously stuck pending should be released after migration + next status refresh.
8. Campaign visibility:
   - business sees own campaigns,
   - blogger sees only approved/active campaigns,
   - pending campaigns do not appear in blogger list.
9. Reset-password email link opens `/reset-password` and allows updating password.
10. Messaging remains scoped to sender/receiver ownership.

## Remaining risks / assumptions
- External admin system connectivity is still required for real-time moderation sync.
- `register` and `check-registration` remain public invocation endpoints by design; further anti-abuse controls (captcha/WAF) should be configured at infra level.
- Admin header shortcut button intentionally left unchanged (temporary design/testing feature).
