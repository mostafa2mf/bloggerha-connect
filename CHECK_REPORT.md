# Check Report (2026-04-25)

## 1) Registration flow
- Registration is server-driven via Supabase Edge Function `register`.
- Validation includes required profile fields, email/phone format, Instagram normalization, duplicate checks, and IP rate limiting.
- On success, an auth user is created, profile row is updated with `approval_status = 'pending'`, user role is upserted in `user_roles`, and admin sync is attempted as non-fatal.

## 2) Admin approval action
- Approval state is fetched from admin DB in `admin-sync` (`check_approval`) and synchronized back to local `profiles.approval_status` / `campaigns.admin_approval_status`.
- Pending screens subscribe to realtime profile updates and also poll the admin sync endpoint as fallback.

## 3) User status field
- User status is represented by `profiles.approval_status`.
- Dashboard layouts gate access to dashboard content unless status is `approved`.

## 4) Dashboard route protection
- Added explicit unauthenticated route protection in `AuthGate`.
- Unauthenticated visitors are now redirected from `/dashboard` and `/dashboard/business` to `/`.
- Added role-route normalization so authenticated users are redirected to the dashboard route matching their role.

## 5) Auth/session refresh
- Session state is centralized in `AuthContext` through `supabase.auth.onAuthStateChange` plus initial `getSession()` hydration.
- This keeps auth/session state synchronized after token/session refresh events emitted by Supabase.

## 6) Database tables for users and applications
- `profiles` (user app profile data) and `applications` both exist and are covered by migrations.
- Found a schema logic mismatch: campaign aggregation function counted `applications.status = 'approved'`, while the applications enum/check uses `'accepted'`.
- Added migration to align aggregation/count resync with `'accepted'`.
