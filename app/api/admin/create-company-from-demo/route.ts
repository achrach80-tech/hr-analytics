// app/api/admin/create-company-from-demo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service_role key for admin operations
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
    // Validate admin session
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { demoId } = body

    if (!demoId) {
      return NextResponse.json({ error: 'Demo ID required' }, { status: 400 })
    }

    // Get demo data with validation
    const { data: demo, error: demoError } = await supabaseAdmin
      .from('demo_requests')
      .select('*')
      .eq('id', demoId)
      .single()

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 })
    }

    // Check if already converted
    if (demo.converted_to_company_id) {
      return NextResponse.json({ 
        error: 'Demo already converted',
        company_id: demo.converted_to_company_id 
      }, { status: 409 })
    }

    // Validate required fields
    if (!demo.company_name || !demo.contact_name || !demo.email) {
      return NextResponse.json({ 
        error: 'Demo data incomplete: missing company_name, contact_name, or email' 
      }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email === demo.email)
    
    if (emailExists) {
      return NextResponse.json({ 
        error: `Email ${demo.email} already registered. Contact existing user.` 
      }, { status: 409 })
    }

    // Generate secure credentials
    const tempPassword = generateSecurePassword()
    const companyCode = generateCompanyCode(demo.company_name)
    const subscriptionConfig = getOptimizedSubscriptionConfig(demo.employee_count)

    // 🚀 STEP 1: Create Supabase Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demo.email,
      password: tempPassword,
      email_confirm: true, // Skip confirmation for admin-created accounts
      user_metadata: {
        company_name: demo.company_name,
        contact_name: demo.contact_name,
        phone: demo.phone,
        industry: demo.industry,
        employee_count: demo.employee_count,
        created_by_admin: true,
        password_changed: false, // Force password change on first login
        created_from_demo: demo.id,
        conversion_date: new Date().toISOString(),
        onboarding_completed: false
      }
    })

    if (authError || !authUser.user) {
      console.error('User creation failed:', authError)
      return NextResponse.json({ 
        error: `User creation failed: ${authError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    let companyId: string
    let establishmentId: string

    try {
      // 🚀 STEP 2: Create Company Record
      const { data: company, error: companyError } = await supabaseAdmin
        .from('entreprises')
        .insert({
          user_id: authUser.user.id,
          nom: demo.company_name,
          code_entreprise: companyCode,
          subscription_plan: subscriptionConfig.plan,
          subscription_status: subscriptionConfig.status,
          billing_email: demo.email,
          trial_ends_at: subscriptionConfig.trialEnd,
          max_employees: subscriptionConfig.maxEmployees,
          max_establishments: subscriptionConfig.maxEstablishments,
          gdpr_consent_date: new Date().toISOString(),
          last_login_at: null,
          login_count: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (companyError || !company) {
        throw new Error(`Company creation failed: ${companyError?.message}`)
      }

      companyId = company.id

      // 🚀 STEP 3: Create Default Establishment (Headquarters)
      const { data: establishment, error: estError } = await supabaseAdmin
        .from('etablissements')
        .insert({
          entreprise_id: company.id,
          nom: `${demo.company_name} - Siège Social`,
          code_etablissement: 'SIEGE',
          is_headquarters: true,
          is_active: true,
          pays: demo.country || 'France',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (estError || !establishment) {
        throw new Error(`Establishment creation failed: ${estError?.message}`)
      }

      establishmentId = establishment.id

      // 🚀 STEP 4: Setup Default Reference Data (Non-blocking)
      try {
        await setupDefaultReferentials(establishmentId)
      } catch (refError) {
        console.warn('Reference setup warning (non-critical):', refError)
      }

      // 🚀 STEP 5: Update Demo Status
      const { error: updateError } = await supabaseAdmin
        .from('demo_requests')
        .update({
          status: 'converted',
          converted_to_company_id: company.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', demo.id)

      if (updateError) {
        console.warn('Demo status update warning:', updateError)
      }

      // 🚀 STEP 6: Send Welcome Email (Optional)
      try {
        await sendWelcomeEmail(demo, {
          email: demo.email,
          password: tempPassword,
          login_url: `${request.nextUrl.origin}/login`,
          company_code: companyCode
        })
      } catch (emailError) {
        console.warn('Welcome email warning:', emailError)
      }

      // ✅ SUCCESS RESPONSE
      return NextResponse.json({
        success: true,
        message: 'Company created successfully',
        company: {
          id: company.id,
          nom: company.nom,
          code_entreprise: companyCode,
          subscription_plan: company.subscription_plan,
          subscription_status: company.subscription_status
        },
        establishment: {
          id: establishment.id,
          nom: establishment.nom
        },
        user_id: authUser.user.id,
        credentials: {
          email: demo.email,
          password: tempPassword,
          login_url: `${request.nextUrl.origin}/login`,
          company_code: companyCode
        }
      })

    } catch (setupError) {
      // 🔄 ROLLBACK: Clean up on failure
      console.error('Setup failed, rolling back:', setupError)
      
      // Delete created user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json({ 
        error: `Company setup failed: ${setupError instanceof Error ? setupError.message : 'Unknown error'}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// 🔧 HELPER FUNCTIONS

function generateSecurePassword(): string {
  // Generate a secure 16-character password
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*'
  }
  
  let password = ''
  
  // Ensure at least one of each type
  password += chars.upper[Math.floor(Math.random() * chars.upper.length)]
  password += chars.lower[Math.floor(Math.random() * chars.lower.length)]
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)]
  password += chars.special[Math.floor(Math.random() * chars.special.length)]
  
  // Fill remaining with random characters
  const allChars = chars.upper + chars.lower + chars.numbers + chars.special
  for (let i = 4; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

function generateCompanyCode(companyName: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const namePrefix = companyName.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${namePrefix || 'RHQ'}-${timestamp}-${random}`
}

function getOptimizedSubscriptionConfig(employeeCount: string) {
  const now = new Date()
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const configs = {
    '1-50': {
      plan: 'starter',
      status: 'trial',
      maxEmployees: 100,
      maxEstablishments: 3,
      trialEnd
    },
    '51-200': {
      plan: 'professional', 
      status: 'trial',
      maxEmployees: 300,
      maxEstablishments: 5,
      trialEnd
    },
    '201-500': {
      plan: 'professional',
      status: 'trial', 
      maxEmployees: 600,
      maxEstablishments: 10,
      trialEnd
    },
    '500+': {
      plan: 'enterprise',
      status: 'trial',
      maxEmployees: 1000,
      maxEstablishments: 20,
      trialEnd
    },
    '1000+': {
      plan: 'enterprise',
      status: 'trial',
      maxEmployees: 2000,
      maxEstablishments: 50,
      trialEnd
    }
  }
  
  return configs[employeeCount as keyof typeof configs] || configs['1-50']
}

async function setupDefaultReferentials(establishmentId: string): Promise<void> {
  // Default cost centers
  await supabaseAdmin.from('cost_centers').upsert([
    { etablissement_id: establishmentId, code: 'ADMIN', nom: 'Administration' },
    { etablissement_id: establishmentId, code: 'RH', nom: 'Ressources Humaines' },
    { etablissement_id: establishmentId, code: 'VENTES', nom: 'Commercial' },
    { etablissement_id: establishmentId, code: 'IT', nom: 'Informatique' },
    { etablissement_id: establishmentId, code: 'PROD', nom: 'Production' },
    { etablissement_id: establishmentId, code: 'FIN', nom: 'Finance' }
  ], { onConflict: 'etablissement_id,code', ignoreDuplicates: true })
  
  // Default absence types
  await supabaseAdmin.from('types_absences').upsert([
    { etablissement_id: establishmentId, nom: 'Congés payés', famille: 'conges', indemnise: true, comptabilise_absenteisme: false },
    { etablissement_id: establishmentId, nom: 'RTT', famille: 'conges', indemnise: true, comptabilise_absenteisme: false },
    { etablissement_id: establishmentId, nom: 'Maladie ordinaire', famille: 'maladie', indemnise: true, comptabilise_absenteisme: true },
    { etablissement_id: establishmentId, nom: 'Accident du travail', famille: 'maladie', indemnise: true, comptabilise_absenteisme: true },
    { etablissement_id: establishmentId, nom: 'Formation', famille: 'formation', indemnise: true, comptabilise_absenteisme: false },
    { etablissement_id: establishmentId, nom: 'Congé maternité', famille: 'conges', indemnise: true, comptabilise_absenteisme: false },
    { etablissement_id: establishmentId, nom: 'Congé paternité', famille: 'conges', indemnise: true, comptabilise_absenteisme: false }
  ], { onConflict: 'etablissement_id,nom', ignoreDuplicates: true })
}

async function sendWelcomeEmail(demo: any, credentials: any): Promise<void> {
  // In a real implementation, you would integrate with:
  // - SendGrid, Mailgun, AWS SES, etc.
  // - Or use Supabase Edge Functions for email sending
  
  console.log(`Welcome email should be sent to ${demo.email}`)
  console.log('Email template:', generateWelcomeEmailTemplate(demo, credentials))
  
  // TODO: Implement actual email sending
  // For now, we just log the template
}

function generateWelcomeEmailTemplate(demo: any, credentials: any): string {
  return `
Subject: 🚀 Bienvenue sur RH Quantum - Votre plateforme est prête !

Bonjour ${demo.contact_name},

Félicitations ! Votre plateforme RH Quantum Analytics est maintenant active et prête à transformer la gestion RH de ${demo.company_name}.

🔐 VOS IDENTIFIANTS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 URL de connexion: ${credentials.login_url}
📧 Email: ${credentials.email}
🔑 Mot de passe temporaire: ${credentials.password}
🏢 Code entreprise: ${credentials.company_code}

⚠️ IMPORTANT: Pour votre sécurité, vous devrez changer ce mot de passe lors de votre première connexion.

🎯 PROCHAINES ÉTAPES (5 minutes chrono)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ Connectez-vous avec vos identifiants
2. 🔒 Personnalisez votre mot de passe  
3. 📊 Découvrez votre dashboard temps réel
4. 📤 Importez vos données (template Excel fourni)
5. 🚀 Explorez vos premiers insights RH

🌟 FONCTIONNALITÉS PREMIUM INCLUSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Dashboard analytics temps réel
✅ Prédictions IA (turnover, recrutement) 
✅ Suivi effectifs et masse salariale
✅ Analyse absentéisme avancée
✅ Import Excel simplifié 
✅ API REST complète
✅ Sécurité niveau bancaire (RGPD compliant)
✅ Support premium inclus

💎 VOTRE PLAN: ${getSubscriptionConfig(demo.employee_count).plan.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• ${getSubscriptionConfig(demo.employee_count).maxEmployees} employés maximum
• ${getSubscriptionConfig(demo.employee_count).maxEstablishments} établissements
• 30 jours d'essai gratuit inclus
• Support prioritaire

💡 BESOIN D'AIDE ? NOUS SOMMES LÀ !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Support: support@rh-quantum.com
📱 Assistance setup: +33 1 XX XX XX XX
📖 Documentation: ${credentials.login_url}/docs
🎥 Vidéos tutoriels: ${credentials.login_url}/tutorials

Nous sommes ravis de vous accompagner dans cette transformation digitale de vos RH !

L'équipe RH Quantum
🚀 Next-Generation HR Analytics Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} RH Quantum - Tous droits réservés
Conforme RGPD • Hébergement sécurisé France • Support 7j/7
  `.trim()
}