
-- Add phone and email columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone varchar(11),
ADD COLUMN IF NOT EXISTS email varchar(254);

-- Add unique constraint on phone
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Add index on role for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
