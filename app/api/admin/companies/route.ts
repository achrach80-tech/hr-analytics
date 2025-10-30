// app/api/admin/companies/route.ts
// API Route pour créer des entreprises (admin uniquement)
// Utilise service_role pour bypass RLS

import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

// POST: Créer une nouvelle entreprise
export async function POST(request: NextRequest) {
  try {
    // TODO: Vérifier que l'admin est authentifié
    // Pour l'instant, on fait confiance au middleware
    
    const body = await request.json()
    const {
      nom,
      contact_name,
      email,
      phone,
      subscription_plan,
      trial_days,
      max_employees,
      employee_count
    } = body

    // Validation
    if (!nom || !email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    // Générer un access token
    const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Générer un code entreprise
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const companyCode = `RHQ-${timestamp}-${random}`

    // Générer le slug URL
    const urlSlug = nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)

    // Créer l'entreprise avec adminClient (bypass RLS)
    const { data: company, error: companyError } = await adminClient
      .from('entreprises')
      .insert({
        nom,
        code_entreprise: companyCode,
        access_token: accessToken,
        access_url_slug: urlSlug,
        subscription_plan: subscription_plan || 'trial',
        subscription_status: 'active',
        billing_email: email,
        trial_ends_at: subscription_plan === 'trial'
          ? new Date(Date.now() + (trial_days || 30) * 24 * 60 * 60 * 1000).toISOString()
          : null,
        activation_date: new Date().toISOString(),
        onboarding_status: 'trial_started',
        max_employees: max_employees || 100,
        features: {
          export: true,
          api: subscription_plan !== 'trial',
          white_label: subscription_plan === 'enterprise',
          ai_features: subscription_plan !== 'trial'
        },
        ai_features_enabled: subscription_plan !== 'trial'
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return NextResponse.json(
        { error: `Failed to create company: ${companyError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Company created:', company.id)

    // Créer l'établissement par défaut avec adminClient
    const { data: establishment, error: estError } = await adminClient
      .from('etablissements')
      .insert({
        entreprise_id: company.id,
        nom: `${nom} - Siège`,
        code_etablissement: 'SIEGE',
        is_headquarters: true,
        statut: 'Actif',
        pays: 'France',
        timezone: 'Europe/Paris',
        employee_count: 0
      })
      .select()
      .single()

    if (estError) {
      console.error('Error creating establishment:', estError)
      // Ne pas échouer si l'établissement n'est pas créé, mais logger l'erreur
      return NextResponse.json({
        success: true,
        company,
        access_token: accessToken,
        warning: 'Company created but establishment creation failed'
      })
    }

    console.log('✅ Establishment created:', establishment.id)

    return NextResponse.json({
      success: true,
      company,
      establishment,
      access_token: accessToken
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Récupérer toutes les entreprises (pour la page admin/companies)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = adminClient
      .from('entreprises')
      .select(`
        *,
        etablissements:etablissements(count)
      `)
      .order('created_at', { ascending: false })
    
    // Filtrer par status si fourni
    if (status && status !== 'all') {
      query = query.eq('subscription_status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Mettre à jour une entreprise
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    const { data, error } = await adminClient
      .from('entreprises')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating company:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}