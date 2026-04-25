import { createClient } from '@supabase/supabase-js';

const ADMIN_SUPABASE_URL = 'https://iketcqfmrhdpgmbacxpy.supabase.co';
const ADMIN_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZXRjcWZtcmhkcGdtYmFjeHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjcwNzIsImV4cCI6MjA5MTE0MzA3Mn0.rarGwksl07_A5Aiho7skUBmmqmPP3swP96iaveYjyLY';

export const adminSupabase = createClient(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_ANON_KEY);
