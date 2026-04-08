-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Upload Reviews table
CREATE TABLE public.upload_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blogger_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.upload_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bloggers can view their own reviews"
ON public.upload_reviews FOR SELECT
TO authenticated
USING (auth.uid() = blogger_id);

CREATE POLICY "Bloggers can create reviews"
ON public.upload_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blogger_id);

CREATE POLICY "Business can view reviews for their campaigns"
ON public.upload_reviews FOR SELECT
TO authenticated
USING (campaign_id IN (SELECT id FROM campaigns WHERE business_id = auth.uid()));

CREATE TRIGGER update_upload_reviews_updated_at
BEFORE UPDATE ON public.upload_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add approval_status to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending';

-- Add admin_approval_status to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS admin_approval_status TEXT NOT NULL DEFAULT 'pending';