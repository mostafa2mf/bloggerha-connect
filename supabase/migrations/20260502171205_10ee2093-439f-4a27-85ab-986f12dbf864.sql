-- Fix contact_submissions: replace overly permissive INSERT policy
-- We need anon access for contact form, but add basic validation
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can insert contact submissions with validation"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) > 0 AND char_length(name) <= 200
    AND char_length(email) > 0 AND char_length(email) <= 320
    AND char_length(message) > 0 AND char_length(message) <= 5000
  );

-- Revoke anon EXECUTE on SECURITY DEFINER functions that should not be public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.normalize_new_campaign() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_campaign_field_tampering() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_campaign_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;