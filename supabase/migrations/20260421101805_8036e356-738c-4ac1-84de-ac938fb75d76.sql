-- Add missing columns required by the register edge function
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS full_name text;

-- Allow service role / triggers to bypass approval_status protection when needed.
-- Recreate prevent_role_self_change to allow service_role.
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Service role (used by edge functions) bypasses everything
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Admins bypass
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change role';
  END IF;
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    RAISE EXCEPTION 'Cannot change approval_status';
  END IF;
  RETURN NEW;
END;
$function$;

-- Make sure trigger exists on profiles
DROP TRIGGER IF EXISTS prevent_role_self_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_self_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();