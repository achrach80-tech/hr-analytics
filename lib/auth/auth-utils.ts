// lib/auth/auth-utils.ts
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ADD these type definitions at the top:
interface UserCompanyResult {
  company_id: string
  company_name: string
  subscription_plan: string
  subscription_status: string
  establishment_id: string
  establishment_name: string
}

export interface CompanySession {
  user: User
  company: {
    id: string
    name: string
    subscription_plan: string
    subscription_status: string
  }
  establishment: {
    id: string
    name: string
  }
}

/**
 * Get the current authenticated user and their company data
 * This replaces the old token-based system
 */
export async function getCurrentSession(): Promise<CompanySession | null> {
  const supabase = createClient()
  
  try {
    // Get current Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('No authenticated user found')
      return null
    }

    // Get company data using a direct query instead of RPC
    const { data: companyData, error: companyError } = await supabase
      .from('entreprises')
      .select(`
        id,
        nom,
        subscription_plan,
        subscription_status,
        etablissements!inner (
          id,
          nom,
          is_headquarters
        )
      `)
      .eq('user_id', user.id)
      .eq('etablissements.is_headquarters', true)
      .single()

    if (companyError || !companyData) {
      console.error('No company found for user:', companyError)
      return null
    }

    // Get the headquarters establishment
    const establishment = companyData.etablissements?.[0]
    if (!establishment) {
      console.error('No headquarters establishment found')
      return null
    }

    return {
      user,
      company: {
        id: companyData.id,
        name: companyData.nom,
        subscription_plan: companyData.subscription_plan,
        subscription_status: companyData.subscription_status
      },
      establishment: {
        id: establishment.id,
        name: establishment.nom
      }
    }
  } catch (error) {
    console.error('Session check error:', error)
    return null
  }
}

/**
 * Sign out user completely (replaces old token clearing)
 */
export async function signOutUser(): Promise<void> {
  const supabase = createClient()
  
  // Sign out from Supabase
  await supabase.auth.signOut()
  
  // Clear any remaining localStorage (cleanup from old system)
  localStorage.removeItem('company_session')
  localStorage.removeItem('auth_token')
  
  // Redirect to login
  window.location.href = '/login'
}

/**
 * Update last activity for the current user's company
 */
export async function updateUserActivity(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase
      .from('entreprises')
      .update({ 
        last_activity_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
  }
}

/**
 * Check if user has valid subscription
 */
export async function checkSubscriptionStatus(): Promise<{
  isValid: boolean
  plan: string
  status: string
  trialEndsAt?: string
}> {
  const session = await getCurrentSession()
  
  if (!session) {
    return { isValid: false, plan: '', status: '' }
  }

  const { subscription_plan, subscription_status } = session.company
  
  // Check if subscription is active
  const isValid = subscription_status === 'active' || subscription_status === 'trial'
  
  return {
    isValid,
    plan: subscription_plan,
    status: subscription_status
  }
}