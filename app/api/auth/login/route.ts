// app/api/auth/login/route.ts
// FIXED: API route with proper cookie handling and session management

import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Validate token with service_role (bypass RLS)
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .select('id, nom, access_token, subscription_plan, subscription_status, subscription_ends_at, trial_ends_at, features, login_count')
      .eq('access_token', accessToken.trim())
      .single()

    if (companyError || !company) {
      console.error('Token validation failed:', companyError)
      
      // Log failed attempt
      try {
        await adminClient
          .from('access_logs')
          .insert({
            access_token_used: accessToken?.substring(0, 8) + '...' || 'unknown',
            access_method: 'token',
            path_accessed: '/login',
            action: 'login_failed',
            response_status: 401,
            accessed_at: new Date().toISOString()
          })
      } catch (logError) {
        // Ignore if access_logs doesn't exist
      }
      
      return NextResponse.json(
        { error: 'Code d\'accès invalide' },
        { status: 401 }
      )
    }

    // Check subscription status
    if (company.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Votre abonnement n\'est pas actif. Contactez le support.' },
        { status: 403 }
      )
    }

    // Check subscription expiration
    if (company.subscription_ends_at) {
      const subscriptionEnd = new Date(company.subscription_ends_at)
      if (subscriptionEnd < new Date()) {
        return NextResponse.json(
          { error: 'Votre abonnement a expiré. Veuillez renouveler.' },
          { status: 403 }
        )
      }
    }

    // Check trial expiration
    if (company.trial_ends_at) {
      const trialEnd = new Date(company.trial_ends_at)
      if (trialEnd < new Date()) {
        return NextResponse.json(
          { error: 'Votre période d\'essai a expiré. Passez à un abonnement payant.' },
          { status: 403 }
        )
      }
    }

    // Update last login with service_role
    await adminClient
      .from('entreprises')
      .update({ 
        last_login_at: new Date().toISOString(),
        login_count: (company.login_count || 0) + 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', company.id)

    // Log successful access
    try {
      await adminClient
        .from('access_logs')
        .insert({
          entreprise_id: company.id,
          access_token_used: accessToken.substring(0, 8) + '...',
          access_method: 'token',
          path_accessed: '/login',
          action: 'login_success',
          response_status: 200,
          accessed_at: new Date().toISOString()
        })
    } catch (logError) {
      // Ignore if access_logs table doesn't exist
      console.log('Access log not recorded:', logError)
    }

    // Create session object
    const sessionData = {
      company_id: company.id,
      company_name: company.nom,
      subscription_plan: company.subscription_plan,
      features: company.features || {},
      access_token: company.access_token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      created_at: new Date().toISOString()
    }

    // CRITICAL FIX: Set cookie in response
    const response = NextResponse.json({
      success: true,
      session: sessionData
    })

    // Set HTTP-only cookie for better security
    response.cookies.set({
      name: 'company_session',
      value: JSON.stringify(sessionData),
      httpOnly: false, // Must be false so client JS can read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login API error:', error)
    
    // Log failed attempt
    try {
      const body = await request.clone().json()
      await adminClient
        .from('access_logs')
        .insert({
          access_token_used: body.accessToken?.substring(0, 8) + '...' || 'unknown',
          access_method: 'token',
          path_accessed: '/login',
          action: 'login_error',
          response_status: 500,
          accessed_at: new Date().toISOString()
        })
    } catch (logError) {
      // Ignore
    }

    return NextResponse.json(
      { error: 'Erreur de connexion. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}