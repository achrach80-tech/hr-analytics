import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function validateCompanySession(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get session from cookie
    const sessionCookie = request.cookies.get('company_session')?.value
    if (!sessionCookie) {
      return { valid: false, error: 'No session found' }
    }

    const sessionData = JSON.parse(atob(sessionCookie))
    
    // Check expiration
    if (new Date(sessionData.expires_at) < new Date()) {
      return { valid: false, error: 'Session expired' }
    }

    // Validate company exists and is active
    const { data: company, error } = await supabase
      .from('entreprises')
      .select('id, subscription_status')
      .eq('id', sessionData.company_id)
      .single()

    if (error || !company || company.subscription_status !== 'active') {
      return { valid: false, error: 'Invalid or inactive company' }
    }

    return { 
      valid: true, 
      company_id: sessionData.company_id,
      company_name: sessionData.company_name 
    }

  } catch (error) {
    return { valid: false, error: 'Session validation failed' }
  }
}