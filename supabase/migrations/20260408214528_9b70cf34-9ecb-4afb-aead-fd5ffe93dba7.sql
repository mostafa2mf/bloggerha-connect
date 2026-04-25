DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for themselves"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);