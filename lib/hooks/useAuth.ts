// lib/hooks/useAuth.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentSession, signOutUser, type CompanySession } from '@/lib/auth/auth-utils'

export const useAuth = () => {
  const [session, setSession] = useState<CompanySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Initialize and check authentication
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentSession = await getCurrentSession()
      setSession(currentSession)
      
      if (!currentSession) {
        // No valid session found
        router.push('/login')
        return false
      }
      
      // Add this after line 28 (after setting session)
if (currentSession) {
  // Check if user needs to change password (first login)
  const user = currentSession.user
  const needsPasswordChange = user.user_metadata?.created_by_admin && !user.user_metadata?.password_changed
  
  if (needsPasswordChange && window.location.pathname !== '/change-password') {
    router.push('/change-password')
    return false
  }
  
  // If on change-password page but don't need to change, redirect to dashboard
  if (!needsPasswordChange && window.location.pathname === '/change-password') {
    router.push('/dashboard')
    return false
  }
}

      return true
    } catch (err) {
      console.error('Auth check error:', err)
      setError(err instanceof Error ? err.message : 'Authentication error')
      return false
    } finally {
      setLoading(false)
    }
  }, [router])

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect')
        }
        throw signInError
      }

      if (!data.user) {
        throw new Error('Erreur de connexion')
      }

      // Get fresh session data
      const newSession = await getCurrentSession()
      if (!newSession) {
        throw new Error('Aucune entreprise associée à ce compte')
      }

      setSession(newSession)

      // Update login tracking
      await supabase
        .from('entreprises')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_count: newSession.company.subscription_plan === 'trial' ? 1 : undefined,
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', data.user.id)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOutUser()
      setSession(null)
    } catch (err) {
      console.error('Logout error:', err)
      // Force logout even if there's an error
      setSession(null)
      router.push('/login')
    }
  }, [router])

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (event === 'SIGNED_IN' && supabaseSession?.user) {
        // User signed in, get company data
        const newSession = await getCurrentSession()
        setSession(newSession)
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setSession(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Initialize on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    session,
    loading,
    error,
    login,
    logout,
    checkAuth,
    // Convenience properties
    user: session?.user || null,
    company: session?.company || null,
    establishment: session?.establishment || null,
    isAuthenticated: !!session
  }
}