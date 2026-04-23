-- Allow business owners to resubmit an inactive/rejected campaign for re-approval.
-- Owners may reset admin_approval_status back to 'pending' ONLY when the
-- campaign is currently inactive (rejected or owner-deactivated). Approved/active
-- changes still remain admin-only.
CREATE OR REPLACE FUNCTION public.prevent_campaign_field_tampering()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admins bypass all restrictions
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.admin_approval_status IS DISTINCT FROM OLD.admin_approval_status THEN
    -- Allow owner to resubmit a rejected or inactive campaign for re-approval
    IF auth.uid() = OLD.business_id
       AND NEW.admin_approval_status = 'pending'
       AND OLD.admin_approval_status IN ('rejected')
    THEN
      -- allowed
      NULL;
    ELSIF auth.uid() = OLD.business_id
       AND NEW.admin_approval_status = 'pending'
       AND OLD.status IN ('inactive', 'archived', 'completed')
    THEN
      -- allowed: owner is reactivating a deactivated campaign
      NULL;
    ELSE
      RAISE EXCEPTION 'Cannot change admin_approval_status';
    END IF;
  END IF;
  IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'Cannot change business_id';
  END IF;
  IF NEW.applicants_count IS DISTINCT FROM OLD.applicants_count THEN
    RAISE EXCEPTION 'Cannot change applicants_count manually';
  END IF;
  IF NEW.approved_count IS DISTINCT FROM OLD.approved_count THEN
    RAISE EXCEPTION 'Cannot change approved_count manually';
  END IF;
  RETURN NEW;
END;
$function$;