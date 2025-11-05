// app/api/admin/create-company/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { 
      demoRequestId,
      companyName, 
      companyCode,
      contactEmail,
      subscriptionPlan = 'trial'
    } = await request.json()

    if (!companyName || !companyCode || !contactEmail) {
      return NextResponse.json(
        { error: 'Company name, code, and contact email are required' },
        { status: 400 }
      )
    }

    console.log(`🏢 Creating company: ${companyName} (${companyCode})`)

    // Generate secure access token
    const accessToken = crypto.randomBytes(32).toString('hex')
    console.log('🔑 Generated access token:', accessToken.substring(0, 10) + '...')

    // Create company
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .insert({
        nom: companyName,
        code_entreprise: companyCode,
        billing_email: contactEmail,
        access_token: accessToken,
        subscription_plan: subscriptionPlan,
        subscription_status: 'active',
        onboarding_status: 'trial_started',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError) {
      console.error('❌ Error creating company:', companyError)
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message },
        { status: 500 }
      )
    }

    console.log('✅ Company created with ID:', company.id)

    // Create default establishment
    const { data: establishment, error: establishmentError } = await adminClient
      .from('etablissements')
      .insert({
        entreprise_id: company.id,
        nom: companyName + ' - Siège',
        code_etablissement: 'SIEGE',
        is_headquarters: true,
        statut: 'Actif'
      })
      .select()
      .single()

    if (establishmentError) {
      console.error('❌ Error creating establishment:', establishmentError)
      // Don't fail completely, just log the error
    } else {
      console.log('✅ Default establishment created')
    }

    // Update demo request if provided
    if (demoRequestId) {
      const { error: updateError } = await adminClient
        .from('demo_requests')
        .update({
          status: 'converted',
          converted_to_company_id: company.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', demoRequestId)

      if (updateError) {
        console.error('❌ Error updating demo request:', updateError)
        // Don't fail, just log
      } else {
        console.log('✅ Demo request marked as converted')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        company,
        establishment,
        accessToken,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?token=${accessToken}`
      }
    })

  } catch (error) {
    console.error('💥 Create company error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}