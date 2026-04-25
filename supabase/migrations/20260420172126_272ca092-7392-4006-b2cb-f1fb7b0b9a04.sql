-- 1) Unique constraint on phone (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique 
  ON public.profiles (phone) 
  WHERE phone IS NOT NULL;

-- 2) Index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx 
  ON public.profiles (email);

-- 3) Fix handle_new_user trigger to respect approval_status based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
  initial_status text;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'blogger');
  -- Bloggers need admin review, businesses are auto-approved
  initial_status := CASE WHEN user_role = 'business' THEN 'approved' ELSE 'pending' END;
  
  INSERT INTO public.profiles (user_id, username, display_name, role, email, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    user_role,
    NEW.email,
    initial_status
  );
  RETURN NEW;
END;
$function$;