import { createClient } from '@supabase/supabase-js';

const ADMIN_SUPABASE_URL = import.meta.env.VITE_ADMIN_SUPABASE_URL;
const ADMIN_SUPABASE_ANON_KEY = import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY;

if (!ADMIN_SUPABASE_URL || !ADMIN_SUPABASE_ANON_KEY) {
  // This client is optional and currently not used in the main flow.
  // Keep a safe fallback that doesn't embed secrets in source.
  console.warn('Admin Supabase client env vars are missing (VITE_ADMIN_SUPABASE_URL / VITE_ADMIN_SUPABASE_ANON_KEY).');
}

export const adminSupabase = createClient(
  ADMIN_SUPABASE_URL || 'https://invalid.local',
  ADMIN_SUPABASE_ANON_KEY || 'invalid-key',
);
