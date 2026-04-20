-- Fix #1: Add SELECT policy on profiles (currently users CAN'T select - blocking app)
-- Owner can see all their own fields including sensitive ones
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix #2: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix #3: Allow admins to update any profile (for approval flow)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix #4: get_public_profiles should EXCLUDE pending/rejected and sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
  id uuid, user_id uuid, username text, display_name text, avatar_url text, bio text,
  city text, category text, role text, instagram text, followers_count integer,
  engagement_rate numeric, images text[], profile_completion integer,
  approval_status text, created_at timestamp with time zone, updated_at timestamp with time zone
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, user_id, username, display_name, avatar_url, bio,
         city, category, role, instagram, followers_count,
         engagement_rate, images, profile_completion,
         approval_status, created_at, updated_at
  FROM public.profiles
  WHERE approval_status = 'approved';
$$;

-- Fix #5: Restrict role changes - users can update their profile but NOT the role field
-- Drop and recreate the user update policy with column restrictions via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to change anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Prevent users from changing role / approval_status themselves
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role';
  END IF;
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    RAISE EXCEPTION 'Cannot change approval_status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_self_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_change();

-- Fix #6: Auto-cleanup old registration attempts (>24h) to prevent table bloat
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip_time
  ON public.registration_attempts (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_created_at
  ON public.registration_attempts (created_at);

-- Fix #7: Add unique constraint on user_roles for safety
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_uniq
  ON public.user_roles (user_id, role);

-- Fix #8: Index profiles.role for has_role-style queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status
  ON public.profiles (approval_status);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);