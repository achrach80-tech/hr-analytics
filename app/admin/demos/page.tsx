'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Building2, User, Mail, Phone, Clock,
  CheckCircle, XCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Copy,
  Key, Shield, Loader2, ExternalLink
} from 'lucide-react'

// ============================================
// TYPES ET INTERFACES
// ============================================

interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: React.ComponentType<any>;
  cardClasses: string;
  shadowClasses: string;
}

type DemoStatus = 'pending' | 'contacted' | 'scheduled' | 'demo_completed' | 'converted' | 'lost';

interface Demo {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  employee_count: string;
  industry?: string;
  country?: string;
  message?: string;
  status: DemoStatus;
  qualification_score?: number;
  created_at: string;
  updated_at?: string;
  scheduled_date?: string;
  converted_to_company_id?: string;
  source?: string;
}

// ============================================
// CONFIGURATION DES STATUS AVEC CLASSES COMPLETES
// ============================================

const statusConfig: Record<DemoStatus, StatusConfig> = {
  pending: { 
    color: 'orange', 
    bg: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'Pending Review',
    icon: Clock,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-orange-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10',
    shadowClasses: 'hover:shadow-orange-500/10'
  },
  contacted: { 
    color: 'blue',
    bg: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'Contacted',
    icon: Mail,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-blue-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10',
    shadowClasses: 'hover:shadow-blue-500/10'
  },
  scheduled: { 
    color: 'purple',
    bg: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    label: 'Demo Scheduled',
    icon: Calendar,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10',
    shadowClasses: 'hover:shadow-purple-500/10'
  },
  demo_completed: { 
    color: 'cyan',
    bg: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    label: 'Demo Complete',
    icon: CheckCircle,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-cyan-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10',
    shadowClasses: 'hover:shadow-cyan-500/10'
  },
  converted: { 
    color: 'green',
    bg: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    label: 'Converted',
    icon: Building2,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-green-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10',
    shadowClasses: 'hover:shadow-green-500/10'
  },
  lost: { 
    color: 'red',
    bg: 'from-red-500/20 to-pink-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'Lost',
    icon: XCircle,
    cardClasses: 'relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10',
    shadowClasses: 'hover:shadow-red-500/10'
  }
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingCompany, setCreatingCompany] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | DemoStatus>('all')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    converted: 0
  })
  const supabase = createClient()

  useEffect(() => {
    loadDemos()
  }, [filter])

  const loadDemos = async () => {
    console.log('Loading demos with filter:', filter)
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        console.log('Applying filter:', filter)
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      
      console.log('Demo query result:', { 
        data: data?.length, 
        error, 
        filter,
        firstDemo: data?.[0] 
      })

      if (error) {
        console.error('Demo load error:', error)
        setError(`Error loading demos: ${error.message}`)
      } else {
        console.log(`Loaded ${data?.length || 0} demos`)
        if (data) {
          setDemos(data)
          
          // Calculer les stats
          setStats({
            total: data.length,
            pending: data.filter(d => d.status === 'pending').length,
            scheduled: data.filter(d => d.status === 'scheduled').length,
            converted: data.filter(d => d.status === 'converted').length
          })
        }
      }
    } catch (err) {
      console.error('Unexpected error loading demos:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateDemoStatus = async (demoId: string, newStatus: DemoStatus) => {
    try {
      const { error } = await supabase
        .from('demo_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', demoId)
      
      if (error) {
        console.error('Status update error:', error)
        alert(`Error updating status: ${error.message}`)
      } else {
        loadDemos()
      }
    } catch (err) {
      console.error('Unexpected error updating status:', err)
      alert('Unexpected error occurred')
    }
  }

  const createCompanyFromDemo = async (demo: Demo) => {
    setCreatingCompany(demo.id)
    
    try {
      // Generate secure credentials
      const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      const companyCode = `RHQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      
      // Create URL slug
      const urlSlug = demo.company_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50)

      console.log('Creating company with:', { 
        nom: demo.company_name,
        code_entreprise: companyCode,
        billing_email: demo.email
      })

      // Create company with ALL required fields from schema
      const { data: company, error: companyError } = await supabase
        .from('entreprises')
        .insert({
          nom: demo.company_name,
          code_entreprise: companyCode,
          access_token: accessToken,
          access_url_slug: urlSlug,
          subscription_plan: 'trial',
          subscription_status: 'active',
          billing_email: demo.email,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          activation_date: new Date().toISOString(),
          onboarding_status: 'trial_started',
          max_employees: demo.employee_count === '1-50' ? 100 : 
                         demo.employee_count === '51-200' ? 300 :
                         demo.employee_count === '201-500' ? 600 : 1000,
          features: {
            export: true,
            api: false,
            white_label: false,
            advanced_analytics: false
          },
          ai_features_enabled: false,
          login_count: 0,
          seuil_turnover_default: 15.0,
          seuil_absenteisme_default: 8.0,
          devise: 'EUR',
          timezone: 'Europe/Paris'
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        throw new Error(`Failed to create company: ${companyError.message}`)
      }

      console.log('Company created:', company.id)

      // Create default establishment
      const { data: establishment, error: estError } = await supabase
        .from('etablissements')
        .insert({
          entreprise_id: company.id,
          nom: `${demo.company_name} - Siège`,
          code_etablissement: 'SIEGE',
          is_headquarters: true,
          statut: 'Actif',
          pays: demo.country || 'France',
          timezone: 'Europe/Paris',
          employee_count: 0,
          active_employee_count: 0
        })
        .select()
        .single()

      if (estError) {
        console.error('Establishment creation error:', estError)
        throw new Error(`Failed to create establishment: ${estError.message}`)
      }

      console.log('Establishment created:', establishment.id)

      // Create default organizational referentials
      const { error: refError } = await supabase
        .from('referentiel_organisation')
        .insert([
          {
            etablissement_id: establishment.id,
            code_cost_center: 'ADMIN',
            nom_cost_center: 'Administration',
            code_site: 'SIEGE',
            nom_site: 'Siège Social',
            code_direction: 'ADMIN',
            nom_direction: 'Administration'
          },
          {
            etablissement_id: establishment.id,
            code_cost_center: 'RH',
            nom_cost_center: 'Ressources Humaines',
            code_site: 'SIEGE',
            nom_site: 'Siège Social',
            code_direction: 'ADMIN',
            nom_direction: 'Administration'
          }
        ])

      if (refError) {
        console.warn('Referentials setup warning:', refError.message)
        // Don't throw - this is not critical
      }

      // Update demo status
      const { error: updateError } = await supabase
        .from('demo_requests')
        .update({
          status: 'converted',
          converted_to_company_id: company.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', demo.id)

      if (updateError) {
        console.error('Demo update error:', updateError)
      }

      // Show success modal
      showSuccessModal(demo, accessToken, company)
      
      // Reload after short delay
      setTimeout(() => {
        setFilter('all')
        loadDemos()
      }, 1000)
      
    } catch (error) {
      console.error('Company creation failed:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingCompany(null)
    }
  }

  const showSuccessModal = (demo: Demo, token: string, company: any) => {
    const modal = document.createElement('div')
    modal.id = 'success-modal'
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    
    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-2xl w-full border border-green-500/30 shadow-2xl">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-3xl font-bold text-white">Company Created!</h2>
            <p class="text-gray-400">${demo.company_name} is now active</p>
          </div>
        </div>
        
        <div class="space-y-4 mb-6">
          <div class="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div class="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
              Access Token
            </div>
            <div class="flex gap-2">
              <input 
                type="text" 
                value="${token}" 
                readonly 
                class="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white font-mono text-sm"
                id="token-input"
              />
              <button 
                onclick="copyToClipboard('${token}')"
                class="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 font-medium transition-all"
                id="copy-btn"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <p class="text-gray-500 text-sm mb-1">Company Code</p>
              <p class="text-white font-mono">${company.code_entreprise}</p>
            </div>
            <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <p class="text-gray-500 text-sm mb-1">Login URL</p>
              <p class="text-white text-sm">${window.location.origin}/login</p>
            </div>
          </div>
          
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h4 class="text-blue-400 font-semibold mb-2">Ready to Send</h4>
            <p class="text-gray-300 text-sm mb-3">Email template for ${demo.email}:</p>
            <div class="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-300">
              Subject: Your RH Quantum Account is Ready!<br><br>
              Hi ${demo.contact_name},<br><br>
              Your RH Quantum analytics platform is now active!<br><br>
              🔗 Login: ${window.location.origin}/login<br>
              🔑 Access Token: ${token}<br><br>
              Start by importing your HR data to see instant insights.<br><br>
              Need help? Reply to this email.<br><br>
              The RH Quantum Team
            </div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button 
            onclick="document.getElementById('success-modal').remove()"
            class="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold transition-all"
          >
            Close
          </button>
          <button 
            onclick="sendCredentialsEmail('${demo.email}', '${demo.contact_name}', '${token}')"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Send Credentials
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add helper functions to window
    ;(window as any).copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
      const btn = document.getElementById('copy-btn')
      if (btn) {
        btn.innerHTML = '✓ Copied!'
        setTimeout(() => btn.innerHTML = 'Copy', 2000)
      }
    }
    
    ;(window as any).sendCredentialsEmail = (email: string, name: string, token: string) => {
      // This would integrate with your email service
      console.log('Sending credentials to:', { email, name, token })
      alert(`Credentials sent to ${email}! (In production, integrate with your email service)`)
      document.getElementById('success-modal')?.remove()
    }
  }

  // Composant de statistiques
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-sm text-gray-400">Total Requests</div>
      </div>
      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4">
        <div className="text-2xl font-bold text-orange-400">{stats.pending}</div>
        <div className="text-sm text-gray-400">Pending</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
        <div className="text-2xl font-bold text-purple-400">{stats.scheduled}</div>
        <div className="text-sm text-gray-400">Scheduled</div>
      </div>
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
        <div className="text-2xl font-bold text-green-400">{stats.converted}</div>
        <div className="text-sm text-gray-400">Converted</div>
      </div>
    </div>
  )

  // Composant de chargement amélioré
  if (loading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 border-4 border-cyan-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-t-cyan-500 rounded-full animate-spin" />
        </div>
        <p className="text-gray-400 animate-pulse">Loading demo requests...</p>
      </div>
    )
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Demos</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={loadDemos}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl text-white font-semibold transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec gradient animé */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-green-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
              <Calendar size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                Demo Requests
              </h1>
              <p className="text-gray-400 text-lg mt-1">Convert prospects into active clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <StatsCards />

      {/* Onglets de filtre */}
      <div className="flex gap-2 p-1 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800">
        {(['all', 'pending', 'contacted', 'scheduled', 'demo_completed', 'converted'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {status === 'all' ? 'All' : (statusConfig[status as DemoStatus]?.label || status)}
            {status !== 'all' && (
              <span className="ml-2 text-xs opacity-70">
                ({demos.filter(d => d.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message si aucune démo */}
      {demos.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800/50 border border-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Demo Requests</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? 'No demo requests found. New requests will appear here.'
              : `No ${filter} demos found. Try a different filter.`
            }
          </p>
        </div>
      )}

      {/* Cartes des démos */}
      <div className="space-y-6">
        {demos.map((demo: Demo) => {
          const isExpanded = expandedDemo === demo.id
          const config = statusConfig[demo.status] || statusConfig.pending
          const isCreating = creatingCompany === demo.id
          const IconComponent = config.icon
          
          return (
            <div 
              key={demo.id} 
              className={config.cardClasses}
            >
              {/* Indicateur de statut en haut */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bg}`} />
              
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-white">{demo.company_name}</h3>
                      <div className={`px-4 py-1.5 bg-gradient-to-r ${config.bg} ${config.border} border rounded-xl flex items-center gap-2`}>
                        <IconComponent size={16} className={config.text} />
                        <span className={`${config.text} text-sm font-medium`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User size={16} />
                        <span>{demo.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail size={16} />
                        <span className="truncate">{demo.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Building2 size={16} />
                        <span>{demo.employee_count} employees</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={16} />
                        <span>{new Date(demo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bouton de conversion universel */}
                    {!demo.converted_to_company_id && (
                      <button
                        onClick={() => createCompanyFromDemo(demo)}
                        disabled={isCreating}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Zap size={18} />
                            Create Company
                          </>
                        )}
                      </button>
                    )}

                    {/* Actions rapides selon le statut */}
                    {demo.status === 'pending' && (
                      <button
                        onClick={() => updateDemoStatus(demo.id, 'contacted')}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all"
                      >
                        Mark Contacted
                      </button>
                    )}
                    
                    {demo.converted_to_company_id && (
                      <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-medium flex items-center gap-2">
                        <CheckCircle size={18} />
                        Converted
                      </div>
                    )}
                    
                    <button
                      onClick={() => setExpandedDemo(isExpanded ? null : demo.id)}
                      className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
                    >
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
                
                {/* Détails étendus */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Industry:</span>
                            <span className="text-gray-300">{demo.industry || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phone:</span>
                            <span className="text-gray-300">{demo.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Country:</span>
                            <span className="text-gray-300">{demo.country || 'France'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Source:</span>
                            <span className="text-gray-300">{demo.source || 'Website'}</span>
                          </div>
                          {demo.qualification_score && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Score:</span>
                              <span className="text-gray-300">{demo.qualification_score}/100</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Status Flow</h4>
                        <div className="space-y-2">
                          {demo.status !== 'converted' && demo.status !== 'lost' && (
                            <>
                              {demo.status === 'pending' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'contacted')}
                                  className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-all"
                                >
                                  → Mark as Contacted
                                </button>
                              )}
                              {demo.status === 'contacted' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                                  className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-all"
                                >
                                  → Schedule Demo
                                </button>
                              )}
                              {demo.status === 'scheduled' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                                  className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm transition-all"
                                >
                                  → Complete Demo
                                </button>
                              )}
                              <button
                                onClick={() => updateDemoStatus(demo.id, 'lost')}
                                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all"
                              >
                                × Mark as Lost
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Timeline</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Requested:</span>
                            <span className="text-gray-300">
                              {new Date(demo.created_at).toLocaleString()}
                            </span>
                          </div>
                          {demo.updated_at && demo.updated_at !== demo.created_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Updated:</span>
                              <span className="text-gray-300">
                                {new Date(demo.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {demo.scheduled_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Scheduled:</span>
                              <span className="text-gray-300">
                                {new Date(demo.scheduled_date).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {demo.message && (
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Mail size={16} />
                          Message
                        </h4>
                        <p className="text-gray-300 text-sm italic">"{demo.message}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CSS pour les animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  )
}