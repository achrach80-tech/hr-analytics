'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Building2, User, Mail, Phone, Clock,
  CheckCircle, XCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Copy,
  Key, Shield, Loader2, ExternalLink, AlertCircle,
  Users, CreditCard, Globe, Star, Target, Award,
  CheckCircle2, X
} from 'lucide-react'

// Enhanced types for better type safety
interface DemoRequest {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  employee_count: string
  industry?: string
  message?: string
  status: string
  created_at: string
  updated_at?: string
  converted_to_company_id?: string
}

interface ConversionResult {
  success: boolean
  company?: any
  user_id?: string
  credentials?: {
    email: string
    password: string
    login_url: string
    company_code: string
  }
  error?: string
}

interface ConversionStep {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message: string
}

export default function EnhancedAdminDemosPage() {
  const [demos, setDemos] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [convertingDemo, setConvertingDemo] = useState<string | null>(null)
  const [conversionSteps, setConversionSteps] = useState<ConversionStep[]>([])
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadDemos()
  }, [filter])

  const loadDemos = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      
      if (error) {
        setError(`Error loading demos: ${error.message}`)
      } else {
        setDemos(data || [])
      }
    } catch (err) {
      console.error('Unexpected error loading demos:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateDemoStatus = async (demoId: string, newStatus: string) => {
    await supabase
      .from('demo_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', demoId)
    
    loadDemos()
  }

  // Enhanced one-click company creation function
  const createCompanyFromDemo = async (demo: DemoRequest) => {
    if (convertingDemo) return // Prevent multiple simultaneous conversions
    
    setConvertingDemo(demo.id)
    setConversionResult(null)
    
    // Initialize conversion steps
    const steps: ConversionStep[] = [
      { id: 'validation', title: 'Validation des données', status: 'pending', message: 'Vérification des informations...' },
      { id: 'user', title: 'Création compte utilisateur', status: 'pending', message: 'Génération des identifiants...' },
      { id: 'company', title: 'Création entreprise', status: 'pending', message: 'Configuration de l\'entreprise...' },
      { id: 'establishment', title: 'Établissement par défaut', status: 'pending', message: 'Création du siège social...' },
      { id: 'referentials', title: 'Référentiels par défaut', status: 'pending', message: 'Configuration des données de base...' },
      { id: 'completion', title: 'Finalisation', status: 'pending', message: 'Activation du compte...' }
    ]
    setConversionSteps(steps)
    
    try {
      // Step 1: Validation
      updateStepStatus('validation', 'processing', 'Validation en cours...')
      
      if (!demo.company_name || !demo.contact_name || !demo.email) {
        throw new Error('Informations demo incomplètes')
      }
      
      updateStepStatus('validation', 'completed', 'Validation réussie')
      
      // Call API route for company creation
      updateStepStatus('user', 'processing', 'Appel API de création...')
      
      const response = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoId: demo.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `API Error: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Conversion failed')
      }
      
      // Update all steps to completed since API handles everything
      updateStepStatus('user', 'completed', 'Compte utilisateur créé')
      updateStepStatus('company', 'completed', 'Entreprise créée')
      updateStepStatus('establishment', 'completed', 'Établissement créé')
      updateStepStatus('referentials', 'completed', 'Référentiels configurés')
      updateStepStatus('completion', 'completed', 'Conversion terminée avec succès')

      // Set success result
      setConversionResult(result)
      setShowSuccessModal(true)
      
      // Reload demos
      setTimeout(() => loadDemos(), 1000)
      
    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      // Update current step to error
      const currentStep = conversionSteps.find(s => s.status === 'processing')
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage)
      }
      
      setConversionResult({
        success: false,
        error: errorMessage
      })
      
    } finally {
      setConvertingDemo(null)
    }
  }

  const updateStepStatus = (stepId: string, status: ConversionStep['status'], message: string) => {
    setConversionSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ))
  }

  const generateSecurePassword = (): string => {
    const length = 14
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const generateCompanyCode = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `RHQ-${timestamp}-${random}`
  }

  const getSubscriptionConfig = (employeeCount: string) => {
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

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Show toast notification
      showToast(`${type} copié dans le presse-papiers!`, 'success')
    } catch (err) {
      showToast(`Erreur lors de la copie`, 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-[9999] animate-slide-in ${
      type === 'success' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
    }`
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        ${type === 'success' ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'}
        ${message}
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const generateEmailTemplate = (demo: DemoRequest, credentials: any) => {
    return `Subject: 🚀 Votre plateforme RH Quantum est prête !

Bonjour ${demo.contact_name},

Excellente nouvelle ! Votre plateforme RH Quantum Analytics est maintenant active et prête à transformer la gestion RH de ${demo.company_name}.

🔐 VOS IDENTIFIANTS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 URL de connexion: ${credentials.login_url}
📧 Email: ${credentials.email}
🔑 Mot de passe temporaire: ${credentials.password}
🏢 Code entreprise: ${credentials.company_code}

⚠️ IMPORTANT: Pour votre sécurité, vous devrez changer ce mot de passe lors de votre première connexion.

🎯 PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Connectez-vous avec vos identifiants ci-dessus
2. Changez votre mot de passe temporaire
3. Découvrez votre dashboard RH personnalisé
4. Importez vos premières données (modèle Excel fourni)
5. Explorez les insights et KPIs temps réel

🚀 FONCTIONNALITÉS DISPONIBLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Dashboard analytics temps réel
✅ Suivi effectifs et turnover
✅ Analyse masse salariale
✅ Gestion absentéisme
✅ Import Excel simplifié
✅ Sécurité niveau bancaire (RGPD)

💡 BESOIN D'AIDE ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre équipe support est là pour vous accompagner :
• Email: support@rh-quantum.com
• Documentation: ${window.location.origin}/docs
• Assistance configuration incluse

Nous sommes ravis de vous accompagner dans cette transformation digitale de vos RH !

L'équipe RH Quantum
🚀 Next-Generation HR Analytics Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} RH Quantum - Tous droits réservés
Plateforme sécurisée • Conformité RGPD • Support 7j/7`
  }

  const statusConfig: any = {
    pending: { 
      color: 'orange', 
      bg: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      label: 'En attente',
      icon: Clock
    },
    contacted: { 
      color: 'blue',
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      label: 'Contacté',
      icon: Mail
    },
    scheduled: { 
      color: 'purple',
      bg: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      label: 'Démo planifiée',
      icon: Calendar
    },
    demo_completed: { 
      color: 'cyan',
      bg: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      label: 'Démo terminée',
      icon: CheckCircle
    },
    converted: { 
      color: 'green',
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      label: 'Converti',
      icon: Building2
    },
    lost: { 
      color: 'red',
      bg: 'from-red-500/20 to-pink-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: 'Perdu',
      icon: XCircle
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
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
              <p className="text-gray-400 text-lg mt-1">Auto-conversion optimisée vers comptes entreprise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800">
        {['all', 'pending', 'scheduled', 'demo_completed', 'converted'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {status === 'all' ? 'Tous' : statusConfig[status]?.label || status}
            {status !== 'all' && (
              <span className="ml-2 text-xs opacity-70">
                ({demos.filter(d => d.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Demo Cards */}
      <div className="space-y-6">
        {demos.map((demo) => {
          const isExpanded = expandedDemo === demo.id
          const config = statusConfig[demo.status]
          const isConverting = convertingDemo === demo.id
          
          return (
            <div 
              key={demo.id} 
              className={`relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border ${config.border} rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-${config.color}-500/10`}
            >
              {/* Status Indicator Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bg}`} />
              
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
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
                      <div className="flex items-center gap-2 text-gray-400">
                        <User size={16} />
                        <span>{demo.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail size={16} />
                        <span>{demo.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users size={16} />
                        <span>{demo.employee_count} employés</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={16} />
                        <span>{new Date(demo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Enhanced Auto-Create Company Button */}
                    {!demo.converted_to_company_id && (
                      <button
                        onClick={() => createCompanyFromDemo(demo)}
                        disabled={isConverting || convertingDemo !== null}
                        className={`px-6 py-3 rounded-xl font-bold transition-all transform flex items-center gap-3 shadow-xl ${
                          isConverting 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 scale-105 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25'
                        }`}
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Conversion...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            <span>Auto-Créer Entreprise</span>
                            <Zap size={16} />
                          </>
                        )}
                      </button>
                    )}

                    {demo.converted_to_company_id && (
                      <div className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-bold flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        Converti avec succès
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
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Détails</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Secteur:</span>
                            <span className="text-gray-300">{demo.industry || 'Non spécifié'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Téléphone:</span>
                            <span className="text-gray-300">{demo.phone || 'Non fourni'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Effectif:</span>
                            <span className="text-gray-300">{demo.employee_count}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Prédictions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Plan suggéré:</span>
                            <span className="text-purple-400 font-bold">
                              {getSubscriptionConfig(demo.employee_count).plan.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Limite employés:</span>
                            <span className="text-cyan-400">
                              {getSubscriptionConfig(demo.employee_count).maxEmployees}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-3">Actions</h4>
                        <div className="space-y-2">
                          {demo.status !== 'converted' && demo.status !== 'lost' && (
                            <>
                              {demo.status === 'pending' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'contacted')}
                                  className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm"
                                >
                                  → Marquer contacté
                                </button>
                              )}
                              {demo.status === 'contacted' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                                  className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm"
                                >
                                  → Planifier démo
                                </button>
                              )}
                              {demo.status === 'scheduled' && (
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                                  className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm"
                                >
                                  → Démo terminée
                                </button>
                              )}
                              <button
                                onClick={() => updateDemoStatus(demo.id, 'lost')}
                                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm"
                              >
                                × Marquer perdu
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {demo.message && (
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                        <h4 className="text-white font-semibold mb-2">Message</h4>
                        <p className="text-gray-300 text-sm">{demo.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion Progress Modal */}
      {convertingDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 opacity-75 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
                    <Sparkles size={40} className="text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 font-mono">
                  CONVERSION AUTO EN COURS
                </h3>
                <p className="text-purple-400 font-mono">Création entreprise optimisée</p>
              </div>

              <div className="space-y-4">
                {conversionSteps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      step.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                      step.status === 'processing' ? 'bg-purple-500/10 border-purple-500/30' :
                      step.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-gray-500/10 border-gray-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {step.status === 'completed' && <CheckCircle2 size={20} className="text-green-400" />}
                      {step.status === 'processing' && <Loader2 size={20} className="text-purple-400 animate-spin" />}
                      {step.status === 'error' && <AlertCircle size={20} className="text-red-400" />}
                      {step.status === 'pending' && <Clock size={20} className="text-gray-400" />}
                      
                      <div className="flex-1">
                        <p className="font-medium text-white">{step.title}</p>
                        <p className={`text-sm ${
                          step.status === 'completed' ? 'text-green-400' :
                          step.status === 'processing' ? 'text-purple-400' :
                          step.status === 'error' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {step.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {conversionResult?.success === false && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setConvertingDemo(null)
                      setConversionResult(null)
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-bold"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && conversionResult?.success && conversionResult.credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-green-500/30 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Conversion Réussie !</h2>
                    <p className="text-gray-400">Entreprise créée et prête à l'utilisation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setConversionResult(null)
                  }}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Company Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Building2 size={20} />
                    Détails Entreprise
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nom:</span>
                      <span className="text-white font-medium">{conversionResult.company.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Code:</span>
                      <span className="text-cyan-400 font-mono">{conversionResult.credentials.company_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan:</span>
                      <span className="text-purple-400 uppercase">{conversionResult.company.subscription_plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Statut:</span>
                      <span className="text-green-400">Actif</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Key size={20} />
                    Identifiants de Connexion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Email</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conversionResult.credentials.email}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(conversionResult.credentials!.email, 'Email')}
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Mot de passe temporaire</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conversionResult.credentials.password}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(conversionResult.credentials!.password, 'Mot de passe')}
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-xs block mb-1">URL de connexion</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conversionResult.credentials.login_url}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(conversionResult.credentials!.login_url, 'URL')}
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Template */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                  <Mail size={20} />
                  Email de Bienvenue Prêt
                </h3>
                <div className="bg-gray-900/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {generateEmailTemplate(demos.find(d => d.id === convertingDemo)!, conversionResult.credentials)}
                  </pre>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      const demo = demos.find(d => d.id === convertingDemo)!
                      copyToClipboard(generateEmailTemplate(demo, conversionResult.credentials!), 'Template email')
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Copy size={16} />
                    Copier Email
                  </button>
                  <button
                    onClick={() => {
                      const demo = demos.find(d => d.id === convertingDemo)!
                      const subject = '🚀 Votre plateforme RH Quantum est prête !'
                      const body = generateEmailTemplate(demo, conversionResult.credentials!)
                      window.location.href = `mailto:${demo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Envoyer Email
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setConversionResult(null)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-all"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    window.open(conversionResult.credentials!.login_url, '_blank')
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  Tester la Connexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideDown { 
          animation: slideDown 0.3s ease-out; 
        }
        .animate-slide-in { 
          animation: slide-in 0.3s ease-out; 
        }
      `}</style>
    </div>
  )
}