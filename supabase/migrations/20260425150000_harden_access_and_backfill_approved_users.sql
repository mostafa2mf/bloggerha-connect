-- 1) Normalize legacy approval aliases so approved users are not stuck.
UPDATE public.profiles
SET approval_status = 'approved'
WHERE lower(coalesce(approval_status, '')) IN ('accepted', 'active', 'verified');

UPDATE public.profiles
SET approval_status = 'rejected'
WHERE lower(coalesce(approval_status, '')) IN ('denied', 'blocked');

-- 2) Ensure role rows exist for existing users (approved + pending + rejected).
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role::public.app_role
FROM public.profiles p
WHERE p.user_id IS NOT NULL
  AND p.role IN ('blogger', 'business', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = p.role::public.app_role
  );

-- 3) Tighten campaign visibility at RLS level.
DROP POLICY IF EXISTS "Active campaigns are viewable by all authenticated users" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns readable by owners/admins" ON public.campaigns;
DROP POLICY IF EXISTS "Approved campaigns readable by bloggers" ON public.campaigns;

CREATE POLICY "Campaigns readable by owners/admins"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (
    auth.uid() = business_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Approved campaigns readable by bloggers"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'blogger')
    AND lower(coalesce(admin_approval_status, '')) IN ('approved', 'accepted', 'active', 'verified')
    AND lower(coalesce(status, '')) IN ('active', 'scheduled', 'approved', 'live')
  );

-- 4) Reduce sensitive data exposure on profiles table.
-- Keep table readable for app behavior, but hide sensitive columns from client roles.
REVOKE SELECT (email, phone) ON TABLE public.profiles FROM anon;
REVOKE SELECT (email, phone) ON TABLE public.profiles FROM authenticated;
