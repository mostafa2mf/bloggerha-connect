-- Normalize local approval status values to match dashboard gate expectations.
-- Dashboard access uses profiles.approval_status = 'approved'.

-- 1) Normalize profiles.approval_status synonyms to canonical values.
UPDATE public.profiles
SET approval_status = 'approved'
WHERE lower(coalesce(approval_status, '')) IN ('accepted', 'active', 'verified');

UPDATE public.profiles
SET approval_status = 'rejected'
WHERE lower(coalesce(approval_status, '')) IN ('denied', 'blocked');

-- 2) Normalize campaign admin approval synonyms as well.
UPDATE public.campaigns
SET admin_approval_status = 'approved'
WHERE lower(coalesce(admin_approval_status, '')) IN ('accepted', 'active', 'verified');

UPDATE public.campaigns
SET admin_approval_status = 'rejected'
WHERE lower(coalesce(admin_approval_status, '')) IN ('denied', 'blocked');

-- 3) Keep user role table aligned for any profile row missing user_roles backfill.
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role
FROM public.profiles p
WHERE p.user_id IS NOT NULL
  AND p.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
      AND ur.role = p.role
  );
