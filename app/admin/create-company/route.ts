// app/api/admin/create-company/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service_role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Validate admin session (you could also check admin role here)
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate admin session
    try {
      const sessionData = JSON.parse(atob(adminSession.value))
      if (new Date(sessionData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { demoId } = body

    if (!demoId) {
      return NextResponse.json({ error: 'Demo ID required' }, { status: 400 })
    }

    // Get demo data
    const { data: demo, error: demoError } = await supabaseAdmin
      .from('demo_requests')
      .select('*')
      .eq('id', demoId)
      .single()

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 })
    }

    // Validate demo data
    if (!demo.company_name || !demo.contact_name || !demo.email) {
      return NextResponse.json({ 
        error: 'Demo data incomplete: missing company_name, contact_name, or email' 
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email === demo.email)
    
    if (emailExists) {
      return NextResponse.json({ 
        error: `Email ${demo.email} already exists in the system` 
      }, { status: 409 })
    }

    // Generate credentials
    const tempPassword = generateSecurePassword()
    const companyCode = generateCompanyCode()
    const subscriptionConfig = getSubscriptionConfig(demo.employee_count)

    // Step 1: Create Supabase user with admin privileges
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demo.email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation for admin-created accounts
      user_metadata: {
        company_name: demo.company_name,
        contact_name: demo.contact_name,
        phone: demo.phone || null,
        industry: demo.industry || null,
        employee_count: demo.employee_count,
        created_by_admin: true,
        password_changed: false,
        created_from_demo: demo.id,
        demo_message: demo.message || null,
        conversion_date: new Date().toISOString()
      }
    })

    if (authError || !authUser.user) {
      console.error('User creation error:', authError)
      return NextResponse.json({ 
        error: `User creation failed: ${authError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    try {
      // Step 2: Create company
      const { data: company, error: companyError } = await supabaseAdmin
        .from('entreprises')
        .insert({
          user_id: authUser.user.id,
          nom: demo.company_name,
          code_entreprise: companyCode,
          subscription_plan: subscriptionConfig.plan,
          subscription_status: 'active',
          billing_email: demo.email,
          trial_ends_at: subscriptionConfig.trialEnd,
          max_employees: subscriptionConfig.maxEmployees,
          max_establishments: subscriptionConfig.maxEstablishments,
          gdpr_consent_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (companyError || !company) {
        // Cleanup: delete user if company creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.error('Company creation error:', companyError)
        return NextResponse.json({ 
          error: `Company creation failed: ${companyError?.message || 'Unknown error'}` 
        }, { status: 500 })
      }

      // Step 3: Create default establishment
      const { data: establishment, error: estError } = await supabaseAdmin
        .from('etablissements')
        .insert({
          entreprise_id: company.id,
          nom: `${demo.company_name} - Siège Social`,
          code_etablissement: 'SIEGE',
          is_headquarters: true,
          is_active: true,
          pays: 'France',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (estError || !establishment) {
        console.error('Establishment creation error:', estError)
        return NextResponse.json({ 
          error: `Establishment creation failed: ${estError?.message || 'Unknown error'}` 
        }, { status: 500 })
      }

      // Step 4: Setup default referentials (optional - don't fail if this fails)
      try {
        const { error: refError } = await supabaseAdmin.rpc('setup_default_referentials', {
          p_etablissement_id: establishment.id
        })
        if (refError) {
          console.warn('Referentials setup warning:', refError.message)
        }
      } catch (refError) {
        console.warn('Referentials setup failed (non-critical):', refError)
      }

      // Step 5: Update demo status
      const { error: updateError } = await supabaseAdmin
        .from('demo_requests')
        .update({
          status: 'converted',
          converted_to_company_id: company.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', demo.id)

      if (updateError) {
        console.warn('Demo update warning:', updateError.message)
      }

      // Return success with all data
      return NextResponse.json({
        success: true,
        company,
        user_id: authUser.user.id,
        credentials: {
          email: demo.email,
          password: tempPassword,
          login_url: `${request.nextUrl.origin}/login`,
          company_code: companyCode
        }
      })

    } catch (error) {
      // Cleanup: delete user if anything fails after user creation
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      console.error('Company setup error:', error)
      return NextResponse.json({ 
        error: `Company setup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// Helper functions
function generateSecurePassword(): string {
  const length = 14
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

function generateCompanyCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `RHQ-${timestamp}-${random}`
}

function getSubscriptionConfig(employeeCount: string) {
  const now = new Date()
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  switch (employeeCount) {
    case '1-50':
      return {
        plan: 'starter',
        maxEmployees: 100,
        maxEstablishments: 2,
        trialEnd
      }
    case '51-200':
      return {
        plan: 'professional',
        maxEmployees: 300,
        maxEstablishments: 5,
        trialEnd
      }
    case '201-500':
      return {
        plan: 'professional',
        maxEmployees: 600,
        maxEstablishments: 10,
        trialEnd
      }
    case '500+':
    case '1000+':
      return {
        plan: 'enterprise',
        maxEmployees: 1000,
        maxEstablishments: 20,
        trialEnd
      }
    default:
      return {
        plan: 'starter',
        maxEmployees: 100,
        maxEstablishments: 2,
        trialEnd
      }
  }
}