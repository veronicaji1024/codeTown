import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (identifier: string, password: string, mode: 'email' | 'phone'): Promise<boolean> => {
    setError(null)
    const credentials = mode === 'email'
      ? { email: identifier, password }
      : { phone: identifier, password }

    const { data, error: err } = await supabase.auth.signUp(credentials)
    if (err) { setError(err.message); return false }
    // Supabase returns a user with empty identities if the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      setError('该邮箱已注册，请直接登录')
      return false
    }
    return true
  }, [])

  const signIn = useCallback(async (identifier: string, password: string, mode: 'email' | 'phone'): Promise<boolean> => {
    setError(null)
    const credentials = mode === 'email'
      ? { email: identifier, password }
      : { phone: identifier, password }

    const { error: err } = await supabase.auth.signInWithPassword(credentials)
    if (err) { setError(err.message); return false }
    return true
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    const { error: err } = await supabase.auth.signOut()
    if (err) setError(err.message)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { user, loading, error, signUp, signIn, signOut, clearError }
}
