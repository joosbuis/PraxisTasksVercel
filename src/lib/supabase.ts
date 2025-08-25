// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

/**
 * ÉÉN gedeelde client voor de hele app.
 * - Vite leest env via import.meta.env.VITE_*
 * - Zorg dat je in Vercel "VITE_SUPABASE_URL" en "VITE_SUPABASE_ANON_KEY" hebt gezet.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      detectSessionInUrl: true,
    },
    realtime: {
      // klein beetje throttling is gezond
      params: { eventsPerSecond: 5 },
    },
  }
)

// Belangrijk: als het access token ververst, geef het ook door aan Realtime
supabase.auth.onAuthStateChange((_event, session) => {
  supabase.realtime.setAuth(session?.access_token ?? '')
})
