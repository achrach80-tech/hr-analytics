// lib/hooks/useOptimizedAuth.ts - Complete Demo-to-Client Flow
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCurrentSession, signOutUser, type CompanySession } from '@/lib/auth/auth-utils'

interface AuthState {
  session: CompanySession | null
  loading: boolean
  error: string | null
  isFirstLogin: boolean
  needsPasswordChange: boolean
  onboardingCompleted: boolean
}

interface LoginResult {
  success: boolean
  error?: string
  requiresPasswordChange?: boolean
  redirectTo?: string
}

export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    loading: true,
    error: null,
    isFirstLogin: false,
    needsPasswordChange: false,
    onboardingCompleted: false
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // 🚀 OPTIMIZED SESSION INITIALIZATION
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const currentSession = await getCurrentSession()
      
      if (!currentSession) {
        setAuthState(prev => ({ 
          ...prev, 
          session: null, 
          loading: false 
        }))
        return
      }

      // Extract user metadata for enhanced flow control
      const user = currentSession.user
      const isFirstLogin = user.user_metadata?.created_by_admin && !user.user_metadata?.password_changed
      const onboardingCompleted = user.user_metadata?.onboarding_completed || false

      setAuthState(prev => ({
        ...prev,
        session: currentSession,
        isFirstLogin,
        needsPasswordChange: isFirstLogin,
        onboardingCompleted,
        loading: false
      }))

      // 🎯 SMART ROUTING LOGIC
      const currentPath = window.location.pathname
      
      // Handle first-time users (created by admin)
      if (isFirstLogin && currentPath !== '/change-password') {
        router.push('/change-password')
        return
      }

      // Redirect from change-password if not needed
      if (!isFirstLogin && currentPath === '/change-password') {
        const redirectTo = searchParams?.get('redirect') || '/dashboard'
        router.push(redirectTo)
        return
      }

      // Handle onboarding flow
      if (!onboardingCompleted && currentPath === '/dashboard') {
        // Could add onboarding wizard here
        // For now, mark as completed
        await markOnboardingCompleted()
      }

    } catch (err) {
      console.error('Auth initialization error:', err)
      setAuthState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Authentication error',
        loading: false 
      }))
    }
  }, [router, searchParams])

  // 🔐 ENHANCED LOGIN WITH ADMIN-CREATED ACCOUNT SUPPORT
  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      // Supabase authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect')
        }
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Email non confirmé. Contactez l\'administrateur.')
        }
        throw signInError
      }

      if (!data.user) {
        throw new Error('Erreur de connexion')
      }

      // Get fresh session with company data
      const newSession = await getCurrentSession()
      if (!newSession) {
        throw new Error('Aucune entreprise associée à ce compte')
      }

      // Check if this is a first login (admin-created account)
      const user = data.user
      const isFirstLogin = user.user_metadata?.created_by_admin && !user.user_metadata?.password_changed
      const onboardingCompleted = user.user_metadata?.onboarding_completed || false

      setAuthState(prev => ({
        ...prev,
        session: newSession,
        isFirstLogin,
        needsPasswordChange: isFirstLogin,
        onboardingCompleted,
        loading: false
      }))

      // 📊 UPDATE LOGIN ANALYTICS
      await supabase
        .from('entreprises')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_count: newSession.company.subscription_plan === 'trial' ? 1 : undefined,
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', data.user.id)

      // 🎯 SMART REDIRECT LOGIC
      let redirectTo = '/dashboard'
      
      if (isFirstLogin) {
        redirectTo = '/change-password'
      } else {
        // Check for redirect parameter
        const redirectParam = searchParams?.get('redirect')
        if (redirectParam && redirectParam.startsWith('/')) {
          redirectTo = redirectParam
        }
      }

      return { 
        success: true, 
        requiresPasswordChange: isFirstLogin,
        redirectTo 
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { success: false, error: errorMessage }
    }
  }, [supabase, searchParams])

  // 🔄 PASSWORD CHANGE FOR FIRST-TIME USERS
  const changePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        if (updateError.message.includes('same as the old password')) {
          throw new Error('Le nouveau mot de passe doit être différent')
        }
        throw updateError
      }

      // Update user metadata to mark password as changed
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          password_changed: true,
          first_password_change_at: new Date().toISOString()
        }
      })

      if (metadataError) {
        console.warn('Metadata update warning:', metadataError)
      }

      // Update auth state
      setAuthState(prev => ({
        ...prev,
        needsPasswordChange: false,
        isFirstLogin: false,
        loading: false
      }))

      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
      return { success: false, error: errorMessage }
    }
  }, [supabase])

  // 🎯 ONBOARDING COMPLETION
  const markOnboardingCompleted = useCallback(async () => {
    try {
      await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        }
      })

      setAuthState(prev => ({
        ...prev,
        onboardingCompleted: true
      }))
    } catch (err) {
      console.warn('Onboarding completion warning:', err)
    }
  }, [supabase])

  // 🚪 ENHANCED LOGOUT
  const logout = useCallback(async () => {
    try {
      await signOutUser()
      setAuthState({
        session: null,
        loading: false,
        error: null,
        isFirstLogin: false,
        needsPasswordChange: false,
        onboardingCompleted: false
      })
    } catch (err) {
      console.error('Logout error:', err)
      // Force logout even on error
      setAuthState({
        session: null,
        loading: false,
        error: null,
        isFirstLogin: false,
        needsPasswordChange: false,
        onboardingCompleted: false
      })
      router.push('/login')
    }
  }, [router])

  // 📊 ACTIVITY TRACKING
  const updateActivity = useCallback(async () => {
    if (!authState.session) return

    try {
      await supabase
        .from('entreprises')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', authState.session.user.id)
    } catch (err) {
      console.warn('Activity update warning:', err)
    }
  }, [authState.session, supabase])

  // 🔍 SUBSCRIPTION CHECK
  const checkSubscription = useCallback(async () => {
    if (!authState.session) return { isValid: false, plan: '', status: '' }

    const { subscription_plan, subscription_status } = authState.session.company
    const isValid = ['active', 'trial'].includes(subscription_status)
    
    return {
      isValid,
      plan: subscription_plan,
      status: subscription_status
    }
  }, [authState.session])

  // 🎧 SUPABASE AUTH STATE LISTENER
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
      if (event === 'SIGNED_IN' && supabaseSession?.user) {
        // User signed in, refresh session
        await initializeAuth()
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setAuthState({
          session: null,
          loading: false,
          error: null,
          isFirstLogin: false,
          needsPasswordChange: false,
          onboardingCompleted: false
        })
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, initializeAuth])

  // 🚀 INITIALIZE ON MOUNT
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // 💓 ACTIVITY HEARTBEAT (every 5 minutes)
  useEffect(() => {
    if (!authState.session) return

    const interval = setInterval(updateActivity, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [authState.session, updateActivity])

  return {
    // Auth state
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.session,
    
    // User properties
    user: authState.session?.user || null,
    company: authState.session?.company || null,
    establishment: authState.session?.establishment || null,
    
    // Flow control
    isFirstLogin: authState.isFirstLogin,
    needsPasswordChange: authState.needsPasswordChange,
    onboardingCompleted: authState.onboardingCompleted,
    
    // Actions
    login,
    logout,
    changePassword,
    markOnboardingCompleted,
    updateActivity,
    checkSubscription,
    
    // Utilities
    refresh: initializeAuth
  }
}

// 🎯 DEMO FLOW HELPER HOOK
export const useDemoToClientFlow = () => {
  const { login } = useOptimizedAuth()
  const router = useRouter()

  const handleNewClientLogin = useCallback(async (
    email: string, 
    temporaryPassword: string
  ) => {
    const result = await login(email, temporaryPassword)
    
    if (result.success) {
      if (result.requiresPasswordChange) {
        // First login - redirect to password change
        router.push('/change-password')
      } else {
        // Normal login - redirect to dashboard or specified page
        router.push(result.redirectTo || '/dashboard')
      }
    }
    
    return result
  }, [login, router])

  return {
    handleNewClientLogin
  }
}