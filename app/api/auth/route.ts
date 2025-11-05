// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Client authentication attempt...')
    
    const { access_token } = await request.json()

    if (!access_token) {
      console.log('❌ No access token provided')
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Validating token: ${access_token.substring(0, 10)}...`)

    // Find company by access token
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .select(`
        id,
        nom,
        code_entreprise,
        billing_email,
        subscription_status,
        subscription_plan,
        onboarding_status,
        trial_ends_at,
        subscription_ends_at,
        max_establishments,
        max_employees,
        features
      `)
      .eq('access_token', access_token)
      .eq('subscription_status', 'active')
      .single()

    if (companyError || !company) {
      console.log('❌ Invalid or expired token:', companyError?.message)
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    // Check if subscription is still valid
    const now = new Date()
    const trialEnds = company.trial_ends_at ? new Date(company.trial_ends_at) : null
    const subscriptionEnds = company.subscription_ends_at ? new Date(company.subscription_ends_at) : null

    if (trialEnds && now > trialEnds && (!subscriptionEnds || now > subscriptionEnds)) {
      console.log('❌ Subscription expired')
      return NextResponse.json(
        { error: 'Subscription expired. Please contact support.' },
        { status: 403 }
      )
    }

    console.log(`✅ Company found: ${company.nom} (${company.code_entreprise})`)

    // Get company's establishments
    const { data: establishments, error: establishmentsError } = await adminClient
      .from('etablissements')
      .select('id, nom, code_etablissement, is_headquarters, statut')
      .eq('entreprise_id', company.id)
      .eq('statut', 'Actif')

    if (establishmentsError) {
      console.error('⚠️ Error fetching establishments:', establishmentsError)
    }

    console.log(`📍 Found ${establishments?.length || 0} establishments`)

    // Update login tracking
    await adminClient
      .from('entreprises')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (company as any).login_count ? (company as any).login_count + 1 : 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', company.id)

    // Create session data
    const sessionData = {
      company_id: company.id,
      company_name: company.nom,
      company_code: company.code_entreprise,
      access_token: access_token,
      subscription_status: company.subscription_status,
      subscription_plan: company.subscription_plan,
      onboarding_status: company.onboarding_status,
      features: company.features || {},
      establishments: establishments || [],
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      created_at: new Date().toISOString()
    }

    console.log('📝 Creating company session...')

    const response = NextResponse.json({
      success: true,
      session: sessionData,
      company: {
        id: company.id,
        name: company.nom,
        code: company.code_entreprise,
        email: company.billing_email,
        subscription_status: company.subscription_status,
        subscription_plan: company.subscription_plan,
        onboarding_status: company.onboarding_status,
        establishments: establishments || []
      }
    })

    // Set company session cookie
    response.cookies.set({
      name: 'company_session',
      value: JSON.stringify(sessionData),
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    console.log('✅ Client authentication successful')

    // Log access
    await adminClient
      .from('access_logs')
      .insert({
        entreprise_id: company.id,
        access_token_used: access_token.substring(0, 10) + '...',
        access_method: 'token',
        ip_address: request.ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        path_accessed: '/api/auth/login',
        action: 'LOGIN',
        response_status: 200,
        accessed_at: new Date().toISOString()
      })

    return response

  } catch (error) {
    console.error('💥 Client authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    console.log('🚪 Client logout requested')
    
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    
    // Clear the company session cookie
    response.cookies.set({
      name: 'company_session',
      value: '',
      expires: new Date(0),
      path: '/'
    })

    console.log('✅ Client session cleared')
    return response

  } catch (error) {
    console.error('❌ Client logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}