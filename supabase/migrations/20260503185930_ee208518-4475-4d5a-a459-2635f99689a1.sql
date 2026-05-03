
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejected_at timestamptz DEFAULT NULL;
