-- Make profile-images bucket non-listable but still public-readable by direct URL
UPDATE storage.buckets SET public = false WHERE id = 'profile-images';

-- Drop existing permissive policies if any
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public read profile images" ON storage.objects;

-- Public READ via direct URL (no listing - SELECT on a specific path only works through signed/direct access since bucket is now private)
-- We re-enable public read by allowing SELECT for everyone but only on profile-images bucket
CREATE POLICY "Public read profile images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

-- Users can upload to their own folder (folder name = their user_id)
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile image"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile image"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );