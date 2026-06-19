import { createClient } from '@supabase/supabase-js'

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const supabaseUrl = envSupabaseUrl || 'http://127.0.0.1:54321'
const supabaseAnonKey = envSupabaseAnonKey || 'local-development-anon-key'

export const isSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey)

// Cliente local de desarrollo: permite renderizar pantallas que solo usan localStorage
// aunque Supabase no este configurado. Las llamadas remotas reales requieren env vars.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  }
)
