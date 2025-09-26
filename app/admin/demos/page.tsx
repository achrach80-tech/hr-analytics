'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Building2, User, Mail, Phone, Clock,
  CheckCircle, XCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Copy,
  Key, Shield, Loader2, ExternalLink, AlertCircle,
  Users, CreditCard, Globe, Star, Target, Award,
  CheckCircle2, X, Filter, Search, MoreVertical,
  Eye, Download, TrendingUp, Activity, Briefcase,
  MapPin, MessageSquare, FileText, Link as LinkIcon,
  RefreshCw, AlertTriangle, Info
} from 'lucide-react'

interface DemoRequest {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  employee_count: string
  industry?: string
  country?: string
  message?: string
  status: string
  created_at: string
  updated_at?: string
  converted_to_company_id?: string
  assigned_to?: string
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

interface DemoStats {
  total: number
  pending: number
  converted: number
  lost: number
  conversionRate: number
  avgResponseTime: string
}

export default function OptimizedAdminDemosPage() {
  const [demos, setDemos] = useState<DemoRequest[]>([])
  const [filteredDemos, setFilteredDemos] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [convertingDemo, setConvertingDemo] = useState<string | null>(null)
  const [conversionSteps, setConversionSteps] = useState<ConversionStep[]>([])
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState<DemoStats>({
    total: 0,
    pending: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
    avgResponseTime: '24h'
  })

  const supabase = createClient()

  useEffect(() => {
    loadDemos()
  }, [])

  useEffect(() => {
    filterAndSortDemos()
  }, [demos, filter, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    calculateStats()
  }, [demos])

  const loadDemos = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })

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

  const filterAndSortDemos = () => {
    let filtered = demos

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(demo => demo.status === filter)
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(demo => 
        demo.company_name?.toLowerCase().includes(search) ||
        demo.contact_name?.toLowerCase().includes(search) ||
        demo.email?.toLowerCase().includes(search) ||
        demo.industry?.toLowerCase().includes(search)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'company':
          comparison = a.company_name.localeCompare(b.company_name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredDemos(filtered)
  }

  const calculateStats = () => {
    const total = demos.length
    const pending = demos.filter(d => d.status === 'pending').length
    const converted = demos.filter(d => d.status === 'converted').length
    const lost = demos.filter(d => d.status === 'lost').length
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0

    setStats({
      total,
      pending,
      converted,
      lost,
      conversionRate,
      avgResponseTime: '24h'
    })
  }

  const updateDemoStatus = async (demoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('demo_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', demoId)

      if (error) throw error
      
      await loadDemos()
      showToast(`Statut mis à jour: ${newStatus}`, 'success')
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const createCompanyFromDemo = async (demo: DemoRequest) => {
    if (convertingDemo) return
    
    setConvertingDemo(demo.id)
    setConversionResult(null)
    setShowConversionModal(true)
    
    const steps: ConversionStep[] = [
      { id: 'validation', title: 'Validation des données', status: 'pending', message: 'Vérification...' },
      { id: 'user', title: 'Création utilisateur', status: 'pending', message: 'En attente...' },
      { id: 'company', title: 'Configuration entreprise', status: 'pending', message: 'En attente...' },
      { id: 'establishment', title: 'Établissement principal', status: 'pending', message: 'En attente...' },
      { id: 'referentials', title: 'Données de référence', status: 'pending', message: 'En attente...' },
      { id: 'completion', title: 'Finalisation', status: 'pending', message: 'En attente...' }
    ]
    setConversionSteps(steps)
    
    try {
      updateStepStatus('validation', 'processing', 'Validation en cours...')
      
      if (!demo.company_name || !demo.contact_name || !demo.email) {
        throw new Error('Informations demo incomplètes')
      }
      
      updateStepStatus('validation', 'completed', 'Validation réussie')
      updateStepStatus('user', 'processing', 'Appel API de création...')
      
      const response = await fetch('/api/admin/create-company-from-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId: demo.id })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `API Error: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Conversion failed')
      }
      
      updateStepStatus('user', 'completed', 'Utilisateur créé')
      updateStepStatus('company', 'completed', 'Entreprise configurée')
      updateStepStatus('establishment', 'completed', 'Établissement créé')
      updateStepStatus('referentials', 'completed', 'Référentiels configurés')
      updateStepStatus('completion', 'completed', 'Conversion terminée')

      setConversionResult(result)
      
      setTimeout(() => {
        setShowConversionModal(false)
        setShowSuccessModal(true)
        loadDemos()
      }, 1500)
      
    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      const currentStep = conversionSteps.find(s => s.status === 'processing')
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage)
      }
      
      setConversionResult({
        success: false,
        error: errorMessage
      })
      
    } finally {
      setTimeout(() => {
        setConvertingDemo(null)
      }, 3000)
    }
  }

  const updateStepStatus = (stepId: string, status: ConversionStep['status'], message: string) => {
    setConversionSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
  }

  const getSubscriptionConfig = (employeeCount: string) => {
    switch (employeeCount) {
      case '1-50': return { plan: 'starter', maxEmployees: 100, maxEstablishments: 2 }
      case '51-200': return { plan: 'professional', maxEmployees: 300, maxEstablishments: 5 }
      case '201-500': return { plan: 'professional', maxEmployees: 600, maxEstablishments: 10 }
      case '500+':
      case '1000+': return { plan: 'enterprise', maxEmployees: 1000, maxEstablishments: 20 }
      default: return { plan: 'starter', maxEmployees: 100, maxEstablishments: 2 }
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${type} copié!`, 'success')
    } catch (err) {
      showToast('Erreur lors de la copie', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div')
    const bgClass = type === 'success' ? 'from-green-500 to-emerald-500' : 
                   type === 'error' ? 'from-red-500 to-pink-500' : 
                   'from-blue-500 to-cyan-500'
    
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-[9999] bg-gradient-to-r ${bgClass} text-white animate-slide-in`
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        ${message}
      </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const generateEmailTemplate = (demo: DemoRequest, credentials: any) => {
    return `Subject: 🚀 Votre plateforme RH Quantum est prête !

Bonjour ${demo.contact_name},

Excellente nouvelle ! Votre plateforme RH Quantum Analytics est maintenant active.

🔐 IDENTIFIANTS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 URL: ${credentials.login_url}
📧 Email: ${credentials.email}
🔑 Mot de passe: ${credentials.password}
🏢 Code entreprise: ${credentials.company_code}

⚠️ Changez ce mot de passe lors de votre première connexion.

🎯 PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Connectez-vous avec vos identifiants
2. Personnalisez votre mot de passe
3. Explorez votre dashboard personnalisé
4. Importez vos données RH (template fourni)
5. Découvrez vos KPIs temps réel

🚀 FONCTIONNALITÉS INCLUSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Dashboard analytics temps réel
✅ Suivi effectifs et turnover  
✅ Analyse masse salariale
✅ Gestion absentéisme
✅ Import Excel optimisé
✅ Sécurité RGPD niveau bancaire

💡 SUPPORT INCLUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Email: support@rh-quantum.com
• Documentation: ${credentials.login_url.replace('/login', '/docs')}
• Formation personnalisée incluse

Bienvenue dans l'avenir des RH !

L'équipe RH Quantum
🚀 Next-Generation HR Analytics Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} RH Quantum - Tous droits réservés`
  }

  const exportDemos = () => {
    const csv = [
      ['Entreprise', 'Contact', 'Email', 'Effectif', 'Secteur', 'Statut', 'Date création'],
      ...filteredDemos.map(demo => [
        demo.company_name,
        demo.contact_name,
        demo.email,
        demo.employee_count,
        demo.industry || '',
        demo.status,
        new Date(demo.created_at).toLocaleDateString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `demos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
    qualified: {
      color: 'purple',
      bg: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      label: 'Qualifié',
      icon: Target
    },
    scheduled: { 
      color: 'cyan',
      bg: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      label: 'Démo planifiée',
      icon: Calendar
    },
    demo_completed: { 
      color: 'indigo',
      bg: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      label: 'Démo terminée',
      icon: CheckCircle
    },
    converted: { 
      color: 'green',
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      label: 'Converti ✨',
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
      {/* Enhanced Header with Stats */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-green-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <Calendar size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Demo Requests
                </h1>
                <p className="text-gray-400 text-lg mt-1">Conversion automatisée optimisée</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={exportDemos}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 rounded-xl text-white font-medium transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={loadDemos}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-blue-400" />
                <span className="text-slate-400 text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-orange-400" />
                <span className="text-slate-400 text-sm">En attente</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{stats.pending}</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-slate-400 text-sm">Convertis</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.converted}</p>
            </div>

            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={16} className="text-red-400" />
                <span className="text-slate-400 text-sm">Perdus</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-400" />
                <span className="text-slate-400 text-sm">Conversion</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.conversionRate}%</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-cyan-400" />
                <span className="text-slate-400 text-sm">Réponse moy.</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{stats.avgResponseTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 overflow-x-auto">
          {['all', 'pending', 'contacted', 'qualified', 'scheduled', 'demo_completed', 'converted', 'lost'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
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

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par entreprise, contact, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="date">Trier par date</option>
              <option value="company">Trier par entreprise</option>
              <option value="status">Trier par statut</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white hover:bg-gray-800/50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="space-y-6">
        {filteredDemos.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Calendar size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">
              {searchTerm || filter !== 'all' ? 'Aucun résultat trouvé' : 'Aucune demande de démo'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || filter !== 'all' ? 'Ajustez vos filtres' : 'Les nouvelles demandes apparaîtront ici'}
            </p>
          </div>
        ) : (
          filteredDemos.map((demo) => {
            const isExpanded = expandedDemo === demo.id
            const config = statusConfig[demo.status]
            const isConverting = convertingDemo === demo.id
            const subscriptionPlan = getSubscriptionConfig(demo.employee_count)
            
            return (
              <div 
                key={demo.id} 
                className={`relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border ${config.border} rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-${config.color}-500/10`}
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bg}`} />
                
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-2xl font-bold text-white">{demo.company_name}</h3>
                        <div className={`px-4 py-1.5 bg-gradient-to-r ${config.bg} ${config.border} border rounded-xl flex items-center gap-2`}>
                          <config.icon size={16} className={config.text} />
                          <span className={`${config.text} text-sm font-medium`}>
                            {config.label}
                          </span>
                        </div>
                        {subscriptionPlan && (
                          <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                            <span className="text-purple-400 text-xs font-bold uppercase">
                              {subscriptionPlan.plan}
                            </span>
                          </div>
                        )}
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
                          <Users size={16} />
                          <span>{demo.employee_count} employés</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={16} />
                          <span>{new Date(demo.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {demo.industry && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                          <Briefcase size={14} />
                          <span>{demo.industry}</span>
                          {demo.country && (
                            <>
                              <span>•</span>
                              <MapPin size={14} />
                              <span>{demo.country}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Auto-Create Company Button */}
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
                              <span>Auto-Créer</span>
                              <Zap size={16} />
                            </>
                          )}
                        </button>
                      )}

                      {demo.converted_to_company_id && (
                        <div className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 size={20} />
                          Converti
                        </div>
                      )}

                      {/* Quick Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setExpandedDemo(isExpanded ? null : demo.id)}
                          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
                        >
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-700 animate-slideDown">
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Contact Details */}
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <User size={16} />
                            Contact
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Nom:</span>
                              <span className="text-gray-300">{demo.contact_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Email:</span>
                              <button
                                onClick={() => copyToClipboard(demo.email, 'Email')}
                                className="text-gray-300 hover:text-white flex items-center gap-1"
                              >
                                {demo.email}
                                <Copy size={12} />
                              </button>
                            </div>
                            {demo.phone && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Téléphone:</span>
                                <span className="text-gray-300">{demo.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Secteur:</span>
                              <span className="text-gray-300">{demo.industry || 'Non spécifié'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Company Predictions */}
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Target size={16} />
                            Prédictions
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Plan suggéré:</span>
                              <span className="text-purple-400 font-bold uppercase">
                                {subscriptionPlan.plan}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Max employés:</span>
                              <span className="text-cyan-400">{subscriptionPlan.maxEmployees}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Établissements:</span>
                              <span className="text-green-400">{subscriptionPlan.maxEstablishments}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Potentiel:</span>
                              <span className="text-yellow-400">
                                {demo.employee_count === '500+' ? 'Enterprise' : 
                                 demo.employee_count === '201-500' ? 'Moyen' : 'Standard'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Activity size={16} />
                            Actions
                          </h4>
                          <div className="space-y-2">
                            {demo.status !== 'converted' && demo.status !== 'lost' && (
                              <>
                                {demo.status === 'pending' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'contacted')}
                                    className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-all"
                                  >
                                    → Marquer contacté
                                  </button>
                                )}
                                {demo.status === 'contacted' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'qualified')}
                                    className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-all"
                                  >
                                    → Marquer qualifié
                                  </button>
                                )}
                                {(demo.status === 'qualified' || demo.status === 'contacted') && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                                    className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm transition-all"
                                  >
                                    → Planifier démo
                                  </button>
                                )}
                                {demo.status === 'scheduled' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                                    className="w-full px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-sm transition-all"
                                  >
                                    → Démo terminée
                                  </button>
                                )}
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'lost')}
                                  className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all"
                                >
                                  × Marquer perdu
                                </button>
                              </>
                            )}

                            {demo.converted_to_company_id && (
                              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                  <CheckCircle2 size={16} />
                                  <span>Converti avec succès</span>
                                </div>
                                <p className="text-xs text-green-300 mt-1">
                                  ID: {demo.converted_to_company_id.substring(0, 8)}...
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Message */}
                      {demo.message && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
                          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <MessageSquare size={16} />
                            Message
                          </h4>
                          <p className="text-gray-300 text-sm">{demo.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Conversion Progress Modal */}
      {showConversionModal && convertingDemo && (
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
                  CONVERSION AUTO
                </h3>
                <p className="text-purple-400 font-mono">Création entreprise en cours...</p>
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
                      setShowConversionModal(false)
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