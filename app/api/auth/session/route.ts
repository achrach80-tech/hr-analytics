// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verifying client session...')

    // Get session from cookie
    const sessionCookie = request.cookies.get('company_session')
    
    if (!sessionCookie?.value) {
      console.log('❌ No session cookie found')
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (error) {
      console.log('❌ Invalid session cookie format')
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check session expiry
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      console.log('❌ Session expired')
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Verify company still exists and is active
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .select('id, nom, subscription_status, subscription_ends_at')
      .eq('id', sessionData.company_id)
      .eq('subscription_status', 'active')
      .single()

    if (companyError || !company) {
      console.log('❌ Company not found or inactive')
      return NextResponse.json(
        { error: 'Company account inactive' },
        { status: 401 }
      )
    }

    console.log('✅ Session valid')

    return NextResponse.json({
      success: true,
      session: sessionData,
      company: {
        id: company.id,
        name: company.nom,
        subscription_status: company.subscription_status
      }
    })

  } catch (error) {
    console.error('💥 Session verification error:', error)
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    )
  }
}