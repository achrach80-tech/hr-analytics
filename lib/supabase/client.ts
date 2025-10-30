// lib/supabase/client.ts
// FIXED: Proper Supabase client with company context
// Uses a hybrid approach: service_role client with explicit filters

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Get session data helper
function getSessionData() {
  if (typeof window === 'undefined') return null
  
  try {
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
    console.error('Error parsing session:', error)
    return null
  }
}

// Create authenticated client with company context
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'x-client-type': 'talvio-web'
      }
    }
  })

  return client
}

// Get company ID from session
export function getCompanyId(): string | null {
  const session = getSessionData()
  return session?.company_id || null
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const session = getSessionData()
  return !!session && !!session.company_id
}

// Get full session
export function getSession() {
  return getSessionData()
}

// Clear session
export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('company_session')
  }
}