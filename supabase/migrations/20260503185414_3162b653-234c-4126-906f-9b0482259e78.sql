
-- Allow admin-role users to see ALL messages
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admin-role users to insert messages on behalf of virtual admin
CREATE POLICY "Admins can send messages as admin"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admin-role users to update any message (mark read etc)
CREATE POLICY "Admins can update all messages"
ON public.messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
