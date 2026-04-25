-- Align campaign approved_count aggregation with applications.status enum.
-- applications.status valid terminal acceptance value is 'accepted', not 'approved'.

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
          approved_count = COALESCE(approved_count, 0) + (CASE WHEN NEW.status = 'accepted' THEN 1 ELSE 0 END)
      WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      UPDATE public.campaigns
        SET approved_count = COALESCE(approved_count, 0)
                              + (CASE WHEN NEW.status = 'accepted' THEN 1 ELSE 0 END)
                              - (CASE WHEN OLD.status = 'accepted' THEN 1 ELSE 0 END)
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.campaigns
      SET applicants_count = GREATEST(COALESCE(applicants_count, 0) - 1, 0),
          approved_count = GREATEST(COALESCE(approved_count, 0)
                                     - (CASE WHEN OLD.status = 'accepted' THEN 1 ELSE 0 END), 0)
      WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Re-sync existing values to avoid stale counts.
UPDATE public.campaigns c
SET applicants_count = COALESCE((SELECT COUNT(*) FROM public.applications a WHERE a.campaign_id = c.id), 0),
    approved_count = COALESCE((SELECT COUNT(*) FROM public.applications a WHERE a.campaign_id = c.id AND a.status = 'accepted'), 0);
