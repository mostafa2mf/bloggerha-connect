
CREATE OR REPLACE FUNCTION public.get_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'::public.app_role
  ORDER BY created_at ASC
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_id() TO authenticated;
