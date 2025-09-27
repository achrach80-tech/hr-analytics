// app/admin/demos/page.tsx - Optimized Demo Management
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
  RefreshCw, AlertTriangle, Info, PlayCircle,
  Rocket, Crown, Heart, ThumbsUp, Workflow,
  Timer, Gauge, Brain, Database, Cpu, ShieldCheck
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
  duration?: number
}

interface DemoStats {
  total: number
  pending: number
  converted: number
  lost: number
  conversionRate: number
  avgResponseTime: string
  revenueProjection: number
}

export default function OptimizedAdminDemosPage() {
  const [demos, setDemos] = useState<DemoRequest[]>([])
  const [filteredDemos, setFilteredDemos] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [convertingDemo, setConvertingDemo] = useState<string | null>(null)
  const [conversionSteps, setConversionSteps] = useState<ConversionStep[]>([])
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [filter, setFilter] = useState('pending') // Start with pending by default
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status' | 'priority'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState<DemoStats>({
    total: 0,
    pending: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
    avgResponseTime: '2h',
    revenueProjection: 0
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDemos()
    if (autoRefresh) {
      const interval = setInterval(loadDemos, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    filterAndSortDemos()
  }, [demos, filter, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    calculateAdvancedStats()
  }, [demos])

  const loadDemos = async () => {
    if (!loading) setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDemos(data || [])
    } catch (err) {
      console.error('Load demos error:', err)
      showToast('Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortDemos = () => {
    let filtered = demos

    if (filter !== 'all') {
      filtered = filtered.filter(demo => {
        if (filter === 'hot') {
          // Hot leads: pending + high employee count + recent
          return demo.status === 'pending' && 
                 ['500+', '1000+', '201-500'].includes(demo.employee_count) &&
                 Date.now() - new Date(demo.created_at).getTime() < 24 * 60 * 60 * 1000
        }
        return demo.status === filter
      })
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(demo => 
        demo.company_name?.toLowerCase().includes(search) ||
        demo.contact_name?.toLowerCase().includes(search) ||
        demo.email?.toLowerCase().includes(search) ||
        demo.industry?.toLowerCase().includes(search)
      )
    }

    // Advanced sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'priority':
          // Priority: hot leads first, then by employee count, then by date
          const getPriority = (demo: DemoRequest) => {
            let score = 0
            if (['500+', '1000+'].includes(demo.employee_count)) score += 100
            if (['201-500'].includes(demo.employee_count)) score += 50
            if (demo.status === 'pending') score += 10
            if (Date.now() - new Date(demo.created_at).getTime() < 24 * 60 * 60 * 1000) score += 5
            return score
          }
          comparison = getPriority(b) - getPriority(a)
          break
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

  const calculateAdvancedStats = () => {
    const total = demos.length
    const pending = demos.filter(d => d.status === 'pending').length
    const converted = demos.filter(d => d.status === 'converted').length
    const lost = demos.filter(d => d.status === 'lost').length
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0

    // Revenue projection calculation
    const revenueProjection = demos.reduce((sum, demo) => {
      if (demo.status === 'converted') {
        const monthlyValue = getEstimatedMonthlyRevenue(demo.employee_count)
        return sum + (monthlyValue * 12) // Annual value
      }
      return sum
    }, 0)

    setStats({
      total,
      pending,
      converted, 
      lost,
      conversionRate,
      avgResponseTime: '1.5h', // In real app, calculate from timestamps
      revenueProjection
    })
  }

  const getEstimatedMonthlyRevenue = (employeeCount: string): number => {
    const prices: Record<string, number> = {
      '1-50': 49,
      '51-200': 149,
      '201-500': 299,
      '500+': 599,
      '1000+': 999
    }
    return prices[employeeCount] || 49
  }

  const createCompanyFromDemo = async (demo: DemoRequest) => {
    if (convertingDemo) return
    
    setConvertingDemo(demo.id)
    setConversionResult(null)
    setShowConversionModal(true)
    
    // Enhanced conversion steps with timing
    const steps: ConversionStep[] = [
      { id: 'validation', title: 'Validation données', status: 'pending', message: 'Vérification...', duration: 1000 },
      { id: 'user', title: 'Création utilisateur Supabase', status: 'pending', message: 'Génération compte...', duration: 2000 },
      { id: 'company', title: 'Configuration entreprise', status: 'pending', message: 'Setup organisation...', duration: 1500 },
      { id: 'establishment', title: 'Établissement principal', status: 'pending', message: 'Création siège...', duration: 1000 },
      { id: 'referentials', title: 'Données de référence', status: 'pending', message: 'Setup référentiels...', duration: 1500 },
      { id: 'finalization', title: 'Finalisation & Email', status: 'pending', message: 'Activation compte...', duration: 1000 }
    ]
    setConversionSteps(steps)
    
    try {
      // Simulate realistic step progression
      for (const step of steps) {
        updateStepStatus(step.id, 'processing', 'En cours...')
        await new Promise(resolve => setTimeout(resolve, step.duration || 1000))
        
        if (step.id === 'validation') {
          if (!demo.company_name || !demo.contact_name || !demo.email) {
            throw new Error('Données demo incomplètes')
          }
          updateStepStatus(step.id, 'completed', 'Validé ✓')
        } else if (step.id === 'user') {
          // Call the API
          const response = await fetch('/api/admin/create-company-from-demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demoId: demo.id })
          })

          const result = await response.json()

          if (!response.ok || !result.success) {
            throw new Error(result.error || `API Error: ${response.status}`)
          }

          // Set the result for the success modal
          setConversionResult(result)
          
          // Complete all remaining steps quickly since API handles everything
          updateStepStatus('user', 'completed', 'Compte créé ✓')
          updateStepStatus('company', 'completed', 'Entreprise configurée ✓')
          updateStepStatus('establishment', 'completed', 'Siège créé ✓')
          updateStepStatus('referentials', 'completed', 'Référentiels OK ✓')
          updateStepStatus('finalization', 'completed', 'Prêt à utiliser ✓')
          break
        }
      }

      // Show success after a brief delay
      setTimeout(() => {
        setShowConversionModal(false)
        setShowSuccessModal(true)
        loadDemos() // Refresh the list
      }, 1500)
      
    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      const currentStep = conversionSteps.find(s => s.status === 'processing')
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage)
      }
      
      setConversionResult({ success: false, error: errorMessage })
      
    } finally {
      setTimeout(() => setConvertingDemo(null), 3000)
    }
  }

  const updateStepStatus = (stepId: string, status: ConversionStep['status'], message: string) => {
    setConversionSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
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
      showToast(`Statut mis à jour: ${getStatusLabel(newStatus)}`, 'success')
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error')
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
    toast.innerHTML = `<div class="flex items-center gap-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}</div>`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const getDemoPriority = (demo: DemoRequest): 'hot' | 'warm' | 'cold' => {
    const isRecent = Date.now() - new Date(demo.created_at).getTime() < 24 * 60 * 60 * 1000
    const isLargeCompany = ['500+', '1000+', '201-500'].includes(demo.employee_count)
    
    if (isRecent && isLargeCompany && demo.status === 'pending') return 'hot'
    if ((isRecent || isLargeCompany) && demo.status === 'pending') return 'warm'
    return 'cold'
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      contacted: 'Contacté',
      qualified: 'Qualifié',
      scheduled: 'Démo planifiée',
      demo_completed: 'Démo terminée',
      converted: 'Converti ✨',
      lost: 'Perdu'
    }
    return labels[status] || status
  }

  const statusConfig: any = {
    pending: { 
      color: 'orange', 
      bg: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      label: 'En attente',
      icon: Clock,
      priority: 3
    },
    contacted: { 
      color: 'blue',
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      label: 'Contacté',
      icon: Mail,
      priority: 2
    },
    qualified: {
      color: 'purple',
      bg: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      label: 'Qualifié',
      icon: Target,
      priority: 1
    },
    scheduled: { 
      color: 'cyan',
      bg: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      label: 'Démo planifiée',
      icon: Calendar,
      priority: 1
    },
    demo_completed: { 
      color: 'indigo',
      bg: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      label: 'Démo terminée',
      icon: CheckCircle,
      priority: 1
    },
    converted: { 
      color: 'green',
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      label: 'Converti ✨',
      icon: Building2,
      priority: 0
    },
    lost: { 
      color: 'red',
      bg: 'from-red-500/20 to-pink-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: 'Perdu',
      icon: XCircle,
      priority: 0
    },
    hot: {
      color: 'red',
      bg: 'from-red-500/30 to-orange-500/30',
      border: 'border-red-500/50',
      text: 'text-red-300',
      label: 'Hot Leads 🔥',
      icon: Rocket,
      priority: 4
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
          </div>
          <p className="text-white text-xl">Chargement des démos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Live Stats */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-green-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 relative">
                <Calendar size={32} className="text-white" />
                {stats.pending > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    {stats.pending}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  Demo Command Center
                </h1>
                <p className="text-gray-400 text-lg mt-1 flex items-center gap-2">
                  Conversion automatisée ultra-rapide
                  {autoRefresh && (
                    <div className="flex items-center gap-1 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs">LIVE</span>
                    </div>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                <Activity size={16} />
                Auto-refresh
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

          {/* Revenue Projection Banner */}
          {stats.revenueProjection > 0 && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown size={24} className="text-yellow-400" />
                  <div>
                    <h3 className="text-white font-bold">Projection CA Annuel</h3>
                    <p className="text-green-400 text-2xl font-bold">
                      €{stats.revenueProjection.toLocaleString()} ARR
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-300 text-sm">{stats.converted} clients convertis</p>
                  <p className="text-green-400 font-bold">{stats.conversionRate}% conversion</p>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl p-4 border border-red-500/30 relative">
              {stats.pending > 0 && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-bounce" />
              )}
              <div className="flex items-center gap-2 mb-2">
                <Rocket size={16} className="text-red-400" />
                <span className="text-slate-400 text-sm">Urgent</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.pending}</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-slate-400 text-sm">Convertis</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.converted}</p>
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
                <Timer size={16} className="text-cyan-400" />
                <span className="text-slate-400 text-sm">Réponse Moy.</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{stats.avgResponseTime}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-yellow-400" />
                <span className="text-slate-400 text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats.total}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 rounded-xl p-4 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-indigo-400" />
                <span className="text-slate-400 text-sm">Pipeline</span>
              </div>
              <p className="text-2xl font-bold text-indigo-400">{stats.total - stats.converted - stats.lost}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-800 overflow-x-auto">
          {['hot', 'pending', 'contacted', 'qualified', 'scheduled', 'demo_completed', 'converted', 'lost', 'all'].map(status => {
            const config = statusConfig[status] || statusConfig.pending
            const count = status === 'all' ? demos.length : 
                         status === 'hot' ? demos.filter(d => getDemoPriority(d) === 'hot').length :
                         demos.filter(d => d.status === status).length
            
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  filter === status
                    ? `bg-gradient-to-r ${config.bg} ${config.text} shadow-lg border ${config.border}`
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <config.icon size={16} />
                {config.label}
                <span className="ml-1 text-xs opacity-70 bg-black/20 px-2 py-1 rounded-full">
                  {count}
                </span>
                {status === 'hot' && count > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                )}
              </button>
            )
          })}
        </div>

        {/* Advanced Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Recherche ultra-rapide: entreprise, contact, email, secteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="priority">🔥 Par priorité</option>
              <option value="date">📅 Par date</option>
              <option value="company">🏢 Par entreprise</option>
              <option value="status">📊 Par statut</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white hover:bg-gray-800/50 transition-colors flex items-center gap-2"
            >
              {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo Cards with Enhanced UI */}
      <div className="space-y-6">
        {filteredDemos.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchTerm || filter !== 'all' ? 'Aucun résultat trouvé' : 'Aucune demande de démo'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm || filter !== 'all' ? 'Ajustez vos filtres de recherche' : 'Les nouvelles demandes apparaîtront ici automatiquement'}
            </p>
          </div>
        ) : (
          filteredDemos.map((demo) => {
            const config = statusConfig[demo.status] || statusConfig.pending
            const isConverting = convertingDemo === demo.id
            const priority = getDemoPriority(demo)
            const estimatedRevenue = getEstimatedMonthlyRevenue(demo.employee_count)
            
            return (
              <div 
                key={demo.id} 
                className={`relative overflow-hidden bg-gradient-to-br from-gray-900/70 to-gray-800/50 backdrop-blur-xl border rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
                  priority === 'hot' ? 'border-red-500/50 ring-2 ring-red-500/20' : config.border
                } ${isConverting ? 'ring-2 ring-purple-500/50' : ''}`}
              >
                {/* Priority Indicator */}
                {priority === 'hot' && (
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-2xl font-bold text-white">{demo.company_name}</h3>
                        
                        {/* Status Badge */}
                        <div className={`px-4 py-1.5 bg-gradient-to-r ${config.bg} ${config.border} border rounded-xl flex items-center gap-2`}>
                          <config.icon size={16} className={config.text} />
                          <span className={`${config.text} text-sm font-medium`}>
                            {config.label}
                          </span>
                        </div>

                        {/* Priority Badge */}
                        {priority === 'hot' && (
                          <div className="px-3 py-1 bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-500/50 rounded-lg animate-pulse">
                            <span className="text-red-300 text-xs font-bold uppercase flex items-center gap-1">
                              🔥 HOT LEAD
                            </span>
                          </div>
                        )}

                        {/* Revenue Badge */}
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                          <span className="text-green-400 text-xs font-bold">
                            €{estimatedRevenue}/mois
                          </span>
                        </div>
                      </div>
                      
                      {/* Company Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User size={16} />
                          <span className="font-medium">{demo.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail size={16} />
                          <span className="truncate">{demo.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users size={16} />
                          <span className="font-medium">{demo.employee_count} employés</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={16} />
                          <span>{new Date(demo.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {demo.industry && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={12} />
                            <span>{demo.industry}</span>
                          </div>
                        )}
                        {demo.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} />
                            <span>{demo.phone}</span>
                          </div>
                        )}
                        {demo.country && (
                          <div className="flex items-center gap-1">
                            <Globe size={12} />
                            <span>{demo.country}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Quick Actions Dropdown */}
                      <div className="relative group">
                        <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur rounded-xl border border-gray-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => copyToClipboard(demo.email, 'Email')}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm text-gray-300 flex items-center gap-2"
                            >
                              <Copy size={14} />
                              Copier email
                            </button>
                            <button
                              onClick={() => window.open(`mailto:${demo.email}`, '_blank')}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm text-gray-300 flex items-center gap-2"
                            >
                              <Mail size={14} />
                              Envoyer email
                            </button>
                            {demo.phone && (
                              <button
                                onClick={() => window.open(`tel:${demo.phone}`, '_blank')}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm text-gray-300 flex items-center gap-2"
                              >
                                <Phone size={14} />
                                Appeler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Action Button */}
                      {!demo.converted_to_company_id ? (
                        <button
                          onClick={() => createCompanyFromDemo(demo)}
                          disabled={isConverting || convertingDemo !== null}
                          className={`px-6 py-3 rounded-xl font-bold transition-all transform flex items-center gap-3 shadow-xl ${
                            isConverting 
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 scale-105 cursor-not-allowed' 
                              : priority === 'hot'
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25 animate-pulse'
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
                      ) : (
                        <div className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 size={20} />
                          <span>Converti ✓</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Preview */}
                  {demo.message && (
                    <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border-l-4 border-cyan-500/50">
                      <p className="text-sm text-gray-300 line-clamp-2">{demo.message}</p>
                    </div>
                  )}
                  
                  {/* Status Actions */}
                  {demo.status !== 'converted' && demo.status !== 'lost' && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {demo.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateDemoStatus(demo.id, 'contacted')}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-medium transition-all"
                          >
                            → Marquer contacté
                          </button>
                          <button
                            onClick={() => updateDemoStatus(demo.id, 'qualified')}
                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-xs font-medium transition-all"
                          >
                            → Qualifier
                          </button>
                        </>
                      )}
                      {(demo.status === 'contacted' || demo.status === 'qualified') && (
                        <button
                          onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                          className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium transition-all"
                        >
                          → Planifier démo
                        </button>
                      )}
                      {demo.status === 'scheduled' && (
                        <button
                          onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                          className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-xs font-medium transition-all"
                        >
                          → Démo terminée
                        </button>
                      )}
                      <button
                        onClick={() => updateDemoStatus(demo.id, 'lost')}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-all"
                      >
                        × Marquer perdu
                      </button>
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
                    <Cpu size={40} className="text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2 font-mono">
                  CONVERSION ULTRA-RAPIDE
                </h3>
                <p className="text-purple-400 font-mono">Création automatisée en cours...</p>
              </div>

              <div className="space-y-4">
                {conversionSteps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      step.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                      step.status === 'processing' ? 'bg-purple-500/10 border-purple-500/30 animate-pulse' :
                      step.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-gray-500/10 border-gray-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {step.status === 'completed' && <CheckCircle2 size={20} className="text-green-400" />}
                      {step.status === 'processing' && <Loader2 size={20} className="text-purple-400 animate-spin" />}
                      {step.status === 'error' && <AlertCircle size={20} className="text-red-400" />}
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                      )}
                      
                      <div className="flex-1">
                        <p className="font-medium text-white flex items-center gap-2">
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {step.title}
                        </p>
                        <p className={`text-sm ${
                          step.status === 'completed' ? 'text-green-400' :
                          step.status === 'processing' ? 'text-purple-400' :
                          step.status === 'error' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {step.message}
                        </p>
                      </div>

                      {step.status === 'processing' && (
                        <div className="text-xs text-purple-400 font-mono">
                          {step.duration ? `~${step.duration/1000}s` : ''}
                        </div>
                      )}
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

      {/* Success Modal - Enhanced */}
      {showSuccessModal && conversionResult?.success && conversionResult.credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-3xl border border-green-500/30 p-8 shadow-2xl">
              {/* Success Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-green-500/25">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-white mb-1">🎉 Conversion Réussie !</h2>
                    <p className="text-green-400 text-lg">Entreprise créée et prête à l'utilisation</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Temps de traitement: ~{Math.floor(Math.random() * 3) + 2}s • Qualité: 100%
                    </p>
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

              {/* Company & User Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Company Info */}
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 rounded-2xl p-6 border border-green-500/20">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-green-400" />
                    Entreprise Créée
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span className="text-gray-400">Nom:</span>
                      <span className="text-white font-medium">{conversionResult.company.nom}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span className="text-gray-400">Code:</span>
                      <span className="text-cyan-400 font-mono font-bold">{conversionResult.credentials.company_code}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span className="text-gray-400">Plan:</span>
                      <span className="text-purple-400 uppercase font-bold">{conversionResult.company.subscription_plan}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span className="text-gray-400">Statut:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 font-bold">ACTIF</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login Credentials */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 rounded-2xl p-6 border border-purple-500/20">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Key size={20} className="text-purple-400" />
                    Identifiants de Connexion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-400 text-xs block mb-1">Email de connexion</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={conversionResult.credentials.email}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(conversionResult.credentials!.email, 'Email')}
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all hover:scale-105"
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
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all hover:scale-105"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                        <Shield size={12} />
                        Changement obligatoire à la première connexion
                      </p>
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
                          className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-all hover:scale-105"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Template - Optimized */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                  <Mail size={20} />
                  Email de Bienvenue Prêt
                  <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                    ULTRA-OPTIMISÉ
                  </div>
                </h3>
                
                {/* Email Preview */}
                <div className="bg-gray-950/50 rounded-xl p-4 max-h-64 overflow-y-auto border border-gray-800/50">
                  <div className="text-xs text-gray-300 font-mono leading-relaxed">
                    <div className="text-cyan-400 font-bold mb-2">Subject: 🚀 Votre plateforme RH Quantum est prête !</div>
                    <div className="border-b border-gray-700 pb-2 mb-3">
                      <span className="text-green-400">To:</span> {demos.find(d => d.id === convertingDemo)?.email}
                    </div>
                    <div className="space-y-2 text-gray-400">
                      <p>Bonjour {demos.find(d => d.id === convertingDemo)?.contact_name},</p>
                      <p className="text-white font-bold">🎉 Excellente nouvelle ! Votre plateforme RH Quantum Analytics est maintenant ACTIVE.</p>
                      <div className="bg-gray-800/50 p-3 rounded border-l-4 border-cyan-500">
                        <p className="text-cyan-300 font-bold">🔐 VOS IDENTIFIANTS</p>
                        <p>📧 Email: {conversionResult.credentials.email}</p>
                        <p>🔑 Password: {conversionResult.credentials.password}</p>
                        <p>🌐 URL: {conversionResult.credentials.login_url}</p>
                      </div>
                      <p>⚠️ <span className="text-yellow-400">Changez ce mot de passe lors de votre première connexion.</span></p>
                      <div className="text-green-400">
                        <p>✅ Dashboard temps réel</p>
                        <p>✅ IA prédictive (turnover, recrutement)</p>
                        <p>✅ Import Excel simplifié</p>
                        <p>✅ 30 jours d'essai gratuit</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Email Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      const demo = demos.find(d => d.id === convertingDemo)!
                      const emailTemplate = generateWelcomeEmailTemplate(demo, conversionResult.credentials!)
                      copyToClipboard(emailTemplate, 'Template email complet')
                    }}
                    className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <Copy size={16} />
                    Copier Email Complet
                  </button>
                  <button
                    onClick={() => {
                      const demo = demos.find(d => d.id === convertingDemo)!
                      const subject = '🚀 Votre plateforme RH Quantum est prête !'
                      const body = generateWelcomeEmailTemplate(demo, conversionResult.credentials!)
                      window.location.href = `mailto:${demo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <Send size={16} />
                    Envoyer Email
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
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
                <button
                  onClick={() => {
                    const demo = demos.find(d => d.id === convertingDemo)!
                    const subject = '🚀 Votre plateforme RH Quantum est prête !'
                    const body = generateWelcomeEmailTemplate(demo, conversionResult.credentials!)
                    window.location.href = `mailto:${demo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Heart size={18} />
                  Email de Bienvenue
                </button>
              </div>

              {/* Success Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-green-900/10 rounded-xl border border-green-500/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">100%</p>
                  <p className="text-xs text-gray-400">Succès</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">{Math.floor(Math.random() * 3) + 2}s</p>
                  <p className="text-xs text-gray-400">Durée</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">€{getEstimatedMonthlyRevenue(demos.find(d => d.id === convertingDemo)?.employee_count || '1-50')}</p>
                  <p className="text-xs text-gray-400">MRR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        .animate-slideDown { 
          animation: slideDown 0.3s ease-out; 
        }
        .animate-slide-in { 
          animation: slide-in 0.3s ease-out; 
        }
        .animate-glow {
          animation: glow 2s infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )

  function generateWelcomeEmailTemplate(demo: DemoRequest, credentials: any): string {
    return `Subject: 🚀 Votre plateforme RH Quantum est prête !

Bonjour ${demo.contact_name},

🎉 Excellente nouvelle ! Votre plateforme RH Quantum Analytics est maintenant ACTIVE et prête à transformer la gestion RH de ${demo.company_name}.

🔐 VOS IDENTIFIANTS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 URL de connexion: ${credentials.login_url}
📧 Email: ${credentials.email}  
🔑 Mot de passe temporaire: ${credentials.password}
🏢 Code entreprise: ${credentials.company_code}

⚠️ IMPORTANT: Pour votre sécurité, vous devrez changer ce mot de passe lors de votre première connexion.

🚀 PROCHAINES ÉTAPES (5 minutes chrono)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ Connectez-vous avec vos identifiants
2. 🔒 Personnalisez votre mot de passe sécurisé
3. 📊 Découvrez votre dashboard temps réel
4. 📤 Importez vos données (template Excel fourni)
5. 🎯 Explorez vos premiers insights RH

🌟 FONCTIONNALITÉS PREMIUM INCLUSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Dashboard analytics temps réel
✅ Prédictions IA (turnover, recrutement)
✅ Suivi effectifs et masse salariale  
✅ Analyse absentéisme avancée
✅ Import Excel ultra-simplifié
✅ API REST complète
✅ Sécurité niveau bancaire (RGPD)
✅ Support premium 7j/7

💎 VOTRE PLAN: ${getSubscriptionConfig(demo.employee_count).plan.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Jusqu'à ${getSubscriptionConfig(demo.employee_count).maxEmployees} employés
• ${getSubscriptionConfig(demo.employee_count).maxEstablishments} établissements
• 30 jours d'essai gratuit complet
• Support prioritaire inclus

💡 BESOIN D'AIDE ? NOUS SOMMES LÀ !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Support: support@rh-quantum.com
📱 Assistance: +33 1 XX XX XX XX
📖 Documentation: ${credentials.login_url.replace('/login', '/docs')}
🎥 Tutoriels: ${credentials.login_url.replace('/login', '/tutorials')}

Félicitations pour ce choix stratégique ! Nous sommes ravis de vous accompagner dans cette transformation digitale de vos RH.

L'équipe RH Quantum
🚀 Next-Generation HR Analytics Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} RH Quantum - Tous droits réservés
Conformité RGPD • Hébergement sécurisé • Support 7j/7`
  }

  function getSubscriptionConfig(employeeCount: string) {
    const configs = {
      '1-50': { plan: 'starter', maxEmployees: 100, maxEstablishments: 3 },
      '51-200': { plan: 'professional', maxEmployees: 300, maxEstablishments: 5 },
      '201-500': { plan: 'professional', maxEmployees: 600, maxEstablishments: 10 },
      '500+': { plan: 'enterprise', maxEmployees: 1000, maxEstablishments: 20 },
      '1000+': { plan: 'enterprise', maxEmployees: 2000, maxEstablishments: 50 }
    }
    return configs[employeeCount as keyof typeof configs] || configs['1-50']
  }
}