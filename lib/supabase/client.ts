// lib/supabase/client.ts
// Client Supabase avec token automatique dans les headers
// FIX: Envoie le token depuis localStorage dans les headers pour RLS

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Fonction helper pour récupérer le token depuis localStorage
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionStr = localStorage.getItem('company_session')
    if (!sessionStr) return null
    
    const session = JSON.parse(sessionStr)
    return session.access_token || null
  } catch (error) {
    console.error('Error parsing session:', error)
    return null
  }
}

// Créer le client avec fetch wrapper
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Wrapper pour fetch qui ajoute automatiquement le token
  const customFetch: typeof fetch = async (input, init) => {
    const token = getAccessToken()
    
    // Ajouter le token dans les headers
    const headers = new Headers(init?.headers)
    if (token) {
      headers.set('x-company-token', token)
    }

    // Appeler fetch avec les headers modifiés
    return fetch(input, {
      ...init,
      headers
    })
  }

  // Créer le client avec notre fetch customisé
  const client = createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: customFetch
      }
    }
  )

  return client
}