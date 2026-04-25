-- ============================================
-- Fix #1: Role-checked RLS policies
-- ============================================

-- applications: only bloggers can apply
DROP POLICY IF EXISTS "Bloggers can create applications" ON public.applications;
CREATE POLICY "Bloggers can create applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = blogger_id
    AND public.has_role(auth.uid(), 'blogger')
  );

-- campaigns: only businesses can create
DROP POLICY IF EXISTS "Business can create campaigns" ON public.campaigns;
CREATE POLICY "Business can create campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = business_id
    AND public.has_role(auth.uid(), 'business')
  );

-- upload_reviews: only bloggers can create
DROP POLICY IF EXISTS "Bloggers can create reviews" ON public.upload_reviews;
CREATE POLICY "Bloggers can create reviews"
  ON public.upload_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = blogger_id
    AND public.has_role(auth.uid(), 'blogger')
  );

-- Admins can view/update everything (for moderation)
CREATE POLICY "Admins view all applications"
  ON public.applications FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all applications"
  ON public.applications FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all upload reviews"
  ON public.upload_reviews FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all upload reviews"
  ON public.upload_reviews FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Fix #2: Auto-sync applicants_count / approved_count
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_campaign_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.campaigns
      SET applicants_count = COALESCE(applicants_count, 0) + 1,
          approved_count = COALESCE(approved_count, 0) + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END)
      WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      UPDATE public.campaigns
        SET approved_count = COALESCE(approved_count, 0)
                              + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END)
                              - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END)
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.campaigns
      SET applicants_count = GREATEST(COALESCE(applicants_count, 0) - 1, 0),
          approved_count = GREATEST(COALESCE(approved_count, 0)
                                     - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END), 0)
      WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_campaign_counts_trigger ON public.applications;
CREATE TRIGGER sync_campaign_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_campaign_counts();

-- Re-sync existing data once
UPDATE public.campaigns c SET
  applicants_count = COALESCE((SELECT COUNT(*) FROM public.applications a WHERE a.campaign_id = c.id), 0),
  approved_count   = COALESCE((SELECT COUNT(*) FROM public.applications a WHERE a.campaign_id = c.id AND a.status = 'approved'), 0);

-- ============================================
-- Fix #3: Prevent business from changing admin_approval_status / business_id / counts
-- ============================================

CREATE OR REPLACE FUNCTION public.prevent_campaign_field_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins bypass all restrictions
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.admin_approval_status IS DISTINCT FROM OLD.admin_approval_status THEN
    RAISE EXCEPTION 'Cannot change admin_approval_status';
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
$$;

DROP TRIGGER IF EXISTS prevent_campaign_field_tampering_trigger ON public.campaigns;
CREATE TRIGGER prevent_campaign_field_tampering_trigger
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_campaign_field_tampering();

-- ============================================
-- Bonus: Prevent business from forcing applicants_count via INSERT
-- New campaigns must start at 0 / pending regardless of payload
-- ============================================
CREATE OR REPLACE FUNCTION public.normalize_new_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.admin_approval_status := 'pending';
    NEW.applicants_count := 0;
    NEW.approved_count := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_new_campaign_trigger ON public.campaigns;
CREATE TRIGGER normalize_new_campaign_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_new_campaign();