// app/admin/demos/page.tsx
// VERSION MODIFIÉE qui utilise l'API route avec service_role

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Building2, User, Mail, Phone, Clock,
  CheckCircle, XCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Copy,
  Key, Shield, Loader2, ExternalLink
} from 'lucide-react'

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingCompany, setCreatingCompany] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadDemos()
  }, [filter])

  // ✅ MODIFICATION: Utiliser l'API route au lieu de Supabase direct
  const loadDemos = async () => {
    console.log('Loading demos with filter:', filter)
    setLoading(true)
    setError(null)

    try {
      // Appeler l'API route qui utilise service_role
      const response = await fetch(`/api/admin/demo-requests?status=${filter}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load demos')
      }

      console.log(`Loaded ${result.data?.length || 0} demos`)
      setDemos(result.data || [])
    } catch (err) {
      console.error('Error loading demos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load demos')
    } finally {
      setLoading(false)
    }
  }

  // ✅ MODIFICATION: Utiliser l'API route pour update
  const updateDemoStatus = async (demoId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: demoId, status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update demo')
      }

      loadDemos()
    } catch (err) {
      console.error('Error updating demo:', err)
      alert('Failed to update demo status')
    }
  }

  const createCompanyFromDemo = async (demo: any) => {
    setCreatingCompany(demo.id)
    
    try {
      const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      const companyCode = `RHQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      
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
            white_label: false
          },
          ai_features_enabled: false,
          login_count: 0
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        throw new Error(`Failed to create company: ${companyError.message}`)
      }

      console.log('Company created:', company.id)

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
          employee_count: 0
        })
        .select()
        .single()

      if (estError) {
        console.error('Establishment creation error:', estError)
        throw new Error(`Failed to create establishment: ${estError.message}`)
      }

      console.log('Establishment created:', establishment.id)

      // Update demo status via API
      await fetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: demo.id,
          status: 'converted',
          converted_to_company_id: company.id
        })
      })

      showSuccessModal(demo, accessToken, company)
      
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

  const showSuccessModal = (demo: any, token: string, company: any) => {
    const modal = document.createElement('div')
    modal.id = 'success-modal'
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn'
    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-green-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-slideUp">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-3xl font-bold text-white">Company Created Successfully!</h2>
            <p class="text-slate-400">Access credentials generated</p>
          </div>
        </div>
        
        <div class="bg-slate-800/50 rounded-2xl p-6 mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            Company Details
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-slate-500">Name:</span>
              <p class="text-white font-medium">${company.nom}</p>
            </div>
            <div>
              <span class="text-slate-500">Code:</span>
              <p class="text-white font-mono">${company.code_entreprise}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
          <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Access Token
          </h3>
          <div class="flex gap-2 items-center">
            <input readonly value="${token}" class="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-mono text-sm">
            <button onclick="navigator.clipboard.writeText('${token}'); this.innerHTML='✓ Copied'" class="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all">
              Copy
            </button>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button onclick="document.getElementById('success-modal').remove()" class="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all">
            Close
          </button>
          <a href="/admin/companies" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl text-white font-semibold text-center transition-all">
            View All Companies
          </a>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  const statusConfig: any = {
    pending: {
      label: 'Pending',
      bg: 'from-yellow-500/10 to-orange-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      icon: Clock
    },
    contacted: {
      label: 'Contacted',
      bg: 'from-blue-500/10 to-cyan-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: Mail
    },
    scheduled: {
      label: 'Scheduled',
      bg: 'from-purple-500/10 to-pink-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: Calendar
    },
    demo_completed: {
      label: 'Demo Completed',
      bg: 'from-cyan-500/10 to-teal-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: CheckCircle
    },
    converted: {
      label: 'Converted',
      bg: 'from-green-500/10 to-emerald-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: CheckCircle
    },
    lost: {
      label: 'Lost',
      bg: 'from-red-500/10 to-pink-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: XCircle
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Demos</h3>
        <p className="text-red-300">{error}</p>
        <button 
          onClick={loadDemos}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Sparkles size={28} />
            </div>
            Demo Requests
          </h1>
          <p className="text-slate-400">Manage and convert demo requests</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Total: {demos.length}</span>
          <span>•</span>
          <span>Pending: {demos.filter(d => d.status === 'pending').length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'contacted', 'scheduled', 'demo_completed', 'converted', 'lost'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === status
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Demo Cards */}
      <div className="space-y-4">
        {demos.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
            <Sparkles className="mx-auto mb-4 text-slate-600" size={48} />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No demo requests yet</h3>
            <p className="text-slate-500">New demo requests will appear here</p>
          </div>
        ) : (
          demos.map((demo) => {
            const isExpanded = expandedDemo === demo.id
            const config = statusConfig[demo.status] || statusConfig.pending
            const isCreating = creatingCompany === demo.id

            return (
              <div key={demo.id} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all animate-slideUp">
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-bold text-white">{demo.company_name}</h3>
                      <div className={`px-4 py-1.5 bg-gradient-to-r ${config.bg} ${config.border} border rounded-xl flex items-center gap-2`}>
                        <config.icon size={16} className={config.text} />
                        <span className={`${config.text} text-sm font-medium`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User size={16} />
                        <span>{demo.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail size={16} />
                        <span>{demo.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 size={16} />
                        <span>{demo.employee_count} employees</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={16} />
                        <span>{new Date(demo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!demo.converted_to_company_id && (
                      <button
                        onClick={() => createCompanyFromDemo(demo)}
                        disabled={isCreating}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 rounded-xl text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
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
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-700 animate-slideDown">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Industry:</span>
                            <span className="text-slate-300">{demo.industry || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phone:</span>
                            <span className="text-slate-300">{demo.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Country:</span>
                            <span className="text-slate-300">{demo.country || 'France'}</span>
                          </div>
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
                                  className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm"
                                >
                                  → Mark as Contacted
                                </button>
                              )}
                              {demo.status === 'contacted' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                                  className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm"
                                >
                                  → Schedule Demo
                                </button>
                              )}
                              {demo.status === 'scheduled' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                                  className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm"
                                >
                                  → Complete Demo
                                </button>
                              )}
                              <button
                                onClick={() => updateDemoStatus(demo.id, 'lost')}
                                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm"
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
                            <span className="text-slate-500">Requested:</span>
                            <span className="text-slate-300">
                              {new Date(demo.created_at).toLocaleString()}
                            </span>
                          </div>
                          {demo.updated_at && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Updated:</span>
                              <span className="text-slate-300">
                                {new Date(demo.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {demo.message && (
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-2">Message</h4>
                        <p className="text-slate-300 text-sm">{demo.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

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