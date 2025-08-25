// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Één gedeelde Supabase client voor de hele app.
 * - Vite: gebruik VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY
 * - Houdt sessie in de browser vast (persistSession)
 * - Ververst tokens automatisch (autoRefreshToken)
 * - Sync't het access token met Realtime bij auth-wijzigingen
 *
 * LET OP:
 * - Gebruik deze client overal via:  import { supabase } from '@/lib/supabase'
 * - Maak nergens anders nog een eigen createClient-aanroep.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Helpt bij het snel vinden van een misconfig in Vercel of lokaal
  // (geen throw om build niet te breken; wel duidelijke melding in console)
  // eslint-disable-next-line no-console
  console.error(
    '[Supabase] Ontbrekende env vars. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in je .env en in Vercel.'
  )
}

export const supabase: SupabaseClient = createClient(url!, anon!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 5 },
  },
})

// Zorg dat Realtime het actuele access_token gebruikt na login/refresh/logout
supabase.auth.onAuthStateChange((_event, session) => {
  const token = session?.access_token ?? ''
  try {
    supabase.realtime.setAuth(token)
  } catch {
    // noop – oudere @supabase/realtime versies hebben setAuth soms niet
  }
})
