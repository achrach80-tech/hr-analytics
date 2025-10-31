// lib/supabase/client.ts
// FIXED: Proper cookie parsing without errors

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to get cookie value by name
function getCookieValue(name: string): string | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split('; ')
  const cookie = cookies.find(row => row.startsWith(name + '='))
  
  if (!cookie) return null
  
  return cookie.split('=')[1]
}

// Get session data helper
function getSessionData() {
  if (typeof window === 'undefined') return null
  
  try {
    // Try cookie first (set by login API)
    const cookieValue = getCookieValue('company_session')
    
    if (cookieValue) {
      try {
        // Try to decode and parse
        const decodedValue = decodeURIComponent(cookieValue)
        const session = JSON.parse(decodedValue)
        
        // Check expiration
        if (session.expires_at && new Date(session.expires_at) < new Date()) {
          document.cookie = 'company_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          localStorage.removeItem('company_session')
          return null
        }
        
        // Sync to localStorage for backward compatibility
        localStorage.setItem('company_session', JSON.stringify(session))
        return session
      } catch (parseError) {
        // If cookie can't be parsed, remove it and try localStorage
        console.warn('Could not parse company_session cookie, trying localStorage')
        document.cookie = 'company_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
    }
    
    // Fallback to localStorage
    const sessionStr = localStorage.getItem('company_session')
    if (!sessionStr) return null
    
    const session = JSON.parse(sessionStr)
    
    // Check expiration
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      localStorage.removeItem('company_session')
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error getting session data:', error)
    return null
  }
}

// CRITICAL FIX: Create authenticated client with x-company-token header
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Get session to extract access token
  const session = getSessionData()
  
  // Build headers with company token
  const headers: Record<string, string> = {
    'x-client-type': 'talvio-web'
  }
  
  // CRITICAL: Add x-company-token header if available
  if (session?.access_token) {
    headers['x-company-token'] = session.access_token
  }

  const client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers
    }
  })

  return client
}

// Get company ID from session
export function getCompanyId(): string | null {
  const session = getSessionData()
  return session?.company_id || null
}

// Get access token from session
export function getAccessToken(): string | null {
  const session = getSessionData()
  return session?.access_token || null
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const session = getSessionData()
  return !!session && !!session.company_id && !!session.access_token
}

// Get full session
export function getSession() {
  return getSessionData()
}

// Clear session
export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('company_session')
    document.cookie = 'company_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

// Refresh session if needed
export async function refreshSession(): Promise<boolean> {
  const session = getSessionData()
  if (!session?.access_token) return false
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: session.access_token })
    })
    
    if (!response.ok) {
      clearSession()
      return false
    }
    
    const data = await response.json()
    if (data.session) {
      // Update session in both cookie and localStorage
      localStorage.setItem('company_session', JSON.stringify(data.session))
      document.cookie = `company_session=${encodeURIComponent(JSON.stringify(data.session))}; path=/; max-age=86400; samesite=strict`
      return true
    }
    
    return false
  } catch (error) {
    console.error('Session refresh error:', error)
    return false
  }
}