-- Remove the broad SELECT policy; only owner can read raw profiles table.
-- Other users must use profiles_public view (which excludes sensitive columns).
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;

-- The view uses security_invoker, so it needs a policy that lets users read
-- profile rows when accessed THROUGH the view. We use a SECURITY DEFINER
-- function approach instead: recreate the view with security_definer to bypass
-- RLS but only expose non-sensitive columns.
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id, user_id, username, display_name, avatar_url, bio,
  city, category, role, instagram, followers_count,
  engagement_rate, images, profile_completion,
  approval_status, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;