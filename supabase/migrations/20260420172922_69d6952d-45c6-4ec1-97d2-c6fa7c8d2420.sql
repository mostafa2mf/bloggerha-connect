-- Restore security_invoker view (the safe pattern)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, username, display_name, avatar_url, bio,
  city, category, role, instagram, followers_count,
  engagement_rate, images, profile_completion,
  approval_status, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- SECURITY DEFINER function to fetch public profile data without exposing sensitive cols
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid, user_id uuid, username text, display_name text,
  avatar_url text, bio text, city text, category text, role text,
  instagram text, followers_count integer, engagement_rate numeric,
  images text[], profile_completion integer, approval_status text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, user_id, username, display_name, avatar_url, bio,
         city, category, role, instagram, followers_count,
         engagement_rate, images, profile_completion,
         approval_status, created_at, updated_at
  FROM public.profiles;
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, username text, display_name text,
  avatar_url text, bio text, city text, category text, role text,
  instagram text, followers_count integer, engagement_rate numeric,
  images text[], profile_completion integer, approval_status text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, user_id, username, display_name, avatar_url, bio,
         city, category, role, instagram, followers_count,
         engagement_rate, images, profile_completion,
         approval_status, created_at, updated_at
  FROM public.profiles
  WHERE user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;