import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) console.warn('[DEBUG] Missing VITE_SUPABASE_URL env');
if (!supabaseAnonKey) console.warn('[DEBUG] Missing VITE_SUPABASE_ANON_KEY env');

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
});
