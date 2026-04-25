-- Ensure new signups are consistently pending until admin approval.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'blogger');
  username_base text := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  unique_username text := username_base;
  i integer := 0;
BEGIN
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
    i := i + 1;
    unique_username := username_base || '_' || i::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, username, display_name, role, email, approval_status)
  VALUES (
    NEW.id,
    unique_username,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', unique_username),
    user_role,
    NEW.email,
    'pending'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Allow pending/inactive lifecycle statuses used by the app and moderation flow.
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('pending', 'draft', 'active', 'scheduled', 'inactive', 'completed', 'archived'));

-- Normalize historical campaign status aliases and ensure approved campaigns are visible.
UPDATE public.campaigns
SET admin_approval_status = 'approved'
WHERE lower(coalesce(admin_approval_status, '')) IN ('accepted', 'active', 'verified');

UPDATE public.campaigns
SET admin_approval_status = 'rejected'
WHERE lower(coalesce(admin_approval_status, '')) IN ('denied', 'blocked');

UPDATE public.campaigns
SET status = 'active'
WHERE lower(coalesce(status, '')) IN ('approved', 'live');

UPDATE public.campaigns
SET status = 'active'
WHERE admin_approval_status = 'approved' AND status IN ('pending', 'draft');

UPDATE public.campaigns
SET status = 'pending'
WHERE status IS NULL;
