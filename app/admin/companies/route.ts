// app/api/admin/companies/route.ts
// FIXED: Company creation from demo requests with proper validation

import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Helper function to validate admin session
function validateAdminSession(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin_session')
  
  if (!adminSession) {
    console.log('❌ No admin_session cookie found')
    return false
  }

  try {
    const decodedValue = decodeURIComponent(adminSession.value)
    const sessionData = JSON.parse(decodedValue)
    
    if (!sessionData.isAdmin) {
      console.log('❌ Session does not have isAdmin=true')
      return false
    }
    
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      console.log('❌ Admin session expired')
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Error validating admin session:', error)
    return false
  }
}

// Helper function to generate secure tokens
function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Helper function to generate company code
function generateCompanyCode(companyName: string): string {
  // Remove accents and special characters, keep only letters and numbers
  const cleaned = companyName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  
  // Take first 6 characters + random suffix
  const prefix = cleaned.substring(0, 6).padEnd(6, 'X')
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase()
  
  return `${prefix}${suffix}`
}

export async function GET(request: NextRequest) {
  console.log('\n=== COMPANIES API - GET ===')
  
  try {
    // Validate admin session
    if (!validateAdminSession(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    // Get companies with basic info
    const { data: companies, error } = await adminClient
      .from('entreprises')
      .select(`
        id,
        nom,
        code_entreprise,
        subscription_plan,
        subscription_status,
        onboarding_status,
        last_login_at,
        login_count,
        created_at,
        created_by
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Found ${companies?.length || 0} companies`)

    return NextResponse.json({ 
      data: companies || [],
      success: true 
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('\n=== COMPANIES API - POST (Create from Demo) ===')
  
  try {
    // Validate admin session
    if (!validateAdminSession(request)) {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { demo_request_id } = body

    if (!demo_request_id) {
      return NextResponse.json({ 
        error: 'demo_request_id is required' 
      }, { status: 400 })
    }

    console.log(`📋 Creating company from demo request: ${demo_request_id}`)

    // Get demo request details
    const { data: demoRequest, error: demoError } = await adminClient
      .from('demo_requests')
      .select('*')
      .eq('id', demo_request_id)
      .single()

    if (demoError || !demoRequest) {
      console.error('❌ Demo request not found:', demoError)
      return NextResponse.json({ 
        error: 'Demo request not found' 
      }, { status: 404 })
    }

    // Check if already converted
    if (demoRequest.converted_to_company_id) {
      console.log('⚠️ Demo request already converted')
      return NextResponse.json({ 
        error: 'Demo request already converted to company' 
      }, { status: 400 })
    }

    console.log(`✅ Demo request found: ${demoRequest.company_name}`)

    // Generate company data
    const companyCode = generateCompanyCode(demoRequest.company_name)
    const accessToken = generateSecureToken(32)
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial

    // Create company
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .insert({
        nom: demoRequest.company_name,
        code_entreprise: companyCode,
        access_token: accessToken,
        subscription_plan: 'trial',
        subscription_status: 'active',
        onboarding_status: 'trial_started',
        trial_ends_at: trialEndsAt.toISOString(),
        billing_email: demoRequest.email,
        max_establishments: 1,
        max_employees: demoRequest.employee_count === '1-50' ? 50 : 
                      demoRequest.employee_count === '51-200' ? 200 :
                      demoRequest.employee_count === '201-500' ? 500 : 1000,
        features: {
          export: true,
          api: false,
          white_label: false
        }
      })
      .select()
      .single()

    if (companyError) {
      console.error('❌ Error creating company:', companyError)
      return NextResponse.json({ 
        error: 'Failed to create company: ' + companyError.message 
      }, { status: 500 })
    }

    console.log(`✅ Company created: ${company.id}`)

    // Create default establishment
    const { data: establishment, error: establishmentError } = await adminClient
      .from('etablissements')
      .insert({
        entreprise_id: company.id,
        nom: `${demoRequest.company_name} - Siège`,
        code_etablissement: 'SIEGE',
        is_headquarters: true,
        statut: 'Actif'
      })
      .select()
      .single()

    if (establishmentError) {
      console.error('❌ Error creating establishment:', establishmentError)
      // Try to clean up the company
      await adminClient.from('entreprises').delete().eq('id', company.id)
      return NextResponse.json({ 
        error: 'Failed to create establishment' 
      }, { status: 500 })
    }

    console.log(`✅ Establishment created: ${establishment.id}`)

    // Create default reference data (departments, positions, contracts)
    const defaultDepartments = [
      { code: 'RH', nom: 'Ressources Humaines' },
      { code: 'IT', nom: 'Informatique' },
      { code: 'COM', nom: 'Commercial' },
      { code: 'FIN', nom: 'Finance' },
      { code: 'OPS', nom: 'Opérations' }
    ]

    const defaultPositions = [
      { code: 'DIR', nom: 'Directeur', niveau_hierarchique: 1 },
      { code: 'MGR', nom: 'Manager', niveau_hierarchique: 2 },
      { code: 'EMP', nom: 'Employé', niveau_hierarchique: 3 },
      { code: 'STG', nom: 'Stagiaire', niveau_hierarchique: 4 }
    ]

    const defaultContracts = [
      { code: 'CDI', nom: 'Contrat à Durée Indéterminée', type_contrat: 'CDI' },
      { code: 'CDD', nom: 'Contrat à Durée Déterminée', type_contrat: 'CDD' },
      { code: 'STG', nom: 'Stage', type_contrat: 'Stage' }
    ]

    // Insert reference data
    await Promise.all([
      adminClient.from('ref_departements').insert(
        defaultDepartments.map(dept => ({ ...dept, entreprise_id: company.id }))
      ),
      adminClient.from('ref_postes').insert(
        defaultPositions.map(pos => ({ ...pos, entreprise_id: company.id }))
      ),
      adminClient.from('ref_contrats').insert(
        defaultContracts.map(contract => ({ ...contract, entreprise_id: company.id }))
      )
    ])

    console.log('✅ Reference data created')

    // Update demo request to mark as converted
    await adminClient
      .from('demo_requests')
      .update({
        status: 'converted',
        converted_to_company_id: company.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', demo_request_id)

    console.log('✅ Demo request marked as converted')

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        nom: company.nom,
        code_entreprise: company.code_entreprise,
        access_token: company.access_token,
        trial_ends_at: company.trial_ends_at
      },
      establishment: {
        id: establishment.id,
        nom: establishment.nom
      },
      demo_request: demoRequest
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}