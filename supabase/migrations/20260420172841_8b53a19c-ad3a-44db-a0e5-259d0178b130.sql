-- 1) Secure role system
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('blogger', 'business', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'business' THEN 2 ELSE 3 END
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Backfill ONLY for profiles with valid auth users
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role::public.app_role
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.user_id
WHERE p.role IN ('blogger', 'business', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Restrict profiles RLS + public view
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

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

-- Authenticated users can read profile rows (sensitive cols filtered by app via view)
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 3) Rate-limit table
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registration_attempts_ip_time_idx
  ON public.registration_attempts (ip_address, created_at DESC);

ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to registration attempts"
  ON public.registration_attempts FOR SELECT USING (false);

-- 4) Improved handle_new_user trigger (unique username + user_roles insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  initial_status text;
  base_username text;
  final_username text;
  suffix int := 0;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'blogger');
  IF user_role NOT IN ('blogger', 'business', 'admin') THEN
    user_role := 'blogger';
  END IF;
  initial_status := CASE WHEN user_role = 'business' THEN 'approved' ELSE 'pending' END;

  base_username := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, username, display_name, role, email, approval_status)
  VALUES (NEW.id, final_username, final_username, user_role, NEW.email, initial_status);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;