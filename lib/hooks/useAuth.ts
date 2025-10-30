// lib/hooks/useAuth.ts
// Authentication hook with proper session management

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getCompanyId, isAuthenticated, clearSession } from '@/lib/supabase/client'

interface CompanySession {
  company_id: string
  company_name: string
  subscription_plan: string
  features: Record<string, any>
  access_token: string
  expires_at: string
}

export function useAuth() {
  const [session, setSession] = useState<CompanySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      if (!isAuthenticated()) {
        setSession(null)
        setLoading(false)
        return
      }

      const sessionStr = localStorage.getItem('company_session')
      if (sessionStr) {
        const sessionData = JSON.parse(sessionStr)
        
        // Check expiration
        if (new Date(sessionData.expires_at) < new Date()) {
          handleLogout()
          return
        }

        setSession(sessionData)
      }
    } catch (err) {
      console.error('Auth check error:', err)
      setError('Session invalide')
      handleLogout()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    router.push('/login')
  }

  return {
    session,
    companyId: session?.company_id || null,
    isAuthenticated: !!session,
    loading,
    error,
    logout: handleLogout,
    refresh: checkAuth
  }
}