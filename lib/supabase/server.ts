// lib/supabase/server.ts
// FIXED: Server-side Supabase client with x-company-token header for RLS

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  // Get company session from cookie
  const companySessionCookie = cookieStore.get('company_session')
  let accessToken: string | null = null
  
  if (companySessionCookie) {
    try {
      const session = JSON.parse(companySessionCookie.value)
      accessToken = session.access_token
    } catch (error) {
      console.error('Error parsing company session:', error)
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // This can be ignored in Server Components
          }
        }
      },
      global: {
        headers: accessToken ? {
          'x-company-token': accessToken,
          'x-client-type': 'talvio-server'
        } : {
          'x-client-type': 'talvio-server'
        }
      }
    }
  )
}

// Helper to get company ID from server-side session
export async function getServerCompanyId(): Promise<string | null> {
  const cookieStore = await cookies()
  const companySessionCookie = cookieStore.get('company_session')
  
  if (!companySessionCookie) return null
  
  try {
    const session = JSON.parse(companySessionCookie.value)
    return session.company_id || null
  } catch (error) {
    console.error('Error parsing company session:', error)
    return null
  }
}

// Helper to get access token from server-side session
export async function getServerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const companySessionCookie = cookieStore.get('company_session')
  
  if (!companySessionCookie) return null
  
  try {
    const session = JSON.parse(companySessionCookie.value)
    return session.access_token || null
  } catch (error) {
    console.error('Error parsing company session:', error)
    return null
  }
}