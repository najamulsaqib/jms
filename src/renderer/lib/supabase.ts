import { createClient } from '@supabase/supabase-js';

// Set your Supabase credentials via environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
// or replace the fallback strings below with your project URL and anon key.
// Get these from: https://app.supabase.com → Project Settings → API

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
