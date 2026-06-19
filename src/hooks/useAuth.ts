'use client'
import { useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/types/prompt'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return
    const { data } = await supabase
      .from('profiles')
      .select('id, email, nombre, role, is_blocked, telefono, zone, permissions, full_name_v7, phone_v7, company_name_v7, signature_v7, created_at, updated_v7_at')
      .eq('id', userId)
      .single()
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error?.message?.includes('Refresh Token')) {
        supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        data: { user: null, session: null },
        error: { message: 'Supabase no esta configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para iniciar sesion.' },
      }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        data: { user: null, session: null },
        error: { message: 'Supabase no esta configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para crear cuentas.' },
      }
    }
    return supabase.auth.signUp({ email, password })
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setProfile(null)
  }

  return { user, session, profile, loading, signIn, signUp, signOut }
}
